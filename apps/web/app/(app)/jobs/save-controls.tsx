import { Button } from "@hireflow/ui";
import { saveJobAction, unsaveJobAction } from "./actions";

export function SaveControls({ jobId, saved }: { jobId: string; saved: boolean }) {
  if (saved) {
    return (
      <form action={unsaveJobAction}>
        <input type="hidden" name="jobId" value={jobId} />
        <Button type="submit" variant="secondary">
          Unsave
        </Button>
      </form>
    );
  }
  return (
    <form action={saveJobAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <Button type="submit" variant="secondary">
        Save
      </Button>
    </form>
  );
}
