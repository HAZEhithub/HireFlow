import type { RequirementEvidence } from "./resume-job";

export type VaultQuoteInput = {
  id: string;
  title: string;
  body?: string | null;
  quotedAs?: string | null;
};

export type EvidenceMapItem = RequirementEvidence & {
  vaultQuotes: Array<{
    id: string;
    title: string;
    excerpt: string;
    quotedAs: "user-provided";
  }>;
};

function haystack(item: VaultQuoteInput) {
  return `${item.title} ${item.body ?? ""}`.toLowerCase();
}

export function attachVaultQuotes(
  evidence: RequirementEvidence[],
  vault: VaultQuoteInput[],
): EvidenceMapItem[] {
  return evidence.map((row) => {
    const needle = row.requirement.toLowerCase().trim();
    const vaultQuotes = needle
      ? vault
          .filter((item) => haystack(item).includes(needle))
          .map((item) => ({
            id: item.id,
            title: item.title,
            excerpt: (item.body?.trim() || item.title).slice(0, 280),
            quotedAs: "user-provided" as const,
          }))
      : [];
    return { ...row, vaultQuotes };
  });
}

export const EVIDENCE_MAP_DISCLAIMER =
  "Fit is overlap between this resume (and optional vault quotes you supplied) and the listing. It is not a probability of getting hired.";
