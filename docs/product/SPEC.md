# HireFlow Product Specification — Phase 1

**Date:** 2026-11-20  
**Revised:** 2026-11-20  
**Status:** Implementation (revised architecture)

## Problem

Job seekers in India and internationally stitch together boards, resume tools, and spreadsheets. Scores are opaque. Listings go stale. AI tools send resumes to unpaid APIs.

## Solution (wedge)

A privacy-first career workspace: **know where you stand** — source, freshness, explained match, user-approved resume edits, one application pipeline.

## Phase 1 scope (this delivery)

### Marketing (`apps/marketing`)

Independently runnable and **statically exportable** (`output: 'export'`). Does not require login. No ISR, cookies, or Server Actions.

- Home
- Product index + Job Discovery, Resume Studio, Application Tracker, AI Matching
- Audiences: Students, Fresh Graduates, Internship Seekers, Remote / International
- Pricing (recommended, not live billing)
- About, Contact, Privacy, Terms, Security, Accessibility
- Start Free / Sign In → `NEXT_PUBLIC_APP_URL`
- Unique titles; sitemap/robots generated **at build time**
- No fake testimonials, metrics, or customers
- No JobPosting JSON-LD (no job-detail pages yet)

### App (`apps/web`)

- Sign up / sign in / sign out (self-hosted Better Auth + Drizzle; Google optional)
- Onboarding (profile fields, skip-able resume note until Phase 3 parse)
- Home overview with **real empty states**
- Profile completeness
- Settings (alerts preference, consent flags, export JSON, delete account)
- **In-app notification inbox** (empty valid; mark read / mark all; unread count)
- Usage monitoring (`ai_usage` + `usage_event`); flags default off
- Plan catalog: everyone is **Free**; Pro is ₹199/month + GST and **not billed**
- Nav: Overview, Jobs (Discover / Recommended / Saved), Workspace, Resume Studio, Prepare, Insights, Inbox, Profile, Settings — upcoming modules stay honest empty states

### API (`apps/api`)

- `GET /health`
- Better Auth handler (no `@neon/auth`)
- `GET/PATCH /v1/profile`, `GET/PATCH /v1/settings`
- `GET /v1/notifications`
- `GET /v1/export`, `DELETE /v1/account`
- Feature flags + security headers
- Email senders are no-ops without `RESEND_API_KEY`

### Out of Phase 1

Live ATS ingest, resume parse/export, matching UI, **browser extension save-job**, Resend account, R2 account, Neon account (PGlite default), public LLM, Job Search Intelligence, ISR, paid anything.

**Phase 2:** curated employer registry + adapters + **URL import** + search/save/expiry (implemented).

**Phase 3 (this delivery):** Resume Studio — parse/review/edit/analyze/match/tailor/export without paid AI.

**Phase 4 (this delivery):** application tracker + in-app follow-ups. Unlimited on Free. No auto-apply.

**Phase 5 (this delivery):** Career Evidence Vault, Application Pack assemble (paste), extension clips visible tab title + URL. Cover-letter AI drafts remain unimplemented.

**Phase 8:** Job Search Intelligence (ADR 0009).

## Brand

- Tagline: Your career, compounded.
- Line: Jobs you can trust. Matches you can explain.
- Visual: ink, paper, teal accent. Not purple SaaS.

## Success for this phase

A visitor understands HireFlow on the marketing site, creates an account, completes onboarding, edits profile/settings, opens an empty notification inbox, exports or deletes data. Empty product areas explain what comes next instead of dead buttons.
