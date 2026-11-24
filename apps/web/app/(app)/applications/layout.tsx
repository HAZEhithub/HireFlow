import Link from "next/link";

const items = [
  { href: "/applications", label: "Tracker" },
  { href: "/applications/new", label: "Add application" },
  { href: "/applications/analytics", label: "Analytics" },
  { href: "/evidence", label: "Evidence vault" },
];

export default function ApplicationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-4 text-sm" aria-label="Application workspace">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex min-h-6 items-center text-[var(--color-accent)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
