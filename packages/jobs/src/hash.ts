import { createHash } from "node:crypto";

export function sha256Short(value: string, length = 32): string {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

export function stableId(parts: string[]): string {
  return sha256Short(parts.join("|"));
}
