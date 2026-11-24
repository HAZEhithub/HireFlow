import type { NextConfig } from "next";

/** Static HTML for Cloudflare Pages (`out/`). ISR, cookies, and Server Actions are unsupported. */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  agentRules: false,
  transpilePackages: ["@hireflow/ui", "@hireflow/shared", "@hireflow/entitlements"],
};

export default nextConfig;
