// Dynamic sitemap.xml — lists static pages + all approved shops/products/services.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const STATIC_PATHS = [
  "/",
  "/marketplace",
  "/services",
  "/grocery",
  "/about",
  "/become",
  "/auth",
  "/privacy",
  "/terms",
  "/refund",
];

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;

        const [{ data: shops }, { data: products }, { data: services }] = await Promise.all([
          supabaseAdmin.from("vendors").select("slug, updated_at").eq("status", "approved").limit(2000),
          supabaseAdmin.from("products").select("id, updated_at").eq("is_active", true).limit(5000),
          supabaseAdmin.from("services").select("id, updated_at").eq("is_active", true).limit(5000),
        ]);

        const urls: string[] = [];
        const today = new Date().toISOString().slice(0, 10);

        for (const p of STATIC_PATHS) {
          urls.push(`<url><loc>${origin}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`);
        }
        for (const s of shops ?? []) {
          urls.push(`<url><loc>${origin}/shop/${escapeXml(s.slug)}</loc><lastmod>${(s.updated_at ?? today).slice(0, 10)}</lastmod></url>`);
        }
        for (const p of products ?? []) {
          urls.push(`<url><loc>${origin}/product/${p.id}</loc><lastmod>${(p.updated_at ?? today).slice(0, 10)}</lastmod></url>`);
        }
        for (const s of services ?? []) {
          urls.push(`<url><loc>${origin}/service/${s.id}</loc><lastmod>${(s.updated_at ?? today).slice(0, 10)}</lastmod></url>`);
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          status: 200,
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
