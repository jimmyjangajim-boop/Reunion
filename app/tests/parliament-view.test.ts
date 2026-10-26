import { describe, it, expect } from "vitest";
import {
  parliamentView,
  hemicycle,
  billAtDate,
  parliamentaryEvents,
  type Chamber,
  type PartySeats,
  type Bill,
} from "../src/lib/parliament-view.ts";
const chamber: Chamber = {
  id: "a",
  date: "1992-10-03",
  actual_seats: 400,
  occupied_seats: null,
  legal_min: 150,
  legal_max: 300,
  session_status: "Suspended",
};
const parties: PartySeats[] = [118, 95, 82, 64, 18, 23].map((seats, i) => ({
  id: String(i),
  chamber_id: "a",
  party: String(i),
  seats,
  support: "No fixed coalition",
}));
const bill: Bill = {
  id: "b",
  identifier: "B-1",
  title: "Bill",
  sponsor: null,
  summary: "",
  stage: "enacted",
  introduced_date: "1992-10-02",
  effective_date: "1992-10-10",
};
describe("Parliament read model", () => {
  it("preserves practice/legal limits/unknown occupancy without carrying snapshots forward", () => {
    const v = parliamentView("1992-10-03", [chamber], parties);
    expect(v.valid).toBe(true);
    expect(v.total).toBe(400);
    expect(v.chamber?.legal_max).toBe(300);
    expect(v.chamber?.occupied_seats).toBeNull();
    expect(parliamentView("1992-10-04", [chamber], parties).chamber).toBeNull();
    expect(parliamentView("1992-10-02", [chamber], parties).chamber).toBeNull();
    expect(parliamentView("1993-01-03", [chamber], parties).chamber).toBeNull();
  });
  it("withholds invalid or conflicting compositions instead of inventing seats", () => {
    expect(
      parliamentView(
        chamber.date,
        [chamber],
        [...parties, { ...parties[0], id: "extra", seats: 1 }],
      ).valid,
    ).toBe(false);
    expect(
      parliamentView(
        chamber.date,
        [chamber, { ...chamber, id: "other" }],
        parties,
      ).ambiguous,
    ).toBe(true);
    expect(
      parliamentView(
        chamber.date,
        [chamber],
        parties.map((p, i) => (i === 0 ? { ...p, seats: -1 } : p)),
      ).valid,
    ).toBe(false);
  });
  it("produces exactly the recorded number of finite dots at supported sizes", () => {
    for (const n of [1, 2, 10, 300, 400, 2000]) {
      const dots = hemicycle(n);
      expect(dots).toHaveLength(n);
      expect(
        dots.every(
          (p) =>
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x >= 19 &&
            p.x <= 501 &&
            p.y >= 19 &&
            p.y <= 261,
        ),
      ).toBe(true);
    }
    expect(hemicycle(400.1)).toEqual([]);
    expect(hemicycle(2001)).toEqual([]);
    expect(hemicycle(0)).toEqual([]);
  });
  it("resolves dated legislative stages without leaking later or undated enactment", () => {
    const events = [
      {
        id: "e",
        bill_id: "b",
        stage: "passed",
        date: "1992-10-03",
        effective_date: null,
      },
      {
        id: "later",
        bill_id: "b",
        stage: "enacted",
        date: "1992-10-08",
        effective_date: "1992-10-10",
      },
      {
        id: "undated",
        bill_id: "b",
        stage: "enacted",
        date: null,
        effective_date: "1992-10-01",
      },
    ];
    expect(billAtDate(bill, events, "1992-10-03")).toMatchObject({
      visible: true,
      stage: "passed",
      effective: null,
    });
    expect(billAtDate(bill, events, "1992-10-01").visible).toBe(false);
    expect(billAtDate(bill, events, "1992-10-09")).toMatchObject({
      stage: "enacted",
      effective: "1992-10-10",
    });
    expect(
      billAtDate({ ...bill, introduced_date: null }, [events[2]], "1992-10-03")
        .visible,
    ).toBe(false);
  });
  it("keeps historical event precision, source status and archive-only exclusions", () => {
    const event = (id: string, precision: string, label: string) => ({
      id,
      title: "Parliament event",
      category: "political",
      canon: "provisional",
      operation: "unknown",
      date_json: JSON.stringify({ precision, label }),
    });
    const rows = [
      event("past", "day", "1992-04-06"),
      event("month", "month", "1992-10"),
      event("old", "day", "1725-01-01"),
      event("unknown", "unknown", "Unknown"),
      event("future", "day", "1992-11-01"),
    ];
    rows.push({
      ...event("range", "range", "0 uncertain window"),
      date_json: JSON.stringify({
        precision: "range",
        label: "0 uncertain window",
        earliest: "1992-06",
        latest: "1992-08",
      }),
    });
    expect(parliamentaryEvents(rows, "1992-10-03").map((r) => r.id)).toEqual([
      "range",
      "past",
    ]);
    expect(parliamentaryEvents(rows, "1992-10-31").map((r) => r.id)).toEqual([
      "month",
      "range",
      "past",
    ]);
  });
});
