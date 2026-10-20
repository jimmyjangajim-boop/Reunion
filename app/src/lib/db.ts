import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
export type Row = Record<string, any>;
export type DB = DatabaseSync;
export function openDatabase(
  filename = process.env.RNAS_DB ?? path.resolve("data/reunion.sqlite"),
): DB {
  if (filename !== ":memory:")
    mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
  );
  migrate(db);
  return db;
}
export function migrate(db: DB) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)",
  );
  for (const file of readdirSync(path.resolve("migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const version = Number(file.split("_")[0]);
    if (!db.prepare("SELECT 1 FROM migrations WHERE version=?").get(version))
      transaction(db, () => {
        db.exec(readFileSync(path.resolve("migrations", file), "utf8"));
        db.prepare("INSERT INTO migrations VALUES(?,?)").run(
          version,
          new Date().toISOString(),
        );
      });
  }
}
export function all<T = Row>(db: DB, sql: string, ...args: any[]): T[] {
  return db.prepare(sql).all(...args) as T[];
}
export function one<T = Row>(
  db: DB,
  sql: string,
  ...args: any[]
): T | undefined {
  return db.prepare(sql).get(...args) as T | undefined;
}
export function transaction<T>(db: DB, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = fn();
    db.exec("COMMIT");
    return r;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function audit(
  db: DB,
  action: string,
  target: string,
  before: any,
  after: any,
  explanation: string,
) {
  db.prepare(
    "INSERT INTO audit(action,target,before_json,after_json,explanation) VALUES(?,?,?,?,?)",
  ).run(
    action,
    target,
    JSON.stringify(before ?? null),
    JSON.stringify(after ?? null),
    explanation,
  );
}
let singleton: DB | undefined;
export function getDb(): DB {
  return (singleton ??= openDatabase());
}
