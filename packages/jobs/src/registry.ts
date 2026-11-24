import type { EmployerBoard } from "./types";

/**
 * Production employer registry. Empty until ops verifies a board identifier
 * against the employer career page. Do not invent tokens.
 *
 * Retrieval notes (2026-11-21):
 * - Greenhouse Job Board API: https://docs.greenhouse.io/job-board.html
 *   GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 * - Lever Postings API: https://github.com/lever/postings-api
 *   GET https://api.lever.co/v0/postings/{SITE}?mode=json
 * - Ashby Public Job Posting API: https://developers.ashbyhq.com/docs/public-job-posting-api
 *   GET https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}?includeCompensation=true
 */
export const EMPLOYER_REGISTRY: EmployerBoard[] = [];

export const PROVIDER_DOCS = {
  greenhouse: {
    name: "Greenhouse Job Board API",
    url: "https://docs.greenhouse.io/job-board.html",
    endpoint: "https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true",
    retrievedAt: "2026-11-21",
    notes:
      "Unauthenticated GET. content=true includes HTML job content. Do not POST applications from HireFlow.",
  },
  lever: {
    name: "Lever Postings API",
    url: "https://github.com/lever/postings-api",
    endpoint: "https://api.lever.co/v0/postings/{SITE}?mode=json&skip=&limit=",
    retrievedAt: "2026-11-21",
    notes: "Public v0 JSON. Paginate with skip/limit. Hosted and apply URLs are supplied by Lever.",
  },
  ashby: {
    name: "Ashby Public Job Posting API",
    url: "https://developers.ashbyhq.com/docs/public-job-posting-api",
    endpoint: "https://api.ashbyhq.com/posting-api/job-board/{JOB_BOARD_NAME}?includeCompensation=true",
    retrievedAt: "2026-11-21",
    notes: "Filter isListed===false. Compensation is included only when the employer published it.",
  },
} as const;
