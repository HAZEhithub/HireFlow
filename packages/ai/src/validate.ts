import { z, type ZodType } from "zod";

export function parseModelJson<T>(schema: ZodType<T>, raw: string): T {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("model_output_not_json");
  }
  const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
  return schema.parse(parsed);
}

export const phrasingSuggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        path: z.string().max(120),
        before: z.string().max(800),
        after: z.string().max(800),
        rationale: z.string().max(400),
      }),
    )
    .max(12),
});
