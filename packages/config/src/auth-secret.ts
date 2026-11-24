export const DEV_AUTH_SECRET_FALLBACK = "dev-only-change-me-32-characters-min";

type Env = Record<string, string | undefined>;

export function resolveAuthSecret(env: Env = process.env): string {
  const secret = env.BETTER_AUTH_SECRET?.trim() ?? "";
  const production = env.NODE_ENV === "production";
  if (production) {
    if (!secret || secret.length < 32 || secret === DEV_AUTH_SECRET_FALLBACK) {
      throw new Error(
        "BETTER_AUTH_SECRET must be a unique value of at least 32 characters in production.",
      );
    }
    return secret;
  }
  return secret.length >= 32 ? secret : DEV_AUTH_SECRET_FALLBACK;
}
