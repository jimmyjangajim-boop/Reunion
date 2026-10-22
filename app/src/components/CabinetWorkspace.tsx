"use client";
import React, { useState } from "react";
import CabinetProfile, { holder } from "./CabinetProfile";
type R = Record<string, any>;
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
}
export default function CabinetWorkspace({
  cabinet,
  onAppoint,
  onOffice,
  onSource,
  leadershipOnly = false,
  onDecision,
  onNavigate,
}: {
  cabinet: R;
  onAppoint: () => void;
  onOffice: () => void;
  onSource: (id: string, line?: number, end?: number) => void;
  leadershipOnly?: boolean;
  onDecision?: () => void;
  onNavigate?: () => void;
}) {
  const [filter, setFilter] = useState(""),
    [tab, setTab] = useState("roster"),
    [selection, setSelection] = useState<{
      id: string;
      view: "person" | "office";
      date: string;
    } | null>(null);
  const setProfile = (r: R, view: "person" | "office" = "person") =>
    setSelection({ id: r.id, view, date: cabinet.date });
  const profile =
    selection?.date === cabinet.date
      ? [
          ...cabinet.leadership,
          ...cabinet.royal,
          ...cabinet.ministries,
          ...cabinet.deputies,
          ...cabinet.institutions,
        ].find((r: R) => r.id === selection?.id)
      : null;
  const matches = (r: R) =>
    [r.ministry, r.office, r.name]
      .join(" ")
      .toLocaleLowerCase()
      .includes(filter.toLocaleLowerCase());
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
      {onNavigate && (
        <div className="directory-navigation">
          <button className="secondary" onClick={onNavigate}>
            {leadershipOnly
              ? "Open Cabinet directory"
              : "Open Government overview"}
          </button>
        </div>
      )}
      {(leadershipOnly
        ? [
            { title: "The Presidency", rows: cabinet.leadership },
            { title: "The Crown", rows: cabinet.royal },
          ]
        : [{ title: "The Presidency", rows: cabinet.leadership }]
      ).map((group) => (
        <section className="government-branch" key={group.title}>
          <h3>{group.title}</h3>{" "}
          <div className="leadership-grid">
            {group.rows.map((r: R) => (
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
                    {r.context}
                    {r.observed_date ? ` · ${r.observed_date}` : ""}
                    {r.status === "disputed" ? " · Disputed" : ""}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
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
              <p className="roster-note">
                All recorded term dates, including unknown dates and non-current
                approval states. This history does not establish the selected
                date's officeholder.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Office</th>
                    <th>Officeholder</th>
                    <th>Appointment</th>
                    <th>Departure</th>
                    <th>Canon / evidence</th>
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
                        <td>
                          {t.canon ?? "Not recorded"}
                          {t.source_id && (
                            <button
                              className="text-button"
                              onClick={() => onSource(t.source_id)}
                            >
                              View appointment source
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!terms.length && (
                <p className="empty-note">No appointment terms recorded.</p>
              )}
            </div>
          ) : (
            <div className="table-scroll cabinet-table cabinet-roster">
              <table>
                <thead>
                  <tr>
                    <th>
                      {tab === "institutions" ? "Institution" : "Ministry"}
                    </th>
                    <th>Officeholder</th>
                    <th>Office</th>
                    <th>Appointment / affiliation</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.filter(matches).map((r: R) => (
                    <tr key={r.id}>
                      <th scope="row">
                        <button
                          className="person-link ministry-link"
                          onClick={() => setProfile(r, "office")}
                        >
                          {r.ministry}
                        </button>
                      </th>
                      <td data-label="Officeholder">
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
                      <td data-label="Office">{r.office}</td>
                      <td data-label="Appointment / affiliation">
                        <span>
                          {r.appointment_date ??
                            "Appointment date not recorded"}
                        </span>
                        <br />
                        <small>
                          {r.affiliation ?? "Affiliation not recorded"}
                        </small>
                      </td>
                      <td data-label="Record">
                        <span>{r.context}</span>
                        <br />
                        <small>{r.observed_date ?? "No dated holder"}</small>
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
        <CabinetProfile
          key={profile.id + cabinet.date}
          row={profile}
          view={selection!.view}
          onView={(view) => setSelection({ ...selection!, view })}
          onClose={() => setSelection(null)}
          onSource={onSource}
        />
      )}
    </div>
  );
}
