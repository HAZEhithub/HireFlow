import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";
import type { ButtonHTMLAttributes } from "react";

const styles = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-2)] px-4 py-2.5",
        secondary:
          "border border-[var(--color-ink)] text-[var(--color-ink)] bg-transparent hover:bg-[var(--color-paper-2)] px-4 py-2.5",
        ghost: "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] px-3 py-2",
        danger: "bg-[var(--color-danger)] text-white px-4 py-2.5",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  className,
  variant,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles>) {
  return <button className={cn(styles({ variant }), className)} {...props} />;
}
