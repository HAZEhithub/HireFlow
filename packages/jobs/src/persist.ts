import { randomUUID } from "node:crypto";
import { company, job, jobSkill, jobSource, jobVerificationSignal, type HireFlowDb } from "@hireflow/db";
import { and, eq } from "drizzle-orm";
import { decideDuplicate } from "./dedup";
import { evaluateFreshness } from "./freshness";
import { sanitizeUntrustedText } from "./html";
import { stableId } from "./hash";
import { canonicalUrl, contentHash, descriptionFingerprint, fingerprint, normalizeCompany } from "./normalize";
import { persistableApplyUrl } from "./ssrf";
import type { CanonicalJob } from "./types";
import { canMergeListings, listingKindOf } from "./visibility";

export type UpsertCounts = {
  discovered: number;
  inserted: number;
  updated: number;
  ignored: number;
};

function asCanonical(row: typeof job.$inferSelect, companyName: string): CanonicalJob {
  return {
    source: row.source as CanonicalJob["source"],
    externalId: row.externalId,
    boardId: row.boardId,
    title: row.title,
    companyName,
    applyUrl: row.applyUrl,
    sourceUrl: row.sourceUrl ?? undefined,
    canonicalUrl: row.canonicalUrl ?? undefined,
    descriptionText: row.descriptionText,
    department: row.department ?? undefined,
    workplaceType: row.workplaceType as CanonicalJob["workplaceType"],
    employmentType: row.employmentType,
    city: row.city ?? undefined,
    country: row.country ?? undefined,
    locationText: row.locationText ?? undefined,
    locations: row.locations ?? [],
    listingKind: row.listingKind as CanonicalJob["listingKind"],
    importedByUserId: row.importedByUserId ?? undefined,
    firstSeen: row.firstSeen.toISOString(),
    lastVerified: row.lastVerified.toISOString(),
    status: row.status as CanonicalJob["status"],
  };
}

