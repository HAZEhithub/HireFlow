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
        <p>
          We store your email, password hash, profile, resumes, applications, follow-ups, and evidence
          items on the database you configure (local PGlite or Neon). Binary resume files stay in
          private storage.
        </p>
        <p>
          Purposes: account security, career matching, application tracking, and optional local or
          paid AI only after consent. We do not sell your data to recruiters. We do not send resumes
          to unpaid Gemini or similar unpaid APIs.
        </p>
        <p>
          You can export JSON (including applications and evidence) and delete your account in
          Settings. Withdrawal of AI consent is an uncheck. Sessions are httpOnly cookies. English is
          the current notice language.
        </p>
        <p>Google OAuth, if you enable it, requests email and profile only at launch.</p>
        <p>Qualified legal review is required before production claims of regulatory compliance. Child-account age under DPDP is not decided in this software.</p>
      </Prose>
    </>
  );
}
