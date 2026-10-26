import { it, expect, beforeEach, afterEach } from "vitest";
import { backup } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase, one, all } from "../src/lib/db.ts";
import type { DB } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { adminAction } from "../src/lib/admin.ts";
import {
  saveRecordDraft,
  recordDraft,
  reviewRecordDraft,
  commitRecordDraft,
  recordReceipt,
} from "../src/lib/record-drafts.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
  importReviewedCanon(db);
});
afterEach(() => db.close());
const original =
  "  Original evidence, retained verbatim.\nSecond supplied line.  ";
const draft = (kind: string, payload: Record<string, string | string[]> = {}) =>
  saveRecordDraft(db, {
    kind,
    payload: {
      source_text: original,
      date_precision: "unknown",
      canon: "provisional",
      ...payload,
    },
  });
const approve = (id: string) => {
  const review = reviewRecordDraft(db, id);
  return commitRecordDraft(db, {
    id,
    revision: review.revision,
    token: review.token,
    reason: "Explicit test-only approval",
  });
};
const untouched = () =>
  [
    "sources",
    "entities",
    "assertions",
    "bills",
    "appointments",
    "timeline",
    "units",
    "movements",
    "treaties",
    "budgets",
    "ledger",
  ].map((t) => all(db, `SELECT * FROM ${t}`));

