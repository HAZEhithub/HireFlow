# AI / ML Research

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Source type:** Official provider terms + open-model cards  
**Confidence:** High for Gemini unpaid-data terms (T-06); Medium for specific open-model quality (no HireFlow eval yet)  

Sources: [SOURCE_REGISTER.md](SOURCE_REGISTER.md) T-06, T-07; Ollama/model cards as of 2026-11-20.

---

## Non-negotiables

1. Deterministic code before models.
2. **Local Ollama is optional and hardware-dependent.** It is never required for product function. Deterministic matching always works.
3. **Public SaaS inference is off until an approved privacy-safe provider or BYOK** plus user consent (`AI_EXTERNAL_ENABLED=false`, `PAID_PROVIDERS_ENABLED=false`).
4. **Never send resumes, profiles, or application text to unpaid Gemini** (or any unpaid hosted API whose terms allow training/human review).
5. Paid external models only with **informed consent**, minimization, and `PAID_PROVIDERS_ENABLED`.
6. Product works when AI is offline (Ollama absent → fail closed, still useful).
7. Match scores are **compatibility**, not P(hired).
8. Do not invent eval numbers or market-trend statistics. Job Search Intelligence is **Phase 8**.

---

## Gemini terms (fact)

From https://aistudio.google.com/docs/terms (accessed 2026-11-20):

- Unpaid Gemini / AI Studio: Google may use submitted content and responses to provide, **improve, and develop** Google products; human reviewers may process inputs.
- Paid Gemini: prompts/responses not used to improve Google products (processor terms).
- API clients offered to users in EEA/Switzerland/UK must use **Paid** services.

**Product implication:** `packages/ai` refuses unpaid Gemini when payload classification is `sensitive` (resume, profile, email, application). There is no “free-tier fallback” for PII.

---

## Gateway

```
request
  → feature budget + user consent flags
  → exact cache
  → deterministic extractor
  → local embedding / local LLM (Ollama)
  → paid provider (optional, consented)
  → validate JSON with Zod
  → usage row (tokens, $ estimate, provider, model version)
```

Flags default: `AI_EXTERNAL_ENABLED=false`, `PAID_PROVIDERS_ENABLED=false`.

**Split:** feature request → deterministic code → if LLM needed **and** Ollama healthy → local → never public by default. If Ollama absent, skip LLM and keep extractors + match templates.

---

## Task routing (launch)

| Task | Method | Model? |
|------|--------|--------|
| Email/phone/URL from resume | Regex | No |
| Section split | Heading heuristics | No |
| Skill/title normalize | Dictionary + embeddings | nomic-embed-text local |
| Job search | Postgres FTS + pgvector | Embeddings |
| Match explanation | Weighted overlap + templates | LLM only to phrase gaps, optional |
| Dedup | URL + fingerprint + cosine | Embeddings |
| Cover letter (P1) | Local or paid+consent | User must edit/approve |
| Assistant (P1) | RAG over **that user’s** rows only | Citations required |

Recommended local embedding: **nomic-embed-text** (Apache-2.0). Store `embedding_model` + `embedding_version` on rows for reindex.

Local LLM (dev): Llama 3.1 8B or Qwen2.5 7B via Ollama if RAM allows; otherwise skip LLM and keep extractors + match templates.

---

## Evaluation

Create fixtures under `packages/ai/eval/` in Phase 3:

- 10 redacted resumes (synthetic or consented)
- 10 jobs from Greenhouse fixtures
- Gold: skills list, must-have vs nice-to-have, duplicate pairs

Metrics: parse field accuracy, match precision@k (human), dupe F1, latency, $ / request. **No scores until measured.**

---

## Safety

- Treat JD and resume text as untrusted (prompt injection).
- Wrap untrusted text in delimiters; never concatenate into system tools.
- Strip model output that adds employers, dates, or skills not in the source.
- Cross-user retrieval forbidden (tenant id on every embedding row).
- Cost: per-user monthly assist cap (free = 5).

---

## Limitations

- Ollama quality is hardware-dependent and **not a production SLA**.
- Job Search Intelligence (market trends, skills demand) is deferred until curated ATS + pipeline data exist (Phase 8). Small-n caveats required. Do not invent stats.
- Hosted “free” models besides Gemini have similar data-use risks — classify each before enabling.
- Fairness: do not encode gender, religion, caste, age as features. Location only as user preference.
