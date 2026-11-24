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
        body="Discover uses a curated employer registry of Greenhouse, Lever, and Ashby boards (per-employer IDs — there is no global search API) plus in-app URL import. India coverage without scraping Naukri: ATS employers hiring in India or remote, and jobs you paste. Inventory is thinner than major boards until verified board IDs are added."
      />
      <Prose>
        <h2 className="font-display text-2xl text-[var(--color-ink)]">What exists today</h2>
        <p>
          Search, save, import, internship and full-time filters, and trust signals (source, last
          retrieved, stale, duplicate, broken apply link, payment-request language). Compatibility is
          an overlap of your profile — not a hire probability. The production registry starts empty
          until board identifiers are verified; fixtures and URL import work locally.
        </p>
        <h2 className="font-display text-2xl text-[var(--color-ink)]">What we will not do</h2>
        <p>Server-side scrape of LinkedIn, Indeed, Naukri, or Workday. Invented jobs for SEO. JobPosting JSON-LD on search pages.</p>
      </Prose>
    </>
  );
}
