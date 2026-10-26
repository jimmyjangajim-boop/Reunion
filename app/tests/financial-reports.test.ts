import { beforeEach, afterEach, it, expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase, all, one, migrate } from "../src/lib/db.ts";
import type { DB, Row } from "../src/lib/db.ts";
import { adminAction } from "../src/lib/admin.ts";
import {
  submitReport,
  approveReport,
  editReportAction,
  reportDetail,
} from "../src/lib/reports.ts";
import {
  extractFinancial,
  appropriationAt,
} from "../src/lib/financial-reports.ts";
let db: DB;
let budget: string;
beforeEach(() => {
  db = openDatabase(":memory:");
  adminAction(db, {
    action: "unit",
    name: "3rd Infantry Division",
    branch: "Army",
    unit_type: "Division",
    source_text: "Unit fixture",
  });
  adminAction(db, {
    action: "location",
    name: "Dalmatia",
    kind: "Region",
    source_text: "Location fixture",
  });
  budget = adminAction(db, {
    action: "budget",
    name: "Test defense",
    fiscal_year: 1992,
    currency: "USD",
    appropriated: 100,
    source_text: "Fixture appropriation authority",
  }).id;
});
afterEach(() => db.close());
const text = (stage = "disbursed", amount = 40, ref = "PAY-1") =>
  `Treasury ${stage} USD ${amount} for Budget Test defense; reference ${ref}: Ammunition`;
const submit = (body = text(), extra: Row = {}) =>
  submitReport(db, {
    title: "Financial fixture",
    body,
    date: "1992-10-04",
    ...extra,
  });
const approve = (r: Row, extra: Row = {}) =>
  approveReport(db, {
    report_id: r.id,
    revision: r.revision,
    action_ids: r.actions.map((a: Row) => a.id),
    reason: "Accept the explicit financial record",
    ...extra,
  });
const edit = (r: Row, payload: Row, index = 0) =>
  editReportAction(db, {
    report_id: r.id,
    revision: r.revision,
    action_id: r.actions[index].id,
    payload: { ...r.actions[index].payload, ...payload },
    reason: "Review the explicit funding record",
  });
