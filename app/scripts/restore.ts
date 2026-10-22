import { DatabaseSync, backup } from "node:sqlite";
import path from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { verifyDatabase } from "../src/lib/database-validation.ts";
const file = process.argv[2];
if (!file || process.argv[3] !== "--confirm")
  throw Error(
    "Stop the server. Usage: npm run restore -- /absolute/backup.sqlite --confirm",
  );
const target = process.env.RNAS_DB ?? path.resolve("data/reunion.sqlite");
if (path.resolve(file) === path.resolve(target))
  throw Error("Backup and destination must differ");
const source = new DatabaseSync(file, { readOnly: true });
try {
  verifyDatabase(source);
  mkdirSync(path.dirname(target), { recursive: true });
  if (existsSync(target)) {
    const current = new DatabaseSync(target);
    await backup(current, target + ".before-restore");
    current.close();
  }
  await backup(source, target);
  source.close();
} catch (error) {
  source.close();
  throw error;
}
console.log(
  "Restored verified database. Previous database saved as .before-restore. Originals remain in evidence/.",
);
