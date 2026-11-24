# HireFlow Architecture

Phase 0 decisions (revised 2026-11-20). Each ADR is binding until superseded.

| ADR | Topic |
|-----|--------|
| [0001](ADR-0001-monorepo.md) | Monorepo; marketing static export; extension not on the critical path |
| [0002](ADR-0002-stack.md) | Next 16.4.6, React 19.3.1, Tailwind 4.3.5, Hono Node, Drizzle, Better Auth, unpdf/mammoth, `@react-pdf/renderer` + `docx` |
| [0003](ADR-0003-ai-gateway.md) | Deterministic → optional local Ollama → public/BYOK off by default |
| [0004](ADR-0004-job-ingestion.md) | Curated registry + URL import; no scrape; no extension in first discovery |
| [0005](ADR-0005-security.md) | Sessions, isolation, uploads, no compliance claims |
| [0006](ADR-0006-cost.md) | Pages static; app not Workers Free; Neon DB optional; no auto-billing |
| [0007](ADR-0007-object-storage.md) | Local then R2; Neon Object Storage rejected for v1 |
| [0008](ADR-0008-notifications.md) | In-app first; Resend optional |
| [0009](ADR-0009-job-search-intelligence.md) | Job Search Intelligence deferred to Phase 8 |
| [schema-v1.md](schema-v1.md) | Data model Phase 1–3 (`notification`, jobs, `resume*`) |
| [resume-intelligence.md](resume-intelligence.md) | Parse, matching evidence, tailoring, export |
| [job-discovery.md](job-discovery.md) | Phase 2 adapters, freshness, dedup, search, SSRF, ingest ops |
| [BILLING_AND_ENTITLEMENTS.md](BILLING_AND_ENTITLEMENTS.md) | Plan catalog; billing not live |
| [PRODUCT_FEATURE_ROADMAP.md](PRODUCT_FEATURE_ROADMAP.md) | Phased features including vault/pack/evidence map |
| [CUSTOMER_JOURNEY.md](CUSTOMER_JOURNEY.md) | Visitor to workspace |
| [../product/SPEC.md](../product/SPEC.md) | Product spec |
| [../product/PRICING_AND_PACKAGING.md](../product/PRICING_AND_PACKAGING.md) | Free vs Pro |
| [../product/REVENUE_MODEL.md](../product/REVENUE_MODEL.md) | Revenue streams |

Related research: [`docs/research/`](../research/).
