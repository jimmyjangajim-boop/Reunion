import { beforeEach, afterEach, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { openDatabase, all } from "../src/lib/db.ts";
import type { DB } from "../src/lib/db.ts";
import {
  archiveRows,
  archivePage,
  archiveDate,
  emptyArchiveFilters,
  readableArchiveValue,
  matchesArchiveDate,
} from "../src/lib/archive-view.ts";
import { searchArchiveText } from "../src/lib/archive-search.ts";
import {
  search,
  createUserSource,
  assertionRows,
  evidenceFor,
  snapshot,
} from "../src/lib/canon.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { administrationView } from "../src/lib/administration-view.ts";
import ArchiveWorkspace, {
  ArchiveDetail,
} from "../src/components/ArchiveWorkspace";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
});
afterEach(() => db.close());
const date = (precision = "day", label = "1992-10-03", extra = {}) =>
  JSON.stringify({ precision, label, ...extra });
const rows = [
  {
    id: "r1",
    entity_id: "reunion",
    entity_name: "Reunion",
    predicate: "Vice President",
    value: "Darius Younger",
    category: "political",
    canon: "confirmed",
    operation: "operational",
    date_json: date(),
    recorded_at: "2026-10-01",
    evidence: [{ source_id: "s1", filename: "User answers.txt" }],
  },
  {
    id: "r2",
    entity_id: "reunion",
    entity_name: "Reunion",
    predicate: "Vice President",
    value: "Jack Younger",
    category: "political",
    canon: "superseded",
    operation: "unknown",
    date_json: date("unknown", "Unknown"),
    recorded_at: "2026-10-03",
    superseded_by: "r1",
    evidence: [{ source_id: "s2", filename: "Old baseline.txt" }],
  },
  {
    id: "r3",
    entity_id: "crown",
    entity_name: "Crown",
    predicate: "Reigning monarch",
    value: "Historical king",
    category: "history",
    canon: "confirmed",
    operation: "unknown",
    date_json: date("year", "1725"),
    recorded_at: "2026-10-02",
    evidence: [],
  },
  {
    id: "r4",
    entity_id: "military",
    entity_name: "Military",
    predicate: "current_disposition",
    value: '{"formation":"Brigade","count":0,"ready":false}',
    category: "military",
    canon: "provisional",
    operation: "ordered",
    date_json: date("month", "1992-10"),
    recorded_at: "2026-10-04",
    evidence: [],
  },
];
const f = (patch = {}) => ({ ...emptyArchiveFilters, ...patch });
it("searches all words across readable records, dates and exact source filenames", () => {
  expect(
    archiveRows("records", rows, f({ query: "darius USER" })).map((r) => r.id),
  ).toEqual(["r1"]);
  expect(
    archiveRows("records", rows, f({ query: "current situation Brigade" })).map(
      (r) => r.id,
    ),
  ).toEqual(["r4"]);
  expect(
    archiveRows("records", rows, f({ query: "1725" })).map((r) => r.id),
  ).toEqual(["r3"]);
  expect(archiveRows("records", rows, f({ query: "not present" }))).toEqual([]);
});
it("filters canon, category, entity, source and 1725 without losing superseded rows", () => {
  expect(archiveRows("records", rows, f()).length).toBe(4);
  for (const [patch, ids] of [
    [{ canon: "superseded" }, ["r2"]],
    [{ category: "military" }, ["r4"]],
    [{ entity: "reunion", source: "s1" }, ["r1"]],
    [{ collection: "1725" }, ["r3"]],
    [{ source: "missing" }, []],
  ] as const)
    expect(archiveRows("records", rows, f(patch)).map((r) => r.id)).toEqual(
      ids,
    );
  expect(
    archiveRows("records", rows, f({ collection: "other" })).some(
      (r) => r.id === "r3",
    ),
  ).toBe(false);
});
it("uses date-window overlap, preserves precision and explicitly includes unknown dates", () => {
  expect(
    archiveRows(
      "records",
      rows,
      f({ from: "1992-10-20", to: "1992-10-22", includeUnknown: false }),
    ).map((r) => r.id),
  ).toEqual(["r4"]);
  expect(
    archiveRows("records", rows, f({ from: "1992-10-20", to: "1992-10-22" }))
      .map((r) => r.id)
      .sort(),
  ).toEqual(["r2", "r4"]);
  expect(archiveDate(rows[3]).precision).toBe("month");
  expect(archiveDate({ date_json: "broken" }).precision).toBe("unknown");
  const relative = { date_json: date("relative", "October 1992") };
  expect(
    matchesArchiveDate(
      relative,
      f({ from: "1992-01-01", includeUnknown: false }),
    ),
  ).toBe(false);
  expect(
    matchesArchiveDate(
      {
        date_json: date("after", "After ceasefire", { earliest: "1992-10-17" }),
      },
      f({ from: "1993-01-01", includeUnknown: false }),
    ),
  ).toBe(true);
  expect(
    matchesArchiveDate(rows[1], f({ from: "1993-01-01", to: "1992-01-01" })),
  ).toBe(false);
});
it("sorts historical windows with unknown dates last without mutating input", () => {
  const before = JSON.stringify(rows);
  expect(
    archiveRows("records", rows, f({ sort: "date-asc" })).map((r) => r.id),
  ).toEqual(["r3", "r4", "r1", "r2"]);
  expect(
    archiveRows("records", rows, f({ sort: "date-desc" })).map((r) => r.id),
  ).toEqual(["r1", "r4", "r3", "r2"]);
  expect(
    archiveRows("records", rows, f({ sort: "recorded" })).map((r) => r.id),
  ).toEqual(["r4", "r2", "r3", "r1"]);
  expect(JSON.stringify(rows)).toBe(before);
});
it("keeps timeline source filters distinct from source/entity metadata filters", () => {
  const events = [
    {
      id: "e",
      title: "Event",
      date_json: date(),
      source_id: "s1",
      category: "history",
      canon: "provisional",
      operation: "proposal",
    },
  ];
  expect(
    archiveRows("timeline", events, f({ source: "s1", entity: "ignored" })),
  ).toHaveLength(1);
  expect(archiveRows("timeline", events, f({ source: "s2" }))).toEqual([]);
  expect(
    archiveRows(
      "sources",
      [
        {
          id: "s1",
          filename: "Economic ledger",
          path: "sources/ledger.txt",
          tier: 1,
          kind: "original",
        },
      ],
      f({
        query: "ledger.txt",
        canon: "superseded",
        from: "1900-01-01",
        source: "s2",
      }),
    ),
  ).toHaveLength(1);
  expect(
    archiveRows(
      "entities",
      [
        {
          id: "x",
          name: "Named person",
          kind: "person",
          description: "Original biography",
        },
      ],
      f({ query: "biography", entity: "other" }),
    ),
  ).toHaveLength(1);
});
it("paginates bounded results, clamps stale pages and handles an empty library", () => {
  const many = Array.from({ length: 61 }, (_, i) => i);
  expect(archivePage(many, 2)).toMatchObject({
    page: 2,
    pages: 3,
    total: 61,
    start: 26,
    end: 50,
  });
  expect(archivePage(many, 999).rows).toEqual(many.slice(50));
  expect(archivePage([], 5)).toMatchObject({
    rows: [],
    page: 1,
    pages: 1,
    start: 0,
    end: 0,
  });
  expect(archivePage(many, -1).page).toBe(1);
});
it("renders readable JSON including zero and false without changing the stored value", () => {
  expect(readableArchiveValue(rows[3].value)).toBe(
    "Formation: Brigade · Count: 0 · Ready: No",
  );
  expect(readableArchiveValue("ordinary prose")).toBe("ordinary prose");
});
function indexFixture() {
  const lines = Array.from(
    { length: 91 },
    (_, i) => `Archive fixture passage ${i + 1}: multilingual Šibenik record.`,
  );
  const id = createUserSource(db, lines.join("\n"));
  // Per-line chunks deliberately exceed the older global search's 80-result cap.
  db.prepare("DELETE FROM source_fts WHERE source_id=?").run(id);
  for (let i = 0; i < lines.length; i++)
    db.prepare(
      "INSERT INTO source_fts(text,source_id,line_start,line_end) VALUES(?,?,?,?)",
    ).run(lines[i], id, i + 1, i + 1);
  return id;
}
it("paginates original-text matches beyond the old global-search cap with stable source lines", () => {
  const id = indexFixture(),
    before = all(db, "SELECT * FROM sources"),
    seen = new Set();
  for (let page = 1; page <= 4; page++) {
    const result = searchArchiveText(db, { query: "archive fixture", page });
    expect(result.total).toBe(91);
    expect(result.pages).toBe(4);
    expect(result.rows.length).toBe(page === 4 ? 16 : 25);
    for (const r of result.rows) {
      expect(r.source_id).toBe(id);
      expect(r.line_start).toBe(r.line_end);
      expect(r.excerpt).toContain("⟦");
      expect(seen.has(r.id)).toBe(false);
      seen.add(r.id);
    }
  }
  expect(seen.size).toBe(91);
  expect(search(db, "archive fixture")).toHaveLength(80);
  expect(all(db, "SELECT * FROM sources")).toEqual(before);
});
it("filters original text by source and handles empty, literal FTS syntax and bad pagination safely", () => {
  const id = indexFixture();
  const other = createUserSource(db, "Different words only.");
  expect(
    searchArchiveText(db, { query: "Šibenik", source: id, page: 999 }),
  ).toMatchObject({ total: 91, page: 4 });
  expect(
    searchArchiveText(db, { query: "Šibenik", source: other }).rows,
  ).toEqual([]);
  expect(searchArchiveText(db, { query: "" })).toMatchObject({
    total: 0,
    rows: [],
  });
  expect(searchArchiveText(db, { query: '" OR * NEAR()' }).rows).toEqual([]);
  expect(() => searchArchiveText(db, { query: "x", page: -1 })).toThrow();
  expect(() => searchArchiveText(db, { query: "x", size: 101 })).toThrow();
  expect(() => searchArchiveText(db, { query: "x".repeat(2001) })).toThrow();
});
it("renders only one page of compact rows with creation and search controls", () => {
  const records = Array.from({ length: 61 }, (_, i) => ({
    ...rows[0],
    id: "r" + i,
    predicate: `Fixture ${String(i).padStart(3, "0")}`,
  }));
  const html = renderToStaticMarkup(
    React.createElement(ArchiveWorkspace, {
      records,
      timeline: [],
      sources: [],
      entities: [],
      tab: "records",
      onTabChange: () => {},
      openSource: () => {},
      onAdd: () => {},
    }),
  );
  expect((html.match(/class="text-button archive-title"/g) || []).length).toBe(
    25,
  );
  expect(html).toContain("1–25 of 61");
  expect(html).toContain("Add Historical Record");
  expect(html).toContain("1725 campaign only");
  expect(html).not.toContain("record-grid");
  expect(html).not.toContain("Source provenance");
});
it("shows exact supersession, evidence and linked entity only inside record detail", () => {
  const item = {
    ...rows[1],
    evidence: [
      {
        source_id: "s1",
        filename: "Old source",
        line_start: 10,
        line_end: 12,
        excerpt: "Preserved source text",
        tier: 2,
      },
    ],
  };
  const html = renderToStaticMarkup(
    React.createElement(ArchiveDetail, {
      item,
      kind: "records",
      records: rows,
      timeline: [],
      sources: [],
      entities: [{ id: "reunion", name: "Reunion", kind: "country" }],
      onClose: () => {},
      onSource: () => {},
      onItem: () => {},
      onBrowse: () => {},
    }),
  );
  expect(html).toContain("Preserved superseded record");
  expect(html).toContain("Replaced by:");
  expect(html).toContain("Darius Younger");
  expect(html).toContain("Lines 10–12");
  expect(html).toContain("Preserved source text");
  expect(html).toContain("Recorded timestamp");
});
it("links sources to records/events and entities using real IDs rather than inferred participants", () => {
  const item = {
    id: "s1",
    filename: "Fixture source",
    path: "original/path",
    sha256: "abcd",
    bytes: 10,
    tier: 1,
    kind: "original",
  };
  const html = renderToStaticMarkup(
    React.createElement(ArchiveDetail, {
      item,
      kind: "sources",
      records: rows,
      timeline: [
        { id: "t1", title: "Event", source_id: "s1", date_json: date() },
      ],
      sources: [item],
      entities: [],
      onClose: () => {},
      onSource: () => {},
      onItem: () => {},
      onBrowse: () => {},
    }),
  );
  expect(html).toContain("Linked records (1)");
  expect(html).toContain("Linked events (1)");
  expect(html).toContain("original/path");
  expect(html).toContain("abcd");
});
it("keeps the imported archive, superseded aliases and 1725 evidence while active views remain unchanged", () => {
  importRecovery(db);
  importReviewedCanon(db);
  const records = assertionRows(db).map((r) => ({
      ...r,
      evidence: evidenceFor(db, r.id),
    })),
    entities = all(db, "SELECT * FROM entities"),
    dated = snapshot(db, "1992-10-03"),
    issues = all(db, "SELECT * FROM issues");
  const before = administrationView(records, dated, entities, issues),
    stored = all(db, "SELECT * FROM assertions");
  expect(
    archiveRows("records", before.records, f({ collection: "1725" })).length,
  ).toBeGreaterThan(0);
  expect(
    archiveRows(
      "records",
      before.records,
      f({ canon: "superseded", query: "Jack Younger" }),
    ),
  ).toHaveLength(1);
  expect(all(db, "SELECT * FROM assertions")).toEqual(stored);
  expect(administrationView(records, dated, entities, issues)).toEqual(before);
  expect(before.administrationRecords.some((r) => r.archive_only)).toBe(false);
});
