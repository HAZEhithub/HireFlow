import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";
import { pageMeta } from "../../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Explainable matching",
  description: "Deterministic skill and location overlap against a real listing. Not a hire probability.",
  path: "/product/ai-matching",
});

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Matching"
        title="Matches you can explain."
        body="Recommended ranks jobs with weighted overlap of skills, titles, location, workplace, and employment type, and lists gaps in language you can check. Deterministic first. Optional local Ollama only if your machine has it. Public SaaS stays off until an approved provider. Scores are overlap, not the chance you get hired."
      />
      <Prose>
        <p>Protected attributes are not features. Compatibility needs a fuller profile when titles or skills are empty.</p>
      </Prose>
    </>
  );
}
