import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { all, one, transaction, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { createUserSource } from "./canon.ts";
import { exactDate, dateValue } from "./dates.ts";
import { recordMovement, completeMovement, treatyWarnings } from "./admin.ts";

const submitSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z
    .string()
    .min(1)
    .max(500000)
    .refine((s) => s.trim().length > 0),
  mode: z.enum(["record", "simulate"]).default("record"),
  date: exactDate.nullable().default(null),
  correction_of: z.string().nullable().default(null),
});
const payloadSchema = z
  .object({
    statement: z.string().min(1).max(500000),
    date: exactDate.nullable(),
    unit_id: z.string().nullable().default(null),
    location_id: z.string().nullable().default(null),
    movement_id: z.string().nullable().default(null),
    override_reason: z.string().max(2000).default(""),
  })
  .strict();

function requiredReport(db: DB, id: string) {
  const r = one(db, "SELECT * FROM national_reports WHERE id=?", id);
  if (!r) throw Error("Report not found");
  return r;
}
function candidates(db: DB, table: "units" | "locations", name: string) {
  return all(
    db,
    `SELECT id FROM ${table} WHERE lower(name)=lower(?)`,
    name.trim(),
  );
}

export function validateReportAction(db: DB, action: Row) {
  const p = payloadSchema.parse(JSON.parse(action.payload_json));
  const missing: string[] = [],
    warnings: string[] = [];
  if (action.kind !== "record_event") {
    if (!p.date)
      missing.push(
        "An exact movement date is required. The report can remain recorded without one.",
      );
    if (!p.unit_id || !one(db, "SELECT id FROM units WHERE id=?", p.unit_id))
      missing.push("Select a unique existing formation.");
    if (
      !p.location_id ||
      !one(db, "SELECT id FROM locations WHERE id=?", p.location_id)
    )
      missing.push("Select a unique existing destination.");
    if (p.location_id && p.date) {
      const restrictions = treatyWarnings(db, p.location_id, p.date);
      warnings.push(...restrictions);
      if (restrictions.length && !p.override_reason.trim())
        missing.push(
          "Review the treaty warning and provide an explicit override reason.",
        );
    }
    if (
      action.kind === "movement_arrival" &&
      p.unit_id &&
      p.location_id &&
      p.date
    ) {
      const orders = all(
        db,
        "SELECT id FROM movements WHERE unit_id=? AND location_id=? AND operation='ordered' AND date<=?",
        p.unit_id,
        p.location_id,
        p.date,
      );
      if (p.movement_id) {
        if (!orders.some((o) => o.id === p.movement_id))
          missing.push(
            "The selected prior order is no longer eligible for completion.",
          );
      } else if (orders.length !== 1)
        missing.push(
          "Arrival needs exactly one matching prior order, or an explicit order selection.",
        );
    }
  } else
    warnings.push(
      "Archive event only. No parliamentary, financial, military, or diplomatic state is inferred from this text.",
    );
  return { ready: missing.length === 0, missing, warnings, payload: p };
}

export function reportDetail(db: DB, id: string): Row {
  const report = requiredReport(db, id);
  const source = one(db, "SELECT * FROM sources WHERE id=?", report.source_id)!;
  return {
    ...report,
    body: source.content,
    source_filename: source.filename,
    actions: all(
      db,
      "SELECT * FROM report_actions WHERE report_id=? ORDER BY ordinal",
      id,
    ).map((a) => ({
      ...a,
      ...(a.status === "pending"
        ? validateReportAction(db, a)
        : {
            payload: payloadSchema.parse(JSON.parse(a.payload_json)),
            ready: false,
            missing: [],
            warnings: [],
          }),
    })),
    reviews: all(
      db,
      "SELECT * FROM report_reviews WHERE report_id=? ORDER BY rowid",
      id,
    ),
  };
}
export function listReports(db: DB) {
  return all(
    db,
    "SELECT r.*,(SELECT count(*) FROM report_actions a WHERE a.report_id=r.id AND a.status='pending') pending_count FROM national_reports r ORDER BY r.created_at DESC,r.rowid DESC LIMIT 100",
  );
}

