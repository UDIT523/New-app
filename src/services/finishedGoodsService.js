import { supabase } from "../lib/supabase";

/**
 * Finished Goods inventory
 */

export async function listFinishedGoods() {
  const { data, error } = await supabase
    .from("finished_groups")
    .select(`
      id,
      name,
      position,
      finished_record_dates (
        record_date
      ),
      finished_items (
        id,
        name,
        unit,
        position,
        finished_stock_records (
          record_date,
          qty
        )
      )
    `)
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  console.log("FINISHED GROUPS DATA:", data);

  if (error) {
    console.error(
      "FINISHED GROUPS ERROR:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }

  return (data || []).map((g) => {
    const recordDates = (g.finished_record_dates || [])
      .map((d) => d.record_date)
      .sort();

    const items = (g.finished_items || [])
      .slice()
      .sort(
        (a, b) =>
          (a.position || 0) -
            (b.position || 0) ||
          a.name.localeCompare(b.name)
      )
      .map((it) => {
        const records = {};

        for (const r of it.finished_stock_records || []) {
          records[r.record_date] = Number(r.qty);
        }

        const latestDate = recordDates.findLast(
          (d) => d in records
        );

        const latestQty =
          latestDate !== undefined
            ? records[latestDate]
            : null;

        return {
          id: it.id,
          name: it.name,
          unit: it.unit,
          reorder: 0,
          records,
          latestQty,
          isLow: false,
        };
      });

    return {
      id: g.id,
      name: g.name,
      recordDates,
      items,
    };
  });
}

export async function createFinishedGroup({ name }) {
  const { data, error } = await supabase
    .from("finished_groups")
    .insert({
      name: name.trim(),
    })
    .select("id,name")
    .single();

  if (error) throw error;

  return data;
}

export async function deleteFinishedGroup(groupId) {
  const { error } = await supabase
    .from("finished_groups")
    .delete()
    .eq("id", groupId);

  if (error) throw error;
}

export async function createFinishedItem({
  groupId,
  name,
  unit,
}) {
  const { data, error } = await supabase
    .from("finished_items")
    .insert({
      group_id: groupId,
      name: name.trim(),
      unit: unit.trim(),
    })
    .select("id,name")
    .single();

  if (error) throw error;

  return data;
}

export async function updateFinishedItem(
  itemId,
  { name, unit }
) {
  const { error } = await supabase
    .from("finished_items")
    .update({
      name: name.trim(),
      unit: unit.trim(),
    })
    .eq("id", itemId);

  if (error) throw error;
}

export async function deleteFinishedItem(itemId) {
  const { error } = await supabase
    .from("finished_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}