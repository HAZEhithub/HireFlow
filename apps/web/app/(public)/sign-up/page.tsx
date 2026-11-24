"use client";

import { authClient } from "@hireflow/auth/client";
import { Button, Card, Field, Input } from "@hireflow/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { RedirectIfSession } from "../../../components/redirect-if-session";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await authClient.signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Could not create an account.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <RedirectIfSession />
      <Card className="w-full max-w-md">
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Start free</p>
        <h1 className="font-display mt-2 text-3xl">Create your workspace</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Email and password only. Google OAuth is optional when configured. No credit card.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Name">
            <Input name="name" autoComplete="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password" hint="At least 8 characters.">
            <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </Field>
          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
          Already registered?{" "}
          <Link className="text-[var(--color-accent)]" href="/sign-in">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
