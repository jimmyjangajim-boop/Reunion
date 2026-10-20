import { backup } from "node:sqlite";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getDb } from "../../../lib/db.ts";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const temp = mkdtempSync(path.join(tmpdir(), "rnas-backup-"));
  try {
    const file = path.join(temp, "reunion.sqlite");
    await backup(getDb(), file);
    return new Response(readFileSync(file), {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": 'attachment; filename="reunion-backup.sqlite"',
        "Cache-Control": "no-store",
      },
    });
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
