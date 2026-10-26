"use client";
import { useEffect, useState } from "react";
import RecordDetails from "./RecordDetails";
import {
  recordCatalog,
  searchCategories,
  searchKinds,
  type OperationalKind,
  type SearchHit,
  type SearchPage,
} from "../lib/record-catalog.ts";
export default function GlobalSearchWorkspace({
  query,
  onClose,
  onSource,
  onArchive,
  onRelated,
}: {
  query: string;
  onClose: () => void;
  onSource: (id: string, start?: number, end?: number) => void;
  onArchive: (kind: "entity" | "fact" | "event", id: string) => void;
  onRelated: (kind: "entity" | "unit", id: string) => void;
}) {
  const [category, setCategory] = useState("all"),
    [kind, setKind] = useState("all"),
    [page, setPage] = useState(1);
  const [data, setData] = useState<SearchPage | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [attempt, retry] = useState(0);
  const [selected, setSelected] = useState<SearchHit | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    const q = new URLSearchParams({
      q: query,
      category,
      kind,
      page: String(page),
    });
    fetch("/api/search?" + q, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw Error(result.error || "Search failed");
        if (!controller.signal.aborted) setData(result);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, category, kind, page, attempt]);
  function open(hit: SearchHit) {
    if (hit.kind === "source")
      onSource(hit.source_id!, hit.line_start, hit.line_end);
    else if (
      hit.kind === "entity" ||
      hit.kind === "fact" ||
      hit.kind === "event"
    )
      onArchive(hit.kind, hit.id);
    else setSelected(hit);
  }
  const labels: Record<string, string> = {
    entity: "Archive identities",
    fact: "Sourced facts",
    event: "Historical events",
    source: "Sources and passages",
  };
  return (
    <section
      className="global-search-workspace"
      aria-label="Global record search"
    >
      <div className="section-heading">
        <h2>Search results</h2>
        <button type="button" className="secondary" onClick={onClose}>
          Close search
        </button>
      </div>
      {selected ? (
        <>
          <button
            type="button"
            className="secondary"
            onClick={() => setSelected(null)}
          >
            Back to search results
          </button>
          <RecordDetails
            key={`${selected.kind}-${selected.id}`}
            target={{ kind: selected.kind as OperationalKind, id: selected.id }}
            onSource={onSource}
            onRelated={onRelated}
          />
        </>
      ) : (
        <>
          <p>
            Results for <strong>{query}</strong> · all recorded dates and canon
            statuses. These are stored records and evidence, not a snapshot for
            the historical date selector.
          </p>
          <div className="search-filters">
            <label>
              Search category
              <select
                aria-label="Search category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All categories</option>
                {searchCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                    {data ? ` (${data.categories[c] ?? 0})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Record type
              <select
                aria-label="Search record type"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All record types</option>
                {searchKinds.map((k) => (
                  <option key={k} value={k}>
                    {labels[k] ?? recordCatalog[k as OperationalKind].title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {loading && (
            <p role="status">Searching records and preserved sources…</p>
          )}
          {error && (
            <div role="alert">
              {error}{" "}
              <button
                type="button"
                className="secondary"
                onClick={() => retry(attempt + 1)}
              >
                Retry search
              </button>
            </div>
          )}
          {data && (
            <>
              <nav className="archive-pager" aria-label="Search pages">
                <span role="status">
                  {data.total ? (data.page - 1) * data.size + 1 : 0}–
                  {Math.min(data.page * data.size, data.total)} of {data.total}{" "}
                  · Page {data.page} of {data.pages}
                </span>
                <div>
                  <button
                    type="button"
                    className="secondary"
                    disabled={data.page <= 1}
                    onClick={() => setPage(data.page - 1)}
                  >
                    Previous results
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={data.page >= data.pages}
                    onClick={() => setPage(data.page + 1)}
                  >
                    Next results
                  </button>
                </div>
              </nav>
              <div className="search-results" aria-label="Matching records">
                {data.rows.map((hit) => (
                  <article className="record" key={`${hit.kind}-${hit.id}`}>
                    <p className="eyebrow">
                      {hit.category} · {hit.type}
                    </p>
                    <h3>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => open(hit)}
                      >
                        {hit.title}
                      </button>
                    </h3>
                    <p>{hit.excerpt}</p>
                    <small>
                      {hit.date ?? "Date not established"}
                      {hit.canon ? ` · ${hit.canon}` : ""}
                      {hit.line_start
                        ? ` · lines ${hit.line_start}–${hit.line_end}`
                        : ""}
                    </small>
                  </article>
                ))}
              </div>
              {!data.rows.length && (
                <p className="empty">
                  No matching records. Try another category, record type or
                  phrase.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
