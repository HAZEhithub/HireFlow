import Link from "next/link";

const items = [
  { href: "/jobs", label: "Discover" },
  { href: "/jobs/recommended", label: "Recommended" },
  { href: "/jobs/saved", label: "Saved" },
  { href: "/jobs/import", label: "Import" },
];

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-4 text-sm" aria-label="Jobs">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="text-[var(--color-accent)]">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
