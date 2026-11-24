import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it("allows in-app paths and rejects open redirects", () => {
    expect(safeNextPath("/profile")).toBe("/profile");
    expect(safeNextPath("/jobs/saved")).toBe("/jobs/saved");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("/%2fevil.example")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});
