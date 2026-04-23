// Sticky bottom tab bar — visible on mobile only.
// Mirrors the most-used routes for a marketplace UX.
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Store, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

interface Item {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
}

const items: Item[] = [
  { to: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { to: "/marketplace", label: "Shop", icon: Store, match: (p) => p.startsWith("/marketplace") || p.startsWith("/shop") || p.startsWith("/product") },
  { to: "/cart", label: "Cart", icon: ShoppingCart, match: (p) => p.startsWith("/cart") },
  { to: "/dashboard", label: "Orders", icon: ClipboardList, match: (p) => p.startsWith("/dashboard") },
  { to: "/auth", label: "Account", icon: User, match: (p) => p.startsWith("/auth") },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          // If signed in, the last tab navigates to dashboard profile instead of /auth
          const target = it.to === "/auth" && user ? "/dashboard" : it.to;
          const search = target === "/dashboard"
            ? (it.label === "Orders" ? { tab: "my-orders" as const, c: "" } : { tab: "profile" as const, c: "" })
            : target === "/marketplace"
              ? { q: "", category: "" }
              : undefined;
          return (
            <li key={it.label}>
              <Link
                to={target as "/"}
                // @ts-expect-error - search shape varies per route, runtime is fine
                search={search}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <it.icon className="h-5 w-5" />
                  {it.label === "Cart" && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
