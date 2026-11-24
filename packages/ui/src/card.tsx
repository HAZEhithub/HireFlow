import { cn } from "./cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-6 shadow-[0_1px_0_rgba(20,34,28,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function TrustChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn";
}) {
  const color =
    tone === "good"
      ? "border-[var(--color-good)] text-[var(--color-good)]"
      : tone === "warn"
        ? "border-[var(--color-warn)] text-[var(--color-warn)]"
        : "border-[var(--color-rule)] text-[var(--color-ink-soft)]";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs", color)}>
      {children}
    </span>
  );
}
