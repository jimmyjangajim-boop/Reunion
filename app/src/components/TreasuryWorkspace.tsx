"use client";
import { useState, type ReactNode } from "react";
import ProjectPrograms from "./ProjectPrograms";
import {
  money,
  treasuryView,
  type TreasuryFact,
  type TreasuryProject,
  type TreasuryBudget,
  type TreasuryEntry,
} from "../lib/treasury-view.ts";

type Props = {
  date: string;
  snapshot: TreasuryFact[];
  records: TreasuryFact[];
  projects: TreasuryProject[];
  budgets: TreasuryBudget[];
  ledger: TreasuryEntry[];
  onCreate: (kind: string) => void;
  openSource: (id: string, start?: number, end?: number) => void;
};
function exactMoney(value: number | null | undefined, currency = "USD") {
  return value == null
    ? "Not established"
    : `${currency} ${value.toLocaleString("en", { maximumFractionDigits: 2 })}`;
}
function Register({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return rows.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((v, j) => (
                <td key={j}>{v ?? "Not established"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="empty">No matching records for this view.</p>
  );
}
export default function TreasuryWorkspace(p: Props) {
  const [tab, setTab] = useState("Programs");
  const v = treasuryView(p.date, p.snapshot, p.projects, p.ledger);
  const budgets = p.budgets.filter(
    (b) => Number(b.fiscal_year) <= Number(p.date.slice(0, 4)),
  );
  const source = (id?: string, start?: number, end?: number) =>
    id ? (
      <button
        className="text-button"
        onClick={() => p.openSource(id, start, end)}
      >
        View source{start ? ` · lines ${start}–${end}` : ""}
      </button>
    ) : (
      "No linked source"
    );
  const facts = (records: TreasuryFact[]) => (
    <Register
      headers={["Record", "Value / status", "Evidence"]}
      rows={records.map((r) => [
        r.predicate,
        <>
          <strong>{r.value}</strong>
          <p>
            {r.canon} · {r.notes}
          </p>
        </>,
        <>
          {r.evidence?.map((e, i) => (
            <span key={i}>{source(e.source_id, e.line_start, e.line_end)}</span>
          ))}
        </>,
      ])}
    />
  );
  const max = Math.max(v.expenditure ?? 0, v.revenue ?? 0, 1);
  const metrics = [
    [
      "Annual expenditure",
      money(v.expenditure),
      "Framework, not cash spending",
    ],
    ["Revenue estimate", money(v.revenue), "Estimated annual receipts"],
    [
      "Projected deficit",
      money(v.deficit),
      "Expenditure less revenue; not booked debt",
    ],
    ["Public debt", money(v.debt), "Reported stock estimate"],
    ["Nominal GDP", money(v.gdp), "Economic baseline"],
    [
      "Inflation",
      v.inflation === null ? "Not established" : `${v.inflation}%`,
      "Dated observation",
    ],
  ];
  return (
    <div className="treasury-workspace">
      <div className="toolbar">
        <button onClick={() => p.onCreate("budget")}>+ Appropriation</button>
        <button className="secondary" onClick={() => p.onCreate("ledger")}>
          + Ledger entry
        </button>
        <button className="secondary" onClick={() => p.onCreate("project")}>
          + Project
        </button>
      </div>
      <header className="treasury-masthead">
        <p className="eyebrow">National accounts · {p.date}</p>
        <h2>The fiscal position</h2>
        <p>
          Historical observations, approved frameworks and recorded
          transactions, with their evidence kept in view.
        </p>
      </header>
      <div className="treasury-metrics">
        {metrics.map(([label, value, note]) => (
          <article key={label}>
            <h3>{label}</h3>
            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </div>
      <div className="treasury-comparisons">
        <section className="treasury-panel">
          <h3>Revenue & expenditure</h3>
          <p>Annual USD framework and estimate, valid for the selected date.</p>
          {v.revenue !== null && v.expenditure !== null ? (
            <>
              {[
                ["Revenue estimate", v.revenue],
                ["Expenditure framework", v.expenditure],
              ].map(([label, amount]) => (
                <div className="treasury-bar" key={label}>
                  <div>
                    <span>{label}</span>
                    <strong>{money(Number(amount))}</strong>
                  </div>
                  <meter
                    aria-label={String(label)}
                    min={0}
                    max={max}
                    value={Number(amount)}
                  />
                </div>
              ))}
              <p>
                Projected balance: {money(-v.deficit!)}. A projection does not
                establish a cash payment or debt increase.
              </p>
            </>
          ) : (
            <p className="empty">
              No comparable dated figures are established for this date.
            </p>
          )}
        </section>
        <section className="treasury-panel">
          <h3>Defense share of the framework</h3>
          {v.defenseShare !== null ? (
            <>
              <strong className="treasury-share">
                {(v.defenseShare * 100).toFixed(1)}%
              </strong>
              <meter
                aria-label="Defense share of annual expenditure"
                min={0}
                max={1}
                value={v.defenseShare}
              />
              <p>
                {money(v.defense)} of {money(v.expenditure)}. Derived from
                approved amounts; the remainder is not assigned to invented
                departments.
              </p>
            </>
          ) : (
            <p className="empty">
              A comparable dated defense allocation and expenditure total are
              not established.
            </p>
          )}
          <button className="text-button" onClick={() => setTab("Evidence")}>
            Inspect chart evidence
          </button>
        </section>
      </div>
      <nav className="treasury-tabs" aria-label="Treasury registers">
        {["Programs", "Appropriations", "Transactions", "Evidence"].map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            className={tab === t ? "" : "secondary"}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === "Programs" && (
        <section>
          <ProjectPrograms projects={v.projects} source={source} />
          {v.uncertainProjects.length > 0 && (
            <details>
              <summary>
                {v.uncertainProjects.length} programs with unknown or open
                observation dates
              </summary>
              <p>
                Excluded from dated totals. Consult their sources before
                assigning historical validity.
              </p>
              <Register
                headers={["Program", "Evidence"]}
                rows={v.uncertainProjects.map((r) => [
                  r.name,
                  source(r.source_id),
                ])}
              />
            </details>
          )}
        </section>
      )}
      {tab === "Appropriations" && (
        <section>
          <h3>Appropriation ledger</h3>
          <p>
            Recorded base amounts and dated adjustments. Original base
            commencement may be unknown. Fiscal year is shown explicitly; future
            fiscal years are excluded. This register does not certify authority
            at the selected date.
          </p>
          <Register
            headers={[
              "Budget / program",
              "Fiscal year",
              "Appropriated",
              "Committed entries",
              "Disbursed entries",
              "Actual entries",
            ]}
            rows={budgets.map((b) => [
              b.name,
              b.fiscal_year,
              exactMoney(b.appropriated_asof, b.currency),
              ...["committed", "disbursed", "actual"].map((s) =>
                exactMoney(
                  v.ledger
                    .filter((l) => l.budget_id === b.id && l.stage === s)
                    .reduce((sum, l) => sum + l.amount, 0),
                  b.currency,
                ),
              ),
            ])}
          />
          <p className="footnote">
            Stage totals summarize recorded entries only. Never add commitments,
            disbursements and actuals together. No entries does not establish
            zero national spending. Separate currencies are never combined.
          </p>
        </section>
      )}
      {tab === "Transactions" && (
        <section>
          <h3>Recorded transactions through {p.date}</h3>
          <Register
            headers={[
              "Date",
              "Stage",
              "Amount",
              "Budget / currency",
              "Reference",
              "Memo",
              "Authorization override",
              "Evidence",
            ]}
            rows={v.ledger.map((l) => {
              const b = p.budgets.find((b) => b.id === l.budget_id);
              return [
                l.date,
                l.stage,
                exactMoney(l.amount, b?.currency ?? "Currency unknown"),
                b?.name ?? "Unknown budget",
                l.reference || "Legacy entry",
                l.memo,
                l.override_reason,
                <>
                  {source(l.source_id)}
                  {l.evidence?.map((e, i) => (
                    <span key={i}>
                      {source(e.source_id, e.line_start, e.line_end)}
                    </span>
                  ))}
                </>,
              ];
            })}
          />
        </section>
      )}
      {tab === "Evidence" && (
        <section>
          <h3>Evidence for the selected date</h3>
          {facts(v.facts)}
          <details>
            <summary>Undated economic reference records</summary>
            <p>
              These records have no established historical validity window. They
              are preserved here as reference and never substituted into dated
              headline figures or charts. Provisional figures retain that
              status.
            </p>
            {facts(
              p.records.filter(
                (r) =>
                  r.category === "economic" &&
                  r.scope === "undated" &&
                  !["superseded", "rejected"].includes(r.canon),
              ),
            )}
          </details>
        </section>
      )}
    </div>
  );
}
