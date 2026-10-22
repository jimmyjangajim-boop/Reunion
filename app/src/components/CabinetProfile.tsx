"use client";
import React, { useEffect, useRef } from "react";
type R = Record<string, any>;
function label(s: string) {
  return (
    (
      {
        baseline_minister: "Minister",
        existence_in_canon: "Canon status",
        current_disposition: "Current situation",
        finance_minister_succession: "Finance succession",
      } as R
    )[s] ?? s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
  );
}
function value(v: any): string {
  if (v === null || v === undefined) return "Not recorded";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.map(value).join("; ");
  if (typeof v === "object")
    return Object.entries(v)
      .map(([k, x]) => `${label(k)}: ${value(x)}`)
      .join(" · ");
  return String(v);
}
function readable(s: string) {
  try {
    return value(JSON.parse(s));
  } catch {
    return s;
  }
}
export function holder(row: R) {
  return (
    row.name ??
    (row.status === "vacant" ? "Vacant" : "Not established for this date")
  );
}
export default function CabinetProfile({
  row,
  onClose,
  onSource,
  view,
  onView,
}: {
  row: R;
  view: "person" | "office";
  onView: (view: "person" | "office") => void;
  onClose: () => void;
  onSource: (id: string, line?: number, end?: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const source = (e: R) => {
    onClose();
    onSource(e.source_id, e.line_start, e.line_end);
  };
  return (
    <dialog
      ref={dialog}
      className="office-profile"
      aria-labelledby="office-profile-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <header className="profile-heading">
        <div>
          <span className="eyebrow">{row.office}</span>
          <h2 id="office-profile-title">
            {view === "office" ? row.ministry : holder(row)}
          </h2>
          <p>{view === "office" ? holder(row) : row.ministry}</p>
        </div>
        <button className="secondary" onClick={onClose} autoFocus>
          Close
        </button>
      </header>
      <div className="profile-body">
        <nav className="profile-view-tabs" aria-label="Profile view">
          <button
            className="secondary"
            aria-pressed={view === "person"}
            onClick={() => onView("person")}
          >
            Officeholder profile
          </button>
          <button
            className="secondary"
            aria-pressed={view === "office"}
            onClick={() => onView("office")}
          >
            Office profile
          </button>
        </nav>
        <p className="profile-date-context">
          Selected date {row.selected_date} · {row.context}. Unknown names do
          not establish vacancies.
        </p>
        <dl className="profile-facts">
          <div>
            <dt>Appointment date</dt>
            <dd>{row.appointment_date ?? "Not recorded"}</dd>
          </div>
          <div>
            <dt>Political affiliation</dt>
            <dd>{row.affiliation ?? "Not recorded"}</dd>
          </div>
          <div>
            <dt>Officeholder record</dt>
            <dd>
              {row.observed_date
                ? `Recorded ${row.observed_date}`
                : "No dated officeholder established"}
            </dd>
          </div>
          <div>
            <dt>Responsibilities</dt>
            <dd>{row.responsibilities ?? "Not recorded"}</dd>
          </div>
        </dl>
        {row.history.length > 0 && (
          <section>
            <h3>Term history · all recorded dates</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Officeholder</th>
                    <th>Appointment</th>
                    <th>Departure</th>
                    <th>Canon / evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {row.history.map((t: R) => (
                    <tr key={t.id}>
                      <td>{t.person}</td>
                      <td>{t.start_date ?? "Date not established"}</td>
                      <td>{t.end_date ?? "Date not established"}</td>
                      <td>
                        {t.canon ?? "Not recorded"}
                        {t.source_id && (
                          <button
                            className="text-button"
                            onClick={() => source(t)}
                          >
                            View appointment source
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              A recorded succession order does not establish missing dates.
            </p>
          </section>
        )}
        {row.observations.length > 0 && (
          <details>
            <summary>Officeholder observations · all recorded dates</summary>
            <ul>
              {row.observations.map((o: R) => (
                <li key={o.id}>
                  {o.name} · {o.date}
                  {o.canon !== "confirmed" ? ` · ${o.canon}` : ""}
                </li>
              ))}
            </ul>
          </details>
        )}
        {row.facts.length > 0 && (
          <details>
            <summary>
              Decisions and personal records through {row.selected_date}
            </summary>
            {row.facts.map((f: R) => (
              <div className="profile-record" key={f.id}>
                <strong>{label(f.title)}</strong>
                <p>{readable(f.value)}</p>
                <small>
                  {f.date}
                  {` · ${f.canon} / ${f.operation ?? "unknown"}`}
                </small>
              </div>
            ))}
          </details>
        )}
        {row.undated_facts?.length > 0 && (
          <details>
            <summary>Undated personal reference records</summary>
            <p>
              These references do not establish an office or affiliation on the
              selected date.
            </p>
            {row.undated_facts.map((f: R) => (
              <div className="profile-record" key={f.id}>
                <strong>{label(f.title)}</strong>
                <p>{readable(f.value)}</p>
                <small>{f.canon}</small>
              </div>
            ))}
          </details>
        )}
        <section>
          <h3>Related legislation and events</h3>
          {!row.events.length && !row.legislation.length ? (
            <p className="muted">No records linked.</p>
          ) : (
            <>
              <p className="muted">
                Dated records through {row.selected_date}, linked to or
                mentioning this officeholder; a mention alone does not establish
                authorship or participation.
              </p>
              {row.legislation.map((b: R) => (
                <p key={b.id}>
                  {b.identifier} · {b.title || "Title not reported"} · {b.stage}
                  {b.source_id && (
                    <button className="text-button" onClick={() => source(b)}>
                      View source
                    </button>
                  )}
                </p>
              ))}
              {row.events.map((e: R) => (
                <p key={e.id}>
                  {e.date} · {e.title} · {e.canon} / {e.operation}
                  {e.source_id && (
                    <button className="text-button" onClick={() => source(e)}>
                      View source
                    </button>
                  )}
                </p>
              ))}
            </>
          )}
        </section>
        <details className="profile-evidence">
          <summary>Sources and evidence ({row.evidence.length})</summary>
          <p>
            All recorded sources, including observations and historical terms
            from other dates. The dated sections above establish what is known
            for the selected date.
          </p>
          {row.evidence.length ? (
            row.evidence.map((e: R, i: number) => (
              <div className="profile-record" key={e.id ?? i}>
                {e.excerpt && <blockquote>{e.excerpt}</blockquote>}
                <button className="text-button" onClick={() => source(e)}>
                  {e.filename || "Original source"}
                  {e.line_start ? ` · lines ${e.line_start}–${e.line_end}` : ""}
                </button>
                {e.tier && <small>Evidence tier {e.tier}</small>}
              </div>
            ))
          ) : (
            <p>No source linked to this officeholder yet.</p>
          )}
        </details>
      </div>
    </dialog>
  );
}
