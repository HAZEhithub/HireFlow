# Source Register

**Project:** HireFlow  
**Document type:** Research source register  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-20  
**Classification:** Internal  

This register lists sources used across Phase 0 research. Each entry records URL, type, access date, what was verified, limitations, and confidence. Product implications live in the specialist research docs.

**Legend**

- **Fact:** Observed on an official page or official documentation.
- **Independent:** Third-party review or roundup; not proof of official capability.
- **Hypothesis:** Product inference, not measured evidence.

---

## 1. Competitors (official first)

| ID | Source | Type | Date | What was verified | Limitations | Confidence |
|----|--------|------|------|-------------------|-------------|------------|
| C-01 | https://premium.linkedin.com/careers/compare-plans | Official pricing | 2026-11-20 | LinkedIn Premium Career exists; InMail and applicant insights are paid | Feature depth of Jobs product not fully enumerated on this page | High |
| C-02 | https://www.linkedin.com/help/linkedin/answer/a7474393 | Official help | 2026-11-20 | Help content for Premium Career features | Help articles lag product UI | Medium-High |
| C-03 | https://www.indeed.com/lead/how-indeed-uses-ai-to-provide-better-matching-context-for-job-seekers | Official product | 2026-11-20 | Indeed describes AI match *context* (“why you match”) for job seekers | Employer-side AI is separate; no public algorithm | High |
| C-04 | https://wellfound.com | Official product | 2026-11-20 | Startup job board; candidate use is free; founder/hiring-manager access is the pitch | Coverage is startup-centric | High |
| C-05 | https://www.levels.fyi | Official product | 2026-11-20 | Crowd-sourced compensation, levels, offer comparison, jobs board | Tech-heavy; data is community-submitted | High |
| C-06 | https://www.careerflow.ai/ | Official product | 2026-11-20 | All-in-one tracker, resume, LinkedIn, extension | Marketing claims (faster interviews) are unverified | High (features) / Low (outcome claims) |
| C-07 | https://www.careerflow.ai/premium | Official pricing | 2026-11-20 | Premium ~$23.99/mo or $172.99/yr; Premium Plus advertised | Exact free-tier numeric caps not always listed | High |
| C-08 | https://help.careerflow.ai/en/articles/10605570-free-vs-premium-access | Official help | 2026-11-20 | Free vs Premium feature split | Help copy can drift from billing | High |
| C-09 | https://jobright.ai/ | Official product | 2026-11-20 | AI copilot, matching, autofill, referrals pitch | Job-seeker pricing not published on homepage | Medium |
| C-10 | https://www.tealhq.com/ | Official product | 2026-11-20 | Resume + tracker + extension | Pricing page returned 403 during research | Medium-High |
| C-11 | https://www.tealhq.com/pricing | Official pricing | 2026-11-20 | Page not fully readable (403) | Independent sources used for Teal+ $29/30 days | Medium |
| C-12 | https://huntr.co/pricing | Official pricing | 2026-11-20 | Pro $40/mo, $90/quarter, $160/6 months; AI credits on free then gated | Free job-count reported as 100 in help/third parties | High |
| C-13 | https://huntr.co/product/job-tracker | Official product | 2026-11-20 | Kanban tracker, clipper, contacts | Not a job board | High |
| C-14 | https://simplify.jobs/copilot | Official product | 2026-11-20 | Autofill + tracker; states core autofill/tracker stay free; Autopilot is paid | Does not auto-submit on free Copilot | High |
| C-15 | https://www.jobscan.co/ | Official product | 2026-11-20 | Resume-to-JD match rate product | Limited homepage pricing | Medium |
| C-16 | https://resumeworded.com/ | Official product | 2026-11-20 | Resume scoring, AutoFix, LinkedIn review | Outcome claims (“3x interviews”) unverified | High (features) / Low (outcomes) |
| C-17 | https://www.rezi.ai/pricing | Official pricing | 2026-11-20 | Free 1 resume / 3 PDFs; Pro $29/mo; Lifetime $149 | “GPT-3” branding may be stale | High |
| C-18 | https://www.kickresume.com/ | Official product | 2026-11-20 | Templates, AI writer, ATS checker gated | Full pricing on-site varies by billing period | High |
| C-19 | https://www.finalroundai.com/ | Official product | 2026-11-20 | Live Interview CoPilot; stealth mode; practice | HireFlow will not copy live-interview assistance | High |
| C-20 | https://uk.welcometothejungle.com/ | Official product | 2026-11-20 | Curated jobs, company insights; free for seekers | EU/US focus | High |
| C-21 | https://www.glassdoor.com/index.htm | Official product | 2026-11-20 | Fetch blocked (403) during session | Company reviews/salary are known product; treat details as Medium | Medium |

## 2. Independent competitor roundups (not proof)

