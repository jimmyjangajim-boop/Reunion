"use client";
import React, { useEffect, useRef, useState } from "react";
import RecordPicker from "./RecordPicker";
import type { FormEvent } from "react";
import {
  archiveRows,
  archivePage,
  archiveDate,
  archiveTitle,
  archiveLabel,
  readableArchiveValue,
  emptyArchiveFilters,
} from "../lib/archive-view.ts";
import type { ArchiveTab, ArchiveFilters } from "../lib/archive-view.ts";
import { archiveOnly } from "../lib/administration-view.ts";
type R = Record<string, any>;
const tabs: [ArchiveTab, string][] = [
  ["records", "Records"],
  ["timeline", "Timeline"],
  ["sources", "Sources"],
  ["entities", "Entities"],
  ["text", "Original text"],
];
function Pager({
  page,
  pages,
  total,
  start,
  end,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  start: number;
  end: number;
  onPage: (n: number) => void;
}) {
  return (
    <nav className="archive-pager" aria-label="Archive pages">
      <span role="status">
        {start}–{end} of {total} · Page {page} of {pages}
      </span>
      <div>
        <button
          className="secondary"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous page
        </button>
        <button
          className="secondary"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next page
        </button>
      </div>
    </nav>
  );
}
export function ArchiveDetail({
  item,
  kind,
  records,
  timeline,
  sources,
  entities,
  onClose,
  onSource,
  onItem,
  onBrowse,
}: {
  item: R;
  kind: ArchiveTab;
  records: R[];
  timeline: R[];
  sources: R[];
  entities: R[];
  onClose: () => void;
  onSource: (id: string, line?: number, end?: number) => void;
  onItem: (kind: ArchiveTab, item: R) => void;
  onBrowse: (field: "entity" | "source", id: string, kind?: ArchiveTab) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  const dated = kind === "records" || kind === "timeline",
    date = archiveDate(item);
  const evidence =
    kind === "records"
      ? (item.evidence ?? [])
      : kind === "timeline" && item.source_id
        ? [
            {
              source_id: item.source_id,
              filename: sources.find((s) => s.id === item.source_id)?.filename,
              line_start: item.line_start,
              line_end: item.line_end,
            },
          ]
        : [];
  const linkedRecords =
    kind === "sources"
      ? records.filter((r) =>
          (r.evidence ?? []).some((e: R) => e.source_id === item.id),
        )
      : kind === "entities"
        ? records.filter((r) => r.entity_id === item.id)
        : [];
  const linkedEvents =
    kind === "sources"
      ? timeline.filter((r) => r.source_id === item.id)
      : kind === "entities"
        ? timeline.filter((r) =>
            (r.related_entities ?? []).some((e: R) => e.id === item.id),
          )
        : [];
  const related =
    kind === "records"
      ? records.filter(
          (r) => r.id === item.superseded_by || r.superseded_by === item.id,
        )
      : [];
  const open = (e: R) => {
    onSource(e.source_id, e.line_start ?? undefined, e.line_end ?? undefined);
  };
  const entity =
    kind === "records"
      ? entities.find((e) => e.id === item.entity_id)
      : undefined;
  return (
    <dialog
      ref={dialog}
      className="office-profile archive-detail"
      aria-labelledby="archive-detail-title"
      onCancel={onClose}
      onClose={onClose}
    >
      <header className="profile-heading">
        <div>
          <span className="eyebrow">
            Historical archive ·{" "}
            {kind === "records"
              ? "Record"
              : kind === "timeline"
                ? "Event"
                : kind === "sources"
                  ? "Source"
                  : "Entity"}
          </span>
          <h2 id="archive-detail-title">{archiveTitle(kind, item)}</h2>
        </div>
        <button className="secondary" onClick={onClose} autoFocus>
          Close record
        </button>
      </header>
      <div className="profile-body">
        {dated && (
          <>
            <p className="record-context">
              {archiveLabel(item.canon)} · {archiveLabel(item.operation)}
              {(item.archive_only || archiveOnly(item)) &&
                " · 1725 archive only"}
            </p>
            <p>
              {date.label} ·{" "}
              {date.precision === "day"
                ? "Exact day"
                : archiveLabel(date.precision) + " date"}
            </p>
            {["superseded", "rejected"].includes(item.canon) && (
              <p className="alert">
                Preserved {item.canon} record. Its wording remains historical
                evidence.
              </p>
            )}
          </>
        )}
        {kind === "records" && (
          <>
            <h3>Recorded value</h3>
            <p className="archive-full-value">
              {readableArchiveValue(item.value)}
            </p>
            {entity && (
              <p>
                Subject:{" "}
                <button
                  className="text-button"
                  onClick={() => onItem("entities", entity)}
                >
                  {entity.name}
                </button>
              </p>
            )}
            {item.notes && <p>{item.notes}</p>}
            {related.length > 0 && (
              <section>
                <h3>Replacement history</h3>
                {related.map((r) => (
                  <p key={r.id}>
                    <button
                      className="text-button"
                      onClick={() => onItem("records", r)}
                    >
                      {r.id === item.superseded_by
                        ? "Replaced by: "
                        : "Replaces: "}
                      {archiveTitle("records", r)}
                    </button>{" "}
                    · {r.canon}
                    <span className="row-detail">
                      {readableArchiveValue(r.value)} · {archiveDate(r).label}
                    </span>
                  </p>
                ))}
              </section>
            )}
          </>
        )}
        {kind === "timeline" && (
          <>
            <p className="archive-full-value">
              {item.note || "No additional event notes recorded."}
            </p>
            {item.related_entities?.length > 0 && (
              <section>
                <h3>Related people, places and organizations</h3>
                {item.related_entities.map((e: R) => (
                  <p key={e.id}>
                    <button
                      className="text-button"
                      onClick={() =>
                        onItem(
                          "entities",
                          entities.find((r) => r.id === e.id) ?? e,
                        )
                      }
                    >
                      {e.name}
                    </button>
                  </p>
                ))}
              </section>
            )}
          </>
        )}
        {kind === "entities" && (
          <>
            <p>{archiveLabel(item.kind)}</p>
            <p>{item.description || "No description recorded."}</p>
          </>
        )}
        {kind === "sources" && (
          <>
            <p>
              {archiveLabel(item.kind)} · Evidence tier {item.tier}
            </p>
            <p className="muted">
              A source is evidence, not an automatic canon decision. Original
              wording may be superseded.
            </p>
            <button onClick={() => open({ source_id: item.id })}>
              Read original source
            </button>
            <details>
              <summary>Source provenance</summary>
              <dl className="profile-facts">
                <div>
                  <dt>Original path</dt>
                  <dd>{item.path}</dd>
                </div>
                <div>
                  <dt>SHA-256</dt>
                  <dd className="hash">{item.sha256}</dd>
                </div>
                <div>
                  <dt>Bytes</dt>
                  <dd>{item.bytes}</dd>
                </div>
                <div>
                  <dt>Recorded</dt>
                  <dd>{item.recorded_at || "Not recorded"}</dd>
                </div>
              </dl>
              <p className="muted">
                These checksums describe this stored source. Binary artifact
                extraction metadata, when present, is retained separately.
              </p>
            </details>
          </>
        )}
        {evidence.length > 0 ? (
          <section>
            <h3>Source evidence</h3>
            {evidence.map((e: R, i: number) => (
              <details key={e.id ?? i}>
                <summary>
                  {e.filename || "Original source"}
                  {e.line_start
                    ? ` · Lines ${e.line_start}–${e.line_end ?? e.line_start}`
                    : ""}
                </summary>
                {e.excerpt && (
                  <blockquote className="archive-full-value">
                    {e.excerpt}
                  </blockquote>
                )}
                <button className="text-button" onClick={() => open(e)}>
                  Open cited source
                </button>
                {e.tier && <p className="muted">Evidence tier {e.tier}</p>}
              </details>
            ))}
          </section>
        ) : dated ? (
          <p className="muted">No linked source evidence recorded.</p>
        ) : null}
        {(kind === "sources" || kind === "entities") && (
          <section>
            <h3>Linked records ({linkedRecords.length})</h3>
            {linkedRecords.slice(0, 8).map((r) => (
              <p key={r.id}>
                <button
                  className="text-button"
                  onClick={() => onItem("records", r)}
                >
                  {archiveTitle("records", r)}
                </button>{" "}
                · {r.canon}
                <span className="row-detail">
                  {readableArchiveValue(r.value)} · {archiveDate(r).label}
                </span>
              </p>
            ))}
            {!linkedRecords.length && (
              <p className="muted">
                No normalized records link to this{" "}
                {kind === "sources" ? "source" : "entity"}.
              </p>
            )}
            <button
              className="secondary"
              onClick={() =>
                onBrowse(kind === "sources" ? "source" : "entity", item.id)
              }
            >
              Browse linked records
            </button>
          </section>
        )}
        {(kind === "sources" || kind === "entities") && (
          <section>
            <h3>Linked events ({linkedEvents.length})</h3>
            {linkedEvents.slice(0, 8).map((r) => (
              <p key={r.id}>
                <button
                  className="text-button"
                  onClick={() => onItem("timeline", r)}
                >
                  {r.title}
                </button>{" "}
                · {archiveDate(r).label}
              </p>
            ))}
            {linkedEvents.length > 0 && (
              <button
                className="secondary"
                onClick={() =>
                  onBrowse(
                    kind === "sources" ? "source" : "entity",
                    item.id,
                    "timeline",
                  )
                }
              >
                Browse linked events
              </button>
            )}
          </section>
        )}
        {dated && (
          <details>
            <summary>Dates and technical record</summary>
            <dl className="profile-facts">
              <div>
                <dt>Historical precision</dt>
                <dd>{date.precision}</dd>
              </div>
              <div>
                <dt>Earliest supplied bound</dt>
                <dd>{date.earliest || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Latest supplied bound</dt>
                <dd>{date.latest || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Relative event</dt>
                <dd>{date.relation || "Not recorded"}</dd>
              </div>
              <div>
                <dt>Recorded timestamp</dt>
                <dd>{item.recorded_at || "Not recorded on this event"}</dd>
              </div>
            </dl>
            <p className="muted">
              Historical dates and real recording timestamps are distinct. Date
              bounds do not assign an exact event day.
            </p>
            <pre className="excerpt">{JSON.stringify(item, null, 2)}</pre>
          </details>
        )}
      </div>
    </dialog>
  );
}
export default function ArchiveWorkspace({
  records,
  timeline,
  sources,
  entities,
  tab,
  onTabChange,
  openSource,
  onAdd,
  initialQuery = "",
  initialSelection,
}: {
  records: R[];
  timeline: R[];
  sources: R[];
  entities: R[];
  tab: ArchiveTab;
  onTabChange: (t: ArchiveTab) => void;
  openSource: (id: string, line?: number, end?: number) => void;
  onAdd: (form: string) => void;
  initialQuery?: string;
  initialSelection?: { kind: ArchiveTab; item: R };
}) {
  const [filters, setFilters] = useState<ArchiveFilters>({
      ...emptyArchiveFilters,
      query: initialQuery,
      sort: tab === "timeline" ? "date-asc" : "title",
    }),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<{ kind: ArchiveTab; item: R } | null>(
      initialSelection ?? null,
    );
  const [textDraft, setTextDraft] = useState(""),
    [textQuery, setTextQuery] = useState(""),
    [textPage, setTextPage] = useState(1),
    [textResult, setTextResult] = useState<R | null>(null),
    [textError, setTextError] = useState(""),
    [loading, setLoading] = useState(false),
    [textRequest, setTextRequest] = useState(0);
  const change = (key: keyof ArchiveFilters, value: any) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
    setTextPage(1);
  };
  const switchTab = (t: ArchiveTab) => {
    onTabChange(t);
    setPage(1);
    if (t === "timeline") setFilters((f) => ({ ...f, sort: "date-asc" }));
    if (!["records", "timeline"].includes(t))
      setFilters((f) => ({ ...f, sort: "title" }));
  };
  useEffect(() => {
    if (tab !== "text" || !textQuery) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setTextError("");
    setTextResult(null);
    const q = new URLSearchParams({
      view: "archive_search",
      q: textQuery,
      page: String(textPage),
      size: "25",
    });
    if (filters.source !== "all") q.set("source", filters.source);
    fetch("/api/rnas?" + q, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Source search failed");
        if (!controller.signal.aborted) setTextResult(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setTextError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tab, textQuery, textPage, filters.source, textRequest]);
  const dated = tab === "records" || tab === "timeline",
    data =
      tab === "records"
        ? records
        : tab === "timeline"
          ? timeline
          : tab === "sources"
            ? sources
            : entities;
  const rows = archiveRows(tab, data, filters),
    p = archivePage(rows, page, 25);
  const select = (kind: ArchiveTab, item: R) => setSelected({ kind, item });
  const browse = (
    field: "entity" | "source",
    id: string,
    kind: ArchiveTab = "records",
  ) => {
    setSelected(null);
    setFilters({ ...emptyArchiveFilters, [field]: id });
    switchTab(kind);
  };
  const reset = () => {
    setFilters({ ...emptyArchiveFilters });
    setPage(1);
    setTextDraft("");
    setTextQuery("");
    setTextResult(null);
    setTextError("");
    setTextPage(1);
  };
  const submitText = (e: FormEvent) => {
    e.preventDefault();
    setTextQuery(textDraft.trim());
    setTextPage(1);
    setTextRequest((n) => n + 1);
  };
  const categories = [
      ...new Set(
        [...records, ...timeline].map((r) => r.category).filter(Boolean),
      ),
    ].sort(),
    statuses = [
      ...new Set([...records, ...timeline].map((r) => r.canon).filter(Boolean)),
    ].sort();
  return (
    <div className="archive-workspace">
      <div className="section-heading">
        <div>
          <h2>National archive</h2>
          <p className="muted">
            Historical records, events and original evidence. This library
            covers all dates.
          </p>
        </div>
        <button onClick={() => onAdd("assertion")}>
          Add Historical Record
        </button>
      </div>
      <div
        className="archive-tabs"
        role="tablist"
        aria-label="Archive collections"
      >
        {tabs.map(([key, title]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls="archive-results"
            id={`archive-tab-${key}`}
            className={tab === key ? "selected" : ""}
            onClick={() => switchTab(key)}
            tabIndex={tab === key ? 0 : -1}
            onKeyDown={(e) => {
              const index = tabs.findIndex(([t]) => t === key);
              const next =
                e.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : e.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? tabs.length - 1
                        : -1;
              if (next >= 0) {
                e.preventDefault();
                switchTab(tabs[next][0]);
                document
                  .getElementById("archive-tab-" + tabs[next][0])
                  ?.focus();
              }
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <div className="panel archive-filters">
        {tab === "text" ? (
          <form onSubmit={submitText} className="archive-text-search">
            <label>
              Search original text
              <input
                value={textDraft}
                maxLength={2000}
                onChange={(e) => setTextDraft(e.target.value)}
                placeholder="Words in preserved documents…"
              />
            </label>
            <button disabled={!textDraft.trim() || loading}>
              Search originals
            </button>
          </form>
        ) : (
          <label>
            Search archive
            <input
              aria-label="Filter records"
              value={filters.query}
              onChange={(e) => change("query", e.target.value)}
              placeholder="Names, values, dates or filenames…"
            />
          </label>
        )}
        <div className="archive-filter-row">
          {(dated || tab === "text") && (
            <RecordPicker
              label="Source"
              options={sources.map((source) => ({
                id: source.id,
                name: source.filename,
              }))}
              value={filters.source === "all" ? "" : filters.source}
              empty="All sources"
              onChange={(id) => change("source", String(id) || "all")}
            />
          )}
          {dated && (
            <>
              <label>
                Category
                <select
                  value={filters.category}
                  onChange={(e) => change("category", e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {archiveLabel(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Canon status
                <select
                  value={filters.canon}
                  onChange={(e) => change("canon", e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statuses.map((c) => (
                    <option key={c} value={c}>
                      {archiveLabel(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Historical collection
                <select
                  value={filters.collection}
                  onChange={(e) => change("collection", e.target.value)}
                >
                  <option value="all">All historical records</option>
                  <option value="1725">1725 campaign only</option>
                  <option value="other">Other historical records</option>
                </select>
              </label>
            </>
          )}
          {dated && (
            <RecordPicker
              label="Entity"
              options={entities.map((e) => ({
                id: e.id,
                name: e.name,
                kind: e.kind,
              }))}
              value={filters.entity === "all" ? "" : filters.entity}
              empty="All entities"
              onChange={(id) => change("entity", String(id) || "all")}
            />
          )}
          {tab !== "text" && (
            <label>
              Sort records
              <select
                value={filters.sort}
                onChange={(e) => change("sort", e.target.value)}
              >
                <option value="title">Title A–Z</option>
                {dated && (
                  <>
                    <option value="date-asc">
                      Historical date: oldest first
                    </option>
                    <option value="date-desc">
                      Historical date: newest first
                    </option>
                  </>
                )}
                {(tab === "records" || tab === "sources") && (
                  <option value="recorded">Recorded: newest first</option>
                )}
              </select>
            </label>
          )}
        </div>
        {dated && (
          <details>
            <summary>Historical date range</summary>
            <div className="archive-filter-row">
              <label>
                From date
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => change("from", e.target.value)}
                />
              </label>
              <label>
                Through date
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => change("to", e.target.value)}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.includeUnknown}
                  onChange={(e) => change("includeUnknown", e.target.checked)}
                />
                Include dates without known bounds
              </label>
            </div>
            <p className="muted">
              Matches overlapping date bounds. Relative or unknown dates without
              bounds are controlled by the checkbox; no exact day is inferred.
            </p>
          </details>
        )}
        {filters.from && filters.to && filters.from > filters.to && dated && (
          <p role="alert">
            The date range is reversed. Choose a start date before the end date.
          </p>
        )}
        <div className="archive-actions">
          <button className="text-button" onClick={reset}>
            Clear filters
          </button>
          <button className="text-button" onClick={() => onAdd("timeline")}>
            + Timeline entry
          </button>
          <button className="text-button" onClick={() => onAdd("entity")}>
            + Entity
          </button>
        </div>
      </div>
      <section
        id="archive-results"
        role="tabpanel"
        aria-labelledby={`archive-tab-${tab}`}
        aria-busy={loading}
      >
        {tab === "text" ? (
          <>
            <p className="muted">
              Searches preserved text across documents, including superseded
              wording. Results are source evidence, not canon decisions. Up to
              12 search words are matched together.
            </p>
            {loading && <p role="status">Searching original text…</p>}
            {textError && <p role="alert">{textError}</p>}
            {!textQuery && (
              <p className="empty">
                Enter words to search the original documents.
              </p>
            )}
            {!loading && textResult && (
              <>
                <p>
                  {textResult.total} source passages match “{textQuery}”.
                </p>
                {textResult.rows.length ? (
                  <ol className="archive-passages">
                    {textResult.rows.map((r: R) => (
                      <li key={r.id}>
                        <button
                          className="text-button"
                          onClick={() =>
                            openSource(r.source_id, r.line_start, r.line_end)
                          }
                        >
                          {r.filename} · Lines {r.line_start}–{r.line_end}
                        </button>
                        <p>{r.excerpt}</p>
                        <small>
                          Evidence tier {r.tier} · {r.kind}
                        </small>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="empty">
                    No source passages match. Try fewer words or another source.
                  </p>
                )}
                <Pager
                  page={textResult.page}
                  pages={textResult.pages}
                  total={textResult.total}
                  start={
                    textResult.total
                      ? (textResult.page - 1) * textResult.size + 1
                      : 0
                  }
                  end={Math.min(
                    textResult.page * textResult.size,
                    textResult.total,
                  )}
                  onPage={setTextPage}
                />
              </>
            )}
          </>
        ) : (
          <>
            {dated && (
              <p className="muted">
                Superseded records and the 1725 campaign remain available here.
                Historical dates do not establish present-day applicability.
              </p>
            )}
            {p.rows.length ? (
              <div className="table-scroll">
                <table className="archive-table">
                  <thead>
                    <tr>
                      <th>{dated ? "Record" : "Name"}</th>
                      {dated && (
                        <>
                          <th>Historical date</th>
                          <th>Canon</th>
                        </>
                      )}
                      {tab === "records" && <th>Subject / evidence</th>}
                      {tab === "sources" && (
                        <>
                          <th>Kind</th>
                          <th>Recorded</th>
                        </>
                      )}
                      {tab === "entities" && <th>Type</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {p.rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <button
                            className="text-button archive-title"
                            onClick={() => select(tab, r)}
                          >
                            {archiveTitle(tab, r)}
                          </button>
                          {tab === "records" && (
                            <p className="archive-snippet">
                              {readableArchiveValue(r.value)}
                            </p>
                          )}
                          {tab === "entities" && r.description && (
                            <p className="archive-snippet">{r.description}</p>
                          )}
                          {dated && (r.archive_only || archiveOnly(r)) && (
                            <small className="row-detail">
                              1725 archive only
                            </small>
                          )}
                        </td>
                        {dated && (
                          <>
                            <td>
                              {archiveDate(r).label}
                              <small className="row-detail">
                                {archiveDate(r).precision === "day"
                                  ? "Exact day"
                                  : archiveLabel(archiveDate(r).precision)}
                              </small>
                            </td>
                            <td>{archiveLabel(r.canon)}</td>
                          </>
                        )}
                        {tab === "records" && (
                          <td>
                            {archiveLabel(r.category)}
                            <small className="row-detail">
                              {(r.evidence ?? []).length} source links
                            </small>
                          </td>
                        )}
                        {tab === "sources" && (
                          <>
                            <td>
                              {r.kind}
                              <small className="row-detail">
                                Evidence tier {r.tier}
                              </small>
                            </td>
                            <td>{r.recorded_at || "Not recorded"}</td>
                          </>
                        )}
                        {tab === "entities" && <td>{archiveLabel(r.kind)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty">
                No {tabs.find(([key]) => key === tab)?.[1].toLowerCase()} match
                these filters. Clear filters to browse all records.
              </p>
            )}
            <Pager {...p} onPage={setPage} />
          </>
        )}
      </section>
      {selected && (
        <ArchiveDetail
          item={selected.item}
          kind={selected.kind}
          records={records}
          timeline={timeline}
          sources={sources}
          entities={entities}
          onClose={() => setSelected(null)}
          onSource={openSource}
          onItem={select}
          onBrowse={browse}
        />
      )}
    </div>
  );
}
