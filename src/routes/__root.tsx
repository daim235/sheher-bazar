import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shahar Bazar — Local services & marketplace" },
      { name: "description", content: "Find trusted local plumbers, electricians, mechanics, and shops in your city. Book services and shop from local vendors on Shahar Bazar." },
      { name: "author", content: "Shahar Bazar" },
      { property: "og:title", content: "Shahar Bazar — Local services & marketplace" },
      { property: "og:description", content: "Find trusted local plumbers, electricians, mechanics, and shops in your city. Book services and shop from local vendors on Shahar Bazar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Shahar Bazar — Local services & marketplace" },
      { name: "twitter:description", content: "Find trusted local plumbers, electricians, mechanics, and shops in your city. Book services and shop from local vendors on Shahar Bazar." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e9061530-23bd-4b6b-83c6-88646ac37184/id-preview-5b258dc2--1a34d064-9715-4cd9-88a5-81d4ed035203.lovable.app-1777222571995.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e9061530-23bd-4b6b-83c6-88646ac37184/id-preview-5b258dc2--1a34d064-9715-4cd9-88a5-81d4ed035203.lovable.app-1777222571995.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </CartProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
