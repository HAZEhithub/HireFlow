import { aiUsage, getDb, userSettings } from "@hireflow/db";
import { Button, Card, Field, Input } from "@hireflow/ui";
import { eq } from "drizzle-orm";
import { requireUser } from "../../../lib/session";
import { deleteAccountAction, saveSettingsAction } from "../actions";
import { ExportButton } from "./export-button";

export default async function SettingsPage() {
  const user = await requireUser();
  const db = await getDb();
  const s = await db.query.userSettings.findFirst({ where: eq(userSettings.userId, user.id) });
  if (!s) throw new Error("Settings missing");
  const usage = await db.query.aiUsage.findMany({ where: eq(aiUsage.userId, user.id) });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Privacy-first defaults. External AI stays off unless you opt in and a paid provider is
          enabled by an operator.
        </p>
      </div>
      <Card>
        <form action={saveSettingsAction} className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="emailAlerts" defaultChecked={s.emailAlerts} />
            Email alerts later (optional Resend). Phase 1 uses the in-app inbox; email stays a no-op without a key.
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="productTips" defaultChecked={s.productTips} />
            Occasional product tips
          </label>
          <Field label="Theme">
            <select
              name="theme"
              defaultValue={s.theme}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
          <Field label="Locale">
            <Input name="locale" defaultValue={s.locale} />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="aiExternalConsent" defaultChecked={s.aiExternalConsent} />
            <span>
              I understand HireFlow may use a <strong>local Ollama</strong> model on this machine if
              it is installed. Public SaaS stays off. Unpaid hosted APIs are blocked for resumes.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="aiPaidConsent" defaultChecked={s.aiPaidConsent} />
            <span>
              I consent to sending minimized career data to a <strong>paid</strong> model only after
              operators enable paid providers. Default is off.
            </span>
          </label>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-2xl">Usage</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {usage.length} AI calls recorded. External models stay off unless operators enable them and
          you consent. Deterministic matching does not count. Email is{" "}
          {process.env.RESEND_API_KEY ? "configured (optional)" : "not configured (in-app only)"}.
        </p>
      </Card>
      <Card>
        <h2 className="font-display text-2xl">Export</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Download the JSON we store for your account (profile, settings, saved jobs, and resume
          metadata). Binary resume files stay in private storage and are downloaded separately.
        </p>
        <div className="mt-4">
          <ExportButton />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-2xl text-[var(--color-danger)]">Delete account</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Permanently deletes your user, profile, sessions, and settings. Type {user.email} to
          confirm.
        </p>
        <form action={deleteAccountAction} className="mt-4 space-y-3">
          <Input name="confirm" placeholder={user.email} autoComplete="off" />
          <Button variant="danger" type="submit">
            Delete my account
          </Button>
        </form>
      </Card>
    </div>
  );
}
