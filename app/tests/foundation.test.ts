import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DatabaseSync, backup } from "node:sqlite";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase, all, one, transaction } from "../src/lib/db.ts";
import type { DB } from "../src/lib/db.ts";
import {
  importRecovery,
  hash,
  stageFiles,
  rollbackImport,
} from "../src/lib/importer.ts";
import {
  snapshot,
  addAssertion,
  createUserSource,
  resolveIssue,
  search,
  detectIssues,
  evidenceFor,
} from "../src/lib/canon.ts";
import { dateValue, historicalDateSchema, bounds } from "../src/lib/dates.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
});
afterEach(() => db.close());
function assertion(value: string, extra: Record<string, any> = {}) {
  const src = createUserSource(db, value);
  return addAssertion(db, {
    entity_id: "reunion",
    predicate: "Test observation",
    value,
    category: "history",
    canon: "confirmed",
    operation: "completed",
    date: dateValue("day", "1992-10-03"),
    scope: "point",
    source_id: src,
    line_start: 1,
    line_end: 1,
    ...extra,
  });
}
describe("Stage 1: archival integrity", () => {
  it("preserves every original byte hash and line-referenced source", () => {
    const manifest = JSON.parse(
      readFileSync("evidence/recovery/MANIFEST.json", "utf8"),
    );
    expect(manifest.primary_sources).toHaveLength(14);
    for (const s of manifest.primary_sources) {
      const raw = readFileSync(path.join("evidence/recovery", s.relative_path));
      const record = one(
        db,
        "SELECT * FROM sources WHERE path=?",
        s.relative_path,
      )!;
      expect(hash(raw)).toBe(s.sha256);
      expect(hash(Buffer.from(record.content))).toBe(s.sha256);
      expect(record.bytes).toBe(raw.length);
    }
    expect(
      all(
        db,
        "SELECT * FROM sources WHERE path LIKE ?",
        "02_RECOVERED_CHAT_LORE/%",
      ),
    ).toHaveLength(2);
    expect(() =>
      db.prepare("UPDATE sources SET content=?").run("changed"),
    ).toThrow("immutable");
  });
  it("imports idempotently without duplicate canon, timeline or evidence", () => {
    const before = ["sources", "assertions", "timeline", "evidence"].map(
      (t) => one(db, `SELECT COUNT(*) n FROM ${t}`)!.n,
    );
    expect(importRecovery(db).duplicate).toBe(true);
    expect(
      ["sources", "assertions", "timeline", "evidence"].map(
        (t) => one(db, `SELECT COUNT(*) n FROM ${t}`)!.n,
      ),
    ).toEqual(before);
  });
  it("gives direct override priority while preserving superseded baseline evidence", () => {
    const row = snapshot(db, "1992-10-03").find(
      (r) => r.predicate === "Vice President",
    )!;
    expect(row.value).toBe("Darius Younger");
    expect(evidenceFor(db, row.id)[0].excerpt).toContain("Darius Younger");
    expect(
      one(db, "SELECT * FROM assertions WHERE id=?", "baseline-vp-old")!.value,
    ).toBe("Jack Younger");
  });
  it("keeps secondary recoveries at tier 5 and provisional even when recovery labels claim confirmation", () => {
    const a = one(db, "SELECT * FROM assertions WHERE id=?", "person-P006")!;
    expect(a.canon).toBe("provisional");
    expect(evidenceFor(db, a.id)[0].tier).toBe(5);
    expect(all(db, "SELECT * FROM timeline")).toHaveLength(44);
  });
  it("uses stable separate identities for equally designated king and heir", () => {
    expect(
      one(db, "SELECT * FROM entities WHERE id=?", "king-zo-iii")!.name,
    ).toContain("Zo III");
    expect(
      one(db, "SELECT * FROM entities WHERE id=?", "heir-zo-iii")!.name,
    ).toContain("Zo III");
    expect(one(db, "SELECT * FROM issues WHERE id=?", "C001")!.state).toBe(
      "open",
    );
  });
  it("preserves Rehn then Curro without fabricated dates", () => {
    const terms = all(db, "SELECT * FROM appointments ORDER BY sequence");
    expect(terms.map((a) => a.person_id)).toEqual(["P014", "P015"]);
    expect(
      terms.every((a) => a.start_date === null && a.end_date === null),
    ).toBe(true);
    expect(evidenceFor(db, "finance-succession")[0].excerpt).toContain(
      "car crash",
    );
  });
  it("preserves 400 seats and constitutional max 300 independently", () => {
    const c = one(db, "SELECT * FROM chambers")!;
    expect(c.actual_seats).toBe(400);
    expect(c.legal_max).toBe(300);
    expect(
      all(db, "SELECT * FROM party_seats").reduce((s, p) => s + p.seats, 0),
    ).toBe(400);
    expect(c.occupied_seats).toBeNull();
  });
  it("does not carry the baseline backwards or into 1993", () => {
    expect(snapshot(db, "1992-10-02")).toHaveLength(0);
    expect(
      snapshot(db, "1993-10-11").every((r) => r.id === "altis-report"),
    ).toBe(true);
    expect(snapshot(db, "1992-10-03").length).toBeGreaterThan(15);
  });
  it("keeps month/year/decade and relative dates incomplete", () => {
    for (const d of [
      dateValue("month", "1992-10"),
      dateValue("year", "1992"),
      dateValue("decade", "1970s"),
      dateValue("relative", "Days after appointment"),
      dateValue("unknown", "Unknown"),
    ]) {
      const id = assertion("incomplete", { date: d });
      expect(
        JSON.parse(
          one(db, "SELECT date_json FROM assertions WHERE id=?", id)!.date_json,
        ),
      ).toEqual(d);
    }
    expect(
      historicalDateSchema.safeParse(dateValue("month", "1992-10")).success,
    ).toBe(true);
    expect(() => dateValue("day", "1992-02-30")).toThrow();
  });
  it("exposes competing excerpts, detects overlaps once, and permits unrelated entry", () => {
    const a = assertion("First"),
      b = assertion("Second");
    detectIssues(db);
    const issue = one(
      db,
      "SELECT * FROM issues WHERE (a_id=? AND b_id=?) OR (a_id=? AND b_id=?)",
      a,
      b,
      b,
      a,
    )!;
    expect(issue).toBeTruthy();
    expect(evidenceFor(db, a)[0].excerpt).toBe("First");
    const n = one(db, "SELECT count(*) n FROM issues")!.n;
    detectIssues(db);
    expect(one(db, "SELECT count(*) n FROM issues")!.n).toBe(n);
    expect(
      assertion("unrelated", { predicate: "Unrelated field" }),
    ).toBeTruthy();
  });
  it("requires rationale, supersedes without destroying text, and records immutable decision history", () => {
    const a = assertion("First"),
      b = assertion("Second");
    detectIssues(db);
    const issue = one(
      db,
      "SELECT * FROM issues WHERE a_id IN (?,?) AND b_id IN (?,?)",
      a,
      b,
      a,
      b,
    )!;
    expect(() =>
      resolveIssue(db, {
        issue_id: issue.id,
        action: "accept_a",
        explanation: "",
      }),
    ).toThrow();
    resolveIssue(db, {
      issue_id: issue.id,
      action: "replace",
      value: "Approved replacement",
      explanation: "Corrected against the original log",
      date: dateValue("day", "1992-10-03"),
    });
    expect(one(db, "SELECT value,canon FROM assertions WHERE id=?", a)).toEqual(
      expect.objectContaining({ value: "First", canon: "superseded" }),
    );
    expect(
      one(db, "SELECT * FROM decisions WHERE issue_id=?", issue.id)!
        .before_json,
    ).toContain("Second");
    expect(() => db.prepare("DELETE FROM decisions").run()).toThrow(
      "append only",
    );
  });
  it("preserves both historical contexts using explicit dates", () => {
    const a = assertion("First"),
      b = assertion("Second");
    detectIssues(db);
    const issue = one(
      db,
      "SELECT * FROM issues WHERE a_id IN (?,?) AND b_id IN (?,?)",
      a,
      b,
      a,
      b,
    )!;
    resolveIssue(db, {
      issue_id: issue.id,
      action: "different_contexts",
      explanation: "Separate dated administrations",
      contexts: "First and second terms",
      date: dateValue("day", "1992-01-01"),
      date_b: dateValue("day", "1993-01-01"),
    });
    expect(
      snapshot(db, "1992-01-01").find(
        (r) => r.predicate === "Test observation",
      ),
    ).toBeTruthy();
    expect(
      snapshot(db, "1993-01-01").find(
        (r) => r.predicate === "Test observation",
      ),
    ).toBeTruthy();
  });
  it("postpones or explicitly answers a gap without inventing a date", () => {
    resolveIssue(db, {
      issue_id: "C003",
      action: "postpone",
      explanation: "Need original appointment record",
    });
    expect(one(db, "SELECT * FROM issues WHERE id=?", "C003")!.state).toBe(
      "postponed",
    );
    resolveIssue(db, {
      issue_id: "C003",
      action: "answer",
      value: "Unknown",
      date: dateValue(),
      explanation: "No primary date has been found",
    });
    const a = one(
      db,
      "SELECT * FROM assertions WHERE predicate=(SELECT title FROM issues WHERE id='C003')",
    )!;
    expect(a.valid_from).toBeNull();
    expect(JSON.parse(a.date_json).precision).toBe("unknown");
  });
  it("searches original text and source line locations safely", () => {
    const rows = search(db, "Dalmatia");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].line_start).toBeGreaterThan(0);
    expect(() => search(db, '" OR * NEAR(boom)')).not.toThrow();
    expect(search(db, '"')).toHaveLength(0);
  });
  it("stages repeat uploads once and rollback retains raw originals", () => {
    const files = [
      { name: "new-log.txt", content: Buffer.from("Unreviewed battle result") },
    ];
    const result = stageFiles(db, files);
    expect(stageFiles(db, files).duplicate).toBe(true);
    expect(
      one(db, "SELECT * FROM sources WHERE batch_id=?", result.batch)!.content,
    ).toBe("Unreviewed battle result");
    const count = one(db, "SELECT count(*) n FROM assertions")!.n;
    rollbackImport(db, result.batch);
    expect(one(db, "SELECT count(*) n FROM assertions")!.n).toBe(count);
    expect(
      one(db, "SELECT * FROM sources WHERE batch_id=?", result.batch),
    ).toBeTruthy();
  });
  it("never accepts a simulated result as confirmed canon", () => {
    expect(() => assertion("Victory", { operation: "simulated" })).toThrow();
    const id = assertion("Victory", {
      operation: "simulated",
      canon: "provisional",
    });
    expect(snapshot(db, "1992-10-03").some((r) => r.id === id)).toBe(false);
  });
  it("restores a backup with identical national records", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rnas-test-"));
    try {
      const file = path.join(dir, "backup.sqlite");
      await backup(db, file);
      const restored = new DatabaseSync(file);
      expect(all(restored, "SELECT * FROM assertions ORDER BY id")).toEqual(
        all(db, "SELECT * FROM assertions ORDER BY id"),
      );
      expect(all(restored, "SELECT * FROM evidence ORDER BY id")).toEqual(
        all(db, "SELECT * FROM evidence ORDER BY id"),
      );
      expect(one(restored, "PRAGMA integrity_check")!.integrity_check).toBe(
        "ok",
      );
      restored.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
