import { describe, expect, it } from "vitest";
import { jobTrustChips } from "./trust";

describe("jobTrustChips", () => {
  it("surfaces source, freshness, broken apply links, duplicates, and fee language", () => {
    const chips = jobTrustChips(
      {
        source: "greenhouse",
        listingKind: "live",
        freshnessLabel: "stale",
        status: "open",
        applyUrlStatus: "broken",
        injectionFlagged: true,
        signals: [
          { kind: "probable_duplicate", message: "Same description as another listing." },
          { kind: "payment_request", message: "Mentions a fee." },
        ],
      },
      "Stale",
    );
    const labels = chips.map((chip) => chip.label);
    expect(labels).toContain("greenhouse board");
    expect(labels).toContain("Stale");
    expect(labels).toContain("Apply link unavailable");
    expect(labels).toContain("Untrusted source text");
    expect(labels).toContain("Possible duplicate");
    expect(labels).toContain("Mentions a payment or fee");
  });
});
