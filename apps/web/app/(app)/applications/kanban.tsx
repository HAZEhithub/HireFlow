export function KanbanBoard({
  stages,
  labels,
  rows,
}: {
  stages: readonly string[];
  labels: Record<string, string>;
  rows: Array<{ id: string; title: string; companyName: string; stage: string }>;
}) {
  return (
    <div>
      <p className="sr-only">Board view is visual only. Switch to Table for a keyboard-accessible list.</p>
    <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-4 lg:grid-cols-7" aria-hidden="true" inert>
      {stages.map((stage) => {
        const items = rows.filter((row) => row.stage === stage);
        return (
          <section
            key={stage}
            className="min-w-44 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-3"
          >
            <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
              {labels[stage] ?? stage} ({items.length})
            </h2>
            <ul className="mt-3 space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-rule)] p-2 text-sm"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{item.companyName}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
    </div>
  );
}
