import { it, expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { openDatabase, all } from "../src/lib/db.ts";
import { importRecovery, rollbackImport } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { adminAction } from "../src/lib/admin.ts";
import { verifyDatabase } from "../src/lib/database-validation.ts";

it("blocks reviewed rollback without altering decisions, predecessors or projections", () => {
  const db = openDatabase(":memory:");
  try {
    importRecovery(db);
    const review = importReviewedCanon(db);
    const tables = [
      "assertions",
      "timeline",
      "issues",
      "decisions",
      "import_batches",
      "audit",
      "battles",
    ];
    const before = tables.map((t) => all(db, `SELECT * FROM ${t}`));
    expect(() => rollbackImport(db, review.batch)).toThrow("Reviewed canon");
    expect(tables.map((t) => all(db, `SELECT * FROM ${t}`))).toEqual(before);
    expect(importReviewedCanon(db).duplicate).toBe(true);
  } finally {
    db.close();
  }
});

it("rejects a backdated parent that becomes cyclic in a later snapshot atomically", () => {
  const db = openDatabase(":memory:");
  try {
    importRecovery(db);
    const state = (unit: string, parent: string | null, date: string) =>
      adminAction(db, {
        action: "unit_state",
        unit_id: unit,
        parent_id: parent,
        date,
        operation: "operational",
        source_text: "Test-only hierarchy observation",
      });
    state("unit-3mar", "unit-3inf", "1992-10-10");
    const before = ["unit_states", "sources", "audit"].map((t) =>
      all(db, `SELECT * FROM ${t}`),
    );
    expect(() => state("unit-3inf", "unit-3mar", "1992-10-05")).toThrow(
      "cycle on 1992-10-10",
    );
    expect(
      ["unit_states", "sources", "audit"].map((t) =>
        all(db, `SELECT * FROM ${t}`),
      ),
    ).toEqual(before);
    // This new observation ends the proposed parent's validity before the later change.
    state("unit-3inf", null, "1992-10-09");
    expect(() => state("unit-3inf", "unit-3mar", "1992-10-05")).not.toThrow();
  } finally {
    db.close();
  }
});

it("protects an ordinary import after its claims receive a review decision", () => {
  const db = openDatabase(":memory:");
  try {
    importRecovery(db);
    db.prepare(
      "INSERT INTO import_batches(id,name,sha256,state) VALUES('test-batch','Ordinary imported file','test','accepted')",
    ).run();
    db.prepare(
      "UPDATE assertions SET batch_id='test-batch' WHERE id='person-P006'",
    ).run();
    db.prepare(
      "INSERT INTO issues(id,kind,priority,category,title,a_id) VALUES('test-issue','missing','HIGH','history','Test','person-P006')",
    ).run();
    db.prepare(
      "INSERT INTO decisions(id,issue_id,action,explanation,before_json,after_json) VALUES('test-decision','test-issue','postpone','Test review','{}','{}')",
    ).run();
    const before = all(db, "SELECT * FROM assertions");
    expect(() => rollbackImport(db, "test-batch")).toThrow("Reviewed canon");
    expect(all(db, "SELECT * FROM assertions")).toEqual(before);
  } finally {
    db.close();
  }
});

it("verifies current schema and rejects unsupported migrations", () => {
  const db = openDatabase(":memory:");
  try {
    expect(verifyDatabase(db)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    db.prepare("INSERT INTO migrations VALUES(999,'test')").run();
    expect(() => verifyDatabase(db)).toThrow("migration versions");
  } finally {
    db.close();
  }
});

it("rejects an invalid-FK restore before touching the existing destination", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "rnas-restore-audit-"));
  try {
    const source = path.join(dir, "bad.sqlite"),
      target = path.join(dir, "target.sqlite");
    const sourceDb = openDatabase(source);
    sourceDb.exec("PRAGMA foreign_keys=OFF");
    sourceDb
      .prepare(
        "INSERT INTO entities(id,name,kind) VALUES('test','Test','person')",
      )
      .run();
    sourceDb
      .prepare(
        "INSERT INTO appointments(id,office_id,person_id,sequence,arrangement,date_json,canon) VALUES('bad','missing','test',1,'exclusive','{}','provisional')",
      )
      .run();
    sourceDb.close();
    const targetDb = openDatabase(target);
    targetDb.close();
    const before = readFileSync(target);
    const result = spawnSync(
      process.execPath,
      ["scripts/restore.ts", source, "--confirm"],
      { env: { ...process.env, RNAS_DB: target }, encoding: "utf8" },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Foreign key check failed");
    expect(readFileSync(target)).toEqual(before);
    const db = new DatabaseSync(target, { readOnly: true });
    expect(() => verifyDatabase(db)).not.toThrow();
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
