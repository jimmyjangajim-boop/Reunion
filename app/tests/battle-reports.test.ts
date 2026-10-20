import { beforeEach, afterEach, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase, all, one, migrate } from "../src/lib/db.ts";
import type { DB, Row } from "../src/lib/db.ts";
import {
  submitReport,
  approveReport,
  editReportAction,
  reportDetail,
} from "../src/lib/reports.ts";
import {
  battleProposalSchema,
  suggestBattle,
} from "../src/lib/battle-reports.ts";
import { correctReviewedAltisYears } from "../src/lib/chronology.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { adminAction } from "../src/lib/admin.ts";
import BattleWorkspace, {
  BattleSummary,
} from "../src/components/BattleWorkspace";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  db.exec(
    "INSERT INTO units(id,name,branch,unit_type) VALUES('unit-test','4th Infantry Brigade','Army','Brigade'); INSERT INTO assets(id,name,type,operation) VALUES('asset-test','Fixture vehicle','Vehicle','operational'); INSERT INTO asset_assignments VALUES('assignment-test','asset-test','unit-test','1992-10-01',NULL)",
  );
});
afterEach(() => db.close());
const proposal = (extra: Row = {}) =>
  battleProposalSchema.parse({
    name: "Fixture engagement",
    reference: "phase-1",
    date_info: { precision: "day", label: "1992-10-08" },
    location: "Fixture ridge",
    belligerents: "Reported sides",
    outcome: "Position held",
    participants: [{ unit_id: "unit-test", casualties: { KIA: 32, WIA: 114 } }],
    ...extra,
  });
const submit = (battle = proposal(), extra: Row = {}) =>
  submitReport(db, {
    title: "After-action fixture",
    body: "  Original engagement account.\r\nSecond line.\r\n",
    date: "1992-10-08",
    battle,
    ...extra,
  });
const approve = (r: Row, database = db) =>
  approveReport(database, {
    report_id: r.id,
    revision: r.revision,
    action_ids: r.actions.map((a: Row) => a.id),
    reason: "Accept documented fixture engagement",
  });
const edit = (r: Row, battle: Row) =>
  editReportAction(db, {
    report_id: r.id,
    action_id: r.actions[0].id,
    revision: r.revision,
    payload: { ...r.actions[0].payload, battle },
    reason: "Review the documented correction",
  });
