import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import logo from "@/assets/logo-shahar-bazar.png";

export function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Subscribed! 🎉");
    setEmail("");
  };

  return (
    <footer className="mt-20">
      {/* Become a Vendor band */}
      <section className="bg-gradient-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h3 className="text-3xl md:text-4xl font-bold">{t("section.becomeVendor")}</h3>
          <p className="mt-3 text-primary-foreground/90 text-lg">{t("section.becomeVendor.body")}</p>
          <Button
            asChild
            size="lg"
            className="mt-6 bg-gradient-orange hover:opacity-95 text-accent-orange-foreground rounded-full px-10 py-6 text-base font-semibold shadow-elegant"
          >
            <Link to="/auth">{t("common.register")}</Link>
          </Button>
        </div>
      </section>

      {/* Footer body */}
      <div className="bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <img
              src={logo}
              alt="Shahar Bazar"
              className="h-14 w-auto object-contain brightness-0 invert opacity-90"
              width={1376}
              height={768}
            />
            <p className="mt-4 text-sm text-primary-foreground/80 leading-relaxed">{t("footer.tagline")}</p>
            <div className="mt-5 flex gap-3">
              <a href="#" aria-label="Facebook" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-base">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="h-9 w-9 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 flex items-center justify-center transition-base">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-base">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li><Link to="/" className="hover:text-accent-orange transition-base">{t("nav.home")}</Link></li>
              <li><Link to="/grocery" className="hover:text-accent-orange transition-base">{t("nav.grocery")}</Link></li>
              <li><Link to="/services" className="hover:text-accent-orange transition-base">{t("nav.services")}</Link></li>
              <li><Link to="/about" className="hover:text-accent-orange transition-base">{t("nav.about")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-base">{t("footer.contact")}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Sargodha, Punjab, Pakistan</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +92 XXX XXXXXXX</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> info@shaharbazar.pk</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-base">{t("footer.newsletter")}</h4>
            <p className="text-sm text-primary-foreground/80 mb-3">{t("footer.newsletter.body")}</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("footer.email.placeholder")}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-accent-orange"
                required
              />
              <Button
                type="submit"
                className="bg-gradient-orange hover:opacity-95 text-accent-orange-foreground shrink-0"
              >
                {t("common.subscribe")}
              </Button>
            </form>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 py-5 text-center text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} Shahar Bazar. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
