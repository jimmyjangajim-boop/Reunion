import { it, expect, beforeEach, afterEach } from "vitest";
import { openDatabase, all, one, type DB } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { reconcileProjectTracker } from "../src/lib/project-reconciliation.ts";
import {
  projectFunding,
  projectTotals,
  trackerProjectSource,
} from "../src/lib/project-funding.ts";
import type { TreasuryProject } from "../src/lib/treasury-view.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
  importReviewedCanon(db);
});
afterEach(() => db.close());
it("previews without writes, reconciles seven projects and preserves every unrelated table", () => {
  const tables = all(
    db,
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('projects','audit')",
  ).map((r) => r.name);
  const before = tables.map((t) => all(db, `SELECT * FROM "${t}"`));
  const preview = reconcileProjectTracker(db);
  expect(preview.changes).toHaveLength(7);
  expect(all(db, "SELECT * FROM projects")).toHaveLength(6);
  expect(preview.applied).toBe(false);
  expect(preview.changes[0].after.committed).toBe(13e9);
  expect(reconcileProjectTracker(db, true).applied).toBe(true);
  const projects = all<TreasuryProject>(db, "SELECT * FROM projects");
  expect(projects).toHaveLength(7);
  expect(projectTotals(projects)).toEqual([
    {
      currency: "USD",
      count: 7,
      cost: 61.6e9,
      paid: 24.72e9,
      committed: 36.88e9,
      gap: 0,
    },
  ]);
  expect(
    projects.every(
      (p) =>
        p.approved === null &&
        p.operation === "unknown" &&
        p.source_id === trackerProjectSource,
    ),
  ).toBe(true);
  expect(tables.map((t) => all(db, `SELECT * FROM "${t}"`))).toEqual(before);
  const old = one(
    db,
    "SELECT before_json FROM audit WHERE action='reconcile_project' AND target='spine'",
  );
  expect(JSON.parse(old!.before_json).committed).toBe(10.1e9);
  const count = one(db, "SELECT count(*) n FROM audit")!.n;
  expect(reconcileProjectTracker(db, true).duplicate).toBe(true);
  expect(one(db, "SELECT count(*) n FROM audit")!.n).toBe(count);
});
it("refuses to overwrite a later project edit and rolls back the whole batch on a write failure", () => {
  db.prepare("UPDATE projects SET committed=12 WHERE id='rail'").run();
  expect(() => reconcileProjectTracker(db, true)).toThrow("changed since");
  expect(
    one(db, "SELECT committed FROM projects WHERE id='spine'")!.committed,
  ).toBe(10.1e9);
  db.prepare("UPDATE projects SET committed=2500000000 WHERE id='rail'").run();
  const before = all(db, "SELECT * FROM projects"),
    audit = all(db, "SELECT * FROM audit");
  db.exec(
    "CREATE TRIGGER reject_oil BEFORE INSERT ON projects WHEN NEW.id='national-oil-drilling' BEGIN SELECT RAISE(ABORT,'test failure'); END;",
  );
  expect(() => reconcileProjectTracker(db, true)).toThrow("test failure");
  expect(all(db, "SELECT * FROM projects")).toEqual(before);
  expect(all(db, "SELECT * FROM audit")).toEqual(audit);
});
it("rejects an unverified tracker artifact", () => {
  db.prepare(
    "UPDATE source_artifacts SET original_sha256='wrong' WHERE source_id=?",
  ).run(trackerProjectSource);
  expect(() => reconcileProjectTracker(db, true)).toThrow(
    "Verified reviewed tracker source",
  );
  expect(all(db, "SELECT * FROM projects")).toHaveLength(6);
});
it("does not infer completion, funding or zero from unknowns or combine currencies", () => {
  const p: TreasuryProject = {
    id: "x",
    name: "x",
    date_json: "{}",
    operation: "unknown",
    currency: "USD",
    source_id: trackerProjectSource,
    planned: 100,
    paid: 20,
    committed: 80,
    approved: null,
  };
  expect(projectFunding(p)).toEqual({ gap: 0, coverage: 1, remaining: 80 });
  expect(projectFunding({ ...p, source_id: "unreviewed" }).coverage).toBeNull();
  expect(projectFunding({ ...p, committed: null }).gap).toBeNull();
  expect(projectTotals([p, { ...p, currency: "RMC", paid: null }])).toEqual([
    { currency: "USD", count: 1, cost: 100, paid: 20, committed: 80, gap: 0 },
    {
      currency: "RMC",
      count: 1,
      cost: 100,
      paid: null,
      committed: 80,
      gap: null,
    },
  ]);
});
