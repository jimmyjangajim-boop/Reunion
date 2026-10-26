import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { all, one, audit, transaction } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { applyAdminAction } from "./admin.ts";
import { insertEntity, insertTimelineEntry } from "./record-commands.ts";
import { addAssertion } from "./canon.ts";
import { dateValue, exactDate } from "./dates.ts";
import { recordEvidence } from "./record-evidence.ts";
import { guidedDefinition } from "./record-registry.ts";
import type {
  GuidedKind,
  RecordReview,
  RecordDraft,
} from "./record-registry.ts";

const text = z.string().trim().min(1).max(20000),
  optional = z.string().max(20000).default("");
const common = {
  source_text: optional,
  source_id: optional,
  line_start: optional,
  line_end: optional,
  date_precision: z
    .enum(["unknown", "day", "month", "year", "range", "relative"])
    .default("unknown"),
  date_label: z.string().max(1000).default("Unknown"),
  earliest: optional,
  latest: optional,
};
const ids = z.array(z.string().min(1)).max(100).default([]);
const schemas = {
  person: z.object({
    ...common,
    name: text,
    description: optional,
    canon: z.enum(["provisional", "confirmed", "disputed"]),
  }),
  institution: z.object({
    ...common,
    name: text,
    description: optional,
    canon: z.enum(["provisional", "confirmed", "disputed"]),
  }),
  organization: z.object({
    ...common,
    name: text,
    description: optional,
    canon: z.enum(["provisional", "confirmed", "disputed"]),
  }),
  bill: z.object({
    ...common,
    identifier: text,
    title: text,
    summary: text,
    date: text,
    sponsor_id: optional,
    new_sponsor_name: optional,
  }),
  appointment: z.object({
    ...common,
    office_id: text,
    person_id: optional,
    new_person_name: optional,
    date: optional,
    arrangement: z.enum(["exclusive", "acting", "joint"]),
    reshuffle: z.enum(["", "yes"]).default(""),
    explanation: text,
  }),
  unit: z.object({ ...common, name: text, branch: text, unit_type: text }),
  deployment: z.object({
    ...common,
    unit_id: text,
    location_id: text,
    date: text,
    operation: z.enum(["planned", "ordered"]),
    mission: text,
    override_reason: optional,
  }),
  treaty: z.object({
    ...common,
    name: text,
    terms: text,
    operation: z.enum(["proposal", "approved", "completed", "canceled"]),
    participant_ids: ids,
    new_nation_name: optional,
  }),
  historical_event: z.object({
    ...common,
    title: text,
    category: z.enum([
      "history",
      "political",
      "military",
      "economic",
      "diplomatic",
      "domestic",
      "territory",
      "constitutional",
    ]),
    canon: z.enum(["provisional", "confirmed", "disputed"]),
    description: text,
    related_ids: ids,
    new_related_name: optional,
    new_related_kind: z
      .enum(["person", "institution", "organization", "place", "nation"])
      .default("person"),
  }),
} satisfies Record<GuidedKind, z.ZodType>;

function dateInfo(p: Row) {
  for (const bound of [p.earliest, p.latest]) {
    if (bound?.length === 10) exactDate.parse(bound);
    if (bound?.length === 7) dateValue("month", bound);
  }
  return dateValue(
    p.date_precision,
    p.date_precision === "unknown" ? "Unknown" : p.date_label,
    p.earliest || null,
    p.latest || null,
  );
}
function entity(db: DB, id: string, kind?: string) {
  const row = one(db, "SELECT * FROM entities WHERE id=?", id);
  if (!row || (kind && row.kind !== kind))
    throw Error("Select an existing " + (kind || "related entity"));
  return row;
}
function suppliedEntity(db: DB, name: string, kind: string) {
  if (
    one(
      db,
      "SELECT 1 FROM entities WHERE lower(name)=lower(?) AND kind=?",
      name.trim(),
      kind,
    )
  )
    throw Error(
      "An entity with this name already exists. Select the existing record.",
    );
  return insertEntity(db, { name, kind, description: "" }).id;
}

