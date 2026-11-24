-- Phase 2 follow-up: persist injection flags. Applied at runtime by ensure-schema.ts.
-- Do not run destructive statements. Not applied to a paid database.

ALTER TABLE "job" ADD COLUMN IF NOT EXISTS injection_flagged boolean NOT NULL DEFAULT false;
