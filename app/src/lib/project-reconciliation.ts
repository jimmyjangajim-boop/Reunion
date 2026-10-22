import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { one, transaction, audit, type DB } from "./db.ts";
import { dateValue } from "./dates.ts";

const root = path.resolve("evidence/project-reconciliation-2026-10-22");
const action = "reconcile_project_tracker";
const target = "project-tracker-2026-10-22";
const digest = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
/** Explicit, bounded repair of the stale recovery projection. Never replaces later edits. */
export function reconcileProjectTracker(db: DB, apply = false) {
  const bytes = readFileSync(path.join(root, "projects.json"));
  const checksums = JSON.parse(
    readFileSync(path.join(root, "SHA256SUMS.json"), "utf8"),
  );
  if (digest(bytes) !== checksums["projects.json"])
    throw Error("Project reconciliation checksum mismatch");
  const data = JSON.parse(bytes.toString("utf8"));
  if (
    data.format !== "rnas-project-reconciliation-v1" ||
    data.rows.length !== 7
  )
    throw Error("Unsupported project reconciliation");
  const original = readFileSync(path.resolve(data.original_path));
  const artifact = one(
    db,
    "SELECT * FROM source_artifacts WHERE source_id=?",
    data.source_id,
  );
  const source = one(
    db,
    "SELECT content FROM sources WHERE id=?",
    data.source_id,
  );
  if (
    !source ||
    !artifact ||
    artifact.original_sha256 !== data.original_sha256 ||
    digest(original) !== data.original_sha256
  )
    throw Error(
      "Verified reviewed tracker source is required before project reconciliation",
    );
  if (
    one(db, "SELECT id FROM audit WHERE action=? AND target=?", action, target)
  )
    return { duplicate: true, applied: false, changes: [] };
  const changes = data.rows.map((r: any) => {
    const line = source.content.split(/\r?\n/)[r.source_line - 1];
    const cell = (column: string) =>
      line
        ?.split(" | ")
        .find((part: string) => part.startsWith(`${column}${r.row}=`))
        ?.split("=")
        .slice(1)
        .join("=");
    if (
      ![r.planned, r.paid, r.committed, r.monthly_execution].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      cell("A") !== r.name ||
      [
        ["B", r.planned],
        ["C", r.paid],
        ["D", r.committed],
        ["G", r.monthly_execution],
      ].some(([col, n]) => Number(cell(String(col))) * 1e9 !== n)
    )
      throw Error(
        "Project row differs from preserved tracker evidence: " + r.id,
      );
    const before = one(db, "SELECT * FROM projects WHERE id=?", r.id) ?? null;
    if (JSON.stringify(before) !== JSON.stringify(r.before))
      throw Error(
        "Project changed since the reviewed baseline; reconcile manually: " +
          r.id,
      );
    if (
      !before &&
      one(db, "SELECT id FROM projects WHERE lower(name)=lower(?)", r.name)
    )
      throw Error("Duplicate project identity requires review: " + r.name);
    const after = {
      id: r.id,
      name: r.name,
      operation: before?.operation ?? "unknown",
      date_json: JSON.stringify(dateValue("day", data.as_of)),
      planned: r.planned,
      approved: before?.approved ?? null,
      paid: r.paid,
      committed: r.committed,
      currency: "USD",
      notes: `Tracker snapshot, Projects!A${r.row}:N${r.row}; source line ${r.source_line}. Total cost, source-reported paid and remaining committed funding are separate. Monthly execution input: USD ${r.monthly_execution.toLocaleString("en")}; this is a planning assumption, not verified performance. Funding coverage is not completion or legal appropriation.${r.id === "national-oil-drilling" ? " Oil remains at survey stage; the project name and funding do not establish production or revenue." : ""}${r.id === "rail" ? " Workbook J6 incorrectly references the energy row; its ETA is not imported." : ""}`,
      source_id: data.source_id,
    };
    return { before, after };
  });
  if (!apply) return { duplicate: false, applied: false, changes };
  return transaction(db, () => {
    // Check again inside the write transaction, so a stale preview never overwrites an edit.
    for (const { before, after } of changes) {
      if (
        JSON.stringify(
          one(db, "SELECT * FROM projects WHERE id=?", after.id) ?? null,
        ) !== JSON.stringify(before)
      )
        throw Error("Project changed during reconciliation");
      if (before)
        db.prepare(
          "UPDATE projects SET name=?,operation=?,date_json=?,planned=?,approved=?,paid=?,committed=?,currency=?,notes=?,source_id=? WHERE id=?",
        ).run(
          after.name,
          after.operation,
          after.date_json,
          after.planned,
          after.approved,
          after.paid,
          after.committed,
          after.currency,
          after.notes,
          after.source_id,
          after.id,
        );
      else
        db.prepare(
          "INSERT INTO projects(id,name,operation,date_json,planned,approved,paid,committed,currency,notes,source_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          after.id,
          after.name,
          after.operation,
          after.date_json,
          after.planned,
          after.approved,
          after.paid,
          after.committed,
          after.currency,
          after.notes,
          after.source_id,
        );
      audit(
        db,
        "reconcile_project",
        after.id,
        before,
        after,
        "User requested comparison and correction against the supplied tracker, 22 October 2026. Preserve the prior source snapshot here; do not change national budget, canon or cash ledger.",
      );
    }
    audit(
      db,
      action,
      target,
      null,
      {
        source_id: data.source_id,
        original_sha256: data.original_sha256,
        projects: changes.map((c: any) => c.after.id),
      },
      "Reviewed one-time project projection repair; no financial or canonical assertions changed.",
    );
    return { duplicate: false, applied: true, changes };
  });
}
