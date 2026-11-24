export default function JobsLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-10 w-48 animate-pulse rounded bg-[var(--color-paper-2)]" />
      <div className="h-24 animate-pulse rounded bg-[var(--color-paper-2)]" />
      <div className="h-32 animate-pulse rounded bg-[var(--color-paper-2)]" />
      <div className="h-32 animate-pulse rounded bg-[var(--color-paper-2)]" />
      <p className="sr-only">Loading jobs</p>
    </div>
  );
}
