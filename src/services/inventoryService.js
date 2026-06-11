import { supabase } from "../lib/supabase";

/**
 * Raw materials inventory: groups → items → daily stock records.
 * One nested select returns the whole tree, then it is normalized into the
 * shape the UI renders (date columns per group, qty map per item).
 */

export async function listInventory() {
  const { data, error } = await supabase
    .from("material_groups")
    .select(
      `id, name, position,
       record_dates ( record_date ),
       items ( id, name, unit, reorder_level, position,
         stock_records ( record_date, qty ) )`
    )
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []).map((g) => {
    const recordDates = (g.record_dates || [])
      .map((d) => d.record_date)
      .sort();

    const items = (g.items || [])
      .slice()
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
      .map((it) => {
        const records = {};
        for (const r of it.stock_records || []) {
          records[r.record_date] = Number(r.qty);
        }
        const latestDate = recordDates.findLast((d) => d in records);
        const latestQty = latestDate !== undefined ? records[latestDate] : null;
        return {
          id: it.id,
          name: it.name,
          unit: it.unit,
          reorder: Number(it.reorder_level),
          records,
          latestQty,
          isLow:
            latestQty !== null && latestQty < Number(it.reorder_level),
        };
      });

    return { id: g.id, name: g.name, recordDates, items };
  });
}

export async function createGroup({ name }) {
  const { data, error } = await supabase
    .from("material_groups")
    .insert({ name: name.trim() })
    .select("id, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A group with that name already exists");
    }
    throw error;
  }
  return data;
}

export async function deleteGroup(groupId) {
  const { error } = await supabase
    .from("material_groups")
    .delete()
    .eq("id", groupId);

  if (error) throw error;
}

export async function createItem({ groupId, name, unit, reorder }) {
  const { data, error } = await supabase
    .from("items")
    .insert({
      group_id: groupId,
      name: name.trim(),
      unit: unit.trim(),
      reorder_level: reorder,
    })
    .select("id, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That item already exists in this group");
    }
    throw error;
  }
  return data;
}

export async function updateItem(itemId, { name, unit, reorder }) {
  const { error } = await supabase
    .from("items")
    .update({
      name: name.trim(),
      unit: unit.trim(),
      reorder_level: reorder,
    })
    .eq("id", itemId);

  if (error) throw error;
}

export async function deleteItem(itemId) {
  const { error } = await supabase.from("items").delete().eq("id", itemId);

  if (error) throw error;
}
