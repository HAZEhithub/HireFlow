# ADR 0002 — Runtime stack

**Status:** Accepted  
**Date:** 2026-11-20  
**Revised:** 2026-11-20 (pin Next 16.4.6 / React 19.3.1 / Tailwind 4.3.5; self-hosted auth; separate DOCX export)

## Context

Need SEO marketing, authenticated app, resume parsing, Postgres, ₹0 development. Versions were revalidated on 2026-11-20 from official pages (SOURCE_REGISTER T-11–T-16, T-09, T-20, T-23).

## Decision

Pin **exact stable** versions, not canaries:

| Concern | Choice |
|---------|--------|
| UI | React **19.3.1** + `react-dom@19.3.1`, Next.js **16.4.6** App Router, Tailwind CSS **4.3.5** + `@tailwindcss/postcss@4.3.5`, shadcn/Radix with HireFlow tokens |
| Marketing | Same Next pin with `output: 'export'` and `images.unoptimized: true` (ADR 0001) |
| API | Hono on Node 22 |
| DB | PostgreSQL when `DATABASE_URL` is set; **PGlite** at `.data/hireflow.db` otherwise (no Neon account required) |
| ORM | Drizzle + drizzle-kit |
| Auth | **Self-hosted Better Auth** (email/password + optional Google) with **Drizzle adapter** in our Node process. Do **not** use Neon Managed Better Auth (`@neon/auth`) for v1 — see below |
| Validation | Zod |
| Files | Local disk in Phase 1; **Cloudflare R2** as first cloud store (ADR 0007) |
| PDF import | `unpdf` (MIT) |
| DOCX import | `mammoth` (BSD-2-Clause) — **parse only** |
| PDF export | `@react-pdf/renderer` (MIT) — Phase 3; not Puppeteer |
| DOCX export | npm `docx` / [docx.js.org](https://docx.js.org/) MIT v9.x — **separate** from PDF and from mammoth |
| Tests | Vitest + Playwright |
| Email | Resend **optional** (ADR 0008) |
| Notifications | In-app first (ADR 0008) |

**Rejected:** Next 16.5.x (canary), Clerk, Neon Managed Auth for v1, Prisma as default, Vercel Hobby as commercial host, Pinecone, Puppeteer for default PDF, Python as the primary app, mammoth for DOCX *generation*.

### Why not Neon Managed Better Auth

[Neon Auth](https://neon.com/docs/auth/about) (docs updated 2026-11-11): identity lives in `neon_auth`, uses `@neon/auth`, AWS regions only, **unsupported with IP Allow / Private Networking**, Free 60k MAU/project. Neon itself says self-host Better Auth for custom plugins/hooks and to run auth in **your** infrastructure. HireFlow needs ₹0 local (PGlite) without a Neon account and a portable Hono/Node API. Revisit Managed Auth only if we later go all-in on Neon branching previews.

## Local database

If `DATABASE_URL` is set, use Neon/Postgres via `postgres.js`.  
If unset, use **PGlite** at `.data/hireflow.db` so Phase 1 runs with ₹0 and no cloud account.

## Consequences

Auth, profiles, settings, and in-app notifications work offline/local. pgvector is enabled when the engine is Postgres/Neon; PGlite skips vector indexes until `DATABASE_URL` is Postgres. Marketing cannot use cookies or Server Actions. Document export in Phase 3 has two independent pipelines (PDF vs DOCX).
