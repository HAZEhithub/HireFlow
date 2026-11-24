import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv();

import { serve } from "@hono/node-server";
import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.API_PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`HireFlow API http://localhost:${port}`);
