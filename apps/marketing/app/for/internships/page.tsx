import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";

export const metadata: Metadata = { title: "For internship seekers" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Internships"
        title="Treat internships as first-class, not a broken filter."
        body="Employment type, dates, and stipend honesty. If a posting does not say, we will not invent a number."
      />
      <Prose>
        <p>Same tracker as full-time searches so conversion internships do not live in a spreadsheet.</p>
      </Prose>
    </>
  );
}
