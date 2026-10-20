import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { openDatabase, all, one, transaction } from "../src/lib/db.ts";
import type { DB } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import {
  adminAction,
  assignAsset,
  recordMovement,
  completeMovement,
  unitSnapshot,
  vote,
  ledgerEntry,
  recordUnitState,
} from "../src/lib/admin.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
});
afterEach(() => db.close());
const move = (extra: Record<string, any> = {}) => ({
  unit_id: "unit-3inf",
  location_id: one(db, "SELECT id FROM locations WHERE name='Dalmatia'")!.id,
  date: "1992-10-04",
  operation: "ordered",
  mission: "Reinforcement",
  ...extra,
});
const asset = (operation = "operational") =>
  adminAction(db, {
    action: "asset",
    name: "Test vessel",
    type: "frigate",
    operation,
    source_text: "Test fixture authority",
  }).id;
const bill = () =>
  adminAction(db, {
    action: "bill",
    identifier: "TEST-1",
    title: "Test bill",
    summary: "Test",
    date: "1992-10-03",
    source_text: "Fixture authority",
  }).id;
const budget = () =>
  adminAction(db, {
    action: "budget",
    name: "Test appropriation",
    fiscal_year: 1992,
    currency: "USD",
    appropriated: 100,
    source_text: "Fixture appropriation authority",
  }).id;