| ID | Source | Type | Date | Use | Limitations | Confidence |
|----|--------|------|------|-----|-------------|------------|
| I-01 | https://automatebasics.com/guides/best-ai-job-search-tools | Independent roundup | 2026-11-20 | Cross-check 2026 prices | Not official; prices lag | Medium |
| I-02 | https://www.careercrm.ai/best-ai-job-search-tools | Independent comparison | 2026-11-20 | Feature grid | Competitor site; possible bias | Medium |
| I-03 | https://tsenta.com/blog/best-free-job-application-tracker-apps-2026 | Independent | 2026-11-20 | Free tracker limits | Competitor site | Medium |
| I-04 | https://www.leepo.ai/compare/best-job-application-trackers | Independent | 2026-11-20 | Tracker comparison | Competitor site | Medium |

## 3. Job data (official)

| ID | Source | Type | Date | What was verified | Limitations | Confidence |
|----|--------|------|------|-------------------|-------------|------------|
| J-01 | https://docs.greenhouse.io/job-board.html | Official API docs | 2026-11-20 | Public GET jobs by board token; application POST needs API key | Rate limits not fully public | High |
| J-02 | https://developers.greenhouse.io/ | Official developer | 2026-11-20 | Harvest vs Job Board distinction | Partner APIs out of scope | High |
| J-03 | https://hire.lever.co/developer/documentation | Official API | 2026-11-20 | Public JSON postings per company slug | Redistribution limits need legal read before bulk republish | High |
| J-04 | https://developers.ashbyhq.com/docs/public-job-posting-api | Official API | 2026-11-20 | Public job board GET; compensation optional query | Intended for a company’s own board; aggregation ToS still apply | High |
| J-05 | https://developer.adzuna.com/docs/search | Official API | 2026-11-20 | Keyed search API; attribution; cache limits commonly 24h | Commercial production may require paid plan | High |
| J-06 | https://developer.adzuna.com/terms | Official terms | 2026-11-20 | No silent commercial redistribution | Must re-read before enabling | High |
| J-07 | https://docs.indeed.com/ | Official partner | 2026-11-20 | Indeed Publisher/partner access is not a public scrape-friendly API | **Rejected for Phase 1** without partnership | High |
| J-08 | https://developers.google.com/search/docs/appearance/structured-data/job-posting | Official Google | 2026-11-20 | JobPosting JSON-LD only on individual job pages; never listing pages; accurate dates required | Markup ≠ permission to republish third-party jobs | High |
| J-09 | USAJOBS developer materials | Official | 2026-11-20 | USAJOBS has a documented public search API used by aggregators | Enable only after current ToS snapshot | Medium-High |
| J-10 | India National Career Service (NCS) | Government | 2026-11-20 | NCS is the official India employment portal | **No confirmed public aggregation API in this pass.** Scrape fallback is forbidden. Status: pending official API confirmation | Low (API) / High (portal exists) |

## 4. Infrastructure, AI, libraries

