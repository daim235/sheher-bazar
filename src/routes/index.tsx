import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, MapPin, Wrench, Zap, Car, Hammer, Sparkles, Paintbrush, Wind, BookOpen, ShoppingBasket, Smartphone, Shirt, Home as HomeIcon, Star, MessageCircle, ShieldCheck, Clock } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-bazar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shahar Bazar — Find trusted local services & shops" },
      { name: "description", content: "Book plumbers, electricians, mechanics and shop from local vendors. Your city's trusted marketplace." },
      { property: "og:title", content: "Shahar Bazar — Find trusted local services & shops" },
      { property: "og:description", content: "Book plumbers, electricians, mechanics and shop from local vendors." },
    ],
  }),
  component: HomePage,
});

const iconMap: Record<string, any> = {
  Wrench, Zap, Car, Hammer, Sparkles, Paintbrush, Wind, BookOpen,
  ShoppingBasket, Smartphone, Shirt, Home: HomeIcon,
};

interface Category {
  id: string;
  name: string;
  name_ur: string | null;
  slug: string;
  icon: string | null;
  type: "service" | "product";
}

function HomePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [serviceCats, setServiceCats] = useState<Category[]>([]);
  const [productCats, setProductCats] = useState<Category[]>([]);

  useEffect(() => {
    supabase.from("categories").select("*").then(({ data }) => {
      if (!data) return;
      setServiceCats(data.filter((c) => c.type === "service") as Category[]);
      setProductCats(data.filter((c) => c.type === "product") as Category[]);
    });
  }, []);

  const handleSearch = () => {
    navigate({ to: "/services", search: { q, city, category: "" } });
  };

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <img
          src={heroImg}
          alt="Bustling local bazaar with vendors and service workers"
          className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-40"
          width={1536}
          height={1024}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28 text-primary-foreground">
          <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 backdrop-blur mb-4">
            {t("hero.tag")}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-[1.1]">
            {t("hero.title")}
          </h1>
          <p className="mt-5 text-base md:text-lg text-primary-foreground/85 max-w-2xl">
            {t("hero.subtitle")}
          </p>

          <Card className="mt-8 p-3 md:p-3 bg-card/95 backdrop-blur border-0 shadow-elegant max-w-3xl">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("hero.search.service")}
                  className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground"
                />
              </div>
              <div className="hidden md:block w-px bg-border" />
              <div className="flex items-center gap-2 md:w-56 px-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("hero.search.city")}
                  className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground"
                />
              </div>
              <Button onClick={handleSearch} size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-95">
                {t("hero.search.btn")}
              </Button>
            </div>
          </Card>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-primary-foreground/85">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verified providers</div>
            <div className="flex items-center gap-2"><Star className="h-4 w-4" /> Real reviews</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Same-day booking</div>
          </div>
        </div>
      </section>

      {/* SERVICE CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t("section.popular")}</h2>
            <p className="text-muted-foreground mt-1">Browse services by type</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/services">{t("common.viewAll")} →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {serviceCats.map((c) => {
            const Icon = iconMap[c.icon ?? ""] ?? Wrench;
            return (
              <Link
                key={c.id}
                to="/services"
                search={{ q: "", city: "", category: c.slug }}
                className="group"
              >
                <Card className="p-4 flex flex-col items-center text-center gap-2 hover:shadow-elegant hover:border-primary/40 transition-base bg-gradient-card">
                  <div className="h-12 w-12 rounded-xl bg-accent/60 group-hover:bg-gradient-primary group-hover:text-primary-foreground flex items-center justify-center transition-base">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium">
                    {lang === "ur" ? c.name_ur ?? c.name : c.name}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center">{t("section.how")}</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, k: "1" },
              { icon: MessageCircle, k: "2" },
              { icon: ShieldCheck, k: "3" },
            ].map(({ icon: Icon, k }) => (
              <Card key={k} className="p-7 bg-card border-0 shadow-soft hover:shadow-elegant transition-base">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{t(`how.${k}.title`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`how.${k}.body`)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">{t("section.shops")}</h2>
            <p className="text-muted-foreground mt-1">Discover local marketplace</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/marketplace">{t("common.viewAll")} →</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {productCats.map((c) => {
            const Icon = iconMap[c.icon ?? ""] ?? ShoppingBasket;
            return (
              <Link key={c.id} to="/marketplace" search={{ q: "", category: c.slug }}>
                <Card className="p-6 hover:shadow-elegant hover:-translate-y-0.5 transition-base bg-gradient-card group">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-warm text-primary-foreground flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">{lang === "ur" ? c.name_ur ?? c.name : c.name}</div>
                      <div className="text-xs text-muted-foreground">Shop now →</div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <Card className="p-10 md:p-14 bg-gradient-primary text-primary-foreground border-0 shadow-elegant overflow-hidden relative">
          <div className="relative max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-bold">Become a provider on Shahar Bazar</h3>
            <p className="mt-2 text-primary-foreground/90">
              Reach thousands of customers in your city. Set your prices, manage bookings, and grow your business.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild size="lg" variant="secondary" className="shadow-md">
                <Link to="/auth">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/services">Browse services</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </SiteShell>
  );
}
