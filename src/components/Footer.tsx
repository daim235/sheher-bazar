import { Store } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Shahar Bazar</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-md">{t("footer.tagline")}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/services" className="hover:text-foreground">{t("nav.services")}</Link></li>
            <li><Link to="/marketplace" className="hover:text-foreground">{t("nav.marketplace")}</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">{t("nav.dashboard")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Account</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">{t("nav.signin")}</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">{t("nav.signup")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Shahar Bazar. All rights reserved.
      </div>
    </footer>
  );
}
