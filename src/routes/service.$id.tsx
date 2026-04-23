import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Star, MessageCircle, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ReviewForm } from "@/components/ReviewForm";
import { toast } from "sonner";

export const Route = createFileRoute("/service/$id")({
  component: ServiceDetail,
});

interface Service {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  price: number;
  price_unit: string | null;
  city: string | null;
  image_url: string | null;
  rating: number;
  reviews_count: number;
}

interface Profile { id: string; full_name: string | null; avatar_url: string | null; city: string | null; bio: string | null; }

interface Review { id: string; rating: number; comment: string | null; created_at: string; author_id: string; }

function ServiceDetail() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    const { data: r } = await supabase.from("reviews").select("*").eq("service_id", id).order("created_at", { ascending: false }).limit(50);
    setReviews((r ?? []) as Review[]);
  };

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
      if (!s) { setLoading(false); return; }
      setService(s as Service);
      const [{ data: p }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", s.provider_id).maybeSingle(),
        loadReviews(),
      ]);
      setProvider(p as Profile | null);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBook = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!service) return;
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      service_id: service.id,
      customer_id: user.id,
      provider_id: service.provider_id,
      scheduled_for: scheduledFor || null,
      address,
      notes,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Booking requested!");
    setBookingOpen(false);
    navigate({ to: "/dashboard" });
  };

  const handleChat = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!service) return;
    if (user.id === service.provider_id) { toast.info("You can't chat with yourself"); return; }
    const [u1, u2] = [user.id, service.provider_id].sort();
    const existing = await supabase.from("conversations").select("id").eq("user1_id", u1).eq("user2_id", u2).maybeSingle();
    let convoId = existing.data?.id;
    if (!convoId) {
      const { data, error } = await supabase.from("conversations").insert({ user1_id: u1, user2_id: u2 }).select("id").single();
      if (error) { toast.error(error.message); return; }
      convoId = data.id;
    }
    navigate({ to: "/dashboard", search: { tab: "messages", c: convoId } });
  };

  if (loading) {
    return <SiteShell><div className="mx-auto max-w-5xl px-6 py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SiteShell>;
  }
  if (!service) {
    return <SiteShell><div className="mx-auto max-w-5xl px-6 py-20 text-center"><h2 className="text-xl font-semibold">Service not found</h2><Button asChild className="mt-4"><Link to="/services">Back to services</Link></Button></div></SiteShell>;
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/services", search: { q: "", city: "", category: "" } })} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="aspect-[16/9] bg-gradient-primary">
                {service.image_url && <img src={service.image_url} alt={service.title} className="h-full w-full object-cover" />}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">{service.title}</h1>
                    <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {service.city ?? "—"}</span>
                      {service.rating > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" /> {Number(service.rating).toFixed(1)} ({service.reviews_count})
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{t("common.from")}</div>
                    <div className="text-2xl font-bold text-primary">Rs {Number(service.price).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{service.price_unit}</div>
                  </div>
                </div>
                <p className="mt-5 text-foreground/90 leading-relaxed whitespace-pre-line">
                  {service.description ?? "No description provided."}
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-lg">Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No reviews yet. Be the first!</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-l-2 border-primary/30 pl-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-sm">{r.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold">
                  {(provider?.full_name ?? "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">{provider?.full_name ?? "Provider"}</div>
                  <div className="text-xs text-muted-foreground">{provider?.city ?? "—"}</div>
                </div>
              </div>
              {provider?.bio && <p className="mt-3 text-sm text-muted-foreground">{provider.bio}</p>}

              <div className="mt-5 flex flex-col gap-2">
                <Button onClick={() => setBookingOpen(true)} className="bg-gradient-primary text-primary-foreground hover:opacity-95">
                  <Calendar className="h-4 w-4 mr-2" /> {t("common.book")}
                </Button>
                <Button onClick={handleChat} variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" /> {t("common.chat")}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.book")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="when">When?</Label>
              <Input id="when" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="addr">Address</Label>
              <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Service location" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details for the provider…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleBook} disabled={submitting} className="bg-gradient-primary text-primary-foreground">
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
