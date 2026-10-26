import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { all, one, audit, transaction } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { createUserSource } from "./canon.ts";
import { exactDate } from "./dates.ts";
export const financialStages = [
  "proposed",
  "authorized",
  "appropriated",
  "committed",
  "disbursed",
  "actual",
] as const;
export const financialFields = {
  budget_id: z.string().nullable().default(null),
  budget_name: z.string().trim().min(1).max(500).nullable().default(null),
  financial_stage: z.enum(financialStages).nullable().default(null),
  financial_amount: z
    .number()
    .int()
    .nonnegative()
    .safe()
    .nullable()
    .default(null),
  financial_currency: z
    .string()
    .trim()
    .regex(/^[a-z]{3,8}$/i)
    .transform((s) => s.toUpperCase())
    .nullable()
    .default(null),
  financial_reference: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9_./-]{0,119}$/i)
    .transform((s) => s.toUpperCase())
    .nullable()
    .default(null),
  financial_memo: z.string().trim().min(1).max(20000).nullable().default(null),
  appropriation_basis: z.literal("increase").nullable().default(null),
  expected_budget_state: z.string().nullable().default(null),
};
function findBudget(db: DB, p: Row) {
  if (p.budget_id) {
    const budget = one(db, "SELECT * FROM budgets WHERE id=?", p.budget_id);
    return {
      budget,
      error: budget ? null : "The selected budget no longer exists.",
    };
  }
  if (!p.budget_name)
    return {
      budget: undefined,
      error: "Select a known budget. Reports do not invent funding accounts.",
    };
  const matches = all(
    db,
    "SELECT * FROM budgets WHERE lower(name)=lower(?)",
    p.budget_name,
  );
  return {
    budget: matches.length === 1 ? matches[0] : undefined,
    error:
      matches.length === 1
        ? null
        : matches.length
          ? "Several budgets have this name. Select the exact fiscal year and currency."
          : "No existing budget matches the reported name. Select or establish its sourced appropriation first.",
  };
}
export function financialState(db: DB, p: Row) {
  const { budget } = findBudget(db, p);
  if (!budget) return null;
  return createHash("sha256")
    .update(
      JSON.stringify({
        budget,
        ledger: all(
          db,
          "SELECT * FROM ledger WHERE budget_id=? ORDER BY id",
          budget.id,
        ),
      }),
    )
    .digest("hex");
}
export function appropriationAt(db: DB, budget: Row, date: string) {
  const future = one(
    db,
    "SELECT COALESCE(SUM(a.new_amount-a.previous_amount),0) n FROM budget_adjustments a JOIN ledger l ON l.id=a.ledger_id WHERE l.budget_id=? AND l.date>?",
    budget.id,
    date,
  )!.n;
  return budget.appropriated - future;
}
export function validateFinancial(db: DB, p: Row, funding: Row[] = []) {
  const missing: string[] = [],
    warnings: string[] = [];
  const { budget, error } = findBudget(db, p);
  if (error) missing.push(error);
  if (!p.date)
    missing.push(
      "An exact financial record date is required. Leave the report pending if it is unknown.",
    );
  if ((p.financial_memo ?? p.statement).length > 20000)
    missing.push(
      "Supply a transaction memo of at most 20,000 characters; the full original remains preserved.",
    );
  if (!p.financial_stage)
    missing.push("Choose the financial stage explicitly reported.");
  if (p.financial_amount === null)
    missing.push("Supply the explicit amount in whole currency units.");
  if (!p.financial_currency)
    missing.push("Supply the reported currency; no exchange rate is inferred.");
  if (!p.financial_reference)
    missing.push(
      "Supply a transaction reference to distinguish this transaction from repeated reports and separate payments.",
    );
  if (
    p.financial_stage === "appropriated" &&
    p.appropriation_basis !== "increase"
  )
    missing.push(
      "Confirm that this is an additional appropriation increasing the existing limit, rather than a restatement of its total.",
    );
  if (
    budget &&
    p.budget_name &&
    budget.name.toLowerCase() !== p.budget_name.toLowerCase()
  )
    missing.push("The selected budget differs from the reported budget name.");
  if (
    budget &&
    p.financial_currency &&
    budget.currency.toUpperCase() !== p.financial_currency
  )
    missing.push(
      "The reported currency differs from the selected budget. Currency conversion is not inferred.",
    );
  if (budget && p.expected_budget_state !== financialState(db, p))
    missing.push(
      "The budget or ledger changed after this proposal. Save a reasoned proposal correction to review the new state.",
    );
  let existing: Row | undefined;
  if (budget && p.financial_reference && p.financial_stage) {
    existing = one(
      db,
      "SELECT l.*,r.currency FROM ledger_report_records r JOIN ledger l ON l.id=r.ledger_id WHERE r.budget_id=? AND r.stage=? AND r.reference=?",
      budget.id,
      p.financial_stage,
      p.financial_reference,
    );
    if (existing) {
      if (
        existing.date !== p.date ||
        existing.amount !== p.financial_amount ||
        existing.currency !== p.financial_currency
      )
        missing.push(
          "This transaction reference already identifies a different amount, date or currency at this stage. Preserve the conflict for review; do not overwrite the transaction.",
        );
      else
        warnings.push(
          "This corroborates an existing transaction. Evidence will be added without another ledger entry or appropriation increase.",
        );
    }
  }
  if (budget && p.date && Number(p.date.slice(0, 4)) !== budget.fiscal_year)
    warnings.push(
      "The record date is outside the selected fiscal year. Verify the explicitly selected funding account.",
    );
  const additions = funding.filter((f) => f.budget_id === budget?.id);
  const projected = additions.reduce((n, f) => n + f.amount, 0);
  const projectedDated = additions
    .filter((f) => p.date && f.date <= p.date)
    .reduce((n, f) => n + f.amount, 0);
  if (!Number.isSafeInteger(projected) || !Number.isSafeInteger(projectedDated))
    missing.push(
      "Proposed appropriation totals exceed the supported exact whole-unit range.",
    );
  if (budget && p.financial_amount !== null && !existing) {
    if (
      p.financial_stage === "appropriated" &&
      !Number.isSafeInteger(
        budget.appropriated + projected + p.financial_amount,
      )
    )
      missing.push(
        "The revised appropriation exceeds the supported exact whole-unit range.",
      );
    if (["committed", "disbursed", "actual"].includes(p.financial_stage)) {
      const total = one(
        db,
        "SELECT COALESCE(SUM(amount),0) n FROM ledger WHERE budget_id=? AND stage=?",
        budget.id,
        p.financial_stage,
      )!.n;
      const dated = p.date
        ? one(
            db,
            "SELECT COALESCE(SUM(amount),0) n FROM ledger WHERE budget_id=? AND stage=? AND date<=?",
            budget.id,
            p.financial_stage,
            p.date,
          )!.n
        : 0;
      const limit = p.date
        ? appropriationAt(db, budget, p.date)
        : budget.appropriated;
      if (
        !Number.isSafeInteger(total + p.financial_amount) ||
        !Number.isSafeInteger(limit) ||
        limit < 0
      )
        missing.push(
          "The budget totals require reconciliation before an exact financial entry can be approved.",
        );
      if (
        additions.length &&
        (total + p.financial_amount > budget.appropriated ||
          dated + p.financial_amount > limit)
      )
        warnings.push(
          "This change relies on earlier proposed additional appropriations in this report. Select and approve those changes together.",
        );
      // A backdated entry also changes cumulative totals on every later
      // spending date, including dates before a subsequent budget increase.
      const laterDates = p.date
        ? all(
            db,
            "SELECT DISTINCT date FROM ledger WHERE budget_id=? AND stage=? AND date>?",
            budget.id,
            p.financial_stage,
            p.date,
          )
        : [];
      const laterExcess = laterDates.some(({ date }) => {
        const cumulative = one(
          db,
          "SELECT COALESCE(SUM(amount),0) n FROM ledger WHERE budget_id=? AND stage=? AND date<=?",
          budget.id,
          p.financial_stage,
          date,
        )!.n;
        const extra = additions
          .filter((f) => f.date <= date)
          .reduce((n, f) => n + f.amount, 0);
        return (
          cumulative + p.financial_amount >
          appropriationAt(db, budget, date) + extra
        );
      });
      if (
        laterExcess ||
        total + p.financial_amount > budget.appropriated + projected ||
        dated + p.financial_amount > limit + projectedDated
      ) {
        warnings.push(
          `Authorization warning: ${p.financial_stage} entries exceed the recorded appropriation, including its known date-specific increases.`,
        );
        if (!p.override_reason.trim())
          missing.push(
            "Review the authorization warning and supply an explicit override reason.",
          );
      }
    }
    const similar = one(
      db,
      "SELECT id FROM ledger WHERE budget_id=? AND stage=? AND date=? AND amount=?",
      budget.id,
      p.financial_stage,
      p.date,
      p.financial_amount,
    );
    if (similar)
      warnings.push(
        "A same-date, same-stage entry has this amount. Verify that this reference identifies a separate transaction; legacy entries are not automatically merged.",
      );
  }
  if (p.financial_stage === "appropriated")
    warnings.push(
      "Additional appropriation only: increases this budget’s limit; it does not record a payment, expense, revenue or debt.",
    );
  else
    warnings.push(
      "Only the reported financial stage is recorded. Other stages, transfers, revenue and debt are not inferred or added to this amount.",
    );
  return {
    ready: !missing.length,
    missing: [...new Set(missing)],
    warnings,
    budget,
    existing,
  };
}
/** Single validated write used by forms and report approval inside their transaction. */
function writeFinancial(db: DB, p: Row, sourceId: string) {
  const check = validateFinancial(db, p);
  if (!check.ready) throw Error(check.missing.join(" "));
  const budget = check.budget!;
  let id = check.existing?.id;
  if (!id) {
    id = randomUUID();
    db.prepare(
      "INSERT INTO ledger(id,budget_id,date,stage,amount,memo,override_reason,source_id) VALUES(?,?,?,?,?,?,?,?)",
    ).run(
      id,
      budget.id,
      p.date,
      p.financial_stage,
      p.financial_amount,
      p.financial_memo ?? p.statement,
      p.override_reason || null,
      sourceId,
    );
    db.prepare(
      "INSERT INTO ledger_report_records(ledger_id,budget_id,stage,reference,currency) VALUES(?,?,?,?,?)",
    ).run(
      id,
      budget.id,
      p.financial_stage,
      p.financial_reference,
      p.financial_currency,
    );
    if (p.financial_stage === "appropriated") {
      const revised = budget.appropriated + p.financial_amount;
      db.prepare(
        "INSERT INTO budget_adjustments(ledger_id,previous_amount,new_amount) VALUES(?,?,?)",
      ).run(id, budget.appropriated, revised);
      db.prepare("UPDATE budgets SET appropriated=? WHERE id=?").run(
        revised,
        budget.id,
      );
    }
  }
  return { id, budget, corroboration: !!check.existing };
}

