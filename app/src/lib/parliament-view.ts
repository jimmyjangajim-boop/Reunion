import { bounds, historicalDateSchema } from "./dates.ts";
import { archiveOnly } from "./administration-view.ts";
export interface Chamber {
  id: string;
  date: string;
  actual_seats: number;
  occupied_seats: number | null;
  legal_min: number | null;
  legal_max: number | null;
  session_status: string;
  source_id?: string;
}
export interface PartySeats {
  id: string;
  chamber_id: string;
  party: string;
  seats: number;
  support: string;
  source_id?: string;
}
export interface Bill {
  id: string;
  identifier: string;
  title: string;
  sponsor: string | null;
  summary: string;
  stage: string;
  introduced_date: string | null;
  effective_date: string | null;
  source_id?: string;
  sponsor_id?: string | null;
}
export interface BillEvent {
  id: string;
  bill_id: string;
  identifier?: string;
  stage: string;
  date: string | null;
  effective_date: string | null;
  evidence?: {
    source_id: string;
    line_start: number;
    line_end: number;
    report_action_id?: string;
  }[];
}
export interface Vote {
  id: string;
  bill_id: string;
  chamber_id: string;
  date: string;
  yes: number;
  no: number;
  abstain: number;
  absent: number;
  vacancies: number;
  threshold: number | null;
  rule_source: string;
  result: string;
}
export interface ParliamentEvent {
  id: string;
  title: string;
  category: string;
  canon: string;
  operation: string;
  date_json: string;
  source_id?: string;
  line_start?: number;
  line_end?: number;
  note?: string;
  related_entities?: { entity_id: string }[];
}
export const partyColors = [
  "#365c82",
  "#9a593e",
  "#9d803b",
  "#436a59",
  "#79668b",
  "#68757c",
];
export function parliamentView(
  date: string,
  chambers: Chamber[],
  parties: PartySeats[],
) {
  const matches = chambers.filter((c) => c.date === date);
  const chamber = matches.length === 1 ? matches[0] : null;
  const seats = chamber
    ? parties.filter((p) => p.chamber_id === chamber.id)
    : [];
  const total = seats.reduce((n, p) => n + p.seats, 0);
  const valid =
    !!chamber &&
    Number.isSafeInteger(chamber.actual_seats) &&
    chamber.actual_seats > 0 &&
    chamber.actual_seats <= 2000 &&
    seats.every((p) => Number.isSafeInteger(p.seats) && p.seats >= 0) &&
    new Set(seats.map((p) => p.party)).size === seats.length &&
    total === chamber.actual_seats;
  return {
    chamber,
    parties: seats,
    total,
    valid,
    ambiguous: matches.length > 1,
  };
}
/** One dot per recorded seat; layout order is presentational, not ideology or named membership. */
export function hemicycle(count: number) {
  if (!Number.isSafeInteger(count) || count <= 0 || count > 2000) return [];
  const rows = Math.min(12, Math.max(1, Math.ceil(Math.sqrt(count) / 2.5)));
  const weight = Array.from({ length: rows }, (_, i) => i + 4),
    sum = weight.reduce((a, b) => a + b, 0);
  const sizes = weight.map((w) => Math.floor((count * w) / sum));
  const order = weight
    .map((w, i) => ({ i, f: (count * w) / sum - sizes[i] }))
    .sort((a, b) => b.f - a.f || a.i - b.i);
  for (
    let i = 0, left = count - sizes.reduce((a, b) => a + b, 0);
    i < left;
    i++
  )
    sizes[order[i].i]++;
  return sizes
    .flatMap((n, row) =>
      Array.from({ length: n }, (_, i) => {
        const angle = n === 1 ? Math.PI / 2 : Math.PI - (i * Math.PI) / (n - 1);
        const radius = rows === 1 ? 200 : 85 + (155 * row) / (rows - 1);
        return {
          x: 260 + radius * Math.cos(angle),
          y: 260 - radius * Math.sin(angle),
          angle,
          radius,
        };
      }),
    )
    .sort((a, b) => b.angle - a.angle || a.radius - b.radius);
}
const stages = ["considering", "introduced", "passed", "enacted"];
export function billAtDate(bill: Bill, events: BillEvent[], date: string) {
  const dated = events.filter(
    (e) =>
      e.bill_id === bill.id &&
      e.date !== null &&
      e.date <= date &&
      stages.includes(e.stage),
  );
  dated.sort(
    (a, b) =>
      stages.indexOf(b.stage) - stages.indexOf(a.stage) ||
      (b.date ?? "").localeCompare(a.date ?? ""),
  );
  const last = dated[0];
  return {
    visible: !!last || !!(bill.introduced_date && bill.introduced_date <= date),
    stage:
      last?.stage ??
      (bill.introduced_date && bill.introduced_date <= date
        ? "Introduction recorded"
        : "Not established"),
    effective: last?.stage === "enacted" ? last.effective_date : null,
    events: dated,
  };
}
export function parliamentaryEvents(rows: ParliamentEvent[], date: string) {
  return rows
    .filter((r) => {
      if (archiveOnly(r) || ["superseded", "rejected"].includes(r.canon))
        return false;
      if (
        !(
          /parliament|assembly|legislat|constitutional/i.test(r.title) ||
          r.related_entities?.some((e) => e.entity_id === "parliament")
        )
      )
        return false;
      try {
        const [lo, hi] = bounds(
          historicalDateSchema.parse(JSON.parse(r.date_json)),
        );
        return lo !== null && hi !== null && hi <= date;
      } catch {
        return false;
      }
    })
    .sort((a, b) =>
      (
        bounds(historicalDateSchema.parse(JSON.parse(b.date_json)))[1] ?? ""
      ).localeCompare(
        bounds(historicalDateSchema.parse(JSON.parse(a.date_json)))[1] ?? "",
      ),
    );
}
