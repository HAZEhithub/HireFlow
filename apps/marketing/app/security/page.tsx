import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "Security" };

export default function Page() {
  return (
    <>
      <PageHero kicker="Security" title="Controls we are implementing." body="Password hashing via Better Auth, session cookies, server-side authorization, upload limits, and an AI gateway that blocks unpaid sensitive calls." />
      <Prose>
        <p>No penetration test has been performed yet. Report issues privately when a security mailbox exists.</p>
      </Prose>
    </>
  );
}
