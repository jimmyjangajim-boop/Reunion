import { bounds, historicalDateSchema } from "./dates.ts";
import { archiveOnly } from "./administration-view.ts";
type R = Record<string, any>;
export type ArchiveTab =
  | "records"
  | "timeline"
  | "sources"
  | "entities"
  | "text";
export type ArchiveFilters = {
  query: string;
  category: string;
  canon: string;
  entity: string;
  source: string;
  collection: string;
  from: string;
  to: string;
  includeUnknown: boolean;
  sort: string;
};
export const emptyArchiveFilters: ArchiveFilters = {
  query: "",
  category: "all",
  canon: "all",
  entity: "all",
  source: "all",
  collection: "all",
  from: "",
  to: "",
  includeUnknown: true,
  sort: "title",
};
export function archiveLabel(s: string) {
  return (
    (
      {
        baseline_minister: "Minister",
        "Baseline minister": "Minister",
        existence_in_canon: "Canon status",
        current_disposition: "Current situation",
      } as R
    )[s] ?? s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
  );
}
export function archiveValue(v: any): string {
  if (v === null || v === undefined) return "Not recorded";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.map(archiveValue).join("; ");
  if (typeof v === "object")
    return Object.entries(v)
      .map(([k, x]) => `${archiveLabel(k)}: ${archiveValue(x)}`)
      .join(" · ");
  return String(v);
}
export function readableArchiveValue(raw: string): string {
  try {
    return archiveValue(JSON.parse(raw));
  } catch {
    return raw;
  }
}
export function archiveDate(row: R) {
  try {
    const d = historicalDateSchema.safeParse(
      typeof row.date_json === "string"
        ? JSON.parse(row.date_json)
        : row.date_json,
    );
    if (d.success) return d.data;
  } catch {}
  return {
    precision: "unknown",
    label: "Unknown",
    earliest: null,
    latest: null,
    relation: null,
  } as const;
}
function dateBounds(row: R): [string | null, string | null] {
  try {
    return bounds(archiveDate(row));
  } catch {
    return [null, null];
  }
}
export function matchesArchiveDate(
  row: R,
  f: Pick<ArchiveFilters, "from" | "to" | "includeUnknown">,
) {
  if (f.from && f.to && f.from > f.to) return false;
  if (!f.from && !f.to) return true;
  const [start, end] = dateBounds(row);
  if (!start && !end) return f.includeUnknown;
  return (
    (!f.from || !end || end >= f.from) && (!f.to || !start || start <= f.to)
  );
}
export function archiveTitle(tab: ArchiveTab, r: R) {
  return tab === "records"
    ? `${r.entity_name}: ${archiveLabel(r.predicate)}`
    : tab === "timeline"
      ? r.title
      : tab === "sources"
        ? r.filename
        : r.name;
}
export function archiveRows(
  tab: ArchiveTab,
  rows: R[],
  f: ArchiveFilters,
): R[] {
  const dated = tab === "records" || tab === "timeline";
  const words = f.query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = rows.filter((r) => {
    if (dated) {
      if (f.category !== "all" && r.category !== f.category) return false;
      if (f.canon !== "all" && r.canon !== f.canon) return false;
      const old = !!r.archive_only || archiveOnly(r);
      if (
        (f.collection === "1725" && !old) ||
        (f.collection === "other" && old)
      )
        return false;
      if (!matchesArchiveDate(r, f)) return false;
      if (
        f.source !== "all" &&
        !(tab === "records"
          ? (r.evidence ?? []).some((e: R) => e.source_id === f.source)
          : r.source_id === f.source)
      )
        return false;
    }
    if (tab === "records" && f.entity !== "all" && r.entity_id !== f.entity)
      return false;
    const haystack = [
      archiveTitle(tab, r),
      r.id,
      r.value,
      tab === "records" ? readableArchiveValue(r.value) : "",
      r.category,
      r.canon,
      r.operation,
      dated ? archiveDate(r).label : "",
      r.notes,
      r.note,
      r.description,
      r.kind,
      r.path,
      ...(r.evidence ?? []).map((e: R) => e.filename),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return words.every((w) => haystack.includes(w));
  });
  return filtered.sort((a, b) => {
    if (dated && f.sort.startsWith("date")) {
      const x = dateBounds(a)[0] ?? dateBounds(a)[1],
        y = dateBounds(b)[0] ?? dateBounds(b)[1];
      if (!x && y) return 1;
      if (x && !y) return -1;
      const cmp = (x ?? "").localeCompare(y ?? "");
      if (cmp) return f.sort === "date-desc" ? -cmp : cmp;
    } else if (f.sort === "recorded") {
      if (!a.recorded_at && b.recorded_at) return 1;
      if (a.recorded_at && !b.recorded_at) return -1;
      const cmp = (b.recorded_at ?? "").localeCompare(a.recorded_at ?? "");
      if (cmp) return cmp;
    }
    return (
      String(archiveTitle(tab, a)).localeCompare(
        String(archiveTitle(tab, b)),
      ) || String(a.id).localeCompare(String(b.id))
    );
  });
}
export function archivePage<T>(rows: T[], page = 1, size = 25) {
  const safeSize = Math.max(1, Math.min(100, Math.floor(size) || 25)),
    pages = Math.max(1, Math.ceil(rows.length / safeSize));
  const current = Math.max(1, Math.min(pages, Math.floor(page) || 1));
  return {
    rows: rows.slice((current - 1) * safeSize, current * safeSize),
    page: current,
    pages,
    total: rows.length,
    start: rows.length ? (current - 1) * safeSize + 1 : 0,
    end: Math.min(current * safeSize, rows.length),
  };
}
