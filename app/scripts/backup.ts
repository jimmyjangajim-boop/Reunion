import { backup } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { openDatabase, one } from "../src/lib/db.ts";
const filename =
  process.argv[2] ??
  path.resolve(
    "backups",
    "reunion-" + new Date().toISOString().replace(/[:.]/g, "-") + ".sqlite",
  );
mkdirSync(path.dirname(filename), { recursive: true });
const db = openDatabase();
await backup(db, filename);
console.log("Database backup:", filename);
db.close();
