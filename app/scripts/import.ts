import { openDatabase } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { correctReviewedAltisYears } from "../src/lib/chronology.ts";
const db = openDatabase();
console.log(importRecovery(db, process.argv[2]));
console.log(importReviewedCanon(db));
console.log(correctReviewedAltisYears(db));
db.close();
