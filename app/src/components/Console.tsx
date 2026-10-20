"use client";
import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
type R = Record<string, any>;
const nav = [
  ["Dashboard", "◈"],
  ["Historical Archive", "▤"],
  ["Government", "♜"],
  ["Parliament", "▥"],
  ["Cabinet & Institutions", "▦"],
  ["Armed Forces", "⚑"],
  ["Military Map", "⌖"],
  ["Economy & Treasury", "▧"],
  ["Territory & Population", "◎"],
  ["Foreign Relations", "◇"],
  ["Domestic Security", "◉"],
  ["Events & Time", "◷"],
  ["Canon Review Center", "✓"],
  ["Imports & Backups", "⇅"],
];
const categories = [
  "history",
  "political",
  "military",
  "economic",
  "diplomatic",
  "domestic",
  "territory",
  "constitutional",
];
const operations = [
  "unknown",
  "proposal",
  "planned",
  "approved",
  "ordered",
  "contracted",
  "in production",
  "delivered",
  "accepted",
  "operational",
  "completed",
  "canceled",
  "simulated",
  "damaged",
  "under repair",
  "retired",
  "lost",
];
const dateKinds = [
  "day",
  "month",
  "year",
  "decade",
  "range",
  "before",
  "after",
  "relative",
  "unknown",
];
function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
function dateLabel(row: R) {
  try {
    return JSON.parse(row.date_json).label;
  } catch {
    return row.date ?? "Unknown";
  }
}
function dateFrom(f: R, prefix = "") {
  return {
    precision: f[prefix + "precision"] || "unknown",
    label: f[prefix + "date_label"] || "Unknown",
    earliest: f[prefix + "earliest"] || null,
    latest: f[prefix + "latest"] || null,
    relation: f[prefix + "relation"] || null,
  };
}
function Field({
  name,
  label,
  type = "text",
  options,
  required = false,
  value,
  help,
}: {
  name: string;
  label: string;
  type?: string;
  options?: (string | { value: string; label: string })[];
  required?: boolean;
  value?: any;
  help?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      {options ? (
        <select
          aria-label={label}
          name={name}
          defaultValue={value ?? ""}
          required={required}
        >
          <option value="">Select…</option>
          {options.map((o) =>
            typeof o === "string" ? (
              <option key={o}>{o}</option>
            ) : (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ),
          )}
        </select>
      ) : type === "textarea" ? (
        <textarea
          aria-label={label}
          name={name}
          rows={4}
          defaultValue={value}
          required={required}
        />
      ) : (
        <input
          aria-label={label}
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          min={type === "number" ? 0 : undefined}
          step={type === "number" ? "1" : undefined}
        />
      )}{" "}
      {help && <small>{help}</small>}
    </label>
  );
}
function Dates({ prefix = "" }: { prefix?: string }) {
  return (
    <div className="form-grid">
      <Field
        name={prefix + "precision"}
        label="Date precision"
        options={dateKinds}
        value="unknown"
      />
      <Field
        name={prefix + "date_label"}
        label="Historical date or description"
        help="1992-10-03 · 1992-10 · 1992 · 1970s · after appointment"
      />
      <Field
        name={prefix + "earliest"}
        label="Earliest bound (optional)"
        help="Year, month, or day; leave unknown bounds empty"
      />
      <Field name={prefix + "latest"} label="Latest bound (optional)" />
      <Field name={prefix + "relation"} label="Relative event (optional)" />
    </div>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
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
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v ?? <span className="muted">Unknown</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty>No records yet. Add a sourced record when one is available.</Empty>
  );
}
export default function Console() {
  const [section, setSection] = useState("Dashboard"),
    [date, setDate] = useState("1992-10-03"),
    [data, setData] = useState<R | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [menu, setMenu] = useState(false),
    [filter, setFilter] = useState(""),
    [category, setCategory] = useState("all"),
    [tab, setTab] = useState("records"),
    [reviewTab, setReviewTab] = useState("conflict"),
    [issueState, setIssueState] = useState("open"),
    [source, setSource] = useState<R | null>(null),
    [issue, setIssue] = useState<R | null>(null),
    [form, setForm] = useState(""),
    [searchText, setSearchText] = useState(""),
    [results, setResults] = useState<R | null>(null),
    [compareDate, setCompareDate] = useState("1993-10-11"),
    [comparison, setComparison] = useState<R[] | null>(null),
    [reviewAction, setReviewAction] = useState("unresolved"),
    [preview, setPreview] = useState<R | null>(null);
  async function refresh() {
    const r = await fetch("/api/rnas?date=" + date);
    const json = await r.json();
    if (!r.ok) throw Error(json.error);
    setData(json);
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [date]);
  useEffect(() => {
    if (source?.line)
      document
        .getElementById("line-" + source.line)
        ?.scrollIntoView({ block: "center" });
  }, [source]);
  function go(s: string) {
    setSection(s);
    setMenu(false);
    setFilter("");
    setCategory("all");
    setResults(null);
    setComparison(null);
    setError("");
  }
  async function post(payload: R) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/rnas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw Error(j.error);
      await refresh();
      setNotice("Saved. Earlier evidence remains available.");
      return j.result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function openSource(id: string, line?: number, end?: number) {
    setError("");
    const r = await fetch("/api/rnas?view=source&id=" + id);
    const j = await r.json();
    if (r.ok) setSource({ ...j, line, end });
    else setError(j.error);
  }
  async function openIssue(id: string) {
    const r = await fetch("/api/rnas?view=issue&id=" + id);
    const j = await r.json();
    if (r.ok) {
      setIssue(j);
      setReviewAction("unresolved");
    } else setError(j.error);
  }
  const sourceLink = (r: R) =>
    r.source_id ? (
      <button
        className="text-button"
        onClick={() => openSource(r.source_id, r.line_start, r.line_end)}
      >
        {r.filename ?? "View source"}
        {r.line_start ? ` · L${r.line_start}–${r.line_end}` : ""}
      </button>
    ) : (
      <span className="muted">Source unknown</span>
    );
  const factCard = (r: R) => (
    <article className="record" key={r.id}>
      <div className="split">
        <div>
          <span className="eyebrow">{r.entity_name}</span>
          <h3>{r.predicate}</h3>
        </div>
        <Badge
          tone={
            r.canon === "confirmed"
              ? "green"
              : r.canon === "disputed"
                ? "red"
                : ""
          }
        >
          {r.canon}
        </Badge>
      </div>
      <p>{r.value}</p>
      <div className="tags">
        <Badge>{r.operation}</Badge>
        <span>{dateLabel(r)}</span>
        <span>Evidence tier {r.tier}</span>
      </div>
      {r.notes && <p className="muted small">{r.notes}</p>}
      {r.evidence?.map((e: R) => (
        <div key={e.id}>{sourceLink(e)}</div>
      ))}
    </article>
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as R;
    try {
      let payload: R = { ...f, action: form };
      if (form === "assertion" || form === "timeline")
        payload.date = dateFrom(f);
      if (form === "assertion" && !f.source_id) {
        payload.line_start = 1;
        payload.line_end = 1;
      }
      if (form === "review") {
        payload = {
          ...f,
          action: "review",
          issue_id: issue!.id,
          date: dateFrom(f),
          date_b: dateFrom(f, "b_"),
        };
      }
      if (["appointment", "project", "battle", "treaty"].includes(form))
        payload.date_info = dateFrom(f);
      const result = await post(payload);
      if (["parse_event", "advance_preview"].includes(form)) {
        setPreview(result);
        setForm("");
        return;
      }
      setForm("");
      if (form === "review") {
        setIssue(null);
      }
    } catch {}
  }
  if (!data)
    return (
      <main className="loading">
        <div className="seal">R</div>
        <h1>Reunion National Administration</h1>
        <p>{error || "Opening the national archive…"}</p>
      </main>
    );
  const d = data;
  const selected = d.snapshot as R[];
  const get = (entity: string, predicate: string) => {
    const record = selected.find(
      (r) => r.entity_id === entity && r.predicate === predicate,
    );
    return record?.canon === "disputed"
      ? { ...record, value: "Disputed: " + record.value }
      : record;
  };
  const widget = (
    title: string,
    entity: string,
    predicate: string,
    target: string,
  ) => {
    const r = get(entity, predicate);
    return (
      <button className="stat" onClick={() => go(target)}>
        <span className="eyebrow">{title}</span>
        <strong>
          {r?.canon === "disputed"
            ? "Disputed"
            : (r?.value ?? "Unknown for this date")}
        </strong>
        <span className="stat-foot">
          {r ? `${r.canon} · ${dateLabel(r)}` : "No dated evidence"}{" "}
          <span>↗</span>
        </span>
      </button>
    );
  };
  const openIssues = d.issues.filter((i: R) => i.state === "open");
  const entityOptions = d.entities.map((e: R) => ({
    value: e.id,
    label: e.name + " · " + e.kind,
  }));
  const sourceOptions = d.sources.map((s: R) => ({
    value: s.id,
    label: `[${s.tier}] ${s.filename}`,
  }));
  const unitOptions = d.units.map((u: R) => ({ value: u.id, label: u.name }));
  const locationOptions = d.locations.map((l: R) => ({
    value: l.id,
    label: l.name,
  }));
  const filtered = d.records.filter(
    (r: R) =>
      (category === "all" || r.category === category) &&
      [r.entity_name, r.predicate, r.value, r.canon]
        .join(" ")
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  const toolbar = (
    <div className="toolbar">
      <input
        aria-label="Filter records"
        placeholder="Filter names, claims, records…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <select
        aria-label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <button onClick={() => setForm("assertion")}>+ Sourced fact</button>
      <button className="secondary" onClick={() => setForm("entity")}>
        + Entity
      </button>
    </div>
  );
  const categoriesView = (cats: string[]) => (
    <>
      {toolbar}
      <div className="record-grid">
        {filtered.filter((r: R) => cats.includes(r.category)).map(factCard)}
      </div>
    </>
  );
  return (
    <div className="app">
      <aside className={menu ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("Dashboard");
          }}
        >
          <div className="seal">R</div>
          <div>
            REUNION<small>NATIONAL ADMINISTRATION</small>
          </div>
        </a>
        <div className="sidebar-label">STATE RECORDS</div>
        <nav>
          {nav.map(([name, icon], i) => (
            <button
              key={name}
              className={section === name ? "active" : ""}
              onClick={() => go(name)}
            >
              <span className="nav-icon">{icon}</span>
              {name}
              {name === "Canon Review Center" && <b>{openIssues.length}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          LOCAL ARCHIVE<small>Canon changes require your decision.</small>
          <small>RNAS / v0.1</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-toggle secondary"
            aria-label="Toggle navigation"
            onClick={() => setMenu(!menu)}
          >
            ☰
          </button>
          <div className="breadcrumb">
            National records <span>/</span> {section}
          </div>
          <form
            className="global-search"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await fetch(
                "/api/rnas?view=search&q=" + encodeURIComponent(searchText),
              );
              setResults(await r.json());
            }}
          >
            <input
              aria-label="Search all sources"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search the archive…"
            />
            <button className="secondary" type="submit">
              Search
            </button>
          </form>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">
                REPUBLIC OF REUNION / NATIONAL RECORD
              </span>
              <h1>
                {section === "Dashboard"
                  ? "The state of the republic"
                  : section}
              </h1>
              <p>
                {section === "Dashboard"
                  ? "A dated view of the country. Every claim keeps its evidence."
                  : "Historical records, original evidence, and explicit decisions."}
              </p>
            </div>
            <label className="date-selector">
              HISTORICAL DATE
              <input
                aria-label="Historical Date Selector"
                type="date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
              />
              <small>In-world date · recorded dates are separate</small>
            </label>
          </div>
          {error && (
            <div role="alert" className="alert error">
              <strong>Could not save</strong>
              <p>{error}</p>
              <button className="text-button" onClick={() => setError("")}>
                Dismiss
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          )}
          {results ? (
            <>
              <div className="section-heading">
                <h2>Search results</h2>
                <button className="secondary" onClick={() => setResults(null)}>
                  Close search
                </button>
              </div>
              <p className="muted">
                Search covers original sources, secondary recovery notes, and
                user entries.
              </p>
              {results.entities?.map((r: R) => (
                <div className="record" key={r.id}>
                  <h3>{r.name}</h3>
                  <p>{r.description}</p>
                  <Badge>{r.kind}</Badge>
                </div>
              ))}
              {results.results?.length ? (
                results.results.map((r: R, i: number) => (
                  <article className="record" key={i}>
                    <div className="split">
                      <h3>{sourceLink(r)}</h3>
                      <Badge>
                        Tier {r.tier} · {r.kind}
                      </Badge>
                    </div>
                    <pre className="excerpt">{r.excerpt}</pre>
                  </article>
                ))
              ) : (
                <Empty>No source matches.</Empty>
              )}
            </>
          ) : (
            <>
              {section === "Dashboard" && (
                <>
                  <div className="date-band">
                    <div>
                      <span className="status-dot" />
                      <strong>
                        {new Date(date + "T12:00:00").toLocaleDateString(
                          "en-US",
                          { day: "numeric", month: "long", year: "numeric" },
                        )}
                      </strong>
                      <span>
                        {date.startsWith("1725")
                          ? "Kingdom campaign baseline"
                          : date === "1992-10-03"
                            ? "Authoritative national baseline"
                            : date.startsWith("1993")
                              ? "Later historical record"
                              : "Historical reconstruction"}
                      </span>
                    </div>
                    <Badge>{selected.length} dated claims</Badge>
                  </div>
                  {date !== "1992-10-03" && (
                    <div className="alert">
                      Baseline observations are specific to 3 October 1992. Gaps
                      on this date remain unknown.{" "}
                      <button
                        className="text-button"
                        onClick={() => {
                          go("Historical Archive");
                          setTab("timeline");
                        }}
                      >
                        Open historical timeline →
                      </button>
                    </div>
                  )}
                  <div className="stats-grid">
                    {widget("PRESIDENT", "reunion", "President", "Government")}
                    {widget(
                      "VICE PRESIDENT",
                      "reunion",
                      "Vice President",
                      "Government",
                    )}
                    {widget(
                      "REIGNING MONARCH",
                      "crown",
                      "Reigning monarch",
                      "Government",
                    )}
                    {widget(
                      "PARLIAMENT",
                      "parliament",
                      "Seats in practice",
                      "Parliament",
                    )}
                  </div>
                  <div className="dashboard-grid">
                    <section className="panel">
                      <div className="section-heading">
                        <h2>Economic position</h2>
                        <button
                          className="text-button"
                          onClick={() => go("Economy & Treasury")}
                        >
                          Treasury →
                        </button>
                      </div>
                      <div className="metric-list">
                        {[
                          "Nominal GDP",
                          "Annual revenue",
                          "Annual expenditure envelope",
                          "Annual deficit",
                          "Public debt",
                          "Treasury cash balance",
                        ].map((p) => (
                          <div key={p}>
                            <span>{p}</span>
                            <strong>
                              {get("treasury", p)?.value ?? "Unknown"}
                            </strong>
                          </div>
                        ))}
                      </div>
                      <p className="footnote">
                        Budget envelopes are separate from disbursements and
                        actual expenditure.
                      </p>
                    </section>
                    <section className="panel review-callout">
                      <div className="section-heading">
                        <h2>Canon needs attention</h2>
                        <Badge tone="amber">{openIssues.length} open</Badge>
                      </div>
                      <p>
                        Unresolved questions stay visible. They do not block
                        other records.
                      </p>
                      {openIssues.slice(0, 3).map((i: R) => (
                        <button
                          className="issue-short"
                          key={i.id}
                          onClick={() => openIssue(i.id)}
                        >
                          <Badge>{i.kind}</Badge>
                          <span>{i.title}</span>
                          <span>↗</span>
                        </button>
                      ))}
                      <button onClick={() => go("Canon Review Center")}>
                        Open review center
                      </button>
                    </section>
                  </div>
                  <div className="dashboard-grid">
                    <section className="panel">
                      <div className="section-heading">
                        <h2>Armed forces</h2>
                        <button
                          className="text-button"
                          onClick={() => go("Armed Forces")}
                        >
                          Command record →
                        </button>
                      </div>
                      <div className="metric-list">
                        {[
                          "Active combat and direct support",
                          "Combat aircraft",
                          "Tube artillery",
                          "Readiness and sustainment",
                        ].map((p) => (
                          <div key={p}>
                            <span>{p}</span>
                            <strong>
                              {get("armed-forces", p)?.value ??
                                "Unknown for this date"}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="panel">
                      <div className="section-heading">
                        <h2>Government & territory</h2>
                        <button
                          className="text-button"
                          onClick={() => go("Government")}
                        >
                          Government →
                        </button>
                      </div>
                      <div className="metric-list">
                        <div>
                          <span>Finance Minister</span>
                          <strong>
                            {get("finance", "Minister")?.value ?? "Unknown"}
                          </strong>
                        </div>
                        <div>
                          <span>Population</span>
                          <strong>
                            {get("reunion", "Population")?.value ?? "Unknown"}
                          </strong>
                        </div>
                        <div>
                          <span>Government support</span>
                          <strong>
                            {get("parliament", "Coalition")?.value ?? "Unknown"}
                          </strong>
                        </div>
                        <div>
                          <span>Cabinet vacancies</span>
                          <strong>Not established</strong>
                        </div>
                        <div>
                          <span>Royal heir</span>
                          <strong>
                            {get("crown", "Heir")?.value ??
                              "Unknown for this date; Zo III designation is undated"}
                          </strong>
                        </div>
                      </div>
                    </section>
                  </div>
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Historical comparison</h2>
                      <div className="inline-controls">
                        <input
                          aria-label="Compare historical date"
                          type="date"
                          value={compareDate}
                          onChange={(e) => setCompareDate(e.target.value)}
                        />
                        <button
                          className="secondary"
                          onClick={async () => {
                            const r = await fetch(
                              "/api/rnas?date=" + compareDate,
                            );
                            const j = await r.json();
                            setComparison(j.snapshot);
                          }}
                        >
                          Compare dates
                        </button>
                      </div>
                    </div>
                    {comparison && (
                      <Table
                        headers={["Claim", date, compareDate]}
                        rows={[
                          ...new Set(
                            [...selected, ...comparison].map(
                              (r) => r.entity_id + "|" + r.predicate,
                            ),
                          ),
                        ].map((k) => {
                          const a = selected.find(
                              (r) => r.entity_id + "|" + r.predicate === k,
                            ),
                            b = comparison.find(
                              (r) => r.entity_id + "|" + r.predicate === k,
                            );
                          return [
                            (a ?? b)!.predicate,
                            a?.value ?? "Unknown",
                            b?.value ?? "Unknown",
                          ];
                        })}
                      />
                    )}
                  </section>
                </>
              )}
              {section === "Historical Archive" && (
                <>
                  <div className="tabs">
                    {["records", "sources", "timeline"].map((t) => (
                      <button
                        key={t}
                        className={tab === t ? "selected" : ""}
                        onClick={() => setTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {toolbar}
                  {tab === "records" && (
                    <>
                      <p className="muted">
                        {filtered.length} normalized claims. Secondary recovery
                        remains provisional unless explicitly adjudicated.
                      </p>
                      <div className="record-grid">
                        {filtered.map(factCard)}
                      </div>
                    </>
                  )}
                  {tab === "sources" && (
                    <Table
                      headers={[
                        "Original source",
                        "Evidence rank",
                        "Kind",
                        "Bytes",
                        "SHA-256",
                      ]}
                      rows={d.sources
                        .filter((s: R) =>
                          s.filename
                            .toLowerCase()
                            .includes(filter.toLowerCase()),
                        )
                        .map((s: R) => [
                          <button
                            className="text-button"
                            onClick={() => openSource(s.id)}
                          >
                            {s.filename}
                          </button>,
                          "Tier " + s.tier,
                          s.kind,
                          s.bytes,
                          <code className="hash" title={s.sha256}>
                            {s.sha256.slice(0, 16)}…
                          </code>,
                        ])}
                    />
                  )}{" "}
                  {tab === "timeline" && (
                    <>
                      <div className="section-heading">
                        <h2>Historical timeline</h2>
                        <button onClick={() => setForm("timeline")}>
                          + Timeline entry
                        </button>
                      </div>
                      <div className="timeline">
                        {d.timeline
                          .filter(
                            (t: R) =>
                              (category === "all" || t.category === category) &&
                              t.title
                                .toLowerCase()
                                .includes(filter.toLowerCase()),
                          )
                          .sort((a: R, b: R) =>
                            dateLabel(a).localeCompare(dateLabel(b)),
                          )
                          .map((t: R) => (
                            <article key={t.id}>
                              <div className="timeline-date">
                                {dateLabel(t)}
                              </div>
                              <div className="timeline-body">
                                <div className="tags">
                                  <Badge>{t.category}</Badge>
                                  <Badge
                                    tone={
                                      t.canon === "confirmed" ? "green" : ""
                                    }
                                  >
                                    {t.canon}
                                  </Badge>
                                  <span>Tier {t.tier}</span>
                                </div>
                                <h3>{t.title}</h3>
                                <p className="muted small">{t.note}</p>
                                {sourceLink(t)}
                              </div>
                            </article>
                          ))}
                      </div>
                    </>
                  )}
                </>
              )}
              {section === "Canon Review Center" && (
                <>
                  <div className="alert">
                    The 400-seat Parliament and the constitutional cap are both
                    preserved. Resolving a review issue never amends the
                    constitution automatically.
                  </div>
                  <div className="toolbar">
                    <div className="tabs">
                      {["conflict", "missing"].map((t) => (
                        <button
                          key={t}
                          className={reviewTab === t ? "selected" : ""}
                          onClick={() => setReviewTab(t)}
                        >
                          {t === "conflict"
                            ? "Contradictions"
                            : "Missing information"}{" "}
                          (
                          {
                            d.issues.filter(
                              (i: R) => i.kind === t && i.state === "open",
                            ).length
                          }
                          )
                        </button>
                      ))}
                    </div>
                    <select
                      aria-label="Issue status"
                      value={issueState}
                      onChange={(e) => setIssueState(e.target.value)}
                    >
                      {[
                        "open",
                        "postponed",
                        "resolved",
                        "dismissed",
                        "all",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => post({ action: "detect" }).catch(() => {})}
                    >
                      Scan normalized records
                    </button>
                  </div>
                  <div className="issue-list">
                    {d.issues
                      .filter(
                        (i: R) =>
                          i.kind === reviewTab &&
                          (issueState === "all" || i.state === issueState),
                      )
                      .map((i: R) => (
                        <article className="issue-row" key={i.id}>
                          <div>
                            <div className="tags">
                              <span className="mono">{i.id}</span>
                              <Badge
                                tone={i.priority === "HIGH" ? "amber" : ""}
                              >
                                {i.priority}
                              </Badge>
                              <Badge>{i.state}</Badge>
                              <span>{i.category}</span>
                            </div>
                            <button
                              className="issue-title"
                              onClick={() => openIssue(i.id)}
                            >
                              {i.title}
                            </button>
                            <p>{i.question}</p>
                          </div>
                          <div className="issue-actions">
                            <button onClick={() => openIssue(i.id)}>
                              Review →
                            </button>
                            <button
                              className="text-button"
                              onClick={async () => {
                                try {
                                  await post({
                                    action: "review",
                                    issue_id: i.id,
                                    resolution: "postpone",
                                    explanation: "Postponed for later review",
                                  });
                                } catch {}
                              }}
                            >
                              Postpone 7 days
                            </button>
                          </div>
                        </article>
                      ))}
                  </div>
                </>
              )}
              {section === "Government" && (
                <>
                  <div className="section-heading">
                    <h2>Presidency & royal register</h2>
                    <button onClick={() => setForm("assertion")}>
                      + Record decision
                    </button>
                  </div>
                  <div className="record-grid">
                    {d.records
                      .filter((r: R) =>
                        [
                          "President",
                          "Vice President",
                          "Reigning monarch",
                          "Heir",
                          "Designation",
                        ].includes(r.predicate),
                      )
                      .map(factCard)}
                  </div>
                  <section className="panel">
                    <h2>Royal identity warning</h2>
                    <p>
                      King Zo III and the young heir Zo III have different
                      permanent IDs. Their identical designation remains
                      unresolved.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => openIssue("C001")}
                    >
                      Review naming issue →
                    </button>
                  </section>
                </>
              )}
              {section === "Cabinet & Institutions" && (
                <>
                  <div className="section-heading">
                    <h2>Ministerial succession</h2>
                    <button onClick={() => setForm("appointment")}>
                      + Appoint minister
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("office")}
                    >
                      + Ministry / office
                    </button>
                  </div>
                  <Table
                    headers={[
                      "Office",
                      "Person",
                      "Sequence",
                      "Appointment / departure",
                      "Canon",
                      "Evidence",
                    ]}
                    rows={d.appointments.map((a: R) => [
                      a.office,
                      a.person,
                      a.sequence ?? "Unspecified",
                      a.start_date
                        ? `${a.start_date} → ${a.end_date ?? "No recorded departure"}`
                        : dateLabel(a),
                      <Badge>{a.canon}</Badge>,
                      sourceLink(a),
                    ])}
                  />
                  <div className="alert">
                    Rehn’s death and Curro’s succession are confirmed. Exact
                    appointment dates remain unknown. A sequence does not
                    establish a calendar date.
                  </div>
                  {categoriesView(["political", "constitutional"])}
                </>
              )}
              {section === "Parliament" && (
                <>
                  <div className="section-heading">
                    <h2>Assembly record</h2>
                    <div className="inline-controls">
                      <button onClick={() => setForm("bill")}>+ Bill</button>
                      <button
                        className="secondary"
                        onClick={() => setForm("vote")}
                      >
                        Record vote
                      </button>
                    </div>
                  </div>
                  {d.chambers.map((c: R) => (
                    <section key={c.id} className="panel">
                      <div className="split">
                        <h2>{c.actual_seats} seats in practice</h2>
                        <Badge tone="red">
                          Constitutional maximum {c.legal_max}
                        </Badge>
                      </div>
                      <p className="muted">
                        Snapshot {c.date}. Occupied seats:{" "}
                        {c.occupied_seats ?? "not separately documented"}.{" "}
                        {c.session_status}.
                      </p>
                      <div className="seat-bar">
                        {d.parties
                          .filter((p: R) => p.chamber_id === c.id)
                          .map((p: R, i: number) => (
                            <div
                              key={p.id}
                              title={`${p.party}: ${p.seats}`}
                              style={{
                                flex: p.seats,
                                background: [
                                  "#374d72",
                                  "#b36c54",
                                  "#b3985b",
                                  "#55675d",
                                  "#8795a9",
                                  "#b4b8bd",
                                ][i % 6],
                              }}
                            />
                          ))}
                      </div>
                      <Table
                        headers={[
                          "Party / bloc",
                          "Seats",
                          "Government support",
                        ]}
                        rows={d.parties
                          .filter((p: R) => p.chamber_id === c.id)
                          .map((p: R) => [p.party, p.seats, p.support])}
                      />
                    </section>
                  ))}
                  <h2>Legislation</h2>
                  <Table
                    headers={[
                      "Identifier",
                      "Bill",
                      "Stage",
                      "Introduction",
                      "Effective",
                    ]}
                    rows={d.bills.map((b: R) => [
                      b.identifier,
                      b.title,
                      b.stage,
                      b.introduced_date,
                      b.effective_date,
                    ])}
                  />
                  <h2>Vote history</h2>
                  <Table
                    headers={[
                      "Date",
                      "Yes",
                      "No",
                      "Abstain",
                      "Absent",
                      "Vacant",
                      "Result / configured rule",
                    ]}
                    rows={d.votes.map((v: R) => [
                      v.date,
                      v.yes,
                      v.no,
                      v.abstain,
                      v.absent,
                      v.vacancies,
                      `${v.result}; ${v.rule_source}`,
                    ])}
                  />
                </>
              )}
              {section === "Armed Forces" && (
                <>
                  <div className="toolbar">
                    <button onClick={() => setForm("unit")}>
                      + Military unit
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("unit_state")}
                    >
                      Update unit / hierarchy
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("movement")}
                    >
                      Order movement
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("battle")}
                    >
                      Record battle
                    </button>
                  </div>
                  <section className="panel">
                    <h2>Order of battle · {date}</h2>
                    <p className="muted">
                      Only dated unit-state observations are shown. Undocumented
                      subsequent strength remains unknown.
                    </p>
                    <Table
                      headers={[
                        "Formation",
                        "Branch / type",
                        "Parent",
                        "Personnel",
                        "Commander",
                        "Readiness",
                      ]}
                      rows={d.units.map((u: R) => {
                        const s = d.unitStates.find(
                          (r: R) => r.unit_id === u.id && r.date === date,
                        );
                        return [
                          u.name,
                          `${u.branch} / ${u.unit_type}`,
                          s?.parent_id
                            ? d.units.find((r: R) => r.id === s.parent_id)?.name
                            : "Unknown / independent not established",
                          s?.personnel_low
                            ? s.personnel_high
                              ? `${s.personnel_low.toLocaleString()}–${s.personnel_high.toLocaleString()}`
                              : `${s.personnel_low.toLocaleString()}+`
                            : "Unknown",
                          s?.commander,
                          s?.readiness,
                        ];
                      })}
                    />
                  </section>
                  <h2>Procurement batches</h2>
                  <Table
                    headers={[
                      "Equipment",
                      "Snapshot",
                      "Ordered",
                      "Delivered",
                      "Operational",
                      "Status",
                    ]}
                    rows={d.procurement.map((p: R) => [
                      p.name,
                      p.date,
                      p.ordered,
                      p.delivered,
                      p.operational,
                      <Badge>{p.operation}</Badge>,
                    ])}
                  />
                  <div className="section-heading">
                    <h2>Individually tracked assets</h2>
                    <button
                      className="secondary"
                      onClick={() => setForm("asset")}
                    >
                      + Asset
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("assignment")}
                    >
                      Assign asset
                    </button>
                  </div>
                  <Table
                    headers={["Asset", "Type", "State"]}
                    rows={d.assets.map((a: R) => [a.name, a.type, a.operation])}
                  />
                  <Table
                    headers={["Asset", "Unit", "From", "Through"]}
                    rows={d.assignments.map((a: R) => [
                      a.asset,
                      a.unit,
                      a.start_date,
                      a.end_date ?? "Open assignment",
                    ])}
                  />
                  <div className="section-heading">
                    <h2>Battle reports</h2>
                    <button
                      className="secondary"
                      onClick={() => setForm("casualty")}
                    >
                      + Casualty report
                    </button>
                  </div>
                  <Table
                    headers={["Battle", "Date", "Outcome", "Canon"]}
                    rows={d.battles.map((b: R) => [
                      b.name,
                      dateLabel(b),
                      b.outcome,
                      <Badge>{b.canon}</Badge>,
                    ])}
                  />
                  <Table
                    headers={[
                      "Battle",
                      "Report group",
                      "Category",
                      "Count",
                      "Canon",
                    ]}
                    rows={d.casualties.map((c: R) => [
                      d.battles.find((b: R) => b.id === c.battle_id)?.name,
                      c.report_group,
                      c.category,
                      c.count,
                      c.canon,
                    ])}
                  />
                </>
              )}
              {section === "Military Map" && (
                <>
                  <div className="section-heading">
                    <h2>Deployment register</h2>
                    <button onClick={() => setForm("movement")}>
                      + Movement order
                    </button>
                  </div>
                  <div className="map-placeholder">
                    <div className="map-grid" />
                    <div>
                      <span className="eyebrow">
                        GEOGRAPHIC EVIDENCE REQUIRED
                      </span>
                      <h2>Named locations, no guessed coordinates.</h2>
                      <p>
                        No verified operational map or coordinates were
                        supplied. The deployment register works with named
                        places. Interactive markers and map annotation remain
                        planned.
                      </p>
                    </div>
                  </div>
                  <Table
                    headers={[
                      "Unit",
                      "Location",
                      "Order date",
                      "State",
                      "Completed",
                      "Treaty warning",
                      "Action",
                    ]}
                    rows={d.movements.map((m: R) => [
                      m.unit,
                      m.location,
                      m.date,
                      <Badge>{m.operation}</Badge>,
                      m.completed_date,
                      m.warning,
                      m.operation === "ordered" ? (
                        <button
                          className="secondary"
                          onClick={() => {
                            setForm("complete_movement");
                            setPreview(m);
                          }}
                        >
                          Confirm arrival
                        </button>
                      ) : null,
                    ])}
                  />
                  <h2>Completed deployment history</h2>
                  <Table
                    headers={["Unit", "Location", "Arrival", "Mission"]}
                    rows={d.movements
                      .filter(
                        (m: R) =>
                          m.operation === "completed" &&
                          m.completed_date <= date,
                      )
                      .map((m: R) => [
                        m.unit,
                        m.location,
                        m.completed_date,
                        m.mission,
                      ])}
                  />
                </>
              )}
              {section === "Economy & Treasury" && (
                <>
                  <div className="toolbar">
                    <button onClick={() => setForm("budget")}>
                      + Appropriation
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("ledger")}
                    >
                      + Ledger entry
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("project")}
                    >
                      + Project
                    </button>
                  </div>
                  <div className="record-grid">
                    {selected
                      .filter((r: R) => r.category === "economic")
                      .map(factCard)}
                  </div>
                  <div className="alert">
                    The reported $250B expenditure envelope and $255B allocation
                    list conflict. Project costs are not assumed appropriations;
                    subprojects are not summed into a national total.
                  </div>
                  <h2>Appropriation ledger</h2>
                  <Table
                    headers={[
                      "Budget / program",
                      "Fiscal year",
                      "Appropriated",
                      "Committed entries",
                      "Disbursed entries",
                      "Actual entries",
                    ]}
                    rows={d.budgets.map((b: R) => [
                      b.name,
                      b.fiscal_year,
                      `${b.currency} ${b.appropriated.toLocaleString()}`,
                      ...["committed", "disbursed", "actual"].map((stage) =>
                        d.ledger
                          .filter(
                            (l: R) =>
                              l.budget_id === b.id &&
                              l.stage === stage &&
                              l.date <= date,
                          )
                          .reduce((sum: number, l: R) => sum + l.amount, 0)
                          .toLocaleString(),
                      ),
                    ])}
                  />
                  <p className="footnote">
                    Commitments, disbursements, and actuals are separate stage
                    totals, never added together as spending. Transfers do not
                    count as expenditure.
                  </p>
                  <Table
                    headers={[
                      "Date",
                      "Stage",
                      "Amount",
                      "Memo",
                      "Authorization override",
                    ]}
                    rows={d.ledger.map((l: R) => [
                      l.date,
                      l.stage,
                      l.amount.toLocaleString(),
                      l.memo,
                      l.override_reason,
                    ])}
                  />
                  <h2>Economic project snapshots</h2>
                  <Table
                    headers={[
                      "Project",
                      "Observed",
                      "Planned cost",
                      "Approved",
                      "Paid",
                      "Committed",
                      "State / evidence",
                    ]}
                    rows={d.projects.map((p: R) => [
                      p.name,
                      dateLabel(p),
                      p.planned?.toLocaleString(),
                      p.approved?.toLocaleString(),
                      p.paid?.toLocaleString(),
                      p.committed?.toLocaleString(),
                      <>
                        {p.operation}
                        <br />
                        {sourceLink(p)}
                      </>,
                    ])}
                  />
                </>
              )}
              {section === "Territory & Population" && (
                <>
                  <div className="section-heading">
                    <h2>Geographic register</h2>
                    <button onClick={() => setForm("location")}>
                      + Location
                    </button>
                  </div>
                  <Table
                    headers={[
                      "Place",
                      "Type",
                      "Sovereignty",
                      "Practical control",
                      "Administration",
                      "Coordinates",
                    ]}
                    rows={d.locations.map((l: R) => [
                      l.name,
                      l.kind,
                      l.sovereignty,
                      l.control,
                      l.administration,
                      l.latitude !== null
                        ? `${l.latitude}, ${l.longitude}`
                        : "Not supplied",
                    ])}
                  />
                  {categoriesView(["territory"])}
                  <section className="panel">
                    <h2>Šibenik demilitarized zone</h2>
                    <p>
                      The frontier lies just north of Šibenik. The area is a
                      legal and military restriction. Width, boundaries, and
                      effective date remain unresolved.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => openIssue("C004")}
                    >
                      Resolve missing boundary data →
                    </button>
                  </section>
                </>
              )}
              {section === "Foreign Relations" && (
                <>
                  <div className="section-heading">
                    <h2>Treaty register</h2>
                    <button onClick={() => setForm("treaty")}>+ Treaty</button>
                  </div>
                  {d.treaties.map((t: R) => (
                    <article className="record" key={t.id}>
                      <div className="split">
                        <h3>{t.name}</h3>
                        <Badge>{t.operation}</Badge>
                      </div>
                      <p>{t.terms}</p>
                      <p className="muted">
                        {t.signatories} · {dateLabel(t)}
                      </p>
                      {sourceLink(t)}
                    </article>
                  ))}
                  <div className="alert">
                    Proposed diplomatic terms remain separate from approved
                    agreements. Undated treaty restrictions raise a
                    precautionary warning until applicability is confirmed.
                  </div>
                  {categoriesView(["diplomatic"])}
                </>
              )}
              {section === "Domestic Security" && (
                <>
                  {categoriesView(["domestic", "constitutional"])}
                  <Empty>
                    Detailed incident, secrecy, and intelligence verification
                    workflows remain planned. Sourced domestic claims can be
                    added now.
                  </Empty>
                </>
              )}
              {section === "Events & Time" && (
                <>
                  <div className="toolbar">
                    <button onClick={() => setForm("parse_event")}>
                      + Enter roleplay update
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setForm("advance_preview")}
                    >
                      Advance time
                    </button>
                  </div>
                  <div className="alert">
                    Recorded clock: <strong>{d.clock}</strong>. Time advancement
                    does not complete orders, create deliveries, or resolve
                    battles. Simulation outcomes stay outside approved canon.
                  </div>
                  <h2>Event drafts</h2>
                  {d.drafts.length ? (
                    d.drafts.map((e: R) => (
                      <article className="record" key={e.id}>
                        <div className="split">
                          <h3>{e.title}</h3>
                          <Badge>{e.operation}</Badge>
                        </div>
                        <p>{e.date}</p>
                        <button
                          className="secondary"
                          onClick={() =>
                            setPreview({
                              ...e,
                              actions: JSON.parse(e.actions_json),
                            })
                          }
                        >
                          Preview changes
                        </button>
                      </article>
                    ))
                  ) : (
                    <Empty>
                      No event drafts. Enter an order to prepare a reviewable
                      update.
                    </Empty>
                  )}
                  <section className="panel">
                    <h2>Permanent audit</h2>
                    <Table
                      headers={["Recorded in real time", "Action", "Reason"]}
                      rows={d.audit.map((a: R) => [
                        a.recorded_at,
                        a.action,
                        a.explanation,
                      ])}
                    />
                  </section>
                </>
              )}
              {section === "Imports & Backups" && (
                <>
                  <section className="panel">
                    <h2>Import original material</h2>
                    <p>
                      Uploads enter staging. They do not overwrite canon.
                      Supported: TXT, Markdown, CSV/TSV, JSON, ZIP, conversation
                      exports, and images. Files remain evidence until you add
                      sourced claims.
                    </p>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy(true);
                        try {
                          const fd = new FormData(e.currentTarget);
                          const r = await fetch("/api/import", {
                            method: "POST",
                            body: fd,
                          });
                          const j = await r.json();
                          if (!r.ok) throw Error(j.error);
                          setNotice(
                            j.duplicate
                              ? "This import already exists."
                              : "Originals staged. Review before adding canon.",
                          );
                          await refresh();
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      <input
                        aria-label="Import files"
                        type="file"
                        name="files"
                        multiple
                        required
                      />
                      <button disabled={busy}>Stage import</button>
                    </form>
                  </section>
                  <section className="panel">
                    <h2>Reports & backup</h2>
                    <div className="toolbar">
                      {["md", "csv", "json"].map((f) => (
                        <a
                          className="button secondary"
                          key={f}
                          href={`/api/rnas?view=export&format=${f}&date=${date}`}
                        >
                          Export {f.toUpperCase()}
                        </a>
                      ))}
                      <button
                        className="secondary"
                        onClick={() => window.print()}
                      >
                        Print current view
                      </button>
                      <a className="button" href="/api/backup">
                        Download database backup
                      </a>
                    </div>
                    <p className="muted">
                      Database backups preserve national records. Keep the
                      evidence directory with your backup. Restore after
                      stopping the app using the documented restore command.
                    </p>
                  </section>
                  <h2>Import history</h2>
                  <Table
                    headers={["Name", "Recorded", "State", "Action"]}
                    rows={d.imports.map((b: R) => [
                      b.name,
                      b.recorded_at,
                      b.state,
                      b.state !== "rolled_back" &&
                      !b.id.startsWith("recovery") ? (
                        <button
                          className="text-button"
                          onClick={() =>
                            post({ action: "rollback", id: b.id }).catch(
                              () => {},
                            )
                          }
                        >
                          Roll back normalized records
                        </button>
                      ) : null,
                    ])}
                  />
                </>
              )}
            </>
          )}
          <footer>
            <span>RNAS · Sources are preserved. Decisions are recorded.</span>
            <span>
              Historical date {date} / {d.sources.length} sources
            </span>
          </footer>
        </main>
      </div>
      {source && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Original source"
        >
          <section className="source-drawer">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">
                  IMMUTABLE ORIGINAL / TIER {source.tier}
                </span>
                <h2>{source.filename}</h2>
                <small>
                  Recorded {source.recorded_at} · SHA-256{" "}
                  {source.sha256.slice(0, 16)}…
                </small>
              </div>
              <button
                className="secondary"
                onClick={() => setSource(null)}
                aria-label="Close source"
              >
                × Close
              </button>
            </div>
            <div className="source-lines">
              {source.content.split("\n").map((line: string, i: number) => (
                <div
                  key={i}
                  id={"line-" + (i + 1)}
                  className={
                    source.line &&
                    i + 1 >= source.line &&
                    i + 1 <= (source.end ?? source.line)
                      ? "highlight"
                      : ""
                  }
                >
                  <span>{i + 1}</span>
                  <pre>{line || " "}</pre>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {issue && !form && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Canon issue"
        >
          <section className="modal wide">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">
                  {issue.id} / {issue.kind} / {issue.state}
                </span>
                <h2>{issue.title}</h2>
              </div>
              <button className="secondary" onClick={() => setIssue(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>{issue.known_state}</p>
              <p className="alert">{issue.question}</p>
              <div className="record-grid">
                {issue.records.map((r: R | null, i: number) =>
                  r ? (
                    <article className="record" key={i}>
                      <h3>Record {i === 0 ? "A" : "B"}</h3>
                      <p>
                        {r.entity_name} · {r.predicate}
                      </p>
                      <strong>{r.value}</strong>
                      <p>
                        {dateLabel(r)} · <Badge>{r.canon}</Badge> · Tier{" "}
                        {r.tier}
                      </p>
                      {r.evidence.map((e: R) => (
                        <div key={e.id}>
                          <pre className="excerpt">{e.excerpt}</pre>
                          {sourceLink(e)}
                        </div>
                      ))}
                    </article>
                  ) : (
                    <article className="record" key={i}>
                      <h3>Record {i === 0 ? "A" : "B"}</h3>
                      <p className="muted">
                        No normalized competing claim linked. Consult the source
                        archive and supply an approved fact.
                      </p>
                    </article>
                  ),
                )}
              </div>
              <div className="toolbar">
                <button onClick={() => setForm("review")}>
                  Record decision
                </button>
                <button
                  className="secondary"
                  onClick={async () => {
                    try {
                      await post({
                        action: "review",
                        resolution: "postpone",
                        issue_id: issue.id,
                        explanation: "Postponed for later review",
                      });
                      setIssue(null);
                    } catch {}
                  }}
                >
                  Postpone 7 days
                </button>
              </div>
              <h3>Decision history</h3>
              {issue.decisions.map((x: R) => (
                <article className="record" key={x.id}>
                  <Badge>{x.action}</Badge>
                  <p>{x.explanation}</p>
                  <small>
                    {x.recorded_at} · previous text retained in audit
                  </small>
                </article>
              ))}
              {!issue.decisions.length && (
                <p className="muted">No recorded review decisions.</p>
              )}
            </div>
          </section>
        </div>
      )}
      {form && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Record entry"
        >
          <section className="modal">
            <div className="drawer-heading">
              <div>
                <span className="eyebrow">EXPLICIT RECORD ENTRY</span>
                <h2>
                  {(
                    {
                      assertion: "Add a sourced fact",
                      entity: "Add an entity",
                      timeline: "Add timeline entry",
                      review: "Record canon decision",
                      unit: "Add military unit",
                      unit_state: "Record unit state",
                      movement: "Plan or order a movement",
                      complete_movement: "Confirm completed arrival",
                      appointment: "Appoint minister",
                      office: "Create office",
                      bill: "Create legislation",
                      vote: "Record parliamentary vote",
                      budget: "Authorize appropriation",
                      ledger: "Record financial entry",
                      project: "Record economic project",
                      asset: "Register major asset",
                      assignment: "Assign major asset",
                      battle: "Record a battle",
                      casualty: "Record casualty report",
                      location: "Add geographic location",
                      treaty: "Register treaty",
                      parse_event: "Enter roleplay development",
                      advance_preview: "Preview time advancement",
                    } as R
                  )[form] ?? form}
                </h2>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  setForm("");
                  setError("");
                }}
              >
                Close
              </button>
            </div>
            <form className="modal-body" onSubmit={submit}>
              {error && (
                <div role="alert" className="alert error">
                  {error}
                </div>
              )}
              {form === "entity" && (
                <>
                  <Field name="name" label="Name" required />
                  <Field
                    name="kind"
                    label="Entity type"
                    options={[
                      "person",
                      "institution",
                      "nation",
                      "unit",
                      "party",
                      "territory",
                      "law",
                      "battle",
                      "project",
                      "organization",
                    ]}
                    required
                  />
                  <Field
                    name="description"
                    label="Description"
                    type="textarea"
                  />
                </>
              )}
              {form === "assertion" && (
                <>
                  <Field
                    name="entity_id"
                    label="Subject"
                    options={entityOptions}
                    required
                  />
                  <Field
                    name="predicate"
                    label="Claim / field"
                    required
                    help="Use an existing field name when recording a competing value."
                  />
                  <Field
                    name="value"
                    label="Value or explicit Unknown"
                    type="textarea"
                    required
                  />
                  <div className="form-grid">
                    <Field
                      name="category"
                      label="Category"
                      options={categories}
                      required
                    />
                    <Field
                      name="canon"
                      label="Canon approval"
                      options={[
                        "provisional",
                        "confirmed",
                        "disputed",
                        "unknown",
                      ]}
                      value="provisional"
                    />
                    <Field
                      name="operation"
                      label="Operational state"
                      options={operations}
                      value="unknown"
                    />
                    <Field
                      name="confidence"
                      label="Source confidence / assessment"
                      value="user entered"
                    />
                    <Field
                      name="scope"
                      label="Validity"
                      options={[
                        {
                          value: "point",
                          label: "Observation on supplied date / window",
                        },
                        {
                          value: "interval",
                          label: "Explicit ongoing interval",
                        },
                        { value: "undated", label: "Date unknown" },
                      ]}
                      value="point"
                    />
                  </div>
                  <Dates />
                  <Field
                    name="source_id"
                    label="Existing source (optional)"
                    options={sourceOptions}
                  />
                  <div className="form-grid">
                    <Field
                      name="line_start"
                      label="First source line"
                      type="number"
                      value="1"
                    />
                    <Field
                      name="line_end"
                      label="Last source line"
                      type="number"
                      value="1"
                    />
                  </div>
                  <Field
                    name="source_text"
                    label="Or write your original decision"
                    type="textarea"
                    help="Required if no existing source is selected. Preserved as a new source."
                  />
                  <Field name="notes" label="Notes" type="textarea" />
                </>
              )}
              {form === "timeline" && (
                <>
                  <Field name="title" label="Event description" required />
                  <Field
                    name="category"
                    label="Category"
                    options={categories}
                    required
                  />
                  <Dates />
                  <Field
                    name="canon"
                    label="Canon status"
                    options={["provisional", "confirmed", "disputed"]}
                    value="provisional"
                  />
                  <Field
                    name="source_id"
                    label="Source"
                    options={sourceOptions}
                    required
                  />
                  <div className="form-grid">
                    <Field
                      name="line_start"
                      label="First line"
                      type="number"
                      value="1"
                    />
                    <Field
                      name="line_end"
                      label="Last line"
                      type="number"
                      value="1"
                    />
                  </div>
                </>
              )}
              {form === "review" && (
                <>
                  <label className="field">
                    <span>Decision</span>
                    <select
                      name="resolution"
                      value={reviewAction}
                      onChange={(e) => setReviewAction(e.target.value)}
                    >
                      {[
                        ["unresolved", "Leave unresolved"],
                        ["accept_a", "Accept record A"],
                        ["accept_b", "Accept record B"],
                        ["merge", "Merge with explanation"],
                        ["replace", "Replace both with user-approved fact"],
                        [
                          "different_contexts",
                          "Preserve for different dates / contexts",
                        ],
                        ["answer", "Supply missing information"],
                        ["dismiss", "Dismiss false positive"],
                      ].map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  {["merge", "replace", "answer"].includes(reviewAction) && (
                    <Field
                      name="value"
                      label="User-approved fact or explicit Unknown"
                      type="textarea"
                      required
                    />
                  )}
                  {[
                    "merge",
                    "replace",
                    "answer",
                    "different_contexts",
                  ].includes(reviewAction) && (
                    <>
                      <h3>
                        Validity date
                        {reviewAction === "different_contexts"
                          ? " for record A"
                          : ""}
                      </h3>
                      <Dates />
                    </>
                  )}
                  {reviewAction === "different_contexts" && (
                    <>
                      <h3>Validity date for record B</h3>
                      <Dates prefix="b_" />
                      <Field
                        name="contexts"
                        label="Explain distinct contexts"
                        type="textarea"
                        required
                      />
                    </>
                  )}
                  <Field
                    name="explanation"
                    label="Reason for decision"
                    type="textarea"
                    required
                    help="Required. Superseded claims and original excerpts stay in the permanent audit."
                  />
                </>
              )}
              {form === "unit" && (
                <>
                  <Field name="name" label="Designation" required />
                  <Field
                    name="branch"
                    label="Branch"
                    options={[
                      "Army",
                      "Navy",
                      "Air Force",
                      "Marines",
                      "Reserves",
                      "National Guard",
                      "Intelligence",
                      "Special operations",
                      "Joint command",
                    ]}
                    required
                  />
                  <Field
                    name="unit_type"
                    label="Formation type"
                    required
                    help="Division, fleet, squadron, vessel, wing, base, task group…"
                  />
                  <Field
                    name="source_text"
                    label="Original decision / source note"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "unit_state" && (
                <>
                  <Field
                    name="unit_id"
                    label="Unit"
                    options={unitOptions}
                    required
                  />
                  <Field
                    name="date"
                    label="Effective date"
                    type="date"
                    required
                    value={date}
                  />
                  <Field
                    name="parent_id"
                    label="Parent formation (optional)"
                    options={unitOptions}
                  />
                  <div className="form-grid">
                    <Field
                      name="personnel_low"
                      label="Personnel lower / exact"
                      type="number"
                    />
                    <Field
                      name="personnel_high"
                      label="Personnel upper bound"
                      type="number"
                    />
                    <Field
                      name="authorized"
                      label="Authorized strength"
                      type="number"
                    />
                    <Field name="commander" label="Commander" />
                    <Field name="garrison" label="Home garrison" />
                    <Field name="readiness" label="Readiness" />
                  </div>
                  <Field name="mission" label="Assigned mission" />
                  <Field name="supply" label="Supply / ammunition" />
                  <Field
                    name="operation"
                    label="Operational state"
                    options={operations}
                    value="operational"
                  />
                  <Field
                    name="source_text"
                    label="Evidence / decision"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "movement" && (
                <>
                  <Field
                    name="unit_id"
                    label="Unit"
                    options={unitOptions}
                    required
                  />
                  <Field
                    name="location_id"
                    label="Destination"
                    options={locationOptions}
                    required
                  />
                  <Field
                    name="date"
                    label="Order / planned date"
                    type="date"
                    value={date}
                    required
                  />
                  <Field
                    name="operation"
                    label="State"
                    options={["planned", "ordered"]}
                    value="ordered"
                  />
                  <Field
                    name="mission"
                    label="Mission / movement type"
                    required
                  />
                  <div className="alert">
                    A planned or ordered move does not establish arrival.
                    Šibenik-area deployments require treaty review. The server
                    returns any restriction before saving.
                  </div>
                  <Field
                    name="override_reason"
                    label="Treaty restriction override (only after review)"
                    type="textarea"
                    help="Leave empty normally. If warned, explain your explicit decision before submitting again."
                  />
                </>
              )}
              {form === "complete_movement" && (
                <>
                  <input type="hidden" name="id" value={preview?.id ?? ""} />
                  <p>
                    Confirm {preview?.unit} arrived at {preview?.location}.
                  </p>
                  <Field
                    name="date"
                    label="Actual arrival date"
                    type="date"
                    value={date}
                    required
                  />
                  <Field
                    name="explanation"
                    label="Completed event evidence / decision"
                    type="textarea"
                    required
                  />
                  <Field
                    name="override_reason"
                    label="Treaty override reason if required"
                    type="textarea"
                  />
                </>
              )}
              {form === "office" && (
                <>
                  <Field name="name" label="Office / ministry" required />
                  <Field
                    name="authority"
                    label="Legal powers and source"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "appointment" && (
                <>
                  <Field
                    name="office_id"
                    label="Office"
                    options={d.offices.map((o: R) => ({
                      value: o.id,
                      label: o.name,
                    }))}
                    required
                  />
                  <Field
                    name="person_id"
                    label="Person"
                    options={d.entities
                      .filter((e: R) => e.kind === "person")
                      .map((e: R) => ({ value: e.id, label: e.name }))}
                    required
                  />
                  <Field
                    name="date"
                    label="Exact appointment date (optional)"
                    type="date"
                  />
                  <Dates />
                  <Field
                    name="arrangement"
                    label="Arrangement"
                    options={["exclusive", "acting", "joint"]}
                    value="exclusive"
                  />
                  <Field
                    name="reshuffle"
                    label="End preceding appointment?"
                    options={[
                      {
                        value: "yes",
                        label: "Approved reshuffle: end prior term",
                      },
                      { value: "no", label: "No, reject overlaps" },
                    ]}
                    value="no"
                  />
                  <Field
                    name="explanation"
                    label="Approval and authority"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "bill" && (
                <>
                  <Field
                    name="identifier"
                    label="Legislation identifier"
                    required
                  />
                  <Field name="title" label="Title" required />
                  <Field name="sponsor" label="Sponsor" />
                  <Field
                    name="summary"
                    label="Text / summary"
                    type="textarea"
                    required
                  />
                  <Field
                    name="date"
                    label="Introduction date"
                    type="date"
                    value={date}
                    required
                  />
                  <Field
                    name="source_text"
                    label="Source / user decision"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "vote" && (
                <>
                  <Field
                    name="bill_id"
                    label="Legislation"
                    options={d.bills.map((b: R) => ({
                      value: b.id,
                      label: b.identifier + " " + b.title,
                    }))}
                    required
                  />
                  <Field
                    name="chamber_id"
                    label="Chamber snapshot"
                    options={d.chambers.map((c: R) => ({
                      value: c.id,
                      label: c.date + " · " + c.actual_seats + " seats",
                    }))}
                    required
                  />
                  <Field
                    name="date"
                    label="Voting date"
                    type="date"
                    value={date}
                    required
                  />
                  <div className="form-grid">
                    {["yes", "no", "abstain", "absent", "vacancies"].map(
                      (s) => (
                        <Field
                          key={s}
                          name={s}
                          label={s}
                          type="number"
                          value="0"
                          required
                        />
                      ),
                    )}
                  </div>
                  <Field
                    name="voting_seats"
                    label="Applicable voting seats (when occupation is unknown)"
                    type="number"
                    help="Explicitly supply voting capacity. Never assume occupied seats from nominal size."
                  />
                  <Field
                    name="threshold"
                    label="Required yes votes (optional)"
                    type="number"
                    help="Leave blank for a recorded vote with undetermined legal result."
                  />
                  <Field
                    name="rule_source"
                    label="Voting rule and authority"
                    type="textarea"
                    required
                  />
                  <Field
                    name="explanation"
                    label="Session authority / approval"
                    type="textarea"
                    required
                    help="A suspended chamber requires an explicit authority override."
                  />
                </>
              )}
              {form === "budget" && (
                <>
                  <Field name="name" label="Budget / program" required />
                  <Field
                    name="fiscal_year"
                    label="Fiscal year"
                    type="number"
                    required
                    value="1992"
                  />
                  <Field
                    name="currency"
                    label="Currency"
                    value="USD"
                    required
                  />
                  <Field
                    name="appropriated"
                    label="Legally appropriated amount, whole currency units"
                    type="number"
                    required
                  />
                  <Field
                    name="source_text"
                    label="Appropriation authority / original decision"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "ledger" && (
                <>
                  <Field
                    name="budget_id"
                    label="Appropriation"
                    options={d.budgets.map((b: R) => ({
                      value: b.id,
                      label: b.name,
                    }))}
                    required
                  />
                  <Field
                    name="date"
                    label="Record date"
                    type="date"
                    value={date}
                    required
                  />
                  <Field
                    name="stage"
                    label="Accounting stage"
                    options={[
                      "proposed",
                      "authorized",
                      "appropriated",
                      "committed",
                      "disbursed",
                      "actual",
                      "returned",
                      "canceled",
                      "transfer",
                    ]}
                    required
                  />
                  <Field
                    name="amount"
                    label="Amount, whole currency units"
                    type="number"
                    required
                  />
                  <Field
                    name="memo"
                    label="Purpose / transaction reference"
                    type="textarea"
                    required
                  />
                  <Field
                    name="override_reason"
                    label="Over-appropriation override, if warned"
                    type="textarea"
                  />
                </>
              )}
              {form === "project" && (
                <>
                  <Field name="name" label="Project name" required />
                  <Field
                    name="operation"
                    label="Status"
                    options={operations}
                    value="proposal"
                  />
                  <Dates />
                  <div className="form-grid">
                    <Field
                      name="planned"
                      label="Planned budget"
                      type="number"
                    />
                    <Field
                      name="approved"
                      label="Approved budget"
                      type="number"
                    />
                    <Field name="paid" label="Paid" type="number" />
                    <Field name="committed" label="Committed" type="number" />
                    <Field name="currency" label="Currency" value="USD" />
                  </div>
                  <Field
                    name="notes"
                    label="Milestones, dependencies, sponsor and location"
                    type="textarea"
                    required
                  />
                  <Field
                    name="source_text"
                    label="Evidence / decision"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "asset" && (
                <>
                  <Field
                    name="name"
                    label="Individual designation / tail number"
                    required
                  />
                  <Field name="type" label="Asset type" required />
                  <Field
                    name="operation"
                    label="Status"
                    options={operations}
                    value="ordered"
                  />
                  <Field
                    name="source_text"
                    label="Evidence"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "assignment" && (
                <>
                  <Field
                    name="asset_id"
                    label="Asset"
                    options={d.assets.map((a: R) => ({
                      value: a.id,
                      label: a.name,
                    }))}
                    required
                  />
                  <Field
                    name="unit_id"
                    label="Receiving unit"
                    options={unitOptions}
                    required
                  />
                  <Field
                    name="start_date"
                    label="Assignment begins"
                    type="date"
                    value={date}
                    required
                  />
                  <Field
                    name="end_date"
                    label="Assignment ends, inclusive (optional)"
                    type="date"
                  />
                  <Field
                    name="explanation"
                    label="Assignment authority"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "battle" && (
                <>
                  <Field name="name" label="Battle / operation" required />
                  <Dates />
                  <Field name="theater" label="Theater" />
                  <Field
                    name="outcome"
                    label="Outcome, if resolved"
                    type="textarea"
                  />
                  <Field
                    name="canon"
                    label="Canon approval"
                    options={["provisional", "confirmed", "disputed"]}
                    value="provisional"
                  />
                  <Field
                    name="source_text"
                    label="Original report"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "casualty" && (
                <>
                  <Field
                    name="battle_id"
                    label="Battle"
                    options={d.battles.map((b: R) => ({
                      value: b.id,
                      label: b.name,
                    }))}
                    required
                  />
                  <Field
                    name="unit_id"
                    label="Unit (optional)"
                    options={unitOptions}
                  />
                  <Field
                    name="report_group"
                    label="Distinct report / phase identifier"
                    required
                  />
                  <Field
                    name="category"
                    label="Casualty category"
                    options={["KIA", "WIA", "MIA", "POW", "unspecified"]}
                    required
                  />
                  <Field name="count" label="Count" type="number" required />
                  <Field
                    name="canon"
                    label="Canon approval"
                    options={["provisional", "confirmed", "disputed"]}
                    value="provisional"
                  />
                  <Field
                    name="source_text"
                    label="Evidence and accounting caveats"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "location" && (
                <>
                  <Field name="name" label="Location name" required />
                  <Field
                    name="kind"
                    label="Type"
                    options={[
                      "city",
                      "port",
                      "base",
                      "province",
                      "territory",
                      "DMZ",
                      "front line",
                      "theater",
                      "core island",
                    ]}
                    required
                  />
                  <div className="form-grid">
                    <Field name="sovereignty" label="Legal sovereignty" />
                    <Field name="control" label="Practical control" />
                    <Field name="administration" label="Administration" />
                    <Field name="latitude" label="Known latitude (optional)" />
                    <Field
                      name="longitude"
                      label="Known longitude (optional)"
                    />
                  </div>
                  <Field
                    name="source_text"
                    label="Geographic source"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "treaty" && (
                <>
                  <Field name="name" label="Treaty name" required />
                  <Dates />
                  <Field
                    name="operation"
                    label="Status"
                    options={["proposal", "approved", "completed", "canceled"]}
                    value="proposal"
                  />
                  <Field name="signatories" label="Signatories" />
                  <Field
                    name="terms"
                    label="Articles / obligations"
                    type="textarea"
                    required
                  />
                  <Field
                    name="location_id"
                    label="Restricted location (optional)"
                    options={locationOptions}
                  />
                  <Field
                    name="restriction"
                    label="Deployment restriction, if any"
                    type="textarea"
                  />
                  <Field
                    name="source_text"
                    label="Source instrument / decision"
                    type="textarea"
                    required
                  />
                </>
              )}
              {form === "parse_event" && (
                <>
                  <Field
                    name="date"
                    label="In-world date"
                    type="date"
                    value={date}
                    required
                  />
                  <Field
                    name="text"
                    label="Roleplay development"
                    type="textarea"
                    required
                    help={
                      "Supported: “Order [exact unit name] to [exact location name]”. Ambiguous or unsupported text is retained for structured review."
                    }
                  />
                </>
              )}
              {form === "advance_preview" && (
                <>
                  <Field
                    name="date"
                    label="Advance clock to"
                    type="date"
                    value={date}
                    required
                  />
                  <p>
                    Preview pending orders and procurement. Nothing completes
                    automatically.
                  </p>
                </>
              )}
              <div className="form-footer">
                <p className="muted small">
                  Saving records your explicit decision. Unknown dates and
                  missing values remain unknown.
                </p>
                <button disabled={busy} type="submit">
                  {busy
                    ? "Saving…"
                    : ["parse_event", "advance_preview"].includes(form)
                      ? "Prepare preview"
                      : "Save record"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {preview && !form && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Preview changes"
        >
          <section className="modal">
            <div className="drawer-heading">
              <h2>{preview.title ?? "Review proposed changes"}</h2>
              <button className="secondary" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <p>Effective date: {preview.date}</p>
              {preview.unresolved?.length > 0 && (
                <div className="alert">{preview.unresolved.join(" ")}</div>
              )}
              {preview.actions?.map((a: R, i: number) => (
                <article className="record" key={i}>
                  <h3>
                    {a.kind === "movement"
                      ? "Record movement order"
                      : a.kind === "clock"
                        ? "Advance recorded clock"
                        : "Proposed change"}
                  </h3>
                  <p>
                    {a.description ??
                      `${d.units.find((u: R) => u.id === a.unit_id)?.name ?? ""} → ${d.locations.find((l: R) => l.id === a.location_id)?.name ?? ""}`}
                  </p>
                  <Badge>{a.operation ?? "clock only"}</Badge>
                </article>
              ))}
              {preview.pending?.map((p: R, i: number) => (
                <p key={i}>
                  {p.name ?? p.unit} · {p.operation}; not automatically
                  completed
                </p>
              ))}
              {preview.operation === "applied" ? (
                <Badge tone="green">Already approved and applied</Badge>
              ) : (
                preview.id &&
                !preview.unresolved?.length && (
                  <>
                    <p className="alert">
                      Approve only after checking the unit, destination, date,
                      and operational state. Treaty warnings are enforced on
                      commit.
                    </p>
                    <button
                      disabled={busy}
                      onClick={async () => {
                        try {
                          await post({
                            action: "approve_event",
                            id: preview.id,
                            explanation:
                              "User reviewed and approved the displayed transaction",
                          });
                          setPreview(null);
                        } catch {}
                      }}
                    >
                      Approve all changes
                    </button>
                  </>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
