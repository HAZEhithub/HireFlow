# Hosting and Cost Research

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Source type:** Official pricing/docs  
**Confidence:** High for quoted free-tier numbers on access date; quotas change  

Sources: T-01–T-05, T-07 in [SOURCE_REGISTER.md](SOURCE_REGISTER.md).

---

## Decision

| Surface | Dev (₹0) | First public | Later |
|---------|----------|--------------|-------|
| Marketing | `next dev` | Cloudflare Pages **static `out/`** (T-18). **No ISR** (T-17) | Same |
| App + API + workers | Local Node | **Needs approval** ~$5 VPS (recommended) or Workers **Paid**. Not Workers Free (T-03) | Same |
| Database | **PGlite default** (no Neon account). Neon Free optional (T-01, T-19) | Neon Free until 1 GB / CU cap | Neon Launch |
| Auth | Better Auth + Drizzle in-process | Same | Do **not** switch to Neon Managed Auth without a new ADR (T-20) |
| Files | Disk `.data/uploads` | **R2** Standard free tier (T-05) | R2. Neon Object Storage rejected for v1 (T-21) |
| AI | Optional **local Ollama**. Public SaaS **off** | Same until approved provider/BYOK | Paid/BYOK with consent |
| Email | **Off / log-only** | Optional Resend 100/day, 3,000/month (T-22) | Resend paid |
| Notifications | **In-app** | In-app + optional email | Web Push later |
| Analytics | Off | Cloudflare Web Analytics | Umami if needed |

**Fact:** Cloudflare Workers Free = 100k requests/day and **10 ms CPU per request** (T-03, T-04). Authenticated SSR, PDF parse, and embeddings will not fit. Do not claim “₹0 production app on Workers Free.”

**₹0 mandatory path:** local app + Neon Free + Pages for marketing. App stays private until a paid host is approved.

---

## Provider notes (official)

### Neon Free (FAQ updated 2026-11-03, read 2026-11-20)

- 100 projects, 10 branches/project
- 1 GB Postgres/project (20 GB account cap)
- 100 CU-hours/project/month
- Scale to zero after **5 minutes** (cannot disable on Free)
- 5 GB egress/project/month
- pgvector included (T-02)
- Hitting CU or egress **suspends compute** until next month or upgrade — data not deleted

**UX tax:** cold starts. Product should show a “database waking” state.

### Cloudflare Pages (static only for v1)

- **Fact (T-17):** static export cannot use ISR, cookies, Server Actions, default image optimizer.
- **Fact (T-18):** Pages “Next.js (Static HTML Export)” = `npx next build`, publish `out`.
- Do not assume ISR on a plain Pages deployment.

### Cloudflare R2 vs Neon Object Storage (pick one)

| | R2 (selected) | Neon Object Storage (rejected for v1) |
|---|---|---|
| Source | T-05 | T-21, T-19 |
| Free | 10 GB-month, 1M Class A, 10M Class B, **egress free** | 5 GB/project |
| Egress | Free | Counts toward 5 GB **public network transfer** (shared with Postgres) |
| Regions | Cloudflare global | Subset of AWS regions |
| Extra risk | Cloudflare account | IP Allow does not protect object requests; branches with DB |
| Exit | S3 API copy-out | S3 API copy-out |

**Decision:** local disk, then **R2 Standard**. Neon blobs would compete with DB transfer quota.

### Neon Managed Better Auth (not selected)

T-20: `neon_auth` schema, `@neon/auth`, AWS-only, fails with IP Allow. Neon documents self-hosting Better Auth when you need own infrastructure. HireFlow v1: **Better Auth + Drizzle** on PGlite/Postgres.

### Vercel / Netlify Hobby

- **Rejected as production** for commercial use on free plans (vendor terms). Fine for personal experiments only.

### Resend (optional)

- **Fact (T-22):** Free 100 emails/day (UTC calendar day) and 3,000/month; inbound counts.
- Phase 1: product works without a key. In-app notifications first.

---

## Cost model (order-of-magnitude, USD)

Assumptions: light usage, local embeddings, no paid LLM, marketing on Pages. **Not a quote.**

| Stage | Infra | Notes |
|-------|-------|-------|
| Development | $0 | Laptop + Neon Free + Ollama |
| 100 users | $0–5 | Free tiers; Neon pause risk |
| 1,000 users | $5–25 | First VPS or Workers Paid; Resend still free; Neon Free until storage |
| 10,000 users | $40–120 | Neon paid, email, R2, maybe paid Gemini with hard caps |
| 100,000 users | Hundreds | Not a free-tier product; cost monitor must trip first |

INR: development ₹0 infra; domain ~₹800–1500/year optional.

---

## Financial safeguards (code)

- No automatic subscription or cloud provisioner.
- `PAID_PROVIDERS_ENABLED=false` default.
- Per-feature token/request budgets.
- Spend caps in Neon/Cloudflare dashboards when accounts exist.
- Internal usage table: provider, model, tokens, estimated USD, user id, feature.

---

## Exit

- Postgres dump; R2 is S3-compatible; Next.js portable; Better Auth is in-process. Avoid lock-in beyond Neon’s wire protocol (standard Postgres).
