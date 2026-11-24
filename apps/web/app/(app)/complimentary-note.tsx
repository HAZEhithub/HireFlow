import type { ReactNode } from "react";

export function ComplimentaryNote({ children }: { children?: ReactNode }) {
  return (
    <p className="text-sm text-[var(--color-ink-soft)]">
      {children ??
        "Included now as a complimentary preview. This becomes a Pro surface when checkout is approved. There is no paywall button because billing is not live."}
    </p>
  );
}
