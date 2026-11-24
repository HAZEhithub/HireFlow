# ADR 0006 — Cost and hosting

**Status:** Accepted  
**Date:** 2026-11-20  
**Revised:** 2026-11-20 (Pages static only; app not Workers Free; no auto-billing)

## Decision

- Development: ₹0 — local Node, **PGlite default**, Ollama optional. Neon account is **not** required.
- Marketing public: Cloudflare Pages **static export** (`out/`). **No ISR.**
- Authenticated app: **not** Cloudflare Workers Free (100k req/day, **10 ms CPU/request**, 128 MB — [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)).
- First public app host requires explicit approval (~$5 VPS preferred, or Workers **Paid**).
- First cloud object store: R2 (ADR 0007). Neon Object Storage rejected for v1.
- Email: Resend optional, 100/day and 3,000/month free ([Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits)). Product works without a key.
- No auto-provisioning, no paid AI by default, usage metering from day one.

See [HOSTING_AND_COST_RESEARCH.md](../research/HOSTING_AND_COST_RESEARCH.md).

## Consequences

Do not claim “₹0 production app on Workers Free.” Do not enable billing, Neon, R2, or Resend accounts without explicit user approval.
