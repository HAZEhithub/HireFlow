import { getAuth } from "@hireflow/auth";
import { rateLimit, rateLimitSubject } from "@hireflow/config";

async function handler(request: Request) {
  const subject = rateLimitSubject(request.headers);
  const limited = rateLimit({ key: `auth:${subject}`, limit: 30, windowMs: 60_000 });
  if (!limited.ok) {
    return new Response("Too many requests", { status: 429 });
  }
  const auth = await getAuth();
  return auth.handler(request);
}

export const GET = handler;
export const POST = handler;
