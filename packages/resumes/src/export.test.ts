import { describe, expect, it } from "vitest";
import { emptyStructuredResume } from "@hireflow/shared";
import { parseResumeFile } from "./parse";
import { exportResumeDocx } from "./export/docx";
import { exportResumePdf } from "./export/pdf";

function sample() {
  const resume = emptyStructuredResume();
  resume.personal.fullName = "Asha Raman";
  resume.personal.email = "asha.raman@example.com";
  resume.personal.headline = "Software Engineer";
  resume.personal.summary = "Builds TypeScript services and PostgreSQL schemas.";
  resume.skills = [{ id: "s1", category: "", items: ["TypeScript", "PostgreSQL"] }];
  resume.experience = [
    {
      id: "e1",
      title: "Software Engineer",
      company: "Northwind Labs",
      location: "Bengaluru",
      startDate: "2022",
      endDate: "Present",
      responsibilities: ["Built billing APIs in TypeScript."],
      achievements: ["Shipped a PostgreSQL migration without downtime claims invented."],
    },
  ];
  resume.education = [
    {
      id: "ed1",
      school: "NIT",
      credential: "B.Tech",
      field: "Computer Science",
      location: "",
      startDate: "2018",
      endDate: "2022",
      details: [],
    },
  ];
  return resume;
}

describe("resume export", () => {
  it("writes a valid PDF whose extracted text includes resume facts", { timeout: 20_000 }, async () => {
    const pdf = await exportResumePdf(sample(), "professional-classic");
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
    const parsed = await parseResumeFile({
      buffer: pdf,
      filename: "asha.pdf",
      mimeType: "application/pdf",
    });
    expect(parsed.content.personal.fullName).toContain("Asha");
    expect(parsed.extractedChars).toBeGreaterThan(20);
    expect(parsed.likelyScanned).toBe(false);
  });

  it("writes a valid DOCX that round-trips the candidate name", async () => {
    const docx = await exportResumeDocx(sample(), "modern-professional");
    expect(docx[0]).toBe(0x50);
    expect(docx[1]).toBe(0x4b);
    const parsed = await parseResumeFile({
      buffer: docx,
      filename: "asha.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(parsed.kind).toBe("docx");
    expect(parsed.content.personal.fullName).toContain("Asha");
  });

  it("keeps compact technical layout exportable", { timeout: 20_000 }, async () => {
    const pdf = await exportResumePdf(sample(), "compact-technical");
    expect(pdf.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
