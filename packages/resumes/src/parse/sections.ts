import { randomUUID } from "node:crypto";
import {
  emptyStructuredResume,
  type StructuredResume,
} from "@hireflow/shared";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}/;
const URL = /https?:\/\/[^\s)]+/gi;
const LINKEDIN = /linkedin\.com\/in\/[A-Za-z0-9_-]+/i;
const GITHUB = /github\.com\/[A-Za-z0-9_-]+/i;

const HEADINGS: Array<{ id: keyof Pick<StructuredResume, "experience" | "education" | "projects" | "certifications" | "skills" | "languages" | "achievements" | "links"> | "summary"; pattern: RegExp }> = [
  { id: "summary", pattern: /^(professional\s+)?(summary|profile|objective|about(\s+me)?)$/i },
  { id: "skills", pattern: /^(skills|technical skills|core competencies|technologies|tech stack)$/i },
  { id: "experience", pattern: /^(experience|work experience|employment|professional experience|work history)$/i },
  { id: "education", pattern: /^(education|academic|academics)$/i },
  { id: "projects", pattern: /^(projects|personal projects|selected projects)$/i },
  { id: "certifications", pattern: /^(certifications?|certificates|licenses)$/i },
  { id: "achievements", pattern: /^(achievements|awards|honors)$/i },
  { id: "languages", pattern: /^(languages)$/i },
  { id: "links", pattern: /^(links|profiles|websites)$/i },
];

export type ParseFieldConfidence = "extracted" | "missing";

export type ResumeParseResult = {
  content: StructuredResume;
  missingFields: string[];
  warnings: string[];
  likelyScanned: boolean;
  fieldConfidence: Record<string, ParseFieldConfidence>;
};

function newId() {
  return randomUUID();
}

function splitLines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, index, rows) => line.length > 0 || (index > 0 && rows[index - 1]));
}

function headingId(line: string) {
  const compact = line.replace(/[:\-–—]+$/, "").trim();
  if (compact.length > 48) return null;
  return HEADINGS.find((row) => row.pattern.test(compact))?.id ?? null;
}

function looksLikeName(line: string) {
  if (EMAIL.test(line) || PHONE.test(line) || URL.test(line)) return false;
  if (headingId(line)) return false;
  if (/,/.test(line)) return false;
  const words = line.split(" ").filter(Boolean);
  return words.length >= 2 && words.length <= 5 && line.length <= 80 && !/\d/.test(line);
}

function collectSectionMap(lines: string[]) {
  const sections = new Map<string, string[]>();
  let current = "header";
  sections.set(current, []);
  for (const line of lines) {
    const heading = headingId(line);
    if (heading) {
      current = heading;
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    sections.get(current)?.push(line);
  }
  return sections;
}

function parseDateRange(line: string): { startDate?: string; endDate?: string; current?: boolean; rest: string } {
  const match = line.match(
    /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\b\d{4})(\s*[-–—to]+\s*)(present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4})/i,
  );
  if (!match || match.index == null) return { rest: line };
  const startDate = match[1];
  const endRaw = match[3] ?? "";
  const current = /present|current|now/i.test(endRaw);
  const rest = `${line.slice(0, match.index)} ${line.slice(match.index + match[0].length)}`.replace(/\s+/g, " ").trim();
  return { startDate, endDate: current ? "Present" : endRaw, current, rest };
}

function bulletsFrom(lines: string[]) {
  return lines
    .map((line) => line.replace(/^[-*•●▪◦]+\s*/, "").trim())
    .filter((line) => line.length > 8);
}

function parseExperience(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    const dated = parseDateRange(line);
    const dateOnly = Boolean(dated.startDate && dated.rest.length < 8);
    const looksTitle = /engineer|developer|intern|analyst|designer|manager|consultant|founder|lead/i.test(line);
    if (looksTitle && !dateOnly && current.length) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) blocks.push(current);
  return blocks.slice(0, 20).map((block) => {
    const header = block[0] ?? "";
    const dateLine = block.find((line) => parseDateRange(line).startDate) ?? header;
    const dates = parseDateRange(dateLine);
    const headerDates = parseDateRange(header);
    const parts = (headerDates.rest || header).split(/[|,•·]/).map((part) => part.trim()).filter(Boolean);
    const title = parts[0] ?? header;
    const company = parts[1] ?? "";
    const location = parts[2] ?? "";
    const body = bulletsFrom(block.slice(1).filter((line) => line !== dateLine || line === header));
    return {
      id: newId(),
      title: title.slice(0, 160),
      company: company.slice(0, 160),
      location: location.slice(0, 160),
      startDate: dates.startDate ?? "",
      endDate: dates.endDate ?? "",
      current: dates.current,
      responsibilities: body.slice(0, 16),
      achievements: [] as string[],
    };
  }).filter((row) => row.title || row.company);
}

function parseEducation(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (/(university|college|institute|school|bachelor|master|b\.tech|m\.tech|degree)/i.test(line) && current.length) {
      blocks.push(current);
      current = [line];
    } else current.push(line);
  }
  if (current.length) blocks.push(current);
  return blocks.slice(0, 12).map((block) => {
    const header = block[0] ?? "";
    const dates = parseDateRange(header);
    return {
      id: newId(),
      school: (dates.rest || header).slice(0, 200),
      credential: (block[1] ?? "").slice(0, 200),
      field: "",
      location: "",
      startDate: dates.startDate ?? "",
      endDate: dates.endDate ?? "",
      details: bulletsFrom(block.slice(1)).slice(0, 8),
    };
  }).filter((row) => row.school);
}

