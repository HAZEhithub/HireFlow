# Schema v1

**Status:** Accepted for implementation  
**Date:** 2026-11-20

Phase 1 ships **identity + profile + settings + in-app notifications + usage**. Later groups are specified so names stay stable. Types: UUID PKs, `timestamptz`, `user_id` on every owned row.

Engine: PostgreSQL. pgvector when available.

---

## Phase 1 (ship now)

### identity

**user** (Better Auth)

- `id` uuid pk
- `name` text not null
- `email` text unique not null
- `email_verified` boolean not null default false
- `image` text
- `created_at`, `updated_at` timestamptz

**session**, **account**, **verification** — Better Auth tables (see library schema). Do not fork column names.

### career profile

**profile**

- `id` uuid pk
- `user_id` uuid unique not null → user
- `headline` text
- `summary` text
- `location` text
- `country_code` char(2)
- `preferred_countries` text[] default '{}'
- `workplace_preference` text check in (`remote`,`hybrid`,`onsite`,`any`) default `any`
- `status` text check in (`student`,`internship`,`entry`,`experienced`,`career_change`,`returning`) default `entry`
- `desired_titles` text[] default '{}'
- `industries` text[] default '{}'
- `experience_level` text
- `salary_min` integer
- `salary_currency` char(3) default `INR`
- `employment_types` text[] default '{}'  -- full_time, internship, contract, ...
- `work_authorization` text  -- user-stated; never inferred as verified
- `relocation` boolean
- `availability` text
- `portfolio_url` text
- `linkedin_url` text
- `github_url` text
- `skills` text[] default '{}'
- `education` jsonb default '[]'  -- `{ label }` lines; incremental
- `experience` jsonb default '[]'
- `certifications` jsonb default '[]'
- `projects` jsonb default '[]'
- `open_to_internships` boolean default false
- `open_to_international` boolean default false
- `completeness` integer not null default 0
- `onboarding_completed_at` timestamptz
- `created_at`, `updated_at`

**user_settings**

- `user_id` pk → user
- `email_alerts` boolean default false  -- email is optional; in-app is the default channel
- `product_tips` boolean default true
- `theme` text default `system`
- `locale` text default `en-IN`
- `ai_external_consent` boolean default false
- `ai_paid_consent` boolean default false
- `updated_at`

**notification** (in-app inbox; ADR 0008)

- `id` uuid pk
- `user_id` uuid not null → user
- `type` text not null  -- system, product, job_alert, follow_up (Phase 2+)
- `title` text not null
- `body` text
- `href` text
- `read_at` timestamptz
- `created_at` timestamptz not null

Empty inbox is valid. No email row is required for a notification to exist.

**audit_log**

- `id` uuid
- `user_id` uuid null
- `action` text not null
- `entity` text
- `entity_id` text
- `metadata` jsonb
- `created_at`

**ai_usage**

- `id` uuid
- `user_id` uuid
- `feature` text
- `provider` text
- `model` text
- `input_tokens` integer
- `output_tokens` integer
- `estimated_usd` numeric(12,6)
- `status` text
- `created_at`

**feature_flag**

- `key` text pk
- `enabled` boolean
- `description` text

**usage_event** (request/auth/api counters; no prompt bodies)

- `id` text pk
- `user_id` uuid null → user
- `kind` text not null  -- auth | api | ai
- `name` text not null
- `created_at` timestamptz

Indexes: `user.email`, `profile.user_id`, `ai_usage (user_id, created_at)`, `notification (user_id, created_at)`, `usage_event (user_id, created_at)`.

No `subscription` table in Phase 1. Billing is not live; `resolvePlan` always returns Free.

---

## Phase 2 (implemented)

DDL is created idempotently in `packages/db/src/ensure-schema.ts` (PGlite-safe). No destructive migration.

**company** — id, name, normalized_name unique, website, career_page_url  
**employer_board** — adapter, board_identifier, employer display/career URLs, countries, active, last_reviewed, ingest health  
**job** — company_id, source, external_id, board_id, title, description_text, apply/source/canonical URLs, workplace/employment, location fields, salary + `salary_disclosure`, published_at, first_seen, last_verified, last_provider_update, status, freshness_label, hashes, skills jsonb, listing_kind (`live|fixture|user_import`), imported_by_user_id, missing_consecutive  
**job_source** — one job, many provider records; unique (adapter, board_id, external_id)  
**job_source_run** — ingest statistics per board  
**job_verification_signal** — cautionary messages (fixture label, probable duplicate). Not fraud accusations.  
**job_skill** — required/preferred rows  
**saved_job** — unique (user_id, job_id), notes, saved_at. Jobs are not deleted when a source expires.

**job_alert** and persisted **match_result** remain Phase 2+ / Phase 3. Matching is computed at read time from profile + job fields.  

**resume**, **resume_version**, **resume_document**, **resume_analysis**, **resume_job_match**, **resume_tailoring_session**, **resume_export** — implemented in Phase 3. Content is JSONB on `resume_version` (not a separate section table). Files are stored privately; `storage_key` is never returned to clients.

**application** — implemented: user_id, job_id null, company_name, title, stage (`saved|preparing|applied|interview|offer|rejected|withdrawn`), source, resume_version_id, notes, apply_url  
**application_event** — application_id, user_id, from_stage, to_stage, at  
**follow_up** — application_id, user_id, title, body, due_at, done_at  
**career_evidence** — user_id, kind, title, body, url, quoted_as (`user-provided`)  
**application_pack_item** — user_id, application_id, slot, body, source (`user_paste`)  

Ownership: all user rows cascade delete with the user.

---

## Isolation

Application code **must** add `eq(table.userId, session.user.id)` on reads/writes. Do not rely on UUID secrecy.
