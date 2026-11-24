import { Logo } from "@hireflow/ui";
import Link from "next/link";
import { requireUser } from "../../lib/session";
import { SignOutButton } from "./sign-out";
import { SkipLink } from "./skip-link";

const primary = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Workspace" },
  { href: "/resumes", label: "Resume Studio" },
  { href: "/prepare", label: "Prepare" },
  { href: "/insights", label: "Insights" },
  { href: "/notifications", label: "Inbox" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-screen">
      <SkipLink />
      <header className="border-b border-[var(--color-rule)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo href="/" />
          <nav className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-label="Primary">
            {primary.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-6 items-center text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[var(--color-ink-soft)] sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-10 sm:px-6 outline-none">
        {children}
      </main>
    </div>
  );
}
