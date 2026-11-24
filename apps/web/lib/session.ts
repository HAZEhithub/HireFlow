import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@hireflow/auth";
import { ensureUserWorkspace, getDb } from "@hireflow/db";

export async function currentSession() {
  return getSession(await headers());
}

export async function requireUser() {
  const session = await currentSession();
  if (!session?.user) redirect("/sign-in");
  const db = await getDb();
  await ensureUserWorkspace(db, session.user.id);
  return session.user;
}
