import { getDb, getUsagePeriodCount, userSettings } from "@hireflow/db";
import { entitlement, limitFor, resolvePlan } from "@hireflow/entitlements";
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
  const assistsUsed = await getUsagePeriodCount(db, user.id, "ai.assists_per_month");
  const assistLimit = limitFor(entitlement("ai.assists_per_month"), resolvePlan(user.id).plan);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl">Settings</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Privacy-first defaults. This page describes actual software behavior. HireFlow is not DPDP
          or GDPR certified and does not claim legal compliance.
        </p>
      </div>
      <Card>
        <h2 className="font-display text-2xl">Purposes we process for</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink-soft)]">
          <li>Account and session: sign-in, security, workspace isolation.</li>
          <li>Career profile and applications: matching, tracker, follow-up reminders in-app.</li>
          <li>Resumes and evidence: parse, edit, export, and user-approved tailoring on this system.</li>
          <li>Optional local Ollama: only if you consent below and the model is on this machine.</li>
          <li>Paid hosted models: off unless operators enable them and you consent. Unpaid hosted APIs stay blocked for resumes.</li>
        </ul>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Withdrawal is as easy as granting: uncheck a consent and save. Processors, if any are later
          enabled, will be named with their region on Security. Data stays on the database you configure
          (local PGlite or a region you approve).
        </p>
      </Card>
      <Card>
        <form action={saveSettingsAction} className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="emailAlerts" defaultChecked={s.emailAlerts} />
            Email alerts later (optional Resend). In-app inbox is the default; email stays a no-op without a key.
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="productTips" defaultChecked={s.productTips} />
            Occasional product tips
          </label>
          <Field label="Theme">
            <select
              name="theme"
              defaultValue={s.theme}
              className="min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-white px-3 py-2 text-sm"
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
              Purpose: optional phrasing on this machine via <strong>local Ollama</strong> if installed.
              Public SaaS stays off. Unpaid hosted APIs are blocked for resumes. Uncheck to withdraw.
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="aiPaidConsent" defaultChecked={s.aiPaidConsent} />
            <span>
              Purpose: sending minimized career data to a <strong>paid</strong> model only after operators
              enable paid providers. Default is off. Uncheck to withdraw.
            </span>
          </label>
          <Button type="submit">Save settings</Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-2xl">Usage</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Local phrasing assists this UTC month: {assistsUsed} / {assistLimit === "unlimited" ? "unlimited" : assistLimit}.
          Only successful non-deterministic completions count. Deterministic matching, parse, and
          export do not. External models stay off unless operators enable them and you consent. There
          is no upgrade checkout because billing is not live.
        </p>
      </Card>
      <Card>
        <h2 className="font-display text-2xl">Export</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Download JSON for your account: profile, settings, notifications, saved jobs, resume metadata,
          applications, stage history, follow-ups, evidence vault items, and pack pastes. Binary resume
          files stay in private storage and are downloaded separately from Resume Studio.
        </p>
        <div className="mt-4">
          <ExportButton />
        </div>
      </Card>
      <Card>
        <h2 className="font-display text-2xl text-[var(--color-danger)]">Delete account</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Permanently deletes your user, profile, sessions, settings, jobs you imported, resumes,
          applications, evidence, and pack pastes. Type {user.email} to confirm.
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
