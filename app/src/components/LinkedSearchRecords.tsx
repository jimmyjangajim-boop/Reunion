"use client";
import type { ArchiveTab } from "../lib/archive-view.ts";
import { archiveRows, emptyArchiveFilters } from "../lib/archive-view.ts";
type Row = Record<string, any>;
export default function LinkedSearchRecords({
  query,
  records,
  timeline,
  onOpen,
  onBrowse,
}: {
  query: string;
  records: Row[];
  timeline: Row[];
  onOpen: (kind: ArchiveTab, item: Row) => void;
  onBrowse: (kind: ArchiveTab, query: string) => void;
}) {
  const filters = { ...emptyArchiveFilters, query };
  const facts = archiveRows("records", records, filters);
  const events = archiveRows("timeline", timeline, filters);
  return (
    <>
      <p className="muted">
        Archive results include all recorded dates and canon statuses. Open a
        result to check its dates and evidence.
      </p>
      {(
        [
          ["records", "Sourced facts", facts],
          ["timeline", "Historical events", events],
        ] as [ArchiveTab, string, Row[]][]
      ).map(([kind, title, rows]) => (
        <section key={kind}>
          <h3>
            {title} ({rows.length})
          </h3>
          {rows.slice(0, 8).map((r) => (
            <article className="record" key={r.id}>
              <button className="text-button" onClick={() => onOpen(kind, r)}>
                {kind === "records"
                  ? `${r.entity_name}: ${r.predicate.replaceAll("_", " ")}`
                  : r.title}
              </button>
              <p>{kind === "records" ? r.value : r.description}</p>
              <small>{r.canon ?? "Canon not recorded"}</small>
            </article>
          ))}
          {rows.length > 8 && (
            <button className="secondary" onClick={() => onBrowse(kind, query)}>
              Browse all {rows.length} {title.toLowerCase()}
            </button>
          )}
          {!rows.length && (
            <p className="muted">No matching {title.toLowerCase()}.</p>
          )}
        </section>
      ))}
    </>
  );
}
