import { APP_NAME, FUNCTIONAL_LINE } from "@hireflow/shared";
import type { ReactNode } from "react";
import { cn } from "./cn";

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="font-display text-xl tracking-tight text-[var(--color-ink)]">
      {APP_NAME}
    </a>
  );
}

export function MarketingHeader({ appUrl }: { appUrl: string }) {
  const links = [
    { href: "/product", label: "Product" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
  ];
  return (
    <header className="border-b border-[var(--color-rule)] bg-[var(--color-paper)]/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm text-[var(--color-ink-soft)] md:flex" aria-label="Marketing">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-[var(--color-ink)]">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <details className="relative md:hidden">
            <summary
              className="cursor-pointer list-none rounded-[var(--radius-sm)] border border-[var(--color-rule)] px-3 py-2"
              aria-label="Open marketing navigation"
            >
              Menu
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-paper)] p-3 shadow-sm">
              {links.map((l) => (
                <a key={l.href} href={l.href} className="block py-2 text-[var(--color-ink)]">
                  {l.label}
                </a>
              ))}
            </div>
          </details>
          <a href={`${appUrl}/sign-in`} className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
            Sign in
          </a>
          <a
            href={`${appUrl}/sign-up`}
            className="rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-3 py-2 font-medium text-white hover:bg-[var(--color-accent-2)]"
          >
            Start free
          </a>
        </div>
      </Container>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--color-rule)] py-12 text-sm text-[var(--color-ink-soft)]">
      <Container className="grid gap-8 md:grid-cols-4">
        <div>
          <p className="font-display text-lg text-[var(--color-ink)]">{APP_NAME}</p>
          <p className="mt-2 max-w-xs">{FUNCTIONAL_LINE}</p>
          <p className="mt-4 text-xs">Intended public site: www.hireflow.com (domain not claimed here).</p>
        </div>
        <div className="space-y-2">
          <p className="text-[var(--color-ink)]">Product</p>
          <a className="block hover:text-[var(--color-ink)]" href="/product/job-discovery">
            Job discovery
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/product/resume-studio">
            Resume Studio
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/product/application-tracker">
            Tracker
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/product/ai-matching">
            Matching
          </a>
        </div>
        <div className="space-y-2">
          <p className="text-[var(--color-ink)]">For</p>
          <a className="block hover:text-[var(--color-ink)]" href="/for/students">
            Students
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/for/graduates">
            Fresh graduates
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/for/internships">
            Internships
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/for/remote">
            Remote / international
          </a>
        </div>
        <div className="space-y-2">
          <p className="text-[var(--color-ink)]">Trust</p>
          <a className="block hover:text-[var(--color-ink)]" href="/privacy">
            Privacy
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/terms">
            Terms
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/security">
            Security
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/accessibility">
            Accessibility
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/contact">
            Contact
          </a>
          <a className="block hover:text-[var(--color-ink)]" href="/pricing">
            Pricing
          </a>
        </div>
      </Container>
      <Container className="mt-8 text-xs">
        HireFlow does not invent jobs, testimonials, or hire probabilities. Legal name and domain
        clearance are outstanding before a public launch. Payments are not enabled.
      </Container>
    </footer>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-rule)] bg-white p-10">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-2 max-w-xl text-[var(--color-ink-soft)]">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
