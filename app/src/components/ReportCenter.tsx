"use client";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
type R = Record<string, any>;
export default function ReportCenter({
  date,
  units,
  locations,
  onChanged,
  openSource,
}: {
  date: string;
  units: R[];
  locations: R[];
  onChanged: () => Promise<void>;
  openSource: (id: string) => void;
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
            .filter((a: R) => a.status === "pending" && a.ready)
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
      <div className="alert">
        Write report → Review changes → Approve → Update Reunion. Movement
        orders and confirmed arrivals have structured support. Other statements
        are offered as archive entries with unresolved administrative effects.
      </div>
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
            approval.
          </p>
          {report.actions.map((a: R) => (
            <article className="record" key={a.id}>
              <div className="split">
                <h3>
                  {a.kind === "movement_order"
                    ? "Military movement order"
                    : a.kind === "movement_arrival"
                      ? "Confirmed movement arrival"
                      : "Historical archive entry"}
                </h3>
                <span className="badge">{a.status}</span>
              </div>
              <p>{a.payload.statement}</p>
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
                      disabled={!a.ready || report.mode !== "record" || busy}
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
                  <details>
                    <summary>Correct proposed details</summary>
                    <form onSubmit={(e) => edit(e, a)} className="report-form">
                      <label>
                        Action date
                        <input
                          name="date"
                          type="date"
                          defaultValue={a.payload.date || ""}
                        />
                      </label>
                      {a.kind !== "record_event" && (
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
                      <button disabled={busy}>Save proposed correction</button>
                    </form>
                  </details>
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
                        .filter((a: R) => a.status === "pending" && a.ready)
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
