import { openDatabase } from "../src/lib/db.ts";
const db = openDatabase();
console.log("Database migrations applied");
db.close();
