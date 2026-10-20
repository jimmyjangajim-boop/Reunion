import { openDatabase } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
const db = openDatabase();
console.log(importRecovery(db, process.argv[2]));
console.log(importReviewedCanon(db));
db.close();
