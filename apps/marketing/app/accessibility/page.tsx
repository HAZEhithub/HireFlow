import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "Accessibility" };

export default function Page() {
  return (
    <>
      <PageHero kicker="Accessibility" title="Semantic HTML, keyboard, and contrast as defaults." body="We aim for WCAG 2.2 AA on new UI. Native apps are not in scope. If something is unusable with a keyboard or screen reader, that is a bug." />
      <Prose>
        <p>Marketing and app layouts use real headings, labels, and focus outlines. We will keep testing as features land.</p>
      </Prose>
    </>
  );
}
