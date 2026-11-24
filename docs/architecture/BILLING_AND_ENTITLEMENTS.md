# Billing and entitlements

**Status:** Accepted  
**Date:** 2026-11-24  
**Billing live:** `false` (`BILLING_LIVE` in `@hireflow/entitlements`)

## Decision

- Single catalog in `packages/entitlements`.
- Backend `assertEntitlement(userId, key)` is the only access check. UI hiding is not authorization.
- Production `resolvePlan` returns **Free / none** while `BILLING_LIVE` is false. Tests may inject a `PlanResolver`. `HIREFLOW_PLAN_OVERRIDE=pro` is local-only and ignored in production. Never trust a client-submitted plan.
- Implemented Phase 6 keys (`matching.evidence_map`, `prepare.company_brief`, `applications.analytics`) are **complimentary while billing is off** (Pro limits). Copy: included now; becomes Pro when checkout is approved.
- No `subscription` table, no payment SDK, no webhook receiver, no checkout UI.

## HTTP mapping

| EntitlementError | Status |
|------------------|--------|
| NOT_IMPLEMENTED | 501 — coming later, not a paywall |
| NOT_GRANTABLE | 404 — research keys |
| PLAN_REQUIRED | 403 — Pro required; still no checkout |
| QUOTA_EXCEEDED | 429 |

`GET /v1/entitlements` returns the public catalog.

Monthly quotas (`ai.assists_per_month`, `jobs.url_import_per_month`) increment `usage_period` with compare-and-set (`UPDATE … WHERE count < limit`).

## Payment interfaces (not live)

`@hireflow/billing` defines `PaymentProvider` (`createCheckout`, `cancel`, `refund`, `verifyWebhook`). The Razorpay adapter throws `BillingNotLive`. There is no Razorpay npm dependency.

When billing is **explicitly approved later**:

1. Persist subscription rows. `resolvePlan` must ignore those rows until `BILLING_LIVE` is true.
2. Flip `BILLING_LIVE`.
3. Implement webhook verification:
   - HMAC signature over the raw body using the provider webhook secret.
   - Idempotency key stored per event id; duplicate deliveries must no-op.
   - Never trust a client-reported subscription status.
4. Drop complimentary preview so Phase 6 keys follow Free vs Pro limits.

## Later lifecycle (documentation only)

`none` → `active` → `past_due` (recommended 7-day grace; tracker stays usable) → `canceled` (Pro until period end, then Free).

Provider sequence when billing is **approved later**: Razorpay first, Cashfree second, Paddle/Stripe later. See [MONETIZATION_RESEARCH.md](../research/MONETIZATION_RESEARCH.md).

## GST

Display “+ applicable GST”. Do not implement GSTIN collection or invoices until tax advice exists. India Pro remains ₹199/month + applicable GST. `indicativeUsdHypothesis` ($9) is **not** an approved marketing headline.

## Implemented keys (Phase 6)

- Complimentary preview: Evidence Map, ATS-field company brief, personal pipeline analytics.
- Unimplemented (501): `resume.cover_letter`, `prepare.interview`, `coach.search_strategy`, `skills.graph`.
- `ai.resume_analysis` is a documentation alias of deterministic `matching.explainable` plus `resumes.parse_export`.
