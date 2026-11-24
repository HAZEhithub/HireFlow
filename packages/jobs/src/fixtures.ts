import { mapAshbyJob } from "./adapters/ashby";
import { mapGreenhouseJob } from "./adapters/greenhouse";
import { mapLeverJob } from "./adapters/lever";
import type { CanonicalJob } from "./types";

/**
 * Test and local-demo fixtures. These are not live openings and must be labeled
 * as development samples. Board identifiers are synthetic and not claimed as
 * real employer tokens.
 */
export const FIXTURE_GREENHOUSE_PAYLOAD = {
  jobs: [
    {
      id: 90001,
      internal_job_id: 70001,
      title: "Software Engineering Intern",
      updated_at: "2026-10-01T09:00:00.000Z",
      location: { name: "Bengaluru, India" },
      absolute_url: "https://boards.greenhouse.io/hireflow-fixture-greenhouse/jobs/90001",
      content:
        "<p>Build TypeScript services. Required: TypeScript, PostgreSQL. Preferred: React.</p>",
      departments: [{ id: 1, name: "Engineering" }],
      offices: [{ id: 1, name: "Bengaluru", location: "Bengaluru, India" }],
    },
    {
      id: 90002,
      title: "",
      absolute_url: "https://boards.greenhouse.io/hireflow-fixture-greenhouse/jobs/90002",
    },
  ],
};

export const FIXTURE_LEVER_PAYLOAD = [
  {
    id: "lever-fixture-1",
    text: "Backend Engineer",
    categories: {
      location: "Remote",
      commitment: "Full-time",
      team: "Engineering",
      department: "Engineering",
      allLocations: ["Remote"],
    },
    descriptionPlain: "Work on APIs with Go and PostgreSQL. Required: Go, SQL.",
    hostedUrl: "https://jobs.lever.co/hireflow-fixture-lever/lever-fixture-1",
    applyUrl: "https://jobs.lever.co/hireflow-fixture-lever/lever-fixture-1/apply",
    createdAt: 1_720_000_000_000,
    workplaceType: "remote",
    salaryRange: { min: 1200000, max: 1800000, currency: "INR", interval: "year" },
  },
];

export const FIXTURE_ASHBY_PAYLOAD = {
  jobs: [
    {
      id: "ashby-fixture-1",
      title: "Product Designer",
      location: "Mumbai, India",
      department: "Design",
      employmentType: "FullTime",
      workplaceType: "Hybrid",
      isListed: true,
      publishedAt: "2026-09-15T00:00:00.000Z",
      jobUrl: "https://jobs.ashbyhq.com/hireflow-fixture-ashby/ashby-fixture-1",
      applyUrl: "https://jobs.ashbyhq.com/hireflow-fixture-ashby/ashby-fixture-1/application",
      descriptionPlain: "Design career products. Required: Figma. Preferred: Product Management.",
      compensation: {
        compensationTiers: [
          {
            components: [{ minValue: 1800000, maxValue: 2400000, currencyCode: "INR", interval: "year" }],
          },
        ],
      },
    },
    {
      id: "ashby-unlisted",
      title: "Hidden Role",
      isListed: false,
      applyUrl: "https://jobs.ashbyhq.com/hireflow-fixture-ashby/hidden",
    },
  ],
};

export function fixtureJobs(now = new Date()): CanonicalJob[] {
  const greenhouse = (FIXTURE_GREENHOUSE_PAYLOAD.jobs
    .map((row) =>
      mapGreenhouseJob(row, "hireflow-fixture-greenhouse", now, "HireFlow Fixture Labs", "fixture"),
    )
    .filter(Boolean) as CanonicalJob[]);
  const lever = (FIXTURE_LEVER_PAYLOAD.map((row) =>
    mapLeverJob(row, "hireflow-fixture-lever", now, "HireFlow Fixture Labs", "fixture"),
  ).filter(Boolean) as CanonicalJob[]);
  const ashby = (FIXTURE_ASHBY_PAYLOAD.jobs
    .map((row) => mapAshbyJob(row, "hireflow-fixture-ashby", now, "HireFlow Fixture Labs", "fixture"))
    .filter(Boolean) as CanonicalJob[]);
  return [...greenhouse, ...lever, ...ashby];
}
