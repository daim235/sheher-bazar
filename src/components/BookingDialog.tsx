// Booking calendar / time picker dialog.
// Customers pick a date and a time slot; we combine them into an ISO string.
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createBooking } from "@/lib/api/bookings";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  providerId: string;
  serviceTitle: string;
  onBooked?: () => void;
}

const SLOTS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
];

export function BookingDialog({ open, onOpenChange, serviceId, providerId, serviceTitle, onBooked }: Props) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>(SLOTS[2]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!date) { toast.error("Pick a date"); return; }
    setSubmitting(true);
    try {
      const [hh, mm] = time.split(":").map(Number);
      const scheduled = new Date(date);
      scheduled.setHours(hh, mm, 0, 0);
      await createBooking({
        service_id: serviceId,
        provider_id: providerId,
        scheduled_for: scheduled.toISOString(),
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Booking requested! The provider will confirm shortly.");
      onOpenChange(false);
      setDate(undefined); setAddress(""); setNotes("");
      onBooked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not book");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book {serviceTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Time *</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SLOTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="addr">Address</Label>
            <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Where should the provider come?" />
          </div>
          <div>
            <Label htmlFor="bnotes">Notes</Label>
            <Textarea id="bnotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details for the provider…" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-gradient-primary text-primary-foreground">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
