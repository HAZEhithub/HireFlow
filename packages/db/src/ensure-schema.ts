import { sql } from "drizzle-orm";
import type { HireFlowDb } from "./client";

async function run(db: HireFlowDb, statement: ReturnType<typeof sql>) {
  await db.execute(statement);
}

/** Idempotent DDL so PGlite and empty Neon databases boot without drizzle-kit push. */
export async function ensureSchema(db: HireFlowDb) {
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "user" (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      email_verified boolean NOT NULL DEFAULT false,
      image text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "session" (
      id text PRIMARY KEY,
      expires_at timestamptz NOT NULL,
      token text NOT NULL UNIQUE,
      ip_address text,
      user_agent text,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "account" (
      id text PRIMARY KEY,
      account_id text NOT NULL,
      provider_id text NOT NULL,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamptz,
      refresh_token_expires_at timestamptz,
      scope text,
      password text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "verification" (
      id text PRIMARY KEY,
      identifier text NOT NULL,
      value text NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "profile" (
      id text PRIMARY KEY,
      user_id text NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
      headline text,
      summary text,
      location text,
      country_code text,
      preferred_countries text[] DEFAULT '{}',
      workplace_preference text NOT NULL DEFAULT 'any',
      status text NOT NULL DEFAULT 'entry',
      desired_titles text[] DEFAULT '{}',
      industries text[] DEFAULT '{}',
      experience_level text,
      salary_min integer,
      salary_currency text NOT NULL DEFAULT 'INR',
      employment_types text[] DEFAULT '{}',
      work_authorization text,
      relocation boolean NOT NULL DEFAULT false,
      availability text,
      portfolio_url text,
      linkedin_url text,
      github_url text,
      skills text[] DEFAULT '{}',
      education jsonb DEFAULT '[]'::jsonb,
      experience jsonb DEFAULT '[]'::jsonb,
      certifications jsonb DEFAULT '[]'::jsonb,
      projects jsonb DEFAULT '[]'::jsonb,
      open_to_internships boolean NOT NULL DEFAULT false,
      open_to_international boolean NOT NULL DEFAULT false,
      completeness integer NOT NULL DEFAULT 0,
      onboarding_completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "user_settings" (
      user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      email_alerts boolean NOT NULL DEFAULT false,
      product_tips boolean NOT NULL DEFAULT true,
      theme text NOT NULL DEFAULT 'system',
      locale text NOT NULL DEFAULT 'en-IN',
      ai_external_consent boolean NOT NULL DEFAULT false,
      ai_paid_consent boolean NOT NULL DEFAULT false,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "audit_log" (
      id text PRIMARY KEY,
      user_id text REFERENCES "user"(id) ON DELETE SET NULL,
      action text NOT NULL,
      entity text,
      entity_id text,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "notification" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      type text NOT NULL,
      title text NOT NULL,
      body text,
      href text,
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE INDEX IF NOT EXISTS "notification_user_created_idx" ON "notification" (user_id, created_at DESC)`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "ai_usage" (
      id text PRIMARY KEY,
      user_id text REFERENCES "user"(id) ON DELETE CASCADE,
      feature text NOT NULL,
      provider text NOT NULL,
      model text,
      input_tokens integer,
      output_tokens integer,
      estimated_usd numeric(12,6),
      status text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "feature_flag" (
      key text PRIMARY KEY,
      enabled boolean NOT NULL DEFAULT false,
      description text
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "usage_period" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      key text NOT NULL,
      period_start timestamptz NOT NULL,
      count integer NOT NULL DEFAULT 0,
      UNIQUE (user_id, key, period_start)
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS usage_period_user_idx ON "usage_period" (user_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "usage_event" (
      id text PRIMARY KEY,
      user_id text REFERENCES "user"(id) ON DELETE CASCADE,
      kind text NOT NULL,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  const profileAlters = [
    sql`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'`,
    sql`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb`,
    sql`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '[]'::jsonb`,
    sql`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb`,
    sql`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]'::jsonb`,
    sql`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS open_to_internships boolean NOT NULL DEFAULT false`,
    sql`ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS open_to_international boolean NOT NULL DEFAULT false`,
  ];
  for (const statement of profileAlters) {
    await run(db, statement);
  }

  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "company" (
      id text PRIMARY KEY,
      name text NOT NULL,
      normalized_name text NOT NULL UNIQUE,
      website text,
      career_page_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "employer_board" (
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
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "job" (
      id text PRIMARY KEY,
      company_id text NOT NULL REFERENCES "company"(id) ON DELETE RESTRICT,
      source text NOT NULL,
      external_id text NOT NULL,
      board_id text NOT NULL DEFAULT '',
      title text NOT NULL,
      description_text text NOT NULL DEFAULT '',
      apply_url text NOT NULL,
      source_url text,
      canonical_url text,
      department text,
      workplace_type text NOT NULL DEFAULT 'unknown',
      employment_type text NOT NULL DEFAULT '',
      seniority text,
      industry text,
      city text,
      country text,
      location_text text,
      locations jsonb NOT NULL DEFAULT '[]'::jsonb,
      salary_min integer,
      salary_max integer,
      salary_currency text,
      salary_period text,
      salary_disclosure text NOT NULL DEFAULT 'not_provided',
      published_at timestamptz,
      first_seen timestamptz NOT NULL DEFAULT now(),
      last_verified timestamptz NOT NULL DEFAULT now(),
      last_provider_update timestamptz,
      last_url_check timestamptz,
      status text NOT NULL DEFAULT 'open',
      freshness_label text NOT NULL DEFAULT 'fresh',
      content_hash text NOT NULL DEFAULT '',
      fingerprint text NOT NULL DEFAULT '',
      description_fingerprint text NOT NULL DEFAULT '',
      required_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
      preferred_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
      listing_kind text NOT NULL DEFAULT 'live',
      imported_by_user_id text REFERENCES "user"(id) ON DELETE CASCADE,
      import_notes text,
      injection_flagged boolean NOT NULL DEFAULT false,
      missing_consecutive integer NOT NULL DEFAULT 0,
      apply_url_status text NOT NULL DEFAULT 'unchecked',
      raw_metadata jsonb,
      UNIQUE (source, board_id, external_id)
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_canonical_url_idx ON "job" (canonical_url)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_fingerprint_idx ON "job" (fingerprint)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_status_verified_idx ON "job" (status, last_verified)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_title_idx ON "job" (title)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_company_idx ON "job" (company_id)`);
  await run(db, sql`ALTER TABLE "job" ADD COLUMN IF NOT EXISTS injection_flagged boolean NOT NULL DEFAULT false`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_imported_by_idx ON "job" (imported_by_user_id)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_country_idx ON "job" (country)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "job_source" (
      id text PRIMARY KEY,
      job_id text NOT NULL REFERENCES "job"(id) ON DELETE CASCADE,
      adapter text NOT NULL,
      board_id text NOT NULL DEFAULT '',
      external_id text NOT NULL,
      source_url text,
      apply_url text,
      last_seen timestamptz NOT NULL DEFAULT now(),
      UNIQUE (adapter, board_id, external_id)
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_source_job_idx ON "job_source" (job_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "job_source_run" (
      id text PRIMARY KEY,
      adapter text NOT NULL,
      board_id text NOT NULL DEFAULT '',
      started_at timestamptz NOT NULL DEFAULT now(),
      finished_at timestamptz,
      jobs_discovered integer NOT NULL DEFAULT 0,
      jobs_inserted integer NOT NULL DEFAULT 0,
      jobs_updated integer NOT NULL DEFAULT 0,
      jobs_ignored integer NOT NULL DEFAULT 0,
      error_count integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'running',
      error_summary text
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "job_verification_signal" (
      id text PRIMARY KEY,
      job_id text NOT NULL REFERENCES "job"(id) ON DELETE CASCADE,
      kind text NOT NULL,
      message text NOT NULL,
      evidence text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS job_verification_job_idx ON "job_verification_signal" (job_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "job_skill" (
      id text PRIMARY KEY,
      job_id text NOT NULL REFERENCES "job"(id) ON DELETE CASCADE,
      skill text NOT NULL,
      kind text NOT NULL,
      UNIQUE (job_id, skill, kind)
    )`,
  );
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "saved_job" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      job_id text NOT NULL REFERENCES "job"(id) ON DELETE RESTRICT,
      notes text,
      saved_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, job_id)
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS saved_job_user_idx ON "saved_job" (user_id)`);

  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "resume" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      title text NOT NULL,
      origin_kind text NOT NULL DEFAULT 'created',
      template_id text NOT NULL DEFAULT 'professional-classic',
      source_document_id text,
      original_version_id text,
      current_version_id text,
      parent_resume_id text,
      target_job_id text REFERENCES "job"(id) ON DELETE SET NULL,
      confirmed_at timestamptz,
      deleted_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_user_idx ON "resume" (user_id)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_parent_idx ON "resume" (parent_resume_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "resume_version" (
      id text PRIMARY KEY,
      resume_id text NOT NULL REFERENCES "resume"(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      version_number integer NOT NULL,
      notes text,
      template_id text NOT NULL DEFAULT 'professional-classic',
      content jsonb NOT NULL,
      is_original boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (resume_id, version_number)
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_version_user_idx ON "resume_version" (user_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "resume_document" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      resume_id text REFERENCES "resume"(id) ON DELETE SET NULL,
      kind text NOT NULL,
      original_filename text NOT NULL,
      mime_type text NOT NULL,
      byte_size integer NOT NULL,
      storage_key text NOT NULL,
      sha256 text NOT NULL,
      parse_status text,
      parse_result jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_document_user_idx ON "resume_document" (user_id)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_document_resume_idx ON "resume_document" (resume_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "resume_analysis" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      resume_id text NOT NULL REFERENCES "resume"(id) ON DELETE CASCADE,
      version_id text NOT NULL REFERENCES "resume_version"(id) ON DELETE CASCADE,
      completeness integer NOT NULL,
      score_definition text NOT NULL,
      findings jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_analysis_resume_idx ON "resume_analysis" (resume_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "resume_job_match" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      resume_id text NOT NULL REFERENCES "resume"(id) ON DELETE CASCADE,
      version_id text NOT NULL REFERENCES "resume_version"(id) ON DELETE CASCADE,
      job_id text NOT NULL REFERENCES "job"(id) ON DELETE CASCADE,
      overall integer,
      breakdown jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_job_match_user_job_idx ON "resume_job_match" (user_id, job_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "resume_tailoring_session" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      resume_id text NOT NULL REFERENCES "resume"(id) ON DELETE CASCADE,
      source_version_id text NOT NULL REFERENCES "resume_version"(id) ON DELETE CASCADE,
      job_id text NOT NULL REFERENCES "job"(id) ON DELETE CASCADE,
      suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
      decisions jsonb NOT NULL DEFAULT '{}'::jsonb,
      result_resume_id text REFERENCES "resume"(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_tailoring_user_idx ON "resume_tailoring_session" (user_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "resume_export" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      resume_id text NOT NULL REFERENCES "resume"(id) ON DELETE CASCADE,
      version_id text NOT NULL REFERENCES "resume_version"(id) ON DELETE CASCADE,
      document_id text NOT NULL REFERENCES "resume_document"(id) ON DELETE CASCADE,
      format text NOT NULL,
      template_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS resume_export_user_idx ON "resume_export" (user_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "application" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      job_id text REFERENCES "job"(id) ON DELETE SET NULL,
      company_name text NOT NULL,
      title text NOT NULL,
      stage text NOT NULL DEFAULT 'saved',
      source text NOT NULL DEFAULT 'manual',
      resume_version_id text REFERENCES "resume_version"(id) ON DELETE SET NULL,
      notes text,
      apply_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS application_user_idx ON "application" (user_id)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS application_user_stage_idx ON "application" (user_id, stage)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS application_job_idx ON "application" (job_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "application_event" (
      id text PRIMARY KEY,
      application_id text NOT NULL REFERENCES "application"(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      from_stage text,
      to_stage text NOT NULL,
      at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS application_event_application_idx ON "application_event" (application_id)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS application_event_user_idx ON "application_event" (user_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "follow_up" (
      id text PRIMARY KEY,
      application_id text NOT NULL REFERENCES "application"(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      title text NOT NULL DEFAULT 'Follow up',
      body text,
      due_at timestamptz NOT NULL,
      done_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS follow_up_application_idx ON "follow_up" (application_id)`);
  await run(db, sql`CREATE INDEX IF NOT EXISTS follow_up_user_idx ON "follow_up" (user_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "career_evidence" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      kind text NOT NULL,
      title text NOT NULL,
      body text,
      url text,
      quoted_as text NOT NULL DEFAULT 'user-provided',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS career_evidence_user_idx ON "career_evidence" (user_id)`);
  await run(
    db,
    sql`CREATE TABLE IF NOT EXISTS "application_pack_item" (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      application_id text NOT NULL REFERENCES "application"(id) ON DELETE CASCADE,
      slot text NOT NULL,
      body text NOT NULL,
      source text NOT NULL DEFAULT 'user_paste',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (application_id, slot)
    )`,
  );
  await run(db, sql`CREATE INDEX IF NOT EXISTS application_pack_item_user_idx ON "application_pack_item" (user_id)`);
}
