import { it, expect } from "vitest";
import {
  filterRecordChoices,
  recordChoiceGroup,
} from "../src/lib/record-choices.ts";
it("groups heterogeneous subject identities without changing their IDs or domain kinds", () => {
  expect(recordChoiceGroup("person")).toBe("People");
  expect(recordChoiceGroup("institution")).toBe(recordChoiceGroup("party"));
  expect(recordChoiceGroup("battle")).toBe(recordChoiceGroup("unit"));
  expect(recordChoiceGroup("nation")).toBe(recordChoiceGroup("territory"));
  expect(recordChoiceGroup("new_kind")).toBe("Other records");
  const rows = [
    { id: "a", name: "Altis", kind: "battle" },
    { id: "b", name: "Altis", kind: "territory" },
  ];
  expect(filterRecordChoices(rows, "Military", "ALTIS")).toEqual([rows[0]]);
  expect(rows[1].kind).toBe("territory");
});
it("searches multiple words and kinds while preserving accents and empty results", () => {
  const rows = [{ id: "p", name: "Clément Verne", kind: "person" }];
  expect(filterRecordChoices(rows, "", "  VERNE  person ")).toEqual(rows);
  expect(filterRecordChoices(rows, "People", "Clément")).toEqual(rows);
  expect(filterRecordChoices(rows, "Military", "Verne")).toEqual([]);
  expect(filterRecordChoices(rows, "", "absent")).toEqual([]);
});
