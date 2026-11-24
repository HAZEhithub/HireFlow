import { flags } from "@hireflow/config";

export type PayloadClass = "sensitive" | "public";
export type ProviderId = "deterministic" | "ollama" | "gemini-paid";

export { wrapUntrusted } from "./untrusted";
export { parseModelJson, phrasingSuggestionSchema } from "./validate";
export { probeOllama, completeOllama } from "./ollama";

/**
 * Deterministic always works. Local Ollama is optional and hardware-dependent.
 * Public SaaS / BYOK is never selected unless both env flags are on.
 */
export function routeProvider(input: {
  payloadClass: PayloadClass;
  needsLlm: boolean;
  ollamaHealthy?: boolean;
}): ProviderId {
  if (!input.needsLlm) return "deterministic";
  if (input.ollamaHealthy) return "ollama";
  const publicAllowed = flags.aiExternalEnabled && flags.paidProvidersEnabled;
  if (publicAllowed && input.payloadClass === "public") return "gemini-paid";
  if (publicAllowed && input.payloadClass === "sensitive") return "gemini-paid";
  return "deterministic";
}

export function assertSensitiveExternalAllowed(opts: {
  payloadClass: PayloadClass;
  userPaidConsent: boolean;
}) {
  if (opts.payloadClass !== "sensitive") return;
  if (!flags.paidProvidersEnabled || !opts.userPaidConsent) {
    throw new Error(
      "Resumes and personal career data are not sent to unpaid or unconsented external models.",
    );
  }
}
