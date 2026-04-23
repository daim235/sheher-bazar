import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminSetVendorStatus,
  adminSetProviderStatus,
  listPendingVendors,
  listPendingProviders,
} from "@/lib/api/approvals";
import { Loader2, ShieldCheck, Store, Users, Package, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Shahar Bazar" },
      { name: "description", content: "Admin control panel for Shahar Bazar." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 max-w-md text-center">
          <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only administrators can view this page.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Go home</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Admin Portal</h1>
              <Badge variant="secondary">Shahar Bazar</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/">Back to site</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Tabs defaultValue="vendors">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="vendors" className="gap-1.5">
              <Store className="h-4 w-4" /> Vendors
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-1.5">
              <Users className="h-4 w-4" /> Providers
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1.5">
              <Package className="h-4 w-4" /> Orders
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5">
              <Calendar className="h-4 w-4" /> Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors" className="mt-6">
            <VendorsPanel />
          </TabsContent>
          <TabsContent value="providers" className="mt-6">
            <ProvidersPanel />
          </TabsContent>
          <TabsContent value="orders" className="mt-6">
            <OrdersPanel />
          </TabsContent>
          <TabsContent value="bookings" className="mt-6">
            <BookingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ---------- Vendors ----------
function VendorsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("vendors").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const reason =
      status === "rejected" ? window.prompt("Reason for rejection (optional):") ?? undefined : undefined;
    try {
      await adminSetVendorStatus(id, status, reason);
      toast.success(`Vendor ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Vendor applications</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-sm rounded-md border bg-background px-2 py-1.5"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vendors found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shop</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="font-medium">{v.shop_name}</div>
                  <div className="text-xs text-muted-foreground">{v.slug}</div>
                  {v.contact_email && (
                    <a
                      href={`mailto:${v.contact_email}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {v.contact_email}
                    </a>
                  )}
                </TableCell>
                <TableCell>{v.city ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={v.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {v.status !== "approved" && (
                    <Button size="sm" onClick={() => decide(v.id, "approved")}>
                      Approve
                    </Button>
                  )}
                  {v.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => decide(v.id, "rejected")}>
                      Reject
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

// ---------- Providers ----------
function ProvidersPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const load = async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("provider_applied_at", { ascending: false });
    if (filter !== "all") query = query.eq("provider_status", filter);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows((data ?? []).filter((p: any) => filter === "all" ? p.provider_status !== "none" : true));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    const reason =
      status === "rejected" ? window.prompt("Reason for rejection (optional):") ?? undefined : undefined;
    try {
      await adminSetProviderStatus(id, status, reason);
      toast.success(`Provider ${status}`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Service provider applications</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-sm rounded-md border bg-background px-2 py-1.5"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No applications found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{p.phone ?? ""}</div>
                  {p.contact_email && (
                    <a
                      href={`mailto:${p.contact_email}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {p.contact_email}
                    </a>
                  )}
                </TableCell>
                <TableCell className="max-w-[260px] truncate">{p.provider_skills ?? "—"}</TableCell>
                <TableCell>{p.city ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={p.provider_status} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {p.provider_status !== "approved" && (
                    <Button size="sm" onClick={() => decide(p.id, "approved")}>
                      Approve
                    </Button>
                  )}
                  {p.provider_status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => decide(p.id, "rejected")}>
                      Reject
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

// ---------- Orders ----------
function OrdersPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, vendors(shop_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) toast.error(error.message);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">Recent orders</h2>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                <TableCell>{o.vendors?.shop_name ?? "—"}</TableCell>
                <TableCell>Rs {Number(o.total).toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

// ---------- Bookings ----------
function BookingsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, services(title)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) toast.error(error.message);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-4">Recent bookings</h2>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}</TableCell>
                <TableCell>{b.services?.title ?? "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={b.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {b.scheduled_for ? new Date(b.scheduled_for).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(b.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    confirmed: "bg-sky-100 text-sky-800",
    accepted: "bg-sky-100 text-sky-800",
    delivered: "bg-emerald-100 text-emerald-800",
    completed: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-zinc-200 text-zinc-700",
    none: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variant[status] ?? "bg-zinc-100 text-zinc-700"}`}>
      {status}
    </span>
  );
}
