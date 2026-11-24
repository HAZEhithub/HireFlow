import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), "../../.env") });

const nextConfig: NextConfig = {
  // PGlite ships WASM; bundling it into RSC makes Node 24 reject URL paths in fs.readFile.
  serverExternalPackages: ["@electric-sql/pglite", "unpdf", "mammoth", "@react-pdf/renderer", "docx"],
  agentRules: false,
  transpilePackages: [
    "@hireflow/ui",
    "@hireflow/shared",
    "@hireflow/auth",
    "@hireflow/db",
    "@hireflow/config",
    "@hireflow/entitlements",
    "@hireflow/jobs",
    "@hireflow/matching",
    "@hireflow/resumes",
    "@hireflow/applications",
    "@hireflow/ai",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
