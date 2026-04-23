import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useEffect, useMemo, useState } from "react";
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
import { Loader2, Plus, MessageCircle, Send, Pencil, Trash2, Store, Package, ShoppingBag, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { getMyVendorOrders, updateOrderStatus, type OrderStatus } from "@/lib/api/orders";

const dashSearch = z.object({
  tab: fallback(
    z.enum(["bookings", "listings", "shop", "products", "orders", "stats", "messages", "profile"]),
    "bookings"
  ).default("bookings"),
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
  agreed_price: number;
  commission_amount: number;
  commission_pct: number;
  created_at: string;
}
interface Service {
  id: string; title: string; description: string | null; price: number; city: string | null; is_active: boolean;
}
interface Conversation { id: string; user1_id: string; user2_id: string; last_message_at: string; }
interface Message { id: string; conversation_id: string; sender_id: string; content: string; created_at: string; }
interface Profile { id: string; full_name: string | null; phone: string | null; city: string | null; bio: string | null; }
interface Vendor {
  id: string; owner_id: string; shop_name: string; slug: string; description: string | null;
  city: string | null; logo_url: string | null; banner_url: string | null; status: string;
  contact_email: string | null;
}
interface Product {
  id: string; vendor_id: string; name: string; description: string | null; price: number;
  image_url: string | null; stock: number; is_active: boolean;
}

function Dashboard() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) { setVendorLoading(false); return; }
    supabase.from("vendors").select("*").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      setVendor(data as Vendor | null);
      setVendorLoading(false);
    });
  }, [user]);

  if (loading || !user || vendorLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isApprovedVendor = vendor?.status === "approved";

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("dash.welcome")}</h1>
            <p className="text-primary-foreground/85 text-sm mt-1">{user.email}</p>
            {vendor && (
              <Badge variant="secondary" className="mt-2">
                Shop: {vendor.shop_name} · {vendor.status}
              </Badge>
            )}
          </div>
          <Button asChild variant="secondary" size="sm"><Link to="/">← Home</Link></Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-6 pb-12">
        <Tabs value={search.tab} onValueChange={(v) => navigate({ to: "/dashboard", search: (p) => ({ ...p, tab: v as typeof search.tab }) })}>
          <TabsList className="bg-card shadow-soft flex-wrap h-auto">
            <TabsTrigger value="bookings">{t("dash.bookings")}</TabsTrigger>
            <TabsTrigger value="listings">{t("dash.listings")}</TabsTrigger>
            {vendor && <TabsTrigger value="shop"><Store className="h-3.5 w-3.5 mr-1" /> Shop</TabsTrigger>}
            {isApprovedVendor && <TabsTrigger value="products"><Package className="h-3.5 w-3.5 mr-1" /> Products</TabsTrigger>}
            {isApprovedVendor && <TabsTrigger value="orders"><ShoppingBag className="h-3.5 w-3.5 mr-1" /> Orders</TabsTrigger>}
            {isApprovedVendor && <TabsTrigger value="stats"><BarChart3 className="h-3.5 w-3.5 mr-1" /> Stats</TabsTrigger>}
            <TabsTrigger value="messages">{t("dash.messages")}</TabsTrigger>
            <TabsTrigger value="profile">{t("dash.profile")}</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6"><BookingsTab userId={user.id} /></TabsContent>
          <TabsContent value="listings" className="mt-6"><ListingsTab userId={user.id} /></TabsContent>
          {vendor && <TabsContent value="shop" className="mt-6"><ShopTab vendor={vendor} onUpdate={setVendor} /></TabsContent>}
          {isApprovedVendor && vendor && <TabsContent value="products" className="mt-6"><ProductsTab vendorId={vendor.id} /></TabsContent>}
          {isApprovedVendor && <TabsContent value="orders" className="mt-6"><VendorOrdersTab /></TabsContent>}
          {isApprovedVendor && vendor && <TabsContent value="stats" className="mt-6"><StatsTab vendorId={vendor.id} /></TabsContent>}
          <TabsContent value="messages" className="mt-6"><MessagesTab userId={user.id} initialConvo={search.c} /></TabsContent>
          <TabsContent value="profile" className="mt-6"><ProfileTab userId={user.id} /></TabsContent>
        </Tabs>

        {!vendor && (
          <Card className="mt-6 p-6 bg-gradient-card border-dashed">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><Store className="h-4 w-4" /> Want to sell on Shahar Bazar?</h3>
                <p className="text-sm text-muted-foreground mt-1">Open your own shop, list products, and start receiving orders.</p>
              </div>
              <Button asChild className="bg-gradient-primary text-primary-foreground">
                <Link to="/become">Become a vendor</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// =================== BOOKINGS (with commission for providers) ===================
function BookingsTab({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<(Booking & { service: Service | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*, service:services(*)")
      .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
      .order("created_at", { ascending: false });
    setBookings((data ?? []) as unknown as (Booking & { service: Service | null })[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as never }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };

  const providerBookings = bookings.filter((b) => b.provider_id === userId);
  const totalEarnings = providerBookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (Number(b.agreed_price) - Number(b.commission_amount)), 0);
  const totalCommission = providerBookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + Number(b.commission_amount), 0);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" />;
  if (bookings.length === 0) return <Card className="p-10 text-center"><p className="text-muted-foreground">No bookings yet.</p><Button asChild className="mt-4"><Link to="/services">Browse services</Link></Button></Card>;

  return (
    <div className="space-y-4">
      {providerBookings.length > 0 && (
        <Card className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gradient-card">
          <div>
            <div className="text-xs text-muted-foreground">Completed bookings</div>
            <div className="text-xl font-bold">{providerBookings.filter((b) => b.status === "completed").length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Net earnings</div>
            <div className="text-xl font-bold text-primary">Rs {totalEarnings.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Platform commission</div>
            <div className="text-xl font-bold text-accent-orange">Rs {totalCommission.toLocaleString()}</div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {bookings.map((b) => {
          const isProvider = b.provider_id === userId;
          return (
            <Card key={b.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold">{b.service?.title ?? "Service"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {b.scheduled_for ? new Date(b.scheduled_for).toLocaleString() : "Not scheduled"} · {b.address ?? "—"}
                </div>
                {b.notes && <p className="text-sm mt-2">{b.notes}</p>}
                <div className="text-xs mt-2 flex flex-wrap gap-3">
                  <span>Price: <strong>Rs {Number(b.agreed_price).toLocaleString()}</strong></span>
                  {isProvider && Number(b.commission_amount) > 0 && (
                    <>
                      <span className="text-accent-orange">Commission ({b.commission_pct}%): Rs {Number(b.commission_amount).toLocaleString()}</span>
                      <span className="text-primary">You earn: Rs {(Number(b.agreed_price) - Number(b.commission_amount)).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant={b.status === "completed" ? "default" : b.status === "cancelled" ? "destructive" : "secondary"}>{b.status}</Badge>
              {isProvider && b.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateStatus(b.id, "confirmed")}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")}>Decline</Button>
                </div>
              )}
              {isProvider && b.status === "confirmed" && (
                <Button size="sm" onClick={() => updateStatus(b.id, "completed")}>Mark completed</Button>
              )}
              {b.customer_id === userId && b.status === "pending" && (
                <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "cancelled")}>Cancel</Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =================== SERVICE LISTINGS (provider) ===================
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

// =================== SHOP SETTINGS (vendor) ===================
function ShopTab({ vendor, onUpdate }: { vendor: Vendor; onUpdate: (v: Vendor) => void }) {
  const [form, setForm] = useState<Vendor>(vendor);
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("vendors")
      .update({
        shop_name: form.shop_name,
        description: form.description,
        city: form.city,
        logo_url: form.logo_url,
        banner_url: form.banner_url,
        contact_email: form.contact_email,
      })
      .eq("id", vendor.id)
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Shop saved");
    onUpdate(data as Vendor);
  };

  return (
    <Card className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-semibold text-lg">Shop settings</h2>
          <p className="text-xs text-muted-foreground">Public URL: <code>/shop/{vendor.slug}</code></p>
        </div>
        {vendor.status === "approved" && (
          <Button asChild variant="outline" size="sm">
            <Link to="/shop/$slug" params={{ slug: vendor.slug }}>View public page →</Link>
          </Button>
        )}
      </div>
      {vendor.status !== "approved" && (
        <Card className="p-3 mb-4 bg-warning/10 border-warning/30 text-sm">
          Your shop is <strong>{vendor.status}</strong>. It'll be visible publicly once approved by an admin.
        </Card>
      )}
      <form onSubmit={save} className="space-y-3">
        <div><Label>Shop name</Label><Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} required /></div>
        <div><Label>Contact email</Label><Input type="email" value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
        <div><Label>City</Label><Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Logo URL</Label><Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" /></div>
          <div><Label>Banner URL</Label><Input value={form.banner_url ?? ""} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} placeholder="https://…" /></div>
        </div>
        <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save shop
        </Button>
      </form>
    </Card>
  );
}

// =================== PRODUCTS (vendor) ===================
function ProductsTab({ vendorId }: { vendorId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const blank = { name: "", description: "", price: "", image_url: "", stock: "1" };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, [vendorId]);

  const openNew = () => { setEditing(null); setForm(blank); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      image_url: p.image_url ?? "",
      stock: String(p.stock),
    });
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      vendor_id: vendorId,
      name: form.name,
      description: form.description || null,
      price: Number(form.price) || 0,
      image_url: form.image_url || null,
      stock: Number(form.stock) || 0,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Product updated" : "Product added");
    setOpen(false);
    load();
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast.error(error.message); else load();
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Your products ({products.length})</h2>
        <Button onClick={openNew} className="bg-gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add product
        </Button>
      </div>

      {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" /> :
        products.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">No products yet. Add your first product to start selling.</Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="aspect-video bg-secondary relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {p.name.charAt(0)}
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2" variant={p.is_active ? "default" : "secondary"}>
                    {p.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                    <span className="font-bold text-primary shrink-0">Rs {Number(p.price).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">{p.description ?? "—"}</p>
                  <div className="text-xs text-muted-foreground mt-2">Stock: {p.stock}</div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(p)}>
                      {p.is_active ? "Hide" : "Show"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      }

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (Rs)</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
              <div><Label>Stock</Label><Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {editing ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== VENDOR ORDERS ===================
interface VendorOrder {
  id: string;
  customer_id: string;
  total: number;
  status: OrderStatus;
  shipping_address: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  items: { id: string; product_name: string; unit_price: number; quantity: number }[];
}
function VendorOrdersTab() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyVendorOrders();
      setOrders(data as unknown as VendorOrder[]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      toast.success(`Order ${status}`);
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" />;
  if (orders.length === 0) return <Card className="p-10 text-center text-muted-foreground">No orders yet. Once customers buy, they show up here.</Card>;

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id} className="p-5">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              <div className="font-semibold">Order #{o.id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <Badge variant={o.status === "delivered" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"}>
              {o.status}
            </Badge>
          </div>
          <ul className="mt-3 text-sm space-y-1">
            {o.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.quantity}× {it.product_name}</span>
                <span>Rs {(Number(it.unit_price) * it.quantity).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between items-center text-sm border-t pt-3">
            <div>
              <div className="text-xs text-muted-foreground">{o.shipping_address}</div>
              <div className="text-xs">📞 {o.phone}</div>
            </div>
            <div className="font-bold text-primary">Total: Rs {Number(o.total).toLocaleString()}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {o.status === "pending" && <Button size="sm" onClick={() => setStatus(o.id, "confirmed")}>Confirm</Button>}
            {o.status === "confirmed" && <Button size="sm" onClick={() => setStatus(o.id, "shipped")}>Mark shipped</Button>}
            {o.status === "shipped" && <Button size="sm" onClick={() => setStatus(o.id, "delivered")}>Mark delivered</Button>}
            {(o.status === "pending" || o.status === "confirmed") && (
              <Button size="sm" variant="outline" onClick={() => setStatus(o.id, "cancelled")}>Cancel</Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

// =================== STATS ===================
function StatsTab({ vendorId }: { vendorId: string }) {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyVendorOrders();
        setOrders(data as unknown as VendorOrder[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "delivered");
    const revenue = completed.reduce((s, o) => s + Number(o.total), 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    const totalItems = orders.reduce((s, o) => s + o.items.reduce((x, it) => x + it.quantity, 0), 0);
    const productCount = new Map<string, number>();
    orders.forEach((o) => o.items.forEach((it) => {
      productCount.set(it.product_name, (productCount.get(it.product_name) ?? 0) + it.quantity);
    }));
    const topProducts = Array.from(productCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { revenue, completed: completed.length, pending, totalItems, total: orders.length, topProducts };
  }, [orders]);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mt-10" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total revenue</div>
          <div className="text-2xl font-bold text-primary mt-1">Rs {stats.revenue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">From delivered orders</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total orders</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-1">{stats.pending} pending</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Delivered</div>
          <div className="text-2xl font-bold mt-1">{stats.completed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Items sold</div>
          <div className="text-2xl font-bold mt-1">{stats.totalItems}</div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3">Top products</h3>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <ul className="space-y-2">
            {stats.topProducts.map(([name, qty]) => (
              <li key={name} className="flex justify-between text-sm">
                <span className="truncate pr-3">{name}</span>
                <span className="font-semibold">{qty} sold</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// =================== MESSAGES ===================
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
    const profMap = new Map((profs ?? []).map((p: Profile) => [p.id, p]));
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

// =================== PROFILE ===================
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
