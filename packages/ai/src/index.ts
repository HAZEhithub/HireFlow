export type { PayloadClass, ProviderId } from "./types";
export { wrapUntrusted } from "./untrusted";
export { parseModelJson, phrasingSuggestionSchema } from "./validate";
export { probeOllama, completeOllama } from "./ollama";
export { completeGeminiPaid, GeminiNotConfiguredError } from "./gemini";
export {
  completeAiTask,
  routeProvider,
  type AiConsent,
  type AiTaskResult,
  type AiTaskStatus,
  type CompleteAiTaskInput,
} from "./complete";

export function assertSensitiveExternalAllowed(opts: {
  payloadClass: "sensitive" | "public";
  userPaidConsent: boolean;
}) {
  if (opts.payloadClass !== "sensitive") return;
  if (!opts.userPaidConsent) {
    throw new Error(
      "Resumes and personal career data are not sent to unpaid or unconsented external models.",
    );
  }
}
