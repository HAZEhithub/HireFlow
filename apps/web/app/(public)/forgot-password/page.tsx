"use client";

import { authClient } from "@hireflow/auth/client";
import { Button, Card, Field, Input } from "@hireflow/ui";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await authClient.requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: "/reset-password",
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not start a reset.");
      return;
    }
    setDone(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md">
        <h1 className="font-display text-3xl">Reset password</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Production email delivery is not wired yet. Locally, with no Resend key, a reset link is
          written to <code>.data/dev-mailbox.log</code>. Tokens are never printed in production logs.
        </p>
        {done ? (
          <p className="mt-6 text-sm">If an account exists for that email, a reset path was created.</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Email">
              <Input name="email" type="email" autoComplete="email" required />
            </Field>
            {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Sending…" : "Send reset"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-sm">
          <Link className="text-[var(--color-accent)]" href="/sign-in">
            Back to sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
