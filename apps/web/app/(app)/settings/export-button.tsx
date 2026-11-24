"use client";

import { Button } from "@hireflow/ui";
import { useState } from "react";

export function ExportButton() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const res = await fetch("/api/export");
            if (!res.ok) {
              setError("Export failed. Sign in again and retry.");
              return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "hireflow-export.json";
            a.click();
            URL.revokeObjectURL(url);
          } catch {
            setError("Export could not start. Check your connection.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Preparing…" : "Download JSON export"}
      </Button>
      {error ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
