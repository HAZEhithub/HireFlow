import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";
import { ensureSchema } from "./ensure-schema";

export type HireFlowDb = ReturnType<typeof drizzlePglite<typeof schema>>;

type DbGlobal = typeof globalThis & {
  __hireflowDb?: HireFlowDb;
  __hireflowDbReady?: Promise<HireFlowDb>;
};

const g = globalThis as DbGlobal;
const proc = process as NodeJS.Process & {
  __hireflowDb?: HireFlowDb;
  __hireflowDbReady?: Promise<HireFlowDb>;
};

function repoRoot() {
  if (process.env.HIREFLOW_DATA_DIR) return dirname(process.env.HIREFLOW_DATA_DIR);
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    dir = resolve(dir, "..");
  }
  return process.cwd();
}

function dataPath() {
  const root = process.env.HIREFLOW_DATA_DIR ?? resolve(repoRoot(), ".data");
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  return resolve(root, "hireflow.db");
}

export async function getDb(): Promise<HireFlowDb> {
  const existing = g.__hireflowDb ?? proc.__hireflowDb;
  if (existing) return existing;
  const pending = g.__hireflowDbReady ?? proc.__hireflowDbReady;
  if (pending) return pending;
  const boot = (async () => {
    const url = process.env.DATABASE_URL?.trim();
    let db: HireFlowDb;
    if (url && url.startsWith("postgres")) {
      const sqlClient = postgres(url, { max: 5 });
      db = drizzlePg(sqlClient, { schema }) as unknown as HireFlowDb;
    } else {
      const file = dataPath();
      mkdirSync(dirname(file), { recursive: true });
      const client = new PGlite(file);
      await client.waitReady;
      db = drizzlePglite(client, { schema });
    }
    await ensureSchema(db);
    g.__hireflowDb = db;
    proc.__hireflowDb = db;
    return db;
  })();
  g.__hireflowDbReady = boot;
  proc.__hireflowDbReady = boot;
  return boot;
}
