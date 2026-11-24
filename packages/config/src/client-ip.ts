type Env = Record<string, string | undefined>;

/** Only honor forwarding headers when this process sits behind a proxy that overwrites them. */
export function trustForwardedClientIp(env: Env = process.env): boolean {
  return env.TRUST_PROXY === "true" || env.TRUST_PROXY === "1";
}

export function rateLimitSubject(
  headers: Headers,
  fallback = "local",
  env: Env = process.env,
): string {
  if (!trustForwardedClientIp(env)) return fallback;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  return forwarded || realIp || fallback;
}
