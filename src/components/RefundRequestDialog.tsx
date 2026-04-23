// Customer-facing refund request dialog opened from "My Orders".
import { useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRefundRequest } from "@/lib/api/refunds";
import { toast } from "sonner";

interface Props {
  orderId: string;
  vendorId: string;
  maxAmount: number;
}

const REASONS = [
  "Item not as described",
  "Item damaged or defective",
  "Wrong item received",
  "Item never arrived",
  "Quality issue",
  "Other",
];

export function RefundRequestDialog({ orderId, vendorId, maxAmount }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [amount, setAmount] = useState(maxAmount);
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (amount <= 0 || amount > maxAmount) {
      toast.error(`Amount must be between 1 and ${maxAmount}`);
      return;
    }
    setSaving(true);
    try {
      await createRefundRequest({ order_id: orderId, vendor_id: vendorId, reason, amount, details: details.trim() || undefined });
      toast.success("Refund request submitted");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Receipt className="h-3.5 w-3.5 mr-1.5" /> Request refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a refund</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount to refund (Rs)</Label>
            <Input id="amount" type="number" min={1} max={maxAmount} value={amount}
              onChange={(e) => setAmount(Math.min(maxAmount, Math.max(0, Number(e.target.value) || 0)))} />
            <p className="text-[11px] text-muted-foreground mt-1">Max Rs {maxAmount.toLocaleString()}</p>
          </div>
          <div>
            <Label htmlFor="rdetails">Details</Label>
            <Textarea id="rdetails" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Tell the vendor what went wrong" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-gradient-primary text-primary-foreground">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
