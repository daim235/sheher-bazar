import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Globe, LogOut, LayoutDashboard, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo-shahar-bazar.png";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: "/" as const, label: t("nav.home") },
    { to: "/grocery" as const, label: t("nav.grocery") },
    { to: "/services" as const, label: t("nav.services") },
    { to: "/about" as const, label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center group shrink-0">
          <img
            src={logo}
            alt="Shahar Bazar"
            className="h-12 md:h-14 w-auto object-contain transition-base group-hover:scale-105"
            width={1376}
            height={768}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-4 py-2 text-base font-medium text-foreground/80 rounded-md hover:text-primary transition-base"
              activeProps={{ className: "px-4 py-2 text-base font-semibold rounded-md text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="gap-1.5 rounded-full hidden sm:inline-flex"
            aria-label="Toggle language"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-semibold">{lang === "en" ? "اردو" : "EN"}</span>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-[11px] font-bold text-primary-foreground">
                    {(user.email ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[120px] truncate text-sm">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> {t("nav.dashboard")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" /> {t("nav.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex text-base font-medium">
                <Link to="/auth">{t("nav.signin")}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-5 shadow-soft"
              >
                <Link to="/auth">{t("nav.signup")}</Link>
              </Button>
            </>
          )}

          <button
            className="relative h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center transition-base"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent-orange text-accent-orange-foreground text-[10px] font-bold flex items-center justify-center">
              0
            </span>
          </button>

          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.to} onSelect={() => navigate({ to: item.to })}>
                  {item.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setLang(lang === "en" ? "ur" : "en")}>
                <Globe className="h-4 w-4 mr-2" /> {lang === "en" ? "اردو" : "English"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
