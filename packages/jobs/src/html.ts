/** Strip tags and scripts. Never execute imported HTML. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return undefined;
  const text = htmlToText(match[1]).slice(0, 200);
  return text || undefined;
}

const INJECTION = [
  /ignore (all|previous|any) (instructions|prompts)/i,
  /you are (now )?(chatgpt|an? ai|a language model)/i,
  /system prompt/i,
];

/** Keep the text; flag likely injection so it is never treated as tool instructions. */
export function sanitizeUntrustedText(input: string, max = 20_000): { text: string; flagged: boolean } {
  const text = htmlToText(input).slice(0, max);
  return { text, flagged: INJECTION.some((re) => re.test(text)) };
}
