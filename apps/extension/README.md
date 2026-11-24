# HireFlow browser extension

Clips the **visible tab title and URL** (`activeTab` only). It does not scrape in the background, request `<all_urls>`, or submit applications.

Load unpacked after `pnpm --filter @hireflow/extension build:ext`. Open a job page, click the extension, then **Import in HireFlow** (opens `/jobs/import` with query params) or copy the text.

`pnpm build` in this package stays a no-op so the monorepo production build is not blocked by WXT.
