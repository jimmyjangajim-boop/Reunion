import { z } from "zod";
import { all } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { assertionRows } from "./canon.ts";
import {
  archiveRows,
  archiveDate,
  emptyArchiveFilters,
  readableArchiveValue,
} from "./archive-view.ts";
import { searchArchiveText } from "./archive-search.ts";
import { domainRecordTitle, recordQueries } from "./domain-records.ts";
import {
  operationalKinds,
  recordCatalog,
  searchCategories,
  searchKinds,
  type SearchCategory,
  type SearchHit,
  type SearchPage,
} from "./record-catalog.ts";

function category(kind?: string): SearchCategory {
  if (kind === "person") return "People";
  if (
    [
      "institution",
      "organization",
      "party",
      "law",
      "political",
      "constitutional",
    ].includes(kind ?? "")
  )
    return "Government & politics";
  if (["unit", "battle", "military"].includes(kind ?? "")) return "Military";
  if (["project", "economic"].includes(kind ?? "")) return "Economy & treasury";
  if (["nation", "place", "location", "territory"].includes(kind ?? ""))
    return "Places";
  if (kind === "diplomatic") return "Diplomacy";
  return "Historical archive";
}
function date(row: Row): string | undefined {
  if (row.date_json) return archiveDate(row).label;
  return (
    row.date ??
    row.start_date ??
    row.introduced_date ??
    row.formed_date ??
    undefined
  );
}
/** Read-only search of existing canonical tables. No search index or shadow record store is written. */
export function searchRecords(db: DB, input: unknown): SearchPage {
  const data = z
    .object({
      query: z
        .string()
        .trim()
        .min(1, "Enter a name or phrase to search.")
        .max(2000),
      category: z.enum(["all", ...searchCategories]).default("all"),
      kind: z.enum(["all", ...searchKinds]).default("all"),
      page: z.coerce.number().int().min(1).max(100000).default(1),
      size: z.coerce.number().int().min(1).max(50).default(12),
    })
    .parse(input);
  const terms = data.query.match(/[\p{L}\p{N}_-]+/gu) ?? [];
  if (terms.length > 12)
    throw Error("Use twelve words or fewer for a focused search.");
  if (!terms.length)
    return {
      rows: [],
      total: 0,
      page: 1,
      pages: 1,
      size: data.size,
      categories: {},
    };
  const query = terms.join(" ");
  const matches = (values: unknown[]) => {
    const text = values.join(" ").toLocaleLowerCase();
    return terms.every((term) => text.includes(term.toLocaleLowerCase()));
  };
  const hits: SearchHit[] = [];
  for (const kind of operationalKinds) {
    for (const row of all(db, recordQueries[kind])) {
      if (!matches(Object.values(row))) continue;
      hits.push({
        kind,
        id: row.id,
        title: domainRecordTitle(kind, row),
        type: recordCatalog[kind].title,
        category: recordCatalog[kind].category,
        date: date(row),
        canon: row.canon,
        excerpt: String(
          row.summary ??
            row.mission ??
            row.terms ??
            row.notes ??
            row.memo ??
            row.authority ??
            row.outcome ??
            row.branch ??
            row.operation ??
            "",
        ).slice(0, 280),
      });
    }
  }
  const filters = { ...emptyArchiveFilters, query };
  for (const row of archiveRows(
    "entities",
    all(db, "SELECT * FROM entities"),
    filters,
  ))
    hits.push({
      kind: "entity",
      id: row.id,
      title: row.name,
      type: `Archive identity · ${row.kind}`,
      category: category(row.kind),
      excerpt: String(row.description ?? "").slice(0, 280),
    });
  for (const row of archiveRows("records", assertionRows(db), filters))
    hits.push({
      kind: "fact",
      id: row.id,
      title: `${row.entity_name}: ${row.predicate.replaceAll("_", " ")}`,
      type: "Sourced fact",
      category: category(row.category),
      excerpt: readableArchiveValue(row.value).slice(0, 280),
      date: archiveDate(row).label,
      canon: row.canon,
    });
  for (const row of archiveRows(
    "timeline",
    all(db, "SELECT * FROM timeline"),
    filters,
  ))
    hits.push({
      kind: "event",
      id: row.id,
      title: row.title,
      type: "Historical event",
      category: category(row.category),
      excerpt: String(row.note ?? "").slice(0, 280),
      date: archiveDate(row).label,
      canon: row.canon,
    });
  for (const row of all(db, "SELECT id,filename,path,kind FROM sources")) {
    if (matches([row.filename, row.path, row.kind]))
      hits.push({
        kind: "source",
        id: `metadata:${row.id}`,
        source_id: row.id,
        title: row.filename,
        type: "Source metadata",
        category: "Sources",
        excerpt: row.path,
      });
  }
  const firstSource = searchArchiveText(db, {
    query,
    page: 1,
    size: data.size,
  });
  const selectedKinds = hits.filter(
    (h) => data.kind === "all" || h.kind === data.kind,
  );
  const categories: SearchPage["categories"] = {};
  for (const h of selectedKinds)
    categories[h.category] = (categories[h.category] ?? 0) + 1;
  const includesSources = data.kind === "all" || data.kind === "source";
  if (includesSources)
    categories.Sources = (categories.Sources ?? 0) + firstSource.total;
  const normalized = selectedKinds
    .filter((h) => data.category === "all" || h.category === data.category)
    .sort(
      (a, b) =>
        a.title.localeCompare(b.title) ||
        a.kind.localeCompare(b.kind) ||
        a.id.localeCompare(b.id),
    );
  const sourcesAllowed =
    includesSources && (data.category === "all" || data.category === "Sources");
  const total = normalized.length + (sourcesAllowed ? firstSource.total : 0);
  const pages = Math.max(1, Math.ceil(total / data.size)),
    page = Math.min(data.page, pages);
  const start = (page - 1) * data.size;
  const rows = normalized.slice(start, start + data.size);
  // Source passages follow normalized records. Fetch only the one or two FTS pages needed,
  // including when the boundary falls halfway through a visible search page.
  if (sourcesAllowed && rows.length < data.size) {
    const offset = Math.max(0, start - normalized.length);
    const sourcePage = Math.floor(offset / data.size) + 1;
    if (offset < firstSource.total) {
      const first =
        sourcePage === 1
          ? firstSource
          : searchArchiveText(db, { query, page: sourcePage, size: data.size });
      const passages = first.rows.slice(offset % data.size);
      if (passages.length < data.size - rows.length && sourcePage < first.pages)
        passages.push(
          ...searchArchiveText(db, {
            query,
            page: sourcePage + 1,
            size: data.size,
          }).rows,
        );
      rows.push(
        ...passages.slice(0, data.size - rows.length).map((r) => ({
          kind: "source" as const,
          id: `passage:${r.id}`,
          source_id: r.source_id,
          line_start: r.line_start,
          line_end: r.line_end,
          title: r.filename,
          type: "Original source passage",
          category: "Sources" as const,
          excerpt: r.excerpt,
        })),
      );
    }
  }
  return { rows, total, pages, page, size: data.size, categories };
}