const count = (table: string) => one(db, `SELECT count(*) n FROM ${table}`)!.n;
it("shares references between manual and report writes without duplicating spending", () => {
  const entry = {
    action: "ledger",
    budget_id: budget,
    date: "1992-10-04",
    stage: "disbursed",
    amount: 40,
    reference: "PAY-1",
    memo: "Ammunition",
    source_text: "Test manual authority",
  };
  const manual = adminAction(db, entry);
  const report = submit();
  approve(report);
  expect(count("ledger")).toBe(1);
  expect(one(db, "SELECT * FROM ledger_report_evidence")!.ledger_id).toBe(
    manual.id,
  );
  expect(adminAction(db, entry).corroboration).toBe(true);
  expect(count("ledger")).toBe(1);
  expect(() => adminAction(db, { ...entry, amount: 41 })).toThrow(
    "different amount",
  );
  expect(count("ledger")).toBe(1);
});
it("manual entries respect dated increases and future cumulative spending", () => {
  adminAction(db, {
    action: "ledger",
    budget_id: budget,
    date: "1992-10-10",
    stage: "appropriated",
    amount: 100,
    reference: "INC-1",
    appropriation_basis: "increase",
    memo: "Additional authority",
  });
  adminAction(db, {
    action: "ledger",
    budget_id: budget,
    date: "1992-10-06",
    stage: "actual",
    amount: 80,
    reference: "EXP-1",
    memo: "First expense",
  });
  expect(() =>
    adminAction(db, {
      action: "ledger",
      budget_id: budget,
      date: "1992-10-05",
      stage: "actual",
      amount: 30,
      reference: "EXP-2",
      memo: "Backdated expense",
    }),
  ).toThrow("Authorization warning");
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(200);
  expect(count("ledger")).toBe(2);
});
it("manual appropriation requires explicit increase authority and unsupported stages reject atomically", () => {
  const before = ["budgets", "ledger", "sources", "audit"].map((t) =>
    all(db, `SELECT * FROM ${t}`),
  );
  const entry = {
    action: "ledger",
    budget_id: budget,
    date: "1992-10-04",
    stage: "appropriated",
    amount: 50,
    reference: "INC-1",
    memo: "Proposed authority",
  };
  expect(() => adminAction(db, entry)).toThrow("additional appropriation");
  for (const stage of ["returned", "canceled", "transfer"])
    expect(() => adminAction(db, { ...entry, stage })).toThrow();
  expect(
    ["budgets", "ledger", "sources", "audit"].map((t) =>
      all(db, `SELECT * FROM ${t}`),
    ),
  ).toEqual(before);
  adminAction(db, { ...entry, appropriation_basis: "increase" });
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(150);
  expect(count("budget_adjustments")).toBe(1);
});
it("stages a preserved original without spending, then writes a sourced disbursement only", () => {
  const r = submit();
  expect(r.actions[0]).toMatchObject({ kind: "financial", ready: true });
  expect(count("ledger")).toBe(0);
  approve(r);
  expect(one(db, "SELECT * FROM ledger")).toMatchObject({
    budget_id: budget,
    date: "1992-10-04",
    stage: "disbursed",
    amount: 40,
    source_id: r.source_id,
  });
  expect(one(db, "SELECT * FROM ledger_report_evidence")).toMatchObject({
    source_id: r.source_id,
    line_start: 1,
    line_end: 1,
    report_action_id: r.actions[0].id,
  });
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(100);
  expect(
    one(db, "SELECT * FROM timeline WHERE id LIKE 'ledger-event-%'"),
  ).toMatchObject({ category: "economic", operation: "completed" });
});
it("keeps proposed, authorized, committed, disbursed and actual amounts separate", () => {
  const r = submit(
    [
      "proposed",
      "authorized",
      "committed",
      "disbursed",
      "recorded actual expense of",
    ]
      .map((s) => text(s))
      .join("\n"),
  );
  approve(r);
  expect(
    all(db, "SELECT stage,amount FROM ledger ORDER BY rowid").map((l) => [
      l.stage,
      l.amount,
    ]),
  ).toEqual([
    ["proposed", 40],
    ["authorized", 40],
    ["committed", 40],
    ["disbursed", 40],
    ["actual", 40],
  ]);
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(100);
  expect(count("budget_adjustments")).toBe(0);
});
it("raises a limit only for an explicit additional appropriation, with no fabricated payment", () => {
  const r = submit(text("added an appropriation of", 50, "APP-1"));
  approve(r);
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(150);
  expect(one(db, "SELECT stage,amount FROM ledger")).toMatchObject({
    stage: "appropriated",
    amount: 50,
  });
  expect(one(db, "SELECT * FROM budget_adjustments")).toMatchObject({
    previous_amount: 100,
    new_amount: 150,
  });
  expect(
    appropriationAt(
      db,
      one(db, "SELECT * FROM budgets WHERE id=?", budget)!,
      "1992-10-03",
    ),
  ).toBe(100);
  expect(
    appropriationAt(
      db,
      one(db, "SELECT * FROM budgets WHERE id=?", budget)!,
      "1992-10-04",
    ),
  ).toBe(150);
});
it("keeps ambiguous appropriation totals pending until the reviewer confirms an increase", () => {
  const r = submit(text("appropriated", 50, "APP-2"));
  expect(r.actions[0].ready).toBe(false);
  expect(() => approve(r)).toThrow("additional appropriation");
  approve(edit(r, { appropriation_basis: "increase" }));
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(150);
});
it("approves an additional appropriation and dependent payment atomically in report order", () => {
  const r = submit(
    text("added an appropriation of", 100, "APP-3") +
      "\n" +
      text("disbursed", 150),
  );
  expect(r.actions.every((a: Row) => a.ready)).toBe(true);
  expect(r.actions[1].warnings.join(" ")).toContain("relies on earlier");
  expect(() => approve(r, { action_ids: [r.actions[1].id] })).toThrow(
    "authorization warning",
  );
  expect(count("ledger")).toBe(0);
  approve(r, { action_ids: [r.actions[1].id, r.actions[0].id] });
  expect(count("ledger")).toBe(2);
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(200);
});
it("does not use later-dated additional appropriations to fund an earlier payment", () => {
  const r = submit(
    "1992-10-06 " +
      text("added an appropriation of", 100, "APP-4") +
      "\n1992-10-04 " +
      text("disbursed", 150),
  );
  expect(r.actions[1].ready).toBe(false);
  expect(() => approve(r)).toThrow("authorization warning");
  expect(count("ledger")).toBe(0);
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(100);
});
it("deduplicates exact reports and corroborates a case-insensitive reference without another payment", () => {
  const r = submit();
  approve(r);
  expect(submit().duplicate).toBe(true);
  approve(
    submit(
      text()
        .replace("PAY-1", "pay-1")
        .replace("Ammunition", "Another source description"),
    ),
  );
  expect(count("ledger")).toBe(1);
  expect(count("ledger_report_evidence")).toBe(2);
  expect(
    all(db, "SELECT * FROM timeline WHERE id LIKE 'ledger-event-%'"),
  ).toHaveLength(1);
});
it("does not double an appropriation when its transaction is reported again", () => {
  approve(submit(text("added an appropriation of", 50, "APP-5")));
  approve(
    submit(
      text("added an appropriation of", 50, "app-5").replace(
        "Ammunition",
        "Corroborating authority",
      ),
    ),
  );
  expect(count("budget_adjustments")).toBe(1);
  expect(count("ledger_report_evidence")).toBe(2);
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(150);
});
it("preserves conflicting amounts or dates under the same reference for review", () => {
  approve(submit());
  const changed = submit(text("disbursed", 41));
  expect(changed.actions[0].ready).toBe(false);
  expect(() => approve(changed)).toThrow("reference already identifies");
  const otherDate = submit(text(), { date: "1992-10-05" });
  expect(() => approve(otherDate)).toThrow("reference already identifies");
  expect(count("ledger")).toBe(1);
  expect(one(db, "SELECT amount FROM ledger")!.amount).toBe(40);
});
it("keeps separately referenced equal payments separate and warns about similarity", () => {
  approve(submit());
  const second = submit(text("disbursed", 40, "PAY-2"));
  expect(second.actions[0].warnings.join(" ")).toContain(
    "separate transaction",
  );
  approve(second);
  expect(count("ledger")).toBe(2);
});
it("requires an exact financial date, currency, known budget and transaction reference", () => {
  const unknownDate = submit(text(), { date: null });
  expect(() => approve(unknownDate)).toThrow("exact financial record date");
  const noRef = submit("Treasury disbursed USD 40 for Budget Test defense");
  expect(noRef.actions[0].kind).toBe("financial");
  expect(() => approve(noRef)).toThrow("transaction reference");
  const wrongCurrency = submit(text().replace("USD", "RMC"));
  expect(() => approve(wrongCurrency)).toThrow("currency differs");
  const unknownBudget = submit(
    text().replace("Test defense", "Unestablished budget"),
  );
  expect(() => approve(unknownBudget)).toThrow("No existing budget");
  expect(count("budgets")).toBe(1);
});
it("requires an explicit selection when several budgets share a name", () => {
  adminAction(db, {
    action: "budget",
    name: "Test defense",
    fiscal_year: 1993,
    currency: "USD",
    appropriated: 100,
    source_text: "Separate fiscal fixture",
  });
  const r = submit();
  expect(() => approve(r)).toThrow("Several budgets");
  approve(edit(r, { budget_id: budget }));
  expect(count("ledger")).toBe(1);
});
it("blocks stale budget state until a reasoned correction rechecks the ledger", () => {
  const waiting = submit();
  approve(submit(text("committed", 20, "COM-1")));
  expect(reportDetail(db, waiting.id).actions[0].ready).toBe(false);
  expect(() => approve(waiting)).toThrow("ledger changed");
  approve(edit(waiting, {}));
  expect(count("ledger")).toBe(2);
});
it("checks cumulative spending and preserves a reasoned authorization override", () => {
  const r = submit(text("disbursed", 101));
  expect(() => approve(r)).toThrow("authorization warning");
  approve(
    edit(r, {
      override_reason:
        "Explicit emergency spending above the recorded appropriation",
    }),
  );
  expect(
    one(db, "SELECT override_reason FROM ledger")!.override_reason,
  ).toContain("emergency");
});
it("rolls back every selected department effect when later combined payments exceed the limit", () => {
  const r = submit(
    "Order 3rd Infantry Division to Dalmatia\n" +
      text("added an appropriation of", 100, "APP-6") +
      "\n" +
      text("disbursed", 110, "PAY-1") +
      "\n" +
      text("disbursed", 110, "PAY-2"),
  );
  expect(() => approve(r)).toThrow("authorization warning");
  expect(count("ledger")).toBe(0);
  expect(count("movements")).toBe(0);
  expect(count("budget_adjustments")).toBe(0);
  expect(
    one(db, "SELECT appropriated FROM budgets WHERE id=?", budget)!
      .appropriated,
  ).toBe(100);
  expect(
    reportDetail(db, r.id).actions.every((a: Row) => a.status === "pending"),
  ).toBe(true);
});
it("does not adopt scenarios, invent currency conversions or treat conditional prose as financial effects", () => {
  const r = submit(text(), { mode: "simulate" });
  expect(() => approve(r)).toThrow("simulation");
  for (const body of [
    "Treasury might disburse USD 40 for Budget Test defense",
    "Treasury did not disburse USD 40 for Budget Test defense",
    "Treasury transferred USD 40 from Budget Test defense",
    "Treasury disbursed $40 for Budget Test defense",
    "Treasury disbursed USD 40.50 for Budget Test defense",
  ])
    expect(extractFinancial(body)).toBeNull();
  expect(count("ledger")).toBe(0);
});
it("rejects unsafe amounts and preserves reported entries and source evidence", () => {
  const r = submit();
  expect(() =>
    edit(r, { financial_amount: Number.MAX_SAFE_INTEGER + 1 }),
  ).toThrow();
  approve(r);
  expect(() => db.exec("UPDATE ledger SET amount=41")).toThrow("immutable");
  expect(() => db.exec("DELETE FROM ledger_report_evidence")).toThrow(
    "append-only",
  );
  expect(() => db.exec("DELETE FROM ledger_report_records")).toThrow(
    "append-only",
  );
});
it("preserves approved legislative evidence and pending actions through migration 5", () => {
  const old = new DatabaseSync(":memory:");
  old.exec(
    "PRAGMA foreign_keys=ON;CREATE TABLE migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)",
  );
  for (const file of [
    "001_foundation.sql",
    "002_administration.sql",
    "003_reports_and_review.sql",
    "004_legislative_reports.sql",
  ]) {
    old.exec(readFileSync("migrations/" + file, "utf8"));
    old
      .prepare("INSERT INTO migrations VALUES(?,?)")
      .run(Number(file.split("_")[0]), "fixture");
  }
  const r = submitReport(old, {
    title: "Old bill fixture",
    body: "Parliament passed Bill OLD-1\nUnknown archive statement",
    date: "1992-10-04",
  });
  approveReport(old, {
    report_id: r.id,
    revision: r.revision,
    action_ids: [r.actions[0].id],
    reason: "Old legislation fixture",
  });
  const beforeActions = all(old, "SELECT * FROM report_actions"),
    beforeEvidence = all(old, "SELECT * FROM bill_event_evidence");
  migrate(old);
  expect(all(old, "SELECT * FROM report_actions")).toEqual(beforeActions);
  expect(all(old, "SELECT * FROM bill_event_evidence")).toEqual(beforeEvidence);
  expect(all(old, "PRAGMA foreign_key_check")).toEqual([]);
  expect(() => old.exec("DELETE FROM bill_event_evidence")).toThrow(
    "append-only",
  );
  old.close();
});
it("checks historical totals after a newly backdated payment, before a later appropriation", () => {
  approve(submit(text("disbursed", 100, "EXISTING"), { date: "1992-10-05" }));
  approve(
    submit(text("added an appropriation of", 100, "LATER-APP"), {
      date: "1992-10-10",
    }),
  );
  const r = submit(text("disbursed", 50, "BACKDATED"), { date: "1992-10-04" });
  expect(r.actions[0].ready).toBe(false);
  expect(() => approve(r)).toThrow("authorization warning");
  expect(count("ledger")).toBe(2);
});
it("keeps the full financial and provenance state after closing and reopening a file database", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "rnas-financial-"));
  const filename = path.join(directory, "fixture.sqlite");
  let durable = openDatabase(filename);
  try {
    const b = adminAction(durable, {
      action: "budget",
      name: "Test defense",
      fiscal_year: 1992,
      currency: "USD",
      appropriated: 100,
      source_text: "Persistence fixture appropriation",
    }).id;
    const r = submitReport(durable, {
      title: "Persistent financial fixture",
      date: "1992-10-04",
      body:
        text("added an appropriation of", 100, "PERSIST-APP") +
        "\n" +
        text("disbursed", 150, "PERSIST-PAY"),
    });
    approveReport(durable, {
      report_id: r.id,
      revision: r.revision,
      action_ids: r.actions.map((a: Row) => a.id),
      reason: "Approve persistent financial fixture",
    });
    durable.close();
    durable = openDatabase(filename);
    expect(reportDetail(durable, r.id).status).toBe("applied");
    expect(
      one(durable, "SELECT appropriated FROM budgets WHERE id=?", b)!
        .appropriated,
    ).toBe(200);
    expect(all(durable, "SELECT * FROM ledger_report_evidence")).toHaveLength(
      2,
    );
    expect(all(durable, "PRAGMA foreign_key_check")).toEqual([]);
  } finally {
    durable.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
it("parses explicit grouped whole units and never invents an exchange conversion", () => {
  const r = submit(
    "Treasury proposed USD 1,234 for Budget Test defense; reference GROUP-1",
  );
  approve(r);
  expect(one(db, "SELECT amount FROM ledger")!.amount).toBe(1234);
  const unsafe = submit(
    text("added an appropriation of", Number.MAX_SAFE_INTEGER, "OVERFLOW"),
  );
  expect(() => approve(unsafe)).toThrow("exact whole-unit range");
});
