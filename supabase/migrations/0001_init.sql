-- ============================================================================
--  RawStock — 0001: full schema (raw material groups, items, daily records).
--  Idempotent: safe to re-run in the Supabase SQL editor.
--
--  WARNING: This OPENS Row-Level Security to the public `anon` key on every
--  table (read + write), because the app has no authenticated sessions.
--  Passwords in public.users are stored as plain text and are readable by
--  anyone with the anon key. Use only for a trusted/internal deployment.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- Users (no Supabase Auth) ----------------------------------------
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  username   text not null unique,
  full_name  text not null default '',
  password   text not null,
  role       text not null default 'technician'
               check (role in ('admin', 'manager', 'technician')),
  status     text not null default 'pending'
               check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

-- ---------- Material groups --------------------------------------------------
create table if not exists public.material_groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Items within a group ---------------------------------------------
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.material_groups (id) on delete cascade,
  name          text not null,
  unit          text not null default 'Kg',
  reorder_level numeric not null default 0 check (reorder_level >= 0),
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (group_id, name)
);

-- ---------- Date columns per group -------------------------------------------
-- A date column exists for a group even before any quantity is entered, so a
-- freshly started recording day survives a reload with "-" cells.
create table if not exists public.record_dates (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.material_groups (id) on delete cascade,
  record_date date not null,
  created_at  timestamptz not null default now(),
  unique (group_id, record_date)
);

-- ---------- Daily stock records -----------------------------------------------
create table if not exists public.stock_records (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items (id) on delete cascade,
  record_date date not null,
  qty         numeric not null check (qty >= 0),
  recorded_by text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (item_id, record_date)
);

-- ---------- Indexes -----------------------------------------------------------
create index if not exists idx_items_group        on public.items (group_id);
create index if not exists idx_record_dates_group on public.record_dates (group_id, record_date desc);
create index if not exists idx_stock_records_item on public.stock_records (item_id, record_date desc);
create index if not exists idx_stock_records_date on public.stock_records (record_date desc);

-- ---------- updated_at maintenance --------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_stock_records_updated_at on public.stock_records;
create trigger trg_stock_records_updated_at
  before update on public.stock_records
  for each row execute function public.set_updated_at();

-- ---------- Atomic Excel workbook import ---------------------------------------
-- p_groups: [{ "name": "...", "recordDates": ["2026-01-01", ...],
--              "items": [{ "name": "...", "unit": "...", "reorder": 0,
--                          "records": [{ "date": "2026-01-01", "qty": 12.5 }] }] }]
create or replace function public.import_workbook(p_groups jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g          jsonb;
  it         jsonb;
  rec        jsonb;
  d          text;
  v_group_id uuid;
  v_item_id  uuid;
  v_count    integer := 0;
  v_pos      integer := 0;
begin
  for g in select * from jsonb_array_elements(coalesce(p_groups, '[]'::jsonb))
  loop
    insert into public.material_groups (name, position)
    values (g->>'name', v_pos)
    on conflict (name) do nothing;

    select id into v_group_id
    from public.material_groups
    where name = g->>'name';

    for d in select * from jsonb_array_elements_text(coalesce(g->'recordDates', '[]'::jsonb))
    loop
      insert into public.record_dates (group_id, record_date)
      values (v_group_id, d::date)
      on conflict (group_id, record_date) do nothing;
    end loop;

    for it in select * from jsonb_array_elements(coalesce(g->'items', '[]'::jsonb))
    loop
      insert into public.items (group_id, name, unit, reorder_level)
      values (
        v_group_id,
        it->>'name',
        coalesce(nullif(it->>'unit', ''), 'Kg'),
        coalesce((it->>'reorder')::numeric, 0)
      )
      on conflict (group_id, name) do update
        set unit          = excluded.unit,
            reorder_level = excluded.reorder_level;

      select id into v_item_id
      from public.items
      where group_id = v_group_id and name = it->>'name';

      for rec in select * from jsonb_array_elements(coalesce(it->'records', '[]'::jsonb))
      loop
        insert into public.stock_records (item_id, record_date, qty, recorded_by)
        values (
          v_item_id,
          (rec->>'date')::date,
          (rec->>'qty')::numeric,
          'excel import'
        )
        on conflict (item_id, record_date) do update
          set qty = excluded.qty;
      end loop;
    end loop;

    v_count := v_count + 1;
    v_pos := v_pos + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.import_workbook(jsonb) to anon, authenticated;

-- ---------- Open RLS on every table to the anon key ----------------------------
-- 1) Drop all existing policies on our tables.
do $$
declare r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'users', 'material_groups', 'items', 'record_dates', 'stock_records'
      )
  loop
    execute format('drop policy if exists %I on public.%I;', r.policyname, r.tablename);
  end loop;
end $$;

-- 2) One permissive policy per table for anon + authenticated.
do $$
declare t text;
begin
  foreach t in array array[
    'users', 'material_groups', 'items', 'record_dates', 'stock_records'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated '
      || 'using (true) with check (true);',
      t || '_public', t
    );
  end loop;
end $$;

-- ---------- Realtime publication -----------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'material_groups', 'items', 'record_dates', 'stock_records'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;

-- ============================================================================
--  Done. Create your first user from the app's "Create account" screen and
--  approve it via SQL, or insert an admin directly:
--    insert into public.users (username, full_name, password, role, status)
--    values ('admin', 'Administrator', 'admin123', 'admin', 'approved');
-- ============================================================================
