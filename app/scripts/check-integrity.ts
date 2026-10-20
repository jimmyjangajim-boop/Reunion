import { DatabaseSync } from "node:sqlite";
import { readdirSync } from "node:fs";
import path from "node:path";
const filename = process.env.RNAS_DB ?? path.resolve("data/reunion.sqlite");
const db = new DatabaseSync(filename, { readOnly: true });
try {
  if (db.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok")
    throw Error("SQLite integrity check failed");
  if (db.prepare("PRAGMA foreign_key_check").all().length)
    throw Error("Foreign key check failed");
  const expected = readdirSync("migrations")
    .filter((f) => f.endsWith(".sql"))
    .map((f) => Number(f.split("_")[0]))
    .sort((a, b) => a - b);
  const actual = db
    .prepare("SELECT version FROM migrations ORDER BY version")
    .all()
    .map((r) => r.version);
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    throw Error(
      "Applied migration versions differ from the code. Run setup before starting.",
    );
  console.log(
    JSON.stringify({
      database: filename,
      integrity: "ok",
      foreign_keys: "ok",
      migrations: actual,
      reports: db.prepare("SELECT count(*) n FROM national_reports").get()?.n,
    }),
  );
} finally {
  db.close();
}
