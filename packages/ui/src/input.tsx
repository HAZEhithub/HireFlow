import { cn } from "./cn";
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

const field =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "min-h-28", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const control = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child as ReactElement<{ id?: string }>, { id });
  });
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {control}
      {hint ? <p className="text-xs text-[var(--color-ink-soft)]">{hint}</p> : null}
    </div>
  );
}
