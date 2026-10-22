import { z } from "zod";
import { one } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { createUserSource } from "./canon.ts";

export function recordEvidence(db: DB, input: Row) {
  if (input.source_id) {
    const source = one(
      db,
      "SELECT * FROM sources WHERE id=?",
      z.string().parse(input.source_id),
    );
    if (!source) throw Error("Source no longer exists");
    const start = z.coerce.number().int().positive().parse(input.line_start),
      end = z.coerce.number().int().positive().parse(input.line_end);
    if (end < start || end > source.content.split(/\r?\n/).length)
      throw Error("Check the cited source line range");
    return { source_id: source.id as string, line_start: start, line_end: end };
  }
  const original = z
    .string()
    .min(1)
    .max(20000)
    .refine((s) => !!s.trim(), "Supply original evidence")
    .parse(input.source_text);
  return {
    source_id: createUserSource(db, original),
    line_start: 1,
    line_end: original.split(/\r?\n/).length,
  };
}
