# ADR 0004 — Job ingestion

**Status:** Accepted  
**Date:** 2026-11-20  
**Revised:** 2026-11-20 (curated employer registry; URL import in first discovery; extension Phase 5)

## Context

Greenhouse, Lever, and Ashby public APIs are **per-employer** (`board_token` / company slug / job-board name). There is **no global search API**.

## Decision

Adapters in `packages/jobs`:

1. Greenhouse public Job Board API  
2. Lever public postings API  
3. Ashby public job-board API  
4. `user_import` — **direct URL import in the first discovery release** (paste apply URL + title/company/description). Mark `source=user_import`.

**Curated employer registry** (versioned YAML/JSON in-repo): `{ adapter, boardId, displayName, countries[], careerUrl, lastReviewed, termsNote }`. Ops adds boards manually. India + remote-first employers first.

**Browser extension save-job slips to Phase 5** so it cannot block Discover + Applications.

**Forbidden:** scraping LinkedIn, Indeed, Naukri, Workday, NCS HTML; paid feeds without approval; treating ATS APIs as a global search.

Canonical job fields: title, company, locations, employment type, workplace type, description text/html, apply URL, source, external id, first_seen, last_verified, status.

Dedup: apply URL, then fingerprint(title, company, location). Conservative. User imports stay owner-scoped and do not collapse onto board listings.

Removed from source feed → `status = removed`. Do not show as open.

JobPosting JSON-LD only on permitted individual detail pages (Phase 2+), never listings.

Phase 1: schema stubs + empty Discover state. No live ingestion until Phase 2.

Phase 2 (2026-11-21): adapters, empty verified registry, fixture ingest, URL import with SSRF controls, search/save/expiry, deterministic matching. Production `EMPLOYER_REGISTRY` stays empty until board identifiers are verified.

## Consequences

Coverage equals registry size plus user imports — thinner than Naukri/Indeed, and product copy must say so. Extension is a convenience, not the ingestion plan.
