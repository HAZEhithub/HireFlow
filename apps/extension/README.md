# HireFlow browser extension

**Phase 5 stub.** This package is not on the Phase 1–4 critical path.

First job discovery (Phase 2) uses a curated ATS employer registry plus **in-app URL import**. Save-job from a page you already opened ships here later so it cannot block Discover or Applications.

- Optional host permissions only; never `<all_urls>` by default
- Visible listing text + URL only
- Never auto-submit applications
- `pnpm build` in this package is a no-op so the monorepo build is not blocked
