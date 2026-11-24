# Feature Discovery and Prioritization

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Source type:** Internal backlog scored against competitor gaps ([SOURCE_REGISTER.md](SOURCE_REGISTER.md)) and launch constraints  
**Confidence:** High for P0/P1 decisions; Low for RICE numeric scores (they are judgment, not measured reach)  

**Correction:** The prior 26-feature “P0 / 112 person-month / 12-engineer” plan is **rejected**. P0 is the wedge in this document.

---

## Framework

RICE is used as a **relative** ranking aid (Reach, Impact, Confidence, Effort on 1–10). Scores are not forecasts.

| Priority | Meaning | When |
|----------|---------|------|
| **P0** | First public product (Phases 1–4). **URL import in Phase 2. Extension in Phase 5.** | Now |
| **P1** | Differentiators after the workspace works | Phase 5–6 |
| **P2** | Connected services and intelligence | Phase 6–7 |
| **P3** | Experimental / only if usage justifies | Phase 8+ |

**Hard no:** server-side scraping; auto-submit applications; unpaid Gemini with resumes; invented jobs/testimonials/salaries; fake universal ATS scores; live interview stealth copilots; native iOS/Android in P0/P1.

---

## P0 — first public product

| ID | Feature | Notes | RICE (rel.) |
|----|---------|-------|-------------|
| MKT | Marketing site (home, 4 product, 4 audience, pricing, legal) | Independently deployable | 9 |
| AUTH | Email/password + Google OAuth, session, return-to path | | 9 |
| M1 | Onboarding + career profile + privacy defaults | Resume import with **user review** | 9 |
| M1b | Settings, data export, account deletion | Phase 1 | 8 |
| M2 | Search, filters, saved jobs, job detail, source + last verified | Permitted sources only | 9 |
| M3 | Adapters: Greenhouse, Lever, Ashby + **URL import** | **Curated employer registry** of board IDs; not a global search API | 8 |
| M3b | Dedup (URL + title/company/location), expiry, attribution | | 8 |
| M5 | Cautious trust signals (stale, duplicate, broken link, payment-request language) | Warning copy, not accusations | 7 |
| M6 | Explainable match (skills, experience, location, seniority, gaps) | Not hire probability | 9 |
| M7 | Resume Studio: parse PDF/DOCX/TXT, 3 ATS-safe templates, versions, PDF/DOCX export, keyword compatibility | User approves all generated text | 8 |
| M9 | Application CRM: Saved, Preparing, Applied, Interview, Offer, Rejected, Withdrawn; Kanban + table; notes; follow-ups | | 9 |
| M10 | Chrome extension save-job | **Phase 5** — must not block Discover/Applications | — |
| M18 | **In-app** notifications | Email optional (Resend). No SMS | 7 |
| M19 | Responsive + keyboard + semantic HTML | PWA/native later | 8 |

Alerts in P0 are **in-app**. Email is optional and off without `RESEND_API_KEY`.

**P3 / Phase 8:** Job Search Intelligence (market trends, skills demand, location relevance, application performance, career recommendations) **only after** curated ATS data and user pipeline data exist. Do not invent market statistics.

---

## P1 — after the workspace works

- Job-specific resume tailoring with before/after (user approval; never fabricate).
- Cover letters and outreach drafts (user approval).
- Recommended-for-you feed using stored matches.
- Company profile pages from **public ATS fields only** (name, location, open roles, career URL).
- Career assistant over **the user’s own data** with citations; no silent writes.
- Application analytics with small-n caveats.
- Interview **practice** questions labeled as generated, not “confirmed company questions.”
- Autofill **preview** in the extension (still never auto-submit).

---

## P2

- Gmail/Outlook OAuth, least privilege, **suggest** status updates, never send mail without approval.
- Calendar: suggest events, never write without approval.
- Mock interviews (text); voice optional later because of cost/privacy.
- Skill-gap roadmaps using named free resources (no fake course catalogs).
- Contacts CRM (manual + permitted import only).
- Offer comparison calculator; salary figures only with a source and “estimate” label.

---

## P3

- Voice interviews, native apps, market forecasting, employer-side products, two-sided matching.

---

## Module inventory (kept as backlog, not launch scope)

The 20 modules from the original brief remain the long-term map. Implementation order follows Phases 1–9 in the architecture docs, not “all P0 features of every module.”

| Module | P0 slice | Deferred |
|--------|----------|----------|
| 1 Onboarding | Profile, resume review, privacy | LinkedIn OAuth import (no permitted full import) |
| 2 Discovery | Search, filters, save, **URL import** | Voice search; Job Search Intelligence (Phase 8) |
| 3 Ingestion | Curated ATS registry + URL import | Global ATS search API (does not exist); scrape; paid feeds |
| 4 Companies | Minimal from job payload | Reviews, funding, culture (unsourced) |
| 5 Trust | Rule-based signals | ML fraud classifier, blockchain |
| 6 Matching | Explainable weighted score | SHAP, two-sided employer matching |
| 7 Resume | Parse, templates, export, keywords | Video resume |
| 8 Documents | Store resume versions on application | E-sign |
| 9 Applications | CRM views | Email-ingest auto-create |
| 10 Extension | Stub only | Save-job Phase 5; autofill later; auto-submit never |
| 11 Email/calendar | — | P2 |
| 12 Interview | — | Practice P1; live copilot never |
| 13 Career | — | P2 |
| 14 Networking | — | P2 manual CRM |
| 15 Salary | — | P2 calculator only with sources |
| 16 Assistant | — | P1 on user data |
| 17 Analytics | — | P1 |
| 18 Notifications | In-app + usage meter | Email optional; SMS never in P0 |
| 19 Mobile | Responsive web | Native |
| 20 Admin | Feature flags + usage meter in API | Full admin UI later |

---

## Prioritization rationale (why this P0)

- User value: one loop from “I have a resume” to “I am tracking real applications.”
- Demand: tracker + resume + jobs is what Teal/Careerflow/Huntr charge for.
- Differentiation: explanation + trust + privacy + India, not feature count.
- Feasibility: permitted APIs + local AI + Next.js.
- Cost: no paid inference required.
- Privacy: no inbox read, no unpaid third-party resume upload.
- Dependencies: profile → jobs (registry + URL import) → resume/match → applications. Extension is **not** a dependency of P0.

---

## Non-goals for launch

Universal one-click apply on any ATS, government-portal scrape, salary-as-a-platform, live interview cheating aids, employer marketplace.
