import { Button, Card, Field, Input } from "@hireflow/ui";
import { createResumeAction } from "../actions";

export default function NewResumePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-soft)]">Create</p>
        <h1 className="font-display mt-1 text-4xl">New resume</h1>
        <p className="mt-2 max-w-xl text-[var(--color-ink-soft)]">
          Start from a blank structured document. Nothing is generated until you type it.
        </p>
      </div>
      <Card>
        <form action={createResumeAction} className="space-y-4">
          <Field label="Resume title">
            <Input name="title" defaultValue="Untitled resume" maxLength={120} />
          </Field>
          <Button type="submit">Create resume</Button>
        </form>
      </Card>
    </div>
  );
}
