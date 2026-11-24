# Resume intelligence testing

**Date:** 2026-11-21

| Area | Location | Covers |
|------|----------|--------|
| Parse | `packages/resumes/src/parse.test.ts` | TXT extract, missing dates, empty/oversize/unsupported |
| Analysis | `packages/resumes/src/analysis.test.ts` | Empty resume, vague bullets, no ATS claim |
| Tailoring | `packages/resumes/src/tailor.test.ts` | No invented skills, original preserved |
| Export | `packages/resumes/src/export.test.ts` | PDF `%PDF`, DOCX ZIP, round-trip via unpdf/mammoth |
| Matching | `packages/matching/src/resume-job.test.ts` | Required vs preferred, insufficient dates |
| AI policy | `packages/ai/src/index.test.ts` | Deterministic default, untrusted wrap |
| Entitlements | `packages/entitlements/src/index.test.ts` | Free studio/parse/tailor, version cap |
| API | `apps/api/src/resumes.test.ts` | Auth, cross-user 404, TXT parse + confirm |

Fixtures are synthetic. Do not commit real user resumes. Tests do not call paid APIs.
