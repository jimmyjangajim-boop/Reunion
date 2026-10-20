import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase, all, one } from "../src/lib/db.ts";
import type { DB } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import {
  submitReport,
  approveReport,
  editReportAction,
  reportDetail,
} from "../src/lib/reports.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
});
afterEach(() => db.close());
const order = "Order 3rd Infantry Division to Dalmatia";
const submit = (body = order, extra: Record<string, any> = {}) =>
  submitReport(db, {
    title: "Movement report",
    body,
    date: "1992-10-04",
    ...extra,
  });
const approve = (r: Record<string, any>, extra: Record<string, any> = {}) =>
  approveReport(db, {
    report_id: r.id,
    revision: r.revision,
    action_ids: r.actions.map((a: any) => a.id),
    reason: "Accept the reported event",
    ...extra,
  });
describe("National reports", () => {
  it("preserves the exact original and performs no national changes on submission", () => {
    const original = "  " + order + "\r\n";
    const r = submit(original);
    expect(
      one(db, "SELECT content FROM sources WHERE id=?", r.source_id)?.content,
    ).toBe(original);
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
    expect(() =>
      db
        .prepare("UPDATE sources SET content=? WHERE id=?")
        .run("changed", r.source_id),
    ).toThrow("immutable");
  });
  it("approves an order, adds source-linked history, and does not invent arrival", () => {
    const r = submit();
    approve(r);
    expect(
      one(db, "SELECT operation,completed_date FROM movements"),
    ).toMatchObject({ operation: "ordered", completed_date: null });
    expect(
      one(db, "SELECT * FROM timeline WHERE id LIKE 'report-event-%'"),
    ).toMatchObject({ source_id: r.source_id, operation: "ordered" });
    expect(() => approve(r)).toThrow("changed");
    expect(all(db, "SELECT * FROM movements")).toHaveLength(1);
  });
  it("links confirmed arrival to a prior order and keeps an audit", () => {
    approve(submit());
    const r = submit("3rd Infantry Division arrived in Dalmatia.", {
      date: "1992-10-06",
    });
    expect(r.actions[0].ready).toBe(true);
    approve(r);
    expect(one(db, "SELECT * FROM movements")).toMatchObject({
      operation: "completed",
      completed_date: "1992-10-06",
    });
    expect(
      all(db, "SELECT * FROM audit WHERE action='complete_movement'"),
    ).toHaveLength(1);
    expect(reportDetail(db, r.id).actions[0].missing).toEqual([]);
  });
  it("does not manufacture an earlier order for an arrival", () => {
    const r = submit("3rd Infantry Division arrived in Dalmatia.");
    expect(r.actions[0].ready).toBe(false);
    expect(() => approve(r)).toThrow("prior order");
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
  });
  it("atomically rolls back earlier changes when a later selected effect fails", () => {
    const r = submit(
      order + "\nUnknown Formation was ordered to deploy to Dalmatia.",
    );
    expect(() => approve(r)).toThrow("formation");
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
    expect(
      all(db, "SELECT * FROM report_actions WHERE status='applied'"),
    ).toHaveLength(0);
    expect(
      all(db, "SELECT * FROM timeline WHERE id LIKE 'report-event-%'"),
    ).toHaveLength(0);
  });
  it("allows partial approval and unknown details without discarding the report", () => {
    const r = submit(
      order + "\nUnknown Formation was ordered to deploy to Dalmatia.",
    );
    const result = approve(r, { action_ids: [r.actions[0].id] });
    expect(result.status).toBe("partially_applied");
    expect(result.actions[1].status).toBe("pending");
    expect(all(db, "SELECT * FROM movements")).toHaveLength(1);
  });
  it("records unsupported events with unknown dates but no invented department effects", () => {
    const r = submit("A cabinet meeting took place.\nA minister spoke.", {
      date: null,
    });
    approve(r);
    expect(
      all(db, "SELECT * FROM timeline WHERE id LIKE 'report-event-%'"),
    ).toHaveLength(2);
    expect(
      JSON.parse(
        one(
          db,
          "SELECT date_json FROM timeline WHERE id LIKE 'report-event-%'",
        )!.date_json,
      ).precision,
    ).toBe("unknown");
    expect(
      all(db, "SELECT * FROM issues WHERE id LIKE 'report-detail-%'"),
    ).toHaveLength(1);
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
  });
  it("deduplicates identical submissions before and after approval", () => {
    const r = submit();
    expect(submit().id).toBe(r.id);
    approve(r);
    expect(submit().duplicate).toBe(true);
    expect(all(db, "SELECT * FROM national_reports")).toHaveLength(1);
    expect(all(db, "SELECT * FROM movements")).toHaveLength(1);
  });
  it("keeps hypothetical reports outside canon", () => {
    const r = submit(order, { mode: "simulate" });
    expect(r.status).toBe("scenario");
    expect(() => approve(r)).toThrow("scenario");
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
  });
  it("corrects a proposal without modifying the source and invalidates stale review", () => {
    const r = submit(order, { date: null });
    expect(r.actions[0].ready).toBe(false);
    const next = editReportAction(db, {
      report_id: r.id,
      action_id: r.actions[0].id,
      revision: r.revision,
      payload: { ...r.actions[0].payload, date: "1992-10-04" },
      reason: "Supply the documented order date",
    });
    expect(next.actions[0].ready).toBe(true);
    expect(() => approve(r)).toThrow("changed");
    approve(next);
    expect(reportDetail(db, r.id).body).toBe(order);
  });
  it("revalidates restrictions and preserves everything on a treaty-warning failure", () => {
    const destination = one(
      db,
      "SELECT l.name FROM locations l JOIN restrictions r ON r.location_id=l.id",
    )!.name;
    const r = submit("Order 3rd Infantry Division to " + destination);
    expect(r.actions[0].ready).toBe(false);
    expect(() => approve(r)).toThrow("treaty warning");
    expect(all(db, "SELECT * FROM movements")).toHaveLength(0);
  });
  it("persists approved reports through database close and reopen", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "rnas-report-persistence-"));
    const file = path.join(dir, "test.sqlite");
    try {
      let durable = openDatabase(file);
      importRecovery(durable);
      const r = submitReport(durable, {
        title: "Persistent order",
        body: order,
        date: "1992-10-04",
      });
      approveReport(durable, {
        report_id: r.id,
        revision: r.revision,
        action_ids: [r.actions[0].id],
        reason: "Persistence fixture approval",
      });
      durable.close();
      durable = openDatabase(file);
      expect(reportDetail(durable, r.id).status).toBe("applied");
      expect(one(durable, "SELECT operation FROM movements")?.operation).toBe(
        "ordered",
      );
      durable.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
describe("Reviewed canon import", () => {
  it("imports evidence and user decisions idempotently without accepting proposed calendars", () => {
    const result = importReviewedCanon(db);
    expect(result).toMatchObject({ sources: 88, facts: 40, answers: 27 });
    expect(importReviewedCanon(db).duplicate).toBe(true);
    expect(all(db, "SELECT * FROM source_artifacts")).toHaveLength(88);
    expect(
      all(db, "SELECT * FROM decisions WHERE id LIKE 'review-decision-%'"),
    ).toHaveLength(27);
    expect(
      one(db, "SELECT value FROM settings WHERE key='in_world_date'")?.value,
    ).not.toBe("1992-10-18");
    expect(
      all(
        db,
        "SELECT * FROM issues WHERE id LIKE 'REVIEW-calendar-%' AND state='open'",
      ),
    ).toHaveLength(2);
    expect(
      one(db, "SELECT value FROM assertions WHERE id='review-override-heir'")
        ?.value,
    ).toBe("No designated heir");
    expect(one(db, "SELECT canon FROM assertions WHERE id='heir'")?.canon).toBe(
      "superseded",
    );
    expect(
      one(
        db,
        "SELECT value FROM assertions WHERE id='review-override-spending'",
      )?.value,
    ).toBe("$255B USD");
    expect(
      one(
        db,
        "SELECT date_json FROM assertions WHERE id='review-override-altis-report'",
      )?.date_json,
    ).toContain("1992-10-11");
  });
});
