// Reusable report flow — opens a dialog to flag a product/shop/service/review.
import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createReport, type ReportTarget } from "@/lib/api/reports";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

interface Props {
  targetType: ReportTarget;
  targetId: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "icon";
  className?: string;
}

const REASONS = [
  "Counterfeit / fake item",
  "Inappropriate content",
  "Spam or scam",
  "Misleading description",
  "Wrong category",
  "Harassment or abuse",
  "Other",
];

export function ReportButton({ targetType, targetId, variant = "ghost", size = "sm", className }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    setSaving(true);
    try {
      await createReport({ target_type: targetType, target_id: targetId, reason, details: details.trim() || undefined });
      toast.success("Report submitted. Thanks for keeping the marketplace safe.");
      setOpen(false);
      setDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="h-3.5 w-3.5 mr-1.5" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
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
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Share any context that helps our team review this." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
