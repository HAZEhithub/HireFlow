import { flags } from "@hireflow/config";

export class GeminiNotConfiguredError extends Error {
  readonly code = "not_configured" as const;

  constructor() {
    super("not_configured");
    this.name = "GeminiNotConfiguredError";
  }
}

/**
 * Paid Gemini is an interface only. This never performs HTTP.
 * Even when env flags and paid consent are both true, the client is not wired.
 */
export function completeGeminiPaid(input: { aiPaidConsent: boolean }): never {
  const flagsOn = flags.aiExternalEnabled && flags.paidProvidersEnabled;
  if (!flagsOn || !input.aiPaidConsent) {
    throw new GeminiNotConfiguredError();
  }
  throw new GeminiNotConfiguredError();
}
