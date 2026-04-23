// Sticky bottom tab bar — visible on mobile only.
// Mirrors the most-used routes for a marketplace UX.
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Store, ShoppingCart, MessageCircle, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { count } = useCart();
  const { user } = useAuth();
  const unread = useUnreadMessages(user?.id);

  const items = [
    { key: "home", to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { key: "shop", to: "/marketplace", label: "Shop", icon: Store, match: (p: string) => p.startsWith("/marketplace") || p.startsWith("/shop") || p.startsWith("/product") },
    { key: "cart", to: "/cart", label: "Cart", icon: ShoppingCart, match: (p: string) => p.startsWith("/cart") },
    { key: "inbox", to: "/dashboard", label: "Inbox", icon: MessageCircle, match: (p: string) => p.startsWith("/dashboard") },
    { key: "account", to: "/auth", label: "Account", icon: User, match: (p: string) => p.startsWith("/auth") },
  ];

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
          const search =
            target === "/dashboard"
              ? it.key === "inbox"
                ? { tab: "messages" as const, c: "" }
                : { tab: "profile" as const, c: "" }
              : target === "/marketplace"
                ? { q: "", category: "" }
                : undefined;
          const badge =
            it.key === "inbox" && user && unread > 0 ? unread :
            it.key === "cart" && count > 0 ? count :
            0;
          return (
            <li key={it.key}>
              <Link
                to={target}
                search={search as never}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="relative">
                  <it.icon className="h-5 w-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                      {badge > 9 ? "9+" : badge}
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