/** Manual input is explicit authorization, with exactly the report accounting rules. */
export function recordManualFinancial(db: DB, input: Row) {
  return transaction(db, () => {
    const budget = one(db, "SELECT * FROM budgets WHERE id=?", input.budget_id);
    if (!budget) throw Error("Record not found: budgets");
    const p = {
      ...z.object(financialFields).parse({
        budget_id: budget.id,
        financial_stage: input.stage,
        financial_amount: z.coerce
          .number()
          .int()
          .nonnegative()
          .safe()
          .parse(input.amount),
        financial_currency: budget.currency,
        financial_reference: input.reference,
        financial_memo: input.memo,
        appropriation_basis: input.appropriation_basis || null,
      }),
      statement: z.string().trim().min(1).max(20000).parse(input.memo),
      date: exactDate.parse(input.date),
      override_reason: z
        .string()
        .trim()
        .max(20000)
        .parse(input.override_reason ?? ""),
    };
    p.expected_budget_state = financialState(db, p);
    const check = validateFinancial(db, p);
    if (!check.ready)
      throw Error(
        [
          ...check.warnings.filter((w) =>
            w.startsWith("Authorization warning"),
          ),
          ...check.missing,
        ].join(" "),
      );
    const sourceId = createUserSource(
      db,
      z
        .string()
        .trim()
        .min(1)
        .max(20000)
        .parse(input.source_text ?? input.memo),
    );
    const result = writeFinancial(db, p, sourceId);
    audit(
      db,
      "record_manual_financial",
      result.id,
      { budget },
      { ...result, source_id: sourceId, entry: p },
      "Explicit user financial entry; " + p.statement,
    );
    return {
      id: result.id,
      corroboration: result.corroboration,
      warnings: check.warnings,
    };
  });
}

