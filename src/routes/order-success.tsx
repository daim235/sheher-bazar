import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const search = z.object({
  ids: fallback(z.string(), "").default(""),
  total: fallback(z.coerce.number(), 0).default(0),
  count: fallback(z.coerce.number(), 0).default(0),
});

export const Route = createFileRoute("/order-success")({
  head: () => ({ meta: [{ title: "Order placed — Shahar Bazar" }] }),
  validateSearch: zodValidator(search),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { ids, total, count } = Route.useSearch();
  const orderIds = ids ? ids.split(",").filter(Boolean) : [];

  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Card className="p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h1 className="mt-5 text-3xl font-bold">Thank you for your order!</h1>
          <p className="mt-2 text-muted-foreground">
            Your {count > 1 ? `${count} orders have` : "order has"} been received. You'll pay in cash on delivery.
          </p>

          {orderIds.length > 0 && (
            <div className="mt-6 text-left">
              <Separator className="mb-4" />
              <h2 className="font-semibold mb-2">Order reference{orderIds.length > 1 ? "s" : ""}</h2>
              <ul className="space-y-1 text-sm">
                {orderIds.map((id: string) => (
                  <li key={id} className="font-mono text-xs bg-secondary px-3 py-2 rounded">
                    #{id.slice(0, 8).toUpperCase()}
                  </li>
                ))}
              </ul>
              {total > 0 && (
                <div className="flex justify-between mt-4 font-semibold">
                  <span>Total to pay on delivery</span>
                  <span className="text-primary">Rs {total.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid sm:grid-cols-2 gap-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/60">
              <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-sm">Vendor confirms</div>
                <div className="text-xs text-muted-foreground">The shop will accept your order shortly.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/60">
              <Truck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-sm">Delivery</div>
                <div className="text-xs text-muted-foreground">You pay cash when the order arrives.</div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-gradient-primary text-primary-foreground">
              <Link to="/dashboard" search={{ tab: "my-orders", c: "" }}>Track my orders</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/marketplace" search={{ q: "", category: "" }}>Continue shopping</Link>
            </Button>
          </div>
        </Card>
      </div>
    </SiteShell>
  );
}
