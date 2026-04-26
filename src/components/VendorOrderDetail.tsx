// Full order detail dialog for vendors — shows customer info, items, and totals.
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, MessageCircle, Copy, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getOrCreateConversation } from "@/lib/api/conversations";

interface OrderItem { id: string; product_name: string; unit_price: number; quantity: number; }
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: {
    id: string;
    customer_id: string;
    total: number;
    subtotal?: number;
    discount_total?: number;
    delivery_fee?: number;
    payment_method?: string;
    payment_status?: string;
    courier_name?: string | null;
    tracking_number?: string | null;
    estimated_delivery_at?: string | null;
    commission_amount?: number;
    status: string;
    shipping_address: string | null;
    phone: string | null;
    notes: string | null;
    created_at: string;
    items: OrderItem[];
  } | null;
}

export function VendorOrderDetail({ open, onOpenChange, order }: Props) {
  const [customer, setCustomer] = useState<{ full_name: string | null; city: string | null } | null>(null);

  useEffect(() => {
    if (!order) { setCustomer(null); return; }
    supabase.from("profiles").select("full_name, city").eq("id", order.customer_id).maybeSingle().then(({ data }) => {
      setCustomer(data as { full_name: string | null; city: string | null } | null);
    });
  }, [order]);

  if (!order) return null;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  const messageCustomer = async () => {
    try {
      const convoId = await getOrCreateConversation(order.customer_id);
      window.location.href = `/dashboard?tab=messages&c=${convoId}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open chat");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Order #{order.id.slice(0, 8)}</span>
            <Badge variant={order.status === "delivered" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}>
              {order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Customer</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{customer?.full_name ?? "Customer"}</span>
                {customer?.city && <span className="text-muted-foreground">· {customer.city}</span>}
              </div>
              {order.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${order.phone}`} className="text-primary hover:underline">{order.phone}</a>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(order.phone!, "Phone")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {order.shipping_address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="flex-1">{order.shipping_address}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(order.shipping_address!, "Address")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Button size="sm" variant="outline" onClick={messageCustomer}>
                <MessageCircle className="h-4 w-4 mr-2" /> Message customer
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Items</div>
            <ul className="space-y-2">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="flex-1">{it.quantity}× {it.product_name}</span>
                  <span className="font-medium">Rs {(Number(it.unit_price) * it.quantity).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between mt-3 pt-3 border-t font-bold">
              <span>Total (COD)</span>
              <span className="text-primary">Rs {Number(order.total).toLocaleString()}</span>
            </div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Subtotal</span><span>Rs {Number(order.subtotal ?? order.total).toLocaleString()}</span></div>
              {Number(order.discount_total ?? 0) > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>- Rs {Number(order.discount_total).toLocaleString()}</span></div>}
              {Number(order.delivery_fee ?? 0) > 0 && <div className="flex justify-between"><span>Delivery</span><span>Rs {Number(order.delivery_fee).toLocaleString()}</span></div>}
              {Number(order.commission_amount ?? 0) > 0 && <div className="flex justify-between"><span>Platform commission</span><span>Rs {Number(order.commission_amount).toLocaleString()}</span></div>}
              <div className="flex justify-between"><span>Payment</span><span>{order.payment_method === "online" ? "Online" : "COD"} · {order.payment_status ?? "pending"}</span></div>
            </div>
          </div>

          {(order.courier_name || order.tracking_number || order.estimated_delivery_at) && (
            <>
              <Separator />
              <div>
                <div className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Delivery</div>
                <p className="rounded-md bg-muted/50 p-3">
                  {order.courier_name || "Courier not set"}{order.tracking_number ? ` · ${order.tracking_number}` : ""}{order.estimated_delivery_at ? ` · ETA ${new Date(order.estimated_delivery_at).toLocaleString()}` : ""}
                </p>
              </div>
            </>
          )}

          {order.notes && (
            <>
              <Separator />
              <div>
                <div className="text-xs uppercase text-muted-foreground tracking-wide mb-2">Customer notes</div>
                <p className="bg-muted/50 rounded-md p-3 italic">{order.notes}</p>
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground">Placed {new Date(order.created_at).toLocaleString()}</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