/** Only this operation writes guided draft effects, always in a caller transaction. */
function applyDraft(db: DB, kind: GuidedKind, p: Row) {
  const evidence = recordEvidence(db, p),
    input = { ...p, ...evidence };
  let id: string;
  if (kind === "person" || kind === "institution" || kind === "organization") {
    id = suppliedEntity(db, p.name, kind);
    db.prepare("UPDATE entities SET description=? WHERE id=?").run(
      p.description,
      id,
    );
    addAssertion(db, {
      entity_id: id,
      predicate: "Historical record",
      value: p.description || p.name,
      category: "history",
      canon: p.canon,
      operation: "unknown",
      date: dateInfo(p),
      scope: "point",
      ...evidence,
    });
  } else if (kind === "historical_event") {
    const related = [...new Set(p.related_ids as string[])];
    for (const linked of related) entity(db, linked);
    if (p.new_related_name)
      related.push(suppliedEntity(db, p.new_related_name, p.new_related_kind));
    id = insertTimelineEntry(db, {
      title: p.title,
      category: p.category,
      canon: p.canon,
      date: dateInfo(p),
      ...evidence,
    }).id;
    db.prepare("UPDATE timeline SET note=? WHERE id=?").run(p.description, id);
    for (const linked of related)
      db.prepare("INSERT INTO timeline_entities VALUES(?,?)").run(id, linked);
  } else if (kind === "treaty") {
    const participants = [...new Set(p.participant_ids as string[])];
    for (const linked of participants) entity(db, linked, "nation");
    if (p.new_nation_name)
      participants.push(suppliedEntity(db, p.new_nation_name, "nation"));
    const signatories = participants
      .map((linked) => entity(db, linked).name)
      .join("; ");
    id = applyAdminAction(db, {
      ...input,
      action: "treaty",
      date_info: dateInfo(p),
      signatories,
    }).id;
    for (const linked of participants)
      db.prepare("INSERT INTO treaty_participants VALUES(?,?)").run(id, linked);
  } else {
    id = applyAdminAction(db, {
      ...input,
      action: kind === "deployment" ? "movement" : kind,
      date_info: dateInfo(p),
    }).id;
  }
  return { id, evidence };
}

