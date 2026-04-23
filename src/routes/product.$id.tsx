// Public product detail page with reviews
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, MapPin, Star, ShoppingCart, Loader2, Store, Package } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewForm } from "@/components/ReviewForm";
import { ContactShopButton } from "@/components/ContactShopButton";
import { WishlistButton } from "@/components/WishlistButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetail,
});

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
interface Vendor {
  id: string; owner_id: string; shop_name: string; slug: string; city: string | null; logo_url: string | null;
}
interface Review { id: string; rating: number; comment: string | null; created_at: string; author_id: string; }

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(50);
    setReviews((data ?? []) as Review[]);
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (!p) { setLoading(false); return; }
      setProduct(p as Product);
      const [{ data: v }] = await Promise.all([
        supabase.from("vendors").select("id, owner_id, shop_name, slug, city, logo_url").eq("id", p.vendor_id).maybeSingle(),
        loadReviews(),
      ]);
      setVendor(v as Vendor | null);
      setLoading(false);
    })();
  }, [id, loadReviews]);

  if (loading) {
    return <SiteShell><div className="mx-auto max-w-5xl px-6 py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></SiteShell>;
  }
  if (!product) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Product not found</h2>
          <Button asChild className="mt-4"><Link to="/marketplace" search={{ q: "", category: "" }}>Back to marketplace</Link></Button>
        </div>
      </SiteShell>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : Number(product.rating);

  const hasUserReviewed = user ? reviews.some((r) => r.author_id === user.id) : false;
  const outOfStock = product.stock <= 0;

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/marketplace", search: { q: "", category: "" } })} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to marketplace
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="overflow-hidden">
            <div className="aspect-square bg-secondary">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-6xl font-bold text-muted-foreground">
                  {product.name.charAt(0)}
                </div>
              )}
            </div>
          </Card>

          <div className="space-y-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm">
                {avgRating > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3 fill-warning text-warning" /> {avgRating.toFixed(1)} ({reviews.length})
                  </Badge>
                )}
                <Badge variant={outOfStock ? "destructive" : "outline"}>
                  {outOfStock ? "Out of stock" : `${product.stock} in stock`}
                </Badge>
              </div>
            </div>

            <div className="text-3xl font-bold text-primary">Rs {Number(product.price).toLocaleString()}</div>

            <p className="text-foreground/85 leading-relaxed whitespace-pre-line">
              {product.description ?? "No description provided."}
            </p>

            {vendor && (
              <Card className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {vendor.logo_url ? (
                    <img src={vendor.logo_url} alt={vendor.shop_name} className="h-full w-full object-cover" />
                  ) : vendor.shop_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Sold by</div>
                  <div className="font-semibold truncate">{vendor.shop_name}</div>
                  {vendor.city && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {vendor.city}
                    </div>
                  )}
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/shop/$slug" params={{ slug: vendor.slug }}>
                    <Store className="h-3.5 w-3.5 mr-1" /> Visit shop
                  </Link>
                </Button>
              </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                size="lg"
                disabled={outOfStock}
                className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-95"
                onClick={() => {
                  add({
                    product_id: product.id,
                    vendor_id: product.vendor_id,
                    name: product.name,
                    price: Number(product.price),
                    quantity: 1,
                  });
                  toast.success(`${product.name} added to cart`);
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Button>
              <WishlistButton productId={product.id} variant="full" />
              {vendor && user?.id !== vendor.owner_id && (
                <ContactShopButton otherUserId={vendor.owner_id} label="Message" />
              )}
            </div>
          </div>
        </div>

        <Card className="p-6 mt-8">
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
                  {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          {!user ? (
            <div className="border-t pt-4 mt-4 text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to leave a review.
            </div>
          ) : hasUserReviewed ? (
            <div className="border-t pt-4 mt-4 text-sm text-muted-foreground">
              You've already reviewed this product.
            </div>
          ) : (
            <ReviewForm productId={product.id} authorId={user.id} onSubmitted={loadReviews} />
          )}
        </Card>
      </div>
    </SiteShell>
  );
}
