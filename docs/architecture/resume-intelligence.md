# Resume intelligence architecture

**Date:** 2026-11-21  
**Status:** Implemented for Phase 3

## Packages

| Package | Role |
|---------|------|
| `@hireflow/resumes` | Parse, store, analyze, tailor, export |
| `@hireflow/matching` | Deterministic profile and resume overlap (`explainMatch`, `matchResumeToJob`) |
| `@hireflow/ai` | Provider routing, untrusted wrappers, optional Ollama probe. No unpaid Gemini. |
| `@hireflow/db` | `resume*` tables, local files under `.data/uploads` |

## Parse pipeline

1. Size limit (5 MB) and magic-byte detection (`pdf`, `docx` ZIP inspection, `txt`).
2. ZIP bomb / path-traversal guards on DOCX.
3. Private write: `.data/uploads/{userId}/{documentId}` — never returned to clients.
4. `unpdf` / `mammoth` / UTF-8 text extract.
5. Heading-based section parse. Dates are copied only when present in the source.
6. User confirmation screen before a resume row is created.

Scanned PDFs with almost no extractable text are labeled as needing OCR. OCR is **not** enabled; HireFlow does not claim those files were parsed.

## Matching

`matchResumeToJob` reuses `MATCH_WEIGHTS` and `explainMatch`. It adds requirement evidence (`strong` / `partial` / `missing` / `insufficient`). Preferred skills are never treated as mandatory. Missing dates are insufficient evidence, not a fabricated tenure. The score is overlap, not P(hired).

## Tailoring

Deterministic suggestions only: reorder skills/sections, emphasize keywords already present, clarify “worked on” phrasing. Applying decisions creates a **new** resume (`origin_kind = tailored`) with `parent_resume_id`. `assertNoFabrication` refuses new skills, company changes, and date edits.

Optional local Ollama may later rephrase accepted bullets. External AI stays behind `AI_EXTERNAL_ENABLED` + `PAID_PROVIDERS_ENABLED` + paid consent. Usage logs store feature/provider/tokens, never resume bodies.

## Templates and export

- Professional Classic (Times)
- Modern Professional (Helvetica, teal rules)
- Compact Technical (dense, skills/projects first)

A4, generated from the structured model. Preview is HTML; export is independent PDF and DOCX pipelines.

## Entitlements

`resumes.studio`, `resumes.parse_export`, `resumes.max_versions` (Free: 2 documents), `resume.tailoring`, `ai.assists_per_month` (LLM only). Cover letters stay unimplemented.
