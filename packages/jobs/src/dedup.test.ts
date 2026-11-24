import { describe, expect, it } from "vitest";
import { decideDuplicate } from "./dedup";
import type { CanonicalJob } from "./types";

function job(partial: Partial<CanonicalJob>): CanonicalJob {
  return {
    source: "greenhouse",
    externalId: "1",
    title: "Software Engineer",
    companyName: "Acme",
    applyUrl: "https://boards.greenhouse.io/acme/jobs/1",
    descriptionText: "Build APIs.",
    workplaceType: "onsite",
    employmentType: "full_time",
    locations: ["Bengaluru, India"],
    city: "Bengaluru",
    country: "IN",
    firstSeen: "2026-11-21T00:00:00.000Z",
    lastVerified: "2026-11-21T00:00:00.000Z",
    status: "open",
    ...partial,
  };
}

describe("duplicate detection", () => {
  it("matches the same provider id and the same canonical URL", () => {
    expect(decideDuplicate(job({}), job({})).kind).toBe("exact");
    expect(
      decideDuplicate(
        job({ source: "greenhouse", externalId: "1" }),
        job({
          source: "lever",
          externalId: "z",
          applyUrl: "https://boards.greenhouse.io/acme/jobs/1?utm=1",
        }),
      ).kind,
    ).toBe("exact");
  });

  it("keeps senior and junior openings at the same company distinct", () => {
    const decision = decideDuplicate(
      job({ title: "Senior Engineer", externalId: "1" }),
      job({
        title: "Junior Engineer",
        externalId: "2",
        applyUrl: "https://boards.greenhouse.io/acme/jobs/2",
      }),
    );
    expect(decision.kind).not.toBe("exact");
  });

  it("keeps similar titles at different locations distinct", () => {
    const decision = decideDuplicate(
      job({ city: "Bengaluru", country: "IN" }),
      job({ city: "Mumbai", country: "IN", externalId: "2", applyUrl: "https://boards.greenhouse.io/acme/jobs/2" }),
    );
    expect(decision.kind).toBe("distinct");
  });

  it("does not merge a user import with a live listing or another importer", () => {
    const live = job({ listingKind: "live" });
    const imported = job({
      source: "user_import",
      listingKind: "user_import",
      importedByUserId: "user-a",
      externalId: "user:user-a:https://boards.greenhouse.io/acme/jobs/1",
    });
    const otherUser = job({
      source: "user_import",
      listingKind: "user_import",
      importedByUserId: "user-b",
      externalId: "user:user-b:https://boards.greenhouse.io/acme/jobs/1",
    });
    expect(decideDuplicate(live, imported).kind).toBe("distinct");
    expect(decideDuplicate(imported, otherUser).kind).toBe("distinct");
  });

  it("groups the same opening across providers at the same place", () => {
    const decision = decideDuplicate(
      job({ source: "greenhouse", externalId: "g" }),
      job({
        source: "lever",
        externalId: "l",
        applyUrl: "https://jobs.lever.co/acme/other",
      }),
    );
    expect(decision.kind).toBe("exact");
  });
});
