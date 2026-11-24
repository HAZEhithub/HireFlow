import { sha256Short } from "./hash";
import { htmlToText } from "./html";
import type { CanonicalJob, SalaryDisclosure, WorkplaceType } from "./types";

const COUNTRY_ALIASES: Record<string, string> = {
  india: "IN",
  in: "IN",
  "united states": "US",
  usa: "US",
  us: "US",
  "united kingdom": "GB",
  uk: "GB",
  gb: "GB",
  germany: "DE",
  de: "DE",
  canada: "CA",
  ca: "CA",
  singapore: "SG",
  sg: "SG",
  australia: "AU",
  au: "AU",
  ireland: "IE",
  ie: "IE",
  netherlands: "NL",
  nl: "NL",
};

export function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|limited|pvt|private|corp|corporation|co|gmbh|plc)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function normalizeEmploymentType(raw: string | undefined | null): string {
  if (!raw) return "";
  const value = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (value.includes("intern")) return "internship";
  if (value.includes("fulltime") || value === "full-time" || value.includes("permanent")) return "full_time";
  if (value.includes("parttime")) return "part_time";
  if (value.includes("contract") || value.includes("temporary") || value.includes("temp")) return "contract";
  if (value.includes("freelance")) return "freelance";
  return "";
}

export function inferWorkplace(raw: string | undefined | null, locations: string[] = []): WorkplaceType {
  const hay = `${raw ?? ""} ${locations.join(" ")}`.toLowerCase();
  if (!hay.trim()) return "unknown";
  if (/\bhybrid\b/.test(hay)) return "hybrid";
  if (/\bremote\b/.test(hay) || hay.includes("work from home") || hay.includes("wfh")) return "remote";
  if (/\bonsite\b/.test(hay) || /\bon-site\b/.test(hay) || /\bin office\b/.test(hay)) return "onsite";
  if (/^(on ?site)$/.test((raw ?? "").toLowerCase())) return "onsite";
  return "unknown";
}

export function parseLocation(raw: string | undefined | null): {
  city?: string;
  country?: string;
  locationText?: string;
} {
  if (!raw?.trim()) return {};
  const text = raw.replace(/\s+/g, " ").trim();
  if (/^remote$/i.test(text)) return { locationText: text };
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  const last = parts.at(-1)?.toLowerCase();
  const country = last ? COUNTRY_ALIASES[last] : undefined;
  const city = parts.length > 1 ? parts[0] : country ? undefined : parts[0];
  return { city, country, locationText: text };
}

export function descriptionFingerprint(text: string): string {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 800);
  return sha256Short(normalized);
}

export function contentHash(job: Pick<CanonicalJob, "title" | "companyName" | "descriptionText" | "applyUrl">): string {
  return sha256Short(
    `${normalizeTitle(job.title)}|${normalizeCompany(job.companyName)}|${job.descriptionText.trim().toLowerCase()}|${canonicalUrl(job.applyUrl) ?? job.applyUrl}`,
  );
}

export function fingerprint(job: Pick<CanonicalJob, "title" | "companyName" | "city" | "country" | "workplaceType">): string {
  return sha256Short(
    `${normalizeCompany(job.companyName)}|${normalizeTitle(job.title)}|${(job.country ?? "").toLowerCase()}|${(job.city ?? "").toLowerCase()}|${job.workplaceType}`,
  );
}

export function salaryDisclosure(min?: number | null, max?: number | null, currency?: string | null): SalaryDisclosure {
  if ((min != null && min > 0) || (max != null && max > 0)) {
    return currency ? "disclosed" : "unknown";
  }
  return "not_provided";
}

export function isoFromUnknown(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

export function coerceText(value: unknown): string {
  if (typeof value === "string") return htmlToText(value);
  if (value == null) return "";
  return htmlToText(String(value));
}

function skillMentioned(text: string, skill: string): boolean {
  if (!text) return false;
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s+");
  return new RegExp(`(?<![a-z0-9+#])${escaped}(?![a-z0-9+#])`, "i").test(text);
}

export function extractSkillsFromText(text: string): { required: string[]; preferred: string[] } {
  const required: string[] = [];
  const preferred: string[] = [];
  const catalog = [
    "TypeScript",
    "JavaScript",
    "Python",
    "Java",
    "Go",
    "Rust",
    "React",
    "Node.js",
    "SQL",
    "PostgreSQL",
    "AWS",
    "Kubernetes",
    "Docker",
    "Machine Learning",
    "Product Management",
    "Figma",
  ];
  const preferredSection = /prefer(?:red)?[:\s]([\s\S]{0,400})/i.exec(text)?.[1] ?? "";
  for (const skill of catalog) {
    if (!skillMentioned(text, skill)) continue;
    if (skillMentioned(preferredSection, skill)) preferred.push(skill);
    else required.push(skill);
  }
  return { required, preferred };
}
