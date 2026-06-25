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
  showReorder = true,
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
    if (
      e.key === "Enter" ||
      e.key === "ArrowDown"
    ) {
      e.preventDefault();
      focusRow(index + 1);
    } else if (
      e.key === "ArrowUp"
    ) {
      e.preventDefault();
      focusRow(index - 1);
    } else if (
      e.key === "Escape"
    ) {
      onCancel();
    }
  };

  const lastDate =
    dates[dates.length - 1];

  const mobileDates =
    dates.length > 0
      ? [lastDate]
      : [];

  const stickyCell =
  "md:sticky md:left-0 md:z-10 md:border-r md:border-ink-100";

  return (
    <Table
  minWidth={320}
>
      <THead>
        <TH
          className={cn(
            stickyCell,
            "bg-ink-25"
          )}
        >
          Item
        </TH>

        <TH>Unit</TH>

        {/* Desktop Dates */}
        {dates.map((d) => (
          <TH
            key={d}
            className="hidden md:table-cell text-right"
          >
            <span className="inline-flex items-center gap-1.5">
              {formatDisplayDate(d)}

              {d === lastDate && (
                <Badge variant="neutral">
                  Latest
                </Badge>
              )}
            </span>
          </TH>
        ))}

        {/* Mobile Latest */}
        {mobileDates.map((d) => (
          <TH
  key={`mobile-${d}`}
  className="md:hidden text-right"
>
  Stock
</TH>
        ))}
      </THead>

      <TBody>
        {group.items.map(
          (item, rowIndex) => (
            <TR
              key={item.id}
              className="group/row"
            >
              <TD
                className={cn(
                  stickyCell,
                  "bg-white font-medium text-ink-900"
                )}
              >
                <span className="flex flex-wrap items-center gap-2">
                  {item.name} 
                  {showReorder && <> ({item.reorder})</>}

                  {can(
                    "inventory:manage"
                  ) && (
                    <span className="hidden md:inline-flex gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
                      <button
                        onClick={() =>
                          onEditItem(
                            item
                          )
                        }
                        className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          onDeleteItem(
                            item
                          )
                        }
                        className="rounded-lg p-1 text-ink-400 hover:bg-danger-soft hover:text-danger"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </span>
              </TD>

              <TD className="text-ink-500">
                {item.unit}
              </TD>

              {/* Desktop Date Columns */}
              {dates.map((d) => {
                const editable =
                  recording &&
                  d === today;

                if (editable) {
                  return (
                    <TD
                      key={d}
                      className="hidden md:table-cell text-right"
                    >
                      <input
                        ref={(el) =>
                          (inputRefs.current[
                            rowIndex
                          ] = el)
                        }
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={
                          drafts[
                            item.id
                          ] ?? ""
                        }
                        onChange={(
                          e
                        ) =>
                          onDraft(
                            item.id,
                            e.target
                              .value
                          )
                        }
                        onKeyDown={(
                          e
                        ) =>
                          onKeyDown(
                            e,
                            rowIndex
                          )
                        }
                        placeholder={
                          d in
                          item.records
                            ? String(
                                item
                                  .records[
                                  d
                                ]
                              )
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

                const has =
                  d in
                  item.records;

                const qty =
                  item.records[d];

                const low =
  showReorder &&
  has &&
  isLowStock(
    qty,
    item.reorder
  );

                return (
                  <TD
                    key={d}
                    className={cn(
                      "hidden md:table-cell text-right tabular-nums",
                      low &&
                        "bg-danger-soft/50 font-semibold text-danger"
                    )}
                  >
                    {has ? (
                      <span className="inline-flex items-center gap-1.5">
                        {low && (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}

                        {formatNumber(
                          qty
                        )}
                      </span>
                    ) : (
                      <span className="text-ink-300">
                        —
                      </span>
                    )}
                  </TD>
                );
              })}

              {/* Mobile Latest Column */}
{mobileDates.map((d) => {
  const editable = recording && d === today;

  if (editable) {
    return (
      <TD
        key={`mobile-${d}`}
        className="md:hidden text-right"
      >
        <input
          type="number"
          inputMode="decimal"
          min="0"
          value={drafts[item.id] ?? ""}
          onChange={(e) =>
            onDraft(item.id, e.target.value)
          }
          placeholder={
            d in item.records
              ? String(item.records[d])
              : "0"
          }
          className="h-9 w-20 rounded-lg border border-ink-200 px-2 text-right text-sm"
        />
      </TD>
    );
  }

  const has = d in item.records;
  const qty = item.records[d];
 const low =
  showReorder &&
  has &&
  isLowStock(qty, item.reorder);
  return (
    <TD
      key={`mobile-${d}`}
      className={cn(
        "md:hidden text-right tabular-nums",
        low &&
          "bg-danger-soft/50 font-semibold text-danger"
      )}
    >
      {has ? (
        <span className="inline-flex items-center gap-1.5">
          {low && (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          {formatNumber(qty)}
        </span>
      ) : (
        <span className="text-ink-300">—</span>
      )}
    </TD>
  );
})}
            </TR>
          )
        )}
      </TBody>
    </Table>
  );
}