/** Deterministic bounded extraction. Unsupported statements remain reviewable archive events. */
export function submitReport(db: DB, input: unknown): Row {
  const data = submitSchema.parse(input);
  const digest = createHash("sha256")
    .update(
      JSON.stringify([data.mode, data.date, data.correction_of, data.body]),
    )
    .digest("hex");
  const existing = one(
    db,
    "SELECT id FROM national_reports WHERE digest=?",
    digest,
  );
  if (existing) return { ...reportDetail(db, existing.id), duplicate: true };
  return transaction(db, () => {
    if (data.correction_of) requiredReport(db, data.correction_of);
    const id = randomUUID(),
      source = createUserSource(db, data.body, "national_report");
    db.prepare(
      "INSERT INTO national_reports(id,source_id,digest,title,mode,effective_date,status,correction_of) VALUES(?,?,?,?,?,?,?,?)",
    ).run(
      id,
      source,
      digest,
      data.title,
      data.mode,
      data.date,
      data.mode === "simulate" ? "scenario" : "review",
      data.correction_of,
    );
    const lines = data.body.split(/\r?\n/);
    let date = data.date,
      ordinal = 0;
    for (let i = 0; i < lines.length; i++) {
      let statement = lines[i].trim();
      if (!statement) continue;
      const prefix = statement.match(/^(\d{4}-\d{2}-\d{2})(?:[.:\s]+|$)(.*)$/);
      if (prefix) {
        if (exactDate.safeParse(prefix[1]).success) date = prefix[1];
        statement = prefix[2].trim();
        if (!statement) continue;
      }
      let kind = "record_event",
        unit: string | null = null,
        location: string | null = null;
      const order =
        statement.match(/^Order\s+(.+?)\s+to\s+(.+?)[.!]?$/i) ??
        statement.match(
          /^(.+?)\s+(?:was|is)\s+ordered\s+(?:to deploy\s+)?to\s+(.+?)[.!]?$/i,
        );
      const arrival =
        statement.match(
          /^(.+?)\s+(?:has\s+)?arrived\s+(?:in|at)\s+(.+?)[.!]?$/i,
        ) ??
        statement.match(
          /^(.+?)\s+completed\s+(?:its\s+)?deployment\s+to\s+(.+?)[.!]?$/i,
        );
      if (order || arrival) {
        const match = (order ?? arrival)!;
        kind = order ? "movement_order" : "movement_arrival";
        const us = candidates(db, "units", match[1]),
          ls = candidates(db, "locations", match[2]);
        if (us.length === 1) unit = us[0].id;
        if (ls.length === 1) location = ls[0].id;
      }
      const payload = {
        statement,
        date,
        unit_id: unit,
        location_id: location,
        movement_id: null,
        override_reason: "",
      };
      db.prepare(
        "INSERT INTO report_actions(id,report_id,ordinal,kind,payload_json,line_start,line_end) VALUES(?,?,?,?,?,?,?)",
      ).run(
        randomUUID(),
        id,
        ordinal++,
        kind,
        JSON.stringify(payload),
        i + 1,
        i + 1,
      );
    }
    if (!ordinal) throw Error("The report contains no statements");
    audit(
      db,
      "submit_report",
      id,
      null,
      { mode: data.mode, source_id: source, actions: ordinal },
      "Original report preserved. Submission does not approve national changes.",
    );
    return { ...reportDetail(db, id), duplicate: false };
  });
}

export function editReportAction(db: DB, input: unknown): Row {
  const data = z
    .object({
      report_id: z.string(),
      action_id: z.string(),
      revision: z.number().int().positive(),
      payload: payloadSchema,
      reason: z.string().trim().min(3).max(2000),
    })
    .parse(input);
  return transaction(db, () => {
    const report = requiredReport(db, data.report_id);
    if (report.revision !== data.revision)
      throw Error("Report changed. Reload the review before editing.");
    const before = one(
      db,
      "SELECT * FROM report_actions WHERE id=? AND report_id=?",
      data.action_id,
      report.id,
    );
    if (!before || before.status !== "pending")
      throw Error("Only a pending action can be corrected");
    db.prepare("UPDATE report_actions SET payload_json=? WHERE id=?").run(
      JSON.stringify(data.payload),
      before.id,
    );
    db.prepare(
      "UPDATE national_reports SET revision=revision+1 WHERE id=?",
    ).run(report.id);
    const after = one(db, "SELECT * FROM report_actions WHERE id=?", before.id);
    db.prepare(
      "INSERT INTO report_reviews(id,report_id,action,reason,before_json,after_json) VALUES(?,?,?,?,?,?)",
    ).run(
      randomUUID(),
      report.id,
      "correct_proposal",
      data.reason,
      JSON.stringify(before),
      JSON.stringify(after),
    );
    audit(db, "edit_report_proposal", report.id, before, after, data.reason);
    return reportDetail(db, report.id);
  });
}

