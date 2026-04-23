import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface OrderLike {
  created_at: string;
  total: number;
  status: string;
}

interface Props {
  orders: OrderLike[];
  days?: number;
}

function formatDay(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function SalesChart({ orders, days = 30 }: Props) {
  const data = useMemo(() => {
    const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: formatDay(d), revenue: 0, orders: 0 });
    }
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      const key = o.created_at.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.revenue += Number(o.total) || 0;
        bucket.orders += 1;
      }
    });
    return Array.from(buckets.values());
  }, [orders, days]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <h3 className="font-semibold">Sales over time</h3>
          <p className="text-xs text-muted-foreground">Last {days} days</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Revenue</div>
            <div className="font-bold text-primary">Rs {totalRevenue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Orders</div>
            <div className="font-bold">{totalOrders}</div>
          </div>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval={Math.max(0, Math.floor(days / 8))}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--foreground)",
              }}
              formatter={(value: number, name: string) =>
                name === "revenue"
                  ? [`Rs ${value.toLocaleString()}`, "Revenue"]
                  : [value, "Orders"]
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#rev)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
