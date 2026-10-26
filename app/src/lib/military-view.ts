import { bounds, historicalDateSchema } from "./dates.ts";
import { archiveOnly } from "./administration-view.ts";
export interface MilitaryUnit {
  id: string;
  name: string;
  branch: string;
  unit_type: string;
  formed_date: string | null;
  disbanded_date: string | null;
  source_id?: string | null;
}
export interface UnitState {
  id: string;
  unit_id: string;
  date: string;
  parent_id: string | null;
  commander: string | null;
  garrison: string | null;
  personnel_low: number | null;
  personnel_high: number | null;
  authorized: number | null;
  readiness: string | null;
  mission: string | null;
  supply: string | null;
  operation: string;
  source_id?: string | null;
}
export interface UnitObservation extends MilitaryUnit {
  observed_on: string;
  state_id?: string;
  parent_id: string | null;
  commander: string | null;
  garrison?: string | null;
  personnel_low: number | null;
  personnel_high: number | null;
  authorized?: number | null;
  readiness: string | null;
  mission?: string | null;
  supply?: string | null;
  operation?: string;
  observation_source_id?: string | null;
}
export interface FormationNode {
  unit: MilitaryUnit;
  state: UnitObservation | null;
  parent: string | null;
  children: string[];
  issue: string | null;
  matches: boolean;
}
export interface Movement {
  id: string;
  unit_id: string;
  unit: string;
  location_id: string;
  location: string;
  date: string;
  operation: string;
  completed_date: string | null;
  mission: string;
  warning: string | null;
  override_reason: string | null;
  evidence?: { source_id: string; line_start: number; line_end: number }[];
  authority?: { action: string; explanation: string }[];
}
export interface MilitaryAsset {
  id: string;
  name: string;
  type: string;
  operation: string;
  source_id?: string | null;
}
export interface Assignment {
  id: string;
  asset_id: string;
  unit_id: string;
  asset: string;
  unit: string;
  start_date: string;
  end_date: string | null;
}
export interface Procurement {
  id: string;
  name: string;
  date: string;
  ordered: number;
  delivered: number;
  operational: number;
  operation: string;
  source_id?: string | null;
}
export interface MilitaryCasualty {
  id: string;
  unit_id: string | null;
  battle_id: string;
  participant_id?: string;
  report_group: string;
  category: string;
  count: number | null;
  canon: string;
  source_id?: string | null;
}
export interface MilitaryBattle {
  id: string;
  name: string;
  date_json: string;
  canon: string;
  source_id?: string | null;
}
export interface MilitaryPhase {
  id: string;
  battle_id: string;
  battle: string;
  reference: string;
  date_json: string;
  outcome: string | null;
  participants: {
    id: string;
    unit_id: string | null;
    name: string | null;
    side: string | null;
  }[];
  casualties: MilitaryCasualty[];
  losses: {
    id: string;
    unit_id: string | null;
    participant_id?: string | null;
    equipment: string;
    count: number | null;
    state: string;
  }[];
  evidence: { source_id: string; line_start: number; line_end: number }[];
}
export const recordedBy = (dateJson: string, date: string) => {
  try {
    const [lo, hi] = bounds(historicalDateSchema.parse(JSON.parse(dateJson)));
    return !!lo && !!hi && hi <= date;
  } catch {
    return false;
  }
};
export const withinUnitDates = (u: MilitaryUnit, date: string) =>
  (!u.formed_date || u.formed_date <= date) &&
  (!u.disbanded_date || u.disbanded_date >= date);
