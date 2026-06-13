import { useRef } from "react";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Table, THead, TH, TBody, TR, TD } from "../ui/Table";
import Badge from "../ui/Badge";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import {
  formatDisplayDate,
  formatNumber,
  isLowStock,
} from "../../utils/format";

export default function RecordGrid({
  group,
  dates,
  recording,
  today,
  drafts,
  onDraft,
  onCancel,
  onEditItem,
  onDeleteItem,
}) {
  const inputRefs = useRef([]);
  const { can } = useAuth();

  const focusRow = (index) => {
    const el = inputRefs.current[index];

    if (el) {
      el.focus();
      el.select();
    }
  };

  const onKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      focusRow(index + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusRow(index - 1);
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const lastDate = dates[dates.length - 1];

  const stickyCell = "sticky left-0 z-10 border-r border-ink-100";

  // Newest-first for the mobile cards so the latest reading reads first.
  const mobileDates = [...dates].reverse();

  return (
    <>
      {/* Mobile: one card per item. The day chips sit on a single horizontal
          row (no wrapping) so every reading stays readable. */}
      <div className="space-y-2.5 sm:hidden">
        {group.items.map((item) => {
          const todayHas = today in item.records;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-ink-100 bg-white p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">
                    {item.name}{" "}
                    <span className="text-ink-400">({item.reorder})</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">{item.unit}</p>
                </div>

                {can("inventory:manage") && (
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      onClick={() => onEditItem(item)}
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item)}
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-danger-soft hover:text-danger"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {recording && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-ink-500">
                    Today's stock · {formatDisplayDate(today)}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={drafts[item.id] ?? ""}
                    onChange={(e) => onDraft(item.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") onCancel();
                    }}
                    placeholder={todayHas ? String(item.records[today]) : "0"}
                    className={cn(
                      "h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900",
                      "transition-all duration-150 ease-[var(--ease-out-soft)]",
                      "focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10"
                    )}
                  />
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {mobileDates.map((d) => {
                  const has = d in item.records;
                  const qty = item.records[d];
                  const low = has && isLowStock(qty, item.reorder);

                  return (
                    <div
                      key={d}
                      className={cn(
                        "min-w-[64px] whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-center",
                        low
                          ? "border-danger/30 bg-danger-soft/50"
                          : "border-ink-100 bg-ink-25"
                      )}
                    >
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-ink-400">
                        {formatDisplayDate(d)}
                        {d === lastDate && " · Latest"}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
                          low ? "text-danger" : "text-ink-900"
                        )}
                      >
                        {has ? (
                          <>
                            {low && <AlertTriangle className="h-3.5 w-3.5" />}
                            {formatNumber(qty)}
                          </>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: full record matrix. */}
      <div className="hidden sm:block">
        <Table minWidth={400 + dates.length * 110}>
          <THead>
            <TH className={cn(stickyCell, "bg-ink-25")}>Item</TH>

            <TH>Unit</TH>

            {dates.map((d) => (
              <TH key={d} className="text-right">
                <span className="inline-flex items-center gap-1.5">
                  {formatDisplayDate(d)}

                  {d === lastDate && <Badge variant="neutral">Latest</Badge>}
                </span>
              </TH>
            ))}
          </THead>

          <TBody>
            {group.items.map((item, rowIndex) => (
              <TR key={item.id} className="group/row">
                <TD
                  className={cn(
                    stickyCell,
                    "bg-white font-medium text-ink-900"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {item.name} ({item.reorder})

                    {can("inventory:manage") && (
                      <span className="inline-flex gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
                        <button
                          onClick={() => onEditItem(item)}
                          className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => onDeleteItem(item)}
                          className="rounded-lg p-1 text-ink-400 hover:bg-danger-soft hover:text-danger"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </span>
                </TD>

                <TD className="text-ink-500">{item.unit}</TD>

                {dates.map((d) => {
                  const editable = recording && d === today;

                  if (editable) {
                    return (
                      <TD key={d} className="text-right">
                        <input
                          ref={(el) => (inputRefs.current[rowIndex] = el)}
                          type="number"
                          inputMode="decimal"
                          min="0"
                          value={drafts[item.id] ?? ""}
                          onChange={(e) => onDraft(item.id, e.target.value)}
                          onKeyDown={(e) => onKeyDown(e, rowIndex)}
                          placeholder={
                            d in item.records
                              ? String(item.records[d])
                              : "0"
                          }
                          className={cn(
                            "h-9 w-24 rounded-xl border border-ink-200 bg-white px-2.5 text-right text-sm text-ink-900",
                            "transition-all duration-150 ease-[var(--ease-out-soft)]",
                            "focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10"
                          )}
                        />
                      </TD>
                    );
                  }

                  const has = d in item.records;
                  const qty = item.records[d];
                  const low = has && isLowStock(qty, item.reorder);

                  return (
                    <TD
                      key={d}
                      className={cn(
                        "text-right tabular-nums",
                        low && "bg-danger-soft/50 font-semibold text-danger"
                      )}
                    >
                      {has ? (
                        <span className="inline-flex items-center gap-1.5">
                          {low && <AlertTriangle className="h-3.5 w-3.5" />}

                          {formatNumber(qty)}
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </TD>
                  );
                })}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
