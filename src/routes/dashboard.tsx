import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Loader2, Plus, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

const dashSearch = z.object({
  tab: fallback(z.enum(["bookings", "listings", "messages", "profile"]), "bookings").default("bookings"),
  c: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Shahar Bazar" }] }),
  validateSearch: zodValidator(dashSearch),
  component: Dashboard,
});

interface Booking {
  id: string;
  service_id: string;
  customer_id: string;
  provider_id: string;
  scheduled_for: string | null;
  status: string;
  notes: string | null;
  address: string | null;
  created_at: string;
}
interface Service {
  id: string; title: string; description: string | null; price: number; city: string | null; is_active: boolean;
}
interface Conversation { id: string; user1_id: string; user2_id: string; last_message_at: string; }
interface Message { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; }
interface Profile { id: string; full_name: string | null; phone: string | null; city: string | null; bio: string | null; }

function Dashboard() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("dash.welcome")}</h1>
            <p className="text-primary-foreground/85 text-sm mt-1">{user.email}</p>
          </div>
          <Button asChild variant="secondary" size="sm"><Link to="/">← Home</Link></Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-6 pb-12">
        <Tabs value={search.tab} onValueChange={(v) => navigate({ to: "/dashboard", search: (p: { tab: string; c: string }) => ({ ...p, tab: v as any }) })}>
          <TabsList className="bg-card shadow-soft">
            <TabsTrigger value="bookings">{t("dash.bookings")}</TabsTrigger>
            <TabsTrigger value="listings">{t("dash.listings")}</TabsTrigger>
            <TabsTrigger value="messages">{t("dash.messages")}</TabsTrigger>
            <TabsTrigger value="profile">{t("dash.profile")}</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6"><BookingsTab userId={user.id} /></TabsContent>
          <TabsContent value="listings" className="mt-6"><ListingsTab userId={user.id} /></TabsContent>
          <TabsContent value="messages" className="mt-6"><MessagesTab userId={user.id} initialConvo={search.c} /></TabsContent>
          <TabsContent value="profile" className="mt-6"><ProfileTab userId={user.id} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BookingsTab({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<(Booking & { service: Service | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("bookings").select("*, service:services(*)").or(`customer_id.eq.${userId},provider_id.eq.${userId}`).order("created_at", { ascending: false });
    setBookings((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" />;
  if (bookings.length === 0) return <Card className="p-10 text-center"><p className="text-muted-foreground">No bookings yet.</p><Button asChild className="mt-4"><Link to="/services">Browse services</Link></Button></Card>;

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <Card key={b.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="font-semibold">{b.service?.title ?? "Service"}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {b.scheduled_for ? new Date(b.scheduled_for).toLocaleString() : "Not scheduled"} · {b.address ?? "—"}
            </div>
            {b.notes && <p className="text-sm mt-2">{b.notes}</p>}
          </div>
          <Badge variant={b.status === "completed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}>{b.status}</Badge>
          {b.provider_id === userId && b.status === "pending" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateStatus(b.id, "confirmed")}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")}>Decline</Button>
            </div>
          )}
          {b.customer_id === userId && b.status === "pending" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")}>Cancel</Button>
          )}
        </Card>
      ))}
    </div>
  );
}

function ListingsTab({ userId }: { userId: string }) {
  const [listings, setListings] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("services").select("*").eq("provider_id", userId).order("created_at", { ascending: false });
    setListings((data ?? []) as Service[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("services").insert({
      provider_id: userId, title, description, price: Number(price) || 0, city,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Service created!");
    setOpen(false); setTitle(""); setDescription(""); setPrice(""); setCity("");
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Your services</h2>
        <Button onClick={() => setOpen(true)} className="bg-gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> New service</Button>
      </div>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" /> :
        listings.length === 0 ? <Card className="p-10 text-center text-muted-foreground">No listings yet. Create your first service!</Card> :
        <div className="grid sm:grid-cols-2 gap-4">
          {listings.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold">{s.title}</h3>
                <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Active" : "Hidden"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">{s.city}</span>
                <span className="font-bold text-primary">Rs {Number(s.price).toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New service</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-3">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (Rs)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
              <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-primary text-primary-foreground">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessagesTab({ userId, initialConvo }: { userId: string; initialConvo: string }) {
  const [convos, setConvos] = useState<(Conversation & { other: Profile | null })[]>([]);
  const [activeId, setActiveId] = useState<string>(initialConvo);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const loadConvos = async () => {
    const { data } = await supabase.from("conversations").select("*").or(`user1_id.eq.${userId},user2_id.eq.${userId}`).order("last_message_at", { ascending: false });
    const convs = (data ?? []) as Conversation[];
    const otherIds = convs.map((c) => c.user1_id === userId ? c.user2_id : c.user1_id);
    const { data: profs } = await supabase.from("profiles").select("*").in("id", otherIds.length ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
    const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    setConvos(convs.map((c) => ({ ...c, other: profMap.get(c.user1_id === userId ? c.user2_id : c.user1_id) ?? null })));
    if (!activeId && convs[0]) setActiveId(convs[0].id);
  };
  useEffect(() => { loadConvos(); }, [userId]);

  useEffect(() => {
    if (!activeId) return;
    supabase.from("messages").select("*").eq("conversation_id", activeId).order("created_at", { ascending: true }).then(({ data }) => {
      setMessages((data ?? []) as Message[]);
    });
    const channel = supabase
      .channel(`msgs-${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: activeId, sender_id: userId, content });
    if (error) toast.error(error.message);
    else await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeId);
  };

  if (convos.length === 0) {
    return <Card className="p-10 text-center"><MessageCircle className="h-10 w-10 text-muted-foreground mx-auto" /><p className="mt-3 text-muted-foreground">No conversations yet. Start one from a service page.</p></Card>;
  }

  return (
    <Card className="grid grid-cols-1 md:grid-cols-3 h-[60vh] overflow-hidden">
      <div className="border-r border-border overflow-y-auto">
        {convos.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)} className={`w-full text-left p-4 border-b border-border hover:bg-accent transition-base ${activeId === c.id ? "bg-accent" : ""}`}>
            <div className="font-medium text-sm">{c.other?.full_name ?? "User"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{new Date(c.last_message_at).toLocaleDateString()}</div>
          </button>
        ))}
      </div>
      <div className="md:col-span-2 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === userId ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-center text-sm text-muted-foreground mt-10">Say hello 👋</p>}
        </div>
        <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
          <Button type="submit" size="icon" className="bg-gradient-primary text-primary-foreground"><Send className="h-4 w-4" /></Button>
        </form>
      </div>
    </Card>
  );
}

function ProfileTab({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle().then(({ data }) => setProfile(data as Profile | null));
  }, [userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone, city: profile.city, bio: profile.bio,
    }).eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  if (!profile) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" />;

  return (
    <Card className="p-6 max-w-xl">
      <form onSubmit={save} className="space-y-4">
        <div><Label>Full name</Label><Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
        <div><Label>Phone</Label><Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
        <div><Label>City</Label><Input value={profile.city ?? ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
        <div><Label>Bio</Label><Textarea value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} /></div>
        <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save profile
        </Button>
      </form>
    </Card>
  );
}
