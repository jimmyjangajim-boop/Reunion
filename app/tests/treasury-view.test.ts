import { describe, it, expect } from "vitest";
import {
  treasuryView,
  money,
  type TreasuryFact,
  type TreasuryProject,
} from "../src/lib/treasury-view.ts";
const fact = (
  predicate: string,
  value: string,
  canon = "confirmed",
): TreasuryFact => ({
  id: predicate,
  entity_id: "treasury",
  predicate,
  value,
  canon,
  category: "economic",
  scope: "point",
  valid_from: "1992-10-03",
  valid_to: "1992-10-03",
});
const project = (precision: string, label: string): TreasuryProject => ({
  id: label,
  name: label,
  date_json: JSON.stringify({ precision, label }),
  currency: "USD",
  operation: "unknown",
  planned: 100,
  approved: null,
  committed: 20,
  paid: 0,
});
describe("Treasury read model", () => {
  it("derives projections and shares from dated figures without booking spending or debt", () => {
    const v = treasuryView(
      "1992-10-03",
      [
        fact("Annual expenditure envelope", "$255B USD"),
        fact("Annual revenue", "Approximately $160B USD"),
        fact("1992 budget totals", "$255B annual framework; $82B defense"),
        fact("Public debt", "Approximately $120B USD"),
      ],
      [],
      [],
    );
    expect(v.deficit).toBe(95e9);
    expect(v.defenseShare).toBeCloseTo(82 / 255);
    expect(v.debt).toBe(120e9);
  });
  it("never substitutes undated canon or malformed, disputed, conflicting and incompatible values", () => {
    const disputed = treasuryView(
      "1992-10-04",
      [
        fact("Nominal GDP", "$400B USD", "disputed"),
        fact("Public debt", "16.8 million Corona"),
      ],
      [],
      [],
    );
    expect(disputed.gdp).toBeNull();
    expect(disputed.debt).toBeNull();
    expect(
      treasuryView(
        "1992-10-03",
        [
          fact("Annual revenue", "$160B USD"),
          fact("Annual revenue", "$170B USD"),
        ],
        [],
        [],
      ).revenue,
    ).toBeNull();
    expect(treasuryView("1992-10-04", [], [], []).deficit).toBeNull();
  });
  it("rejects undated and out-of-window headline inputs even if passed by a caller", () => {
    const r = fact("Annual expenditure envelope", "$255B USD");
    expect(treasuryView("1992-10-04", [r], [], []).expenditure).toBeNull();
    expect(
      treasuryView(
        "1992-10-03",
        [{ ...r, scope: "undated", valid_from: null, valid_to: null }],
        [],
        [],
      ).expenditure,
    ).toBeNull();
  });
  it("shows project observations within their precision window without carrying them forward", () => {
    const rows = [
      project("day", "1992-10-03"),
      project("month", "1992-10"),
      project("unknown", "Unknown"),
      project("day", "1993-01-01"),
    ];
    const v = treasuryView("1992-10-04", [], rows, []);
    expect(v.projects.map((p) => p.id)).toEqual(["1992-10"]);
    expect(v.uncertainProjects).toHaveLength(1);
  });
  it("filters future and undated transactions while retaining explicit zero and separate stages", () => {
    const ledger = [
      {
        id: "1",
        budget_id: "USD",
        date: "1992-10-03",
        stage: "committed",
        amount: 20,
      },
      {
        id: "2",
        budget_id: "RMC",
        date: "1992-10-04",
        stage: "disbursed",
        amount: 30,
      },
      { id: "3", budget_id: "USD", date: "", stage: "actual", amount: 0 },
    ];
    expect(treasuryView("1992-10-03", [], [], ledger).ledger).toEqual([
      ledger[0],
    ]);
    expect(money(0)).toBe("USD 0");
    expect(money(null)).toBe("Not established");
  });
});
