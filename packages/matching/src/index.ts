export {
  MATCH_WEIGHTS,
  explainMatch,
  matchJobToProfile,
  type MatchExplanation,
  type MatchInput,
} from "./explain";
export { matchResumeToJob, flattenResumeSkills, flattenResumeTitles } from "./resume-job";
export type { EvidenceStatus, RequirementEvidence, ResumeJobCompatibility } from "./resume-job";
export { attachVaultQuotes, EVIDENCE_MAP_DISCLAIMER } from "./evidence-map";
export type { EvidenceMapItem, VaultQuoteInput } from "./evidence-map";
