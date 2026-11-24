"use client";

import { authClient } from "@hireflow/auth/client";
import { Button, Card, Field, Input } from "@hireflow/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { RedirectIfSession } from "../../../components/redirect-if-session";
import { safeNextPath } from "../../../lib/safe-next";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not sign in.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <RedirectIfSession to={next} />
      <Card className="w-full max-w-md">
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">HireFlow</p>
        <h1 className="font-display mt-2 text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Return to your workspace. We will send you back to {next === "/" ? "Home" : next}.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
          <Link className="text-[var(--color-accent)]" href="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          No account?{" "}
          <Link className="text-[var(--color-accent)]" href="/sign-up">
            Start free
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
