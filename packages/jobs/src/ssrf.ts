const FORBIDDEN_COLLECTION = [
  "linkedin.com",
  "lnkd.in",
  "naukri.com",
  "indeed.com",
  "indeed.co.in",
  "indeed.co.uk",
  "workday.com",
  "myworkdayjobs.com",
];

const BLOCKED_HOSTS = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata.google.internal.",
  "kubernetes.default.svc",
]);

const METADATA_HOSTS = new Set([
  "boards.greenhouse.io",
  "job-boards.greenhouse.io",
  "jobs.lever.co",
  "jobs.ashbyhq.com",
]);

export const IMPORT_FETCH_TIMEOUT_MS = 5_000;
export const IMPORT_FETCH_MAX_BYTES = 256_000;
export const IMPORT_MAX_REDIRECTS = 2;

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

function ipv4Octets(host: string): number[] | undefined {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    if (parts.some((n) => Number.isNaN(n) || n > 255)) return undefined;
    return parts;
  }
  if (/^\d+$/.test(host)) {
    const n = Number(host);
    if (!Number.isSafeInteger(n) || n < 0 || n > 0xffffffff) return undefined;
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  }
  const two = host.match(/^(\d{1,3})\.(\d{1,3})$/);
  if (two) {
    const a = Number(two[1]);
    const d = Number(two[2]);
    if (a <= 255 && d <= 255) return [a, 0, 0, d];
  }
  const three = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (three) {
    const a = Number(three[1]);
    const b = Number(three[2]);
    const d = Number(three[3]);
    if (a <= 255 && b <= 255 && d <= 255) return [a, b, 0, d];
  }
  return undefined;
}

function isPrivateIpv4(parts: number[]): boolean {
  const [a, b] = parts;
  if (a === undefined || b === undefined) return false;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export function isPrivateOrLocalHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (
    !h ||
    BLOCKED_HOSTS.has(h) ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal")
  ) {
    return true;
  }
  if (h.includes(":")) {
    const compact = h.replace(/^\[|\]$/g, "");
    if (
      compact === "::" ||
      compact === "::1" ||
      compact.startsWith("fe80:") ||
      compact.startsWith("fc") ||
      compact.startsWith("fd")
    ) {
      return true;
    }
    if (compact.startsWith("::ffff:")) {
      return isPrivateOrLocalHost(compact.slice("::ffff:".length));
    }
  }
  const ip = ipv4Octets(h);
  return ip ? isPrivateIpv4(ip) : false;
}

export function assertPermittedCollection(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeUrlError("Invalid URL.");
  }
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (FORBIDDEN_COLLECTION.some((d) => host === d || host.endsWith(`.${d}`))) {
    throw new Error(
      "Server-side collection from this host is not permitted. Paste the apply URL, title, company, and description in-app. The browser extension is Phase 5 and is not required for discovery.",
    );
  }
}

export function persistableApplyUrl(url: string): URL | undefined {
  try {
    return assertPersistableApplyUrl(url);
  } catch {
    return undefined;
  }
}

export function isSafeApplyHref(url: string): boolean {
  return persistableApplyUrl(url) != null;
}

export function assertPersistableApplyUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UnsafeUrlError("Invalid URL.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed.");
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError("URLs with credentials are not allowed.");
  }
  const host = parsed.hostname.replace(/^\[|\]$/g, "");
  if (isPrivateOrLocalHost(host)) {
    throw new UnsafeUrlError("Internal, loopback, and link-local addresses are blocked.");
  }
  return parsed;
}

/** SSRF checks only. Collection-host bans apply to fetch, not manual paste. */
export function assertSafePublicHttpUrl(url: string): URL {
  return assertPersistableApplyUrl(url);
}

export function isAllowedMetadataHost(host: string): boolean {
  const h = host.replace(/^www\./, "").toLowerCase();
  return METADATA_HOSTS.has(h);
}

export type MetadataFetch = (input: string, init?: RequestInit) => Promise<Response>;

export async function fetchPublicPageTitle(
  url: string,
  opts?: { fetch?: MetadataFetch },
): Promise<{ title?: string; error?: string }> {
  let current: URL;
  try {
    current = assertPersistableApplyUrl(url);
    assertPermittedCollection(current.toString());
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unsafe URL." };
  }
  if (!isAllowedMetadataHost(current.hostname)) {
    return {
      error:
        "Automatic extraction is limited to Greenhouse, Lever, and Ashby hosted job pages. Enter details manually.",
    };
  }
  const fetchImpl = opts?.fetch ?? fetch;
  for (let hop = 0; hop <= IMPORT_MAX_REDIRECTS; hop++) {
    let response: Response;
    try {
      response = await fetchImpl(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(IMPORT_FETCH_TIMEOUT_MS),
        headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "HireFlow/0.2 (+job-import)" },
      });
    } catch {
      return { error: "The page could not be retrieved. Enter details manually." };
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) return { error: "Redirect without a location header." };
      let next: URL;
      try {
        next = new URL(location, current);
        assertSafePublicHttpUrl(next.toString());
      } catch {
        return { error: "Blocked an unsafe redirect." };
      }
      if (!isAllowedMetadataHost(next.hostname)) {
        return { error: "Redirect left the allowed job-board hosts." };
      }
      current = next;
      continue;
    }
    if (!response.ok) {
      return { error: `The page returned HTTP ${response.status}. Enter details manually.` };
    }
    const length = Number(response.headers.get("content-length") ?? "0");
    if (length > IMPORT_FETCH_MAX_BYTES) {
      return { error: "The page is larger than the import limit." };
    }
    const raw = await response.arrayBuffer();
    if (raw.byteLength > IMPORT_FETCH_MAX_BYTES) {
      return { error: "The page is larger than the import limit." };
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(raw);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    if (!title) return { error: "No title tag found." };
    const text = title.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
    return { title: text || undefined };
  }
  return { error: "Too many redirects." };
}
