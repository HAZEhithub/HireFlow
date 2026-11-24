import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "Accessibility" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Accessibility"
        title="We aim for WCAG 2.2 AA on new UI."
        body="Semantic HTML, skip links, visible focus, 24px minimum targets, and reduced-motion support. Native apps are not in scope. HireFlow is not WCAG certified."
      />
      <Prose>
        <p>
          The application tracker uses a real table as the accessible primary view. If something is
          unusable with a keyboard or screen reader, that is a bug. Marketing and app layouts use
          headings, labels, and landmarks.
        </p>
      </Prose>
    </>
  );
}
