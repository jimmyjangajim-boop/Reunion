import { beforeAll, afterAll, it, expect } from "vitest";
import { openDatabase, all } from "../src/lib/db.ts";
import type { DB, Row } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { assertionRows, evidenceFor, snapshot } from "../src/lib/canon.ts";
import {
  administrationView,
  archiveOnly,
} from "../src/lib/administration-view.ts";
let db: DB, records: Row[], entities: Row[], issues: Row[];
beforeAll(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
  importReviewedCanon(db);
  records = assertionRows(db).map((r) => ({
    ...r,
    evidence: evidenceFor(db, r.id),
  }));
  entities = all(db, "SELECT * FROM entities");
  issues = all(db, "SELECT * FROM issues");
});
afterAll(() => db.close());
const view = (date = "1992-10-03") =>
  administrationView(records, snapshot(db, date), entities, issues);
it("renders one government entry per office, with one Darius VP and no designated heir", () => {
  const data = view();
  expect(data.government).toHaveLength(4);
  expect(data.government.map((r) => r.predicate)).toEqual([
    "President",
    "Vice President",
    "Reigning monarch",
    "Heir",
  ]);
  expect(
    data.government.find((r) => r.predicate === "Vice President"),
  ).toMatchObject({ value: "Darius Younger", canon: "confirmed" });
  expect(
    data.government.find((r) => r.predicate === "Reigning monarch"),
  ).toMatchObject({ value: "King Zo III" });
  expect(data.government.find((r) => r.predicate === "Heir")).toMatchObject({
    value: "No designated heir",
    register_context: "undated_canon",
  });
  expect(
    data.government.some(
      (r) =>
        r.value === "Jack Younger" ||
        r.value === "Zo III" ||
        r.value.includes("Aurelios"),
    ),
  ).toBe(false);
});
it("retains old VP, heir aliases, evidence and 1725 claims in the archive", () => {
  const data = view();
  for (const id of [
    "baseline-vp-old",
    "heir",
    "royal-person-heir",
    "1725-crown",
    "1725-population",
    "1725-debt",
    "1725-regulars",
  ])
    expect(
      data.records.find((r) => r.id === id)?.evidence.length,
    ).toBeGreaterThan(0);
  expect(data.records.find((r) => r.id === "baseline-vp-old")).toMatchObject({
    value: "Jack Younger",
    canon: "superseded",
  });
  expect(data.records.find((r) => r.id === "1725-crown")).toMatchObject({
    archive_only: true,
    canon: "confirmed",
  });
  expect(
    data.administrationRecords.some(
      (r) => r.archive_only || ["superseded", "rejected"].includes(r.canon),
    ),
  ).toBe(false);
});
it("excludes 1725 from active snapshots while preserving historical snapshot records and timeline", () => {
  const before = all(db, "SELECT * FROM timeline");
  expect(snapshot(db, "1725-01-01").length).toBeGreaterThan(0);
  expect(view("1725-01-01").snapshot).toEqual([]);
  expect(
    view("1725-01-01").government.some((r) => r.value.includes("Aurelios")),
  ).toBe(false);
  expect(all(db, "SELECT * FROM timeline")).toEqual(before);
  expect(before.some((r) => r.id === "T009")).toBe(true);
});
it("keeps obsolete heirs and historical-only people out of active appointment choices", () => {
  const data = view();
  for (const id of ["P001", "P002", "heir-zo-iii"]) {
    expect(data.currentEntities.some((e) => e.id === id)).toBe(false);
    expect(entities.some((e) => e.id === id)).toBe(true);
  }
  expect(data.currentEntities.some((e) => e.id === "king-zo-iii")).toBe(true);
});
it("does not carry dated officeholders forward or invent a date for the heir decision", () => {
  const data = view("1993-10-03");
  expect(
    data.government.find((r) => r.predicate === "Vice President"),
  ).toMatchObject({
    value: "Unknown for selected date",
    register_context: "unknown",
  });
  const heir = data.government.find((r) => r.predicate === "Heir")!;
  expect(heir.valid_from).toBeNull();
  expect(heir.register_context).toBe("undated_canon");
});
it("classifies historical context by dates, without hiding modern claims mentioning 1725", () => {
  expect(
    archiveOnly({
      date_json: JSON.stringify({ precision: "relative", label: "Early 1725" }),
    }),
  ).toBe(true);
  expect(
    archiveOnly({
      date_json: JSON.stringify({ precision: "day", label: "1992-10-03" }),
      value: "A modern summary of 1725 history",
    }),
  ).toBe(false);
  expect(archiveOnly({ date_json: "unreadable" })).toBe(false);
});
it("keeps historical review issues available separately without current inbox noise", () => {
  const data = administrationView(records, [], entities, [
    { id: "historical", a_id: "1725-crown", title: "Old monarch" },
    { id: "modern", a_id: "override-vp", title: "Current VP" },
  ]);
  expect(data.issues.map((i) => i.id)).toEqual(["modern"]);
  expect(data.archiveIssues.map((i) => i.id)).toEqual(["historical"]);
});
