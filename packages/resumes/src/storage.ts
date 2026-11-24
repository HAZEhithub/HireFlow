import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { storage } from "@hireflow/config";

function repoRoot() {
  if (process.env.HIREFLOW_DATA_DIR) return dirname(process.env.HIREFLOW_DATA_DIR);
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    dir = resolve(dir, "..");
  }
  return process.cwd();
}

export function uploadsRoot() {
  const configured = storage.uploadDir;
  const root = resolve(configured.startsWith("/") || /^[A-Za-z]:[\\/]/.test(configured) ? configured : resolve(repoRoot(), configured));
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  return root;
}

export function makeStorageKey(userId: string, documentId: string) {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeDoc = documentId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeUser || !safeDoc) throw new Error("invalid_storage_key");
  return `${safeUser}/${safeDoc}`;
}

export function absoluteStoragePath(key: string) {
  if (key.includes("..") || key.includes("\\") || key.startsWith("/") || key.includes("\0")) {
    throw new Error("path_traversal");
  }
  const root = uploadsRoot();
  const abs = resolve(root, key);
  const prefix = root.endsWith(sep) ? root : root + sep;
  if (abs !== root && !abs.startsWith(prefix)) throw new Error("path_traversal");
  return abs;
}

export async function writePrivateFile(userId: string, bytes: Buffer) {
  const documentId = randomUUID();
  const key = makeStorageKey(userId, documentId);
  const abs = absoluteStoragePath(key);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, bytes, { flag: "wx" });
  return {
    documentId,
    storageKey: key,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export async function readPrivateFile(userId: string, storageKey: string) {
  const expectedPrefix = `${userId.replace(/[^a-zA-Z0-9_-]/g, "")}/`;
  if (!storageKey.startsWith(expectedPrefix)) throw new Error("path_traversal");
  return readFile(absoluteStoragePath(storageKey));
}

export async function deletePrivateFile(storageKey: string) {
  try {
    await unlink(absoluteStoragePath(storageKey));
  } catch {
    /* already gone */
  }
}

export async function deleteUserUploadDir(userId: string) {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeUser) return;
  await rm(absoluteStoragePath(safeUser), { recursive: true, force: true });
}
