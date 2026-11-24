---
disable-model-invocation: false
name: hireflow-release-readiness
description: Verify a HireFlow change or release against functionality, tests, security, accessibility, SEO, cost and operational readiness. The main Agent should select this skill automatically when relevant; manual invocation is not required.
---
# HireFlow Release Readiness

1. List the requirements and changes in scope.
2. Inspect Git diff and project scripts; do not alter Git history.
3. Run targeted tests, type checks, lint and build commands that exist.
4. Verify critical user journeys and authorization boundaries.
5. Review security, privacy, AI provider failure/cost limits and integration permissions.
6. For marketing pages, inspect metadata, indexability, canonical URLs, sitemap, structured-data eligibility, mobile layout and accessibility.
7. Check migrations/backups/rollback only where relevant; do not execute destructive operations.
8. Record exact checks and pass/fail/skipped status.
9. Report blockers and residual risks; do not equate passing CI with production readiness.