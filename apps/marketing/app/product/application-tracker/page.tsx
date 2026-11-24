import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";
import { pageMeta } from "../../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Application tracker",
  description: "Unlimited Free tracker for applications you submit yourself. Not auto-apply.",
  path: "/product/application-tracker",
});

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Applications"
        title="A CRM for the search, not a bot."
        body="Track stages from Saved through Preparing, Applied, Interview, Offer, Rejected, and Withdrawn, with notes and in-app follow-ups. Unlimited on Free. You always submit the application yourself on the employer site."
      />
      <Prose>
        <p>The signed-in workspace uses a keyboard-accessible table as the primary view. A board view is visual only. Autopilot-style auto-apply will not ship.</p>
      </Prose>
    </>
  );
}
