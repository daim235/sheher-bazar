// Public vendor shop page
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Star, ShoppingBag, Loader2, Store } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug")({
  component: ShopPage,
});

interface Vendor {
  id: string;
  shop_name: string;
  slug: string;
  description: string | null;
  city: string | null;
  logo_url: string | null;
  banner_url: string | null;
  rating: number;
}
interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  rating: number;
  stock: number;
  is_active: boolean;
}

function ShopPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase
        .from("vendors")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (!v) {
        setLoading(false);
        return;
      }
      setVendor(v as Vendor);
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("vendor_id", v.id)
        .eq("is_active", true)
        .order("rating", { ascending: false });
      setProducts((p ?? []) as Product[]);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-5xl px-6 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }

  if (!vendor) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Shop not found</h1>
          <p className="mt-2 text-muted-foreground">This shop may not be approved yet.</p>
          <Button asChild className="mt-6">
            <Link to="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="relative h-48 md:h-64 bg-gradient-warm overflow-hidden">
        {vendor.banner_url && (
          <img src={vendor.banner_url} alt="" className="h-full w-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-16 relative">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/marketplace", search: { q: "", category: "" } })} className="mb-3 bg-card/80 backdrop-blur">
          <ArrowLeft className="h-4 w-4 mr-1" /> Marketplace
        </Button>
        <Card className="p-6 flex items-center gap-5 flex-wrap">
          <div className="h-24 w-24 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-3xl font-bold overflow-hidden shrink-0">
            {vendor.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.shop_name} className="h-full w-full object-cover" />
            ) : (
              vendor.shop_name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold">{vendor.shop_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {vendor.city && (
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {vendor.city}</span>
              )}
              {vendor.rating > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-warning text-warning" /> {Number(vendor.rating).toFixed(1)}
                </Badge>
              )}
              <Badge variant="outline">Approved vendor</Badge>
            </div>
            {vendor.description && (
              <p className="mt-3 text-sm text-foreground/80">{vendor.description}</p>
            )}
          </div>
        </Card>

        <section className="mt-8 pb-12">
          <h2 className="text-xl font-bold mb-4">Products ({products.length})</h2>
          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">This shop hasn't added products yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <Card key={p.id} className="overflow-hidden hover:shadow-elegant transition-base bg-gradient-card group">
                  <Link to="/product/$id" params={{ id: p.id }} className="block">
                    <div className="aspect-square bg-secondary relative overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-base" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                          {p.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to="/product/$id" params={{ id: p.id }}>
                      <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors">{p.name}</h3>
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-primary">Rs {Number(p.price).toLocaleString()}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          add({
                            product_id: p.id,
                            vendor_id: p.vendor_id,
                            name: p.name,
                            price: Number(p.price),
                            quantity: 1,
                          });
                          toast.success(`${p.name} added to cart`);
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
