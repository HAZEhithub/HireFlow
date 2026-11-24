/** Prevent open redirects from the `next` query param. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\") || value.includes("://") || value.includes("%2f") || value.includes("%2F")) {
    return "/";
  }
  if (!/^\/[\w.~/-]*$/.test(value)) return "/";
  if (value.includes("//")) return "/";
  return value;
}
