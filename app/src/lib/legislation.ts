import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { all, one, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { exactDate } from "./dates.ts";

export const legislativeStages = [
  "considering",
  "introduced",
  "passed",
  "enacted",
] as const;
export const billFields = {
  bill_id: z.string().nullable().default(null),
  bill_identifier: z.string().trim().min(1).max(200).nullable().default(null),
  bill_title: z.string().trim().min(1).max(500).nullable().default(null),
  bill_stage: z.enum(legislativeStages).nullable().default(null),
  effective_date: exactDate.nullable().default(null),
  expected_bill_state: z.string().nullable().default(null),
};
const rank = (stage: string) =>
  legislativeStages.indexOf(stage as (typeof legislativeStages)[number]);

function findBill(db: DB, p: Row) {
  if (p.bill_id) {
    const bill = one(db, "SELECT * FROM bills WHERE id=?", p.bill_id);
    return { bill, error: bill ? null : "The selected bill no longer exists." };
  }
  if (!p.bill_identifier)
    return {
      bill: undefined,
      error: "Supply the reported bill identifier or select an existing bill.",
    };
  const matches = all(
    db,
    "SELECT * FROM bills WHERE lower(identifier)=lower(?)",
    p.bill_identifier,
  );
  return {
    bill: matches[0],
    error:
      matches.length > 1
        ? "The identifier matches several records. Select the exact bill."
        : null,
  };
}
export function legislativeState(db: DB, p: Row) {
  const { bill, error } = findBill(db, p);
  if (error) return null;
  return createHash("sha256")
    .update(
      JSON.stringify(
        bill
          ? {
              bill,
              events: all(
                db,
                "SELECT id,stage,date,effective_date FROM bill_events WHERE bill_id=? ORDER BY id",
                bill.id,
              ),
            }
          : { absent: p.bill_identifier?.toLowerCase() },
      ),
    )
    .digest("hex");
}

export function validateLegislation(db: DB, p: Row) {
  const missing: string[] = [],
    warnings: string[] = [];
  const { bill, error } = findBill(db, p);
  if (error) missing.push(error);
  if (!p.bill_stage)
    missing.push(
      "Choose the action actually reported: consideration, introduction, passage, or enactment.",
    );
  if (
    bill &&
    p.bill_identifier &&
    bill.identifier.toLowerCase() !== p.bill_identifier.toLowerCase()
  )
    missing.push("The selected bill and reported identifier differ.");
  if (bill?.title && p.bill_title && bill.title !== p.bill_title)
    missing.push(
      "The reported title conflicts with the existing bill. Resolve the title or select the correct bill.",
    );
  if (
    p.expected_bill_state !== null &&
    p.expected_bill_state !== legislativeState(db, p)
  )
    missing.push(
      "The bill register changed after this proposal. Save a reasoned proposal correction to review the new state.",
    );
  if (p.effective_date && p.bill_stage !== "enacted")
    missing.push(
      "An effective date requires an explicit report of enactment; passage alone cannot commence a law.",
    );
  if (
    bill?.effective_date &&
    p.effective_date &&
    bill.effective_date !== p.effective_date
  )
    missing.push(
      "The effective date conflicts with the recorded law. Preserve it for canon review rather than overwrite it.",
    );
  if (p.date && p.effective_date && p.effective_date < p.date)
    warnings.push(
      "The effective date precedes reported enactment. Verify the explicitly reported retroactive effect.",
    );
  if (!p.date)
    warnings.push(
      "The legislative date remains unknown. This record cannot establish a dated parliamentary snapshot.",
    );
  if (!bill && !p.bill_title)
    warnings.push("The bill title was not reported and will remain unknown.");
  if (bill) {
    if (
      p.date &&
      bill.introduced_date &&
      rank(p.bill_stage) > rank("introduced") &&
      p.date < bill.introduced_date
    )
      missing.push(
        "This stage precedes the bill’s known introduction date. Correct the proposal or leave it pending for canon review.",
      );
    for (const e of all(
      db,
      "SELECT stage,date FROM bill_events WHERE bill_id=?",
      bill.id,
    )) {
      if (
        p.date &&
        e.date &&
        ((e.date < p.date && rank(e.stage) > rank(p.bill_stage)) ||
          (e.date > p.date && rank(e.stage) < rank(p.bill_stage)))
      )
        missing.push(
          "This date and stage conflict with the existing legislative sequence. Correct the proposal or leave it pending for canon review.",
        );
    }
    if (rank(p.bill_stage) < rank(bill.stage))
      warnings.push(
        "This earlier-stage report will be preserved in history without regressing the bill register.",
      );
  }
  if (p.bill_stage === "passed")
    warnings.push(
      "Reported passage only: no vote totals, enactment, appropriation, or payment will be inferred.",
    );
  if (p.bill_stage === "considering")
    warnings.push("Consideration is a proposal, not passage or enactment.");
  if (p.bill_stage === "enacted")
    warnings.push(
      "Enactment is explicitly reported. An effective date remains unknown unless supplied. No financial transaction will be created.",
    );
  return {
    ready: !missing.length,
    missing: [...new Set(missing)],
    warnings,
    bill,
  };
}

/** Called inside the report transaction, using the same bills register as Parliament. */
export function recordLegislation(db: DB, p: Row, source: Row, reason: string) {
  const check = validateLegislation(db, p);
  if (!check.ready) throw Error(check.missing.join(" "));
  const original = check.bill;
  let bill = original;
  if (!bill) {
    const id = randomUUID();
    db.prepare(
      "INSERT INTO bills(id,identifier,title,summary,stage,introduced_date,effective_date,source_id) VALUES(?,?,?,?,?,?,?,?)",
    ).run(
      id,
      p.bill_identifier,
      p.bill_title ?? "",
      p.statement,
      p.bill_stage,
      p.bill_stage === "introduced" ? p.date : null,
      p.bill_stage === "enacted" ? p.effective_date : null,
      source.source_id,
    );
    bill = one(db, "SELECT * FROM bills WHERE id=?", id)!;
  }
  let event = one(
    db,
    "SELECT * FROM bill_events WHERE bill_id=? AND stage=? AND date IS ? AND effective_date IS ?",
    bill.id,
    p.bill_stage,
    p.date,
    p.effective_date,
  );
  const corroboration = !!event;
  if (!event) {
    const id = randomUUID();
    db.prepare(
      "INSERT INTO bill_events(id,bill_id,stage,date,effective_date) VALUES(?,?,?,?,?)",
    ).run(id, bill.id, p.bill_stage, p.date, p.effective_date);
    event = one(db, "SELECT * FROM bill_events WHERE id=?", id)!;
  }
  db.prepare(
    "INSERT INTO bill_event_evidence(event_id,source_id,line_start,line_end,report_action_id) VALUES(?,?,?,?,?)",
  ).run(
    event.id,
    source.source_id,
    source.line_start,
    source.line_end,
    source.action_id,
  );
  const stage =
    rank(p.bill_stage) > rank(bill.stage) ? p.bill_stage : bill.stage;
  const introduction =
    p.bill_stage === "introduced" &&
    p.date &&
    (!bill.introduced_date || p.date < bill.introduced_date)
      ? p.date
      : bill.introduced_date;
  db.prepare(
    "UPDATE bills SET stage=?,title=?,introduced_date=?,effective_date=? WHERE id=?",
  ).run(
    stage,
    bill.title || p.bill_title || "",
    introduction,
    bill.effective_date ??
      (p.bill_stage === "enacted" ? p.effective_date : null),
    bill.id,
  );
  audit(
    db,
    "record_legislation",
    bill.id,
    original ?? null,
    {
      bill: one(db, "SELECT * FROM bills WHERE id=?", bill.id),
      event_id: event.id,
      corroboration,
    },
    reason,
  );
  return { id: bill.id, event_id: event.id, corroboration };
}

/** Explicit bill syntax avoids inventing identifiers, vote counts or monetary effects. */
export function extractLegislation(statement: string): Row | null {
  const parliament = statement.match(
    /^(?:Parliament|The Assembly)\s+(passed|approved|introduced|is considering|considered)\s+Bill\s+([A-Z0-9][A-Z0-9_-]*)(?:\s*:\s*(.+))?\.?$/i,
  );
  const signed = statement.match(
    /^President(?:\s+[\p{L}'’-]+){0,3}\s+signed\s+Bill\s+([A-Z0-9][A-Z0-9_-]*)\s+into\s+law\.?$/iu,
  );
  const law = statement.match(
    /^Bill\s+([A-Z0-9][A-Z0-9_-]*)\s+was\s+(enacted|passed|introduced)(?:\s*:\s*(.+))?\.?$/i,
  );
  if (parliament)
    return {
      bill_identifier: parliament[2],
      bill_title: parliament[3]?.replace(/[.]$/, "") ?? null,
      bill_stage: ["passed", "approved"].includes(parliament[1].toLowerCase())
        ? "passed"
        : parliament[1].toLowerCase() === "introduced"
          ? "introduced"
          : "considering",
    };
  if (signed)
    return {
      bill_identifier: signed[1],
      bill_title: null,
      bill_stage: "enacted",
    };
  if (law)
    return {
      bill_identifier: law[1],
      bill_title: law[3]?.replace(/[.]$/, "") ?? null,
      bill_stage: law[2].toLowerCase(),
    };
  return null;
}
