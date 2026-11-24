import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";
import { pageMeta } from "../../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "For students",
  description: "A career workspace that starts from education, projects, and internships — not six years of backfilled experience.",
  path: "/for/students",
});

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Students"
        title="Campus to first applications, without a $40 tracker."
        body="Create a free profile now. Internship filters and exam-aware availability are planned for Phase 2 job search. We will not invent years of experience you do not have."
      />
      <Prose>
        <p>Distinct from a mid-level SWE product: we start from education, projects, and internships — not stock equity waterfalls.</p>
      </Prose>
    </>
  );
}
