import { all, one } from "./db.ts";
import type { DB, Row } from "./db.ts";
import {
  recordCatalog,
  type DomainKind,
  type DomainRecordDetails,
} from "./record-catalog.ts";

// Fixed domain tables only. A caller supplies the receipt ID, never a table or target ID.
export const recordTables: Record<DomainKind, string> = {
  office: "offices",
  vote: "votes",
  procurement: "procurement",
  asset: "assets",
  battle: "battles",
  location: "locations",
  budget: "budgets",
  ledger: "ledger",
  project: "projects",
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
const fields: Record<DomainKind, [string, string][]> = {
  office: [
    ["name", "Office"],
    ["authority", "Recorded authority"],
  ],
  vote: [
    ["date", "Vote date"],
    ["yes", "Yes"],
    ["no", "No"],
    ["abstain", "Abstentions"],
    ["absent", "Absences"],
    ["vacancies", "Vacancies"],
    ["threshold", "Recorded threshold"],
    ["rule_source", "Voting rule authority"],
    ["result", "Recorded result"],
    ["breakdown", "Recorded breakdown"],
  ],
  procurement: [
    ["name", "Procurement"],
    ["date", "Observation date"],
    ["ordered", "Ordered count"],
    ["delivered", "Delivered count"],
    ["operational", "Operational count"],
    ["operation", "Recorded stage"],
  ],
  asset: [
    ["name", "Asset"],
    ["type", "Asset type"],
    ["operation", "Stored condition or stage"],
  ],
  battle: [
    ["name", "Engagement"],
    ["theater", "Theater"],
    ["outcome", "Recorded outcome"],
    ["canon", "Canon status"],
  ],
  location: [
    ["name", "Location"],
    ["kind", "Location type"],
    ["latitude", "Recorded latitude"],
    ["longitude", "Recorded longitude"],
    ["sovereignty", "Sovereignty"],
    ["control", "Control"],
    ["administration", "Administration"],
  ],
  budget: [
    ["name", "Program"],
    ["fiscal_year", "Fiscal year"],
    ["currency", "Currency"],
    ["appropriated", "Stored appropriation, whole currency units"],
  ],
  ledger: [
    ["budget_name", "Appropriation or program"],
    ["date", "Transaction date"],
    ["stage", "Accounting stage"],
    ["amount", "Amount, whole currency units"],
    ["currency", "Currency"],
    ["reference", "Recorded reference"],
    ["memo", "Purpose"],
    ["override_reason", "Override authority"],
  ],
  project: [
    ["name", "Program"],
    ["operation", "Recorded stage"],
    ["planned", "Source-reported cost, whole currency units"],
    ["approved", "Source-reported approved amount"],
    ["paid", "Source-reported paid amount"],
    ["committed", "Source-reported remaining commitment"],
    ["currency", "Currency"],
    ["notes", "Source notes"],
  ],
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

/** Fixed joined read queries also supply names to search. No names are used to join identities. */
export const recordQueries = Object.fromEntries(
  Object.entries(recordTables).map(([kind, table]) => [
    kind,
    `SELECT r.* FROM ${table} r`,
  ]),
) as Record<DomainKind, string>;
recordQueries.appointment =
  "SELECT r.*,e.name person_name,o.name office_name FROM appointments r JOIN entities e ON e.id=r.person_id JOIN offices o ON o.id=r.office_id";
recordQueries.deployment =
  "SELECT r.*,u.name unit_name,l.name location_name FROM movements r JOIN units u ON u.id=r.unit_id JOIN locations l ON l.id=r.location_id";
recordQueries.ledger =
  "SELECT r.*,b.name budget_name,b.currency,x.reference FROM ledger r JOIN budgets b ON b.id=r.budget_id LEFT JOIN ledger_report_records x ON x.ledger_id=r.id";
recordQueries.bill =
  "SELECT r.*,s.person_id sponsor_id,e.name sponsor_name FROM bills r LEFT JOIN bill_sponsors s ON s.bill_id=r.id LEFT JOIN entities e ON e.id=s.person_id";
recordQueries.vote =
  "SELECT r.*,b.identifier bill_reference,b.title bill_title FROM votes r JOIN bills b ON b.id=r.bill_id";
export function domainRecordTitle(kind: DomainKind, row: Row): string {
  if (kind === "appointment")
    return `${text(row.person_name)} — ${text(row.office_name)}`;
  if (kind === "deployment")
    return `${text(row.unit_name)} → ${text(row.location_name)}`;
  if (kind === "ledger")
    return `${text(row.budget_name)} · ${text(row.stage)} · ${text(row.amount)} ${text(row.currency)}`;
  if (kind === "vote")
    return `${text(row.bill_reference)} · ${text(row.date)} · ${text(row.result)}`;
  return text(row.name ?? row.title ?? recordCatalog[kind].title);
}
/** Read an exact domain identity. It does not apply receipt effects or resolve an as-of snapshot. */
export function domainRecordDetails(
  db: DB,
  kind: DomainKind,
  id: string,
): DomainRecordDetails {
  if (!Object.hasOwn(recordCatalog, kind))
    throw Error("Unsupported record type");
  const row = one(db, recordQueries[kind] + " WHERE r.id=?", id);
  if (!row)
    throw Error(
      "The record is unavailable. Preserved receipts and evidence are not changed.",
    );
  const result: DomainRecordDetails = {
    id: row.id,
    kind,
    type: recordCatalog[kind].title,
    note: recordCatalog[kind].note,
    title: domainRecordTitle(kind, row),
    fields: fields[kind].map(([key, label]) => ({
      label,
      value:
        typeof row[key] === "number" &&
        [
          "amount",
          "appropriated",
          "planned",
          "approved",
          "paid",
          "committed",
        ].includes(key)
          ? row[key].toLocaleString("en-US", { maximumFractionDigits: 20 })
          : text(row[key]),
    })),
    links: [],
    evidence: all(
      db,
      "SELECT DISTINCT c.source_id,s.filename,c.line_start,c.line_end FROM record_draft_citations c JOIN record_drafts d ON d.id=c.draft_id JOIN sources s ON s.id=c.source_id WHERE d.kind=? AND d.target_id=? AND d.status='saved' ORDER BY c.source_id,c.line_start",
      kind,
      row.id,
    ),
    currentSource: row.source_id
      ? (one<{ id: string; filename: string }>(
          db,
          "SELECT id,filename FROM sources WHERE id=?",
          row.source_id,
        ) ?? null)
      : null,
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
  if (["person", "institution", "organization"].includes(kind))
    link("entity", row.id, "Archive identity");
  if (kind === "unit") link("unit", row.id, "Formation profile");
  if (kind === "bill") {
    const sponsor = one(
      db,
      "SELECT person_id FROM bill_sponsors WHERE bill_id=?",
      row.id,
    );
    if (sponsor) link("entity", sponsor.person_id, "Sponsor");
  }
  if (kind === "appointment") {
    link("entity", row.person_id, "Appointed person");
    result.fields.unshift({
      label: "Office",
      value: text(
        one(db, "SELECT name FROM offices WHERE id=?", row.office_id)?.name,
      ),
    });
  }
  if (kind === "deployment") {
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
  }
  const related: Row[] =
    kind === "historical_event"
      ? all(
          db,
          "SELECT entity_id FROM timeline_entities WHERE timeline_id=? ORDER BY entity_id",
          row.id,
        )
      : kind === "treaty"
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
      kind === "treaty" ? "Participating state" : "Related identity",
    );
  function domainLink(linkKind: DomainKind, id: string, relationship: string) {
    const related = one(db, recordQueries[linkKind] + " WHERE r.id=?", id);
    if (related)
      result.links.push({
        kind: linkKind,
        id,
        label: domainRecordTitle(linkKind, related),
        relationship,
      });
  }
  if (kind === "appointment")
    domainLink("office", row.office_id, "Office record");
  if (kind === "deployment")
    domainLink("location", row.location_id, "Destination record");
  if (kind === "ledger")
    domainLink("budget", row.budget_id, "Appropriation record");
  if (kind === "vote") domainLink("bill", row.bill_id, "Bill record");
  if (kind === "office") {
    const appointments = all(
      db,
      recordQueries.appointment + " WHERE r.office_id=? ORDER BY r.id",
      row.id,
    );
    result.links.push(
      ...appointments.map((r) => ({
        kind: "appointment" as const,
        id: r.id,
        label: domainRecordTitle("appointment", r),
        relationship: "Recorded appointment (all dates)",
      })),
    );
  }
  if (kind === "budget") {
    const transactions = all(
      db,
      recordQueries.ledger + " WHERE r.budget_id=? ORDER BY r.date,r.id",
      row.id,
    );
    result.links.push(
      ...transactions.map((r) => ({
        kind: "ledger" as const,
        id: r.id,
        label: domainRecordTitle("ledger", r),
        relationship: "Recorded transaction (all dates)",
      })),
    );
  }
  if (kind === "ledger")
    result.evidence.push(
      ...all<DomainRecordDetails["evidence"][number]>(
        db,
        "SELECT e.source_id,s.filename,e.line_start,e.line_end FROM ledger_report_evidence e JOIN sources s ON s.id=e.source_id WHERE e.ledger_id=? ORDER BY e.source_id,e.line_start",
        row.id,
      ),
    );
  if (kind === "bill")
    result.evidence.push(
      ...all<DomainRecordDetails["evidence"][number]>(
        db,
        "SELECT DISTINCT e.source_id,s.filename,e.line_start,e.line_end FROM bill_event_evidence e JOIN bill_events b ON b.id=e.event_id JOIN sources s ON s.id=e.source_id WHERE b.bill_id=? ORDER BY e.source_id,e.line_start",
        row.id,
      ),
    );
  if (kind === "battle")
    result.evidence.push(
      ...all<DomainRecordDetails["evidence"][number]>(
        db,
        "SELECT DISTINCT e.source_id,s.filename,e.line_start,e.line_end FROM battle_report_evidence e JOIN battle_report_records b ON b.id=e.record_id JOIN sources s ON s.id=e.source_id WHERE b.battle_id=? ORDER BY e.source_id,e.line_start",
        row.id,
      ),
    );
  result.evidence = result.evidence.filter(
    (e, i, list) =>
      list.findIndex(
        (other) =>
          other.source_id === e.source_id &&
          other.line_start === e.line_start &&
          other.line_end === e.line_end,
      ) === i,
  );
  return result;
}
