import { backup } from "node:sqlite";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { openDatabase } from "../src/lib/db.ts";
import { pythonCommand } from "../src/lib/python.ts";
const output = path.resolve(
  process.argv[2] ??
    path.join(
      "backups",
      "reunion-portable-" +
        new Date().toISOString().replace(/[:.]/g, "-") +
        ".zip",
    ),
);
const temp = mkdtempSync(path.join(tmpdir(), "rnas-portable-"));
const db = openDatabase();
try {
  mkdirSync(path.dirname(output), { recursive: true });
  const snapshot = path.join(temp, "reunion.sqlite");
  await backup(db, snapshot);
  const result = spawnSync(
    pythonCommand(),
    ["scripts/package-backup.py", snapshot, path.resolve("evidence"), output],
    { stdio: "inherit" },
  );
  if (result.status !== 0)
    throw Error(
      "Portable backup failed: " +
        (result.error?.message ?? "check Python output"),
    );
  console.log("Portable database and evidence backup:", output);
} finally {
  db.close();
  rmSync(temp, { recursive: true, force: true });
}
