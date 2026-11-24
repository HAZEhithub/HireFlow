import { getDb, profile } from "@hireflow/db";
import { Card } from "@hireflow/ui";
import { eq } from "drizzle-orm";
import { ProfileForm } from "../../../components/profile-form";
import { requireUser } from "../../../lib/session";
import { completeOnboardingAction } from "../actions";

export default async function OnboardingPage() {
  const user = await requireUser();
  const db = await getDb();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  if (!p) throw new Error("Profile missing");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Onboarding</p>
        <h1 className="font-display mt-1 text-4xl">Tell us how you want to work</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Only fields that change matching. Resume upload and parsing arrive in Phase 3 — you will
          review every extracted field before it is saved.
        </p>
      </div>
      <Card>
        <ProfileForm data={p} action={completeOnboardingAction} submitLabel="Save and go to Home" />
      </Card>
    </div>
  );
}
