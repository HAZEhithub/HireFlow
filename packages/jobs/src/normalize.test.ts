import { describe, expect, it } from "vitest";
import {
  canonicalUrl,
  extractSkillsFromText,
  inferWorkplace,
  isoFromUnknown,
  normalizeCompany,
  normalizeEmploymentType,
  normalizeTitle,
  parseLocation,
  salaryDisclosure,
} from "./normalize";

describe("normalization", () => {
  it("normalizes titles and companies without inventing data", () => {
    expect(normalizeCompany("Acme Labs Pvt. Ltd.")).toBe("acme labs");
    expect(normalizeTitle("Senior Software Engineer II")).toBe("senior software engineer ii");
    expect(normalizeTitle("Senior Engineer")).not.toBe(normalizeTitle("Junior Engineer"));
  });

  it("parses locations and employment types from source strings only", () => {
    expect(parseLocation("Bengaluru, India")).toMatchObject({ city: "Bengaluru", country: "IN" });
    expect(parseLocation("Remote")).toMatchObject({ locationText: "Remote" });
    expect(normalizeEmploymentType("FullTime")).toBe("full_time");
    expect(normalizeEmploymentType("Intern")).toBe("internship");
    expect(normalizeEmploymentType("mystery")).toBe("");
    expect(inferWorkplace("Hybrid", ["Mumbai, India"])).toBe("hybrid");
    expect(inferWorkplace(undefined, [])).toBe("unknown");
  });

  it("canonicalizes URLs and salary disclosure states", () => {
    expect(canonicalUrl("https://www.Jobs.Lever.co/acme/1/?utm=x")).toBe("https://jobs.lever.co/acme/1");
    expect(salaryDisclosure(undefined, undefined, undefined)).toBe("not_provided");
    expect(salaryDisclosure(10, 20, "INR")).toBe("disclosed");
    expect(isoFromUnknown(1_720_000_000_000)).toBe(new Date(1_720_000_000_000).toISOString());
  });

  it("extracts skills on word boundaries so JavaScript is not Java", () => {
    const fromJs = extractSkillsFromText("Build JavaScript services. Preferred: React.");
    expect(fromJs.required).toContain("JavaScript");
    expect(fromJs.required).not.toContain("Java");
    expect(fromJs.preferred).toContain("React");
    const fromDjango = extractSkillsFromText("Django and PostgreSQL.");
    expect(fromDjango.required).toContain("PostgreSQL");
    expect(fromDjango.required).not.toContain("Go");
  });
});
