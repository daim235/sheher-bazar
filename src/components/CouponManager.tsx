// Vendor coupon manager — list + create + toggle + delete.
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Tag, Power, PowerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createCoupon, deleteCoupon, listVendorCoupons, toggleCoupon, type Coupon } from "@/lib/api/coupons";
import { toast } from "sonner";

export function CouponManager({ vendorId }: { vendorId: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(10);
  const [minOrder, setMinOrder] = useState(0);
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setCoupons(await listVendorCoupons(vendorId)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [vendorId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || value <= 0) { toast.error("Code and value are required"); return; }
    setSaving(true);
    try {
      await createCoupon({
        vendor_id: vendorId,
        code,
        discount_type: type,
        discount_value: value,
        min_order_amount: minOrder,
        max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      toast.success("Coupon created");
      setOpen(false);
      setCode(""); setValue(10); setMinOrder(0); setMaxRedemptions(""); setExpiresAt("");
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not create"); }
    finally { setSaving(false); }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Discount codes</h3>
          <p className="text-xs text-muted-foreground mt-1">Create promo codes customers can apply at checkout.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> New coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create coupon</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percent off (%)</SelectItem>
                      <SelectItem value="fixed">Fixed amount (Rs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="val">Value</Label>
                  <Input id="val" type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="min">Minimum order (Rs)</Label>
                  <Input id="min" type="number" min={0} value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label htmlFor="max">Max uses (optional)</Label>
                  <Input id="max" type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="∞" />
                </div>
              </div>
              <div>
                <Label htmlFor="exp">Expires (optional)</Label>
                <Input id="exp" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto my-6" />
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No coupons yet.</p>
        ) : (
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 border border-border rounded-md p-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-mono font-bold tracking-wide flex items-center gap-2">
                    {c.code}
                    {!c.is_active && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
                    {c.expires_at && new Date(c.expires_at) < new Date() && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {c.discount_type === "percent" ? `${c.discount_value}% off` : `Rs ${c.discount_value} off`}
                    {Number(c.min_order_amount) > 0 && ` · min Rs ${Number(c.min_order_amount).toLocaleString()}`}
                    {c.max_redemptions && ` · ${c.redemption_count}/${c.max_redemptions} used`}
                    {c.expires_at && ` · until ${new Date(c.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={async () => { await toggleCoupon(c.id, !c.is_active); load(); }} aria-label="Toggle active">
                    {c.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4 text-primary" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={async () => { if (confirm("Delete this coupon?")) { await deleteCoupon(c.id); load(); } }} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
