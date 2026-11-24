import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv();

import { getDb } from "@hireflow/db";
import { ingestJobs } from "@hireflow/jobs";

const fixtures = process.argv.includes("--fixtures");
const adapterArg = process.argv.find((arg) => arg.startsWith("--adapter="))?.slice("--adapter=".length);
const boardArg = process.argv.find((arg) => arg.startsWith("--board="))?.slice("--board=".length);

const db = await getDb();
const report = await ingestJobs(db, {
  fixtures,
  adapter: adapterArg === "greenhouse" || adapterArg === "lever" || adapterArg === "ashby" ? adapterArg : undefined,
  boardId: boardArg,
});
console.log(JSON.stringify(report, null, 2));
if (!fixtures && report.runs.length === 0) {
  console.log(
    "No employer boards configured. Production registry is empty until identifiers are verified. Use --fixtures for local samples (labeled, not live jobs).",
  );
}
