import Link from "next/link";

export default async function ResumeDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const items = [
    { href: `/resumes/${id}`, label: "Editor" },
    { href: `/resumes/${id}/analysis`, label: "Analysis" },
    { href: `/resumes/${id}/templates`, label: "Templates" },
    { href: `/resumes/${id}/versions`, label: "Versions" },
    { href: `/resumes/${id}/export`, label: "Export" },
  ];
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-4 text-sm" aria-label="Resume">
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
