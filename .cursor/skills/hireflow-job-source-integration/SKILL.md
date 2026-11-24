---
disable-model-invocation: false
name: hireflow-job-source-integration
description: Evaluate and integrate permitted job data sources into HireFlow with source attribution, normalization, freshness and duplicate protection. The main Agent should select this skill automatically when relevant; manual invocation is not required.
---
# HireFlow Job Source Integration

1. Identify official API/feed and source owner; read terms, licensing, robots and attribution rules.
2. Confirm permitted collection, storage, display and indexing behavior before coding.
3. Document fields, pagination, authentication, quotas, refresh windows and failure modes.
4. Implement a source adapter; keep provider data out of core domain logic.
5. Normalize fields and retain source URL/ID, collected time, published time, last verification and expiry/status.
6. Add idempotent ingestion, throttling, retries/backoff, monitoring and safe partial failure.
7. Add conservative deduplication with false-positive tests.
8. Clearly distinguish unverified listings and automated risk indicators.
9. Test stale, expired, duplicate, malformed and rate-limited responses.

Never bypass access controls or source restrictions; never fabricate active jobs.