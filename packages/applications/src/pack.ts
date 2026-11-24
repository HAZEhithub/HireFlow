import { APPLICATION_PACK_SLOT_IDS } from "@hireflow/shared";

export const APPLICATION_PACK_SLOTS = APPLICATION_PACK_SLOT_IDS.map((id) => ({
  id,
  label:
    id === "resume"
      ? "Job-specific resume"
      : id === "cover_letter"
        ? "Cover letter"
        : id === "outreach"
          ? "Recruiter outreach"
          : id === "screening"
            ? "Screening answers"
            : "Interview checklist",
  assemble: true as const,
  aiDrafts: false as const,
}));

export function applicationPackForJob(input: { jobId?: string | null; resumeId?: string | null; applicationId?: string | null }) {
  return {
    jobId: input.jobId ?? null,
    resumeId: input.resumeId ?? null,
    applicationId: input.applicationId ?? null,
    slots: APPLICATION_PACK_SLOTS,
    note: "Paste your own text into each slot. HireFlow will not submit applications, message recruiters, or generate cover letters until Pro AI drafts are approved later.",
  };
}
