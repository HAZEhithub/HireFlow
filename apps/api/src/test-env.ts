import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "hireflow-api-"));
mkdirSync(dir, { recursive: true });

process.env.HIREFLOW_DATA_DIR = dir;
process.env.BETTER_AUTH_SECRET = "test-secret-must-be-32-characters-min";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.NEXT_PUBLIC_MARKETING_URL = "http://localhost:3002";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
delete process.env.DATABASE_URL;
delete process.env.RESEND_API_KEY;
