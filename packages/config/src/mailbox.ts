import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { sendEmail } from "./email";

function mailboxPath() {
  const root = process.env.HIREFLOW_DATA_DIR ?? resolve(process.cwd(), "../../.data");
  return resolve(root, "dev-mailbox.log");
}

/**
 * Delivers auth mail. Production never logs tokens.
 * Local (no RESEND_API_KEY): writes the URL to gitignored `.data/dev-mailbox.log`.
 */
export async function deliverAuthEmail(input: {
  kind: "verify" | "reset";
  to: string;
  url: string;
}): Promise<void> {
  const production = process.env.NODE_ENV === "production";
  await sendEmail({
    to: input.to,
    subject: input.kind === "verify" ? "Verify your HireFlow email" : "Reset your HireFlow password",
    text: "Open the link from your email client. If you did not request this, ignore it.",
  });

  if (production) return;
  if (process.env.RESEND_API_KEY) return;

  const file = mailboxPath();
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(
    file,
    `${new Date().toISOString()}\t${input.kind}\t${input.to}\t${input.url}\n`,
    "utf8",
  );
}
