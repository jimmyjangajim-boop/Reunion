import { beforeEach, afterEach, it, expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { openDatabase, all, one, migrate } from "../src/lib/db.ts";
import type { DB, Row } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import {
  submitReport,
  approveReport,
  editReportAction,
  reportDetail,
} from "../src/lib/reports.ts";
import { extractLegislation } from "../src/lib/legislation.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
});
afterEach(() => db.close());
const submit = (
  body = "Parliament passed Bill TEST-1: Public works",
  extra: Row = {},
) =>
  submitReport(db, {
    title: "Legislative fixture",
    date: "1992-10-04",
    body,
    ...extra,
  });
const approve = (r: Row) =>
  approveReport(db, {
    report_id: r.id,
    revision: r.revision,
    action_ids: r.actions.map((a: Row) => a.id),
    reason: "Accept explicitly reported stages",
  });
const count = (table: string) => one(db, `SELECT count(*) n FROM ${table}`)!.n;
it("preserves a proposal, then approves sourced passage without inventing enactment, votes or money", () => {
  const before = {
    votes: count("votes"),
    ledger: count("ledger"),
    budgets: count("budgets"),
    bills: count("bills"),
  };
  const r = submit();
  expect(r.actions[0]).toMatchObject({ kind: "legislation", ready: true });
  expect(count("bills")).toBe(before.bills);
  approve(r);
  expect(
    one(db, "SELECT * FROM bills WHERE identifier='TEST-1'"),
  ).toMatchObject({
    stage: "passed",
    introduced_date: null,
    effective_date: null,
  });
  expect(count("votes")).toBe(before.votes);
  expect(count("ledger")).toBe(before.ledger);
  expect(count("budgets")).toBe(before.budgets);
  expect(one(db, "SELECT * FROM bill_event_evidence")).toMatchObject({
    source_id: r.source_id,
    line_start: 1,
    line_end: 1,
    report_action_id: r.actions[0].id,
  });
  expect(
    one(db, "SELECT * FROM timeline WHERE id LIKE 'bill-event-%'"),
  ).toMatchObject({
    category: "political",
    operation: "approved",
    source_id: r.source_id,
  });
  expect(() => db.exec("DELETE FROM bill_events")).toThrow("append-only");
});
it("preserves unknown title and date rather than supplying defaults", () => {
  approve(submit("Parliament is considering Bill UNKNOWN-1", { date: null }));
  expect(
    one(db, "SELECT * FROM bills WHERE identifier='UNKNOWN-1'"),
  ).toMatchObject({
    stage: "considering",
    title: "",
    introduced_date: null,
    effective_date: null,
  });
  expect(one(db, "SELECT * FROM bill_events")).toMatchObject({
    date: null,
    effective_date: null,
  });
});
it("requires explicit enactment and an independently supplied effective date", () => {
  const r = submit("President Donahue signed Bill TEST-1 into law.");
  const edited = editReportAction(db, {
    report_id: r.id,
    action_id: r.actions[0].id,
    revision: r.revision,
    payload: { ...r.actions[0].payload, effective_date: "1992-10-10" },
    reason: "Explicit commencement supplied by review",
  });
  approve(edited);
  expect(
    one(db, "SELECT * FROM bills WHERE identifier='TEST-1'"),
  ).toMatchObject({
    stage: "enacted",
    effective_date: "1992-10-10",
    introduced_date: null,
  });
  approve(submit("Bill TEST-2 was enacted."));
  expect(
    one(db, "SELECT effective_date FROM bills WHERE identifier='TEST-2'")!
      .effective_date,
  ).toBeNull();
});
it("rejects an effective date attached to passage", () => {
  const r = submit();
  const edited = editReportAction(db, {
    report_id: r.id,
    action_id: r.actions[0].id,
    revision: r.revision,
    payload: { ...r.actions[0].payload, effective_date: "1992-10-10" },
    reason: "Review date fixture",
  });
  expect(edited.actions[0].ready).toBe(false);
  expect(() => approve(edited)).toThrow("enactment");
});
it("applies stages from one report atomically without regressing the register", () => {
  const r = submit(
    "1992-10-01 Parliament introduced Bill MULTI-1: Public works\n1992-10-04 Parliament passed Bill MULTI-1: Public works\n1992-10-05 President signed Bill MULTI-1 into law.",
  );
  approve(r);
  expect(
    one(db, "SELECT * FROM bills WHERE identifier='MULTI-1'"),
  ).toMatchObject({
    stage: "enacted",
    introduced_date: "1992-10-01",
    effective_date: null,
  });
  expect(count("bill_events")).toBe(3);
  approve(
    submit("Parliament is considering Bill MULTI-1", { date: "1992-09-30" }),
  );
  expect(
    one(db, "SELECT stage FROM bills WHERE identifier='MULTI-1'")!.stage,
  ).toBe("enacted");
});
it("deduplicates whole reports and corroborates the same dated event with additional evidence", () => {
  const r = submit();
  approve(r);
  expect(submit().duplicate).toBe(true);
  approve(submit("Bill test-1 was passed: Public works."));
  expect(count("bill_events")).toBe(1);
  expect(count("bill_event_evidence")).toBe(2);
  expect(
    all(db, "SELECT * FROM timeline WHERE id LIKE 'bill-event-%'"),
  ).toHaveLength(1);
});
it("blocks a stale bill snapshot until a reasoned correction rechecks current state", () => {
  const waiting = submit("Parliament passed Bill TEST-1: Public works");
  approve(
    submit("Parliament introduced Bill TEST-1: Public works", {
      date: "1992-10-01",
    }),
  );
  expect(reportDetail(db, waiting.id).actions[0].ready).toBe(false);
  expect(() => approve(waiting)).toThrow("register changed");
  const corrected = editReportAction(db, {
    report_id: waiting.id,
    action_id: waiting.actions[0].id,
    revision: waiting.revision,
    payload: waiting.actions[0].payload,
    reason: "Reviewed the newly introduced bill",
  });
  approve(corrected);
  expect(
    one(db, "SELECT stage FROM bills WHERE identifier='TEST-1'")!.stage,
  ).toBe("passed");
});
it("rolls back all domain effects when dates contradict a later stage in the same approval", () => {
  const r = submit(
    "Order 3rd Infantry Division to Dalmatia\n1992-10-04 President signed Bill BAD-1 into law.\n1992-10-05 Parliament introduced Bill BAD-1",
  );
  expect(() => approve(r)).toThrow("sequence");
  expect(count("movements")).toBe(0);
  expect(count("bill_events")).toBe(0);
  expect(
    one(db, "SELECT id FROM bills WHERE identifier='BAD-1'"),
  ).toBeUndefined();
  expect(
    reportDetail(db, r.id).actions.every((a: Row) => a.status === "pending"),
  ).toBe(true);
});
it("does not change financial records for a monetary bill title or adopt simulations", () => {
  const n = count("ledger");
  approve(
    submit("Parliament passed Bill MONEY-1: 2 billion defense allocation"),
  );
  expect(count("ledger")).toBe(n);
  const r = submit("Parliament passed Bill SCENARIO-1", { mode: "simulate" });
  expect(() => approve(r)).toThrow("simulation");
  expect(
    one(db, "SELECT id FROM bills WHERE identifier='SCENARIO-1'"),
  ).toBeUndefined();
});
it("requires explicit supported bill syntax and leaves ambiguous prose archived", () => {
  for (const text of [
    "Parliament passed something",
    "Parliament did not pass Bill TEST-1",
    "Parliament passed a 2 billion defense bill",
    "Parliament may pass Bill TEST-1",
  ])
    expect(extractLegislation(text)).toBeNull();
  expect(
    submit("Parliament passed a 2 billion defense bill").actions[0].kind,
  ).toBe("record_event");
});
it("preserves existing report action identity, evidence and review state through migration 4", () => {
  const old = new DatabaseSync(":memory:");
  old.exec(
    "PRAGMA foreign_keys=ON;CREATE TABLE migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)",
  );
  for (const file of [
    "001_foundation.sql",
    "002_administration.sql",
    "003_reports_and_review.sql",
  ]) {
    old.exec(readFileSync("migrations/" + file, "utf8"));
    old
      .prepare("INSERT INTO migrations VALUES(?,?)")
      .run(Number(file.split("_")[0]), "fixture");
  }
  old.exec(
    "INSERT INTO sources(id,path,filename,sha256,bytes,content,tier,kind) VALUES('source','fixture','fixture','hash',8,'original',1,'national_report');INSERT INTO national_reports(id,source_id,digest,title,mode,status) VALUES('report','source','hash','fixture','record','review');INSERT INTO report_actions(id,report_id,ordinal,kind,payload_json,line_start,line_end,status,target_id) VALUES('action','report',0,'record_event','{}',1,1,'applied','target')",
  );
  const before = all(old, "SELECT * FROM report_actions");
  migrate(old);
  expect(all(old, "SELECT * FROM report_actions")).toEqual(before);
  expect(all(old, "PRAGMA foreign_key_check")).toEqual([]);
  old.close();
});
it("checks legacy introduction dates and preserves existing titles and explicit effective dates", () => {
  db.prepare(
    "INSERT INTO bills(id,identifier,title,summary,stage,introduced_date) VALUES('legacy','LEGACY-1','Known title','Fixture','introduced','1992-10-05')",
  ).run();
  const early = submit("Parliament passed Bill LEGACY-1: Known title");
  expect(early.actions[0].ready).toBe(false);
  expect(() => approve(early)).toThrow("introduction date");
  const conflict = submit("Parliament passed Bill LEGACY-1: Other title", {
    date: "1992-10-06",
  });
  expect(() => approve(conflict)).toThrow("title conflicts");
  const valid = submit("Parliament passed Bill legacy-1", {
    date: "1992-10-06",
  });
  approve(valid);
  expect(one(db, "SELECT * FROM bills WHERE id='legacy'")).toMatchObject({
    title: "Known title",
    stage: "passed",
    introduced_date: "1992-10-05",
  });
  expect(
    all(db, "SELECT * FROM bills WHERE lower(identifier)='legacy-1'"),
  ).toHaveLength(1);
});
