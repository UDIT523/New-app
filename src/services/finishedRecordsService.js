import { supabase } from "../lib/supabase";

/** Finished goods daily stock recording */

export async function addFinishedRecordDate({
  groupId,
  date,
}) {
  const { error } = await supabase
    .from("finished_record_dates")
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

  const {
    data: dates,
    error: fetchError,
  } = await supabase
    .from("finished_record_dates")
    .select("record_date")
    .eq("group_id", groupId)
    .order("record_date", {
      ascending: true,
    });

  if (fetchError) throw fetchError;

  if (dates.length > 6) {
    const oldestDate =
      dates[0].record_date;

    const {
      data: items,
      error: itemsError,
    } = await supabase
      .from("finished_items")
      .select("id")
      .eq("group_id", groupId);

    if (itemsError)
      throw itemsError;

    const itemIds =
      items?.map((i) => i.id) || [];

    if (itemIds.length) {
      const {
        error: recordsError,
      } = await supabase
        .from(
          "finished_stock_records"
        )
        .delete()
        .in("item_id", itemIds)
        .eq(
          "record_date",
          oldestDate
        );

      if (recordsError)
        throw recordsError;
    }

    const {
      error: deleteDateError,
    } = await supabase
      .from(
        "finished_record_dates"
      )
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

export async function saveFinishedRecords(
  rows
) {
  if (!rows.length) return;

  const { error } =
    await supabase
      .from(
        "finished_stock_records"
      )
      .upsert(rows, {
        onConflict:
          "item_id,record_date",
      });

  if (error) throw error;
}

/**
 * We'll create a separate Finished Goods import later.
 */
export async function importFinishedWorkbook(
  groups
) {
  const { data, error } =
    await supabase.rpc(
      "import_finished_workbook",
      {
        p_groups: groups,
      }
    );

  if (error) throw error;

  return data;
}