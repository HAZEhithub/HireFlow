/**
 * Application Pack slots. Assemble-by-paste ships in the applications workspace.
 * Pro AI drafts (cover letters) remain unimplemented.
 */
export const APPLICATION_PACK_SLOTS = [
  { id: "resume", label: "Job-specific resume", status: "available" as const },
  { id: "cover_letter", label: "Cover letter draft", status: "assemble" as const },
  { id: "outreach", label: "Recruiter outreach draft", status: "assemble" as const },
  { id: "screening", label: "Screening-question drafts", status: "assemble" as const },
  { id: "interview", label: "Interview preparation checklist", status: "assemble" as const },
];

export function applicationPackForJob(input: { jobId: string; resumeId?: string | null }) {
  return {
    jobId: input.jobId,
    resumeId: input.resumeId ?? null,
    slots: APPLICATION_PACK_SLOTS,
    note: "HireFlow will not submit applications or message recruiters. Pack text is pasted by you. AI drafts stay off.",
  };
}
