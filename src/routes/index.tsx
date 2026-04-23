import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Sparkles,
  Truck,
  Store,
  ShieldCheck,
  Lock,
  Star,
  Wrench,
  ShoppingBag,
} from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import heroImg from "@/assets/hero-sargodha.jpg";
import groceryImg from "@/assets/cat-grocery.jpg";
import servicesImg from "@/assets/cat-services.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shahar Bazar — Sargodha's Own Online Marketplace" },
      {
        name: "description",
        content:
          "Shop from your favorite local stores in Sargodha. Groceries, services, and more — delivered same-day.",
      },
      { property: "og:title", content: "Shahar Bazar — Sargodha's Own Online Marketplace" },
      {
        property: "og:description",
        content:
          "Shop from your favorite local stores in Sargodha. Groceries, services, and more — delivered same-day.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/marketplace", search: { q, category: "" } });
  };

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Bustling bazaar street in Sargodha decorated with Pakistani flags"
          className="absolute inset-0 h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/75 to-primary/90" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-32 text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-foreground/15 backdrop-blur border border-primary-foreground/20">
            <Sparkles className="h-4 w-4 text-accent-orange" />
            <span className="text-sm font-medium">{t("hero.tag")}</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            {t("hero.title")}
          </h1>
          <p className="mt-5 text-xl md:text-2xl font-semibold text-primary-foreground/95">
            {t("hero.subtitle")}
          </p>
          <p className="mt-3 text-base md:text-lg text-primary-foreground/85 max-w-2xl mx-auto">
            {t("hero.tagline")}
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-10 max-w-3xl mx-auto flex flex-col sm:flex-row gap-3"
          >
            <div className="flex items-center gap-3 flex-1 px-5 py-2 bg-card rounded-full shadow-elegant">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("hero.search.placeholder")}
                className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground text-base h-12"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="bg-gradient-orange hover:opacity-95 text-accent-orange-foreground rounded-full px-10 h-14 text-base font-semibold shadow-elegant"
            >
              {t("hero.search.btn")}
            </Button>
          </form>
        </div>

        {/* Wave divider */}
        <svg
          className="absolute bottom-0 left-0 w-full h-16 text-background"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path fill="currentColor" d="M0,40 C360,100 1080,0 1440,60 L1440,100 L0,100 Z" />
        </svg>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-primary-deep">
          {t("section.categories")}
        </h2>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <CategoryCard
            to="/grocery"
            image={groceryImg}
            label={t("cat.grocery")}
            body={t("cat.grocery.body")}
            icon={ShoppingBag}
          />
          <CategoryCard
            to="/services"
            image={servicesImg}
            label={t("cat.services")}
            body={t("cat.services.body")}
            icon={Wrench}
          />
        </div>

        {/* Coming Soon */}
        <h3 className="mt-20 text-2xl md:text-3xl font-bold text-center text-primary-deep">
          {t("section.comingSoon")} <span className="text-accent-orange">✨</span>
        </h3>
        <div className="mt-8 grid sm:grid-cols-3 gap-5">
          <ComingSoonCard label={t("cat.clothing")} />
          <ComingSoonCard label={t("cat.electronics")} />
          <ComingSoonCard label={t("cat.cosmetics")} />
        </div>
      </section>

      {/* WHY SHAHAR BAZAR */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-primary-deep">
            {t("section.why")}
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-10">
            {[
              { icon: Truck, k: "delivery" },
              { icon: Store, k: "vendors" },
              { icon: ShieldCheck, k: "secure" },
            ].map(({ icon: Icon, k }) => (
              <div key={k} className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-accent flex items-center justify-center">
                  <Icon className="h-11 w-11 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 font-bold text-xl text-primary-deep">{t(`why.${k}.title`)}</h3>
                <p className="mt-2 text-base text-muted-foreground max-w-xs mx-auto">
                  {t(`why.${k}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-primary-deep">
          {t("section.testimonials")}
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Ayesha K.",
              text: "Same-day grocery delivery in Sargodha — finally! Quality is top notch.",
              role: "Customer",
            },
            {
              name: "Bilal R.",
              text: "Booked an electrician in 5 minutes. He arrived on time and did great work.",
              role: "Customer",
            },
            {
              name: "Hamza S.",
              text: "I list my shop here and orders come in daily. Best decision for my business.",
              role: "Vendor",
            },
          ].map((r) => (
            <Card
              key={r.name}
              className="p-6 bg-gradient-card hover:shadow-elegant transition-base"
            >
              <div className="flex gap-1 text-accent-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-foreground/85 leading-relaxed">"{r.text}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}

function CategoryCard({
  to,
  image,
  label,
  body,
  icon: Icon,
}: {
  to: "/grocery" | "/services";
  image: string;
  label: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link to={to} className="group">
      <Card className="overflow-hidden border-0 shadow-soft hover:shadow-elegant transition-base">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-base"
            loading="lazy"
            width={1024}
            height={768}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{label}</h3>
                <p className="text-sm text-white/85">{body}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ComingSoonCard({ label }: { label: string }) {
  return (
    <Card className="aspect-square bg-muted/60 border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-6 w-6 text-primary/60" />
      </div>
      <div className="font-semibold text-foreground/70">Coming Soon</div>
      <div className="text-xs uppercase tracking-wider">{label}</div>
    </Card>
  );
}