const stateTables = [
  "entities",
  "offices",
  "appointments",
  "bills",
  "units",
  "unit_states",
  "locations",
  "movements",
  "treaties",
  "restrictions",
  "timeline",
  "bill_sponsors",
  "treaty_participants",
  "timeline_entities",
];
function token(db: DB, draft: Row) {
  // Excludes draft/audit writes so unrelated draft saves cannot invalidate a review.
  return createHash("sha256")
    .update(
      JSON.stringify({
        kind: draft.kind,
        payload: draft.payload_json,
        revision: draft.revision,
        state: stateTables.map((table) => {
          const order = [
            "bill_sponsors",
            "treaty_participants",
            "timeline_entities",
          ].includes(table)
            ? "1,2"
            : "id";
          return all(db, `SELECT * FROM ${table} ORDER BY ${order}`);
        }),
      }),
    )
    .digest("hex");
}
export function recordDraft(
  db: DB,
  id: string,
): RecordDraft & { payload_json: string } {
  const row = one<RecordDraft & { payload_json: string }>(
    db,
    "SELECT * FROM record_drafts WHERE id=?",
    z.string().min(1).parse(id),
  );
  if (!row) throw Error("Draft not found");
  return { ...row, payload: JSON.parse(row.payload_json) };
}
export function listRecordDrafts(db: DB) {
  return all(
    db,
    "SELECT id,kind,status,revision,target_id,updated_at,COALESCE(json_extract(payload_json,'$.title'),json_extract(payload_json,'$.name'),kind) title FROM record_drafts ORDER BY updated_at DESC,rowid DESC LIMIT 100",
  );
}
export function saveRecordDraft(db: DB, input: unknown) {
  const data = z
    .object({
      id: z.string().optional(),
      revision: z.number().int().positive().optional(),
      kind: z.string(),
      payload: z.record(
        z.string(),
        z.union([
          z.string().max(20000),
          z.array(z.string().max(1000)).max(100),
        ]),
      ),
    })
    .parse(input);
  guidedDefinition(data.kind);
  const payload = JSON.stringify(data.payload);
  if (Buffer.byteLength(payload) > 150000) throw Error("Draft is too large");
  return transaction(db, () => {
    const id = data.id ?? randomUUID();
    if (data.id) {
      const old = recordDraft(db, id);
      if (old.status !== "draft")
        throw Error("Saved records cannot be edited as drafts");
      if (old.revision !== data.revision)
        throw Error(
          "Draft changed in another window. Reopen it before editing.",
        );
      if (old.kind !== data.kind)
        throw Error("A draft's record type cannot change");
      db.prepare(
        "UPDATE record_drafts SET payload_json=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(payload, id);
    } else
      db.prepare(
        "INSERT INTO record_drafts(id,kind,payload_json) VALUES(?,?,?)",
      ).run(id, data.kind, payload);
    audit(
      db,
      "save_record_draft",
      id,
      null,
      { kind: data.kind, revision: recordDraft(db, id).revision },
      "Draft only; no national records changed",
    );
    return recordDraft(db, id);
  });
}
function validated(draft: Row) {
  const kind = guidedDefinition(draft.kind).id;
  return {
    kind,
    p: schemas[kind].parse(JSON.parse(draft.payload_json)) as Row,
  };
}
function describe(
  db: DB,
  kind: GuidedKind,
  p: Row,
): Omit<RecordReview, "token"> {
  const fields: { label: string; value: string }[] = [];
  const links: string[] = [],
    unknowns: string[] = [],
    changes: string[] = [];
  const field = (label: string, value: unknown) => {
    fields.push({ label, value: String(value || "Not recorded") });
    if (!value) unknowns.push(label + " is not recorded.");
  };
  field(
    "Record",
    p.title ||
      p.name ||
      (kind === "appointment"
        ? one(db, "SELECT name FROM offices WHERE id=?", p.office_id)?.name
        : one(db, "SELECT name FROM units WHERE id=?", p.unit_id)?.name),
  );
  field("Historical date", p.date || dateInfo(p).label);
  if (p.earliest) field("Earliest known bound", p.earliest);
  if (p.latest) field("Latest known bound", p.latest);
  if (!p.date && p.date_precision === "unknown")
    unknowns.push("The historical effective date remains unknown.");
  if (p.description) field("Description", p.description);
  if (kind === "bill") {
    field("Bill identifier", p.identifier);
    field("Summary", p.summary);
    links.push(
      p.sponsor_id
        ? "Sponsor: " + entity(db, p.sponsor_id, "person").name
        : p.new_sponsor_name
          ? "New sponsor: " + p.new_sponsor_name
          : "Sponsor not recorded",
    );
    changes.push(
      "Create a bill in draft stage. No vote, passage or enactment is recorded.",
    );
  }
  if (kind === "appointment") {
    field("Arrangement", p.arrangement);
    field("Appointment authority", p.explanation);
    links.push(
      p.person_id
        ? "Appointee: " + entity(db, p.person_id, "person").name
        : "New appointee: " + p.new_person_name,
    );
    changes.push(
      p.reshuffle === "yes"
        ? "Create appointment; close preceding eligible exclusive terms on the day before this appointment."
        : "Create appointment; no prior term will be closed.",
    );
  }
  if (kind === "deployment") {
    field("Order status", p.operation);
    field("Mission", p.mission);
    field("Override reason", p.override_reason);
    links.push(
      "Formation: " +
        one(db, "SELECT name FROM units WHERE id=?", p.unit_id)?.name,
      "Location: " +
        one(db, "SELECT name FROM locations WHERE id=?", p.location_id)?.name,
    );
    changes.push(
      "Create movement order. No arrival, personnel or equipment change is inferred.",
    );
  }
  if (kind === "unit") {
    field("Service branch", p.branch);
    field("Formation type", p.unit_type);
    changes.push(
      "Create formation identity. No strength, hierarchy, readiness or formation date is inferred.",
    );
    unknowns.push(
      "Formation date, personnel and readiness are not established by this identity record.",
    );
  }
  if (kind === "treaty") {
    field("Agreement status", p.operation);
    field("Terms", p.terms);
    for (const linked of p.participant_ids)
      links.push("Participating state: " + entity(db, linked, "nation").name);
    if (p.new_nation_name)
      links.push("Create and link state: " + p.new_nation_name);
    if (!links.length) unknowns.push("Participating states remain unrecorded.");
    changes.push(
      "Create treaty and participant links. No movement restriction, territory or financial change is inferred.",
    );
  }
  if (kind === "historical_event") {
    field("Historical category", p.category);
    for (const linked of p.related_ids)
      links.push("Related entity: " + entity(db, linked).name);
    if (p.new_related_name)
      links.push(
        "Create and link " + p.new_related_kind + ": " + p.new_related_name,
      );
    changes.push(
      "Create a sourced timeline event and explicit entity links. Related department records will not change.",
    );
  }
  if (["person", "institution", "organization"].includes(kind))
    changes.push(
      "Create identity and a sourced historical record. No office, affiliation or biography is inferred.",
    );
  if (p.canon) field("Canon status", p.canon);
  if (p.source_id) {
    const source = one(
      db,
      "SELECT filename FROM sources WHERE id=?",
      p.source_id,
    );
    field(
      "Evidence",
      `${source?.filename}, lines ${p.line_start}–${p.line_end}`,
    );
  } else field("Original evidence", p.source_text);
  return {
    title: guidedDefinition(kind).title,
    fields,
    links,
    changes,
    unknowns,
    approval:
      kind === "appointment"
        ? "Final save explicitly approves this appointment. Unknown dates remain unknown."
        : p.canon
          ? `Final save records your explicit ${p.canon} canon choice; it does not supersede existing claims.`
          : "Final save authorizes only the listed administrative record. It does not approve additional historical outcomes.",
  };
}
export function reviewRecordDraft(db: DB, id: string) {
  const draft = recordDraft(db, id);
  if (draft.status !== "draft") throw Error("This record is already saved");
  const { kind, p } = validated(draft);
  const review = describe(db, kind, p);
  // Exercise the same domain validations and triggers, then roll back every effect.
  db.exec("BEGIN IMMEDIATE");
  try {
    applyDraft(db, kind, p);
  } finally {
    db.exec("ROLLBACK");
  }
  return { ...review, token: token(db, draft), revision: draft.revision };
}
export function recordReceipt(db: DB, id: string) {
  const draft = recordDraft(db, id);
  if (draft.status !== "saved") return null;
  const { kind, p } = validated(draft);
  return { ...describe(db, kind, p), token: "" };
}
export function commitRecordDraft(db: DB, input: unknown) {
  const data = z
    .object({
      id: z.string().min(1),
      revision: z.number().int().positive(),
      token: z.string().length(64),
      reason: z.string().trim().min(3).max(20000),
    })
    .parse(input);
  return transaction(db, () => {
    const draft = recordDraft(db, data.id);
    if (draft.status === "saved") return draft;
    if (draft.revision !== data.revision || token(db, draft) !== data.token)
      throw Error(
        "The draft or related records changed. Review the current record again before saving.",
      );
    const { kind, p } = validated(draft),
      result = applyDraft(db, kind, p);
    db.prepare("INSERT INTO record_draft_citations VALUES(?,?,?,?)").run(
      draft.id,
      result.evidence.source_id,
      result.evidence.line_start,
      result.evidence.line_end,
    );
    db.prepare(
      "UPDATE record_drafts SET status='saved',target_id=?,approval_reason=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(result.id, data.reason, draft.id);
    audit(
      db,
      "save_guided_record",
      result.id,
      { draft_id: draft.id, revision: draft.revision },
      { kind, payload: p, evidence: result.evidence },
      data.reason,
    );
    return recordDraft(db, data.id);
  });
}
