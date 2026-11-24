import { assertEntitlement, isBillingLive } from "@hireflow/entitlements";
import type { HireFlowDb } from "@hireflow/db";
import { getJobForUser } from "./search";

export class JobBriefError extends Error {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = "JobBriefError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export type CompanyBrief = {
  complimentaryPreview: boolean;
  sourceOnly: true;
  interviewCopilot: false;
  job: {
    id: string;
    companyName: string;
    title: string;
    location: string;
    workplaceType: string;
    employmentType: string;
    salary: string;
    source: string;
    lastRetrieved: string;
    applyUrl: string;
    listingKind: string;
  };
  notes: string[];
};

export async function getCompanyBriefForUser(
  db: HireFlowDb,
  userId: string,
  jobId: string,
): Promise<CompanyBrief> {
  await assertEntitlement(userId, "prepare.company_brief");
  const row = await getJobForUser(db, userId, jobId);
  if (!row) throw new JobBriefError("not_found", "Job not found.", 404);
  const location = row.locationText || [row.city, row.country].filter(Boolean).join(", ") || "Not provided";
  const salary =
    row.salaryDisclosure === "disclosed"
      ? `${row.salaryMin ?? "?"}–${row.salaryMax ?? "?"} ${row.salaryCurrency ?? ""}`.trim()
      : "not provided by the source";
  return {
    complimentaryPreview: !isBillingLive(),
    sourceOnly: true,
    interviewCopilot: false,
    job: {
      id: row.id,
      companyName: row.companyName,
      title: row.title,
      location,
      workplaceType: row.workplaceType,
      employmentType: row.employmentType || "not provided",
      salary,
      source: row.source,
      lastRetrieved: row.lastVerified.toISOString(),
      applyUrl: row.applyUrl,
      listingKind: row.listingKind,
    },
    notes: [
      "This brief uses ATS and listing fields HireFlow already stored. It is not independent company research.",
      "Interview practice is not implemented. There is no live copilot.",
    ],
  };
}
