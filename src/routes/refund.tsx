import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Return Policy — Shahar Bazar" },
      { name: "description", content: "How returns, refunds and cancellations work on Shahar Bazar." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral dark:prose-invert">
        <h1 className="text-3xl md:text-4xl font-bold">Refund & Return Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 2026</p>

        <h2 className="mt-8 text-xl font-semibold">1. Cash on Delivery (COD)</h2>
        <p>
          Because all orders are paid in cash on delivery, you may inspect your order
          before paying. If the items are damaged, incorrect, or not as described,
          you may refuse the delivery and no payment will be taken.
        </p>

        <h2 className="mt-6 text-xl font-semibold">2. Cancelling an order</h2>
        <ul className="list-disc pl-6">
          <li>You can cancel any order while it is still in <strong>Pending</strong> state.</li>
          <li>Once a vendor confirms the order, you'll need to contact the vendor directly through the in-app messages to request a cancellation.</li>
        </ul>

        <h2 className="mt-6 text-xl font-semibold">3. Returns after delivery</h2>
        <p>
          Each vendor sets their own return window (typically 24–72 hours from delivery
          for non-perishable items). Perishable items (groceries, fresh food) are not
          returnable once delivered unless they are damaged or spoiled on arrival.
        </p>
        <p>
          To request a return, message the vendor from your dashboard within the return
          window. If the vendor does not respond within 48 hours, contact us at
          <a href="mailto:info@shaharbazar.pk"> info@shaharbazar.pk</a> and we will help mediate.
        </p>

        <h2 className="mt-6 text-xl font-semibold">4. Service bookings</h2>
        <p>
          You may cancel a service booking at any time before it is marked completed.
          Once a service has been delivered and marked completed, refunds are at the
          discretion of the service provider.
        </p>

        <h2 className="mt-6 text-xl font-semibold">5. Disputes</h2>
        <p>
          If you cannot resolve an issue directly with the vendor or provider, contact
          us at <a href="mailto:info@shaharbazar.pk">info@shaharbazar.pk</a> with your
          order reference. We will review the case and make a fair decision.
        </p>
      </article>
    </SiteShell>
  );
}