describe("Bounded administration integrity", () => {
  it("prevents simultaneous assignment of a uniquely tracked vessel or aircraft", () => {
    const id = asset();
    assignAsset(db, {
      asset_id: id,
      unit_id: "unit-3inf",
      start_date: "1992-10-03",
    });
    expect(() =>
      assignAsset(db, {
        asset_id: id,
        unit_id: "unit-3mar",
        start_date: "1992-10-04",
      }),
    ).toThrow("already assigned");
    expect(all(db, "SELECT * FROM asset_assignments")).toHaveLength(1);
  });
  it("does not assign a purchased but undelivered asset", () => {
    expect(() =>
      assignAsset(db, {
        asset_id: asset("ordered"),
        unit_id: "unit-3inf",
        start_date: "1992-10-03",
      }),
    ).toThrow("undelivered");
    expect(
      all(db, "SELECT * FROM procurement").reduce(
        (s, p) => s + p.operational,
        0,
      ),
    ).toBe(0);
  });
  it("keeps ordered redeployment out of completed deployment history until confirmed", () => {
    const r = recordMovement(db, move());
    expect(
      all(db, "SELECT * FROM movements WHERE operation='completed'"),
    ).toHaveLength(0);
    expect(() =>
      completeMovement(db, {
        id: r.id,
        date: "1992-10-01",
        explanation: "arrival",
      }),
    ).toThrow("precede");
    completeMovement(db, {
      id: r.id,
      date: "1992-10-06",
      explanation: "Player confirms arrival",
    });
    expect(
      one(db, "SELECT * FROM movements WHERE id=?", r.id)!.completed_date,
    ).toBe("1992-10-06");
  });
  it("retains historical OOB assignment and strength after transfers", () => {
    recordUnitState(db, {
      unit_id: "unit-3inf",
      date: "1992-10-10",
      parent_id: "unit-aux",
      personnel_low: 19000,
      personnel_high: 19000,
      operation: "operational",
      source_text: "Confirmed transfer",
    });
    expect(
      unitSnapshot(db, "1992-10-03").find((u) => u.id === "unit-3inf")!
        .parent_id,
    ).toBeNull();
    expect(
      unitSnapshot(db, "1992-10-10").find((u) => u.id === "unit-3inf")!
        .parent_id,
    ).toBe("unit-aux");
    expect(
      unitSnapshot(db, "1992-10-03").find((u) => u.id === "unit-3inf")!
        .personnel_low,
    ).toBe(20000);
  });
  it("rejects cyclic chains of command", () => {
    expect(() =>
      recordUnitState(db, {
        unit_id: "unit-3inf",
        parent_id: "unit-3inf",
        date: "1992-10-04",
        operation: "operational",
        source_text: "fixture",
      }),
    ).toThrow("cycle");
  });
  it("does not silently exceed applicable voting seats or manufacture thresholds", () => {
    const id = bill();
    const base = {
      bill_id: id,
      chamber_id: "assembly-1992",
      date: "1992-10-03",
      yes: 201,
      no: 199,
      abstain: 0,
      absent: 0,
      vacancies: 0,
      voting_seats: 400,
      rule_source: "Explicit custom rule, result threshold not yet established",
      explanation: "Player explicitly authorizes a session for this test",
    };
    expect(() => vote(db, { ...base, yes: 401 })).toThrow("must equal");
    expect(() => vote(db, { ...base, voting_seats: "" })).toThrow("unknown");
    const r = vote(db, base);
    expect(one(db, "SELECT * FROM votes WHERE id=?", r.id)!.result).toBe(
      "Undetermined",
    );
  });
  it("records appropriations, commitments and actuals separately and guards overruns", () => {
    const id = budget();
    ledgerEntry(db, {
      budget_id: id,
      date: "1992-10-03",
      stage: "committed",
      amount: 80,
      memo: "Contract A",
    });
    ledgerEntry(db, {
      budget_id: id,
      date: "1992-10-03",
      stage: "actual",
      amount: 40,
      memo: "Invoice A",
    });
    expect(all(db, "SELECT stage,amount FROM ledger")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "committed", amount: 80 }),
        expect.objectContaining({ stage: "actual", amount: 40 }),
      ]),
    );
    expect(() =>
      ledgerEntry(db, {
        budget_id: id,
        date: "1992-10-04",
        stage: "actual",
        amount: 61,
        memo: "Invoice B",
      }),
    ).toThrow("Authorization warning");
    ledgerEntry(db, {
      budget_id: id,
      date: "1992-10-04",
      stage: "actual",
      amount: 61,
      memo: "Invoice B",
      override_reason: "Explicit emergency overrun approval",
    });
  });
  it("preserves financial observations after later imports", () => {
    const before = all(
      db,
      "SELECT * FROM assertions WHERE category='economic'",
    );
    importRecovery(db);
    expect(
      all(db, "SELECT * FROM assertions WHERE category='economic'"),
    ).toEqual(before);
  });
  it("keeps KIA/WIA/MIA/POW separate without mixing casualty report phases", () => {
    const rows = all(db, "SELECT * FROM casualties WHERE battle_id=?", "B023");
    expect(rows.map((r) => r.category).sort()).toEqual([
      "KIA",
      "MIA",
      "POW",
      "WIA",
    ]);
    expect(rows.every((r) => r.canon === "provisional")).toBe(true);
    adminAction(db, {
      action: "casualty",
      battle_id: "B023",
      report_group: "another phase",
      category: "unspecified",
      count: 100,
      canon: "disputed",
      source_text: "Unverified other phase",
    });
    expect(
      all(
        db,
        "SELECT DISTINCT report_group FROM casualties WHERE battle_id=?",
        "B023",
      ),
    ).toHaveLength(2);
  });
  it("warns about treaty-restricted deployments and requires explicit override", () => {
    const loc = one(
      db,
      "SELECT id FROM locations WHERE name='Šibenik area'",
    )!.id;
    expect(() => recordMovement(db, move({ location_id: loc }))).toThrow(
      "Treaty warning",
    );
    const r = recordMovement(
      db,
      move({
        location_id: loc,
        override_reason: "User explicitly approves breach for roleplay",
      }),
    );
    expect(r.warnings).toHaveLength(1);
    expect(
      one(db, "SELECT * FROM movements WHERE id=?", r.id)!.warning,
    ).toContain("Demilitarized");
  });
  it("keeps unapproved event drafts separate and commits only after review", () => {
    const result = adminAction(db, {
      action: "parse_event",
      date: "1992-10-04",
      text: "Order 3rd Infantry Division to Dalmatia",
    });
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
    expect(result.actions).toHaveLength(1);
    adminAction(db, {
      action: "approve_event",
      id: result.id,
      explanation: "User approves displayed order",
    });
    expect(all(db, "SELECT * FROM movements")).toHaveLength(1);
    expect(all(db, "SELECT * FROM movements")[0].operation).toBe("ordered");
    expect(() =>
      adminAction(db, { action: "approve_event", id: result.id }),
    ).toThrow("already applied");
  });
  it("rolls back all effects if one action in an approved transaction fails", () => {
    const result = adminAction(db, {
      action: "parse_event",
      date: "1992-10-04",
      text: "Order 3rd Infantry Division to Dalmatia",
    });
    const acts = [
      result.actions[0],
      { ...result.actions[0], unit_id: "missing-unit" },
    ];
    db.prepare("UPDATE event_drafts SET actions_json=? WHERE id=?").run(
      JSON.stringify(acts),
      result.id,
    );
    expect(() =>
      adminAction(db, {
        action: "approve_event",
        id: result.id,
        explanation: "approval",
      }),
    ).toThrow("not found");
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
    expect(
      one(db, "SELECT * FROM event_drafts WHERE id=?", result.id)!.operation,
    ).toBe("draft");
  });
  it("advances time without automatic deliveries or completed moves", () => {
    recordMovement(db, move());
    const draft = adminAction(db, {
      action: "advance_preview",
      date: "1992-11-03",
    });
    expect(
      one(db, "SELECT value FROM settings WHERE key='in_world_date'")!.value,
    ).toBe("1992-10-03");
    adminAction(db, {
      action: "approve_event",
      id: draft.id,
      explanation: "Advance clock only",
    });
    expect(
      one(db, "SELECT value FROM settings WHERE key='in_world_date'")!.value,
    ).toBe("1992-11-03");
    expect(
      all(db, "SELECT * FROM movements WHERE operation='completed'"),
    ).toHaveLength(0);
    expect(
      all(db, "SELECT * FROM procurement").every((p) => p.delivered === 0),
    ).toBe(true);
  });
  it("performs dated cabinet reshuffle without impossible overlap", () => {
    const office = adminAction(db, {
      action: "office",
      name: "Test office",
      authority: "Explicit test authority",
    }).id;
    adminAction(db, {
      action: "appointment",
      office_id: office,
      person_id: "P005",
      date: "1992-01-01",
      arrangement: "exclusive",
      explanation: "Confirmed appointment",
    });
    expect(() =>
      adminAction(db, {
        action: "appointment",
        office_id: office,
        person_id: "P006",
        date: "1992-02-01",
        arrangement: "exclusive",
        explanation: "Another appointment",
      }),
    ).toThrow("Overlapping");
    adminAction(db, {
      action: "appointment",
      office_id: office,
      person_id: "P006",
      date: "1992-02-01",
      arrangement: "exclusive",
      reshuffle: "yes",
      explanation: "Approved reshuffle",
    });
    expect(
      all(
        db,
        "SELECT * FROM appointments WHERE office_id=? ORDER BY start_date",
        office,
      )[0].end_date,
    ).toBe("1992-01-31");
  });
});
