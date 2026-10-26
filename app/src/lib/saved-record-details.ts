import { all, one } from "./db.ts";
import type { DB, Row } from "./db.ts";
import { recordDraft } from "./record-drafts.ts";
import { guidedDefinition } from "./record-registry.ts";
import type { GuidedKind, SavedRecordDetails } from "./record-registry.ts";

// Fixed domain tables only. A caller supplies the receipt ID, never a table or target ID.
const tables: Record<GuidedKind, string> = {
  person: "entities",
  institution: "entities",
  organization: "entities",
  bill: "bills",
  appointment: "appointments",
  unit: "units",
  deployment: "movements",
  treaty: "treaties",
  historical_event: "timeline",
};
const fields: Record<GuidedKind, [string, string][]> = {
  person: [
    ["name", "Name"],
    ["description", "Recorded description"],
  ],
  institution: [
    ["name", "Name"],
    ["description", "Recorded description"],
  ],
  organization: [
    ["name", "Name"],
    ["description", "Recorded description"],
  ],
  bill: [
    ["identifier", "Bill reference"],
    ["title", "Title"],
    ["sponsor", "Recorded sponsor"],
    ["summary", "Summary"],
    ["introduced_date", "Introduction date"],
    ["stage", "Stored legislative stage"],
    ["effective_date", "Effective date"],
  ],
  appointment: [
    ["start_date", "Term starts"],
    ["end_date", "Term ends"],
    ["arrangement", "Arrangement"],
    ["sequence", "Recorded sequence"],
    ["canon", "Canon status"],
  ],
  unit: [
    ["name", "Formation"],
    ["branch", "Service branch"],
    ["unit_type", "Formation type"],
    ["formed_date", "Formation date"],
    ["disbanded_date", "Disbandment date"],
  ],
  deployment: [
    ["date", "Order date"],
    ["operation", "Stored movement status"],
    ["mission", "Mission or order"],
    ["completed_date", "Confirmed arrival date"],
    ["warning", "Treaty warning"],
    ["override_reason", "Override authority"],
  ],
  treaty: [
    ["name", "Agreement"],
    ["operation", "Agreement status"],
    ["terms", "Reported terms"],
    ["signatories", "Recorded signatories"],
  ],
  historical_event: [
    ["title", "Event"],
    ["category", "Historical subject"],
    ["note", "Recorded account"],
    ["canon", "Canon status"],
  ],
};
const text = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "Not recorded"
    : String(value);

/** Read the exact committed domain row and explicit relationships. Never re-apply or infer effects. */
export function savedRecordDetails(
  db: DB,
  receiptId: string,
): SavedRecordDetails {
  const draft = recordDraft(db, receiptId);
  const definition = guidedDefinition(draft.kind);
  if (draft.status !== "saved" || !draft.target_id)
    throw Error("This draft has no saved record yet.");
  const row = one(
    db,
    `SELECT * FROM ${tables[draft.kind]} WHERE id=?`,
    draft.target_id,
  );
  if (!row)
    throw Error(
      "The saved record is unavailable. Its approval receipt is still preserved.",
    );
  const result: SavedRecordDetails = {
    id: row.id,
    kind: draft.kind,
    type: definition.title,
    title: text(row.name ?? row.title ?? definition.title),
    fields: fields[draft.kind].map(([key, label]) => ({
      label,
      value: text(row[key]),
    })),
    links: [],
    evidence: all(
      db,
      "SELECT c.source_id,s.filename,c.line_start,c.line_end FROM record_draft_citations c JOIN sources s ON s.id=c.source_id WHERE c.draft_id=? ORDER BY c.source_id,c.line_start",
      draft.id,
    ),
    currentSource: row.source_id
      ? (one<{ id: string; filename: string }>(
          db,
          "SELECT id,filename FROM sources WHERE id=?",
          row.source_id,
        ) ?? null)
      : null,
    savedAt: draft.updated_at,
    approvalReason: text(
      one(db, "SELECT approval_reason FROM record_drafts WHERE id=?", draft.id)
        ?.approval_reason,
    ),
  };
  if (row.date_json) {
    const date = JSON.parse(row.date_json);
    for (const [key, label] of [
      ["label", "Historical date"],
      ["precision", "Date precision"],
      ["earliest", "Earliest bound"],
      ["latest", "Latest bound"],
      ["relation", "Relative event"],
    ])
      result.fields.push({ label, value: text(date[key]) });
  }
  function link(kind: "entity" | "unit", id: string, relationship: string) {
    const related = one(
      db,
      `SELECT id,name FROM ${kind === "entity" ? "entities" : "units"} WHERE id=?`,
      id,
    );
    if (related)
      result.links.push({
        kind,
        id: related.id,
        label: related.name,
        relationship,
      });
    else
      result.fields.push({
        label: relationship,
        value: "Linked record unavailable",
      });
  }
  if (["person", "institution", "organization"].includes(draft.kind))
    link("entity", row.id, "Archive identity");
  if (draft.kind === "unit") link("unit", row.id, "Formation profile");
  if (draft.kind === "bill") {
    const sponsor = one(
      db,
      "SELECT person_id FROM bill_sponsors WHERE bill_id=?",
      row.id,
    );
    if (sponsor) link("entity", sponsor.person_id, "Sponsor");
  }
  if (draft.kind === "appointment") {
    link("entity", row.person_id, "Appointed person");
    result.fields.unshift({
      label: "Office",
      value: text(
        one(db, "SELECT name FROM offices WHERE id=?", row.office_id)?.name,
      ),
    });
    result.title = `${result.links[0]?.label ?? "Person unavailable"} — ${result.fields[0].value}`;
  }
  if (draft.kind === "deployment") {
    link("unit", row.unit_id, "Ordered formation");
    const location = one(
      db,
      "SELECT name FROM locations WHERE id=?",
      row.location_id,
    );
    result.fields.unshift({
      label: "Destination",
      value: text(location?.name),
    });
    result.title = `${result.links[0]?.label ?? "Formation unavailable"} → ${text(location?.name)}`;
  }
  const related: Row[] =
    draft.kind === "historical_event"
      ? all(
          db,
          "SELECT entity_id FROM timeline_entities WHERE timeline_id=? ORDER BY entity_id",
          row.id,
        )
      : draft.kind === "treaty"
        ? all(
            db,
            "SELECT entity_id FROM treaty_participants WHERE treaty_id=? ORDER BY entity_id",
            row.id,
          )
        : [];
  for (const r of related)
    link(
      "entity",
      r.entity_id,
      draft.kind === "treaty" ? "Participating state" : "Related identity",
    );
  return result;
}
