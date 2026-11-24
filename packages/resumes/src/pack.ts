/**
 * Application Pack foundation. Phase 3 ships resume tailoring only.
 * Cover letters, outreach, screening answers and interview checklists stay Phase 5.
 */
export const APPLICATION_PACK_SLOTS = [
  { id: "resume", label: "Job-specific resume", status: "available" as const },
  { id: "cover_letter", label: "Cover letter draft", status: "coming_soon" as const },
  { id: "outreach", label: "Recruiter outreach draft", status: "coming_soon" as const },
  { id: "screening", label: "Screening-question drafts", status: "coming_soon" as const },
  { id: "interview", label: "Interview preparation checklist", status: "coming_soon" as const },
];

export function applicationPackForJob(input: { jobId: string; resumeId?: string | null }) {
  return {
    jobId: input.jobId,
    resumeId: input.resumeId ?? null,
    slots: APPLICATION_PACK_SLOTS,
    note: "HireFlow will not submit applications or message recruiters. Later pack drafts still require your approval.",
  };
}
