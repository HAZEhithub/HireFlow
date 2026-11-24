import type { Metadata } from "next";
import { PageHero, Prose } from "../../components/page-hero";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return (
    <>
      <PageHero
        kicker="Privacy"
        title="What we actually do with your data."
        body="This is a description of current software behavior, not a DPDP or GDPR certificate."
        secondary="Security"
        secondaryHref="/security"
      />
      <Prose>
        <p>We store your email, password hash, profile, and (later) resumes and applications on the database you configure (local PGlite or Neon).</p>
        <p>We do not sell your data to recruiters. We do not send resumes to unpaid Gemini or similar unpaid APIs.</p>
        <p>You can export JSON and delete your account in Settings. Sessions are httpOnly cookies.</p>
        <p>Google OAuth, if you enable it, requests email and profile only at launch.</p>
        <p>Qualified legal review is required before production claims of regulatory compliance.</p>
      </Prose>
    </>
  );
}
