import type { Metadata } from "next";
import { Card, Container } from "@hireflow/ui";
import { PageHero } from "../../components/page-hero";
import { pageMeta } from "../../lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Product",
  description: "HireFlow product loop: jobs you can trust, matches you can explain, resume versions you approve, and a tracker you control.",
  path: "/product",
});

const items = [
  ["Job discovery", "/product/job-discovery", "Curated ATS boards, URL import, source and freshness."],
  ["AI matching", "/product/ai-matching", "Explainable compatibility. Not a hire probability."],
  ["Resume Studio", "/product/resume-studio", "Parse, templates, versions, user-approved edits."],
  ["Application tracker", "/product/application-tracker", "A CRM for your search. No auto-apply."],
];

export default function ProductIndex() {
  return (
    <>
      <PageHero
        kicker="Product"
        title="The loop we will actually ship."
        body="HireFlow is a career operating system, but the first public product is a tight workspace: jobs, explanation, resumes, and tracking. Everything else waits until this loop is real."
        secondary="Pricing"
        secondaryHref="/pricing"
      />
      <Container className="grid gap-4 py-16 md:grid-cols-2">
        {items.map(([title, href, body]) => (
          <a key={href} href={href}>
            <Card className="h-full hover:border-[var(--color-ink)]">
              <h2 className="font-display text-2xl">{title}</h2>
              <p className="mt-2 text-[var(--color-ink-soft)]">{body}</p>
            </Card>
          </a>
        ))}
      </Container>
    </>
  );
}
