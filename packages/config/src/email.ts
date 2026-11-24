/** Log-only when RESEND_API_KEY is unset. Never throws. Does not send mail in Phase 1. */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ sent: boolean; reason: string }> {
  const production = process.env.NODE_ENV === "production";
  const target = production ? "redacted" : input.to;
  if (!process.env.RESEND_API_KEY) {
    if (!production) console.info("[email:noop]", input.subject, "→", target);
    return { sent: false, reason: "RESEND_API_KEY unset" };
  }
  if (!production) console.info("[email:queued-but-unwired]", input.subject, "→", target);
  return { sent: false, reason: "Resend client not wired in Phase 1" };
}
