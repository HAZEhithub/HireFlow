# HireFlow

Privacy-first career operating system for job seekers in India and internationally.

**Tagline:** Your career, compounded.  
**Line:** Jobs you can trust. Matches you can explain.

This repository is a TypeScript monorepo. Research lives in [`docs/research/`](docs/research/) and architecture decisions in [`docs/architecture/`](docs/architecture/).

Pinned (verified 2026-11-20): **Next.js 16.4.6**, **React 19.3.1**, **Tailwind CSS 4.3.5**. Auth is **self-hosted Better Auth + Drizzle** (not Neon Managed Auth). Marketing is a **static export** for Cloudflare Pages (`out/`). First cloud object store is **R2** (local disk until an account is approved).

## Apps

| App | Port | Role |
|-----|------|------|
| `apps/marketing` | 3002 | Public site, `output: 'export'` → Pages `out/` (no ISR) |
| `apps/web` | 3000 | Authenticated product (Node) |
| `apps/api` | 3001 | Hono REST (`/health`, `/v1/*`) |
| `apps/extension` | — | Chrome MV3 stub (**Phase 5**, non-blocking) |
| `services/workers` | — | Ingestion stub (Phase 2) |

## Quick start (₹0)

Requires Node 22+. Enable pnpm with Corepack (`corepack enable` then `corepack prepare pnpm@9.15.0 --activate`).

```bash
cp .env.example .env
# set BETTER_AUTH_SECRET to 32+ random characters
pnpm install
pnpm dev
```

Leave `DATABASE_URL` empty to use local PGlite at `.data/hireflow.db`. A Neon account is not required.

- Marketing: http://localhost:3002  
- App: http://localhost:3000  
- API health: http://localhost:3001/health  

Do not enable `AI_EXTERNAL_ENABLED` or `PAID_PROVIDERS_ENABLED` unless you have approved paid usage. Unpaid Gemini is blocked for resumes. Do not provision Neon, R2, or Resend without approval.

## What Phase 1 includes

Marketing static pages, auth, onboarding, profile, settings, **in-app notification inbox** (empty is valid), usage rows, export, account deletion, and honest empty states for jobs / resumes / applications.

## What it will not do

Scrape LinkedIn, Naukri, Indeed, or Workday. Auto-submit applications. Invent jobs, testimonials, market stats, or hire probabilities. Use ISR on marketing. Put app logic on Workers Free (10 ms CPU).

## License

Proprietary until otherwise stated. Third-party notices will be added as dependencies are locked.
