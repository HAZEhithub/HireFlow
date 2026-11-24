# ADR 0003 — AI gateway

**Status:** Accepted  
**Date:** 2026-11-20  
**Revised:** 2026-11-20 (local Ollama vs public SaaS split)

## Decision

`packages/ai` is the only module that talks to models.

```
feature request
  → deterministic code (always)
  → if LLM needed AND Ollama healthy → local Ollama (optional, hardware-dependent)
  → public SaaS / BYOK — never by default
  → if Ollama absent → fail closed, still useful
```

**Flags (default false):** `AI_EXTERNAL_ENABLED`, `PAID_PROVIDERS_ENABLED`.

**Local Ollama** is optional. It is never required for product function. Deterministic matching (`packages/matching`) always works with no LLM.

**Public SaaS inference** stays off until an **approved privacy-safe provider or BYOK**, plus explicit user consent. Unpaid Gemini remains blocked for sensitive payloads ([Gemini API Additional Terms](https://aistudio.google.com/docs/terms), 2026-11-20).

**Hard block:** payloads classified `sensitive` (resume, profile, application, email body) must not use unpaid Gemini or any unpaid hosted API whose terms allow training/human review.

Every call writes `ai_usage` (user, feature, provider, model, tokens, estimated USD, status). Auth/API counters are separate usage rows.

Free plan: 5 AI assists / user / month. Deterministic match does not count.

## Consequences

Phase 1 shipped the gateway stub + flags + usage table. Phase 3 resume parse, analysis, matching, tailoring, and export are deterministic. Optional local Ollama is probed only when requested; public SaaS stays off. Turning on public AI later is a product + privacy change, not a silent fallback.
