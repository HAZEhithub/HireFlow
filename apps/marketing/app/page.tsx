import { FUNCTIONAL_LINE, TAGLINE } from "@hireflow/shared";
import { PLANS } from "@hireflow/entitlements";
import { Card, Container, TrustChip } from "@hireflow/ui";
import { pageMeta } from "../lib/seo";
import { appUrl } from "../lib/site";

export const metadata = pageMeta({
  title: "HireFlow — Your career, compounded",
  description: FUNCTIONAL_LINE,
  path: "/",
});

const faqs = [
  {
    q: "Does HireFlow auto-apply to jobs?",
    a: "No. You always submit on the employer site. We will never auto-submit applications.",
  },
  {
    q: "Where do jobs come from?",
    a: "Phase 2 uses a curated employer registry of Greenhouse, Lever, and Ashby boards plus in-app URL import. We do not scrape LinkedIn, Naukri, Indeed, or Workday.",
  },
  {
    q: "Is billing live?",
    a: "No. The Free plan is ₹0. Pro is priced at ₹199/month + applicable GST and is not collecting payment yet.",
  },
  {
    q: "Do you send my resume to unpaid AI APIs?",
    a: "No. External models stay off by default. Unpaid Gemini is blocked for resumes and personal data.",
  },
  {
    q: "Is a match score the chance I get hired?",
    a: "No. Compatibility is explained from skills, experience, location, and seniority. It is not a hire probability.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-[var(--color-rule)] py-16 sm:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">{TAGLINE}</p>
            <h1 className="font-display mt-3 text-4xl leading-tight sm:text-6xl">
              Jobs you can trust. Matches you can explain.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--color-ink-soft)]">
              HireFlow is a privacy-first career workspace for job seekers in India and internationally.
              Source, freshness, and an explained fit — not a mystery feed or a black-box score.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`${appUrl}/sign-up`}
                className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-2)]"
              >
                Start free
              </a>
              <a
                href="/product"
                className="rounded-[var(--radius-sm)] border border-[var(--color-ink)] px-5 py-2.5 text-sm font-medium"
              >
                Explore product
              </a>
            </div>
            <p className="mt-4 text-xs text-[var(--color-ink-soft)]">No credit card. Payments are not enabled.</p>
          </div>
          <ProductPreview />
        </Container>
      </section>

      <section className="py-16">
        <Container className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">The problem</h2>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              Seekers stitch boards, resume scanners, and spreadsheets. Listings go stale. Scores pretend
              to be hire probabilities. AI tools send resumes to unpaid APIs.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl">The HireFlow loop</h2>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              Know where you stand: permitted jobs, an explained match, user-approved resume edits, and
              one application pipeline. Features that are not built yet are labeled as planned.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-y border-[var(--color-rule)] py-16">
        <Container>
          <h2 className="font-display text-3xl">What you can use today</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <TrustChip tone="good">Available now</TrustChip>
              <h3 className="font-display mt-3 text-2xl">Account and profile</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Sign up, onboarding, career profile, in-app inbox, usage meter, export, and account deletion.
              </p>
            </Card>
            <Card>
              <TrustChip tone="good">Available now</TrustChip>
              <h3 className="font-display mt-3 text-2xl">Jobs, resumes, tracker</h3>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                Discover (registry plus URL import), Resume Studio, unlimited application tracking, evidence
                vault, and pack assemble. Inventory stays thinner than major boards until verified board IDs
                are added. Prepare and Insights remain later.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Job discovery", "/product/job-discovery", "Curated ATS boards and URL import. Source and last verified."],
            ["Explainable matching", "/product/ai-matching", "Compatibility, never a hire probability."],
            ["Resume Studio", "/product/resume-studio", "Parse, versions, PDF and DOCX export you approve."],
            ["Application workspace", "/product/application-tracker", "A CRM for your search. You submit."],
          ].map(([title, href, body]) => (
            <a key={href} href={href} className="block">
              <Card className="h-full hover:border-[var(--color-accent)]">
                <h3 className="font-display text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{body}</p>
              </Card>
            </a>
          ))}
        </Container>
      </section>

      <section className="border-y border-[var(--color-rule)] py-16">
        <Container className="max-w-3xl">
          <h2 className="font-display text-3xl">Career intelligence, later</h2>
          <p className="mt-4 text-[var(--color-ink-soft)]">
            Manual evidence vaults and application-pack assemble are available in the signed-in workspace.
            Job-fit maps and Job Search Intelligence stay later. We will not invent market statistics.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="font-display text-3xl">How HireFlow works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-4">
            {["Create a free account.", "Share the profile you want — skip what you do not.", "Search permitted boards or paste a job URL.", "Track applications you actually submitted."].map(
              (step, i) => (
                <li key={step} className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-5">
                  <p className="text-xs uppercase tracking-widest text-[var(--color-accent)]">0{i + 1}</p>
                  <p className="mt-2 text-sm">{step}</p>
                </li>
              ),
            )}
          </ol>
        </Container>
      </section>

      <section className="border-y border-[var(--color-rule)] py-16">
        <Container className="grid gap-6 md:grid-cols-2">
          <Card>
            <p className="text-xs uppercase tracking-widest text-[var(--color-accent)]">Free</p>
            <p className="font-display mt-2 text-4xl">{PLANS.free.offerCopy}</p>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              Core workspace: profile, empty Discover/tracker/studio, inbox, export, delete.
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Pro — not live</p>
            <p className="font-display mt-2 text-4xl">{PLANS.pro.offerCopy}</p>
            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              Approved India price. An 18% GST illustration is ₹234.82/month and is not a legal tax
              determination. No checkout.
            </p>
            <a className="mt-4 inline-block text-sm text-[var(--color-accent)]" href="/pricing">
              Full pricing
            </a>
          </Card>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-3xl">
          <h2 className="font-display text-3xl">Privacy and security</h2>
          <p className="mt-4 text-[var(--color-ink-soft)]">
            Sessions use httpOnly cookies. Your data is isolated per account. External AI is off.
            We do not claim DPDP or GDPR certification. Read the{" "}
            <a className="text-[var(--color-accent)]" href="/security">
              security
            </a>{" "}
            and{" "}
            <a className="text-[var(--color-accent)]" href="/privacy">
              privacy
            </a>{" "}
            pages for what we actually do.
          </p>
        </Container>
      </section>

      <section className="border-y border-[var(--color-rule)] py-16">
        <Container>
          <h2 className="font-display text-3xl">Questions</h2>
          <dl className="mt-8 space-y-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-medium">{item.q}</dt>
                <dd className="mt-2 text-[var(--color-ink-soft)]">{item.a}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="py-20">
        <Container className="max-w-2xl text-center">
          <h2 className="font-display text-4xl">Start the workspace. Pay nothing today.</h2>
          <p className="mt-4 text-[var(--color-ink-soft)]">
            Create an account, complete the profile you want, and see honest empty states for jobs
            and resumes. Billing stays off until you approve it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`${appUrl}/sign-up`}
              className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white"
            >
              Start free
            </a>
            <a href="/product" className="rounded-[var(--radius-sm)] border border-[var(--color-ink)] px-5 py-2.5 text-sm">
              Explore product
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-5 shadow-[0_1px_0_rgba(20,34,28,0.06)]">
      <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Product preview</p>
      <p className="font-display mt-2 text-2xl">Overview</p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        A reconstruction of the signed-in home: profile completeness, Free plan, empty jobs. Not a
        customer screenshot.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Profile 40%", "Plan Free", "Inbox 0"].map((label) => (
          <div key={label} className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] p-3 text-sm">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-rule)] p-4 text-sm text-[var(--color-ink-soft)]">
        No jobs yet — curated ATS registry and URL import in Phase 2.
      </div>
    </div>
  );
}
