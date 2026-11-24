# Job discovery architecture (Phase 2)

**Status:** Implemented in-repo  
**Date:** 2026-11-21  
**Paid services:** none  
**AI:** not required  

HireFlow discovery is a curated employer-board ingest plus user URL import. There is no global ATS search API. Empty registry is valid.

## Canonical job

Stored on `job` with company ownership on `company`. A job may have multiple `job_source` rows. User imports set `source = user_import`, `listing_kind = user_import`, and `imported_by_user_id`. Other users cannot see another user’s imports.

Fields that the provider omitted stay empty. Salary uses `salary_disclosure`: `not_provided` | `not_applicable` | `unknown` | `disclosed`.

## Providers (official docs retrieved 2026-11-21)

| Adapter | Documentation | Endpoint |
| --- | --- | --- |
| Greenhouse | https://docs.greenhouse.io/job-board.html | `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true` |
| Lever | https://github.com/lever/postings-api | `GET https://api.lever.co/v0/postings/{SITE}?mode=json&skip=&limit=` |
| Ashby | https://developers.ashbyhq.com/docs/public-job-posting-api | `GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}?includeCompensation=true` |

HireFlow links out to `applyUrl`. It does not POST applications.

**Verified production employer boards configured:** 0. Identifiers are added only after ops confirms the board token against the employer career page. Test fixtures use synthetic `hireflow-fixture-*` tokens and must be labeled as development samples.

## Freshness

Publication date, first discovered, and last retrieved are stored separately. An old posting discovered today is not labeled as newly posted.

- Fresh: retrieved in the last 24 hours and first seen within 3 days (unless publication date is older than 14 days).
- Recently checked: last successful retrieval within 7 days.
- Stale: last successful retrieval older than 7 days.
- Source error: last provider request failed. One failure is not expiry.
- Expired: omitted from the provider on **two** consecutive ingestions.
- Unavailable: later apply-URL check failed.

“Retrieved from the employer board” is not independent employer verification. A failed provider fetch sets `source_error` on that board’s live jobs without incrementing miss counts. Re-ingest freshness uses the stored `firstSeen`, not the current run time.

## Deduplication

Deterministic, no vector DB, no LLM:

1. Provider + board + external id.
2. Canonical apply URL (query string stripped), **only among merge-compatible listing kinds**.
3. Normalized company + title + location/workplace fingerprint.
4. Same company + similar title + different location → **distinct openings**.
5. Same company + matching description prefix + different title → **probable** (recorded as a signal, not auto-merged).
6. Seniority tokens stay in the title fingerprint so “Senior Engineer” and “Junior Engineer” are not exact duplicates.

`user_import` rows never merge with `live`/`fixture` rows or with another user’s import. The same apply URL can exist as a private import per user and as a public board listing. Saved lists reuse `jobVisibleToUser`. Import notes are returned only for the owner’s `user_import` rows.

## Search

PGlite-compatible `ILIKE` / `LOWER(text)` filters. PostgreSQL `tsvector` is not used so local PGlite keeps working. Filters change the SQL `WHERE` clause: keywords, title, company, skill, country, city, workplace, employment, seniority, industry, department, disclosed salary range, posted-after, sort (`relevance` currently last-verified, `recently_posted`, `recently_verified` labeled **Recently retrieved**). Skill `OR` is parenthesized so it cannot bypass visibility or `status = open`. User `%` / `_` wildcards are stripped.

## Matching

`packages/matching` deterministic overlap. Weights: skills 40%, title 25%, location 15%, workplace 10%, employment 10%. If the profile has no skills and no desired titles, HireFlow shows “needs more profile” instead of a score. The score is not a hire probability. Semantic matching remains Phase 3.

## Import and SSRF

Manual paste of an apply URL always works, including Naukri/LinkedIn/Indeed/Workday **bookmarks** with title and description filled in. Server-side **fetch** of those hosts is still forbidden. Optional title extraction is limited to `boards.greenhouse.io`, `job-boards.greenhouse.io`, `jobs.lever.co`, `jobs.ashbyhq.com`. Blocked on every URL: localhost, private IPv4 (including decimal/short forms), link-local, IPv6 unique-local/loopback/unspecified, credentialed URLs, non-http(s). Collection-host fetch, unsafe redirects, responses over 256 KiB, and timeouts over 5s are blocked. HTML is converted to text and never executed.

Greenhouse Job Board `updated_at` is stored as `lastProviderUpdate` only. `publishedAt` stays empty unless the provider supplies a publication/created field. Cards say “Employer last updated” in that case, never “newly posted” from an edit timestamp.

Apply URLs from adapters and persist must be public `http:`/`https:`. `javascript:` and `data:` URLs are dropped. Import is rate-limited by authenticated user id (20/hour) on both the Hono API and the Next.js action. Descriptions that match injection phrases are stored with `injection_flagged` and a trust signal; they are still not sent to an LLM in Phase 2.

## Ingestion operations

```bash
pnpm --filter @hireflow/workers ingest -- --fixtures
```

`--fixtures` loads labeled development samples. Live boards require rows in `employer_board` or verified `EMPLOYER_REGISTRY` entries.

Admin HTTP:

- `POST /v1/admin/jobs/ingest`
- `GET /v1/admin/jobs/runs`
- `POST /v1/admin/jobs/boards`
- `POST /v1/admin/jobs/boards/:id/active`

Authorization is `ADMIN_USER_IDS` of existing accounts, or `ADMIN_EMAILS` **only when `email_verified` is true on the user row**. Unverified password signups cannot claim an admin email. Ordinary users receive 403. Empty allow-lists fail closed. No public ingest endpoint. Prefer `ADMIN_USER_IDS`.

## User APIs

Authenticated session required:

- `GET /v1/jobs`
- `GET /v1/jobs/filters`
- `GET /v1/jobs/:id`
- `GET /v1/jobs/saved`
- `POST /v1/jobs/:id/save`
- `DELETE /v1/jobs/:id/save`
- `POST /v1/jobs/import`

The Next.js app talks to `@hireflow/jobs` directly (PGlite cannot be shared via cookies across ports 3000 and 3001). The Hono API exposes the same domain for clients that send the session cookie to the API origin.

## Testing

Adapter tests use official-shaped fixtures and injected `fetch`. They do not call live third-party APIs. Dedup, freshness, SSRF, search parsing, matching, and API isolation tests live next to the code.
