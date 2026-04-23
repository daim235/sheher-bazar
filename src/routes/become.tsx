import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  applyAsVendor,
  applyAsProvider,
  getMyVendor,
} from "@/lib/api/approvals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Store, Wrench, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/become")({
  head: () => ({
    meta: [
      { title: "Become a Vendor or Service Provider — Shahar Bazar" },
      {
        name: "description",
        content:
          "Apply to sell on Shahar Bazar as a vendor or list your services as a provider in Sargodha.",
      },
    ],
  }),
  component: BecomePage,
});

type ApprovalStatus = "pending" | "approved" | "rejected";
type ProviderStatus = "none" | "pending" | "approved" | "rejected";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function BecomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-3xl md:text-4xl font-bold">Join Shahar Bazar</h1>
          <p className="text-primary-foreground/85 mt-2 max-w-2xl">
            Apply once. Our admin team reviews your application and you'll be
            notified the moment you're approved.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 -mt-6 pb-16">
        <Tabs defaultValue="vendor">
          <TabsList className="bg-card shadow-soft grid grid-cols-2 w-full">
            <TabsTrigger value="vendor" className="gap-1.5">
              <Store className="h-4 w-4" /> Vendor / Shop
            </TabsTrigger>
            <TabsTrigger value="provider" className="gap-1.5">
              <Wrench className="h-4 w-4" /> Service Provider
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendor" className="mt-6">
            <VendorApplicationCard userId={user.id} />
          </TabsContent>

          <TabsContent value="provider" className="mt-6">
            <ProviderApplicationCard userId={user.id} />
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By applying you agree to Shahar Bazar's vendor terms and accurate
          information policy.
        </p>
      </div>
    </div>
  );
}