it("saves incomplete drafts without creating national facts and persists them through backup/restore", async () => {
  const before = untouched(),
    d = draft("bill", { title: "Unfinished draft" });
  expect(untouched()).toEqual(before);
  expect(() => reviewRecordDraft(db, d.id)).toThrow();
  expect(recordDraft(db, d.id).status).toBe("draft");
  const temp = mkdtempSync(path.join(tmpdir(), "rnas-record-draft-"));
  try {
    const file = path.join(temp, "backup.sqlite");
    await backup(db, file);
    const restored = openDatabase(file);
    try {
      expect(recordDraft(restored, d.id).payload.title).toBe(
        "Unfinished draft",
      );
      expect(one(restored, "PRAGMA foreign_key_check")).toBeUndefined();
    } finally {
      restored.close();
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
it("previews the exact shared operation without effects, then atomically creates a bill and sponsor once", () => {
  const d = draft("bill", {
    identifier: "TEST-GUIDED",
    title: "Test bill",
    summary: "Supplied summary",
    date: "1992-10-08",
    new_sponsor_name: "Fixture Sponsor",
  });
  const before = untouched(),
    r = reviewRecordDraft(db, d.id);
  expect(untouched()).toEqual(before);
  expect(r.links).toContain("New sponsor: Fixture Sponsor");
  const result = commitRecordDraft(db, {
    id: d.id,
    revision: r.revision,
    token: r.token,
    reason: "Test approval",
  });
  const sponsor = one(
    db,
    "SELECT * FROM bill_sponsors WHERE bill_id=?",
    result.target_id,
  )!;
  expect(
    one(db, "SELECT name FROM entities WHERE id=?", sponsor.person_id)!.name,
  ).toBe("Fixture Sponsor");
  expect(
    one(
      db,
      "SELECT content FROM sources WHERE id=(SELECT source_id FROM bills WHERE id=?)",
      result.target_id,
    )!.content,
  ).toBe(original);
  expect(
    commitRecordDraft(db, {
      id: d.id,
      revision: r.revision,
      token: r.token,
      reason: "Retry after connection loss",
    }).target_id,
  ).toBe(result.target_id);
  expect(
    all(db, "SELECT * FROM bills WHERE identifier='TEST-GUIDED'"),
  ).toHaveLength(1);
  expect(() =>
    saveRecordDraft(db, {
      id: d.id,
      revision: result.revision,
      kind: "bill",
      payload: { title: "Overwrite" },
    }),
  ).toThrow("Saved records");
  expect(recordReceipt(db, d.id)!.links).toContain(
    "New sponsor: Fixture Sponsor",
  );
});
it("rejects stale drafts and changed dependencies until re-reviewed", () => {
  const d = draft("unit", {
      name: "Fixture Formation",
      branch: "Army",
      unit_type: "Brigade",
    }),
    r = reviewRecordDraft(db, d.id);
  adminAction(db, {
    action: "unit",
    name: "Other fixture",
    branch: "Army",
    unit_type: "Brigade",
    source_text: original,
  });
  expect(() =>
    commitRecordDraft(db, {
      id: d.id,
      revision: r.revision,
      token: r.token,
      reason: "Old review",
    }),
  ).toThrow("changed");
  expect(
    all(db, "SELECT * FROM units WHERE name='Fixture Formation'"),
  ).toHaveLength(0);
  const updated = saveRecordDraft(db, {
    id: d.id,
    revision: d.revision,
    kind: d.kind,
    payload: { ...d.payload, name: "Revised fixture" },
  });
  expect(() =>
    saveRecordDraft(db, {
      id: d.id,
      revision: d.revision,
      kind: d.kind,
      payload: d.payload,
    }),
  ).toThrow("another window");
  expect(approve(updated.id).status).toBe("saved");
});
it("uses the existing appointment rules and rolls back new people on chronology failure", () => {
  const office = adminAction(db, {
    action: "office",
    name: "Fixture Office",
    authority: "Test authority",
  }).id;
  const good = draft("appointment", {
    office_id: office,
    new_person_name: "Fixture Minister",
    date: "1992-10-05",
    arrangement: "exclusive",
    explanation: "Test appointment authority",
  });
  const first = approve(good.id);
  expect(
    one(db, "SELECT start_date FROM appointments WHERE id=?", first.target_id)!
      .start_date,
  ).toBe("1992-10-05");
  const bad = draft("appointment", {
    office_id: office,
    new_person_name: "Rejected Fixture Minister",
    date: "1992-10-06",
    arrangement: "exclusive",
    explanation: "Test overlapping appointment",
  });
  const before = untouched();
  expect(() => reviewRecordDraft(db, bad.id)).toThrow("Overlapping");
  expect(untouched()).toEqual(before);
  expect(
    all(db, "SELECT * FROM entities WHERE name='Rejected Fixture Minister'"),
  ).toHaveLength(0);
});
it("links a historical event to several entities and a supplied missing person without guessing its date", () => {
  const ids = all(db, "SELECT id FROM entities ORDER BY id LIMIT 2").map(
    (e) => e.id as string,
  );
  const d = draft("historical_event", {
    title: "Fixture historical event",
    description: "Supplied historical account",
    category: "history",
    related_ids: ids,
    new_related_name: "Fixture Witness",
    new_related_kind: "person",
  });
  const result = approve(d.id),
    timeline = one(db, "SELECT * FROM timeline WHERE id=?", result.target_id)!;
  expect(JSON.parse(timeline.date_json).precision).toBe("unknown");
  expect(timeline.canon).toBe("provisional");
  expect(timeline.note).toBe("Supplied historical account");
  expect(
    all(
      db,
      "SELECT * FROM timeline_entities WHERE timeline_id=?",
      result.target_id,
    ),
  ).toHaveLength(3);
});
it("preserves partial treaty dates and links a newly supplied state transactionally", () => {
  const d = draft("treaty", {
    name: "Fixture Agreement",
    terms: "Reported terms only",
    operation: "proposal",
    date_precision: "month",
    date_label: "1992-10",
    participant_ids: [],
    new_nation_name: "Fixture Republic",
  });
  const result = approve(d.id),
    row = one(db, "SELECT * FROM treaties WHERE id=?", result.target_id)!;
  expect(row.operation).toBe("proposal");
  expect(JSON.parse(row.date_json).label).toBe("1992-10");
  expect(
    all(
      db,
      "SELECT * FROM treaty_participants WHERE treaty_id=?",
      result.target_id,
    ),
  ).toHaveLength(1);
});
it("preserves cited original source lines and rejects invalid citation ranges before any effect", () => {
  const source = one(
    db,
    "SELECT id,content FROM sources WHERE length(content)>100 ORDER BY id LIMIT 1",
  )!;
  const d = draft("person", {
    name: "Fixture Cited Person",
    source_id: source.id,
    line_start: "1",
    line_end: "2",
  });
  const result = approve(d.id),
    citation = one(
      db,
      "SELECT * FROM record_draft_citations WHERE draft_id=?",
      d.id,
    )!;
  expect(citation).toMatchObject({
    source_id: source.id,
    line_start: 1,
    line_end: 2,
  });
  expect(
    one(db, "SELECT content FROM sources WHERE id=?", source.id)!.content,
  ).toBe(source.content);
  expect(result.status).toBe("saved");
  const bad = draft("organization", {
    name: "Bad Citation",
    source_id: source.id,
    line_start: "999999",
    line_end: "999999",
  });
  const before = untouched();
  expect(() => reviewRecordDraft(db, bad.id)).toThrow("line range");
  expect(untouched()).toEqual(before);
});
it("keeps deployment orders separate from arrivals and preserves financial canon in every operation", () => {
  const money = all(db, "SELECT * FROM assertions WHERE category='economic'"),
    budgets = all(db, "SELECT * FROM budgets");
  const d = draft("deployment", {
    unit_id: "unit-3inf",
    location_id: one(db, "SELECT id FROM locations WHERE name='Dalmatia'")!.id,
    date: "1992-10-08",
    operation: "ordered",
    mission: "Test order",
  });
  const result = approve(d.id);
  expect(
    one(db, "SELECT * FROM movements WHERE id=?", result.target_id),
  ).toMatchObject({ operation: "ordered", completed_date: null });
  expect(all(db, "SELECT * FROM assertions WHERE category='economic'")).toEqual(
    money,
  );
  expect(all(db, "SELECT * FROM budgets")).toEqual(budgets);
});

it("rolls back all domain effects if final receipt linkage fails", () => {
  const d = draft("bill", {
    identifier: "TEST-ATOMIC",
    title: "Atomic bill",
    summary: "Test summary",
    date: "1992-10-09",
    new_sponsor_name: "Atomic Sponsor",
  });
  const review = reviewRecordDraft(db, d.id),
    before = untouched();
  db.exec(
    "CREATE TRIGGER test_reject_citation BEFORE INSERT ON record_draft_citations BEGIN SELECT RAISE(ABORT,'Injected receipt failure'); END;",
  );
  expect(() =>
    commitRecordDraft(db, {
      id: d.id,
      revision: review.revision,
      token: review.token,
      reason: "Explicit test approval",
    }),
  ).toThrow("Injected receipt failure");
  expect(untouched()).toEqual(before);
  expect(recordDraft(db, d.id).status).toBe("draft");
});

it("preserves historical ranges and rejects impossible bound dates", () => {
  const d = draft("historical_event", {
    title: "Fixture dated event",
    description: "Supplied account",
    category: "history",
    date_precision: "range",
    date_label: "During the documented interval",
    earliest: "1992-10-01",
    latest: "1992-10-09",
    related_ids: [],
  });
  const review = reviewRecordDraft(db, d.id);
  expect(review.fields).toContainEqual({
    label: "Earliest known bound",
    value: "1992-10-01",
  });
  const saved = approve(d.id);
  expect(
    JSON.parse(
      one(db, "SELECT date_json FROM timeline WHERE id=?", saved.target_id)!
        .date_json,
    ),
  ).toMatchObject({
    precision: "range",
    earliest: "1992-10-01",
    latest: "1992-10-09",
  });
  const bad = draft("historical_event", {
    title: "Bad date",
    description: "Test",
    category: "history",
    date_precision: "range",
    date_label: "Impossible date",
    earliest: "1992-02-30",
    latest: "1992-10-09",
  });
  expect(() => reviewRecordDraft(db, bad.id)).toThrow();
});
