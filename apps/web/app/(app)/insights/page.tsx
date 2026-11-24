import { EmptyState } from "@hireflow/ui";
import { requireUser } from "../../../lib/session";

export default async function InsightsPage() {
  await requireUser();
  return (
    <EmptyState
      title="Job Search Intelligence is Phase 8"
      body="Market trends, skills demand, and career recommendations wait until curated ATS data and your pipeline exist. We will not invent statistics."
    />
  );
}
