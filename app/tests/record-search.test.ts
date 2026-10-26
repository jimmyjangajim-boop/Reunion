import { beforeEach, afterEach, it, expect } from "vitest";
import { openDatabase, all, one } from "../src/lib/db.ts";
import type { DB } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { adminAction } from "../src/lib/admin.ts";
import { createUserSource } from "../src/lib/canon.ts";
import { createEntity } from "../src/lib/record-commands.ts";
import { operationalKinds } from "../src/lib/record-catalog.ts";
import {
  domainRecordDetails,
  recordQueries,
} from "../src/lib/domain-records.ts";
import { searchRecords } from "../src/lib/record-search.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
  importReviewedCanon(db);
});
afterEach(() => db.close());
function fixtures() {
  const action = (input: object) =>
    adminAction(db, { source_text: "Search fixture authority", ...input });
  const budget = action({
    action: "budget",
    name: "Search fixture program",
    fiscal_year: 1992,
    currency: "USD",
    appropriated: 100,
  }).id;
  const ledger = action({
    action: "ledger",
    budget_id: budget,
    date: "1992-10-05",
    stage: "committed",
    amount: 40,
    reference: "SEARCH-COMMIT",
    memo: "Search fixture purpose",
  }).id;
  const bill = action({
    action: "bill",
    identifier: "SEARCH-BILL",
    title: "Search fixture bill",
    date: "1993-01-05",
    summary: "Supplied future proposal",
  }).id;
  const chamber = one(db, "SELECT * FROM chambers LIMIT 1")!;
  action({
    action: "vote",
    bill_id: bill,
    chamber_id: chamber.id,
    date: "1993-01-06",
    voting_seats: chamber.actual_seats,
    yes: 0,
    no: 0,
    abstain: 0,
    absent: chamber.actual_seats,
    vacancies: 0,
    rule_source: "Supplied test rule",
    explanation: "Isolated test session authority",
  });
  action({
    action: "asset",
    name: "Search fixture tracked asset",
    type: "vehicle",
    operation: "under repair",
  });
  action({
    action: "treaty",
    name: "Search fixture treaty",
    operation: "proposal",
    terms: "Reported test terms",
    signatories: "Unlinked reported name",
    date_info: { precision: "month", label: "1992-10" },
  });
  action({
    action: "movement",
    unit_id: "unit-3inf",
    location_id: one(db, "SELECT id FROM locations WHERE name='Dalmatia'")!.id,
    date: "1993-01-06",
    operation: "ordered",
    mission: "Search fixture future order",
  });
  return { budget, ledger, bill };
}
it("finds and opens all fourteen primary operational types by exact identity without writes", () => {
  fixtures();
  const changes = one(db, "SELECT total_changes() n")!.n;
  for (const kind of operationalKinds) {
    const row = all(db, recordQueries[kind])[0];
    expect(row, kind).toBeDefined();
    const matches = searchRecords(db, { query: row.id, kind });
    expect(matches.rows).toContainEqual(
      expect.objectContaining({ kind, id: row.id }),
    );
    expect(domainRecordDetails(db, kind, row.id)).toMatchObject({
      kind,
      id: row.id,
    });
  }
  expect(one(db, "SELECT total_changes() n")!.n).toBe(changes);
});
it("uses explicit joined names, category/type filters and dates without completing future records", () => {
  const { budget, ledger, bill } = fixtures();
  expect(
    searchRecords(db, {
      query: "fixture program",
      category: "Economy & treasury",
      kind: "ledger",
    }).rows,
  ).toContainEqual(expect.objectContaining({ id: ledger }));
  expect(domainRecordDetails(db, "ledger", ledger).links).toContainEqual(
    expect.objectContaining({ kind: "budget", id: budget }),
  );
  expect(domainRecordDetails(db, "budget", budget).links).toContainEqual(
    expect.objectContaining({ kind: "ledger", id: ledger }),
  );
  const future = searchRecords(db, { query: "SEARCH-BILL", kind: "bill" });
  expect(future.rows[0]).toMatchObject({ id: bill, date: "1993-01-05" });
  expect(
    searchRecords(db, {
      query: "Search fixture",
      category: "Military",
      kind: "bill",
    }).total,
  ).toBe(0);
  const move = searchRecords(db, {
    query: "Dalmatia Infantry",
    kind: "deployment",
  }).rows[0];
  expect(move).toBeDefined();
  expect(domainRecordDetails(db, "deployment", move.id).fields).toContainEqual({
    label: "Confirmed arrival date",
    value: "Not recorded",
  });
});
it("pages across the normalized/source boundary and beyond 100 passages without gaps or duplicates", () => {
  for (let i = 0; i < 3; i++)
    createEntity(db, {
      id: `page-${i}`,
      name: `Pagingtoken identity ${i}`,
      kind: "person",
      description: "",
    });
  for (let i = 0; i < 127; i++)
    createUserSource(
      db,
      `Pagingtoken preserved source ${i}\nSecond exact line.`,
    );
  const first = searchRecords(db, { query: "Pagingtoken", size: 7 });
  expect(first.total).toBe(130);
  expect(first.rows.filter((r) => r.kind === "source")).toHaveLength(4);
  const keys: string[] = [];
  for (let page = 1; page <= first.pages; page++) {
    const result = searchRecords(db, { query: "Pagingtoken", page, size: 7 });
    keys.push(...result.rows.map((r) => `${r.kind}:${r.id}`));
    for (const row of result.rows.filter((r) => r.kind === "source")) {
      expect(row).toMatchObject({ line_start: 1, line_end: 2 });
      expect(
        one(db, "SELECT content FROM sources WHERE id=?", row.source_id)!
          .content,
      ).toContain("Pagingtoken preserved source");
    }
  }
  expect(keys).toHaveLength(130);
  expect(new Set(keys).size).toBe(130);
  expect(
    searchRecords(db, { query: "Pagingtoken", page: 999, size: 7 }).page,
  ).toBe(first.pages);
});
it("retains superseded and 1725 archive evidence and treats source syntax as text", () => {
  expect(
    searchRecords(db, { query: "Aurelios", kind: "entity" }).rows.some((r) =>
      r.title.includes("Aurelios"),
    ),
  ).toBe(true);
  expect(
    searchRecords(db, { query: "Jack Younger", kind: "fact" }).rows.some(
      (r) => r.canon === "superseded",
    ),
  ).toBe(true);
  const before = one(db, "SELECT total_changes() n")!.n;
  expect(searchRecords(db, { query: '" OR NOT *' }).rows).toBeDefined();
  expect(searchRecords(db, { query: "!!!" }).total).toBe(0);
  expect(() => searchRecords(db, { query: " " })).toThrow();
  expect(() =>
    searchRecords(db, { query: Array(13).fill("word").join(" ") }),
  ).toThrow("twelve words");
  expect(() => searchRecords(db, { query: "x", page: 0 })).toThrow();
  expect(() =>
    searchRecords(db, { query: "x", kind: "record_drafts" }),
  ).toThrow();
  expect(() => domainRecordDetails(db, "__proto__" as any, "x")).toThrow(
    "Unsupported",
  );
  expect(() => domainRecordDetails(db, "bill", "' OR 1=1 --")).toThrow(
    "unavailable",
  );
  expect(one(db, "SELECT total_changes() n")!.n).toBe(before);
});
it("preserves zero counts, unknown dates and financial source semantics without aggregating money", () => {
  const { budget, ledger } = fixtures();
  const unit = domainRecordDetails(db, "unit", "unit-3inf");
  expect(unit.fields).toContainEqual({
    label: "Formation date",
    value: "Not recorded",
  });
  const procurement = all(db, recordQueries.procurement).find(
    (r) => r.operational === 0,
  )!;
  expect(
    domainRecordDetails(db, "procurement", procurement.id).fields,
  ).toContainEqual({ label: "Operational count", value: "0" });
  expect(domainRecordDetails(db, "ledger", ledger).fields).toContainEqual({
    label: "Accounting stage",
    value: "committed",
  });
  expect(domainRecordDetails(db, "budget", budget).fields).toContainEqual({
    label: "Stored appropriation, whole currency units",
    value: "100",
  });
  const readableBudget = adminAction(db, {
    action: "budget",
    name: "Readable source amount",
    fiscal_year: 1992,
    currency: "USD",
    appropriated: 1000000,
    source_text: "Explicit isolated amount authority",
  }).id;
  expect(
    domainRecordDetails(db, "budget", readableBudget).fields,
  ).toContainEqual({
    label: "Stored appropriation, whole currency units",
    value: "1,000,000",
  });
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", readableBudget)!
      .appropriated,
  ).toBe(1000000);
  const project = all(db, recordQueries.project)[0];
  expect(domainRecordDetails(db, "project", project.id).note).toContain(
    "do not establish actual ledger payments",
  );
});
