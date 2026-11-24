"use client";

import { authClient } from "@hireflow/auth/client";
import { Button, Card, Field, Input } from "@hireflow/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const result = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not reset password.");
      return;
    }
    router.push("/sign-in");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-3xl">Choose a new password</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="New password" hint="At least 8 characters.">
            <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </Field>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <Button type="submit" disabled={pending || !token} className="w-full">
            {pending ? "Saving…" : "Update password"}
          </Button>
        </form>
        <p className="mt-4 text-sm">
          <Link className="text-[var(--color-accent)]" href="/sign-in">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
