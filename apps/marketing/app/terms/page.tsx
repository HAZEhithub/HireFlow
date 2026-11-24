import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "Terms" };

export default function Page() {
  return (
    <>
      <PageHero kicker="Terms" title="Draft terms for early development." body="Not a substitute for counsel. Do not treat this as an enforceable consumer contract yet." />
      <Prose>
        <p>HireFlow is provided as-is during development. You must not use it to spam employers or submit false credentials.</p>
        <p>Job listings belong to their employers. We attribute sources and link to apply URLs.</p>
        <p>Match scores are compatibility estimates, not employment promises.</p>
      </Prose>
    </>
  );
}
