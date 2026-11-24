-- Phase 2 job discovery. Applied at runtime by ensure-schema.ts (PGlite-safe).
-- Do not run destructive statements. Not applied to a paid database.

CREATE TABLE IF NOT EXISTS "company" (
  id text PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE,
  website text,
  career_page_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "employer_board" (
  id text PRIMARY KEY,
  adapter text NOT NULL,
  board_identifier text NOT NULL,
  employer_display_name text NOT NULL,
  employer_website text,
  career_page_url text,
  supported_countries jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  date_added timestamptz NOT NULL DEFAULT now(),
  last_reviewed timestamptz,
  source_documentation_url text,
  terms_notes text,
  last_ingest_at timestamptz,
  last_ingest_status text,
  UNIQUE (adapter, board_identifier)
);
