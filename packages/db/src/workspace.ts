import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { HireFlowDb } from "./client";
import { profile, userSettings } from "./schema";

export async function ensureUserWorkspace(db: HireFlowDb, userId: string) {
  const existing = await db.query.profile.findFirst({
    where: eq(profile.userId, userId),
  });
  if (!existing) {
    await db.insert(profile).values({
      id: randomUUID(),
      userId,
    });
  }
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  if (!settings) {
    await db.insert(userSettings).values({ userId });
  }
}
