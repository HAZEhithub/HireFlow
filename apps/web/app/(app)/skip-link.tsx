"use client";

export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-white focus:px-3 focus:py-2"
      onClick={() => {
        document.getElementById("main")?.focus();
      }}
    >
      Skip to content
    </a>
  );
}
