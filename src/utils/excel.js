import * as XLSX from "xlsx";
import { formatDisplayDate, parseDisplayDate } from "./format";

/**
 * Legacy sheet format (kept byte-compatible with the old localStorage app so
 * an export from it imports straight into Supabase):
 *
 *   Group Name
 *   Item | Unit | Reorder | 01 Jan 2026 | 02 Jan 2026 | ...
 *   Rice | Kg   | 50      | 100         | -           | ...
 *   (two blank rows between groups; "-" means no record for that date)
 */

/** Header date cells may be display strings or native Excel serial dates. */
function parseHeaderDate(cell) {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "number") {
    const d = XLSX.SSF.parse_date_code(cell);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  return parseDisplayDate(String(cell).trim());
}

/** Export the normalized inventory tree to an .xlsx download. */
export function exportRawMaterials(groups) {
  const aoa = [];

  for (const group of groups) {
    aoa.push([group.name]);
    aoa.push(["Item", "Unit", "Reorder", ...group.recordDates.map(formatDisplayDate)]);

    for (const item of group.items) {
      aoa.push([
        item.name,
        item.unit,
        item.reorder,
        ...group.recordDates.map((d) =>
          d in item.records ? item.records[d] : "-"
        ),
      ]);
    }

    aoa.push([]);
    aoa.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Raw Materials");
  XLSX.writeFile(wb, "Raw_Materials.xlsx");
}

/**
 * Parse an uploaded .xlsx/.xls in the legacy format into the shape the
 * import_workbook RPC expects:
 * [{ name, recordDates: [iso], items: [{ name, unit, reorder, records: [{ date, qty }] }] }]
 */
export function parseRawMaterialsFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error("Could not read file"));

    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, {
          type: "array",
        });

        const ws = wb.Sheets[wb.SheetNames[0]];

        const rows = XLSX.utils.sheet_to_json(ws, {
          header: 1,
        });

        const groups = [];

        let current = null;

        let itemIndex = -1;
        let unitIndex = -1;
        let reorderIndex = -1;

        let dateColumns = [];

        for (const row of rows) {
          const cells = (row || []).map((c) =>
            typeof c === "string"
              ? c.trim()
              : c
          );

          const filled = cells.filter(
            (c) =>
              c !== null &&
              c !== undefined &&
              c !== ""
          );

          if (!filled.length) continue;

          // ---------- HEADER ROW ----------
          const lower = cells.map((c) =>
            String(c || "").toLowerCase()
          );

          const hasItem =
            lower.includes("item") ||
            lower.includes("items");

          if (hasItem) {
            itemIndex = lower.findIndex(
              (c) =>
                c === "item" ||
                c === "items"
            );

            unitIndex = lower.findIndex(
              (c) => c === "unit"
            );

            reorderIndex = lower.findIndex(
              (c) =>
                c === "reorder" ||
                c === "reorder level"
            );

            dateColumns = [];

            cells.forEach((cell, idx) => {
              const d = parseHeaderDate(cell);

              if (d) {
                dateColumns.push({
                  index: idx,
                  date: d,
                });
              }
            });

            if (current) {
              dateColumns.forEach(({ date }) => {
                if (
                  !current.recordDates.includes(
                    date
                  )
                ) {
                  current.recordDates.push(
                    date
                  );
                }
              });
            }

            continue;
          }

          // ---------- GROUP ROW ----------
          if (
            filled.length === 1 &&
            cells[0]
          ) {
            current = {
              name: String(cells[0]),
              recordDates: [],
              items: [],
            };

            groups.push(current);

            continue;
          }

          if (!current) continue;

          // ---------- ITEM ROW ----------
          const records = [];

          dateColumns.forEach(
            ({ index, date }) => {
              const value = cells[index];

              if (
                value === "-" ||
                value === "" ||
                value === null ||
                value === undefined
              ) {
                return;
              }

              const qty =
                Number(value);

              if (
                !Number.isNaN(qty)
              ) {
                records.push({
                  date,
                  qty,
                });
              }
            }
          );

          current.items.push({
            name: String(
              cells[itemIndex] ?? ""
            ),

            unit: String(
              cells[unitIndex] ?? "Kg"
            ),

            reorder:
              Number(
                cells[reorderIndex] ?? 0
              ) || 0,

            records,
          });
        }

        resolve(
          groups.filter(
            (g) =>
              g.name &&
              g.items.length
          )
        );
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
