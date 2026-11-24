import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";
import { pageMeta } from "../../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Job discovery",
  description: "Curated ATS employer boards and URL import. No scraping of LinkedIn, Naukri, Indeed, or Workday.",
  path: "/product/job-discovery",
});

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Job discovery"
        title="Jobs with a source, not a pile."
        body="Phase 2 uses a curated employer registry of Greenhouse, Lever, and Ashby boards (per-employer IDs — there is no global search API) plus in-app URL import. India coverage without scraping Naukri: ATS employers hiring in India or remote, and jobs you paste. The browser extension is Phase 5."
      />
      <Prose>
        <h2 className="font-display text-2xl text-[var(--color-ink)]">Problem</h2>
        <p>Aggregators optimize for volume. Duplicates and expired posts waste time. Closed boards cannot be copied legally.</p>
        <h2 className="font-display text-2xl text-[var(--color-ink)]">What exists today</h2>
        <p>
          The authenticated app shows an honest empty Discover state until ingestion ships. That is
          better than fake listings.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)]">What we will not do</h2>
        <p>Server-side scrape of LinkedIn, Indeed, Naukri, or Workday. Invented jobs for SEO. JobPosting JSON-LD on search pages.</p>
      </Prose>
    </>
  );
}
