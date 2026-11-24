# ADR 0005 — Security and privacy

**Status:** Accepted  
**Date:** 2026-11-20  
**Revised:** 2026-11-20 (self-hosted auth; R2 private buckets; marketing headers on Pages)

## Decision

- **Self-hosted Better Auth** sessions in our DB; httpOnly cookies. Not Neon Managed Auth (ADR 0002).
- Server-side authorization on every mutation/read (`user_id` isolation)
- Zod at HTTP boundary
- Uploads: 5 MB, magic bytes, private storage (local then R2 signed GET — ADR 0007)
- Security headers middleware on **API and `apps/web`**. Marketing is static; headers come from Cloudflare Pages config
- Account export + deletion in Phase 1
- Rate-limit `/v1/auth/*`, uploads, and job URL import (per authenticated user id)
- Job upsert never merges `user_import` with live/fixture listings or with another importer
- Admin ingest requires `ADMIN_USER_IDS` or a **verified** `ADMIN_EMAILS` match; session email alone is not enough
- Persist only public `http(s)` apply URLs; treat job descriptions as untrusted text
- Logs never include resume body or tokens
- Do not claim DPDP/GDPR certification on the marketing site
- Public AI off; unpaid Gemini blocked for sensitive payloads (ADR 0003)

Extension (Phase 5): optional host permissions; save-job only. Not a Phase 1 surface.

## Consequences

Privacy policy describes actual behavior. Legal review before production. Static marketing cannot set cookies or Next `headers()`.
