import { parseJobSearch } from "@hireflow/jobs";
// parseJobSearch is a pure helper and does not open the database.
import { describe, expect, it } from "vitest";

describe("Discover search state", () => {
  it("keeps filters in query params so empty and filtered states are distinct", () => {
    const empty = parseJobSearch({});
    const filtered = parseJobSearch({ q: "designer", workplace: "hybrid", page: "1" });
    expect(empty.q).toBeUndefined();
    expect(filtered.q).toBe("designer");
    expect(filtered.workplace).toBe("hybrid");
  });
});
