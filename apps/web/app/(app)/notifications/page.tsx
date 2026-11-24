import { EmptyState } from "@hireflow/ui";
import { getDb, notification } from "@hireflow/db";
import { eq } from "drizzle-orm";
import { requireUser } from "../../../lib/session";
import { markAllNotificationsReadAction, markNotificationReadAction } from "../actions";

export default async function NotificationsPage() {
  const user = await requireUser();
  const db = await getDb();
  const rows = await db.query.notification.findMany({
    where: eq(notification.userId, user.id),
  });

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        body="In-app alerts will appear here for follow-ups and job matches. Email is optional and stays off unless a Resend key is configured. An empty inbox is expected in Phase 1."
      />
    );
  }

  const unread = rows.filter((row) => !row.readAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Inbox</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{unread} unread</p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <button type="submit" className="text-sm text-[var(--color-accent)]">
            Mark all as read
          </button>
        </form>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{row.title}</p>
                {row.body ? <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{row.body}</p> : null}
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  {row.readAt ? "Read" : "Unread"}
                </p>
              </div>
              {row.readAt ? null : (
                <form action={markNotificationReadAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit" className="text-sm text-[var(--color-accent)]">
                    Mark read
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
