# Security and Privacy Research

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Source type:** Engineering controls research; **not a legal opinion**  
**Confidence:** High for technical controls; **legal compliance is unclaimed**  

---

## Statement

HireFlow will implement security and privacy **controls**. That does **not** equal DPDP 2023, GDPR, or CCPA certification. Qualified legal review is required before production claims on `/privacy` beyond “what we actually do.”

---

## Data we will hold (Phase 1–4)

- Account: email, password hash (**self-hosted Better Auth + Drizzle**, not Neon Managed Auth), sessions
- Notifications: in-app rows (no email required)
- Usage: `ai_usage` and request counters
- Profile: career fields the user enters
- Resumes: files + parsed JSON (user-correctable)
- Jobs: public ATS snapshots + user imports
- Applications: stages, notes, documents
- AI usage logs: **no raw resume in logs**

Sensitive: resumes, emails, salary expectations, work-authorization.

---

## Authentication (decision)

- **Self-hosted Better Auth + Drizzle** on our Postgres/PGlite (T-09). **Not** Neon Managed Better Auth (T-20: `neon_auth`, AWS-only, no IP Allow).
- Session in database; httpOnly, Secure, SameSite=Lax/Strict cookie
- CSRF protection on cookie mutations
- Password hashing via library defaults (do not roll crypto)
- Verification email via Resend **only when configured**; local/Phase 1: log link. Product works without Resend (T-22).
- Export + delete account in Phase 1

OAuth scopes: Google `email profile` only at launch. Gmail `readonly` is P2 and must be a **separate** consent screen.

---

## Authorization

- Every query filtered by `user_id` (object-level). IDs are unguessable UUIDs but **not** a substitute for checks.
- Admin roles later; no shared “support backdoor.”
- Extension uses the same session/API tokens; no extra privilege.

---

## Uploads

- Max size (e.g. 5 MB)
- Magic-byte type check (PDF/DOCX/TXT), not just extension
- Store outside web root: Phase 1 local `.data/uploads`; first cloud store **Cloudflare R2** private bucket + signed GET (T-05). Neon Object Storage rejected for v1 (T-21: 5 GB + egress on shared transfer; IP Allow does not protect objects).
- Parse in workers; timeout; zip-bomb limits on DOCX
- Malware scanning: **strategy** = ClamAV when a host exists; until then type+size+sandbox timeouts
- Delete file on account deletion

---

## AI data flow

- Default: deterministic + optional **local Ollama**. Public SaaS **off**.
- Unpaid Gemini **blocked** for sensitive payloads (T-06)
- Prompt injection: JD/resume untrusted
- Consent record stored before any external paid call
- No training on user resumes for third parties

---

## Web security

- HTTPS in production
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Zod on all inputs
- Parameterized SQL (Drizzle)
- Rate limit auth and upload
- Security headers: app/API on Node. Marketing is **static export** (T-17) so response headers come from **Cloudflare Pages config**, not Next.js `headers()`.
- No secrets in client bundles; `.env` gitignored

---

## Extension (Phase 5 — not a Phase 1 security surface)

- Optional host permissions (not `<all_urls>` by default)
- Save visible job + URL only
- No browsing-history collection
- Autofill (later) shows a preview; submit stays a user gesture on the employer site

---

## India DPDP / international (identification only)

| Topic | Implication | Owner |
|-------|-------------|-------|
| DPDP 2023 consent, purpose limitation, deletion | Align product: consent, export, delete, minimization | Legal review |
| Cross-border processing (Neon/Cloudflare regions) | Disclose regions; prefer a documented region | Legal + infra |
| GDPR-minded if serving EU | Lawful basis, DPA with processors | Legal; Gemini paid-only in EEA (T-06) |
| Children’s data | No under-16 accounts; internship seekers may be 18+ campus — age gate | Product |

Do not put “GDPR compliant” or “DPDP certified” on the marketing site.

---

## Limitations

- No pentest yet
- No WAF beyond host defaults
- Backups: Neon point-in-time on paid; Free restore window is short (6 hours per Neon FAQ) — disclose
