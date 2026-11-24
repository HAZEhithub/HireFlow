import { describe, expect, it } from "vitest";
import { likeContains, parseJobSearch } from "./query";

describe("parseJobSearch", () => {
  it("maps filter query params that the API actually applies", () => {
    const query = parseJobSearch({
      q: "engineer",
      workplace: "remote",
      employment: "internship",
      country: "in",
      sort: "recently_verified",
      page: "2",
    });
    expect(query.q).toBe("engineer");
    expect(query.workplace).toBe("remote");
    expect(query.employment).toBe("internship");
    expect(query.country).toBe("IN");
    expect(query.sort).toBe("recently_verified");
    expect(query.page).toBe(2);
  });

  it("strips LIKE wildcards from user filter text", () => {
    expect(likeContains("TypeScript")).toBe("%TypeScript%");
    expect(likeContains("%admin%")).toBe("%admin%");
    expect(likeContains("___")).toBeUndefined();
  });
});
