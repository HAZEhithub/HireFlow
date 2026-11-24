import { completenessFrom, getDb, notification, profile } from "@hireflow/db";
import { PLANS, resolvePlan } from "@hireflow/entitlements";
import { Card, EmptyState, TrustChip } from "@hireflow/ui";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { requireUser } from "../../lib/session";

export default async function HomePage() {
  const user = await requireUser();
  const db = await getDb();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  const notes = await db.query.notification.findMany({ where: eq(notification.userId, user.id) });
  const unread = notes.filter((row) => !row.readAt).length;
  const completeness = p ? completenessFrom(p) : 0;
  const plan = resolvePlan(user.id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Overview</p>
        <h1 className="font-display mt-1 text-4xl">Hello{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          This is your career workspace. Discover jobs from permitted employer boards, import URLs,
          and keep an explainable compatibility breakdown next to every listing.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Profile</p>
          <p className="font-display mt-2 text-3xl">{completeness}%</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">completeness</p>
          <Link className="mt-4 inline-block text-sm text-[var(--color-accent)]" href="/profile">
            Edit profile
          </Link>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Plan</p>
          <p className="mt-2 text-sm">
            {plan.plan === "free" ? "Free" : "Pro"} · billing {plan.billingLive ? "live" : "not enabled"}
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            Pro is {PLANS.pro.offerCopy} when payments are approved. Checkout is not available.
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Inbox</p>
          <p className="font-display mt-2 text-3xl">{unread}</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">unread</p>
          <Link className="mt-4 inline-block text-sm text-[var(--color-accent)]" href="/notifications">
            Open inbox
          </Link>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Onboarding</p>
          <div className="mt-3">
            {p?.onboardingCompletedAt ? (
              <TrustChip tone="good">Completed</TrustChip>
            ) : (
              <TrustChip tone="warn">Not finished</TrustChip>
            )}
          </div>
          <Link className="mt-4 inline-block text-sm text-[var(--color-accent)]" href="/onboarding">
            {p?.onboardingCompletedAt ? "Review answers" : "Continue onboarding"}
          </Link>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Getting started</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[var(--color-ink-soft)]">
            <li>Finish the profile fields you are willing to share.</li>
            <li>Export or delete your data anytime from Settings.</li>
            <li>Open Discover to search ingested boards, or import a job URL yourself.</li>
            <li>Upload a resume in Resume Studio and compare it with a listing.</li>
            <li>Track applications you submit yourself. HireFlow never auto-applies.</li>
          </ol>
        </Card>
      </div>
      <EmptyState
        title="Job discovery is ready"
        body="Search permitted employer boards and jobs you import. HireFlow will not scrape Naukri, LinkedIn, or Indeed, and will not invent openings."
        action={
          <div className="flex flex-wrap gap-4">
            <Link className="text-sm text-[var(--color-accent)]" href="/jobs">
              Open Discover
            </Link>
            <Link className="text-sm text-[var(--color-accent)]" href="/jobs/saved">
              Saved
            </Link>
            <Link className="text-sm text-[var(--color-accent)]" href="/jobs/recommended">
              Recommended
            </Link>
            <Link className="text-sm text-[var(--color-accent)]" href="/applications">
              Applications
            </Link>
          </div>
        }
      />
    </div>
  );
}
