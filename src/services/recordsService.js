import { supabase } from "../lib/supabase";

/** Daily stock recording: date columns + bulk quantity upserts. */

export async function addRecordDate({ groupId, date }) {
  const { error } = await supabase
    .from("record_dates")
    .upsert(
      { group_id: groupId, record_date: date },
      { onConflict: "group_id,record_date", ignoreDuplicates: true }
    );

  if (error) throw error;
}

/**
 * Save a whole column of quantities in one round trip.
 * rows: [{ item_id, record_date, qty, recorded_by }]
 */
export async function saveRecords(rows) {
  if (!rows.length) return;

  const { error } = await supabase
    .from("stock_records")
    .upsert(rows, { onConflict: "item_id,record_date" });

  if (error) throw error;
}

/**
 * Atomic whole-workbook import via the import_workbook RPC.
 * groups: [{ name, recordDates: [iso], items: [{ name, unit, reorder, records: [{ date, qty }] }] }]
 */
export async function importWorkbook(groups) {
  const { data, error } = await supabase.rpc("import_workbook", {
    p_groups: groups,
  });

  if (error) throw error;
  return data;
}
