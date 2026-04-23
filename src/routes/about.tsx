import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Heart, Users, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import heroImg from "@/assets/hero-sargodha.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Shahar Bazar" },
      {
        name: "description",
        content:
          "Shahar Bazar is Sargodha's own online marketplace, connecting customers with trusted local shops and service providers.",
      },
      { property: "og:title", content: "About Shahar Bazar" },
      {
        property: "og:description",
        content:
          "Sargodha's own online marketplace — connecting customers with trusted local shops and services.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();

  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImg}
          alt="Sargodha bazaar"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/85 to-primary/95" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28 text-center text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-foreground/15 backdrop-blur border border-primary-foreground/20">
            <MapPin className="h-4 w-4 text-accent-orange" />
            <span className="text-sm font-medium">{t("hero.tag")}</span>
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold">About Shahar Bazar</h1>
          <p className="mt-5 text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            We're building Sargodha's own online marketplace — a single place to shop from trusted
            local stores and book reliable home services, all delivered to your door.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-accent-orange font-semibold text-sm uppercase tracking-wider">
              <Heart className="h-4 w-4" /> Our Mission
            </div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-primary-deep">
              Empowering local shops, one order at a time
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              From the spice baskets of Company Bagh to the auto workshops of Satellite Town,
              Sargodha is full of skilled people doing great work. Shahar Bazar gives them a modern
              storefront and gives you a faster, easier way to support them.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-gradient-primary text-primary-foreground rounded-full"
            >
              <Link to="/auth">Join Shahar Bazar</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat icon={Users} number="500+" label="Local vendors" />
            <Stat icon={Truck} number="2hr" label="Avg delivery" />
            <Stat icon={ShieldCheck} number="100%" label="Verified" />
            <Stat icon={Sparkles} number="4.8★" label="Avg rating" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-primary-deep">
            What we stand for
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Local first",
                body: "Every rupee spent here circulates back into Sargodha's neighborhoods.",
              },
              {
                title: "Honest pricing",
                body: "Vendors set fair prices. No hidden fees, no inflated middlemen.",
              },
              {
                title: "Built on trust",
                body: "Real reviews, verified providers, and human support whenever you need it.",
              },
            ].map((v) => (
              <Card
                key={v.title}
                className="p-6 bg-card border-0 shadow-soft hover:shadow-elegant transition-base"
              >
                <h3 className="font-bold text-lg text-primary-deep">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Stat({
  icon: Icon,
  number,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  number: string;
  label: string;
}) {
  return (
    <Card className="p-5 text-center bg-gradient-card">
      <Icon className="h-7 w-7 mx-auto text-primary" />
      <div className="mt-2 text-2xl font-bold text-primary-deep">{number}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </Card>
  );
}
