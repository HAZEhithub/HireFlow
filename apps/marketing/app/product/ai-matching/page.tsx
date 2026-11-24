import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";
import { pageMeta } from "../../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Explainable matching",
  description: "Planned Phase 3: deterministic skill and location overlap. Not a hire probability.",
  path: "/product/ai-matching",
});

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Matching — planned"
        title="Matches you can explain."
        body="Phase 3 will rank jobs with weighted overlap of skills, titles, location, and seniority, and list gaps in language you can check. Deterministic first. Optional local Ollama only if your machine has it. Public SaaS stays off until an approved provider. The authenticated app currently shows an empty Recommended state."
      />
      <Prose>
        <p>We will never label a score as the chance you get hired. Protected attributes are not features.</p>
      </Prose>
    </>
  );
}
