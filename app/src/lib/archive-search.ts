import { z } from "zod";
import { all, one } from "./db.ts";
import type { DB } from "./db.ts";
/** Read-only paginated source search. Match expressions never accept raw FTS syntax. */
export function searchArchiveText(db: DB, input: unknown) {
  const data = z
    .object({
      query: z.string().max(2000).default(""),
      source: z.string().max(500).nullable().default(null),
      page: z.coerce.number().int().min(1).max(100000).default(1),
      size: z.coerce.number().int().min(1).max(100).default(25),
    })
    .parse(input);
  const terms = data.query.match(/[\p{L}\p{N}_-]+/gu)?.slice(0, 12) ?? [];
  if (!terms.length)
    return { rows: [], total: 0, page: 1, pages: 1, size: data.size };
  const match = terms
    .map((s) => '"' + s.replaceAll('"', '""') + '"')
    .join(" AND ");
  const where =
    "source_fts MATCH ?" + (data.source ? " AND f.source_id=?" : "");
  const args = data.source ? [match, data.source] : [match];
  const total = Number(
      one(db, `SELECT count(*) n FROM source_fts f WHERE ${where}`, ...args)!.n,
    ),
    pages = Math.max(1, Math.ceil(total / data.size)),
    page = Math.min(data.page, pages);
  const rows = all(
    db,
    `SELECT f.rowid id,f.source_id,f.line_start,f.line_end,s.filename,s.tier,s.kind,snippet(source_fts,0,'⟦','⟧','…',45) excerpt FROM source_fts f JOIN sources s ON s.id=f.source_id WHERE ${where} ORDER BY rank,f.source_id,f.line_start,f.rowid LIMIT ? OFFSET ?`,
    ...args,
    data.size,
    (page - 1) * data.size,
  );
  return { rows, total, page, pages, size: data.size };
}
