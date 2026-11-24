import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";
import { pageMeta } from "../../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Application tracker",
  description: "Planned Phase 4: a CRM for applications you submit yourself. Not auto-apply.",
  path: "/product/application-tracker",
});

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Applications — planned"
        title="A CRM for the search, not a bot."
        body="Phase 4 will track stages from Saved through Offer, Rejected, and Withdrawn, with notes and follow-ups. The authenticated app currently shows an empty tracker. You will always submit the application yourself."
      />
      <Prose>
        <p>Simplify-style preview autofill may arrive later. Autopilot-style auto-apply will not.</p>
      </Prose>
    </>
  );
}
