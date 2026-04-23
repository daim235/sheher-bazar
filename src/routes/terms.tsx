import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Shahar Bazar" },
      { name: "description", content: "Terms of service for using the Shahar Bazar marketplace." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral dark:prose-invert">
        <h1 className="text-3xl md:text-4xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 2026</p>

        <h2 className="mt-8 text-xl font-semibold">1. Who we are</h2>
        <p>
          Shahar Bazar ("we", "us", "the platform") is an online marketplace based in
          Sargodha, Pakistan, that connects local buyers with vendors and service
          providers. By using the platform you agree to these terms.
        </p>

        <h2 className="mt-6 text-xl font-semibold">2. Accounts</h2>
        <p>
          You must be at least 18 years old to create an account. You are responsible
          for keeping your login credentials private and for any activity on your account.
        </p>

        <h2 className="mt-6 text-xl font-semibold">3. Buyers</h2>
        <ul className="list-disc pl-6">
          <li>You agree to provide accurate delivery and contact details.</li>
          <li>Cash on Delivery (COD) is currently the only payment method.</li>
          <li>You may cancel a pending order before the vendor confirms it.</li>
          <li>Refusing to accept a confirmed COD order without valid reason may result in account suspension.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">4. Vendors and service providers</h2>
        <ul className="list-disc pl-6">
          <li>You must list accurate information about your products and services.</li>
          <li>You are solely responsible for the quality, legality, and delivery of what you sell.</li>
          <li>The platform may charge a commission on completed bookings or sales — see your dashboard for the current rate.</li>
          <li>We reserve the right to suspend any account that violates these terms or applicable Pakistani law.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">5. Prohibited content</h2>
        <p>
          You may not list items or services that are illegal, counterfeit, hazardous,
          or otherwise prohibited under Pakistani law (including but not limited to
          weapons, narcotics, or stolen goods).
        </p>

        <h2 className="mt-6 text-xl font-semibold">6. Liability</h2>
        <p>
          Shahar Bazar acts only as a marketplace. We are not party to the underlying
          transaction between buyer and seller. To the extent permitted by law, we are
          not liable for indirect, incidental, or consequential damages arising from
          your use of the platform.
        </p>

        <h2 className="mt-6 text-xl font-semibold">7. Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the platform
          after changes are posted means you accept the updated terms.
        </p>

        <h2 className="mt-6 text-xl font-semibold">8. Contact</h2>
        <p>For any questions, email <a href="mailto:info@shaharbazar.pk">info@shaharbazar.pk</a>.</p>
      </article>
    </SiteShell>
  );
}
