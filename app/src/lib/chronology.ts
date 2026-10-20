import type { DB } from "./db.ts";
/** Reapply the explicit reviewed year correction on existing databases and fresh imports. */
export function correctReviewedAltisYears(db: DB) {
  const authority = db
    .prepare(
      "SELECT id FROM assertions WHERE id='review-override-altis-report' AND canon='confirmed'",
    )
    .get();
  if (!authority) return { corrected: 0 };
  const rows = db
    .prepare(
      "SELECT * FROM battles WHERE id IN ('B026','B027') AND name IN ('Altis 5-day fight','Altis day 6')",
    )
    .all();
  const pending = rows.filter((r) => {
    try {
      const d = JSON.parse(r.date_json as string);
      return (
        d.precision === "relative" &&
        d.label === "October 1993" &&
        !d.earliest &&
        !d.latest
      );
    } catch {
      return false;
    }
  });
  if (!pending.length) return { corrected: 0 };
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const before of pending) {
      const date = {
        ...JSON.parse(before.date_json as string),
        label: "October 1992",
      };
      db.prepare("UPDATE battles SET date_json=? WHERE id=?").run(
        JSON.stringify(date),
        before.id,
      );
      const after = db
        .prepare("SELECT * FROM battles WHERE id=?")
        .get(before.id)!;
      db.prepare(
        "INSERT INTO audit(action,target,before_json,after_json,explanation) VALUES(?,?,?,?,?)",
      ).run(
        "correct_altis_battle_year",
        before.id,
        JSON.stringify(before),
        JSON.stringify({ ...after, authority_assertion_id: authority.id }),
        "User Q01 and the usability directive: the Altis 1993 year was a typo for 1992. Preserve relative precision, unknown combat days, original source and provisional canon status.",
      );
    }
    db.exec("COMMIT");
    return { corrected: pending.length };
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
