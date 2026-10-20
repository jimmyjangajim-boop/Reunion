"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BattleSummary } from "./BattleWorkspace";
type R = Record<string, any>;
export default function ReportCenter({
  date,
  units,
  locations,
  bills,
  budgets,
  onChanged,
  openSource,
  openBattleReport,
}: {
  date: string;
  units: R[];
  locations: R[];
  bills: R[];
  budgets: R[];
  onChanged: () => Promise<void>;
  openSource: (id: string) => void;
  openBattleReport: (id?: string) => void;
}) {
  const [history, setHistory] = useState<R[]>([]),
    [report, setReport] = useState<R | null>(null),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [mode, setMode] = useState("record");
  async function loadHistory() {
    const r = await fetch("/api/reports");
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    setHistory(data.reports);
  }
  useEffect(() => {
    loadHistory().catch((e) => setError(e.message));
  }, []);
  function show(r: R) {
    setReport(r);
    setSelected(
      r.mode === "record"
        ? r.actions
            .filter(
              (a: R) =>
                a.status === "pending" && a.ready && a.kind !== "battle",
            )
            .map((a: R) => a.id)
        : [],
    );
  }
  async function send(payload: R) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const r = await response.json();
      if (!response.ok) throw Error(r.error);
      show(r);
      await loadHistory();
      await onChanged();
      return r;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await send({
        ...data,
        action: "submit",
        mode,
        date: data.date || null,
        correction_of: data.correction_of || null,
      });
      setNotice(
        r.duplicate
          ? "This report already exists. Its earlier review was opened."
          : "Original report saved. Review the proposed changes below.",
      );
    } catch {}
  }
  async function edit(e: FormEvent<HTMLFormElement>, a: R) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await send({
        action: "edit",
        report_id: report!.id,
        revision: report!.revision,
        action_id: a.id,
        reason: data.reason,
        payload: {
          ...a.payload,
          ...(a.kind === "legislation"
            ? {
                bill_id: data.bill_id || null,
                bill_identifier: data.bill_identifier || null,
                bill_title: data.bill_title || null,
                bill_stage: data.bill_stage || null,
                effective_date: data.effective_date || null,
              }
            : {}),
          ...(a.kind === "financial"
            ? {
                budget_id: data.budget_id || null,
                budget_name: data.budget_name || null,
                financial_stage: data.financial_stage || null,
                financial_amount:
                  data.financial_amount === ""
                    ? null
                    : Number(data.financial_amount),
                financial_currency: data.financial_currency || null,
                financial_reference: data.financial_reference || null,
                financial_memo: data.financial_memo || null,
                appropriation_basis: data.appropriation_basis || null,
              }
            : {}),
          date: data.date || null,
          unit_id: data.unit_id || null,
          location_id: data.location_id || null,
          movement_id: data.movement_id || null,
          override_reason: data.override_reason || "",
        },
      });
      setNotice("Proposal corrected. Original report text is unchanged.");
    } catch {}
  }
  async function approve(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await send({
        action: "approve",
        report_id: report!.id,
        revision: report!.revision,
        action_ids: selected,
        reason: f.get("reason"),
      });
      setNotice(
        "Selected changes saved together. National records and timeline were updated.",
      );
    } catch {}
  }
  return (
    <div className="report-center">
      <button className="secondary" onClick={() => openBattleReport()}>
        New battle / after-action report
      </button>
      <div className="alert">
        Write report → Review changes → Approve → Update Reunion. Movement
        orders, confirmed arrivals, explicit bill stages, and financial stages
        have structured support. Other statements are offered as archive entries
        with unresolved administrative effects.
      </div>
      <p className="muted">
        Financial wording: “Treasury disbursed USD 100 for Budget NAME;
        reference PAY-1: Memo”. For a limit increase, use “Treasury added an
        appropriation of USD 100 to Budget NAME; reference APP-1”. Record a
        known funding budget first. Amounts use whole currency units.
      </p>
      <p className="muted">
        Use one statement per line. Supported bill wording: “Parliament passed
        Bill IDENTIFIER: Title” or “President signed Bill IDENTIFIER into law.”
        Review the extracted stage before approval.
      </p>
      {error && (
        <div role="alert" className="alert error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="alert">
          {notice}
        </div>
      )}
      <section className="panel">
        <h2>Submit a national report</h2>
        <div className="tabs">
          <button
            className={mode === "record" ? "selected" : ""}
            onClick={() => setMode("record")}
          >
            Record what happened
          </button>
          <button
            className={mode === "simulate" ? "selected" : ""}
            onClick={() => setMode("simulate")}
          >
            Simulate what might happen
          </button>
        </div>
        <form onSubmit={submit} className="report-form">
          <label>
            Report title
            <input name="title" required maxLength={200} />
          </label>
          <label>
            Report date, if known
            <input name="date" type="date" defaultValue={date} />
            <small>
              Clear this field to preserve an unknown date. An ISO date at the
              start of a line applies to following statements.
            </small>
          </label>
          <label>
            Corrects an earlier report
            <select name="correction_of" defaultValue="">
              <option value="">No earlier report</option>
              {history.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <small>
              A correction preserves the earlier report and its approved
              records.
            </small>
          </label>
          <label>
            Original report
            <textarea
              name="body"
              rows={12}
              required
              maxLength={500000}
              placeholder="Paste the report. For structured movement extraction, put each statement on its own line and use exact formation and place names."
            />
          </label>
          {mode === "simulate" && (
            <p className="muted">
              This saves a hypothetical scenario for review. Outcome generation
              and AI are not implemented. Scenario actions cannot update canon.
            </p>
          )}
          <button disabled={busy} type="submit">
            {busy ? "Saving…" : "Save report and review"}
          </button>
        </form>
      </section>
      {report && (
        <section className="panel" aria-label="Report review">
          <div className="split">
            <h2>{report.title}</h2>
            <span className="badge">
              {report.mode} · {report.status}
            </span>
          </div>
          <button
            className="text-button"
            onClick={() => openSource(report.source_id)}
          >
            View immutable original report
          </button>
          {report.correction_of && (
            <p>
              Corrective report. Earlier report and records remain available in
              history.
            </p>
          )}
          <p>
            {report.actions.filter((a: R) => a.status === "pending").length}{" "}
            proposed changes remain. Each selected change is validated again at
            approval. Selected changes apply in original report line order.
          </p>
          {report.actions.map((a: R) => (
            <article className="record" key={a.id}>
              <div className="split">
                <h3>
                  {a.kind === "movement_order"
                    ? "Military movement order"
                    : a.kind === "movement_arrival"
                      ? "Confirmed movement arrival"
                      : a.kind === "financial"
                        ? "Financial transaction"
                        : a.kind === "battle"
                          ? "Battle / after-action report"
                          : a.kind === "legislation"
                            ? "Parliamentary legislation"
                            : "Historical archive entry"}
                </h3>
                <span className="badge">{a.status}</span>
              </div>
              {a.kind !== "battle" && <p>{a.payload.statement}</p>}
              {a.kind === "battle" && (
                <>
                  <BattleSummary battle={a.payload.battle} units={units} />
                  <button
                    className="text-button"
                    onClick={() => openBattleReport(report.id)}
                  >
                    Review and approve in Battles →
                  </button>
                </>
              )}
              {a.kind === "financial" && (
                <p>
                  {a.payload.financial_stage || "Stage unknown"} ·{" "}
                  {a.payload.financial_currency || "Currency unknown"}{" "}
                  {a.payload.financial_amount?.toLocaleString() ??
                    "Amount unknown"}{" "}
                  · Budget:{" "}
                  {a.payload.budget_name ||
                    budgets.find((b) => b.id === a.payload.budget_id)?.name ||
                    "Unknown"}{" "}
                  · Reference: {a.payload.financial_reference || "Unknown"}.
                </p>
              )}
              {a.kind === "legislation" && (
                <p>
                  Bill{" "}
                  {a.payload.bill_identifier ||
                    bills.find((b) => b.id === a.payload.bill_id)?.identifier ||
                    "Unknown"}{" "}
                  · {a.payload.bill_stage || "Stage unknown"} ·{" "}
                  {a.payload.bill_title || "Title not reported"}. Effective
                  date: {a.payload.effective_date || "Unknown"}.
                </p>
              )}
              <p className="muted">
                Original source line {a.line_start}. Date:{" "}
                {a.payload.date || "Unknown"}.
              </p>
              {a.missing.map((m: string) => (
                <p className="alert" key={m}>
                  {m}
                </p>
              ))}
              {a.warnings.map((w: string) => (
                <p className="muted" key={w}>
                  {w}
                </p>
              ))}
              {a.status === "pending" && (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(a.id)}
                      disabled={
                        !a.ready ||
                        report.mode !== "record" ||
                        busy ||
                        a.kind === "battle"
                      }
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, a.id]
                            : selected.filter((id) => id !== a.id),
                        )
                      }
                    />{" "}
                    Approve this change
                  </label>
                  {a.kind !== "battle" && (
                    <details>
                      <summary>Correct proposed details</summary>
                      <form
                        onSubmit={(e) => edit(e, a)}
                        className="report-form"
                      >
                        <label>
                          Action date
                          <input
                            name="date"
                            type="date"
                            defaultValue={a.payload.date || ""}
                          />
                        </label>
                        {a.kind === "financial" && (
                          <>
                            <label>
                              Funding budget
                              <select
                                name="budget_id"
                                defaultValue={a.payload.budget_id || ""}
                              >
                                <option value="">
                                  Match reported name, if unique
                                </option>
                                {budgets.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} · {b.fiscal_year} · {b.currency} ·
                                    limit {b.appropriated.toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Reported budget name
                              <input
                                name="budget_name"
                                maxLength={500}
                                defaultValue={a.payload.budget_name || ""}
                              />
                            </label>
                            <label>
                              Reported stage
                              <select
                                name="financial_stage"
                                defaultValue={a.payload.financial_stage || ""}
                              >
                                <option value="">Unknown</option>
                                {[
                                  "proposed",
                                  "authorized",
                                  "appropriated",
                                  "committed",
                                  "disbursed",
                                  "actual",
                                ].map((s) => (
                                  <option key={s} value={s}>
                                    {s === "appropriated"
                                      ? "Additional appropriation"
                                      : s}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Amount in whole currency units
                              <input
                                name="financial_amount"
                                type="number"
                                min={0}
                                step={1}
                                max={Number.MAX_SAFE_INTEGER}
                                defaultValue={a.payload.financial_amount ?? ""}
                              />
                            </label>
                            <label>
                              Reported currency
                              <input
                                name="financial_currency"
                                maxLength={8}
                                defaultValue={
                                  a.payload.financial_currency || ""
                                }
                              />
                            </label>
                            <label>
                              Transaction reference
                              <input
                                name="financial_reference"
                                maxLength={120}
                                defaultValue={
                                  a.payload.financial_reference || ""
                                }
                              />
                              <small>
                                Use the same reference for another report of
                                this transaction. Give separate payments
                                separate references.
                              </small>
                            </label>
                            <label>
                              Memo, if supplied
                              <input
                                name="financial_memo"
                                maxLength={20000}
                                defaultValue={a.payload.financial_memo || ""}
                              />
                            </label>
                            <label>
                              Appropriation interpretation
                              <select
                                name="appropriation_basis"
                                defaultValue={
                                  a.payload.appropriation_basis || ""
                                }
                              >
                                <option value="">
                                  Not confirmed / not applicable
                                </option>
                                <option value="increase">
                                  Additional amount increasing this budget’s
                                  limit
                                </option>
                              </select>
                              <small>
                                A restatement of an existing appropriation is
                                not an increase.
                              </small>
                            </label>
                            <label>
                              Authorization override, if needed
                              <input
                                name="override_reason"
                                maxLength={2000}
                                defaultValue={a.payload.override_reason}
                              />
                            </label>
                          </>
                        )}
                        {a.kind === "legislation" && (
                          <>
                            <label>
                              Existing bill
                              <select
                                name="bill_id"
                                defaultValue={a.payload.bill_id || ""}
                              >
                                <option value="">
                                  Match reported identifier, or create if new
                                </option>
                                {bills.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.identifier} ·{" "}
                                    {b.title || "Title not reported"}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Reported bill identifier
                              <input
                                name="bill_identifier"
                                maxLength={200}
                                defaultValue={a.payload.bill_identifier || ""}
                              />
                            </label>
                            <label>
                              Reported title, if known
                              <input
                                name="bill_title"
                                maxLength={500}
                                defaultValue={a.payload.bill_title || ""}
                              />
                            </label>
                            <label>
                              Reported stage
                              <select
                                name="bill_stage"
                                defaultValue={a.payload.bill_stage || ""}
                              >
                                <option value="">Unknown</option>
                                <option value="considering">
                                  Under consideration
                                </option>
                                <option value="introduced">Introduced</option>
                                <option value="passed">
                                  Passed by Parliament
                                </option>
                                <option value="enacted">
                                  Enacted / signed into law
                                </option>
                              </select>
                            </label>
                            <label>
                              Explicit effective date, for enacted laws only
                              <input
                                type="date"
                                name="effective_date"
                                defaultValue={a.payload.effective_date || ""}
                              />
                            </label>
                            <small>
                              Leave unreported details empty. Bill stages do not
                              create votes, appropriations, or payments.
                            </small>
                          </>
                        )}
                        {(a.kind === "movement_order" ||
                          a.kind === "movement_arrival") && (
                          <>
                            <label>
                              Formation
                              <select
                                name="unit_id"
                                defaultValue={a.payload.unit_id || ""}
                              >
                                <option value="">Unknown</option>
                                {units.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Destination
                              <select
                                name="location_id"
                                defaultValue={a.payload.location_id || ""}
                              >
                                <option value="">Unknown</option>
                                {locations.map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                            {a.kind === "movement_arrival" && (
                              <label>
                                Prior movement order ID, if ambiguous
                                <input
                                  name="movement_id"
                                  defaultValue={a.payload.movement_id || ""}
                                />
                              </label>
                            )}
                            <label>
                              Treaty warning override, if needed
                              <input
                                name="override_reason"
                                defaultValue={a.payload.override_reason}
                              />
                            </label>
                          </>
                        )}
                        <label>
                          Reason for correction
                          <input name="reason" required minLength={3} />
                        </label>
                        <button disabled={busy}>
                          Save proposed correction
                        </button>
                      </form>
                    </details>
                  )}
                </>
              )}
            </article>
          ))}
          {report.mode === "record" &&
            report.actions.some((a: R) => a.status === "pending") && (
              <form onSubmit={approve} className="report-form">
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setSelected(
                      report.actions
                        .filter(
                          (a: R) =>
                            a.status === "pending" &&
                            a.ready &&
                            a.kind !== "battle",
                        )
                        .map((a: R) => a.id),
                    )
                  }
                >
                  Select all ready changes
                </button>
                <label>
                  Approval reason
                  <input
                    name="reason"
                    required
                    minLength={3}
                    placeholder="Reason for accepting the selected changes"
                  />
                </label>
                <button type="submit" disabled={busy || !selected.length}>
                  Approve {selected.length} selected changes
                </button>
              </form>
            )}
          <details>
            <summary>
              Review and correction history ({report.reviews.length})
            </summary>
            {report.reviews.map((r: R) => (
              <p key={r.id}>
                {r.recorded_at} · {r.action} · {r.reason}
              </p>
            ))}
          </details>
        </section>
      )}
      <section className="panel">
        <h2>Report history</h2>
        {history.length ? (
          history.map((r) => (
            <article className="record" key={r.id}>
              <button
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  try {
                    const response = await fetch("/api/reports?id=" + r.id);
                    const data = await response.json();
                    if (!response.ok) throw Error(data.error);
                    show(data);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {r.title}
              </button>
              <p>
                {r.effective_date || "Date unknown"} · {r.mode} · {r.status} ·{" "}
                {r.pending_count} pending
              </p>
            </article>
          ))
        ) : (
          <p>No reports submitted.</p>
        )}
      </section>
    </div>
  );
}
