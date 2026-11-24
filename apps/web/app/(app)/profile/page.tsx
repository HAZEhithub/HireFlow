import { completenessFrom, getDb, profile } from "@hireflow/db";
import { Card, TrustChip } from "@hireflow/ui";
import { eq } from "drizzle-orm";
import { ProfileForm } from "../../../components/profile-form";
import { requireUser } from "../../../lib/session";
import { saveProfileAction } from "../actions";

export default async function ProfilePage() {
  const user = await requireUser();
  const db = await getDb();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  if (!p) throw new Error("Profile missing");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Career profile</h1>
          <p className="mt-2 text-[var(--color-ink-soft)]">
            Visible only to you until you choose otherwise. We do not have an employer marketplace.
          </p>
        </div>
        <TrustChip tone={completenessFrom(p) > 70 ? "good" : "warn"}>{completenessFrom(p)}% complete</TrustChip>
      </div>
      <Card>
        <ProfileForm data={p} action={saveProfileAction} submitLabel="Save profile" />
      </Card>
    </div>
  );
}
