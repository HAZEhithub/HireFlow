import type { ReactNode } from "react";
import { Container } from "@hireflow/ui";
import { appUrl } from "../lib/site";

export function PageHero({
  kicker,
  title,
  body,
  primary = "Start free",
  primaryHref,
  secondary = "Explore product",
  secondaryHref = "/product",
}: {
  kicker?: string;
  title: string;
  body: string;
  primary?: string;
  primaryHref?: string;
  secondary?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="border-b border-[var(--color-rule)] py-16 sm:py-24">
      <Container className="max-w-3xl">
        {kicker ? (
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">{kicker}</p>
        ) : null}
        <h1 className="font-display mt-3 text-4xl leading-tight sm:text-6xl">{title}</h1>
        <p className="mt-5 text-lg text-[var(--color-ink-soft)]">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={primaryHref ?? `${appUrl}/sign-up`}
            className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-2)]"
          >
            {primary}
          </a>
          <a
            href={secondaryHref}
            className="rounded-[var(--radius-sm)] border border-[var(--color-ink)] px-5 py-2.5 text-sm font-medium"
          >
            {secondary}
          </a>
        </div>
      </Container>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <Container className="max-w-3xl space-y-4 py-16 text-[var(--color-ink-soft)] leading-relaxed">
      {children}
    </Container>
  );
}