export function formationHierarchy(
  units: MilitaryUnit[],
  snapshot: UnitObservation[],
  date: string,
  query = "",
  branch = "all",
  includeAll = false,
) {
  const nodes = new Map<string, FormationNode>();
  for (const u of units) {
    if (!includeAll && !withinUnitDates(u, date)) continue;
    const state = withinUnitDates(u, date)
      ? (snapshot.find((s) => s.id === u.id && s.observed_on <= date) ?? null)
      : null;
    nodes.set(u.id, {
      unit: u,
      state,
      parent: state?.parent_id ?? null,
      children: [],
      issue: !withinUnitDates(u, date)
        ? "Outside recorded formation dates"
        : null,
      matches:
        (branch === "all" || u.branch === branch) &&
        [u.name, u.branch, u.unit_type, state?.commander, state?.garrison]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    });
  }
  for (const n of nodes.values()) {
    if (n.parent && !nodes.has(n.parent)) {
      n.issue = "Parent not available in this dated register";
      n.parent = null;
    }
    const seen = new Set([n.unit.id]);
    let cursor = n.parent;
    while (cursor) {
      if (seen.has(cursor)) {
        n.issue = "Hierarchy cycle requires source review";
        n.parent = null;
        break;
      }
      seen.add(cursor);
      cursor = nodes.get(cursor)?.state?.parent_id ?? null;
    }
  }
  const keep = new Set<string>();
  for (const n of nodes.values())
    if (n.matches) {
      let cursor: FormationNode | undefined = n;
      const seen = new Set<string>();
      while (cursor && !seen.has(cursor.unit.id)) {
        seen.add(cursor.unit.id);
        keep.add(cursor.unit.id);
        cursor = cursor.parent ? nodes.get(cursor.parent) : undefined;
      }
    }
  for (const [id] of nodes) if (!keep.has(id)) nodes.delete(id);
  for (const n of nodes.values())
    if (n.parent && nodes.has(n.parent))
      nodes.get(n.parent)!.children.push(n.unit.id);
  const compare = (a: string, b: string) =>
    nodes.get(a)!.unit.name.localeCompare(nodes.get(b)!.unit.name);
  for (const n of nodes.values()) n.children.sort(compare);
  return {
    nodes,
    roots: [...nodes.values()]
      .filter((n) => !n.parent || !nodes.has(n.parent))
      .map((n) => n.unit.id)
      .sort(compare),
    matches: [...nodes.values()].filter((n) => n.matches).length,
  };
}
export function personnelLabel(
  low: number | null | undefined,
  high: number | null | undefined,
) {
  if (low == null && high == null) return "Unknown";
  if (
    [low, high].some((n) => n != null && (!Number.isSafeInteger(n) || n < 0)) ||
    (low != null && high != null && high < low)
  )
    return "Invalid recorded range";
  if (low == null)
    return `Up to ${high!.toLocaleString("en")}; lower bound unknown`;
  if (high == null)
    return `${low.toLocaleString("en")} minimum; upper bound unknown`;
  return low === high
    ? low.toLocaleString("en")
    : `${low.toLocaleString("en")}–${high.toLocaleString("en")}`;
}
export function movementAtDate(m: Movement, date: string) {
  if (m.date > date) return null;
  if (m.operation === "completed") {
    if (!m.completed_date)
      return { status: "Completion date not recorded", arrival: null };
    return m.completed_date <= date
      ? { status: "completed", arrival: m.completed_date }
      : { status: "ordered", arrival: null };
  }
  return {
    status:
      m.operation === "canceled"
        ? "Cancellation date not recorded"
        : m.operation,
    arrival: null,
  };
}
export const activeAssignments = (rows: Assignment[], date: string) =>
  rows.filter(
    (a) => a.start_date <= date && (!a.end_date || a.end_date >= date),
  );
export function unitBattleRecords(
  unit: string,
  phases: MilitaryPhase[],
  legacy: MilitaryCasualty[],
  battles: MilitaryBattle[],
  date: string,
  all = false,
) {
  const linked = phases.filter((p) => {
    const battle = battles.find((b) => b.id === p.battle_id);
    return (
      !archiveOnly(p) &&
      !!battle &&
      !archiveOnly(battle) &&
      !["superseded", "rejected"].includes(battle.canon) &&
      (p.participants.some((x) => x.unit_id === unit) ||
        p.casualties.some((c) => c.unit_id === unit) ||
        p.losses.some((l) => l.unit_id === unit))
    );
  });
  const visible = linked.filter((p) => all || recordedBy(p.date_json, date));
  const mapped = new Set(phases.flatMap((p) => p.casualties.map((c) => c.id)));
  return {
    phases: visible.map((p) => {
      const ids = new Set(
        p.participants.filter((x) => x.unit_id === unit).map((x) => x.id),
      );
      return {
        ...p,
        casualties: p.casualties.filter(
          (c) =>
            c.unit_id === unit ||
            (c.participant_id && ids.has(c.participant_id)),
        ),
        losses: p.losses.filter(
          (l) =>
            l.unit_id === unit ||
            (l.participant_id && ids.has(l.participant_id)),
        ),
      };
    }),
    legacy: legacy.filter((c) => {
      const b = battles.find((b) => b.id === c.battle_id);
      return (
        c.unit_id === unit &&
        !mapped.has(c.id) &&
        !["superseded", "rejected"].includes(c.canon) &&
        !!b &&
        !archiveOnly(b) &&
        !["superseded", "rejected"].includes(b.canon) &&
        (all || recordedBy(b.date_json, date))
      );
    }),
    uncertain: linked.filter((p) => !recordedBy(p.date_json, date)).length,
  };
}

export const procurementObservations = (
  rows: Procurement[],
  date: string,
  all = false,
) => rows.filter((r) => all || r.date === date);
