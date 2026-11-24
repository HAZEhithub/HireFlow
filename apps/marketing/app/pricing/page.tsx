import type { Metadata } from "next";
import { ENTITLEMENTS, PLANS } from "@hireflow/entitlements";
import { Card, Container } from "@hireflow/ui";
import { PageHero } from "../../components/page-hero";
import { pageMeta } from "../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Pricing",
  description: "HireFlow Free is ₹0. Pro is ₹199/month + applicable GST. Payments are not live.",
  path: "/pricing",
});

const now = ENTITLEMENTS.filter((row) => row.implementedNow && row.grantable);
const laterFree = ENTITLEMENTS.filter(
  (row) => !row.implementedNow && row.grantable && row.free !== false,
);
const laterPro = ENTITLEMENTS.filter(
  (row) => row.grantable && row.free === false && row.pro === true,
);

export default function PricingPage() {
  return (
    <>
      <PageHero
        kicker="Pricing"
        title="Core search stays free. Pro is priced, not billed."
        body="Free is ₹0. India Pro is ₹199/month + applicable GST. Checkout, cards, and recurring charges are not enabled. An 18% GST illustration equals ₹234.82/month and is not a legal tax determination."
        secondary="Read the product"
        secondaryHref="/product"
      />
      <Container className="grid gap-6 py-16 md:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-widest text-[var(--color-accent)]">Free</p>
          <h2 className="font-display mt-2 text-3xl">{PLANS.free.offerCopy}</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">Available now for the Phase 1 workspace.</p>
          <ul className="mt-6 space-y-2 text-sm text-[var(--color-ink-soft)]">
            {now.map((row) => (
              <li key={row.key}>{row.notes}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Pro — early access, not live</p>
          <h2 className="font-display mt-2 text-3xl">{PLANS.pro.offerCopy}</h2>
          <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
            Approved commercial price. No payment gateway. You cannot be charged from this page.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[var(--color-ink-soft)]">
            <li>Everything in Free</li>
            {laterPro.map((row) => (
              <li key={row.key}>
                Planned: {row.notes} (Phase {row.earliestPhase})
              </li>
            ))}
            <li>Higher AI assist budget when a paid provider is approved (planned 50/month, not unlimited)</li>
            <li>Unlimited resume versions when Resume Studio ships</li>
          </ul>
          <p className="mt-6 text-xs text-[var(--color-ink-soft)]">
            Cancellation: when billing is later enabled, Pro is expected to remain available until the
            end of a paid period, then return to Free. That policy is not in force because billing is off.
          </p>
        </Card>
      </Container>
      <Container className="pb-16">
        <h2 className="font-display text-2xl">Coming on Free, not paywalled</h2>
        <ul className="mt-4 columns-1 gap-6 text-sm text-[var(--color-ink-soft)] sm:columns-2">
          {laterFree.slice(0, 12).map((row) => (
            <li key={row.key} className="mb-2">
              {row.notes} (Phase {row.earliestPhase})
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
