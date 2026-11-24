export const MATCH_WEIGHTS = {
  skills: 0.4,
  title: 0.25,
  location: 0.15,
  workplace: 0.1,
  employment: 0.1,
} as const;

export type MatchInput = {
  profileSkills: string[];
  jobSkills: string[];
  jobRequiredSkills?: string[];
  jobPreferredSkills?: string[];
  profileTitles: string[];
  jobTitle: string;
  remoteOk?: boolean;
  profileWorkplace?: string;
  jobWorkplace?: string;
  profileLocation?: string;
  jobLocation?: string;
  profileEmploymentTypes?: string[];
  jobEmploymentType?: string;
  profileExperience?: string;
  jobSeniority?: string;
};

export type MatchExplanation = {
  overall: number | null;
  skills: number;
  title: number;
  location: number;
  seniority: number;
  workplace: number;
  employment: number;
  matchingSkills: string[];
  missingRequiredSkills: string[];
  preferredSkillsMatched: string[];
  needsMoreProfile: boolean;
  explanation: string[];
  weights: typeof MATCH_WEIGHTS;
  disclaimer: string;
};

const DISCLAIMER =
  "This compatibility score is an overlap of the fields you shared with the listing. It is not a probability of getting hired.";

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+.#]+/g, " ").trim();
}

function overlap(a: string[], b: string[]) {
  const setB = new Set(b.map(norm).filter(Boolean));
  return a.map(norm).filter((item) => item && setB.has(item));
}

function titleScore(profileTitles: string[], jobTitle: string) {
  const job = norm(jobTitle);
  if (!job || profileTitles.length === 0) return 0;
  const hits = profileTitles.some((title) => {
    const p = norm(title);
    return p && (job.includes(p) || p.includes(job));
  });
  return hits ? 1 : 0.15;
}

function locationScore(profileLocation?: string, jobLocation?: string, remoteOk?: boolean, jobWorkplace?: string) {
  if (remoteOk && jobWorkplace === "remote") return 1;
  if (!profileLocation || !jobLocation) return 0.4;
  const a = norm(profileLocation);
  const b = norm(jobLocation);
  if (a === b || a.includes(b) || b.includes(a)) return 1;
  return 0.2;
}

function workplaceScore(profileWorkplace?: string, jobWorkplace?: string) {
  if (!profileWorkplace || profileWorkplace === "any" || !jobWorkplace || jobWorkplace === "unknown") return 0.6;
  if (profileWorkplace === jobWorkplace) return 1;
  if (profileWorkplace === "hybrid" && (jobWorkplace === "remote" || jobWorkplace === "onsite")) return 0.5;
  return 0.2;
}

function employmentScore(profileTypes?: string[], jobType?: string) {
  if (!jobType) return 0.6;
  if (!profileTypes?.length) return 0.5;
  return profileTypes.includes(jobType) ? 1 : 0.15;
}

export function explainMatch(input: MatchInput): MatchExplanation {
  const required = input.jobRequiredSkills?.length ? input.jobRequiredSkills : input.jobSkills;
  const preferred = input.jobPreferredSkills ?? [];
  const matchingSkills = overlap(input.profileSkills, [...required, ...preferred]);
  const missingRequiredSkills = required.filter(
    (skill) => !input.profileSkills.some((p) => norm(p) === norm(skill)),
  );
  const preferredSkillsMatched = overlap(input.profileSkills, preferred);
  const skills =
    required.length === 0
      ? 0.5
      : Math.min(1, matchingSkills.length / Math.max(required.length, 1));
  const title = titleScore(input.profileTitles, input.jobTitle);
  const location = locationScore(
    input.profileLocation,
    input.jobLocation,
    input.remoteOk,
    input.jobWorkplace,
  );
  const workplace = workplaceScore(input.profileWorkplace, input.jobWorkplace);
  const employment = employmentScore(input.profileEmploymentTypes, input.jobEmploymentType);
  const seniority =
    input.profileExperience && input.jobSeniority
      ? norm(input.profileExperience).includes(norm(input.jobSeniority)) ||
        norm(input.jobSeniority).includes(norm(input.profileExperience))
        ? 1
        : 0.4
      : 0.5;

  const needsMoreProfile = input.profileSkills.length === 0 && input.profileTitles.length === 0;
  const overall = needsMoreProfile
    ? null
    : Math.round(
        (skills * MATCH_WEIGHTS.skills +
          title * MATCH_WEIGHTS.title +
          location * MATCH_WEIGHTS.location +
          workplace * MATCH_WEIGHTS.workplace +
          employment * MATCH_WEIGHTS.employment) *
          100,
      );

  const explanation: string[] = [];
  if (needsMoreProfile) {
    explanation.push("Add desired titles and skills on your profile before compatibility can be scored.");
  } else {
    explanation.push(
      matchingSkills.length
        ? `Overlapping skills: ${matchingSkills.join(", ")}.`
        : "No overlapping skills were found in the fields compared.",
    );
    if (missingRequiredSkills.length) {
      explanation.push(`Skills listed on the job that are not on your profile: ${missingRequiredSkills.join(", ")}.`);
    }
    explanation.push(
      title > 0.5 ? "Your desired titles overlap this job title." : "Your desired titles do not closely match this title.",
    );
  }

  return {
    overall,
    skills: Math.round(skills * 100),
    title: Math.round(title * 100),
    location: Math.round(location * 100),
    seniority: Math.round(seniority * 100),
    workplace: Math.round(workplace * 100),
    employment: Math.round(employment * 100),
    matchingSkills,
    missingRequiredSkills,
    preferredSkillsMatched,
    needsMoreProfile,
    explanation,
    weights: MATCH_WEIGHTS,
    disclaimer: DISCLAIMER,
  };
}

export function matchJobToProfile(
  job: {
    title: string;
    requiredSkills?: string[] | null;
    preferredSkills?: string[] | null;
    workplaceType?: string | null;
    employmentType?: string | null;
    locationText?: string | null;
    city?: string | null;
    seniority?: string | null;
  },
  profile: {
    skills?: string[] | null;
    desiredTitles?: string[] | null;
    workplacePreference?: string | null;
    location?: string | null;
    employmentTypes?: string[] | null;
    experienceLevel?: string | null;
  } | null,
): MatchExplanation {
  const required = job.requiredSkills ?? [];
  const preferred = job.preferredSkills ?? [];
  return explainMatch({
    profileSkills: profile?.skills ?? [],
    jobSkills: [...required, ...preferred],
    jobRequiredSkills: required,
    jobPreferredSkills: preferred,
    profileTitles: profile?.desiredTitles ?? [],
    jobTitle: job.title,
    remoteOk: profile?.workplacePreference === "remote",
    profileWorkplace: profile?.workplacePreference ?? undefined,
    jobWorkplace: job.workplaceType ?? undefined,
    profileLocation: profile?.location ?? undefined,
    jobLocation: job.locationText ?? job.city ?? undefined,
    profileEmploymentTypes: profile?.employmentTypes ?? [],
    jobEmploymentType: job.employmentType || undefined,
    profileExperience: profile?.experienceLevel ?? undefined,
    jobSeniority: job.seniority ?? undefined,
  });
}
