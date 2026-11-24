"use client";

import { Button } from "@hireflow/ui";

export function ExportButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        const res = await fetch("/api/export");
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hireflow-export.json";
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      Download JSON export
    </Button>
  );
}
