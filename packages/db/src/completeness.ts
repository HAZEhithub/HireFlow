export function completenessFrom(profile: {
  headline: string | null;
  summary: string | null;
  location: string | null;
  desiredTitles: string[] | null;
  workplacePreference: string | null;
  status: string | null;
  employmentTypes: string[] | null;
  skills?: string[] | null;
  education?: unknown[] | null;
  experience?: unknown[] | null;
}): number {
  const checks = [
    Boolean(profile.headline),
    Boolean(profile.summary),
    Boolean(profile.location),
    (profile.desiredTitles?.length ?? 0) > 0,
    Boolean(profile.workplacePreference && profile.workplacePreference !== "any"),
    Boolean(profile.status),
    (profile.employmentTypes?.length ?? 0) > 0,
    (profile.skills?.length ?? 0) > 0,
    (profile.education?.length ?? 0) > 0 || (profile.experience?.length ?? 0) > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
