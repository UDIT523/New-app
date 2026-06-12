import { useMemo, useState, useEffect } from "react";
import { CalendarDays, ArrowUp, ArrowDown } from "lucide-react";
import Card from "../ui/Card";
import { cn } from "../../utils/cn";
import { formatDisplayDate, formatNumber } from "../../utils/format";

const WINDOW = 6;

/**
 * Last-six-days stock overview. Lets the user step through the most recent
 * record dates; the headline total stock and per-day figures update with the
 * selected day.
 */
export default function StockOverview({ groups }) {
  // Union of every group's record dates, oldest→newest, capped to the last six.
  const dates = useMemo(() => {
    const set = new Set();
    for (const g of groups) for (const d of g.recordDates) set.add(d);
    return [...set].sort().slice(-WINDOW);
  }, [groups]);

  const [selected, setSelected] = useState(null);

  // Keep the selection valid; default to the latest day as the window shifts.
  useEffect(() => {
    if (!dates.length) {
      setSelected(null);
      return;
    }
    setSelected((cur) =>
      cur && dates.includes(cur) ? cur : dates[dates.length - 1]
    );
  }, [dates]);

  // Total recorded stock per day, summed across every item in every group.
  const totals = useMemo(() => {
    const map = {};
    for (const d of dates) {
      let sum = 0;
      let items = 0;
      for (const g of groups) {
        for (const it of g.items) {
          if (d in it.records) {
            sum += it.records[d];
            items += 1;
          }
        }
      }
      map[d] = { sum, items };
    }
    return map;
  }, [groups, dates]);

  if (!dates.length || !selected) return null;

  const current = totals[selected];
  const idx = dates.indexOf(selected);
  const prev = idx > 0 ? totals[dates[idx - 1]] : null;
  const delta = prev ? current.sum - prev.sum : null;

  return (
    <Card className="mb-5 overflow-hidden">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-500">
            <CalendarDays className="h-4 w-4" />
            Total stock
          </div>

          <div className="mt-1.5 flex items-end gap-3">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-ink-900">
              {formatNumber(current.sum)}
            </p>

            {delta !== null && delta !== 0 && (
              <span
                className={cn(
                  "mb-1 inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
                  delta > 0 ? "text-ink-900" : "text-danger"
                )}
              >
                {delta > 0 ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
                {formatNumber(Math.abs(delta))}
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-ink-400">
            {formatDisplayDate(selected)} · {current.items} item
            {current.items === 1 ? "" : "s"} recorded
          </p>
        </div>

        {/* Last six days — selecting a day updates the totals above. */}
        <div className="flex flex-wrap gap-1.5">
          {dates.map((d) => {
            const active = d === selected;
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={cn(
                  "min-w-[78px] rounded-xl border px-3 py-2 text-center transition-all duration-150",
                  active
                    ? "border-ink-900 bg-ink-900 text-white shadow-[var(--shadow-soft)]"
                    : "border-ink-200 bg-white text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                )}
              >
                <span className="block text-[11px] font-medium leading-tight">
                  {formatDisplayDate(d)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-sm font-semibold tabular-nums",
                    active ? "text-white" : "text-ink-900"
                  )}
                >
                  {formatNumber(totals[d].sum)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
