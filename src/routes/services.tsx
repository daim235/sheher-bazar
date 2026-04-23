import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { Search, MapPin, Star, Filter } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Shahar Bazar" },
      { name: "description", content: "Browse trusted local service providers in your city. Filter by category, location, and ratings." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: ServicesPage,
});

interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number;
  price_unit: string | null;
  city: string | null;
  image_url: string | null;
  rating: number;
  reviews_count: number;
  category_id: string | null;
}
interface Category { id: string; name: string; name_ur: string | null; slug: string; }

function ServicesPage() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q);
  const [city, setCity] = useState(search.city);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("categories").select("*").eq("type", "service").then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    let qb = supabase.from("services").select("*").eq("is_active", true);
    if (search.q) qb = qb.ilike("title", `%${search.q}%`);
    if (search.city) qb = qb.ilike("city", `%${search.city}%`);
    if (search.category) {
      const cat = categories.find((c) => c.slug === search.category);
      if (cat) qb = qb.eq("category_id", cat.id);
    }
    qb.order("rating", { ascending: false }).limit(60).then(({ data }) => {
      setServices((data ?? []) as Service[]);
      setLoading(false);
    });
  }, [search.q, search.city, search.category, categories]);

  const applySearch = () => navigate({ to: "/services", search: { q, city, category: search.category } });

  return (
    <SiteShell>
      <section className="bg-gradient-hero text-primary-foreground py-12">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-3xl md:text-4xl font-bold">{t("nav.services")}</h1>
          <p className="mt-2 text-primary-foreground/85">Find trusted providers near you</p>
          <div className="mt-6 flex flex-col md:flex-row gap-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-1 px-3 bg-card/95 rounded-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("hero.search.service")} className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent text-foreground" />
            </div>
            <div className="flex items-center gap-2 md:w-56 px-3 bg-card/95 rounded-md">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("hero.search.city")} className="border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent text-foreground" />
            </div>
            <Button onClick={applySearch} size="lg" variant="secondary">{t("hero.search.btn")}</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Button
            variant={!search.category ? "default" : "outline"}
            size="sm"
            onClick={() => navigate({ to: "/services", search: (p: { q: string; city: string; category: string }) => ({ ...p, category: "" }) })}
          >
            {t("filter.allCategories")}
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={search.category === c.slug ? "default" : "outline"}
              size="sm"
              onClick={() => navigate({ to: "/services", search: (p: { q: string; city: string; category: string }) => ({ ...p, category: c.slug }) })}
              className="whitespace-nowrap"
            >
              {lang === "ur" ? c.name_ur ?? c.name : c.name}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const { t } = useI18n();
  return (
    <Link to="/service/$id" params={{ id: service.id }}>
      <Card className="overflow-hidden hover:shadow-elegant hover:-translate-y-0.5 transition-base bg-gradient-card group">
        <div className="aspect-[16/9] bg-gradient-primary relative overflow-hidden">
          {service.image_url ? (
            <img src={service.image_url} alt={service.title} className="h-full w-full object-cover group-hover:scale-105 transition-base" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary-foreground/80 text-2xl font-bold">
              {service.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold line-clamp-1">{service.title}</h3>
            {service.rating > 0 && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {Number(service.rating).toFixed(1)}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {service.city ?? "—"}
            </div>
            <div className="text-sm font-bold text-primary">
              {t("common.from")} Rs {Number(service.price).toLocaleString()}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function EmptyState() {
  const { t } = useI18n();
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-accent flex items-center justify-center">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{t("common.empty")}</h3>
      <p className="text-sm text-muted-foreground mt-1">No services match your filters yet. Try adjusting them.</p>
      <Button asChild className="mt-5">
        <Link to="/auth">List your service</Link>
      </Button>
    </Card>
  );
}
