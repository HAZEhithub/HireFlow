import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Contact"
        title="Feedback, not a fake inbox army."
        body="Until a support mailbox is provisioned, use GitHub issues on the project repository or in-app settings once you have an account."
        secondary="Security"
        secondaryHref="/security"
      />
      <Prose>
        <p>Do not send resumes to unpaid third-party forms. Create an account and keep files in HireFlow.</p>
      </Prose>
    </>
  );
}
