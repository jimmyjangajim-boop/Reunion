import { beforeAll, afterAll, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { openDatabase, all } from "../src/lib/db.ts";
import type { DB, Row } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { assertionRows, evidenceFor, snapshot } from "../src/lib/canon.ts";
import { administrationView } from "../src/lib/administration-view.ts";
import { cabinetView } from "../src/lib/cabinet-view.ts";
import CabinetWorkspace from "../src/components/CabinetWorkspace";
let db: DB, input: Parameters<typeof cabinetView>[0];
beforeAll(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
  importReviewedCanon(db);
  const records = assertionRows(db).map((r) => ({
    ...r,
    evidence: evidenceFor(db, r.id),
  }));
  const entities = all(db, "SELECT * FROM entities");
  const projection = administrationView(
    records,
    snapshot(db, "1992-10-03"),
    entities,
    [],
  );
  input = {
    date: "1992-10-03",
    records,
    snapshot: projection.snapshot,
    government: projection.government,
    entities,
    offices: all(db, "SELECT * FROM offices"),
    appointments: all(
      db,
      "SELECT a.*,e.name person,o.name office FROM appointments a JOIN entities e ON e.id=a.person_id JOIN offices o ON o.id=a.office_id",
    ),
    timeline: all(db, "SELECT * FROM timeline"),
    bills: all(db, "SELECT * FROM bills"),
  };
});
afterAll(() => db.close());
it("shows named ministries and real office titles instead of technical claim labels", () => {
  const c = cabinetView(input);
  expect(
    c.ministries.find((r) => r.ministry === "Ministry of Defense"),
  ).toMatchObject({
    name: "Gen. Marcus Thaler",
    office: "Minister of Defense",
    status: "recorded",
  });
  expect(
    c.ministries.find(
      (r) => r.ministry === "Ministry of Education and Culture",
    ),
  ).toMatchObject({
    name: "Mira Linde",
    office: "Minister of Education and Culture",
  });
  expect(c.ministries.every((r) => !r.office.includes("Baseline"))).toBe(true);
});
it("keeps the RIA director separate from cabinet ministries and uses the single corrected VP", () => {
  const c = cabinetView(input);
  expect(
    c.institutions.find((r) => r.ministry === "Reunion Intelligence Agency"),
  ).toMatchObject({ name: "Jonas Meier", office: "Director of the RIA" });
  expect(c.leadership.map((r) => r.name)).toEqual([
    "Dax Donahue",
    "Darius Younger",
  ]);
  expect(c.royal.find((r) => r.office === "Heir")!.name).toBe(
    "No designated heir",
  );
});
it("merges Finance observations with its office history without treating Rehn as current", () => {
  const c = cabinetView(input),
    rows = c.ministries.filter((r) => r.ministry === "Ministry of Finance");
  expect(rows).toHaveLength(1);
  expect(rows[0].name).toBe("Emilio Curro");
  expect(rows[0].history.map((t: Row) => t.person)).toEqual([
    "Dr. Amalia Rehn",
    "Emilio Curro",
  ]);
  expect(rows[0].appointment_date).toBeNull();
  expect(
    rows[0].facts.some(
      (r: Row) =>
        r.title === "finance minister succession" && r.date === "1992-06-25",
    ),
  ).toBe(true);
  expect(rows[0].evidence.length).toBeGreaterThan(0);
});
it("keeps observation dates separate from appointments, affiliation and portraits", () => {
  const r = cabinetView(input).ministries.find(
    (r) => r.ministry === "Ministry of Defense",
  )!;
  expect(r.observed_date).toBe("1992-10-03");
  expect(r.appointment_date).toBeNull();
  expect(r.affiliation).toBeNull();
  expect(r.portrait).toBeUndefined();
});
it("does not carry a baseline minister into a later date or invent a vacancy", () => {
  const r = cabinetView({
    ...input,
    date: "1993-10-03",
    snapshot: [],
    government: [],
  }).ministries.find((r) => r.ministry === "Ministry of Defense")!;
  expect(r.name).toBeNull();
  expect(r.status).toBe("unknown");
  expect(r.observations[0].name).toBe("Gen. Marcus Thaler");
});
it("uses explicit dated appointments over an observation while preserving history", () => {
  const c = cabinetView({
    ...input,
    entities: [
      ...input.entities,
      { id: "new-person", name: "Fixture Minister", kind: "person" },
    ],
    appointments: [
      ...input.appointments,
      {
        id: "new-term",
        office_id: "office-finance",
        person_id: "new-person",
        person: "Fixture Minister",
        start_date: "1992-10-03",
        end_date: null,
        canon: "confirmed",
        source_id: input.appointments[0].source_id,
      },
    ],
  });
  const f = c.ministries.find((r) => r.ministry === "Ministry of Finance")!;
  expect(f.name).toBe("Fixture Minister");
  expect(f.appointment_date).toBe("1992-10-03");
  expect(f.history).toHaveLength(3);
});
it("keeps conflicting equal-rank holder observations disputed instead of choosing a name", () => {
  const original = input.snapshot.find((r) => r.entity_name === "Defense")!;
  const other = {
    ...original,
    id: "conflicting-defense",
    value: "Other fixture minister",
  };
  const r = cabinetView({
    ...input,
    records: [...input.records, other],
    snapshot: [...input.snapshot, other],
  }).ministries.find((r) => r.ministry === "Ministry of Defense")!;
  expect(r.status).toBe("disputed");
  expect(r.name).toContain("Other fixture minister");
  expect(r.name).toContain("Gen. Marcus Thaler");
});
it("renders a compact roster with progressive evidence and no internal headings", () => {
  const html = renderToStaticMarkup(
    React.createElement(CabinetWorkspace, {
      cabinet: cabinetView(input),
      onAppoint: () => {},
      onOffice: () => {},
      onSource: () => {},
    }),
  );
  expect(html).toContain("Ministry of Defense");
  expect(html).toContain("Mira Linde");
  expect(html).toContain("Appoint Minister");
  expect(html).toContain("Search Cabinet");
  expect(html).not.toContain("Baseline minister");
  expect(html).not.toContain("Evidence tier");
  expect(html).not.toContain("Jack Younger");
  expect(html).not.toContain("Aurelios");
});
it("does not change any financial values while deriving and rendering the roster", () => {
  const before = all(
    db,
    "SELECT id,value,canon FROM assertions WHERE category='economic' ORDER BY id",
  );
  const budgets = all(db, "SELECT * FROM budgets");
  const ledger = all(db, "SELECT * FROM ledger");
  cabinetView(input);
  expect(
    all(
      db,
      "SELECT id,value,canon FROM assertions WHERE category='economic' ORDER BY id",
    ),
  ).toEqual(before);
  expect(all(db, "SELECT * FROM budgets")).toEqual(budgets);
  expect(all(db, "SELECT * FROM ledger")).toEqual(ledger);
});
it("keeps deputies and explicit vacancies separate from unknown offices", () => {
  const c = cabinetView({
    ...input,
    offices: [
      ...input.offices,
      {
        id: "deputy-fixture",
        name: "Deputy Minister of Defense",
        authority: "Unknown",
      },
      { id: "vacant-fixture", name: "Fixture Minister", authority: "Unknown" },
    ],
    appointments: [
      ...input.appointments,
      {
        id: "vacancy",
        office_id: "vacant-fixture",
        person: "Vacant",
        start_date: "1992-10-03",
        end_date: null,
        canon: "confirmed",
      },
    ],
  });
  expect(
    c.deputies.find((r) => r.office === "Deputy Minister of Defense"),
  ).toMatchObject({ name: null, status: "unknown" });
  expect(
    c.ministries.find((r) => r.ministry === "Ministry of Fixture"),
  ).toMatchObject({ name: null, status: "vacant" });
});
it("does not attach a later political affiliation to an earlier officeholder record", () => {
  const curro = input.entities.find((e) => e.name === "Emilio Curro")!;
  const later = {
    id: "future-affiliation",
    entity_id: curro.id,
    predicate: "Political affiliation",
    value: "Future fixture party",
    canon: "confirmed",
    date_json: JSON.stringify({ precision: "day", label: "1993-10-03" }),
    valid_from: "1993-10-03",
    evidence: [],
  };
  const c = cabinetView({ ...input, records: [...input.records, later] });
  expect(
    c.ministries.find((r) => r.ministry === "Ministry of Finance")!.affiliation,
  ).toBeNull();
});
it("resolves dated leadership appointments without duplicating the office as an institution", () => {
  const person = {
    id: "new-president",
    name: "Fixture President",
    kind: "person",
  };
  const office = {
    id: "president-office",
    name: "President",
    authority: "Fixture authority",
  };
  const term = {
    id: "president-term",
    office_id: office.id,
    person_id: person.id,
    person: person.name,
    office: "President",
    canon: "confirmed",
    start_date: "1992-10-02",
    end_date: null,
    date_json: JSON.stringify({ precision: "day", label: "1992-10-02" }),
  };
  const c = cabinetView({
    ...input,
    entities: [...input.entities, person],
    offices: [...input.offices, office],
    appointments: [...input.appointments, term],
  });
  expect(c.leadership.find((r) => r.office === "President")).toMatchObject({
    name: person.name,
    person_id: person.id,
    appointment_date: "1992-10-02",
    context: "Dated appointment",
  });
  expect(c.institutions.some((r) => r.office === "President")).toBe(false);
  expect(c.ministries.some((r) => r.office === "Minister of President")).toBe(
    false,
  );
});
it("labels undated leadership knowledge as reference rather than a dated observation", () => {
  const c = cabinetView(input),
    r = c.royal.find((r) => r.office === "Heir")!;
  expect(r.name).toBe("No designated heir");
  expect(r.context).toBe("Undated canon reference");
  expect(r.observed_date).toBeNull();
});
it("keeps term history attached to the office, excluding archive-only terms", () => {
  const curro = input.entities.find((e) => e.name === "Emilio Curro")!;
  const extra = {
    id: "other-office",
    name: "Fixture Minister",
    authority: "Unknown",
  };
  const common = {
    person_id: curro.id,
    person: curro.name,
    canon: "confirmed",
    start_date: "1992-10-01",
    end_date: null,
  };
  const c = cabinetView({
    ...input,
    offices: [...input.offices, extra],
    appointments: [
      ...input.appointments,
      {
        ...common,
        id: "other-term",
        office_id: extra.id,
        date_json: JSON.stringify({ precision: "day", label: "1992-10-01" }),
      },
      {
        ...common,
        id: "archive-term",
        office_id: "office-finance",
        date_json: JSON.stringify({ precision: "day", label: "1725-01-01" }),
      },
    ],
  });
  const finance = c.ministries.find(
    (r) => r.ministry === "Ministry of Finance",
  )!;
  expect(finance.name).toBe("Emilio Curro");
  expect(finance.appointment_date).toBeNull();
  expect(finance.history.map((r: Row) => r.id)).toEqual([
    "rehn-term",
    "curro-term",
  ]);
});
it("separates undated personal references from past facts and excludes later facts", () => {
  const person = input.entities.find((e) => e.name === "Emilio Curro")!;
  const claim = (id: string, precision: string, label: string) => ({
    id,
    entity_id: person.id,
    predicate: id,
    value: id,
    canon: "confirmed",
    date_json: JSON.stringify({ precision, label }),
    evidence: [],
  });
  const c = cabinetView({
    ...input,
    records: [
      ...input.records,
      claim("past", "day", "1992-09-01"),
      claim("future", "day", "1992-11-01"),
      claim("reference", "unknown", "Unknown"),
    ],
  });
  const row = c.ministries.find((r) => r.ministry === "Ministry of Finance")!;
  expect(row.facts.map((r: Row) => r.id)).toContain("past");
  expect(row.facts.map((r: Row) => r.id)).not.toContain("future");
  expect(row.facts.map((r: Row) => r.id)).not.toContain("reference");
  expect(row.undated_facts.map((r: Row) => r.id)).toContain("reference");
});
it("filters related events by source dates and statuses while retaining explicit person links", () => {
  const person = input.entities.find((e) => e.name === "Emilio Curro")!;
  const event = (id: string, label: string, canon = "confirmed") => ({
    id,
    title: "Explicitly linked historical event",
    canon,
    operation: "unknown",
    date_json: JSON.stringify({ precision: "day", label }),
    related_entities: [{ id: person.id }],
  });
  const c = cabinetView({
    ...input,
    timeline: [
      event("past", "1992-09-01"),
      event("future", "1992-11-01"),
      event("rejected", "1992-09-01", "rejected"),
      event("old", "1725-01-01"),
    ],
  });
  expect(
    c.ministries
      .find((r) => r.ministry === "Ministry of Finance")!
      .events.map((r: Row) => r.id),
  ).toEqual(["past"]);
});
it("uses the shared dated legislative resolver for related bill status", () => {
  const curro = input.entities.find((e) => e.name === "Emilio Curro")!;
  const bill = {
    id: "bill-fixture",
    identifier: "FIXTURE",
    title: "Fixture bill",
    summary: "",
    sponsor_id: curro.id,
    stage: "enacted",
    introduced_date: "1992-10-01",
    effective_date: "1992-10-15",
  };
  const events = [
    {
      id: "passed",
      bill_id: bill.id,
      stage: "passed",
      date: "1992-10-02",
      effective_date: null,
    },
    {
      id: "enacted",
      bill_id: bill.id,
      stage: "enacted",
      date: "1992-10-10",
      effective_date: "1992-10-15",
    },
  ];
  const c = cabinetView({
    ...input,
    bills: [bill, { ...bill, id: "future", introduced_date: "1992-11-01" }],
    billEvents: events,
  });
  expect(
    c.ministries.find((r) => r.ministry === "Ministry of Finance")!.legislation,
  ).toMatchObject([{ id: bill.id, stage: "passed" }]);
});
it("includes established interval personal records without waiting for the end of validity", () => {
  const curro = input.entities.find((e) => e.name === "Emilio Curro")!;
  const record = {
    id: "interval-fixture",
    entity_id: curro.id,
    predicate: "Recorded duty",
    value: "Fixture duty",
    canon: "confirmed",
    operation: "planned",
    scope: "interval",
    valid_from: "1992-09-01",
    valid_to: "1992-11-01",
    date_json: JSON.stringify({
      precision: "range",
      label: "September to November 1992",
      earliest: "1992-09",
      latest: "1992-11",
    }),
    evidence: [],
  };
  const c = cabinetView({ ...input, records: [...input.records, record] });
  expect(
    c.ministries
      .find((r) => r.ministry === "Ministry of Finance")!
      .facts.find((r: Row) => r.id === record.id),
  ).toMatchObject({ operation: "planned", canon: "confirmed" });
});
