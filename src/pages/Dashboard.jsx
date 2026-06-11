import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Package,
  Boxes,
  AlertTriangle,
  CalendarCheck,
  ArrowRight,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import StatCard from "../components/ui/StatCard";
import Card, { CardHeader, CardTitle, CardBody } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { useInventory } from "../hooks/useInventory";
import { formatNumber, formatDisplayDate } from "../utils/format";

const INK = "#121212";
const GRID = "#e8e8e8";
const AXIS = "#909090";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-3 py-2 shadow-[var(--shadow-lift)]">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="text-sm font-bold text-ink-900">
        {formatNumber(payload[0].value)}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { data: groups = [], isLoading } = useInventory();

  const items = useMemo(
    () => groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.name }))),
    [groups]
  );
  const lowItems = items.filter((i) => i.isLow);

  const lastRecorded = useMemo(() => {
    let max = null;
    for (const g of groups) {
      const last = g.recordDates[g.recordDates.length - 1];
      if (last && (!max || last > max)) max = last;
    }
    return max;
  }, [groups]);

  // Total stock recorded across all items per date, last 14 distinct dates.
  const stockOverTime = useMemo(() => {
    const totals = new Map();
    for (const item of items) {
      for (const [date, qty] of Object.entries(item.records)) {
        totals.set(date, (totals.get(date) || 0) + qty);
      }
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, qty]) => ({ date: date.slice(5), qty }));
  }, [items]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A real-time snapshot of your raw material stock."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard
          label="Material groups"
          value={formatNumber(groups.length)}
          icon={Boxes}
          loading={isLoading}
        />
        <StatCard
          label="Items tracked"
          value={formatNumber(items.length)}
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          label="Low stock"
          value={formatNumber(lowItems.length)}
          icon={AlertTriangle}
          loading={isLoading}
          emphasis={lowItems.length > 0}
          hint="below reorder"
        />
        <StatCard
          label="Last recorded"
          value={lastRecorded ? formatDisplayDate(lastRecorded) : "—"}
          icon={CalendarCheck}
          loading={isLoading}
          hint="most recent entry"
        />
      </div>

      {/* Chart + low stock */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total stock recorded · last 14 dates</CardTitle>
          </CardHeader>
          <CardBody>
            {stockOverTime.length === 0 ? (
              <EmptyState icon={Package} title="No records yet" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={stockOverTime}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={INK} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={INK} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="qty"
                    stroke={INK}
                    strokeWidth={2}
                    fill="url(#stockFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low stock alerts</CardTitle>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              View materials <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {lowItems.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title="All stock levels are healthy"
                description="No items are below their reorder level."
              />
            ) : (
              <ul className="max-h-[280px] divide-y divide-ink-50 overflow-y-auto">
                {lowItems.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink-900">
                        {i.name}
                      </span>
                      <span className="text-xs text-ink-500">{i.group}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm text-ink-500">
                        {formatNumber(i.latestQty)} {i.unit} / reorder{" "}
                        {formatNumber(i.reorder)}
                      </span>
                      <Badge variant="danger">Low</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
