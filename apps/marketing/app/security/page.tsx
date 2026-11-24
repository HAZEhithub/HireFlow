import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "Security" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Security"
        title="Controls we are implementing."
        body="Password hashing via Better Auth, session cookies, server-side authorization, upload limits, and an AI gateway that blocks unpaid sensitive calls. This is not an ISO 27001 or SOC 2 certificate."
      />
      <Prose>
        <p>
          No penetration test has been performed yet. Until a dedicated mailbox is provisioned, report
          suspected vulnerabilities privately through GitHub security advisories on the HireFlow
          repository or the contact page — do not file public issues with exploit details.
        </p>
        <p>Placeholder contact: security@hireflow.example (not monitored until an operator mailbox is approved).</p>
      </Prose>
    </>
  );
}
