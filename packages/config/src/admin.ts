export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function adminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function isAdminUser(input: {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
}): boolean {
  if (adminUserIds().includes(input.id)) return true;
  const email = input.email?.trim().toLowerCase();
  if (!email || !adminEmails().includes(email)) return false;
  return input.emailVerified === true;
}
