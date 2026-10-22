import { randomUUID } from "node:crypto";
import { z } from "zod";
import { one, transaction, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { addAssertion, createUserSource, detectIssues } from "./canon.ts";
import { historicalDateSchema } from "./dates.ts";

/** Validated explicit user entry; owns its transaction and audit. */
export function createEntity(db: DB, data: Row) {
  return transaction(db, () => {
    const e = z
      .object({
        name: z.string().trim().min(1).max(200),
        kind: z.string().min(1).max(100),
        description: z.string().max(5000).default(""),
      })
      .parse(data);
    const id = randomUUID();
    db.prepare(
      "INSERT INTO entities(id,name,kind,description) VALUES(?,?,?,?)",
    ).run(id, e.name, e.kind, e.description);
    audit(
      db,
      "create_entity",
      id,
      null,
      e,
      "User entered entity; no inferred facts.",
    );
    return { id };
  });
}

/** Validated explicit user entry; owns its transaction and audit. */
export function createSourcedAssertion(db: DB, data: Row) {
  return transaction(db, () => {
    const source =
      data.source_id ||
      createUserSource(db, z.string().trim().min(3).parse(data.source_text));
    const id = addAssertion(db, {
      ...data,
      source_id: source,
      line_start: data.source_id ? data.line_start : 1,
      line_end: data.source_id ? data.line_end : 1,
    });
    audit(db, "add_assertion", id, null, data, "Explicit user entry");
    detectIssues(db);
    return { id };
  });
}

/** Validated explicit user entry; owns its transaction and audit. */
export function createTimelineEntry(db: DB, data: Row) {
  return transaction(db, () => {
    const e = z
      .object({
        title: z.string().trim().min(3),
        category: z.string().min(1),
        date: historicalDateSchema,
        canon: z.enum(["confirmed", "provisional", "disputed"]),
        source_id: z.string().min(1),
        line_start: z.coerce.number().int().positive(),
        line_end: z.coerce.number().int().positive(),
      })
      .parse(data);
    const src = one(db, "SELECT * FROM sources WHERE id=?", e.source_id);
    if (
      !src ||
      e.line_start > e.line_end ||
      e.line_end > src.content.split("\n").length
    )
      throw Error("Check source and line range");
    const id = randomUUID();
    db.prepare(
      "INSERT INTO timeline(id,title,category,date_json,canon,source_id,line_start,line_end) VALUES(?,?,?,?,?,?,?,?)",
    ).run(
      id,
      e.title,
      e.category,
      JSON.stringify(e.date),
      e.canon,
      e.source_id,
      e.line_start,
      e.line_end,
    );
    audit(db, "timeline_entry", id, null, e, "User timeline entry");
    return { id };
  });
}
