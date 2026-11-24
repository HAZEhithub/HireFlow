import { parseJobSearch } from "@hireflow/jobs";
// parseJobSearch is a pure helper and does not open the database.
import { describe, expect, it } from "vitest";
import { jobsFilterHref } from "./jobs-filter-href";

describe("Discover search state", () => {
  it("keeps filters in query params so empty and filtered states are distinct", () => {
    const empty = parseJobSearch({});
    const filtered = parseJobSearch({ q: "designer", workplace: "hybrid", employment: "internship", page: "1" });
    expect(empty.q).toBeUndefined();
    expect(filtered.q).toBe("designer");
    expect(filtered.workplace).toBe("hybrid");
    expect(filtered.employment).toBe("internship");
  });

  it("internship shortcuts keep other filters and drop the page", () => {
    const href = jobsFilterHref({ q: "designer", country: "IN", employment: "full_time", page: "2" }, "internship");
    expect(href).toContain("q=designer");
    expect(href).toContain("country=IN");
    expect(href).toContain("employment=internship");
    expect(href).not.toContain("page=");
  });
});
