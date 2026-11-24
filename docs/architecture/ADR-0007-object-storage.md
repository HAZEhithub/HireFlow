# ADR 0007 — Object storage (local, then R2)

**Status:** Accepted  
**Date:** 2026-11-20

## Context

Resumes and generated documents need private object storage. Two cloud options were compared on 2026-11-20 from official docs.

| | Cloudflare R2 Standard | Neon Object Storage |
|---|---|---|
| Docs | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) | [overview](https://neon.com/docs/storage/overview), [plans](https://neon.com/docs/introduction/plans) |
| Free | 10 GB-month, 1M Class A, 10M Class B, **egress free** | 5 GB/project |
| Paid | Class A/B after free | $0.023/GB-month |
| Egress | Free | Counts toward **5 GB public network transfer**, shared with Postgres |
| Auth | S3 credentials (failed auth not billed) | S3-compatible; IP Allow does **not** protect object requests |
| Other | Fits Cloudflare Pages marketing | Limited regions; branches with the project |

## Decision

1. **Phase 1:** local disk under `.data/uploads` (private, gitignored).
2. **First cloud store: Cloudflare R2 (Standard).** Private bucket, signed GET, no public listing.
3. **Neon Object Storage is rejected for v1.** Resume downloads must not burn Neon’s 5 GB transfer cap (shared with the database). Marketing already targets Cloudflare.
4. **Exit:** S3 API; copy objects out.
5. Magic-byte + size limits remain in the API regardless of backend.

No R2 account is provisioned until the user explicitly approves it.

## Consequences

Storage adapter is S3-shaped so R2 can replace local disk later. Do not couple file URLs to Neon project branches.
