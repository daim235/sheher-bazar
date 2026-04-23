import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Shahar Bazar" },
      { name: "description", content: "How Shahar Bazar collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral dark:prose-invert">
        <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 2026</p>

        <h2 className="mt-8 text-xl font-semibold">1. Data we collect</h2>
        <ul className="list-disc pl-6">
          <li><strong>Account data</strong>: full name, email, phone, city.</li>
          <li><strong>Vendor / provider data</strong>: shop name, logo, banner, description, contact email.</li>
          <li><strong>Order data</strong>: shipping address, phone, items, totals.</li>
          <li><strong>Messages</strong>: conversations between buyers and sellers on the platform.</li>
          <li><strong>Technical data</strong>: cookies and basic device info needed to keep you signed in.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">2. How we use your data</h2>
        <ul className="list-disc pl-6">
          <li>To create and operate your account.</li>
          <li>To process orders and bookings, including sharing necessary details with the relevant vendor or service provider.</li>
          <li>To send transactional emails (account confirmations, password resets, order updates).</li>
          <li>To prevent fraud and keep the marketplace safe.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">3. Who can see your data</h2>
        <p>
          Your phone number, email, and full address are <strong>never publicly visible</strong>.
          When you place an order, only the relevant vendor sees the address and phone needed
          to deliver. Public profiles only show your name, photo, city, and (for service
          providers) bio and skills.
        </p>

        <h2 className="mt-6 text-xl font-semibold">4. Data retention</h2>
        <p>
          We keep your data for as long as your account is active. You may request deletion
          by emailing us — note that we may retain limited records (e.g. completed orders)
          where required by law.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. Security</h2>
        <p>
          Data is stored on our cloud backend with row-level security policies, encrypted
          in transit (HTTPS), and access is restricted to authorised personnel.
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Your rights</h2>
        <p>
          You may at any time access, correct, or delete your account data from your
          dashboard, or by emailing <a href="mailto:info@shaharbazar.pk">info@shaharbazar.pk</a>.
        </p>

        <h2 className="mt-6 text-xl font-semibold">7. Contact</h2>
        <p>Questions about privacy: <a href="mailto:info@shaharbazar.pk">info@shaharbazar.pk</a>.</p>
      </article>
    </SiteShell>
  );
}
