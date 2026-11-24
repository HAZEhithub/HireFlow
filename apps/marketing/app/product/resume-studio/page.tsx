import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";

export const metadata: Metadata = { title: "Resume Studio" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Resume Studio"
        title="Your resume, versioned and honest."
        body="Parse PDF (unpdf) and DOCX (mammoth, import only). Three ATS-safe templates. Export PDF with @react-pdf/renderer and DOCX with the docx library — separate pipelines. Compatibility against a specific job description — not a theatrical universal ATS score."
      />
      <Prose>
        <p>Free plan: two resumes. You review extracted fields. Generated wording never adds employers, dates, or skills you did not provide.</p>
        <p>Resume Studio in the signed-in app parses PDF/DOCX/TXT locally, analyzes completeness (not an ATS score), compares a resume with a real listing, and exports PDF or DOCX. Paid AI is not required and is not enabled.</p>
      </Prose>
    </>
  );
}