export function approveReport(db: DB, input: unknown): Row {
  const data = z
    .object({
      report_id: z.string(),
      revision: z.number().int().positive(),
      action_ids: z.array(z.string()).min(1).max(1000),
      reject_ids: z.array(z.string()).max(1000).default([]),
      reason: z.string().trim().min(3).max(2000),
    })
    .parse(input);
  return transaction(db, () => {
    const report = requiredReport(db, data.report_id);
    if (report.mode !== "record")
      throw Error(
        "A simulation remains a scenario. Submit an explicit record report to adopt an outcome.",
      );
    if (report.revision !== data.revision)
      throw Error("Report changed. Reload before approval.");
    if (
      new Set([...data.action_ids, ...data.reject_ids]).size !==
      data.action_ids.length + data.reject_ids.length
    )
      throw Error("Each action must have one decision");
    const before = reportDetail(db, report.id);
    for (const id of [...data.action_ids, ...data.reject_ids]) {
      const a = one(
        db,
        "SELECT * FROM report_actions WHERE id=? AND report_id=?",
        id,
        report.id,
      );
      if (!a || a.status !== "pending")
        throw Error("Action is missing or has already been reviewed");
      if (data.reject_ids.includes(id)) {
        db.prepare(
          "UPDATE report_actions SET status='rejected' WHERE id=?",
        ).run(id);
        continue;
      }
      const checked = validateReportAction(db, a);
      if (!checked.ready) throw Error(checked.missing.join(" "));
      const p = checked.payload;
      let target: string;
      if (a.kind === "movement_order")
        target = recordMovement(db, {
          ...p,
          operation: "ordered",
          mission: p.statement,
        }).id;
      else if (a.kind === "movement_arrival") {
        const orders = all(
          db,
          "SELECT id FROM movements WHERE unit_id=? AND location_id=? AND operation='ordered' AND date<=?",
          p.unit_id,
          p.location_id,
          p.date,
        );
        target = p.movement_id ?? orders[0].id;
        completeMovement(db, {
          id: target,
          date: p.date,
          explanation: data.reason,
          override_reason: p.override_reason,
        });
      } else target = a.id;
      const timelineId = "report-event-" + a.id;
      db.prepare(
        "INSERT INTO timeline(id,title,category,date_json,canon,operation,source_id,line_start,line_end,note) VALUES(?,?,?,?,?,?,?,?,?,?)",
      ).run(
        timelineId,
        p.statement,
        a.kind === "record_event" ? "history" : "military",
        JSON.stringify(p.date ? dateValue("day", p.date) : dateValue()),
        "confirmed",
        a.kind === "movement_order"
          ? "ordered"
          : a.kind === "movement_arrival"
            ? "completed"
            : "unknown",
        report.source_id,
        a.line_start,
        a.line_end,
        "Approved report. " +
          (a.kind === "record_event"
            ? "Archive statement only; administrative effects unresolved. "
            : "") +
          data.reason,
      );
      db.prepare(
        "UPDATE report_actions SET status='applied',target_id=? WHERE id=?",
      ).run(target, a.id);
      if (a.kind === "record_event") {
        db.prepare(
          "INSERT OR IGNORE INTO issues(id,kind,priority,category,title,known_state,question) VALUES(?,'missing','LOW','history',?,?,?)",
        ).run(
          "report-detail-" + report.id,
          "Report detail: " + report.title,
          "See the preserved original report and approved archive entries.",
          "Administrative effects have not been extracted. Add supported structured records when needed; no answer is required now.",
        );
      }
    }
    const remaining = one(
      db,
      "SELECT count(*) n FROM report_actions WHERE report_id=? AND status='pending'",
      report.id,
    )!.n;
    db.prepare(
      "UPDATE national_reports SET status=?,revision=revision+1 WHERE id=?",
    ).run(remaining ? "partially_applied" : "applied", report.id);
    const after = reportDetail(db, report.id);
    db.prepare(
      "INSERT INTO report_reviews(id,report_id,action,reason,before_json,after_json) VALUES(?,?,?,?,?,?)",
    ).run(
      randomUUID(),
      report.id,
      "approve_selected",
      data.reason,
      JSON.stringify({ ...before, body: undefined, reviews: undefined }),
      JSON.stringify({ ...after, body: undefined, reviews: undefined }),
    );
    audit(
      db,
      "approve_report",
      report.id,
      { revision: report.revision },
      {
        revision: after.revision,
        applied: data.action_ids,
        rejected: data.reject_ids,
      },
      data.reason,
    );
    return reportDetail(db, report.id);
  });
}