const count = (table: string) => one(db, `SELECT count(*) n FROM ${table}`)!.n;
const loss = (extra: Row = {}) => ({
  equipment: "Fixture vehicle",
  count: 1,
  state: "lost",
  asset_id: "asset-test",
  participant_index: 0,
  ...extra,
});
it("preserves original bytes and stages exactly one review without domain effects", () => {
  const r = submit();
  expect(r.actions).toHaveLength(1);
  expect(r.actions[0]).toMatchObject({
    kind: "battle",
    ready: true,
    line_start: 1,
    line_end: 3,
  });
  expect(
    one(db, "SELECT content FROM sources WHERE id=?", r.source_id)!.content,
  ).toBe(r.body);
  for (const table of [
    "battles",
    "casualties",
    "battle_report_records",
    "battle_report_losses",
    "timeline",
  ])
    expect(count(table)).toBe(0);
  expect(count("units")).toBe(1);
  expect(() =>
    db
      .prepare("UPDATE sources SET content='changed' WHERE id=?")
      .run(r.source_id),
  ).toThrow("immutable");
});
it("approves a source-linked battle, participants, separate categories and timeline atomically", () => {
  const r = submit();
  const a = approve(r);
  expect(a.status).toBe("applied");
  expect(one(db, "SELECT * FROM battles")).toMatchObject({
    name: "Fixture engagement",
    canon: "confirmed",
    source_id: r.source_id,
  });
  expect(
    all(
      db,
      "SELECT category,count,source_id FROM casualties ORDER BY category",
    ),
  ).toEqual([
    { category: "KIA", count: 32, source_id: r.source_id },
    { category: "WIA", count: 114, source_id: r.source_id },
  ]);
  expect(one(db, "SELECT * FROM battle_report_evidence")).toMatchObject({
    source_id: r.source_id,
    line_start: 1,
    line_end: 3,
    report_action_id: r.actions[0].id,
  });
  expect(one(db, "SELECT * FROM timeline")).toMatchObject({
    category: "military",
    operation: "completed",
    source_id: r.source_id,
  });
  expect(count("unit_states")).toBe(0);
  expect(count("ledger")).toBe(0);
  expect(() => approve(r)).toThrow("changed");
  expect(count("battles")).toBe(1);
});
it("keeps follow-up combat phases separate and preserves the original battle record", () => {
  approve(submit());
  const before = one(db, "SELECT * FROM battles")!;
  const r = submit(
    proposal({
      battle_id: before.id,
      name: null,
      reference: "phase-2",
      date_info: { precision: "month", label: "1992-10" },
      outcome: "Separate phase",
    }),
  );
  approve(r);
  expect(one(db, "SELECT * FROM battles")).toEqual(before);
  expect(count("battle_report_records")).toBe(2);
  expect(count("casualties")).toBe(4);
  expect(
    new Set(
      all(db, "SELECT report_group FROM casualties").map((r) => r.report_group),
    ).size,
  ).toBe(2);
  expect(
    JSON.parse(
      all(db, "SELECT date_json FROM timeline ORDER BY rowid")[1].date_json,
    ).precision,
  ).toBe("month");
});
it("leaves unreported casualties unknown while retaining an explicit zero", () => {
  approve(
    submit(
      proposal({
        date_info: { precision: "unknown", label: "Unknown" },
        participants: [{ unit_id: "unit-test", casualties: { KIA: 0 } }],
      }),
    ),
  );
  expect(all(db, "SELECT category,count FROM casualties")).toEqual([
    { category: "KIA", count: 0 },
  ]);
  expect(
    JSON.parse(one(db, "SELECT date_json FROM battles")!.date_json).precision,
  ).toBe("unknown");
});
it("creates an explicitly supplied formation inside the same approval", () => {
  const r = submit(
    proposal({
      participants: [
        {
          name: "Supplied Formation",
          create_unit: true,
          branch: "Army",
          unit_type: "Brigade",
          casualties: { MIA: 2 },
        },
      ],
    }),
  );
  expect(count("units")).toBe(1);
  approve(r);
  const u = one(db, "SELECT * FROM units WHERE name='Supplied Formation'")!;
  expect(u).toMatchObject({
    branch: "Army",
    unit_type: "Brigade",
    formed_date: null,
    source_id: r.source_id,
  });
  expect(one(db, "SELECT unit_id FROM casualties")!.unit_id).toBe(u.id);
  expect(count("unit_states")).toBe(0);
});
it("blocks missing formation metadata and preserves unresolved names without inventing OOB entries", () => {
  const bad = submit(
    proposal({ participants: [{ name: "New Formation", create_unit: true }] }),
  );
  expect(bad.actions[0].ready).toBe(false);
  expect(() => approve(bad)).toThrow("branch and type");
  const r = submit(
    proposal({
      participants: [
        { name: "Reported unfamiliar formation", casualties: { WIA: 3 } },
      ],
    }),
  );
  approve(r);
  expect(count("units")).toBe(1);
  expect(one(db, "SELECT * FROM battle_report_participants")).toMatchObject({
    name: "Reported unfamiliar formation",
    unit_id: null,
  });
  expect(one(db, "SELECT * FROM casualties")).toMatchObject({
    unit_id: null,
    category: "WIA",
    count: 3,
  });
});
it("keeps unidentified equipment quantities unknown and avoids inventory effects", () => {
  approve(
    submit(
      proposal({
        losses: [{ equipment: "Unidentified vehicles", state: "damaged" }],
      }),
    ),
  );
  expect(one(db, "SELECT * FROM battle_report_losses")).toMatchObject({
    count: null,
    asset_id: null,
  });
  expect(one(db, "SELECT operation FROM assets")!.operation).toBe(
    "operational",
  );
  expect(count("battle_asset_effects")).toBe(0);
});
it.each(["lost", "damaged"])(
  "records an explicitly selected asset as %s with its prior state and assignment history",
  (state) => {
    const r = submit(proposal({ losses: [loss({ state })] }));
    approve(r);
    expect(one(db, "SELECT operation FROM assets")!.operation).toBe(state);
    const effect = one(db, "SELECT * FROM battle_asset_effects")!;
    expect(effect).toMatchObject({
      date: "1992-10-08",
      before_state: "operational",
      after_state: state,
    });
    expect(JSON.parse(effect.assignments_before)[0].end_date).toBeNull();
    expect(one(db, "SELECT end_date FROM asset_assignments")!.end_date).toBe(
      state === "lost" ? "1992-10-08" : null,
    );
    expect(
      one(db, "SELECT * FROM audit WHERE action='battle_asset_loss'")!
        .explanation,
    ).toContain("fixture");
  },
);
it.each([
  [{ count: null }, "one item"],
  [{ count: 2 }, "one item"],
  [{ state: "unknown" }, "lost or damaged"],
  [{ asset_id: "missing" }, "no longer exists"],
])("blocks invalid tracked asset proposals %j", (patch, message) => {
  const r = submit(proposal({ losses: [loss(patch)] }));
  expect(r.actions[0].ready).toBe(false);
  expect(() => approve(r)).toThrow(String(message));
  expect(count("battles")).toBe(0);
});
it("requires a day and prevents backdated assignment conflicts and wrong-unit losses", () => {
  let r = submit(
    proposal({
      date_info: { precision: "year", label: "1992" },
      losses: [loss()],
    }),
  );
  expect(() => approve(r)).toThrow("exact engagement date");
  db.exec(
    "INSERT INTO units(id,name,branch,unit_type) VALUES('other','Other Formation','Army','Division');UPDATE asset_assignments SET unit_id='other'",
  );
  r = submit(proposal({ losses: [loss()] }));
  expect(() => approve(r)).toThrow("different formation");
  r = submit(
    proposal({
      participants: [
        {
          name: "New supplied unit",
          create_unit: true,
          branch: "Army",
          unit_type: "Division",
        },
      ],
      losses: [loss()],
    }),
  );
  expect(() => approve(r)).toThrow("different formation");
  db.exec(
    "UPDATE asset_assignments SET unit_id='unit-test',start_date='1992-10-10'",
  );
  r = submit(proposal({ losses: [loss()] }));
  expect(() => approve(r)).toThrow("backdated");
});
it("does not count duplicate submissions or corroborating phase evidence twice", () => {
  const r = submit(proposal({ losses: [loss()] }));
  expect(submit(proposal({ losses: [loss()] })).id).toBe(r.id);
  approve(r);
  const battle = one(db, "SELECT id FROM battles")!.id;
  const second = submit(
    proposal({ battle_id: battle, name: null, losses: [loss()] }),
    { body: "Another account of the same phase." },
  );
  expect(second.actions[0].ready).toBe(true);
  expect(second.actions[0].warnings.join(" ")).toContain("corroborates");
  approve(second);
  expect(count("battle_report_records")).toBe(1);
  expect(count("battle_report_evidence")).toBe(2);
  expect(count("casualties")).toBe(2);
  expect(count("battle_asset_effects")).toBe(1);
  expect(count("timeline")).toBe(1);
  const conflict = submit(
    proposal({
      battle_id: battle,
      name: null,
      outcome: "Conflicting account",
      losses: [loss()],
    }),
  );
  expect(() => approve(conflict)).toThrow("different battle facts");
  expect(count("battle_report_evidence")).toBe(2);
});
it("corroborates inline-created formations without creating another unit", () => {
  const b = proposal({
    participants: [
      {
        name: "Supplied Formation",
        create_unit: true,
        branch: "Army",
        unit_type: "Division",
        casualties: { KIA: 1 },
      },
    ],
  });
  approve(submit(b));
  const r = submit(
    { ...b, battle_id: one(db, "SELECT id FROM battles")!.id, name: null },
    { body: "Corroborating formation account" },
  );
  approve(r);
  expect(count("units")).toBe(2);
  expect(count("casualties")).toBe(1);
  expect(count("battle_report_evidence")).toBe(2);
});
it("deduplicates reordered participants and loss attribution for the same phase", () => {
  const b = proposal({
    participants: [
      { unit_id: "unit-test", casualties: { KIA: 1 } },
      { name: "Other reported side", casualties: { WIA: 3 } },
    ],
    losses: [
      { equipment: "Jeep", count: 2, state: "lost", participant_index: 1 },
    ],
  });
  approve(submit(b));
  const r = submit(
    {
      ...b,
      battle_id: one(db, "SELECT id FROM battles")!.id,
      name: null,
      participants: [b.participants[1], b.participants[0]],
      losses: [{ ...b.losses[0], participant_index: 0 }],
    },
    { body: "Reordered corroborating account" },
  );
  approve(r);
  expect(count("battle_report_losses")).toBe(1);
  const lossRow = one(db, "SELECT * FROM battle_report_losses")!;
  expect(
    one(
      db,
      "SELECT name FROM battle_report_participants WHERE id=?",
      lossRow.participant_id,
    )!.name,
  ).toBe("Other reported side");
  expect(count("casualties")).toBe(2);
});
it("blocks stale unit/asset/battle proposals until a reasoned re-review", () => {
  let r = submit(proposal({ losses: [loss()] }));
  db.exec("UPDATE assets SET operation='damaged'");
  expect(() => approve(r)).toThrow("changed after");
  r = edit(r, r.actions[0].payload.battle);
  approve(r);
  let next = submit(
    proposal({
      battle_id: one(db, "SELECT id FROM battles")!.id,
      name: null,
      reference: "phase-2",
    }),
  );
  db.exec("UPDATE units SET branch='Updated Army'");
  expect(() => approve(next)).toThrow("changed after");
  next = edit(next, next.actions[0].payload.battle);
  approve(next);
  expect(count("battle_report_records")).toBe(2);
});
it("rolls back battle, new formation, casualties, asset and audit on a later database failure", () => {
  db.exec(
    "CREATE TRIGGER fixture_failure BEFORE INSERT ON battle_report_evidence BEGIN SELECT RAISE(ABORT,'fixture rollback');END;",
  );
  const r = submit(
    proposal({
      participants: [
        {
          name: "New Formation",
          create_unit: true,
          branch: "Army",
          unit_type: "Division",
          casualties: { KIA: 1 },
        },
      ],
      losses: [loss({ participant_index: null })],
    }),
  );
  const auditBefore = count("audit");
  expect(() => approve(r)).toThrow("fixture rollback");
  for (const table of [
    "battles",
    "casualties",
    "battle_report_records",
    "battle_report_losses",
    "battle_asset_effects",
    "timeline",
  ])
    expect(count(table)).toBe(0);
  expect(count("units")).toBe(1);
  expect(count("audit")).toBe(auditBefore);
  expect(one(db, "SELECT operation FROM assets")!.operation).toBe(
    "operational",
  );
  expect(
    one(db, "SELECT end_date FROM asset_assignments")!.end_date,
  ).toBeNull();
  expect(reportDetail(db, r.id).status).toBe("review");
});
it("rejects a proposal without domain effects and keeps scenarios outside canon", () => {
  const r = submit();
  approveReport(db, {
    report_id: r.id,
    revision: r.revision,
    action_ids: [],
    reject_ids: [r.actions[0].id],
    reason: "Do not accept this fixture",
  });
  expect(reportDetail(db, r.id).status).toBe("rejected");
  expect(count("battles")).toBe(0);
  expect(() => approve(submit(proposal(), { mode: "simulate" }))).toThrow(
    "scenario",
  );
  expect(count("battles")).toBe(0);
});
it("validates numbers, references and atomic participant choices", () => {
  expect(() =>
    submit(
      proposal({
        participants: [{ unit_id: "unit-test", casualties: { KIA: -1 } }],
      }),
    ),
  ).toThrow();
  expect(() =>
    submit(
      proposal({
        participants: [{ unit_id: "unit-test", casualties: { KIA: 1.5 } }],
      }),
    ),
  ).toThrow();
  for (const extra of [
    { reference: null },
    { participants: [{ unit_id: "unit-test" }, { unit_id: "unit-test" }] },
    { losses: [loss({ participant_index: 3 })] },
  ])
    expect(submit(proposal(extra)).actions[0].ready).toBe(false);
  const r = submit();
  expect(() =>
    editReportAction(db, {
      report_id: r.id,
      action_id: r.actions[0].id,
      revision: r.revision,
      payload: { ...r.actions[0].payload, battle: null },
      reason: "Invalid removal",
    }),
  ).toThrow("cannot be removed");
});
it("suggests the illustrative prose only as editable facts without writing records", () => {
  const before = count("sources");
  const s = suggestBattle(db, {
    body: "On October 8, the 4th Infantry Brigade fought near Fixture Ridge. It suffered 32 killed and 114 wounded.",
    date: "1992-10-03",
  });
  expect(s.battle.date_info.label).toBe("1992-10-08");
  expect(s.battle.participants[0]).toMatchObject({
    unit_id: "unit-test",
    casualties: { KIA: 32, WIA: 114, MIA: null },
  });
  expect(s.battle.location).toBe("Fixture Ridge");
  expect(s.battle.reference).toBeNull();
  expect(s.battle.outcome).toBeNull();
  expect(count("sources")).toBe(before);
  expect(count("battles")).toBe(0);
  expect(
    suggestBattle(db, {
      body: "October 8, the 4th Infantry Brigade fought.",
      date: null,
    }).battle.date_info.precision,
  ).toBe("unknown");
  expect(
    suggestBattle(db, {
      body: "1992-02-31: the 4th Infantry Brigade fought.",
      date: null,
    }).battle.date_info.precision,
  ).toBe("unknown");
});
it("keeps conditional, multiple-formation, enemy and ambiguous casualty prose for manual review", () => {
  for (const body of [
    "4th Infantry Brigade might suffer 32 killed.",
    "4th Infantry Brigade reported 32 killed and later 12 killed.",
    "4th Infantry Brigade and 5th Infantry Brigade suffered 32 killed.",
    "4th Infantry Brigade reported 32 enemy killed.",
  ]) {
    expect(
      suggestBattle(db, { body, date: null }).battle.participants[0].casualties
        .KIA,
    ).toBeNull();
  }
  expect(
    suggestBattle(db, {
      body: "14th Infantry Brigade suffered 32 killed.",
      date: null,
    }).battle.participants[0].unit_id,
  ).toBeNull();
  expect(
    suggestBattle(db, {
      body: "4th Infantry Brigade suffered 1,114 wounded.",
      date: null,
    }).battle.participants[0].casualties.WIA,
  ).toBe(1114);
  expect(
    suggestBattle(db, {
      body: "4th Infantry Brigade suffered 32.5 wounded.",
      date: null,
    }).battle.participants[0].casualties.WIA,
  ).toBeNull();
  expect(count("units")).toBe(1);
});
it("persists battle approval and immutable evidence across close/reopen", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "rnas-battle-")),
    file = path.join(dir, "fixture.sqlite");
  let durable = openDatabase(file);
  try {
    const r = submitReport(durable, {
      title: "Persistent fixture",
      body: "Persistent original",
      battle: proposal({
        participants: [{ name: "Unresolved side", casualties: { POW: 3 } }],
      }),
    });
    approve(r, durable);
    const before = all(durable, "SELECT * FROM battle_report_evidence");
    durable.close();
    durable = openDatabase(file);
    expect(reportDetail(durable, r.id).status).toBe("applied");
    expect(all(durable, "SELECT * FROM battle_report_evidence")).toEqual(
      before,
    );
    expect(one(durable, "SELECT category,count FROM casualties")).toMatchObject(
      { category: "POW", count: 3 },
    );
    expect(() => durable.exec("DELETE FROM battle_report_records")).toThrow(
      "append-only",
    );
    expect(all(durable, "PRAGMA foreign_key_check")).toEqual([]);
  } finally {
    durable.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
it("migration 6 preserves pending/applied/rejected actions and both prior evidence tables", () => {
  const old = new DatabaseSync(":memory:");
  try {
    old.exec(
      "PRAGMA foreign_keys=ON;CREATE TABLE migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)",
    );
    for (const f of readdirSync("migrations")
      .filter((f) => f.endsWith(".sql") && Number(f.split("_")[0]) <= 5)
      .sort()) {
      old.exec(readFileSync("migrations/" + f, "utf8"));
      old
        .prepare("INSERT INTO migrations VALUES(?,?)")
        .run(Number(f.split("_")[0]), "fixture");
    }
    adminAction(old, {
      action: "budget",
      name: "Old fixture",
      currency: "USD",
      fiscal_year: 1992,
      appropriated: 100,
      source_text: "Fixture authority",
    });
    const r = submitReport(old, {
      title: "Migration fixture",
      body: "Parliament passed Bill OLD-6\nTreasury disbursed USD 40 for Budget Old fixture; reference PAY-6: Parts\nPending archive statement\nRejected archive statement",
      date: "1992-10-04",
    });
    approveReport(old, {
      report_id: r.id,
      revision: r.revision,
      action_ids: [r.actions[0].id, r.actions[1].id],
      reject_ids: [r.actions[3].id],
      reason: "Migration fixture approval",
    });
    const tables = [
      "report_actions",
      "bill_event_evidence",
      "ledger_report_evidence",
      "ledger",
      "report_reviews",
      "sources",
    ];
    const before = tables.map((t) =>
      all(old, `SELECT * FROM ${t} ORDER BY rowid`),
    );
    migrate(old);
    expect(
      tables.map((t) => all(old, `SELECT * FROM ${t} ORDER BY rowid`)),
    ).toEqual(before);
    expect(all(old, "PRAGMA foreign_key_check")).toEqual([]);
    expect(() => old.exec("DELETE FROM bill_event_evidence")).toThrow(
      "append-only",
    );
    expect(() => old.exec("DELETE FROM ledger_report_evidence")).toThrow(
      "append-only",
    );
    const b = submitReport(old, {
      title: "Post-migration fixture",
      body: "After the upgrade",
      battle: proposal({ participants: [] }),
    });
    approve(b, old);
    expect(one(old, "SELECT count(*) n FROM battle_report_records")!.n).toBe(1);
  } finally {
    old.close();
  }
});
it("corrects only the two authorized Altis year labels with idempotent before/after audits", () => {
  importRecovery(db);
  expect(correctReviewedAltisYears(db).corrected).toBe(0);
  importReviewedCanon(db);
  const before = all(db, "SELECT * FROM battles ORDER BY id"),
    money = all(
      db,
      "SELECT * FROM assertions WHERE category='economic' ORDER BY id",
    );
  expect(correctReviewedAltisYears(db).corrected).toBe(2);
  expect(correctReviewedAltisYears(db).corrected).toBe(0);
  const after = all(db, "SELECT * FROM battles ORDER BY id");
  expect(
    after
      .filter((r, i) => JSON.stringify(r) !== JSON.stringify(before[i]))
      .map((r) => r.id),
  ).toEqual(["B026", "B027"]);
  for (const id of ["B026", "B027"]) {
    const old = before.find((r) => r.id === id)!,
      now = after.find((r) => r.id === id)!;
    expect(now).toEqual({
      ...old,
      date_json: JSON.stringify({
        ...JSON.parse(old.date_json),
        label: "October 1992",
      }),
    });
    const a = one(
      db,
      "SELECT * FROM audit WHERE action='correct_altis_battle_year' AND target=?",
      id,
    )!;
    expect(JSON.parse(a.before_json)).toEqual(old);
    expect(JSON.parse(a.after_json)).toMatchObject({
      ...now,
      authority_assertion_id: "review-override-altis-report",
    });
  }
  expect(
    all(db, "SELECT * FROM assertions WHERE category='economic' ORDER BY id"),
  ).toEqual(money);
});
it("automatically applies the authorized narrow correction when an existing database reopens", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "rnas-altis-")),
    file = path.join(dir, "fixture.sqlite");
  let durable = openDatabase(file);
  try {
    importRecovery(durable);
    importReviewedCanon(durable);
    durable.close();
    durable = openDatabase(file);
    expect(
      JSON.parse(
        one(durable, "SELECT date_json FROM battles WHERE id='B026'")!
          .date_json,
      ).label,
    ).toBe("October 1992");
    expect(
      all(
        durable,
        "SELECT * FROM audit WHERE action='correct_altis_battle_year'",
      ),
    ).toHaveLength(2);
  } finally {
    durable.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
it("renders plain-language review with unknown fields and the combined workflow", () => {
  const b = proposal({
    participants: [{ unit_id: "unit-test", casualties: { KIA: 0 } }],
    losses: [{ equipment: "Vehicles", count: null }],
  });
  const summary = renderToStaticMarkup(
    React.createElement(BattleSummary, {
      battle: b,
      units: all(db, "SELECT * FROM units"),
    }),
  );
  expect(summary).toContain("Not reported");
  expect(summary).toContain(">0</td>");
  expect(summary).toContain("Count unknown");
  expect(summary).not.toContain("date_info");
  const html = renderToStaticMarkup(
    React.createElement(BattleWorkspace, {
      date: "1992-10-03",
      battles: [],
      units: [],
      assets: [],
      phases: [],
      onChanged: async () => {},
      openSource: () => {},
    }),
  );
  expect(html).toContain("New Battle / After-Action Report");
  expect(html).toContain("Original engagement report");
  expect(html).toContain("Historical casualty records");
  expect(html).not.toContain("window.alert");
});
