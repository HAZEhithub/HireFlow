import Link from "next/link";

const items = [
  { href: "/resumes", label: "Dashboard" },
  { href: "/resumes/new", label: "Create" },
  { href: "/resumes/upload", label: "Upload" },
];

export default function ResumesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-4 text-sm" aria-label="Resume Studio">
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
