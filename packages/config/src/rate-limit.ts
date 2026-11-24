type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = input.now ?? Date.now();
  const existing = buckets.get(input.key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
    return { ok: true, remaining: input.limit - 1, retryAfterMs: input.windowMs };
  }
  if (existing.count >= input.limit) {
    return { ok: false, remaining: 0, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }
  existing.count += 1;
  return { ok: true, remaining: input.limit - existing.count, retryAfterMs: existing.resetAt - now };
}

export function resetRateLimits() {
  buckets.clear();
}
