import { ApplicationError, getEvidenceMapForUser, listResumeVersionOptions } from "@hireflow/applications";
import { getDb } from "@hireflow/db";
import { getJobForUser } from "@hireflow/jobs";
import { EntitlementError } from "@hireflow/entitlements";
import { Card } from "@hireflow/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../../lib/session";
import { EvidenceMapPanel } from "../evidence-map-panel";

export default async function EvidenceMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resumeVersionId?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { resumeVersionId } = await searchParams;
  const db = await getDb();
  const job = await getJobForUser(db, user.id, id);
  if (!job) notFound();
  const versions = await listResumeVersionOptions(db, user.id);
  let map: Awaited<ReturnType<typeof getEvidenceMapForUser>> | null = null;
  try {
    map = await getEvidenceMapForUser(db, user.id, id, resumeVersionId);
  } catch (error) {
    if (error instanceof ApplicationError && error.httpStatus === 404) notFound();
    if (!(error instanceof EntitlementError) && !(error instanceof ApplicationError)) throw error;
  }
  return (
    <div className="space-y-6">
      <p className="text-sm">
        <Link href={`/jobs/${id}`} className="text-[var(--color-accent)]">
          Back to {job.title}
        </Link>
      </p>
      {map ? (
        <EvidenceMapPanel
          jobId={id}
          complimentaryPreview={map.complimentaryPreview}
          disclaimer={map.disclaimer}
          overall={map.overall}
          methodology={map.methodology}
          items={map.items}
          needsResume={map.needsResume}
          resumeVersionId={map.resumeVersionId}
          versions={versions.map((row) => ({
            id: row.id,
            title: row.title,
            versionNumber: row.versionNumber,
          }))}
        />
      ) : (
        <Card>
          <p className="text-sm text-[var(--color-ink-soft)]">
            This evidence map is not available. The listing itself is still on the job page.
          </p>
        </Card>
      )}
    </div>
  );
}
