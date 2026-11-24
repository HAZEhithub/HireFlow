import { EmptyState } from "@hireflow/ui";
import Link from "next/link";
import { requireUser } from "../../../lib/session";

export default async function ApplicationsPage() {
  await requireUser();
  return (
    <EmptyState
      title="No applications yet"
      body="The tracker (Saved → Preparing → Applied → Interview → Offer → Rejected → Withdrawn) ships in Phase 4. There is no auto-apply. You will always submit on the employer site."
      action={
        <Link className="text-sm text-[var(--color-accent)]" href="/resumes">
          Open Resume Studio
        </Link>
      }
    />
  );
}
