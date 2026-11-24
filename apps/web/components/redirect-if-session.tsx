"use client";

import { authClient } from "@hireflow/auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REDIRECT_KEY = "hireflow.session-redirect";

/** Send a live session home. A stale cookie must not trap the user on this page. */
export function RedirectIfSession({ to = "/" }: { to?: string }) {
  const router = useRouter();
  const session = authClient.useSession();

  useEffect(() => {
    const userId = session.data?.user?.id;
    if (session.isPending || !userId) return;
    // One auto-redirect per user id per tab. Stale client cache plus a missing
    // HttpOnly cookie otherwise loops /sign-in ↔ / and stalls PGlite.
    if (sessionStorage.getItem(REDIRECT_KEY) === userId) return;
    sessionStorage.setItem(REDIRECT_KEY, userId);
    router.replace(to);
  }, [session.data?.user, session.isPending, router, to]);

  return null;
}
