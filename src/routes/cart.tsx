// Cart + Cash-on-Delivery checkout
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingCart, Trash2, Loader2, ArrowLeft, Minus, Plus } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { placeOrders } from "@/lib/api/orders";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Shahar Bazar" },
      { name: "description", content: "Review your cart and checkout with cash on delivery." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, count, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const handlePlace = async () => {
    if (!user) {
      toast.error("Please sign in to checkout");
      navigate({ to: "/auth" });
      return;
    }
    if (items.length === 0) return;
    if (!address.trim() || !phone.trim()) {
      toast.error("Address and phone are required");
      return;
    }
    setPlacing(true);
    try {
      const orders = await placeOrders({
        items,
        shipping_address: address.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      });
      toast.success(`${orders.length} order${orders.length > 1 ? "s" : ""} placed! Vendors will confirm shortly.`);
      clear();
      navigate({ to: "/dashboard", search: { tab: "bookings", c: "" } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not place order";
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (count === 0) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-accent flex items-center justify-center">
            <ShoppingCart className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Browse the marketplace to add products.</p>
          <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground">
            <Link to="/marketplace">Shop the marketplace</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/marketplace", search: { q: "", category: "" } })} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Continue shopping
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Your cart ({count})</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((it) => (
              <Card key={it.product_id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{it.name}</div>
                  <div className="text-sm text-muted-foreground">Rs {Number(it.price).toLocaleString()} each</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(it.product_id, it.quantity - 1)} aria-label="Decrease">
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    type="number"
                    value={it.quantity}
                    onChange={(e) => setQty(it.product_id, Math.max(1, Number(e.target.value) || 1))}
                    className="w-14 h-8 text-center"
                  />
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setQty(it.product_id, it.quantity + 1)} aria-label="Increase">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="font-bold text-primary w-24 text-right">
                  Rs {(it.price * it.quantity).toLocaleString()}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(it.product_id)} aria-label="Remove">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>

          <div>
            <Card className="p-6 sticky top-24">
              <h2 className="font-semibold text-lg">Checkout (Cash on Delivery)</h2>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="addr">Shipping address *</Label>
                  <Textarea id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House, street, area, city" rows={2} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone number *</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxxxxxx" />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery instructions" rows={2} />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Rs {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Delivery</span>
                <span>Pay on delivery</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-3">
                <span>Total</span>
                <span className="text-primary">Rs {total.toLocaleString()}</span>
              </div>
              <Button onClick={handlePlace} disabled={placing} className="w-full mt-5 bg-gradient-primary text-primary-foreground">
                {placing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Place order (COD)
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Items from multiple shops are split into separate orders.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
