import { DatabaseSync, backup } from "node:sqlite";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
const file = process.argv[2];
if (!file || process.argv[3] !== "--confirm")
  throw Error(
    "Stop the server. Usage: npm run restore -- /absolute/backup.sqlite --confirm",
  );
const target = process.env.RNAS_DB ?? path.resolve("data/reunion.sqlite");
if (path.resolve(file) === path.resolve(target))
  throw Error("Backup and destination must differ");
const source = new DatabaseSync(file, { readOnly: true });
if (source.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok")
  throw Error("Backup integrity check failed");
for (const table of ["assertions", "sources", "migrations"])
  source.prepare(`SELECT count(*) FROM ${table}`).get();
mkdirSync(path.dirname(target), { recursive: true });
if (existsSync(target)) {
  const current = new DatabaseSync(target);
  await backup(current, target + ".before-restore");
  current.close();
}
await backup(source, target);
source.close();
console.log(
  "Restored verified database. Previous database saved as .before-restore. Originals remain in evidence/.",
);
