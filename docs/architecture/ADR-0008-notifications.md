# ADR 0008 — Notifications (in-app first)

**Status:** Accepted  
**Date:** 2026-11-20

## Context

Auth verification and later job/follow-up alerts need a delivery path. Resend Free is **100 emails/day UTC** and **3,000/month** (sent + received) ([quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits), 2026-11-20). Workers Free CPU is too small for app logic.

## Decision

- **Phase 1: in-app notification inbox.** Empty state is valid. Rows live in `notification` (schema-v1).
- **Email (Resend) is optional.** If `RESEND_API_KEY` is unset, senders are log-only no-ops. Product must work.
- No SMS, no phone, no Workers for notification fan-out on Free CPU.
- Usage monitoring (`ai_usage` + request counters) is separate from the inbox.
- Web Push is later (P1+).

## Consequences

Settings may keep an `email_alerts` preference, but Phase 1 does not depend on mail delivery. Do not provision Resend without approval.
