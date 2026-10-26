import { all, one } from "./db.ts";
import type { DB } from "./db.ts";

/** A backdated observation remains effective until this unit's next observation. */
export function validateUnitParent(
  db: DB,
  unit: string,
  parent: string | null,
  date: string,
) {
  if (
    one(db, "SELECT 1 FROM unit_states WHERE unit_id=? AND date=?", unit, date)
  )
    throw Error(
      "A unit observation already exists on this date; preserve it and review a correction.",
    );
  if (!parent) return;
  const next = one(
    db,
    "SELECT MIN(date) date FROM unit_states WHERE unit_id=? AND date>?",
    unit,
    date,
  )?.date;
  const dates = new Set([
    date,
    ...all(
      db,
      "SELECT DISTINCT date FROM unit_states WHERE date>? AND (? IS NULL OR date<?)",
      date,
      next ?? null,
      next ?? null,
    ).map((r) => r.date as string),
  ]);
  for (const at of dates) {
    let cursor: string | null = parent;
    const seen = new Set([unit]);
    while (cursor) {
      if (seen.has(cursor))
        throw Error("Chain of command would contain a cycle on " + at);
      seen.add(cursor);
      cursor =
        one(
          db,
          "SELECT parent_id FROM unit_states WHERE unit_id=? AND date<=? ORDER BY date DESC LIMIT 1",
          cursor,
          at,
        )?.parent_id ?? null;
    }
  }
}
