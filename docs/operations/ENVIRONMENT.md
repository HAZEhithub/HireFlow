# Environment

Never commit real secrets. Copy `.env.example` to `.env`.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres/Neon. If unset, API uses **PGlite** at `.data/hireflow.db` (default; no Neon account) |
| `BETTER_AUTH_SECRET` | 32+ character unique secret. **Required in production** — the process refuses to start on the development placeholder |
| `BETTER_AUTH_URL` | App origin that issues cookies, e.g. `http://localhost:3000` (not the API port) |
| `TRUST_PROXY` | Set `true` only behind a reverse proxy that overwrites `X-Forwarded-For`. Default ignores client-supplied forwarding headers |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_MARKETING_URL` | `http://localhost:3002` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |
| `GOOGLE_CLIENT_ID` / `SECRET` | Optional OAuth |
| `RESEND_API_KEY` | Optional email. Unset = log-only no-op (ADR 0008) |
| `AI_EXTERNAL_ENABLED` | default `false` — public SaaS off |
| `PAID_PROVIDERS_ENABLED` | default `false` |
| `GEMINI_API_KEY` | Paid only; unused unless flags + consent. Unpaid Gemini blocked for sensitive payloads. Phase 6 never HTTP-calls Gemini |
| `HIREFLOW_PLAN_OVERRIDE` | Local/dev only (`pro`). Ignored in production. Never accept a plan from the client |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | Optional. Unset = local `.data/uploads` (ADR 0007). Do not provision without approval |
| `UPLOAD_DIR` | Local upload root, default `.data/uploads` |
| `ADMIN_EMAILS` | Comma-separated emails for `/v1/admin/jobs/*`. Requires `email_verified = true` on the user row. Empty means no email-based admin |
| `ADMIN_USER_IDS` | Preferred admin allow-list: existing user ids. Empty + empty `ADMIN_EMAILS` means no admin |

No paid provider is called unless both env flags and user consent are true.

Do **not** set Neon Managed Auth variables. Auth is self-hosted Better Auth + Drizzle.

`BILLING_LIVE` is hardcoded `false` in `@hireflow/entitlements`. There is no payment environment variable on purpose.

Do **not** enable billing, deploy, or provision Neon/R2/Resend/Razorpay/Cashfree/Paddle/Stripe without explicit approval.
