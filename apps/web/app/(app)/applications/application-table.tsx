import { APPLICATION_STAGE_LABELS, APPLICATION_STAGES } from "@hireflow/shared";
import Link from "next/link";

type Row = {
  id: string;
  companyName: string;
  title: string;
  stage: string;
  source: string;
  updatedAt: Date;
  applyUrl: string | null;
};

export function ApplicationTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-white">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">Applications by stage</caption>
        <thead className="border-b border-[var(--color-rule)] text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
          <tr>
            <th scope="col" className="px-4 py-3">
              Role
            </th>
            <th scope="col" className="px-4 py-3">
              Company
            </th>
            <th scope="col" className="px-4 py-3">
              Stage
            </th>
            <th scope="col" className="px-4 py-3">
              Source
            </th>
            <th scope="col" className="px-4 py-3">
              Updated
            </th>
            <th scope="col" className="px-4 py-3">
              Open
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--color-rule)] last:border-0">
              <th scope="row" className="px-4 py-3 font-medium">
                <Link className="text-[var(--color-accent)]" href={`/applications/${row.id}`}>
                  {row.title}
                </Link>
              </th>
              <td className="px-4 py-3">{row.companyName}</td>
              <td className="px-4 py-3">
                {APPLICATION_STAGE_LABELS[row.stage as (typeof APPLICATION_STAGES)[number]] ?? row.stage}
              </td>
              <td className="px-4 py-3">{row.source.replace("_", " ")}</td>
              <td className="px-4 py-3">{row.updatedAt.toISOString().slice(0, 10)}</td>
              <td className="px-4 py-3">
                <Link className="text-[var(--color-accent)]" href={`/applications/${row.id}`}>
                  Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
