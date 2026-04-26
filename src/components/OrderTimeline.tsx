import { CheckCircle2, Circle, Clock, PackageCheck, Truck } from "lucide-react";

type TimelineStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | string;

interface TimelineOrder {
  status: TimelineStatus;
  created_at: string;
  confirmed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

interface Props {
  order: TimelineOrder;
  compact?: boolean;
}

const milestones = [
  { key: "confirmed", label: "Confirmed", Icon: PackageCheck },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: CheckCircle2 },
] as const;

const statusRank: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

function formatTimelineDate(value?: string | null) {
  if (!value) return "Awaiting update";
  return new Date(value).toLocaleString();
}

export function OrderTimeline({ order, compact = false }: Props) {
  const rank = statusRank[order.status] ?? 0;

  return (
    <div className={compact ? "space-y-2" : "rounded-md border bg-card p-3"}>
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Delivery timeline
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {milestones.map(({ key, label, Icon }) => {
          const timestamp = key === "confirmed" ? order.confirmed_at : key === "shipped" ? order.shipped_at : order.delivered_at;
          const complete = rank >= statusRank[key];
          const cancelled = order.status === "cancelled";
          return (
            <div key={key} className="relative flex gap-2 text-sm">
              <div className="mt-0.5">
                {complete ? (
                  <Icon className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <div className={complete ? "font-medium text-foreground" : "font-medium text-muted-foreground"}>{label}</div>
                <div className="text-xs text-muted-foreground">{cancelled && !complete ? "Order cancelled" : formatTimelineDate(timestamp)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">Placed {formatTimelineDate(order.created_at)}</div>
    </div>
  );
}