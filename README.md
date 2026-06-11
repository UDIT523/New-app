# RawStock · Raw Materials

Daily raw-material stock recording, built on the SparePro architecture:
React 19 + Vite, Tailwind CSS v4 (single stylesheet design system), TanStack
Query + Supabase Realtime, custom users-table auth (no Supabase Auth), Framer
Motion, lazy-loaded routes, PWA, Vercel-ready.

Groups organize items (name, unit, reorder level); stock quantities are
recorded per item per date and shown as date columns. Items whose latest
quantity drops **below** the reorder level are flagged in red everywhere.

## Setup

1. **Create a Supabase project** → copy the Project URL and anon key from
   Project Settings → API.
2. **Run the migration**: open the Supabase SQL editor and run
   `supabase/migrations/0001_init.sql` (idempotent — safe to re-run).
3. **Create the first admin** (SQL editor):

   ```sql
   insert into public.users (username, full_name, password, role, status)
   values ('admin', 'Administrator', 'admin123', 'admin', 'approved');
   ```

4. **Configure env**: copy `.env.example` to `.env` and fill in
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. **Run**:

   ```bash
   npm install
   npm run dev      # http://localhost:3000
   ```

New users register from the app and wait in `pending` status until an admin
approves them on the Users page.

> **Security note:** RLS is open to the anon key and passwords are stored as
> plain text (same trade-off as SparePro). Trusted/internal deployments only.

## Migrating data from the old localStorage app

The Excel format is unchanged. In the old app click **Export**, then in this
app click **Import** and pick the downloaded `Raw_Materials.xlsx`. The import
runs as one atomic upsert (`import_workbook` RPC) — re-importing the same file
never duplicates groups, items, or records.

## Recording stock

- **Record** on a group adds today's date column and turns it into inputs.
- Type quantities; **Enter / ↓ / ↑** move between rows, **Esc** cancels.
- **Save** writes all changed quantities in a single bulk upsert.
- Only the latest (today's) column is editable — history is immutable from the
  grid.
- Changes sync to other open tabs/devices in realtime.

## Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server on port 3000          |
| `npm run build`   | Production build to `dist/`      |
| `npm run preview` | Preview the production build     |
| `npm run lint`    | ESLint                           |

## Deploy (Vercel)

`vercel.json` already rewrites all routes to `index.html` (SPA) and disables
caching for `sw.js`. Import the repo in Vercel, set the two `VITE_SUPABASE_*`
environment variables, and deploy.

## Project structure

```
src/
├── lib/supabase.js          Supabase client (placeholder-safe)
├── context/AuthContext.jsx  localStorage session, role gating, dev bypass
├── services/                Raw Supabase calls (inventory, records, users)
├── hooks/                   TanStack Query + realtime invalidation
├── components/
│   ├── ui/                  Design-system primitives (Button, Modal, Table…)
│   ├── layout/              AppShell, Sidebar, Topbar, PageHeader
│   └── inventory/           GroupSection, RecordGrid, modals, import/export
├── pages/                   Dashboard, Inventory, Users, Login, Register
└── utils/                   format, validation (zod), excel (xlsx), cn
supabase/migrations/         0001_init.sql — full schema + RLS + realtime
```
