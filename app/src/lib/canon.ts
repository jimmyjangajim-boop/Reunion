import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { all, one, transaction, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import {
  bounds,
  historicalDateSchema,
  intersects,
  exactDate,
  dateValue,
} from "./dates.ts";
export const canonStates = [
  "confirmed",
  "provisional",
  "disputed",
  "superseded",
  "rejected",
  "unknown",
] as const;
export const operations = [
  "unknown",
  "proposal",
  "planned",
  "approved",
  "ordered",
  "contracted",
  "in production",
  "delivered",
  "accepted",
  "operational",
  "completed",
  "canceled",
  "simulated",
  "damaged",
  "under repair",
  "retired",
  "lost",
] as const;
export const categories = [
  "political",
  "military",
  "economic",
  "diplomatic",
  "domestic",
  "territory",
  "constitutional",
  "history",
] as const;
export const assertionSchema = z
  .object({
    entity_id: z.string().min(1),
    predicate: z.string().trim().min(1).max(150),
    value: z.string().trim().min(1).max(20000),
    category: z.enum(categories),
    canon: z.enum(canonStates).default("provisional"),
    operation: z.enum(operations).default("unknown"),
    confidence: z.string().max(300).default("unspecified"),
    date: historicalDateSchema,
    scope: z.enum(["point", "interval", "undated"]).default("point"),
    notes: z.string().max(10000).default(""),
    source_id: z.string().min(1),
    line_start: z.coerce.number().int().positive(),
    line_end: z.coerce.number().int().positive(),
  })
  .superRefine((v, c) => {
    if (v.line_end < v.line_start)
      c.addIssue({ code: "custom", message: "Source lines are reversed" });
    if (v.operation === "simulated" && v.canon === "confirmed")
      c.addIssue({
        code: "custom",
        message:
          "A simulation cannot be confirmed canon. Create an approved event instead.",
      });
    if (v.scope === "interval" && !v.date.earliest)
      c.addIssue({
        code: "custom",
        message:
          "An interval needs an explicit earliest validity date. Use point or undated for an observation.",
      });
  });
export function addAssertion(
  db: DB,
  input: unknown,
  id: string = randomUUID(),
  batch: string | null = null,
): string {
  const a = assertionSchema.parse(input);
  if (!one(db, "SELECT id FROM entities WHERE id=?", a.entity_id))
    throw Error("Choose an existing entity");
  const source = one(db, "SELECT * FROM sources WHERE id=?", a.source_id);
  if (!source) throw Error("Source not found");
  const lines = source.content.split(/\r?\n/);
  if (a.line_end > lines.length)
    throw Error("Source line is outside the document");
  const [lo, hi] = bounds(a.date);
  // Open intervals require the author to explicitly supply a start; point observations never carry forward.
  const start = a.scope === "undated" ? null : lo;
  const end =
    a.scope === "undated"
      ? null
      : a.scope === "interval"
        ? a.date.latest
          ? hi
          : null
        : hi;
  db.prepare(
    "INSERT OR IGNORE INTO assertions(id,entity_id,predicate,value,category,canon,operation,confidence,date_json,valid_from,valid_to,scope,notes,batch_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  ).run(
    id,
    a.entity_id,
    a.predicate,
    a.value,
    a.category,
    a.canon,
    a.operation,
    a.confidence,
    JSON.stringify(a.date),
    start,
    end,
    a.scope,
    a.notes,
    batch ?? source.batch_id ?? null,
  );
  db.prepare(
    "INSERT OR IGNORE INTO evidence(assertion_id,source_id,line_start,line_end,excerpt) VALUES(?,?,?,?,?)",
  ).run(
    id,
    a.source_id,
    a.line_start,
    a.line_end,
    lines.slice(a.line_start - 1, a.line_end).join("\n"),
  );
  return id;
}
export function assertionRows(db: DB, where = "1=1", ...args: any[]): Row[] {
  return all(
    db,
    `SELECT a.*,e.name entity_name,e.kind entity_kind,COALESCE((SELECT MIN(s.tier) FROM evidence ev JOIN sources s ON s.id=ev.source_id WHERE ev.assertion_id=a.id),6) tier FROM assertions a JOIN entities e ON e.id=a.entity_id WHERE ${where} ORDER BY a.recorded_at DESC,a.id`,
    ...args,
  );
}
export function evidenceFor(db: DB, id: string): Row[] {
  return all(
    db,
    "SELECT e.*,s.filename,s.tier FROM evidence e JOIN sources s ON s.id=e.source_id WHERE assertion_id=?",
    id,
  );
}
export function snapshot(db: DB, date: string): Row[] {
  exactDate.parse(date);
  const rows = assertionRows(
    db,
    "a.canon IN ('confirmed','disputed') AND a.operation NOT IN ('proposal','planned','ordered','contracted','in production','simulated','canceled') AND a.valid_from IS NOT NULL AND a.valid_from<=? AND COALESCE(a.valid_to,'9999-12-31')>=?",
    date,
    date,
  );
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const k = row.entity_id + "|" + row.predicate;
    groups.set(k, [...(groups.get(k) ?? []), row]);
  }
  return [...groups.values()].map((group) => {
    const tier = Math.min(...group.map((r) => r.tier));
    const best = group.filter((r) => r.tier === tier);
    const conflict =
      new Set(best.map((r) => r.value)).size > 1 ||
      best.some((r) => r.canon === "disputed");
    return {
      ...best[0],
      canon: conflict ? "disputed" : best[0].canon,
      alternatives: conflict ? best : [],
      evidence: evidenceFor(db, best[0].id),
    };
  });
}
export function detectIssues(db: DB): number {
  let added = 0;
  const rows = assertionRows(
    db,
    "a.canon IN ('confirmed','provisional','disputed') AND a.operation NOT IN ('proposal','planned','simulated','canceled')",
  );
  const insert = db.prepare(
    "INSERT OR IGNORE INTO issues(id,fingerprint,kind,priority,category,title,known_state,question,a_id,b_id) VALUES(?,?,?,?,?,?,?,?,?,?)",
  );
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    if (!a.valid_from) {
      const f = "date:" + a.id;
      added += Number(
        insert.run(
          "AUTO-" + createHash("sha256").update(f).digest("hex").slice(0, 16),
          f,
          "missing",
          "MEDIUM",
          a.category,
          `Missing date: ${a.entity_name} · ${a.predicate}`,
          a.value,
          "Supply an exact, approximate or explicitly unknown date.",
          a.id,
          null,
        ).changes,
      );
    }
    for (let j = i + 1; j < rows.length; j++) {
      const b = rows[j];
      if (
        a.entity_id === b.entity_id &&
        a.predicate === b.predicate &&
        a.value !== b.value &&
        intersects(a as any, b as any)
      ) {
        const f = "conflict:" + [a.id, b.id].sort().join(":");
        added += Number(
          insert.run(
            "AUTO-" + createHash("sha256").update(f).digest("hex").slice(0, 16),
            f,
            "conflict",
            "HIGH",
            a.category,
            `${a.entity_name} · ${a.predicate}`,
            `${a.value} / ${b.value}`,
            "Compare source excerpts and dates before resolving.",
            a.id,
            b.id,
          ).changes,
        );
      }
    }
  }
  // Missing metadata is reviewable without blocking routine administration.
  const gap = (
    fingerprint: string,
    category: string,
    title: string,
    known: string,
    question: string,
    kind = "missing",
  ) => {
    added += Number(
      insert.run(
        "AUTO-" +
          createHash("sha256").update(fingerprint).digest("hex").slice(0, 16),
        fingerprint,
        kind,
        "MEDIUM",
        category,
        title,
        known,
        question,
        null,
        null,
      ).changes,
    );
  };
  for (const a of rows)
    if (a.tier >= 5)
      gap(
        "primary:" + a.id,
        a.category,
        `Primary source needed: ${a.entity_name} · ${a.predicate}`,
        a.value,
        "Recover an original transcript or corroborating primary document.",
      );
  for (const u of all(db, "SELECT * FROM units")) {
    const st = one(
      db,
      "SELECT * FROM unit_states WHERE unit_id=? ORDER BY date DESC LIMIT 1",
      u.id,
    );
    for (const [field, label] of [
      ["commander", "commander"],
      ["garrison", "home garrison"],
      ["personnel_low", "personnel strength"],
      ["authorized", "authorized strength"],
      ["readiness", "readiness"],
      ["supply", "supply status"],
    ])
      if (st?.[field] === null || st?.[field] === undefined)
        gap(
          "unit-gap:" + u.id + ":" + field,
          "military",
          `Missing ${label}: ${u.name}`,
          "Not supplied in the dated unit record.",
          "Add a sourced observation; do not infer from other formations.",
        );
  }
  for (const c of all(db, "SELECT * FROM chambers")) {
    const n = one(
      db,
      "SELECT COALESCE(SUM(seats),0) n FROM party_seats WHERE chamber_id=?",
      c.id,
    )!.n;
    if (n !== c.actual_seats)
      gap(
        "party-total:" + c.id,
        "political",
        "Parliamentary party total mismatch",
        `${n} listed seats; ${c.actual_seats} in practice`,
        "Resolve missing or overlapping party totals.",
        "conflict",
      );
  }
  return added;
}
export const resolutionSchema = z.object({
  issue_id: z.string(),
  action: z.enum([
    "accept_a",
    "accept_b",
    "merge",
    "replace",
    "different_contexts",
    "unresolved",
    "dismiss",
    "postpone",
    "answer",
  ]),
  explanation: z.string().trim().min(3).max(10000),
  value: z.string().max(20000).optional(),
  date: historicalDateSchema.optional(),
  date_b: historicalDateSchema.optional(),
  contexts: z.string().max(10000).optional(),
});
export function resolveIssue(db: DB, input: unknown) {
  const data = resolutionSchema.parse(input);
  return transaction(db, () => {
    const issue = one(db, "SELECT * FROM issues WHERE id=?", data.issue_id);
    if (!issue) throw Error("Issue not found");
    const linked = [issue.a_id, issue.b_id]
      .filter(Boolean)
      .map((id) => one(db, "SELECT * FROM assertions WHERE id=?", id))
      .filter(Boolean) as Row[];
    const before = { issue, assertions: linked };
    let newId: string | null = null;
    if (["accept_a", "accept_b"].includes(data.action)) {
      const chosen = data.action === "accept_a" ? issue.a_id : issue.b_id;
      if (!chosen) throw Error("No competing record is linked to this side");
      const record = one(db, "SELECT * FROM assertions WHERE id=?", chosen)!;
      if (
        ["simulated", "proposal", "planned", "ordered", "contracted"].includes(
          record.operation,
        )
      )
        throw Error(
          "Resolve operational status through an approved event; selection cannot turn a plan into a fact",
        );
      db.prepare("UPDATE assertions SET canon='confirmed' WHERE id=?").run(
        chosen,
      );
      for (const r of linked)
        if (r.id !== chosen)
          db.prepare(
            "UPDATE assertions SET canon='superseded',superseded_by=? WHERE id=?",
          ).run(chosen, r.id);
    }
    if (
      ["merge", "replace", "answer", "different_contexts"].includes(data.action)
    ) {
      if (!data.value?.trim() && data.action !== "different_contexts")
        throw Error("Enter the approved fact or an explicit Unknown");
      if (
        data.action === "different_contexts" &&
        (!data.contexts || !data.date || !data.date_b || linked.length !== 2)
      )
        throw Error(
          "Provide two validity dates and explain the separate contexts",
        );
      const src = createUserSource(
        db,
        `Review ${issue.id}\n${data.value ?? data.contexts}\n${data.explanation}`,
        data.action,
      );
      const selected =
        data.action === "different_contexts" ? linked : [linked[0] ?? null];
      selected.forEach((old, index) => {
        const entity = old?.entity_id ?? "reunion";
        const date =
          index === 1
            ? data.date_b!
            : (data.date ?? (old ? JSON.parse(old.date_json) : dateValue()));
        const nid = addAssertion(db, {
          entity_id: entity,
          predicate: old?.predicate ?? issue.title,
          value:
            data.action === "different_contexts" ? old!.value : data.value!,
          category: old?.category ?? "history",
          canon: "confirmed",
          operation:
            old?.operation === "simulated"
              ? "unknown"
              : (old?.operation ?? "unknown"),
          confidence: "user decision",
          date,
          scope: "point",
          notes: data.explanation + (data.contexts ? "\n" + data.contexts : ""),
          source_id: src,
          line_start: 1,
          line_end: 3,
        });
        newId = nid;
        if (old)
          db.prepare(
            "UPDATE assertions SET canon='superseded',superseded_by=? WHERE id=?",
          ).run(nid, old.id);
      });
      if (data.action !== "different_contexts")
        for (const old of linked)
          db.prepare(
            "UPDATE assertions SET canon='superseded',superseded_by=? WHERE id=?",
          ).run(newId, old.id);
    }
    const state =
      data.action === "postpone"
        ? "postponed"
        : data.action === "unresolved"
          ? "open"
          : data.action === "dismiss"
            ? "dismissed"
            : "resolved";
    db.prepare(
      "UPDATE issues SET state=?,answer=?,postponed_until=? WHERE id=?",
    ).run(
      state,
      data.value ?? null,
      data.action === "postpone"
        ? new Date(Date.now() + 7 * 86400000).toISOString()
        : null,
      issue.id,
    );
    const after = {
      issue: one(db, "SELECT * FROM issues WHERE id=?", issue.id),
      assertions: linked.map((a) =>
        one(db, "SELECT * FROM assertions WHERE id=?", a.id),
      ),
      newId,
    };
    db.prepare(
      "INSERT INTO decisions(id,issue_id,action,explanation,before_json,after_json) VALUES(?,?,?,?,?,?)",
    ).run(
      randomUUID(),
      issue.id,
      data.action,
      data.explanation,
      JSON.stringify(before),
      JSON.stringify(after),
    );
    audit(db, "review", issue.id, before, after, data.explanation);
    return after;
  });
}
export function createUserSource(
  db: DB,
  text: string,
  kind = "user_entry",
): string {
  const id = randomUUID();
  db.prepare(
    "INSERT INTO sources(id,path,filename,sha256,bytes,content,tier,kind) VALUES(?,?,?,?,?,?,?,?)",
  ).run(
    id,
    "user/" + id + ".txt",
    "User decision " + new Date().toISOString(),
    createHash("sha256").update(text).digest("hex"),
    Buffer.byteLength(text),
    text,
    1,
    kind,
  );
  indexSource(db, id, text);
  return id;
}
export function indexSource(db: DB, id: string, content: string) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 45) {
    const text = lines.slice(i, i + 50).join("\n"),
      end = Math.min(i + 50, lines.length);
    const r = db
      .prepare(
        "INSERT OR IGNORE INTO chunks(source_id,line_start,line_end,text) VALUES(?,?,?,?)",
      )
      .run(id, i + 1, end, text);
    if (r.changes)
      db.prepare(
        "INSERT INTO source_fts(text,source_id,line_start,line_end) VALUES(?,?,?,?)",
      ).run(text, id, i + 1, end);
  }
}
export function search(db: DB, q: string) {
  if (!q.trim()) return [];
  const terms = q.match(/[\p{L}\p{N}_-]+/gu)?.slice(0, 12) ?? [];
  if (!terms.length) return [];
  const match = terms
    .map((s) => '"' + s.replace(/"/g, '""') + '"')
    .join(" AND ");
  return all(
    db,
    "SELECT f.source_id,f.line_start,f.line_end,s.filename,s.tier,s.kind,snippet(source_fts,0,'⟦','⟧','…',45) excerpt FROM source_fts f JOIN sources s ON s.id=f.source_id WHERE source_fts MATCH ? ORDER BY rank LIMIT 80",
    match,
  );
}
