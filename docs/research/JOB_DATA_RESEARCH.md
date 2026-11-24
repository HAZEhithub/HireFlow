# Job Data Research

**Project:** HireFlow  
**Date accessed:** 2026-11-20  
**Last revised:** 2026-11-21  
**Source type:** Official ATS/API documentation  
**Confidence:** High for Greenhouse, Lever, Ashby, Google JobPosting, Indeed partner-only; Low for India NCS API availability  

Sources: [SOURCE_REGISTER.md](SOURCE_REGISTER.md) J-01–J-10.

---

## Decision

Phase 2 ingestion is **provider-independent adapters** plus a **versioned in-repo employer registry**. Greenhouse, Lever, and Ashby public APIs are **per-employer** (`board_token` / company slug / job-board name). There is **no global search API**.

No HTML scraping of LinkedIn, Indeed, Naukri, Workday, or NCS.

**Phase 2 first discovery:** curated registry (India + remote-first employers first) + **direct URL import** (paste apply URL + title/company/description, `source=user_import`). Browser extension save-job **slips to Phase 5** so it cannot block Discover + Applications.

Every stored job must include: provider, external id, canonical apply URL, first_seen, last_verified, status (open/expired/removed), raw payload reference.

---

## Approved Phase 2 sources

### Greenhouse Job Board API

- **URL:** https://docs.greenhouse.io/job-board.html
- **Type:** Official docs | **Date:** 2026-11-21 | **Confidence:** High
- **Access:** `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true` — unauthenticated for public boards
- **Findings:** JSON jobs; `content=true` adds HTML description; `absolute_url` is the apply/career link. Application **POST** requires a Job Board API key — HireFlow will **link out**, not post applications.
- **Limitations:** **Per-board token only.** Rate limits not fully documented — conservative polling + backoff required. Ops maintains YAML/JSON `{ adapter, boardId, displayName, countries[], careerUrl, lastReviewed, termsNote }`.
- **Implications:** Primary adapter. Attribution: employer + Greenhouse.

### Lever Postings API

- **URL:** https://github.com/lever/postings-api (retrieved 2026-11-21; hire.lever.co/developer/documentation also referenced)
- **Type:** Official | **Date:** 2026-11-21 | **Confidence:** High
- **Access:** `GET https://api.lever.co/v0/postings/{SITE}?mode=json&skip=&limit=`
- **Findings:** Public postings JSON per company slug.
- **Limitations:** Developer terms restrict redistribution — store for matching/display with source link; legal re-read before bulk SEO republication.
- **Implications:** Second adapter. Link to `hostedUrl` / apply URL.

### Ashby Public Job Posting API

- **URL:** https://developers.ashbyhq.com/docs/public-job-posting-api
- **Type:** Official | **Date:** 2026-11-21 | **Confidence:** High
- **Access:** `GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}?includeCompensation=true`
- **Findings:** Published jobs with location, workplace type (OnSite/Remote/Hybrid), employment type, jobUrl, applyUrl, HTML+text description. Compensation only when query flag set.
- **Limitations:** Documented for an organization’s own careers page. Aggregating many boards: stay inside reasonable use; no circumvention of auth.
- **Implications:** Third adapter. Good remote/hybrid enums for India+intl filters.

### User-imported jobs

- **Type:** User-provided | **Confidence:** High (policy)
- **Access (Phase 2):** User pastes apply URL + title/company/description in-app.
- **Access (Phase 5):** Optional extension sends **visible text + URL** from a page the user already opened. Extension is **not** required for first discovery.
- **Findings:** This is how Naukri/LinkedIn/Indeed listings enter HireFlow **without server scrape**.
- **Limitations:** Quality varies; must mark `source=user_import`; no JobPosting SEO for these unless republication is allowed (default: no).
- **Implications:** URL import ships with first discovery. Extension is a later convenience.

---

## Pending (not Phase 2)

| Source | Status | Why |
|--------|--------|-----|
| USAJOBS API | Pending ToS snapshot | Official US federal jobs; enable only after current terms |
| India NCS | **No confirmed public aggregation API** | Portal exists; scrape forbidden; revisit if government publishes a feed |
| Adzuna | Pending commercial + cache-limit review | Attribution and 24h cache clauses typical; may require paid key |
| Schema.org JobPosting harvest | Pending | Reading JSON-LD from a URL the **user** submitted is OK; crawling the web is not Phase 2 |
| Indeed Publisher | Rejected until partnership | J-07 |
| LinkedIn / Naukri / Workday HTML | **Rejected** | No public board API for aggregators |

Paid silent dependencies (e.g. Techmap) are **not** defaults.

---

## Architecture requirements

1. One adapter interface: `listBoards()`, `fetchJobs(board)`, `normalize(raw) → CanonicalJob`.
2. Schedule + backoff + source health.
3. Dedup: exact apply URL; then title+company+location fingerprint; conservative merge.
4. Disappearance from feed → `status=removed` (do not keep showing as open).
5. Rank: freshness, location fit, match, trust — never unranked dumps.
6. Google JobPosting markup **only** on HireFlow job-detail pages we are allowed to republish, with accurate `datePosted` / `validThrough`. Never on search pages ([Google JobPosting](https://developers.google.com/search/docs/appearance/structured-data/job-posting)).

---

## India coverage without Naukri

Hypothesis (labeled): a curated set of Greenhouse/Lever/Ashby tokens for employers hiring in IN, plus remote-global roles, plus **in-app URL import**, is enough for an honest v1. Volume will be lower than Naukri. Product copy must say so. Extension clipping is extra, not the coverage plan.

---

## Limitations

- **There is no Greenhouse/Lever/Ashby global job search.** Coverage equals the registry size plus URL imports.
- Board-token discovery is manual/ops, not a scrape of “all Greenhouse customers.”
- Compensation presence is uneven (Ashby flag; Greenhouse custom fields).
- Terms can change; adapters must be kill-switchable via feature flags.
