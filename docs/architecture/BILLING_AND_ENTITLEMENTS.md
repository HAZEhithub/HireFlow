# Billing and entitlements

**Status:** Accepted for Phase 1 implementation  
**Date:** 2026-11-21  
**Billing live:** `false` (`BILLING_LIVE` in `@hireflow/entitlements`)

## Decision

- Single catalog in `packages/entitlements`.
- Backend `assertEntitlement(userId, key)` is the only access check. UI hiding is not authorization.
- `resolvePlan` always returns **Free / none** while `BILLING_LIVE` is false.
- No `subscription` table, no payment SDK, no webhook receiver, no checkout.

## HTTP mapping

| EntitlementError | Status |
|------------------|--------|
| NOT_IMPLEMENTED | 501 — coming later, not a paywall |
| NOT_GRANTABLE | 404 — research keys |
| PLAN_REQUIRED | 403 — Pro required; still no checkout |
| QUOTA_EXCEEDED | 429 |

`GET /v1/entitlements` returns the public catalog.

## Later lifecycle (documentation only)

`none` → `active` → `past_due` (recommended 7-day grace; tracker stays usable) → `canceled` (Pro until period end, then Free).

Provider sequence when billing is **approved later**: Razorpay first, Cashfree second, Paddle/Stripe later. See [MONETIZATION_RESEARCH.md](../research/MONETIZATION_RESEARCH.md).

## GST

Display “+ applicable GST”. Do not implement GSTIN collection or invoices until tax advice exists.

## Phase 3 resume keys

Implemented: `resumes.studio`, `resumes.parse_export`, `resumes.max_versions` (Free: 2 documents), `resume.tailoring` (new documents count toward the cap), `ai.assists_per_month` (optional LLM only). Cover letters remain `NOT_IMPLEMENTED`. Pro is still ₹199/month + applicable GST with checkout disabled.
