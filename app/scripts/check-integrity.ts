import { DatabaseSync } from "node:sqlite";
import { verifyDatabase } from "../src/lib/database-validation.ts";
import path from "node:path";
const filename = process.env.RNAS_DB ?? path.resolve("data/reunion.sqlite");
const db = new DatabaseSync(filename, { readOnly: true });
try {
  const actual = verifyDatabase(db);
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
