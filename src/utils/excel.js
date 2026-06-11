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
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const groups = [];
        let current = null;
        let dates = [];

        for (const row of rows) {
          const cells = (row || []).map((c) =>
            typeof c === "string" ? c.trim() : c
          );
          const filled = cells.filter(
            (c) => c !== null && c !== undefined && c !== ""
          );

          if (filled.length === 0) continue;

          if (String(cells[0]) === "Item") {
            // Header row — date columns start at index 3.
            dates = cells.slice(3).map(parseHeaderDate);
            if (current) {
              for (const d of dates) {
                if (d && !current.recordDates.includes(d)) {
                  current.recordDates.push(d);
                }
              }
            }
            continue;
          }

          if (filled.length === 1 && cells[0]) {
            // Single-cell row — a new group.
            current = { name: String(cells[0]), recordDates: [], items: [] };
            dates = [];
            groups.push(current);
            continue;
          }

          if (!current) continue;

          // Item row: name | unit | reorder | qty per date.
          const records = [];
          dates.forEach((d, i) => {
            const v = cells[3 + i];
            if (!d || v === "-" || v === "" || v === null || v === undefined)
              return;
            const qty = Number(v);
            if (!Number.isNaN(qty)) records.push({ date: d, qty });
          });

          current.items.push({
            name: String(cells[0] ?? ""),
            unit: String(cells[1] ?? "Kg"),
            reorder: Number(cells[2] ?? 0) || 0,
            records,
          });
        }

        resolve(groups.filter((g) => g.name));
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
