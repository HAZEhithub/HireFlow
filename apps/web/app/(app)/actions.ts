"use server";

import { revokeSession } from "@hireflow/auth";
import { completenessFrom, getDb, notification, profile, user, userSettings } from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import { purgeUserResumeFiles } from "@hireflow/resumes";
import { profileSchema, settingsSchema } from "@hireflow/shared";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/session";

export async function saveProfileAction(formData: FormData) {
  const current = await requireUser();
  await assertEntitlement(current.id, "profile.read_write");
  const csv = (key: string) =>
    String(formData.get(key) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const lines = (key: string) =>
    String(formData.get(key) ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label) => ({ label }));

  const parsed = profileSchema.parse({
    headline: String(formData.get("headline") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    location: String(formData.get("location") ?? ""),
    countryCode: String(formData.get("countryCode") ?? "").slice(0, 2).toUpperCase(),
    preferredCountries: csv("preferredCountries").map((c) => c.slice(0, 2).toUpperCase()),
    workplacePreference: String(formData.get("workplacePreference") || "any"),
    status: String(formData.get("status") || "entry"),
    desiredTitles: csv("desiredTitles"),
    industries: csv("industries"),
    experienceLevel: String(formData.get("experienceLevel") ?? ""),
    salaryMin: formData.get("salaryMin") ? Number(formData.get("salaryMin")) : null,
    salaryCurrency: String(formData.get("salaryCurrency") || "INR"),
    employmentTypes: formData.getAll("employmentTypes"),
    workAuthorization: String(formData.get("workAuthorization") ?? ""),
    relocation: formData.get("relocation") === "on",
    availability: String(formData.get("availability") ?? ""),
    portfolioUrl: String(formData.get("portfolioUrl") ?? "") || "",
    linkedinUrl: String(formData.get("linkedinUrl") ?? "") || "",
    githubUrl: String(formData.get("githubUrl") ?? "") || "",
    skills: csv("skills"),
    education: lines("education"),
    experience: lines("experience"),
    certifications: lines("certifications"),
    projects: lines("projects"),
    openToInternships: formData.get("openToInternships") === "on",
    openToInternational: formData.get("openToInternational") === "on",
  });

  const db = await getDb();
  const existing = await db.query.profile.findFirst({ where: eq(profile.userId, current.id) });
  if (!existing) throw new Error("Profile missing");
  const merged = { ...existing, ...parsed };
  await db
    .update(profile)
    .set({
      ...parsed,
      completeness: completenessFrom(merged),
      updatedAt: new Date(),
    })
    .where(eq(profile.userId, current.id));
  revalidatePath("/");
  revalidatePath("/profile");
}

export async function completeOnboardingAction(formData: FormData) {
  await saveProfileAction(formData);
  const current = await requireUser();
  const db = await getDb();
  await db
    .update(profile)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(profile.userId, current.id));
  redirect("/");
}

export async function saveSettingsAction(formData: FormData) {
  const current = await requireUser();
  await assertEntitlement(current.id, "settings.read_write");
  const parsed = settingsSchema.parse({
    emailAlerts: formData.get("emailAlerts") === "on",
    productTips: formData.get("productTips") === "on",
    theme: String(formData.get("theme") || "system"),
    locale: String(formData.get("locale") || "en-IN"),
    aiExternalConsent: formData.get("aiExternalConsent") === "on",
    aiPaidConsent: formData.get("aiPaidConsent") === "on",
  });
  const db = await getDb();
  await db
    .update(userSettings)
    .set({ ...parsed, updatedAt: new Date() })
    .where(eq(userSettings.userId, current.id));
  revalidatePath("/settings");
}

export async function markNotificationReadAction(formData: FormData) {
  const current = await requireUser();
  await assertEntitlement(current.id, "notifications.inbox");
  const id = String(formData.get("id") ?? "");
  const db = await getDb();
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.id, id), eq(notification.userId, current.id)));
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function markAllNotificationsReadAction() {
  const current = await requireUser();
  await assertEntitlement(current.id, "notifications.inbox");
  const db = await getDb();
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.userId, current.id), isNull(notification.readAt)));
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function deleteAccountAction(formData: FormData) {
  const current = await requireUser();
  await assertEntitlement(current.id, "account.delete");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== current.email) {
    throw new Error("Type your email to confirm deletion.");
  }
  try {
    await revokeSession(await headers());
  } catch {
    /* continue; cookies are expired below */
  }
  const db = await getDb();
  await purgeUserResumeFiles(current.id);
  await db.delete(user).where(eq(user.id, current.id));
  const jar = await cookies();
  jar.delete("better-auth.session_token");
  jar.delete("__Secure-better-auth.session_token");
  redirect("/sign-up");
}
