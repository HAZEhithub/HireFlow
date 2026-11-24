# ADR 0009 — Job Search Intelligence deferred

**Status:** Accepted  
**Date:** 2026-11-20

## Context

Market trends, skills demand, location relevance, application performance, and career recommendations require **reliable source data** plus **user pipeline data**. Inventing those statistics would violate HireFlow’s evidence rules.

## Decision

**Job Search Intelligence is Phase 8.** Do not ship trend dashboards, demand heatmaps, or “skills the market wants” charts until:

1. Curated ATS registry ingestion is live and attributed (ADR 0004).
2. Users have real application-pipeline events.
3. Sample sizes are disclosed (small-n caveats required).
4. Every number has a source and freshness.

Until then, Insights nav (if present) is an honest empty/coming-later state.

## Consequences

Phase 1–4 must not fake market stats. Matching remains per-user compatibility, not a market forecast.
