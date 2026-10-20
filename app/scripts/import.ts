import { openDatabase } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
const db = openDatabase();
console.log(importRecovery(db, process.argv[2]));
db.close();
