import type { Metadata } from "next";
import { PageHero, Prose } from "../../../components/page-hero";

export const metadata: Metadata = { title: "Remote and international" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Remote / international"
        title="Remote is a location, not a slogan."
        body="Workplace type from ATS enums, preferred countries, and work authorization as you state it — never a fake “visa verified” badge."
      />
      <Prose>
        <p>Ashby’s OnSite / Remote / Hybrid fields help. User-imported jobs are labeled as such when those fields are missing.</p>
      </Prose>
    </>
  );
}
