import { openDatabase } from "../src/lib/db.ts";
import { reconcileProjectTracker } from "../src/lib/project-reconciliation.ts";
const db = openDatabase();
try {
  console.log(
    JSON.stringify(
      reconcileProjectTracker(db, process.argv.includes("--apply")),
      null,
      2,
    ),
  );
} finally {
  db.close();
}
