import { urls } from "@hireflow/config";

export async function probeOllama(timeoutMs = 400): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${urls.ollama.replace(/\/$/, "")}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export async function completeOllama(input: {
  prompt: string;
  model?: string;
  timeoutMs?: number;
}): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 12_000);
  try {
    const res = await fetch(`${urls.ollama.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: input.model ?? "llama3.2",
        prompt: input.prompt,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error("ollama_unavailable");
    const body = (await res.json()) as { response?: string };
    return body.response ?? "";
  } finally {
    clearTimeout(timer);
  }
}
