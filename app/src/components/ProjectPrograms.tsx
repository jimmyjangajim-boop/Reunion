"use client";
import type { ReactNode } from "react";
import type { TreasuryProject } from "../lib/treasury-view.ts";
import { money } from "../lib/treasury-view.ts";
import { projectFunding, projectTotals } from "../lib/project-funding.ts";
const exact = (n: number | null, currency: string) =>
  n === null ? "Not established" : `${currency} ${n.toLocaleString("en")}`;
export default function ProjectPrograms({
  projects,
  source,
}: {
  projects: TreasuryProject[];
  source: (id?: string) => ReactNode;
}) {
  return (
    <section className="project-programs">
      <h3>Infrastructure & government programs</h3>
      <p>
        Cost envelopes are separate from the annual national budget. Paid is
        source-reported expenditure. Committed is funding still locked for
        remaining work in the reconciled tracker. Fully funded does not mean
        completed.
      </p>
      {projectTotals(projects).map((t) => (
        <div
          key={t.currency}
          className="project-totals"
          aria-label={`${t.currency} project totals`}
        >
          <h4>
            {t.count} programs · {t.currency}
          </h4>
          <dl>
            {[
              ["Total cost", t.cost],
              ["Paid in source", t.paid],
              ["Committed funding", t.committed],
              ["Unfunded gap", t.gap],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{money(value as number | null, t.currency)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
      {projects.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Program / observation",
                  "Total cost",
                  "Paid in source",
                  "Committed funding",
                  "Unfunded gap",
                  "Funding coverage",
                  "Evidence & details",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const f = projectFunding(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <p>{JSON.parse(p.date_json).label}</p>
                      <small>
                        {p.operation === "unknown"
                          ? "Implementation not established"
                          : p.operation}
                      </small>
                    </td>
                    <td>{exact(p.planned, p.currency)}</td>
                    <td>{exact(p.paid, p.currency)}</td>
                    <td>{exact(p.committed, p.currency)}</td>
                    <td>{exact(f.gap, p.currency)}</td>
                    <td>
                      {f.coverage === null ? (
                        "Not established"
                      ) : (
                        <>
                          <meter
                            aria-label={`${p.name}: funding coverage`}
                            min={0}
                            max={Math.max(1, f.coverage)}
                            value={f.coverage}
                          />
                          {(100 * f.coverage).toFixed(1)}% funded
                          <p>
                            {exact(f.remaining, p.currency)} not yet paid
                          </p>
                        </>
                      )}
                    </td>
                    <td>
                      {source(p.source_id)}
                      <details>
                        <summary>Accounting & source notes</summary>
                        <p>
                          Legal appropriation: {exact(p.approved, p.currency)}.
                        </p>
                        <p>{p.notes}</p>
                        <p>
                          Future ETAs and monthly execution inputs are planning
                          assumptions. Elapsed time never completes a project or
                          creates payments.
                        </p>
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">No matching records for this view.</p>
      )}
    </section>
  );
}
