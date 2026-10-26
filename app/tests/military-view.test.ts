import { it, expect } from "vitest";
import {
  formationHierarchy,
  personnelLabel,
  movementAtDate,
  activeAssignments,
  unitBattleRecords,
  recordedBy,
  procurementObservations,
  type MilitaryUnit,
  type UnitObservation,
  type Movement,
  type MilitaryPhase,
} from "../src/lib/military-view.ts";
const unit = (id: string): MilitaryUnit => ({
  id,
  name: id,
  branch: "Army",
  unit_type: "Division",
  formed_date: null,
  disbanded_date: null,
});
const state = (
  id: string,
  parent_id: string | null = null,
): UnitObservation => ({
  ...unit(id),
  observed_on: "1992-10-03",
  parent_id,
  commander: null,
  personnel_low: 0,
  personnel_high: null,
  readiness: null,
});
it("retains real ancestors for a matching child and respects known unit dates", () => {
  const units = [
    unit("Headquarters"),
    unit("Child"),
    { ...unit("Future"), formed_date: "1993-01-01" },
  ];
  const tree = formationHierarchy(
    units,
    [state("Headquarters"), state("Child", "Headquarters")],
    "1992-10-03",
    "Child",
  );
  expect(tree.roots).toEqual(["Headquarters"]);
  expect(tree.nodes.get("Headquarters")!.matches).toBe(false);
  expect(tree.nodes.get("Headquarters")!.children).toEqual(["Child"]);
  expect(tree.matches).toBe(1);
  expect(formationHierarchy(units, [], "1992-10-03").nodes.has("Future")).toBe(
    false,
  );
  expect(
    formationHierarchy(units, [], "1992-10-03", "", "all", true).nodes.get(
      "Future",
    )!.state,
  ).toBeNull();
});
it("flags cyclic and missing parents without dropping records or recursive loops", () => {
  const tree = formationHierarchy(
    [unit("a"), unit("b"), unit("c")],
    [state("a", "b"), state("b", "a"), state("c", "missing")],
    "1992-10-03",
  );
  expect(tree.roots).toHaveLength(3);
  expect(tree.nodes.get("a")!.issue).toContain("cycle");
  expect(tree.nodes.get("b")!.issue).toContain("cycle");
  expect(tree.nodes.get("c")!.issue).toContain("Parent not available");
});
it("keeps last observations explicit, ignores future snapshots and preserves unknown personnel", () => {
  const tree = formationHierarchy(
    [unit("a"), unit("b")],
    [state("a"), { ...state("b"), observed_on: "1993-01-01" }],
    "1992-10-04",
  );
  expect(tree.nodes.get("a")!.state!.observed_on).toBe("1992-10-03");
  expect(tree.nodes.get("b")!.state).toBeNull();
  expect(personnelLabel(0, 0)).toBe("0");
  expect(personnelLabel(null, null)).toBe("Unknown");
  expect(personnelLabel(15000, null)).toContain("upper bound unknown");
  expect(personnelLabel(null, 200)).toContain("lower bound unknown");
  expect(personnelLabel(2, 1)).toBe("Invalid recorded range");
});
it("does not backdate arrival or create one when completion time is unknown", () => {
  const m: Movement = {
    id: "m",
    unit_id: "a",
    unit: "a",
    location_id: "l",
    location: "l",
    date: "1992-10-08",
    operation: "completed",
    completed_date: "1992-10-10",
    mission: "Test",
    warning: null,
    override_reason: null,
  };
  expect(movementAtDate(m, "1992-10-07")).toBeNull();
  expect(movementAtDate(m, "1992-10-09")).toEqual({
    status: "ordered",
    arrival: null,
  });
  expect(movementAtDate(m, "1992-10-10")).toEqual({
    status: "completed",
    arrival: "1992-10-10",
  });
  expect(
    movementAtDate({ ...m, completed_date: null }, "1992-10-10")!.status,
  ).toContain("not recorded");
  expect(
    movementAtDate({ ...m, operation: "canceled" }, "1992-10-10")!.status,
  ).toContain("not recorded");
});
it("filters assignment intervals and point procurement observations without converting orders into delivery", () => {
  const a = {
    id: "a",
    asset_id: "s",
    unit_id: "u",
    asset: "s",
    unit: "u",
    start_date: "1992-10-03",
    end_date: "1992-10-05",
  };
  expect(activeAssignments([a], "1992-10-02")).toEqual([]);
  expect(activeAssignments([a], "1992-10-05")).toEqual([a]);
  expect(activeAssignments([a], "1992-10-06")).toEqual([]);
  const p = {
    id: "p",
    name: "Ordered",
    date: "1992-10-03",
    ordered: 12,
    delivered: 0,
    operational: 0,
    operation: "ordered",
  };
  expect(procurementObservations([p], "1992-10-03")).toEqual([p]);
  expect(procurementObservations([p], "1992-10-04")).toEqual([]);
  expect(procurementObservations([p], "1992-10-04", true)[0].operational).toBe(
    0,
  );
});
it("links only supplied casualty/participant identities and never duplicates phase casualties as legacy", () => {
  const c = {
    id: "c",
    unit_id: null,
    battle_id: "b",
    participant_id: "a-participant",
    report_group: "phase1",
    category: "KIA",
    count: 0,
    canon: "confirmed",
  };
  const phase: MilitaryPhase = {
    id: "p",
    battle_id: "b",
    battle: "Battle",
    reference: "phase1",
    date_json: JSON.stringify({ precision: "day", label: "1992-10-03" }),
    outcome: null,
    participants: [
      { id: "a-participant", unit_id: "a", name: null, side: null },
      { id: "b-participant", unit_id: "b-unit", name: null, side: null },
    ],
    casualties: [
      c,
      { ...c, id: "other", participant_id: "b-participant", count: null },
    ],
    losses: [
      {
        id: "loss",
        unit_id: null,
        participant_id: "a-participant",
        equipment: "Equipment",
        count: null,
        state: "unknown",
      },
    ],
    evidence: [],
  };
  const battle = {
    id: "b",
    name: "Battle",
    date_json: phase.date_json,
    canon: "provisional",
  };
  const records = unitBattleRecords(
    "a",
    [phase],
    [{ ...c, unit_id: "a" }],
    [battle],
    "1992-10-03",
  );
  expect(records.phases[0].casualties).toEqual([c]);
  expect(records.phases[0].losses[0].count).toBeNull();
  expect(records.legacy).toEqual([]);
  expect(
    unitBattleRecords("unlinked", [phase], [], [battle], "1992-10-03").phases,
  ).toEqual([]);
  expect(
    unitBattleRecords("a", [phase], [], [battle], "1992-10-02").phases,
  ).toEqual([]);
  expect(
    unitBattleRecords(
      "a",
      [phase],
      [],
      [
        {
          ...battle,
          date_json: JSON.stringify({ precision: "day", label: "1725-01-01" }),
        },
      ],
      "1992-10-03",
      true,
    ).phases,
  ).toEqual([]);
});
it("does not give imprecise phases an invented exact day", () => {
  expect(
    recordedBy(
      JSON.stringify({ precision: "month", label: "1992-10" }),
      "1992-10-03",
    ),
  ).toBe(false);
  expect(
    recordedBy(
      JSON.stringify({ precision: "month", label: "1992-10" }),
      "1992-10-31",
    ),
  ).toBe(true);
  expect(
    recordedBy(
      JSON.stringify({ precision: "relative", label: "After the ceasefire" }),
      "1992-10-31",
    ),
  ).toBe(false);
});
