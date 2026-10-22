import type { DatabaseSync } from "node:sqlite";
import { readdirSync } from "node:fs";
import path from "node:path";

/** Read-only verification: never open through the migrating application adapter. */
export function verifyDatabase(db: DatabaseSync) {
  const integrity = db.prepare("PRAGMA integrity_check").all();
  if (integrity.length !== 1 || integrity[0].integrity_check !== "ok")
    throw Error("SQLite integrity check failed");
  if (db.prepare("PRAGMA foreign_key_check").all().length)
    throw Error("Foreign key check failed");
  const expected = readdirSync(path.resolve("migrations"))
    .filter((f) => f.endsWith(".sql"))
    .map((f) => Number(f.split("_")[0]))
    .sort((a, b) => a - b);
  const actual = db
    .prepare("SELECT version FROM migrations ORDER BY version")
    .all()
    .map((r) => r.version);
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw Error(
      "Backup migration versions differ from this code. Use matching code and migrate an isolated copy first.",
    );
  for (const table of ["assertions", "sources", "national_reports"])
    db.prepare(`SELECT count(*) FROM ${table}`).get();
  return actual;
}
