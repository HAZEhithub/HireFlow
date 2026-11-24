import { EmptyState } from "@hireflow/ui";
import { requireUser } from "../../../lib/session";

export default async function PreparePage() {
  await requireUser();
  return (
    <EmptyState
      title="Prepare is planned"
      body="Interview practice, company briefs, and application packs are later phases. We will not show live interview copilots. This empty state is intentional."
    />
  );
}
