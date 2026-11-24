# Open Source Research

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Source type:** Official project docs and licenses  
**Confidence:** High for license names of selected libraries; Medium for long-term maintenance  

---

## Decision (stack)

TypeScript monorepo. Prefer MIT / Apache-2.0 / BSD. Avoid AGPL/GPL in the production path (no PyMuPDF, no Marker, no Surya).

| Layer | Choice | License | Why | Rejected |
|-------|--------|---------|-----|----------|
| Language | TypeScript | — | Shared types across apps | Python as primary app |
| Marketing | Next.js **16.4.6** App Router, `output: 'export'` | MIT | Static HTML for Cloudflare Pages; **no ISR** (T-17, T-18) | ISR/OpenNext on Pages Free |
| Web app | Next.js **16.4.6** + React **19.3.1** | MIT | Node SSR/auth | Workers Free |
| CSS | Tailwind **4.3.5** + `@tailwindcss/postcss` | MIT | Matches npm latest (T-16); cna tests pin 4.3.3 | Tailwind 3 |
| API | Hono on **Node** | MIT | CPU for parse/embeddings; Workers Free is 10ms | NestJS (weight), Workers-only API |
| ORM | Drizzle | Apache-2.0 | SQL-shaped, Neon-friendly | Prisma (heavier, paid studio not needed) |
| Auth | Better Auth + Drizzle adapter | MIT | Self-hosted in our Node app (T-09) | **Neon Managed Better Auth** for v1 (T-20); Clerk |
| UI | Tailwind v4 + shadcn/Radix | MIT | Accessible primitives; we own tokens | Generic purple dashboard kits |
| PDF in | `unpdf` | MIT | JS, no native | pdf.js-heavy server, AGPL PyMuPDF |
| DOCX in | `mammoth` | BSD-2-Clause | Parse only | Using mammoth to *generate* DOCX |
| PDF out | `@react-pdf/renderer` | MIT | No Puppeteer on free compute | Playwright/Puppeteer for every export |
| DOCX out | `docx` (docx.js.org) | MIT | Separate generator (T-23, T-24) | officegen |
| Validation | Zod | MIT | Boundary schemas | — |
| Tests | Vitest + Playwright | MIT | Unit + real journeys | — |
| Extension | WXT | MIT | MV3 Chrome | Heavy Plasmo if WXT suffices |
| Embeddings | nomic-embed-text | Apache-2.0 | Local via Ollama | NC-licensed Jina embeddings |
| Local LLM | Llama 3.x / Qwen2.5 via Ollama | Model-specific; check commercial | Dev/privacy | Command R+ NC |
| Vector | pgvector on Postgres | PostgreSQL / pgvector license | No Pinecone bill | Hosted vector DBs as mandatory |
| Inference local | Ollama / llama.cpp | MIT | Dev | vLLM only if we later have GPUs |

Official docs used: Next.js, Hono, Drizzle, Better Auth, shadcn, Neon pgvector (T-08–T-10, T-02).

---

## Resume parsing

**Fact:** Many OSS resume tools chain `unpdf`/`pdf-parse` + `mammoth` then an LLM. HireFlow Phase 3: **rules first** (headings, dates, email/phone regex), LLM only to structure leftovers, **user confirms**. Never write fabricated employers or dates.

OCR (Tesseract Apache-2.0) is P2 for scanned PDFs; not P0.

---

## Hosting-related OSS

- **Umami / Cloudflare Web Analytics** for marketing — privacy. No GA default.
- **web-push** later for browser notifications (P1).
- **Resend** is optional SaaS (T-22: 100/day, 3,000/month). Phase 1 does not require it.
- **Extension (WXT)** is scaffolded but **not** on the Phase 1 critical path (Phase 5).

---

## License watch

| Library | Risk |
|---------|------|
| Llama community license | Acceptable for many commercial uses; record the exact model card before shipping weights |
| Gemma | Custom Google license — do not assume Apache |
| Unstructured.io | Apache for OSS; hosted API is separate |
| mammoth CLI sprintf advisory | Do not ship unused CLI path |

---

## Implications

`packages/*` stay license-clean. A `NOTICE` file will list third-party licenses when the monorepo is scaffolded. Do not add AGPL document converters to get slightly better PDF tables.
