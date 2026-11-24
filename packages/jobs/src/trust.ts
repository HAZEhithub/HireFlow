export type TrustTone = "neutral" | "good" | "warn";

export type TrustChipModel = {
  tone: TrustTone;
  label: string;
};

export type JobTrustInput = {
  source: string;
  listingKind: string;
  freshnessLabel: string;
  status: string;
  applyUrlStatus?: string | null;
  injectionFlagged?: boolean | null;
  freshnessLabelText?: string;
  signals?: Array<{ kind: string; message: string }>;
};

export function jobTrustChips(job: JobTrustInput, freshnessLabel: string): TrustChipModel[] {
  const chips: TrustChipModel[] = [];
  chips.push({
    tone: job.listingKind === "fixture" || job.listingKind === "user_import" || job.status !== "open" ? "warn" : "neutral",
    label:
      job.listingKind === "fixture"
        ? "Development sample"
        : job.listingKind === "user_import"
          ? "Imported by you"
          : `${job.source} board`,
  });
  chips.push({
    tone: job.freshnessLabel === "stale" || job.freshnessLabel === "expired" || job.freshnessLabel === "unavailable" ? "warn" : "good",
    label: freshnessLabel,
  });
  if (job.status !== "open") {
    chips.push({ tone: "warn", label: `Status: ${job.status}` });
  }
  if (job.applyUrlStatus === "broken" || job.applyUrlStatus === "unavailable" || job.freshnessLabel === "unavailable") {
    chips.push({ tone: "warn", label: "Apply link unavailable" });
  }
  if (job.injectionFlagged) {
    chips.push({ tone: "warn", label: "Untrusted source text" });
  }
  for (const signal of job.signals ?? []) {
    if (signal.kind === "probable_duplicate") {
      chips.push({ tone: "warn", label: "Possible duplicate" });
    } else if (signal.kind === "payment_request") {
      chips.push({ tone: "warn", label: "Mentions a payment or fee" });
    } else if (signal.kind === "fixture" || signal.kind === "untrusted_text") {
      continue;
    } else {
      chips.push({ tone: "warn", label: signal.message.slice(0, 80) });
    }
  }
  return chips;
}