// ---------------- Vendor ----------------
function VendorApplicationCard({ userId }: { userId: string }) {
  const [existing, setExisting] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("Sargodha");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const v = await getMyVendor();
      setExisting(v);
      if (v) {
        setShopName(v.shop_name ?? "");
        setSlug(v.slug ?? "");
        setCity(v.city ?? "Sargodha");
        setDescription(v.description ?? "");
        setLogoUrl(v.logo_url ?? "");
        setContactEmail(v.contact_email ?? "");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      toast.error("Please enter a valid contact email (Gmail)");
      return;
    }
    setSubmitting(true);
    try {
      await applyAsVendor({
        shop_name: shopName.trim(),
        slug: (slug || slugify(shopName)).trim(),
        city: city.trim() || undefined,
        description: description.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        contact_email: contactEmail.trim(),
      });
      toast.success("Application submitted! Admin will review shortly.");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to apply");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Card className="p-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  if (existing) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold">{existing.shop_name}</h2>
            <p className="text-sm text-muted-foreground">/{existing.slug}</p>
          </div>
          <StatusBadge status={existing.status as ApprovalStatus} />
        </div>

        {existing.status === "pending" && (
          <p className="text-sm text-muted-foreground">
            Your shop is awaiting admin approval. You'll receive a notification
            once it's reviewed.
          </p>
        )}
        {existing.status === "approved" && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            🎉 Your shop is live! Add products from your dashboard.
          </p>
        )}
        {existing.status === "rejected" && (
          <div className="rounded-md bg-rose-50 dark:bg-rose-950/30 p-3 text-sm">
            <p className="font-medium text-rose-800 dark:text-rose-200">
              Application rejected
            </p>
            {existing.rejection_reason && (
              <p className="text-rose-700 dark:text-rose-300 mt-1">
                Reason: {existing.rejection_reason}
              </p>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 text-sm pt-2 border-t border-border">
          <div>
            <span className="text-muted-foreground">City:</span>{" "}
            <span className="font-medium">{existing.city ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Submitted:</span>{" "}
            <span className="font-medium">
              {new Date(existing.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {existing.status === "approved" && (
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-1">Open your shop</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Tell us about your shop. After approval, you'll be able to list products.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="shop_name">Shop name *</Label>
          <Input
            id="shop_name"
            value={shopName}
            onChange={(e) => {
              setShopName(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            placeholder="e.g. Sargodha Fresh Mart"
            required
          />
        </div>

        <div>
          <Label htmlFor="slug">Shop URL slug</Label>
          <div className="flex items-center rounded-md border bg-background overflow-hidden">
            <span className="px-3 text-xs text-muted-foreground select-none">
              shaharbazar.com/shop/
            </span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="sargodha-fresh-mart"
              className="border-0 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sargodha"
            />
          </div>
          <div>
            <Label htmlFor="logo">Logo URL (optional)</Label>
            <Input
              id="logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="vendor_email">Contact email (Gmail) *</Label>
          <Input
            id="vendor_email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="yourshop@gmail.com"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            We'll use this email to reach you about your shop.
          </p>
        </div>

        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you sell? Where are you located?"
            rows={4}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit application
        </Button>
      </form>
    </Card>
  );
}

// ---------------- Provider ----------------
function ProviderApplicationCard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Sargodha");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) toast.error(error.message);
    setProfile(data);
    if (data) {
      setSkills(data.provider_skills ?? "");
      setBio(data.bio ?? "");
      setPhone(data.phone ?? "");
      setCity(data.city ?? "Sargodha");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skills.trim()) {
      toast.error("Please describe your skills");
      return;
    }
    setSubmitting(true);
    try {
      await applyAsProvider({
        skills: skills.trim(),
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
      });
      toast.success("Application submitted! Admin will review shortly.");
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to apply");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <Card className="p-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  const status: ProviderStatus = (profile?.provider_status ?? "none") as ProviderStatus;
  const hasApplied = status !== "none";

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <h2 className="text-xl font-bold">List your services</h2>
          <p className="text-sm text-muted-foreground">
            Tell customers what you do. Once approved, you'll appear in service
            listings.
          </p>
        </div>
        {hasApplied && <StatusBadge status={status as any} />}
      </div>

      {status === "approved" && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
          🎉 You're an approved provider. Add services from your dashboard.
        </p>
      )}
      {status === "pending" && (
        <p className="text-sm text-muted-foreground mb-4">
          Your application is awaiting admin approval. You can update your
          details below — re-submitting keeps you in the pending queue.
        </p>
      )}
      {status === "rejected" && profile?.provider_rejection_reason && (
        <div className="rounded-md bg-rose-50 dark:bg-rose-950/30 p-3 text-sm mb-4">
          <p className="font-medium text-rose-800 dark:text-rose-200">
            Previous application rejected
          </p>
          <p className="text-rose-700 dark:text-rose-300 mt-1">
            Reason: {profile.provider_rejection_reason}
          </p>
          <p className="text-rose-700 dark:text-rose-300 mt-1">
            Update your details and re-submit below.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 mt-4">
        <div>
          <Label htmlFor="skills">Skills / services *</Label>
          <Input
            id="skills"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Plumbing, Electrical work, AC repair"
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03xx-xxxxxxx"
              inputMode="tel"
            />
          </div>
          <div>
            <Label htmlFor="pcity">City</Label>
            <Input
              id="pcity"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Sargodha"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">About you</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Years of experience, areas you serve, certifications…"
            rows={4}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-primary text-primary-foreground"
        >
          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {hasApplied ? "Update & re-submit" : "Submit application"}
        </Button>

        {status === "approved" && (
          <Button
            asChild
            variant="outline"
            className="w-full"
          >
            <Link to="/dashboard" search={{ tab: "listings", c: "" }}>
              Add a service
            </Link>
          </Button>
        )}
      </form>
    </Card>
  );
}

function StatusBadge({ status }: { status: ApprovalStatus | ProviderStatus }) {
  if (status === "approved")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 gap-1">
        <XCircle className="h-3 w-3" /> Rejected
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
        <Clock className="h-3 w-3" /> Pending review
      </Badge>
    );
  return <Badge variant="secondary">{status}</Badge>;
}