/** Report approval owns the transaction and adds exact report evidence. */
export function recordFinancial(db: DB, p: Row, source: Row, reason: string) {
  const { id, budget, corroboration } = writeFinancial(db, p, source.source_id);
  db.prepare(
    "INSERT INTO ledger_report_evidence(ledger_id,source_id,line_start,line_end,report_action_id) VALUES(?,?,?,?,?)",
  ).run(
    id,
    source.source_id,
    source.line_start,
    source.line_end,
    source.action_id,
  );
  audit(
    db,
    "record_financial_report",
    id,
    { budget },
    {
      budget: one(db, "SELECT * FROM budgets WHERE id=?", budget.id),
      ledger: one(db, "SELECT * FROM ledger WHERE id=?", id),
      corroboration,
    },
    reason,
  );
  return { id, corroboration };
}
export function extractFinancial(statement: string): Row | null {
  if (statement.length > 20000) return null;
  const m = statement.match(
    /^Treasury\s+(proposed|authorized|appropriated|committed|disbursed|recorded actual expense of|added an appropriation of)\s+([a-z]{3,8})\s+((?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+))\s+(?:for|from|to)\s+Budget\s+(.+?)(?:;\s*reference\s+([a-z0-9][a-z0-9_./-]{0,119})(?:\s*:\s*(.+))?)?[.]?$/i,
  );
  if (!m) return null;
  const n = Number(m[3].replaceAll(",", ""));
  if (!Number.isSafeInteger(n) || m[4].length > 500) return null;
  return {
    financial_stage:
      m[1].toLowerCase() === "recorded actual expense of"
        ? "actual"
        : m[1].toLowerCase() === "added an appropriation of"
          ? "appropriated"
          : m[1].toLowerCase(),
    financial_currency: m[2].toUpperCase(),
    financial_amount: n,
    budget_name: m[4],
    financial_reference: m[5]?.replace(/[.]$/, "").toUpperCase() ?? null,
    financial_memo: m[6]?.replace(/[.]$/, "") ?? null,
    appropriation_basis:
      m[1].toLowerCase() === "added an appropriation of" ? "increase" : null,
  };
}
