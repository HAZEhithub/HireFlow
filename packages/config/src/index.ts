function bool(value: string | undefined, fallback = false) {
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

export const flags = {
  aiExternalEnabled: bool(process.env.AI_EXTERNAL_ENABLED),
  paidProvidersEnabled: bool(process.env.PAID_PROVIDERS_ENABLED),
};

export const urls = {
  app: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  marketing: process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3002",
  api: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  ollama: process.env.OLLAMA_URL ?? "http://localhost:11434",
};

export const storage = {
  uploadDir: process.env.UPLOAD_DIR ?? ".data/uploads",
  r2Configured: Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  ),
};

export { sendEmail } from "./email";
export { rateLimit, resetRateLimits } from "./rate-limit";
export { deliverAuthEmail } from "./mailbox";
export { DEV_AUTH_SECRET_FALLBACK, resolveAuthSecret } from "./auth-secret";
export { rateLimitSubject, trustForwardedClientIp } from "./client-ip";
export { adminEmails, adminUserIds, isAdminUser } from "./admin";

export function assertNoUnpaidSensitiveLlm(payloadClass: "sensitive" | "public") {
  if (payloadClass !== "sensitive") return;
  if (!flags.paidProvidersEnabled) {
    throw new Error(
      "Sensitive payloads cannot use external models unless PAID_PROVIDERS_ENABLED is true and the user consented.",
    );
  }
}
