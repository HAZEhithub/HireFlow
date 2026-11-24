export function jobsFilterHref(values: Record<string, string | undefined>, employment?: string) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (!value || key === "employment" || key === "page") continue;
    params.set(key, value);
  }
  if (employment) params.set("employment", employment);
  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}