function parseProjects(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (!line.startsWith("-") && !line.startsWith("•") && current.length && line.length < 80) {
      blocks.push(current);
      current = [line];
    } else current.push(line);
  }
  if (current.length) blocks.push(current);
  return blocks.slice(0, 16).map((block) => ({
    id: newId(),
    name: (block[0] ?? "").slice(0, 200),
    url: "",
    summary: "",
    bullets: bulletsFrom(block.slice(1)).slice(0, 12),
    technologies: [] as string[],
  })).filter((row) => row.name);
}

function parseSkills(lines: string[]) {
  const items = lines
    .flatMap((line) => line.split(/[,|/•·;]/))
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter((item) => item.length > 1 && item.length <= 80)
    .slice(0, 40);
  if (!items.length) return [];
  return [{ id: newId(), category: "", items }];
}

export function parseResumeSections(text: string, extraWarnings: string[] = []): ResumeParseResult {
  const resume = emptyStructuredResume();
  const warnings = [...extraWarnings];
  const fieldConfidence: Record<string, ParseFieldConfidence> = {};
  const mark = (field: string, value: string | undefined) => {
    fieldConfidence[field] = value?.trim() ? "extracted" : "missing";
  };

  const lines = splitLines(text).filter(Boolean);
  const sections = collectSectionMap(lines);
  const header = sections.get("header") ?? [];

  const emailLine = lines.find((line) => EMAIL.test(line));
  const email = emailLine?.match(EMAIL)?.[0] ?? "";
  const phoneLine = lines.find((line) => PHONE.test(line) && !EMAIL.test(line));
  const phoneMatch = phoneLine?.match(PHONE)?.[0] ?? "";
  const phone = phoneMatch.replace(/\s+/g, " ").trim();
  const nameLine = header.find((line) => looksLikeName(line)) ?? lines.find((line) => looksLikeName(line)) ?? "";
  const locationLine =
    header.find((line) => /,/.test(line) && !EMAIL.test(line) && !PHONE.test(line) && !looksLikeName(line)) ?? "";

  resume.personal.fullName = nameLine.slice(0, 120);
  resume.personal.email = email.slice(0, 160);
  resume.personal.phone = phone.slice(0, 40);
  resume.personal.location = locationLine.slice(0, 160);

  const urls = [...text.matchAll(URL)].map((row) => row[0]).slice(0, 8);
  const linkedin = text.match(LINKEDIN)?.[0];
  const github = text.match(GITHUB)?.[0];
  if (linkedin) resume.links.push({ id: newId(), label: "LinkedIn", url: linkedin.startsWith("http") ? linkedin : `https://${linkedin}` });
  if (github) resume.links.push({ id: newId(), label: "GitHub", url: github.startsWith("http") ? github : `https://${github}` });
  for (const url of urls) {
    if (resume.links.some((link) => link.url.includes(url.replace(/^https?:\/\//, "")))) continue;
    resume.links.push({ id: newId(), label: "Link", url: url.slice(0, 500) });
  }

  const summaryLines = sections.get("summary") ?? [];
  resume.personal.summary = summaryLines.join(" ").slice(0, 4000);
  if (!resume.personal.summary && header.length > 1) {
    const maybe = header.filter((line) => line.length > 40 && !EMAIL.test(line) && !PHONE.test(line)).join(" ");
    if (maybe) warnings.push("A professional summary was not clearly headed; nothing was inferred into Summary.");
  }

  resume.skills = parseSkills(sections.get("skills") ?? []);
  resume.experience = parseExperience(sections.get("experience") ?? []);
  resume.education = parseEducation(sections.get("education") ?? []);
  resume.projects = parseProjects(sections.get("projects") ?? []);
  resume.certifications = (sections.get("certifications") ?? [])
    .filter(Boolean)
    .slice(0, 16)
    .map((name) => ({ id: newId(), name: name.slice(0, 200), issuer: "", date: "", url: "" }));
  resume.achievements = (sections.get("achievements") ?? []).slice(0, 20);
  resume.languages = (sections.get("languages") ?? [])
    .flatMap((line) => line.split(/[,;]/))
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((name) => ({ id: newId(), name: name.slice(0, 80), proficiency: "" }));

  mark("name", resume.personal.fullName);
  mark("email", resume.personal.email);
  mark("phone", resume.personal.phone);
  mark("location", resume.personal.location);
  mark("summary", resume.personal.summary);
  mark("skills", resume.skills[0]?.items.join(","));
  mark("experience", resume.experience[0]?.title);
  mark("education", resume.education[0]?.school);

  const missingFields = Object.entries(fieldConfidence)
    .filter(([, status]) => status === "missing")
    .map(([field]) => field);

  if (!resume.experience.length && !resume.skills.length && lines.length > 3) {
    warnings.push("Sections could not be identified reliably. Review every field before saving. Nothing was invented.");
  }

  return { content: resume, missingFields, warnings, likelyScanned: false, fieldConfidence };
}
