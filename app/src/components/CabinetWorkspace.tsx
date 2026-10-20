"use client";
import React, { useEffect, useRef, useState } from "react";
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
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
}
function holder(row: R) {
  return (
    row.name ??
    (row.status === "vacant" ? "Vacant" : "Not established for this date")
  );
}
function Profile({
  row,
  onClose,
  onSource,
}: {
  row: R;
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
          <h2 id="office-profile-title">{holder(row)}</h2>
          <p>{row.ministry}</p>
        </div>
        <button className="secondary" onClick={onClose} autoFocus>
          Close
        </button>
      </header>
      <div className="profile-body">
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
            <h3>Term history</h3>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Officeholder</th>
                    <th>Appointment</th>
                    <th>Departure</th>
                  </tr>
                </thead>
                <tbody>
                  {row.history.map((t: R) => (
                    <tr key={t.id}>
                      <td>{t.person}</td>
                      <td>{t.start_date ?? "Date not established"}</td>
                      <td>{t.end_date ?? "Date not established"}</td>
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
            <summary>Officeholder observations</summary>
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
            <summary>Decisions and personal records</summary>
            {row.facts.map((f: R) => (
              <div className="profile-record" key={f.id}>
                <strong>{label(f.title)}</strong>
                <p>{readable(f.value)}</p>
                <small>
                  {f.date}
                  {f.canon !== "confirmed" ? ` · ${f.canon}` : ""}
                </small>
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
                Records mentioning this officeholder; a mention alone does not
                establish authorship or participation.
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
                  {e.date} · {e.title}
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
export default function CabinetWorkspace({
  cabinet,
  onAppoint,
  onOffice,
  onSource,
  leadershipOnly = false,
  onDecision,
}: {
  cabinet: R;
  onAppoint: () => void;
  onOffice: () => void;
  onSource: (id: string, line?: number, end?: number) => void;
  leadershipOnly?: boolean;
  onDecision?: () => void;
}) {
  const [filter, setFilter] = useState(""),
    [tab, setTab] = useState("roster"),
    [profile, setProfile] = useState<R | null>(null);
  const matches = (r: R) =>
    [r.ministry, r.office, r.name]
      .join(" ")
      .toLocaleLowerCase()
      .includes(filter.toLocaleLowerCase());
  const people = leadershipOnly
    ? [...cabinet.leadership, ...cabinet.royal]
    : cabinet.leadership;
  const rows =
    tab === "institutions"
      ? cabinet.institutions
      : tab === "deputies"
        ? cabinet.deputies
        : cabinet.ministries;
  const allRows = [
    ...cabinet.ministries,
    ...cabinet.deputies,
    ...cabinet.institutions,
  ];
  const terms = [
    ...new Map(
      allRows.flatMap((r: R) => r.history).map((t: R) => [t.id, t]),
    ).values(),
  ] as R[];
  return (
    <div
      className={
        leadershipOnly
          ? "cabinet-workspace government-register"
          : "cabinet-workspace"
      }
    >
      <div className="section-heading">
        <div>
          <h2>
            {leadershipOnly ? "National leadership" : "Council of Ministers"}
          </h2>
          <p className="muted">
            Officeholder records for {cabinet.date}. Open a name for its
            profile.
          </p>
        </div>
        {leadershipOnly ? (
          <button onClick={onDecision}>Record decision</button>
        ) : (
          <button onClick={onAppoint}>Appoint Minister</button>
        )}
      </div>
      <div className="leadership-grid">
        {people.map((r: R) => (
          <article className="office-tile" key={r.id}>
            <span className="office-monogram" aria-hidden="true">
              {r.name ? initials(r.name) : "—"}
            </span>
            <div>
              <span className="office-label">{r.office}</span>
              <button className="office-name" onClick={() => setProfile(r)}>
                {holder(r)}
              </button>
              <small>
                {r.observed_date
                  ? `Recorded ${r.observed_date}`
                  : "Date not established"}
                {r.status === "disputed" ? " · Disputed" : ""}
              </small>
            </div>
          </article>
        ))}
      </div>
      {!leadershipOnly && (
        <>
          <div className="roster-controls">
            <div className="tabs" aria-label="Cabinet views">
              {[
                ["roster", "Ministers"],
                ["deputies", "Deputies"],
                ["institutions", "Institutions"],
                ["history", "Term history"],
              ].map(([id, title]) => (
                <button
                  key={id}
                  className={tab === id ? "selected" : ""}
                  aria-pressed={tab === id}
                  onClick={() => setTab(id)}
                >
                  {title}
                </button>
              ))}
            </div>
            <label className="roster-search">
              <span className="sr-only">Search Cabinet</span>
              <input
                placeholder="Find a ministry or officeholder…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Search Cabinet"
              />
            </label>
            <details className="secondary-actions">
              <summary>More actions</summary>
              <button className="text-button" onClick={onOffice}>
                Create office or institution
              </button>
            </details>
          </div>
          {tab === "history" ? (
            <div className="table-scroll cabinet-table">
              <table>
                <thead>
                  <tr>
                    <th>Office</th>
                    <th>Officeholder</th>
                    <th>Appointment</th>
                    <th>Departure</th>
                  </tr>
                </thead>
                <tbody>
                  {terms
                    .filter((t) =>
                      [t.office, t.person]
                        .join(" ")
                        .toLowerCase()
                        .includes(filter.toLowerCase()),
                    )
                    .map((t) => (
                      <tr key={t.id}>
                        <td>{t.office}</td>
                        <td>{t.person}</td>
                        <td>{t.start_date ?? "Date not established"}</td>
                        <td>{t.end_date ?? "Date not established"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!terms.length && (
                <p className="empty-note">No appointment terms recorded.</p>
              )}
            </div>
          ) : (
            <div className="table-scroll cabinet-table">
              <table>
                <thead>
                  <tr>
                    <th>
                      {tab === "institutions" ? "Institution" : "Ministry"}
                    </th>
                    <th>Officeholder</th>
                    <th>Office</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.filter(matches).map((r: R) => (
                    <tr key={r.id}>
                      <th scope="row">{r.ministry}</th>
                      <td>
                        <button
                          className="person-link"
                          onClick={() => setProfile(r)}
                        >
                          {holder(r)}
                        </button>
                        {r.status === "disputed" && (
                          <small className="roster-uncertainty">
                            Disputed officeholder
                          </small>
                        )}
                      </td>
                      <td>{r.office}</td>
                      <td>
                        <span>{r.observed_date ?? "No dated holder"}</span>
                        <button
                          className="text-button row-detail"
                          onClick={() => setProfile(r)}
                        >
                          Profile & history →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.filter(matches).length && (
                <p className="empty-note">
                  {rows.length
                    ? "No matching records."
                    : tab === "deputies"
                      ? "No deputy ministers recorded."
                      : tab === "institutions"
                        ? "No institutions recorded."
                        : "No ministries recorded."}
                </p>
              )}
            </div>
          )}
          <p className="roster-note">
            Unknown officeholders are not vacancies. Recorded observations and
            appointment dates remain separate.
          </p>
        </>
      )}
      {profile && (
        <Profile
          key={profile.id}
          row={profile}
          onClose={() => setProfile(null)}
          onSource={onSource}
        />
      )}
    </div>
  );
}