async function upsertCompany(db: HireFlowDb, name: string) {
  const normalized = normalizeCompany(name) || name.toLowerCase().trim();
  const existing = await db.query.company.findFirst({ where: eq(company.normalizedName, normalized) });
  if (existing) return existing;
  const id = stableId(["company", normalized]);
  const row = {
    id,
    name: name.trim(),
    normalizedName: normalized,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(company).values(row).onConflictDoNothing();
  return (await db.query.company.findFirst({ where: eq(company.id, id) })) ?? row;
}

async function replaceSkills(db: HireFlowDb, jobId: string, required: string[], preferred: string[]) {
  await db.delete(jobSkill).where(eq(jobSkill.jobId, jobId));
  const rows = [
    ...required.map((skill) => ({ id: randomUUID(), jobId, skill, kind: "required" as const })),
    ...preferred.map((skill) => ({ id: randomUUID(), jobId, skill, kind: "preferred" as const })),
  ];
  if (rows.length) await db.insert(jobSkill).values(rows);
}

async function addSignal(db: HireFlowDb, jobId: string, kind: string, message: string, evidence?: string) {
  await db.insert(jobVerificationSignal).values({
    id: randomUUID(),
    jobId,
    kind,
    message,
    evidence,
  });
}

export async function upsertCanonicalJobs(db: HireFlowDb, incoming: CanonicalJob[], now = new Date()): Promise<UpsertCounts> {
  const counts: UpsertCounts = { discovered: incoming.length, inserted: 0, updated: 0, ignored: 0 };
  for (const item of incoming) {
    try {
      if (!item.title.trim() || !item.applyUrl.trim() || !item.companyName.trim()) {
        counts.ignored += 1;
        continue;
      }
      const apply = persistableApplyUrl(item.applyUrl);
      if (!apply) {
        counts.ignored += 1;
        continue;
      }
      const listingKind = listingKindOf(item);
      const isImport = listingKind === "user_import";
      const sanitized = sanitizeUntrustedText(item.descriptionText);
      const injectionFlagged = Boolean(item.injectionFlagged || sanitized.flagged);
      const companyRow = await upsertCompany(db, item.companyName);
      const canon = canonicalUrl(apply.toString()) ?? item.canonicalUrl ?? apply.toString();
      const prepared: CanonicalJob = {
        ...item,
        applyUrl: apply.toString(),
        descriptionText: sanitized.text,
        listingKind,
        injectionFlagged,
      };
      const fp = fingerprint(prepared);
      const hash = contentHash(prepared);
      const descFp = descriptionFingerprint(prepared.descriptionText);

      const byExternal = await db.query.job.findFirst({
        where: and(eq(job.source, item.source), eq(job.boardId, item.boardId ?? ""), eq(job.externalId, item.externalId)),
      });
      let existing =
        byExternal && canMergeListings(prepared, asCanonical(byExternal, item.companyName)) ? byExternal : undefined;
      if (!existing && canon) {
        const urlMatches = await db.query.job.findMany({ where: eq(job.canonicalUrl, canon) });
        existing = urlMatches.find((row) => canMergeListings(prepared, asCanonical(row, item.companyName)));
      }
      if (!existing) {
        const sameFp = await db.query.job.findFirst({ where: eq(job.fingerprint, fp) });
        if (sameFp) {
          const companyMatch = await db.query.company.findFirst({ where: eq(company.id, sameFp.companyId) });
          const candidate = asCanonical(sameFp, companyMatch?.name ?? item.companyName);
          const decision = decideDuplicate(prepared, candidate);
          if (canMergeListings(prepared, candidate) && decision.kind === "exact") {
            existing = sameFp;
          } else if (canMergeListings(prepared, candidate) && decision.kind === "probable") {
            await addSignal(db, sameFp.id, "probable_duplicate", decision.reason);
          }
        }
      }

      const freshness = evaluateFreshness({
        now,
        firstSeen: existing?.firstSeen ?? new Date(item.firstSeen),
        lastVerified: now,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : existing?.publishedAt ?? null,
        status: "open",
        missingConsecutive: 0,
      });

      const values = {
        companyId: companyRow.id,
        source: item.source,
        externalId: item.externalId,
        boardId: item.boardId ?? "",
        title: item.title.trim(),
        descriptionText: sanitized.text,
        applyUrl: apply.toString(),
        sourceUrl: item.sourceUrl ?? apply.toString(),
        canonicalUrl: canon,
        department: item.department,
        workplaceType: item.workplaceType,
        employmentType: item.employmentType,
        seniority: item.seniority,
        industry: item.industry,
        city: item.city,
        country: item.country,
        locationText: item.locationText,
        locations: item.locations,
        salaryMin: item.salaryMin ?? null,
        salaryMax: item.salaryMax ?? null,
        salaryCurrency: item.salaryCurrency ?? null,
        salaryPeriod: item.salaryPeriod ?? null,
        salaryDisclosure: item.salaryDisclosure ?? "not_provided",
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : existing?.publishedAt ?? null,
        lastVerified: now,
        lastProviderUpdate: item.lastProviderUpdate
          ? new Date(item.lastProviderUpdate)
          : existing?.lastProviderUpdate ?? (item.publishedAt ? new Date(item.publishedAt) : null),
        status: freshness.status,
        freshnessLabel: freshness.label,
        contentHash: hash,
        fingerprint: fp,
        descriptionFingerprint: descFp,
        requiredSkills: item.requiredSkills ?? [],
        preferredSkills: item.preferredSkills ?? [],
        listingKind,
        importedByUserId: isImport ? (item.importedByUserId ?? null) : null,
        importNotes: isImport ? (item.importNotes ?? null) : null,
        injectionFlagged,
        missingConsecutive: 0,
        applyUrlStatus: "unchecked" as const,
      };

      if (existing) {
        await db
          .update(job)
          .set(values)
          .where(eq(job.id, existing.id));
        counts.updated += 1;
        await db
          .insert(jobSource)
          .values({
            id: stableId(["source", item.source, item.boardId ?? "", item.externalId]),
            jobId: existing.id,
            adapter: item.source,
            boardId: item.boardId ?? "",
            externalId: item.externalId,
            sourceUrl: item.sourceUrl ?? apply.toString(),
            applyUrl: apply.toString(),
            lastSeen: now,
          })
          .onConflictDoNothing();
        await replaceSkills(db, existing.id, item.requiredSkills ?? [], item.preferredSkills ?? []);
        if (injectionFlagged) {
          await addSignal(
            db,
            existing.id,
            "untrusted_text",
            "This description is treated as untrusted source text, not as instructions.",
          );
        }
        continue;
      }

      const id = stableId(["job", item.source, item.boardId ?? "", item.externalId]);
      await db.insert(job).values({
        id,
        firstSeen: new Date(item.firstSeen),
        ...values,
      });
      await db.insert(jobSource).values({
        id: stableId(["source", item.source, item.boardId ?? "", item.externalId]),
        jobId: id,
        adapter: item.source,
        boardId: item.boardId ?? "",
        externalId: item.externalId,
        sourceUrl: item.sourceUrl ?? apply.toString(),
        applyUrl: apply.toString(),
        lastSeen: now,
      });
      await replaceSkills(db, id, item.requiredSkills ?? [], item.preferredSkills ?? []);
      if (listingKind === "fixture") {
        await addSignal(
          db,
          id,
          "fixture",
          "Development sample — not a live opening.",
          "Loaded from HireFlow fixtures, not an employer board.",
        );
      }
      if (injectionFlagged) {
        await addSignal(
          db,
          id,
          "untrusted_text",
          "This description is treated as untrusted source text, not as instructions.",
        );
      }
      if (!isImport && descFp) {
        const others = await db.query.job.findMany({
          where: and(eq(job.companyId, companyRow.id), eq(job.descriptionFingerprint, descFp)),
        });
        for (const other of others) {
          if (other.id === id) continue;
          const companyMatch = await db.query.company.findFirst({ where: eq(company.id, other.companyId) });
          const decision = decideDuplicate(prepared, asCanonical(other, companyMatch?.name ?? item.companyName));
          if (decision.kind === "probable") {
            await addSignal(db, id, "probable_duplicate", decision.reason, other.id);
          }
        }
      }
      counts.inserted += 1;
    } catch {
      counts.ignored += 1;
    }
  }
  return counts;
}