| ID | Source | Type | Date | What was verified | Limitations | Confidence |
|----|--------|------|------|-------------------|-------------|------------|
| T-01 | https://neon.com/faqs/free-plan-limits-and-quotas | Official FAQ | 2026-11-20 (FAQ updated 2026-11-03) | Free: 100 projects, 1 GB Postgres/project, 100 CU-hours, scale-to-zero 5 min, 5 GB egress | Quotas change; compute suspends at cap | High |
| T-02 | https://neon.com/docs/extensions/pgvector | Official docs | 2026-11-20 | pgvector on every Neon plan, no add-on | HNSW tuning is operator work | High |
| T-03 | https://developers.cloudflare.com/workers/platform/limits/ | Official | 2026-11-20 | Workers Free: 100k req/day, **10 ms CPU/request**, 128 MB | Auth+SSR+PDF will not fit Free | High |
| T-04 | https://www.cloudflare.com/plans/developer-platform-pricing/ | Official pricing | 2026-11-20 | Workers Free vs Paid | Pages vs Workers packaging varies | High |
| T-05 | https://developers.cloudflare.com/r2/pricing/ | Official | 2026-11-20 | R2 free: 10 GB-month, 1M Class A, 10M Class B, no egress | Standard class only | High |
| T-06 | https://aistudio.google.com/docs/terms | Official Gemini ToS | 2026-11-20 | Unpaid Gemini: Google may use prompts/responses to improve products; human review possible. Paid: not used to improve products. EEA/UK/CH API clients must use Paid | Binding legal text; counsel should review before production | High |
| T-07 | https://aistudio.google.com/docs/pricing | Official pricing | 2026-11-20 | Free vs Paid distinction; unpaid content-use footnote | Per-model RPM/RPD are project-specific in AI Studio, not a stable public table | Medium-High |
| T-08 | https://ui.shadcn.com | Official | 2026-11-20 | Copy-paste Radix + Tailwind components | Not a hosted design system | High |
| T-09 | https://www.better-auth.com/docs | Official | 2026-11-20 | MIT auth library; email/password + OAuth; Drizzle adapters | Younger than Auth.js; still selected for TypeScript-first DX | High |
| T-10 | https://orm.drizzle.team/docs/overview | Official | 2026-11-20 | Typed SQL ORM | Migrations via drizzle-kit | High |
| T-11 | https://nextjs.org/ | Official | 2026-11-20 | Homepage: latest stable Next.js **16.4.6** | 16.5.x listed as canary on npm | High |
| T-12 | https://www.npmjs.com/package/next?activeTab=versions | Official npm | 2026-11-20 | `next@16.4.6` latest stable; 16.5.0-canary.* is canary | npm tags change | High |
| T-13 | https://github.com/vercel/next.js/releases/tag/v16.4.6 | Official GitHub | 2026-11-20 (tag 2026-11-09) | 16.4.6 LTS-active; create-next-app pins Tailwind 4.3.3 in tests | Does not prove every React 19.3 combo | High |
| T-14 | https://www.npmjs.com/package/react?activeTab=versions | Official npm | 2026-11-20 | `react@19.3.1` latest stable | Pairing with Next is inferred | High |
| T-15 | https://react.dev/blog/2026/09/09/react-19-3 | Official blog | 2026-11-20 (posted 2026-09-09) | React 19.3 stable announcement | Blog examples used canary SHAs | High |
| T-16 | https://www.npmjs.com/package/tailwindcss?activeTab=versions | Official npm | 2026-11-20 | `tailwindcss@4.3.5` is `latest` | create-next-app test pin is 4.3.3 | High |
| T-17 | https://nextjs.org/docs/app/guides/static-exports | Official docs | 2026-11-20 | `output: 'export'`; **ISR unsupported**; no cookies/redirects/rewrites/headers/Server Actions/default image optimizer | Static export is not Cloudflare-specific | High |
| T-18 | https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/ | Official CF | 2026-11-20 | Pages preset: `npx next build`, directory `out` | Full-stack Next on Pages is a different path (vinext/Workers) | High |
| T-19 | https://neon.com/docs/introduction/plans | Official | 2026-11-20 | Free: 1 GB Postgres, 100 CU-hours, 5 GB transfer, Managed Better Auth 60k MAU, Object Storage 5 GB/project | Quotas change | High |
| T-20 | https://neon.com/docs/auth/about | Official (updated 2026-11-11) | 2026-11-20 | Managed Better Auth in `neon_auth`; `@neon/auth`; AWS-only; unsupported with IP Allow / Private Networking; self-host Better Auth if you need custom plugins and own infra | Neon-specific lock-in | High |
| T-21 | https://neon.com/docs/storage/overview | Official | 2026-11-20 | Neon Object Storage S3-compatible; Free 5 GB/project; limited regions; IP Allow does not protect object requests | Egress billed via public transfer | High |
| T-22 | https://resend.com/docs/knowledge-base/account-quotas-and-limits | Official | 2026-11-20 | Free: **100 emails/day UTC** and **3,000/month**; sent+received count | Marketing contacts are a separate quota | High |
| T-23 | https://www.npmjs.com/package/docx | Official npm | 2026-11-20 | `docx` v9.x MIT; generates .docx | Separate from mammoth (parse) | High |
| T-24 | https://docx.js.org/ | Official docs | 2026-11-20 | Packer.toBuffer / toBlob for export | Not a resume parser | High |

## 5. Rejected or blocked approaches

| Approach | Why rejected | Source basis |
|----------|--------------|--------------|
| Server-side scrape of LinkedIn, Indeed, Naukri, Workday | No public aggregation API; ToS / WAF; HireFlow engineering rules | J-07, product ToS, project rules |
| Auto-submit job applications | User rule; Simplify Copilot itself previews and does not submit on free path | C-14, product rules |
| Unpaid Gemini with resumes/PII | Gemini unpaid ToS allows product improvement + human review | T-06 |
| Techmap or other paid job feed as silent default | Paid dependency without approval | Cost policy |
| NCS HTML scrape “until API exists” | Forbidden; wait for official terms | J-10 |
| JobPosting schema on search/listing pages | Google forbids it | J-08 |
| ISR on Cloudflare Pages static export | Next.js static export does not support ISR | T-17, T-18 |
| Neon Managed Better Auth as v1 default | Lock-in, AWS-only, needs Neon project; we need local PGlite | T-20 |
| Neon Object Storage as first blob store | 5 GB + egress shares DB transfer budget | T-21 vs T-05 |
| Browser extension as Phase 1/P0 blocker | Delays discovery + applications | product revision |
| Public SaaS LLM by default | Privacy + unpaid Gemini ToS | T-06 |

## 6. Product implications

1. Stack pins: Next **16.4.6**, React **19.3.1**, Tailwind **4.3.5** (T-11–T-16).
2. Marketing: `output: 'export'` → Cloudflare Pages `out/` (T-17, T-18). No ISR.
3. Auth: self-hosted Better Auth + Drizzle, not Neon Managed Auth (T-09, T-20).
4. Files: local disk, then **R2** (T-05), not Neon Object Storage (T-21).
5. Phase 2 jobs: **curated employer registry** of Greenhouse/Lever/Ashby board IDs + **URL import**. Extension save-job is **Phase 5**.
6. Email optional (T-22). In-app notifications first.
7. DOCX export via `docx` (T-23), not mammoth.
8. Job Search Intelligence is Phase 8 after source data exists.
