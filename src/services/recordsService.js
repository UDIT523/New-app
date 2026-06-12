import { supabase } from "../lib/supabase";

/** Daily stock recording: date columns + bulk quantity upserts. */

export async function addRecordDate({
  groupId,
  date,
}) {
  const { error } = await supabase
    .from("record_dates")
    .upsert(
      {
        group_id: groupId,
        record_date: date,
      },
      {
        onConflict:
          "group_id,record_date",
        ignoreDuplicates: true,
      }
    );

  if (error) throw error;

  // Get all dates for this group
  const {
    data: dates,
    error: fetchError,
  } = await supabase
    .from("record_dates")
    .select("record_date")
    .eq("group_id", groupId)
    .order("record_date", {
      ascending: true,
    });

  if (fetchError) throw fetchError;

  // Keep only latest 6 dates
  if (dates.length > 6) {
    const oldestDate =
      dates[0].record_date;

    // Get all item ids in this group
    const {
      data: items,
      error: itemsError,
    } = await supabase
      .from("items")
      .select("id")
      .eq("group_id", groupId);

    if (itemsError)
      throw itemsError;

    const itemIds =
      items?.map((i) => i.id) || [];

    // Delete stock records for oldest date
    if (itemIds.length) {
      const {
        error: recordsError,
      } = await supabase
        .from("stock_records")
        .delete()
        .in("item_id", itemIds)
        .eq(
          "record_date",
          oldestDate
        );

      if (recordsError)
        throw recordsError;
    }

    // Delete oldest date column
    const {
      error: deleteDateError,
    } = await supabase
      .from("record_dates")
      .delete()
      .eq("group_id", groupId)
      .eq(
        "record_date",
        oldestDate
      );

    if (deleteDateError)
      throw deleteDateError;
  }
}

/**
 * Save a whole column of quantities in one round trip.
 * rows: [{ item_id, record_date, qty, recorded_by }]
 */
export async function saveRecords(
  rows
) {
  if (!rows.length) return;

  const { error } =
    await supabase
      .from("stock_records")
      .upsert(rows, {
        onConflict:
          "item_id,record_date",
      });

  if (error) throw error;
}

/**
 * Atomic whole-workbook import via the import_workbook RPC.
 * groups: [{ name, recordDates: [iso], items: [{ name, unit, reorder, records: [{ date, qty }] }] }]
 */
export async function importWorkbook(
  groups
) {
  const { data, error } =
    await supabase.rpc(
      "import_workbook",
      {
        p_groups: groups,
      }
    );

  if (error) throw error;

  return data;
}