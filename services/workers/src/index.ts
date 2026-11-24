import { EMPLOYER_REGISTRY, PHASE2_ADAPTERS } from "@hireflow/jobs";

console.log(
  "HireFlow workers idle. Phase 2 adapters:",
  PHASE2_ADAPTERS.join(", "),
  `— curated registry size ${EMPLOYER_REGISTRY.length} (empty until ops verifies boards).`,
  "Run `pnpm --filter @hireflow/workers ingest -- --fixtures` for local samples. URL import is in-app. No scrape, no paid feed unless approved.",
);
