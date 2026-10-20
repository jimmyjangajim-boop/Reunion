import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { all, one, transaction, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { addAssertion, indexSource, operations } from "./canon.ts";
import { dateValue } from "./dates.ts";

const hash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const entityMap: Record<string, string> = {
  royal_family: "crown",
  king_zo_iii: "king-zo-iii",
  henry_steiner: "P010",
  ezra_hartman: "P008",
  ebin_hartman: "P009",
  amalia_rehn: "P014",
  emilio_curro: "P015",
};

/** Import the preserved, reviewed dataset. Calendar proposals never set the clock. */
export function importReviewedCanon(
  db: DB,
  root = path.resolve("evidence/canon-review-2026-10-20"),
) {
  const bytes = readFileSync(path.join(root, "seed.json"));
  const checksums = JSON.parse(
    readFileSync(path.join(root, "SHA256SUMS.json"), "utf8"),
  );
  for (const [file, digest] of Object.entries(checksums))
    if (hash(readFileSync(path.join(root, file))) !== digest)
      throw Error("Reviewed source checksum mismatch: " + file);
  const batch = "review-" + hash(bytes).slice(0, 20);
  if (one(db, "SELECT id FROM import_batches WHERE id=?", batch))
    return { batch, duplicate: true };
  const data = JSON.parse(bytes.toString("utf8"));
  return transaction(db, () => {
    db.prepare(
      "INSERT INTO import_batches(id,name,sha256,state) VALUES(?,?,?,'accepted')",
    ).run(batch, "User-adjudicated canon review, 20 October 2026", hash(bytes));
    const sourceIds = new Map<string, string>();
    for (const source of data.sources) {
      const id = "REVIEW-" + source.id,
        content =
          source.text ||
          "[No extracted text. Original metadata is preserved in source_artifacts.]";
      const tier =
        source.priority === "explicit_user_decision"
          ? 1
          : source.priority === "latest_tracker"
            ? 3
            : 4;
      db.prepare(
        "INSERT INTO sources(id,batch_id,path,filename,sha256,bytes,content,tier,kind) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        batch,
        "review-2026-10-20/" + source.container + "/" + source.path,
        source.path,
        hash(content),
        Buffer.byteLength(content),
        content,
        tier,
        "review_extraction",
      );
      db.prepare("INSERT INTO source_artifacts VALUES(?,?,?,?,?,?)").run(
        id,
        source.container,
        source.path,
        source.sha256,
        source.byte_count,
        source.extraction_status,
      );
      indexSource(db, id, content);
      sourceIds.set(source.id, id);
    }
    const answerSource = data.sources.find(
      (s: Row) => s.priority === "explicit_user_decision",
    );
    if (!answerSource) throw Error("User answer source is missing");
    const sourceId = sourceIds.get(answerSource.id)!;
    const lines = answerSource.text.split(/\r?\n/);
    const answerLine = (question: string) => {
      const n = Number(question.slice(1));
      const line =
        lines.findIndex((line: string) => line.startsWith(n + ". ")) + 1;
      if (!line) throw Error("Answer line missing: " + question);
      return line;
    };
    const factIds = new Map<string, string>();
    for (const fact of data.facts) {
      const entity = entityMap[fact.entity] ?? fact.entity.replaceAll("_", "-");
      db.prepare(
        "INSERT OR IGNORE INTO entities(id,name,kind,description) VALUES(?,?,?,?)",
      ).run(
        entity,
        fact.entity.replaceAll("_", " "),
        "reviewed subject",
        "Imported from user-adjudicated evidence review",
      );
      let date = dateValue();
      if (fact.date_precision === "day")
        date = dateValue("day", fact.date_text);
      else if (fact.date_precision === "year")
        date = dateValue("year", fact.date_text);
      else if (fact.date_precision === "year_range")
        date = dateValue("range", fact.date_text, "1946", "1947");
      else if (fact.date_precision === "day_and_local_time")
        date = dateValue("day", fact.date_text.slice(0, 10));
      else if (fact.date_precision === "assigned_day")
        date = dateValue("day", fact.date_text);
      else if (fact.date_text) date = dateValue("relative", fact.date_text);
      const operation = (operations as readonly string[]).includes(
        fact.operational_status,
      )
        ? fact.operational_status
        : "unknown";
      const delegated = fact.authority !== "explicit_user_decision";
      const id = "review-fact-" + fact.id;
      addAssertion(
        db,
        {
          entity_id: entity,
          predicate: fact.predicate,
          value: fact.value_json,
          category:
            /budget|gdp|debt|revenue|spending|deficit|capital|loan|oil|horizon/.test(
              fact.predicate + " " + fact.entity,
            )
              ? "economic"
              : /altis|unit_17|rng|armed/.test(fact.entity)
                ? "military"
                : "history",
          canon: delegated ? "provisional" : "confirmed",
          operation,
          confidence: delegated
            ? "Delegated reconciliation; estimate or assigned date"
            : "Explicit user answer; estimates retain their original labels",
          date,
          scope: date.precision === "unknown" ? "undated" : "point",
          source_id: sourceId,
          line_start: answerLine(fact.question_id),
          line_end: answerLine(fact.question_id),
          notes:
            fact.notes +
            " Original review status: " +
            fact.canon_status +
            "; operation: " +
            fact.operational_status +
            "; authority: " +
            fact.authority,
        },
        id,
        batch,
      );
      factIds.set(fact.id, id);
    }
    // Explicit corrections to existing normalized records retain their original
    // historical context and both source links. They do not invent a current date.
    const overrides: [string, string, string, string][] = [
      [
        "heir",
        "No designated heir",
        "Q24",
        "Heir designation is retconned; Henry Steiner is the king’s cousin and Inferno commander.",
      ],
      [
        "spending",
        "$255B USD",
        "Q06",
        "Annual spending framework; not actual cash expenditure.",
      ],
      [
        "deficit",
        "Projected $95B USD at the unchanged $160B revenue estimate",
        "Q06",
        "Deterministic budget arithmetic; not a booked increase in debt.",
      ],
      [
        "budget-total-250",
        "$255B annual framework; $82B defense",
        "Q06",
        "Old $250B headline superseded by direct user decision.",
      ],
      [
        "budget-total-255",
        "$255B annual framework; $82B defense",
        "Q07",
        "Source allocations are reconciled in the separate review; no actual spending is invented.",
      ],
      [
        "altis-report",
        "11 October 1992 RBD report. The 1993 year was a typo. Preserve the source’s reported phase separately from the later ceasefire disposition.",
        "Q01",
        "Year correction only; current-date and ceasefire proposals remain unconfirmed.",
      ],
    ];
    const corrections: Record<string, string> = {};
    for (const [oldId, value, qid, notes] of overrides) {
      const old = one(db, "SELECT * FROM assertions WHERE id=?", oldId);
      if (!old) continue;
      const id = "review-override-" + oldId;
      const date = JSON.parse(old.date_json);
      if (oldId === "altis-report") {
        date.label = "1992-10-11";
        date.precision = "day";
        date.earliest = null;
        date.latest = null;
      }
      addAssertion(
        db,
        {
          ...old,
          value,
          canon: "confirmed",
          date,
          source_id: sourceId,
          line_start: answerLine(qid),
          line_end: answerLine(qid),
          notes,
        },
        id,
        batch,
      );
      db.prepare(
        "INSERT OR IGNORE INTO evidence(assertion_id,source_id,line_start,line_end,excerpt) SELECT ?,source_id,line_start,line_end,excerpt FROM evidence WHERE assertion_id=?",
      ).run(id, oldId);
      db.prepare(
        "UPDATE assertions SET canon='superseded',superseded_by=? WHERE id=?",
      ).run(id, oldId);
      audit(
        db,
        "canon_override",
        oldId,
        old,
        one(db, "SELECT * FROM assertions WHERE id=?", id),
        "Direct user answer " + qid + "; old source retained.",
      );
      corrections[oldId] = id;
    }
    for (const oldId of ["person-P004", "royal-person-heir"]) {
      const before = one(db, "SELECT * FROM assertions WHERE id=?", oldId);
      if (!before) continue;
      db.prepare(
        "UPDATE assertions SET canon='superseded',superseded_by=? WHERE id=?",
      ).run(corrections.heir, oldId);
      audit(
        db,
        "canon_override",
        oldId,
        before,
        { superseded_by: corrections.heir },
        "Q24: no designated heir. Stable legacy identity and original evidence remain preserved.",
      );
    }
    for (const old of all(
      db,
      "SELECT * FROM assertions WHERE entity_id IN ('battle-B026','battle-B027')",
    )) {
      const date = JSON.parse(
        JSON.stringify(JSON.parse(old.date_json)).replaceAll("1993", "1992"),
      );
      const id = "review-override-" + old.id;
      addAssertion(
        db,
        {
          ...old,
          date,
          value: old.value.replaceAll("1993", "1992"),
          source_id: sourceId,
          line_start: answerLine("Q01"),
          line_end: answerLine("Q01"),
          notes:
            old.notes +
            " Q01 corrects the Altis year only; this remains a separate reported combat phase.",
        },
        id,
        batch,
      );
      db.prepare(
        "INSERT OR IGNORE INTO evidence(assertion_id,source_id,line_start,line_end,excerpt) SELECT ?,source_id,line_start,line_end,excerpt FROM evidence WHERE assertion_id=?",
      ).run(id, old.id);
      db.prepare(
        "UPDATE assertions SET canon='superseded',superseded_by=? WHERE id=?",
      ).run(id, old.id);
      audit(
        db,
        "canon_override",
        old.id,
        old,
        { replacement: id },
        "Q01: Altis 1993 dateline is a typo for 1992.",
      );
    }
    for (const old of all(
      db,
      "SELECT * FROM timeline WHERE id IN ('T041','T042','T043')",
    )) {
      const id = "review-" + old.id;
      const date = JSON.stringify(JSON.parse(old.date_json)).replaceAll(
        "1993",
        "1992",
      );
      db.prepare(
        "INSERT INTO timeline(id,title,category,date_json,canon,operation,source_id,line_start,line_end,note,batch_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        old.title,
        old.category,
        date,
        old.canon,
        old.operation,
        old.source_id,
        old.line_start,
        old.line_end,
        old.note +
          " Q01 in user answer source " +
          sourceId +
          " corrects the year to 1992.",
        batch,
      );
      db.prepare("UPDATE timeline SET canon='superseded' WHERE id=?").run(
        old.id,
      );
      audit(
        db,
        "timeline_year_correction",
        old.id,
        old,
        { replacement: id, date_json: date },
        "Q01: Altis year corrected; original chronology row retained.",
      );
    }
    for (const answer of data.answers) {
      const id = "REVIEW-" + answer.id;
      const state = ["Q26", "Q27"].includes(answer.id)
        ? "postponed"
        : "resolved";
      db.prepare(
        "INSERT INTO issues(id,kind,priority,category,title,question,known_state,state,answer) VALUES(?,'missing','MEDIUM','history',?,?,?,?,?)",
      ).run(
        id,
        answer.topic,
        answer.question,
        "User-adjudicated review; see answer source.",
        state,
        answer.answer,
      );
      db.prepare(
        "INSERT INTO decisions(id,issue_id,action,explanation,before_json,after_json) VALUES(?,?,?,?,?,?)",
      ).run(
        "review-decision-" + answer.id,
        id,
        "import_user_answer",
        "User supplied answer " + answer.id,
        JSON.stringify({ question: answer.question }),
        JSON.stringify({
          answer: answer.answer,
          handling: answer.status,
          source_id: sourceId,
          line: answerLine(answer.id),
        }),
      );
    }
    for (const [id, title, question] of [
      [
        "REVIEW-calendar-current",
        "Confirm the current calendar",
        "Use 18 October 1992 as current date, with dissolution and the Altis ceasefire on October 17?",
      ],
      [
        "REVIEW-calendar-election",
        "Confirm the June election sequence",
        "Use June 21 final election, June 23 inauguration/Rehn appointment, and the confirmed June 25 death/Curro succession?",
      ],
    ])
      db.prepare(
        "INSERT INTO issues(id,kind,priority,category,title,question,known_state) VALUES(?,'missing','HIGH','political',?,?,?)",
      ).run(
        id,
        title,
        question,
        "Proposal only. No current clock or election history has been changed.",
      );
    for (const id of ["C001", "C015"]) {
      const before = one(db, "SELECT * FROM issues WHERE id=?", id);
      if (!before) continue;
      db.prepare("UPDATE issues SET state='resolved',answer=? WHERE id=?").run(
        id === "C001"
          ? "Q24: No designated heir; Henry Steiner is the king’s cousin."
          : "Q01: Altis year is 1992; 1993 was a typo.",
        id,
      );
      db.prepare(
        "INSERT INTO decisions(id,issue_id,action,explanation,before_json,after_json) VALUES(?,?,?,?,?,?)",
      ).run(
        "review-resolve-" + id,
        id,
        "replace",
        "Direct user review answer",
        JSON.stringify(before),
        JSON.stringify(one(db, "SELECT * FROM issues WHERE id=?", id)),
      );
    }
    audit(
      db,
      "import_reviewed_canon",
      batch,
      null,
      {
        sources: data.sources.length,
        facts: data.facts.length,
        answers: data.answers.length,
      },
      "Reviewed source import. Calendar proposals are questions, not canon. No live database is committed to Git.",
    );
    return {
      batch,
      duplicate: false,
      sources: data.sources.length,
      facts: data.facts.length,
      answers: data.answers.length,
    };
  });
}
