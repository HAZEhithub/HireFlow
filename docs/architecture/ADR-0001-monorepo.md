# ADR 0001 — TypeScript monorepo

**Status:** Accepted  
**Date:** 2026-11-20  
**Revised:** 2026-11-20 (static marketing export; extension off critical path)

## Context

HireFlow needs two independently deployable frontends (marketing, app), an API, shared packages, and a later optional extension. There is no existing application code to preserve besides this repository.

## Decision

Use **pnpm workspaces + Turborepo**. Package names: `@hireflow/*`.

```
apps/marketing     Next.js 16.4.6 static export (`output: 'export'`) → Cloudflare Pages `out/`
apps/web           Next.js 16.4.6 authenticated product (Node)
apps/api           Hono Node API
apps/extension     WXT Chrome MV3 stub — **Phase 5**, non-blocking
packages/ui        Design system
packages/shared    Zod schemas, constants
packages/config    Env + feature flags
packages/db        Drizzle schema + client (PGlite default)
packages/ai        Provider gateway
packages/matching  Ranking (deterministic)
packages/jobs      Adapters + employer registry (Phase 2)
packages/auth      Better Auth + Drizzle (self-hosted)
services/workers   Ingestion / parse jobs (later)
docs/
```

**Marketing** is independently deployable. It must remain a **static HTML export**. Next.js static export does **not** support ISR, cookies, redirects, rewrites, headers(), Server Actions, the default `next/image` optimizer, or request-dependent route handlers ([Next.js static exports](https://nextjs.org/docs/app/guides/static-exports), 2026-11-20). Cloudflare Pages preset: `npx next build`, publish directory `out` ([Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)).

**Extension** is scaffolded so the monorepo layout is stable, but it **must not** block Discover or Applications. First discovery uses curated ATS registry + URL import (ADR 0004). Save-job in the browser is Phase 5.

## Consequences

- Shared types prevent marketing/app drift.
- Marketing deploys to Cloudflare Pages without shipping auth code or Node runtime.
- App + API stay Node because Workers Free CPU is 10 ms (ADR 0006).
- Do not add a second language runtime unless a later ADR justifies it.
- Do not add ISR, Server Actions, or cookies to `apps/marketing`.
