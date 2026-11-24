import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="About"
        title="HireFlow is being built in the open, without fake traction."
        body="A privacy-first career operating system for job seekers in India and internationally. There is no team page of invented bios and no customer logos."
        secondary="Contact"
        secondaryHref="/contact"
      />
      <Prose>
        <p>
          Other products already use the HireFlow / Hireflow name in ATS markets. We will complete a
          legal name and domain search before buying hireflow.com.
        </p>
      </Prose>
    </>
  );
}
