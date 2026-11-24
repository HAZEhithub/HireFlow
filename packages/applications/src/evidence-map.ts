import {
  careerEvidence,
  resume,
  resumeVersion,
  type HireFlowDb,
} from "@hireflow/db";
import { assertEntitlement, isBillingLive } from "@hireflow/entitlements";
import { getJobForUser } from "@hireflow/jobs";
import { EVIDENCE_MAP_DISCLAIMER, attachVaultQuotes, matchResumeToJob } from "@hireflow/matching";
import { structuredResumeSchema, type StructuredResume } from "@hireflow/shared";
import { and, desc, eq, isNull } from "drizzle-orm";
import { ApplicationError } from "./errors";

function asResume(value: unknown): StructuredResume {
  const parsed = structuredResumeSchema.safeParse(value);
  if (!parsed.success) {
    throw new ApplicationError("invalid", "Resume version content could not be read.", 400);
  }
  return parsed.data;
}

export async function getEvidenceMapForUser(
  db: HireFlowDb,
  userId: string,
  jobId: string,
  resumeVersionId?: string,
) {
  await assertEntitlement(userId, "matching.evidence_map");
  const job = await getJobForUser(db, userId, jobId);
  if (!job) throw new ApplicationError("not_found", "Job not found.", 404);

  let version = resumeVersionId
    ? await db.query.resumeVersion.findFirst({
        where: and(eq(resumeVersion.id, resumeVersionId), eq(resumeVersion.userId, userId)),
      })
    : null;
  if (resumeVersionId && !version) {
    throw new ApplicationError("not_found", "Resume version not found.", 404);
  }
  if (version) {
    const parent = await db.query.resume.findFirst({
      where: and(eq(resume.id, version.resumeId), eq(resume.userId, userId), isNull(resume.deletedAt)),
    });
    if (!parent) throw new ApplicationError("not_found", "Resume version not found.", 404);
  }
  if (!version) {
    const latest = await db
      .select({ version: resumeVersion })
      .from(resumeVersion)
      .innerJoin(resume, eq(resume.id, resumeVersion.resumeId))
      .where(and(eq(resumeVersion.userId, userId), eq(resume.userId, userId), isNull(resume.deletedAt)))
      .orderBy(desc(resumeVersion.createdAt))
      .limit(1);
    version = latest[0]?.version ?? null;
  }
  if (!version) {
    return {
      complimentaryPreview: !isBillingLive(),
      job: { id: job.id, title: job.title, companyName: job.companyName },
      resumeVersionId: null,
      needsResume: true as const,
      disclaimer: EVIDENCE_MAP_DISCLAIMER,
      overall: null,
      methodology: null,
      items: [],
    };
  }

  const content = asResume(version.content);
  const match = matchResumeToJob(content, job);
  const vault = await db.select().from(careerEvidence).where(eq(careerEvidence.userId, userId));
  return {
    complimentaryPreview: !isBillingLive(),
    job: { id: job.id, title: job.title, companyName: job.companyName },
    resumeVersionId: version.id,
    needsResume: false as const,
    disclaimer: EVIDENCE_MAP_DISCLAIMER,
    overall: match.overall,
    methodology: match.methodology,
    items: attachVaultQuotes(match.evidence, vault),
  };
}
