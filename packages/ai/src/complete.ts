import { flags } from "@hireflow/config";
import {
  decrementUsagePeriod,
  recordAiUsage,
  tryIncrementUsagePeriod,
  type HireFlowDb,
} from "@hireflow/db";
import { assertEntitlement } from "@hireflow/entitlements";
import type { ZodType } from "zod";
import { completeGeminiPaid } from "./gemini";
import { completeOllama, probeOllama } from "./ollama";
import type { PayloadClass, ProviderId } from "./types";
import { parseModelJson } from "./validate";

export type AiConsent = {
  aiExternalConsent: boolean;
  aiPaidConsent: boolean;
};

export type AiTaskStatus =
  | "success"
  | "denied_consent"
  | "provider_unavailable"
  | "quota"
  | "not_configured";

export type AiTaskResult<T> = {
  provider: ProviderId;
  status: AiTaskStatus;
  data?: T;
  message?: string;
};

export type CompleteAiTaskInput<T> = {
  db: HireFlowDb;
  userId: string;
  feature: string;
  payloadClass: PayloadClass;
  needsLlm: boolean;
  prompt: string;
  schema: ZodType<T>;
  consent: AiConsent;
  probeOllama?: typeof probeOllama;
  completeOllama?: typeof completeOllama;
  completeGeminiPaid?: typeof completeGeminiPaid;
};

const LOCAL_UNAVAILABLE = "Local model not available.";

export function routeProvider(input: {
  payloadClass: PayloadClass;
  needsLlm: boolean;
  ollamaHealthy?: boolean;
  aiExternalConsent?: boolean;
  aiPaidConsent?: boolean;
}): ProviderId {
  if (!input.needsLlm) return "deterministic";
  if (input.ollamaHealthy && input.aiExternalConsent) return "ollama";
  const publicAllowed =
    flags.aiExternalEnabled && flags.paidProvidersEnabled && Boolean(input.aiPaidConsent);
  if (publicAllowed) return "gemini-paid";
  return "deterministic";
}

async function writeUsage(
  db: HireFlowDb,
  input: { userId: string; feature: string; provider: string; status: string },
) {
  await recordAiUsage(db, {
    userId: input.userId,
    feature: input.feature,
    provider: input.provider,
    status: input.status,
  });
}

async function claimAssistQuota(db: HireFlowDb, userId: string) {
  const granted = await assertEntitlement(userId, "ai.assists_per_month", { used: 0, increment: 0 });
  if (granted.limit === "unlimited") return { claimed: true as const };
  if (typeof granted.limit !== "number") return { claimed: true as const };
  const bump = await tryIncrementUsagePeriod(db, userId, "ai.assists_per_month", granted.limit);
  if (!bump.ok) {
    await writeUsage(db, {
      userId,
      feature: "ai.assists_per_month",
      provider: "deterministic",
      status: "quota",
    });
    return { claimed: false as const, billedPlan: granted.billedPlan, limit: granted.limit, used: bump.count };
  }
  return { claimed: true as const, billedPlan: granted.billedPlan, limit: granted.limit };
}

/**
 * Single AI entry. Order: deterministic → consented Ollama → Gemini interface (never HTTP).
 * Counts only successful non-deterministic completions toward the monthly assist quota.
 * Does not log prompt or resume bodies.
 */
export async function completeAiTask<T>(input: CompleteAiTaskInput<T>): Promise<AiTaskResult<T>> {
  const probe = input.probeOllama ?? probeOllama;
  const ollama = input.completeOllama ?? completeOllama;
  const gemini = input.completeGeminiPaid ?? completeGeminiPaid;

  if (!input.needsLlm) {
    await writeUsage(input.db, {
      userId: input.userId,
      feature: input.feature,
      provider: "deterministic",
      status: "success",
    });
    return { provider: "deterministic", status: "success" };
  }

  if (!input.consent.aiExternalConsent) {
    await writeUsage(input.db, {
      userId: input.userId,
      feature: input.feature,
      provider: "deterministic",
      status: "denied_consent",
    });
    return { provider: "deterministic", status: "denied_consent", message: LOCAL_UNAVAILABLE };
  }

  const ollamaHealthy = await probe();
  const provider = routeProvider({
    payloadClass: input.payloadClass,
    needsLlm: true,
    ollamaHealthy,
    aiExternalConsent: input.consent.aiExternalConsent,
    aiPaidConsent: input.consent.aiPaidConsent,
  });

  if (provider === "deterministic") {
    await writeUsage(input.db, {
      userId: input.userId,
      feature: input.feature,
      provider: "deterministic",
      status: "provider_unavailable",
    });
    return { provider: "deterministic", status: "provider_unavailable", message: LOCAL_UNAVAILABLE };
  }

  if (provider === "gemini-paid") {
    try {
      gemini({ aiPaidConsent: input.consent.aiPaidConsent });
    } catch {
      await writeUsage(input.db, {
        userId: input.userId,
        feature: input.feature,
        provider: "gemini-paid",
        status: "not_configured",
      });
    }
    return { provider: "deterministic", status: "not_configured", message: LOCAL_UNAVAILABLE };
  }

  const quota = await claimAssistQuota(input.db, input.userId);
  if (!quota.claimed) {
    return {
      provider: "deterministic",
      status: "quota",
      message: "Monthly local phrasing assist limit reached.",
    };
  }

  try {
    const raw = await ollama({ prompt: input.prompt });
    const data = parseModelJson(input.schema, raw);
    await writeUsage(input.db, {
      userId: input.userId,
      feature: input.feature,
      provider: "ollama",
      status: "success",
    });
    return { provider: "ollama", status: "success", data };
  } catch {
    await decrementUsagePeriod(input.db, input.userId, "ai.assists_per_month");
    await writeUsage(input.db, {
      userId: input.userId,
      feature: input.feature,
      provider: "ollama",
      status: "provider_unavailable",
    });
    return { provider: "deterministic", status: "provider_unavailable", message: LOCAL_UNAVAILABLE };
  }
}
