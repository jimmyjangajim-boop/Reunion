import { bounds, historicalDateSchema } from "./dates.ts";

export interface TreasuryFact {
  id: string;
  entity_id: string;
  predicate: string;
  value: string;
  canon: string;
  scope: string;
  valid_from: string | null;
  valid_to: string | null;
  category?: string;
  notes?: string;
  evidence?: {
    source_id: string;
    line_start: number;
    line_end: number;
    filename?: string;
  }[];
}
export interface TreasuryProject {
  id: string;
  name: string;
  date_json: string;
  currency: string;
  operation: string;
  planned: number | null;
  approved: number | null;
  committed: number | null;
  paid: number | null;
  source_id?: string;
  notes?: string;
}
export interface TreasuryBudget {
  id: string;
  name: string;
  currency: string;
  fiscal_year: number;
  appropriated_asof: number;
}
export interface TreasuryEntry {
  id: string;
  budget_id: string;
  date: string;
  stage: string;
  amount: number;
  reference?: string;
  memo?: string;
  override_reason?: string;
  source_id?: string;
  evidence?: {
    source_id: string;
    line_start: number;
    line_end: number;
    report_action_id?: string;
  }[];
}
export function projectWindow(
  project: TreasuryProject,
): [string | null, string | null] {
  try {
    return bounds(historicalDateSchema.parse(JSON.parse(project.date_json)));
  } catch {
    return [null, null];
  }
}
export function treasuryView(
  date: string,
  snapshot: TreasuryFact[],
  projects: TreasuryProject[],
  ledger: TreasuryEntry[],
) {
  // The server supplies canon-resolved snapshots; enforce temporal boundaries here too.
  const facts = snapshot.filter(
    (r) =>
      r.category === "economic" &&
      r.scope !== "undated" &&
      r.valid_from !== null &&
      r.valid_from <= date &&
      (r.valid_to === null || r.valid_to >= date),
  );
  function metric(predicates: string[], pattern?: RegExp) {
    const rows = facts.filter((r) => predicates.includes(r.predicate));
    if (!rows.length || rows.some((r) => r.canon !== "confirmed")) return null;
    const values = rows.map((r) => {
      const match = r.value.match(
        pattern ?? /^(?:Approximately )?\$([\d.]+)B USD$/,
      );
      return match ? Number(match[1]) * (pattern ? 1 : 1e9) : NaN;
    });
    return values.every((v) => Number.isFinite(v) && v >= 0 && v === values[0])
      ? values[0]
      : null;
  }
  const expenditure = metric(["Annual expenditure envelope"]);
  const revenue = metric(["Annual revenue"]);
  const defense = metric(
    ["1992 budget totals"],
    /^\$[\d.]+B annual framework; \$([\d.]+)B defense$/,
  );
  // Defense extraction above is in billions; no currency conversion is inferred.
  const defenseUSD = defense === null ? null : defense * 1e9;
  return {
    facts,
    expenditure,
    revenue,
    defense: defenseUSD,
    deficit:
      expenditure !== null && revenue !== null ? expenditure - revenue : null,
    debt: metric(["Public debt"]),
    gdp: metric(["Nominal GDP"]),
    inflation: metric(["Inflation"], /^([\d.]+)%$/),
    defenseShare:
      expenditure && defenseUSD !== null && defenseUSD <= expenditure
        ? defenseUSD / expenditure
        : null,
    projects: projects.filter((p) => {
      const [lo, hi] = projectWindow(p);
      return lo !== null && lo <= date && hi !== null && hi >= date;
    }),
    uncertainProjects: projects.filter((p) => {
      const [lo, hi] = projectWindow(p);
      return (!lo || !hi) && (!lo || lo <= date);
    }),
    ledger: ledger.filter(
      (l) => /^\d{4}-\d{2}-\d{2}$/.test(l.date) && l.date <= date,
    ),
  };
}
export function money(value: number | null | undefined, currency = "USD") {
  if (value == null || !Number.isFinite(value)) return "Not established";
  return `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: 2, notation: "compact" }).format(value)}`;
}
