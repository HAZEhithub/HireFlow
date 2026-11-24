"use client";

import { authClient } from "@hireflow/auth/client";
import { Button } from "@hireflow/ui";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={async () => {
        try {
          await authClient.signOut();
        } finally {
          try {
            sessionStorage.removeItem("hireflow.session-redirect");
          } catch {
            /* private mode */
          }
          router.push("/sign-in");
          router.refresh();
        }
      }}
    >
      Sign out
    </Button>
  );
}
