"use client";

import type { TailorSuggestion } from "@hireflow/resumes";
import { Button, Card, Textarea } from "@hireflow/ui";
import { useState } from "react";
import { applyTailorAction } from "./actions";

export function TailorReview({
  sessionId,
  suggestions,
  warnings,
}: {
  sessionId: string;
  suggestions: TailorSuggestion[];
  warnings: string[];
}) {
  const [decisions, setDecisions] = useState<Record<string, "accept" | "reject" | "edit">>({});
  const [edits, setEdits] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      {warnings.length ? (
        <Card>
          <ul className="list-disc pl-5 text-sm text-[var(--color-ink-soft)]">
            {warnings.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      {suggestions.map((item) => (
        <Card key={item.id}>
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">{item.kind.replace("_", " ")}</p>
          <p className="mt-1 text-sm">{item.rationale}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <p className="font-medium">Current</p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink-soft)]">{item.before || "—"}</p>
            </div>
            <div>
              <p className="font-medium">Suggested</p>
              <Textarea
                value={edits[item.id] ?? item.after}
                onChange={(event) => {
                  setEdits({ ...edits, [item.id]: event.target.value });
                  setDecisions({ ...decisions, [item.id]: "edit" });
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => setDecisions({ ...decisions, [item.id]: "accept" })}>
              Accept
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDecisions({ ...decisions, [item.id]: "reject" })}
            >
              Reject
            </Button>
            <span className="text-sm text-[var(--color-ink-soft)]">{decisions[item.id] ?? "undecided"}</span>
          </div>
        </Card>
      ))}
      <Button
        type="button"
        onClick={() =>
          applyTailorAction({
            sessionId,
            decisions: Object.fromEntries(
              suggestions.map((item) => [item.id, decisions[item.id] ?? "reject"]),
            ),
            edits,
          })
        }
      >
        Save new tailored resume
      </Button>
    </div>
  );
}
