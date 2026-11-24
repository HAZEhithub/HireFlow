import { describe, expect, it } from "vitest";
import { toUserImportedJob } from "./import-job";
import { EMPLOYER_REGISTRY } from "./registry";
import { assertPermittedCollection } from "./ssrf";

describe("job ingestion policy", () => {
  it("starts with an empty curated registry (no invented employers)", () => {
    expect(EMPLOYER_REGISTRY).toEqual([]);
  });

  it("blocks server-side collection from forbidden hosts", () => {
    expect(() => assertPermittedCollection("https://www.linkedin.com/jobs/view/1")).toThrow(
      /not permitted/,
    );
  });

  it("marks URL imports as user_import without fetching the page", () => {
    const job = toUserImportedJob({
      applyUrl: "https://boards.greenhouse.io/example/jobs/1",
      title: "Intern",
      companyName: "Example",
      descriptionText: "Build things.",
    });
    expect(job.source).toBe("user_import");
    expect(job.applyUrl).toContain("greenhouse.io");
  });

  it("allows manual paste of collection-host apply URLs without fetching them", () => {
    const job = toUserImportedJob({
      applyUrl: "https://www.naukri.com/job-listings-example",
      title: "Analyst",
      companyName: "Example",
      descriptionText: "Pasted by the user.",
    });
    expect(job.source).toBe("user_import");
    expect(job.listingKind).toBe("user_import");
  });
});
