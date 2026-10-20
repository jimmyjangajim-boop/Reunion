import { randomUUID } from "node:crypto";
import { z } from "zod";
import { all, one, transaction, audit } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { createUserSource } from "./canon.ts";
import { exactDate, dateValue, historicalDateSchema, bounds } from "./dates.ts";
const text = z.string().trim().min(1).max(20000),
  amount = z.coerce.number().int().nonnegative().safe();
const optNum = (v: any) =>
  v === "" || v === null || v === undefined ? null : amount.parse(v);
const nullable = (v: any) => v?.trim() || null;
function required(db: DB, table: string, id: string) {
  const tables = [
    "units",
    "locations",
    "assets",
    "battles",
    "offices",
    "entities",
    "budgets",
    "bills",
    "chambers",
    "movements",
    "event_drafts",
  ];
  if (!tables.includes(table)) throw Error("Invalid table");
  const r = one(db, `SELECT * FROM ${table} WHERE id=?`, text.parse(id));
  if (!r) throw Error("Record not found: " + table);
  return r;
}
export function treatyWarnings(
  db: DB,
  location: string,
  date: string,
): string[] {
  return all(db, "SELECT * FROM restrictions WHERE location_id=?", location)
    .filter(
      (r) =>
        (!r.start_date || r.start_date <= date) &&
        (!r.end_date || r.end_date >= date),
    )
    .map(
      (r) =>
        r.description +
        (!r.start_date
          ? " Effective date is unknown; verify applicability."
          : ""),
    );
}
export function recordMovement(db: DB, input: RInput) {
  const unit = required(db, "units", input.unit_id),
    loc = required(db, "locations", input.location_id),
    date = exactDate.parse(input.date);
  const operation = z.enum(["planned", "ordered"]).parse(input.operation);
  const warnings = treatyWarnings(db, loc.id, date);
  if (warnings.length && !input.override_reason?.trim())
    throw Error(
      "Treaty warning: " +
        warnings.join(" ") +
        " Review and supply an explicit override reason.",
    );
  const id = randomUUID();
  db.prepare(
    "INSERT INTO movements(id,unit_id,location_id,date,operation,mission,warning,override_reason) VALUES(?,?,?,?,?,?,?,?)",
  ).run(
    id,
    unit.id,
    loc.id,
    date,
    operation,
    text.parse(input.mission),
    warnings.join("\n") || null,
    nullable(input.override_reason),
  );
  return { id, warnings };
}
export function completeMovement(db: DB, input: RInput) {
  const before = required(db, "movements", input.id),
    date = exactDate.parse(input.date);
  if (before.operation !== "ordered")
    throw Error("Only an ordered movement can be confirmed complete");
  if (date < before.date) throw Error("Arrival cannot precede the order");
  text.parse(input.explanation);
  const warnings = treatyWarnings(db, before.location_id, date);
  if (warnings.length && !input.override_reason?.trim())
    throw Error("Treaty warning on arrival: " + warnings.join(" "));
  db.prepare(
    "UPDATE movements SET operation='completed',completed_date=?,override_reason=COALESCE(?,override_reason) WHERE id=?",
  ).run(date, nullable(input.override_reason), before.id);
  audit(
    db,
    "complete_movement",
    before.id,
    before,
    { date },
    input.explanation,
  );
  return { id: before.id };
}
export function unitSnapshot(db: DB, date: string) {
  exactDate.parse(date);
  return all(
    db,
    "SELECT u.*,s.date observed_on,s.parent_id,s.personnel_low,s.personnel_high FROM units u JOIN unit_states s ON s.unit_id=u.id WHERE s.date=(SELECT MAX(t.date) FROM unit_states t WHERE t.unit_id=u.id AND t.date<=?)",
    date,
  );
}
export function assignAsset(db: DB, input: RInput) {
  required(db, "units", input.unit_id);
  const asset = required(db, "assets", input.asset_id);
  if (
    ![
      "delivered",
      "accepted",
      "operational",
      "damaged",
      "under repair",
    ].includes(asset.operation)
  )
    throw Error("An undelivered asset cannot be assigned to a unit");
  const start = exactDate.parse(input.start_date),
    end = input.end_date ? exactDate.parse(input.end_date) : null;
  if (end && end < start) throw Error("Assignment ends before it starts");
  const id = randomUUID();
  db.prepare("INSERT INTO asset_assignments VALUES(?,?,?,?,?)").run(
    id,
    asset.id,
    input.unit_id,
    start,
    end,
  );
  return { id };
}
export function vote(db: DB, input: RInput) {
  const c = required(db, "chambers", input.chamber_id);
  required(db, "bills", input.bill_id);
  const yes = amount.parse(input.yes),
    no = amount.parse(input.no),
    abstain = amount.parse(input.abstain),
    absent = amount.parse(input.absent),
    vacancies = amount.parse(input.vacancies);
  const configured = optNum(input.voting_seats);
  const applicable = c.occupied_seats ?? configured;
  if (applicable === null)
    throw Error(
      "Occupied seats unknown. Explicitly configure applicable voting seats.",
    );
  if (applicable > c.actual_seats || applicable < 0)
    throw Error("Voting capacity exceeds actual seats");
  if (yes + no + abstain + absent !== applicable)
    throw Error(
      "Yes + no + abstentions + absences must equal applicable occupied voting seats",
    );
  if (applicable + vacancies !== c.actual_seats)
    throw Error(
      "Occupied voting seats + vacancies must equal actual chamber size",
    );
  if (
    c.occupied_seats !== null &&
    configured !== null &&
    configured !== c.occupied_seats
  )
    throw Error("Configured capacity conflicts with recorded occupied seats");
  const threshold = optNum(input.threshold);
  if (threshold !== null && (threshold < 1 || threshold > applicable))
    throw Error("Invalid sourced voting threshold");
  const rule = text.parse(input.rule_source);
  if (/Suspended/i.test(c.session_status) && !input.explanation?.trim())
    throw Error("Suspended assembly requires explicit session authority");
  const date = exactDate.parse(input.date),
    id = randomUUID();
  db.prepare(
    "INSERT INTO votes(id,bill_id,chamber_id,date,yes,no,abstain,absent,vacancies,threshold,rule_source,result) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
  ).run(
    id,
    input.bill_id,
    c.id,
    date,
    yes,
    no,
    abstain,
    absent,
    vacancies,
    threshold,
    rule,
    threshold === null
      ? "Undetermined"
      : yes >= threshold
        ? "Threshold met; enactment not assumed"
        : "Threshold not met",
  );
  return { id };
}
export function ledgerEntry(db: DB, input: RInput) {
  const budget = required(db, "budgets", input.budget_id);
  const stage = z
      .enum([
        "proposed",
        "authorized",
        "appropriated",
        "committed",
        "disbursed",
        "actual",
        "returned",
        "canceled",
        "transfer",
      ])
      .parse(input.stage),
    n = amount.parse(input.amount);
  const current = one(
    db,
    "SELECT COALESCE(SUM(amount),0) total FROM ledger WHERE budget_id=? AND stage=?",
    budget.id,
    stage,
  )!.total;
  if (
    ["committed", "disbursed", "actual"].includes(stage) &&
    current + n > budget.appropriated &&
    !input.override_reason?.trim()
  )
    throw Error(
      `Authorization warning: ${stage} entries would exceed the ${budget.currency} ${budget.appropriated} appropriation. Supply an explicit override reason.`,
    );
  const id = randomUUID();
  db.prepare(
    "INSERT INTO ledger(id,budget_id,date,stage,amount,memo,override_reason,source_id) VALUES(?,?,?,?,?,?,?,?)",
  ).run(
    id,
    budget.id,
    exactDate.parse(input.date),
    stage,
    n,
    text.parse(input.memo),
    nullable(input.override_reason),
    nullable(input.source_id),
  );
  return { id, warning: current + n > budget.appropriated };
}
export function recordUnitState(db: DB, input: RInput) {
  const unit = required(db, "units", input.unit_id);
  const date = exactDate.parse(input.date),
    parent = nullable(input.parent_id);
  if (parent) {
    required(db, "units", parent);
    let cursor: string | null = parent;
    const seen = new Set([unit.id]);
    while (cursor) {
      if (seen.has(cursor))
        throw Error("Chain of command would contain a cycle");
      seen.add(cursor);
      cursor =
        one(
          db,
          "SELECT parent_id FROM unit_states WHERE unit_id=? AND date<=? ORDER BY date DESC LIMIT 1",
          cursor,
          date,
        )?.parent_id ?? null;
    }
  }
  const low = optNum(input.personnel_low),
    high = optNum(input.personnel_high);
  if (low !== null && high !== null && high < low)
    throw Error("Upper personnel bound is below lower bound");
  const id = randomUUID(),
    source = createUserSource(db, text.parse(input.source_text));
  db.prepare("INSERT INTO unit_states VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
    id,
    unit.id,
    date,
    parent,
    nullable(input.commander),
    nullable(input.garrison),
    low,
    high,
    optNum(input.authorized),
    nullable(input.readiness),
    nullable(input.mission),
    nullable(input.supply),
    text.parse(input.operation),
    source,
  );
  return { id };
}
export function appoint(db: DB, input: RInput) {
  required(db, "offices", input.office_id);
  const p = required(db, "entities", input.person_id);
  if (p.kind !== "person") throw Error("Select a person");
  const date = input.date ? exactDate.parse(input.date) : null;
  const arrangement = z
    .enum(["exclusive", "acting", "joint"])
    .parse(input.arrangement);
  const previous = all(
    db,
    "SELECT * FROM appointments WHERE office_id=? AND arrangement='exclusive' AND canon='confirmed' AND (end_date IS NULL OR end_date>=?)",
    input.office_id,
    date ?? "0001-01-01",
  );
  if (date && arrangement === "exclusive")
    for (const a of previous) {
      if (!a.start_date)
        throw Error(
          "Preceding appointment has unknown dates. Resolve that office’s chronology or explicitly record an acting/joint arrangement.",
        );
      if (input.reshuffle !== "yes")
        throw Error(
          "Overlapping appointment: explicitly approve the reshuffle to end the prior term",
        );
      if (a.start_date >= date)
        throw Error("New appointment must follow the preceding appointment");
      const end = new Date(date + "T12:00:00Z");
      end.setUTCDate(end.getUTCDate() - 1);
      db.prepare("UPDATE appointments SET end_date=? WHERE id=?").run(
        end.toISOString().slice(0, 10),
        a.id,
      );
    }
  const src = createUserSource(db, text.parse(input.explanation)),
    id = randomUUID();
  const info = date
    ? dateValue("day", date)
    : historicalDateSchema.parse(input.date_info);
  db.prepare(
    "INSERT INTO appointments(id,office_id,person_id,start_date,date_json,arrangement,canon,source_id) VALUES(?,?,?,?,?,?,?,?)",
  ).run(
    id,
    input.office_id,
    p.id,
    date,
    JSON.stringify(info),
    arrangement,
    "confirmed",
    src,
  );
  return { id };
}
type RInput = Record<string, any>;
export function adminAction(db: DB, input: RInput): any {
  return transaction(db, () => {
    let result: any;
    const action = text.parse(input.action),
      id = randomUUID();
    switch (action) {
      case "unit": {
        const src = createUserSource(db, text.parse(input.source_text));
        db.prepare(
          "INSERT INTO units(id,name,branch,unit_type,source_id) VALUES(?,?,?,?,?)",
        ).run(
          id,
          text.parse(input.name),
          text.parse(input.branch),
          text.parse(input.unit_type),
          src,
        );
        result = { id };
        break;
      }
      case "unit_state":
        result = recordUnitState(db, input);
        break;
      case "movement":
        result = recordMovement(db, input);
        break;
      case "complete_movement":
        result = completeMovement(db, input);
        break;
      case "asset": {
        const src = createUserSource(db, text.parse(input.source_text));
        db.prepare("INSERT INTO assets VALUES(?,?,?,?,?)").run(
          id,
          text.parse(input.name),
          text.parse(input.type),
          text.parse(input.operation),
          src,
        );
        result = { id };
        break;
      }
      case "assignment":
        result = assignAsset(db, input);
        break;
      case "office":
        db.prepare("INSERT INTO offices(id,name,authority) VALUES(?,?,?)").run(
          id,
          text.parse(input.name),
          text.parse(input.authority),
        );
        result = { id };
        break;
      case "appointment": {
        let appointmentInput = input;
        const name = nullable(input.new_person_name);
        if (name) {
          text.parse(name);
          if (input.person_id?.trim())
            throw Error(
              "Select an existing person or supply a new name, not both.",
            );
          if (
            one(
              db,
              "SELECT id FROM entities WHERE lower(name)=lower(?) AND kind='person'",
              name,
            )
          )
            throw Error(
              "A person with this name already exists. Select that person.",
            );
          const personId = randomUUID();
          db.prepare(
            "INSERT INTO entities(id,name,kind,description) VALUES(?,?,'person',?)",
          ).run(personId, name, "Created from a user-approved appointment");
          appointmentInput = {
            ...input,
            person_id: personId,
            explanation:
              text.parse(input.explanation) + "\nNamed appointee: " + name,
          };
          audit(
            db,
            "create_appointment_person",
            personId,
            null,
            { name, kind: "person" },
            input.explanation,
          );
        }
        result = appoint(db, appointmentInput);
        break;
      }
      case "bill": {
        const src = createUserSource(db, text.parse(input.source_text));
        db.prepare(
          "INSERT INTO bills(id,identifier,title,sponsor,summary,introduced_date,source_id) VALUES(?,?,?,?,?,?,?)",
        ).run(
          id,
          text.parse(input.identifier),
          text.parse(input.title),
          nullable(input.sponsor),
          text.parse(input.summary),
          exactDate.parse(input.date),
          src,
        );
        result = { id };
        break;
      }
      case "vote":
        result = vote(db, input);
        break;
      case "budget": {
        const src = createUserSource(db, text.parse(input.source_text));
        db.prepare("INSERT INTO budgets VALUES(?,?,?,?,?,?)").run(
          id,
          text.parse(input.name),
          z.coerce.number().int().min(1).max(9999).parse(input.fiscal_year),
          text.parse(input.currency),
          amount.parse(input.appropriated),
          src,
        );
        result = { id };
        break;
      }
      case "ledger":
        result = ledgerEntry(db, input);
        break;
      case "project": {
        const src = createUserSource(db, text.parse(input.source_text));
        db.prepare("INSERT INTO projects VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(
          id,
          text.parse(input.name),
          text.parse(input.operation),
          JSON.stringify(historicalDateSchema.parse(input.date_info)),
          optNum(input.planned),
          optNum(input.approved),
          optNum(input.paid),
          optNum(input.committed),
          nullable(input.currency),
          text.parse(input.notes),
          src,
        );
        result = { id };
        break;
      }
      case "battle": {
        const src = createUserSource(db, text.parse(input.source_text));
        db.prepare("INSERT INTO battles VALUES(?,?,?,?,?,?,?)").run(
          id,
          text.parse(input.name),
          JSON.stringify(historicalDateSchema.parse(input.date_info)),
          nullable(input.theater),
          nullable(input.outcome),
          z.enum(["provisional", "confirmed", "disputed"]).parse(input.canon),
          src,
        );
        result = { id };
        break;
      }
      case "casualty": {
        required(db, "battles", input.battle_id);
        if (input.unit_id) required(db, "units", input.unit_id);
        const src = createUserSource(db, text.parse(input.source_text));
        db.prepare("INSERT INTO casualties VALUES(?,?,?,?,?,?,?,?)").run(
          id,
          input.battle_id,
          nullable(input.unit_id),
          text.parse(input.report_group),
          z
            .enum(["KIA", "WIA", "MIA", "POW", "unspecified"])
            .parse(input.category),
          amount.parse(input.count),
          z.enum(["provisional", "confirmed", "disputed"]).parse(input.canon),
          src,
        );
        result = { id };
        break;
      }
      case "location": {
        const src = createUserSource(db, text.parse(input.source_text));
        const lat = nullable(input.latitude),
          lon = nullable(input.longitude);
        if ((lat === null) !== (lon === null))
          throw Error("Provide both coordinates or neither");
        db.prepare("INSERT INTO locations VALUES(?,?,?,?,?,?,?,?,?)").run(
          id,
          text.parse(input.name),
          text.parse(input.kind),
          lat === null ? null : z.coerce.number().min(-90).max(90).parse(lat),
          lon === null ? null : z.coerce.number().min(-180).max(180).parse(lon),
          nullable(input.sovereignty),
          nullable(input.control),
          nullable(input.administration),
          src,
        );
        result = { id };
        break;
      }
      case "treaty": {
        const src = createUserSource(db, text.parse(input.source_text)),
          info = historicalDateSchema.parse(input.date_info),
          operation = z
            .enum(["proposal", "approved", "completed", "canceled"])
            .parse(input.operation);
        db.prepare("INSERT INTO treaties VALUES(?,?,?,?,?,?,?)").run(
          id,
          text.parse(input.name),
          operation,
          JSON.stringify(info),
          text.parse(input.terms),
          nullable(input.signatories),
          src,
        );
        if (
          input.location_id &&
          input.restriction &&
          operation !== "proposal" &&
          operation !== "canceled"
        ) {
          required(db, "locations", input.location_id);
          const [lo, hi] = bounds(info);
          db.prepare(
            "INSERT INTO restrictions(id,treaty_id,location_id,description,start_date,end_date,scope) VALUES(?,?,?,?,?,?,?)",
          ).run(
            randomUUID(),
            id,
            input.location_id,
            text.parse(input.restriction),
            info.precision === "day" ? lo : null,
            null,
            info.precision === "day" ? "interval" : "undated",
          );
        }
        result = { id };
        break;
      }
      case "parse_event": {
        const date = exactDate.parse(input.date),
          statement = text.parse(input.text);
        const match =
          /^(?:The President orders|Order)\s+(.+?)\s+to\s+(.+?)[.!]?$/i.exec(
            statement,
          );
        const actions: Row[] = [],
          unresolved: string[] = [];
        if (match) {
          const units = all(
              db,
              "SELECT * FROM units WHERE lower(name)=lower(?)",
              match[1].trim(),
            ),
            locations = all(
              db,
              "SELECT * FROM locations WHERE lower(name)=lower(?)",
              match[2].trim(),
            );
          if (units.length === 1 && locations.length === 1)
            actions.push({
              kind: "movement",
              unit_id: units[0].id,
              location_id: locations[0].id,
              date,
              operation: "ordered",
              mission: statement,
            });
          else
            unresolved.push(
              "Exact unit and destination could not be uniquely identified. Use the structured movement form.",
            );
        } else
          unresolved.push(
            "This text needs structured review. Use sourced facts, movement, bill, or appropriation forms. No outcomes inferred.",
          );
        db.prepare(
          "INSERT INTO event_drafts(id,title,date,actions_json,explanation) VALUES(?,?,?,?,?)",
        ).run(
          id,
          statement,
          date,
          JSON.stringify(actions),
          JSON.stringify({ unresolved }),
        );
        result = { id, title: statement, date, actions, unresolved };
        break;
      }
      case "advance_preview": {
        const date = exactDate.parse(input.date),
          current =
            one(db, "SELECT value FROM settings WHERE key=?", "in_world_date")
              ?.value ?? "1992-10-03";
        if (date <= current)
          throw Error(
            "Choose a date after the recorded clock. Historical viewing uses the date selector.",
          );
        const actions = [
          {
            kind: "clock",
            date,
            description: `Move recorded clock from ${current} to ${date}. No historical outcomes or deliveries will be created.`,
          },
        ];
        db.prepare(
          "INSERT INTO event_drafts(id,title,date,actions_json) VALUES(?,?,?,?)",
        ).run(id, "Advance time to " + date, date, JSON.stringify(actions));
        result = {
          id,
          title: "Advance time to " + date,
          date,
          actions,
          pending: all(
            db,
            "SELECT u.name,m.operation FROM movements m JOIN units u ON u.id=m.unit_id WHERE m.date<=? AND m.operation IN ('planned','ordered')",
            date,
          ),
        };
        break;
      }
      case "approve_event": {
        const draft = required(db, "event_drafts", input.id);
        if (draft.operation !== "draft") throw Error("Draft already applied");
        if (
          draft.explanation &&
          JSON.parse(draft.explanation).unresolved?.length
        )
          throw Error(
            "Resolve unknown entities with structured forms before approval",
          );
        const actions = JSON.parse(draft.actions_json);
        if (!actions.length) throw Error("No supported changes in draft");
        for (const a of actions) {
          if (a.kind === "movement") recordMovement(db, a);
          else if (a.kind === "clock") {
            const current = one(
              db,
              "SELECT value FROM settings WHERE key=?",
              "in_world_date",
            )?.value;
            if (current && a.date <= current)
              throw Error("Time draft is stale");
            db.prepare(
              "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            ).run("in_world_date", exactDate.parse(a.date));
          } else throw Error("Unsupported transaction action");
        }
        db.prepare(
          "UPDATE event_drafts SET operation='applied' WHERE id=?",
        ).run(draft.id);
        result = { id: draft.id };
        break;
      }
      default:
        throw Error("Unsupported operation");
    }
    audit(
      db,
      action,
      result?.id ?? id,
      null,
      input,
      input.explanation ||
        input.source_text ||
        "Explicit user-approved form submission",
    );
    return result;
  });
}
