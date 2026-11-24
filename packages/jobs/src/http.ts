import type { FetchLike } from "./types";

export const PROVIDER_TIMEOUT_MS = 15_000;
export const PROVIDER_MAX_RETRIES = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function providerGet(
  url: string,
  opts?: { fetch?: FetchLike; attempt?: number },
): Promise<Response> {
  const fetchImpl = opts?.fetch ?? fetch;
  const attempt = opts?.attempt ?? 0;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      headers: { Accept: "application/json", "User-Agent": "HireFlow/0.2 (+job-ingest)" },
    });
  } catch (error) {
    if (attempt < PROVIDER_MAX_RETRIES) {
      await sleep(250 * 2 ** attempt);
      return providerGet(url, { ...opts, attempt: attempt + 1 });
    }
    throw error;
  }
  if (response.status === 429 && attempt < PROVIDER_MAX_RETRIES) {
    const retryAfter = Number(response.headers.get("retry-after") ?? "1");
    await sleep(Math.min(5_000, Math.max(250, retryAfter * 1000)) * 2 ** attempt);
    return providerGet(url, { ...opts, attempt: attempt + 1 });
  }
  return response;
}
