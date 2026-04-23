import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Star, Filter } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — Shahar Bazar" },
      { name: "description", content: "Shop products from local vendors and small businesses in your city." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: MarketplacePage,
});

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  rating: number;
  vendor_id: string;
  category_id: string | null;
}
interface Category { id: string; name: string; name_ur: string | null; slug: string; }

function MarketplacePage() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("categories").select("*").eq("type", "product").then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let qb = supabase.from("products").select("*").eq("is_active", true);
    if (search.q) qb = qb.ilike("name", `%${search.q}%`);
    if (search.category) {
      const cat = categories.find((c) => c.slug === search.category);
      if (cat) qb = qb.eq("category_id", cat.id);
    }
    qb.order("rating", { ascending: false }).limit(60).then(({ data }) => {
      setProducts((data ?? []) as Product[]);
      setLoading(false);
    });
  }, [search.q, search.category, categories]);

  return (
    <SiteShell>
      <section className="bg-gradient-warm text-primary-foreground py-12">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-3xl md:text-4xl font-bold">{t("nav.marketplace")}</h1>
          <p className="mt-2 text-primary-foreground/90">Shop from local vendors</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-1 px-3 bg-card/95 rounded-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent text-foreground" />
            </div>
            <Button size="lg" variant="secondary" onClick={() => navigate({ to: "/marketplace", search: (p: { q: string; category: string }) => ({ ...p, q }) })}>
              {t("hero.search.btn")}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Button
            variant={!search.category ? "default" : "outline"}
            size="sm"
            onClick={() => navigate({ to: "/marketplace", search: (p: { q: string; category: string }) => ({ ...p, category: "" }) })}
          >
            {t("filter.allCategories")}
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={search.category === c.slug ? "default" : "outline"}
              size="sm"
              onClick={() => navigate({ to: "/marketplace", search: (p: { q: string; category: string }) => ({ ...p, category: c.slug }) })}
              className="whitespace-nowrap"
            >
              {lang === "ur" ? c.name_ur ?? c.name : c.name}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-accent flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">No products yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Be the first vendor to list your products.</p>
            <Button asChild className="mt-5"><Link to="/auth">Open a shop</Link></Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-base bg-gradient-card group">
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-base" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
            {product.name.charAt(0)}
          </div>
        )}
        {product.rating > 0 && (
          <Badge className="absolute top-2 right-2 gap-1 bg-card text-foreground border">
            <Star className="h-3 w-3 fill-warning text-warning" /> {Number(product.rating).toFixed(1)}
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-primary">Rs {Number(product.price).toLocaleString()}</span>
          <Button size="sm" variant="ghost" onClick={() => toast.success(`${product.name} added to cart`)}>
            {t("common.addToCart")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
