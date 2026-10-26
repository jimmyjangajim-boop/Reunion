import { beforeEach, afterEach, it, expect } from "vitest";
import { openDatabase, one } from "../src/lib/db.ts";
import type { DB } from "../src/lib/db.ts";
import { importRecovery } from "../src/lib/importer.ts";
import { importReviewedCanon } from "../src/lib/review-import.ts";
import { adminAction } from "../src/lib/admin.ts";
import {
  saveRecordDraft,
  reviewRecordDraft,
  commitRecordDraft,
  recordDraft,
} from "../src/lib/record-drafts.ts";
import { savedRecordDetails } from "../src/lib/saved-record-details.ts";
let db: DB;
beforeEach(() => {
  db = openDatabase(":memory:");
  importRecovery(db);
  importReviewedCanon(db);
});
afterEach(() => db.close());
const cases = [
  ["person", { name: "Detail person", description: "Supplied account" }],
  ["institution", { name: "Detail institution" }],
  ["organization", { name: "Detail organization" }],
  [
    "bill",
    {
      identifier: "DETAIL-BILL",
      title: "Detail bill",
      summary: "Supplied summary",
      date: "1993-01-05",
      new_sponsor_name: "Detail sponsor",
    },
  ],
  [
    "appointment",
    {
      new_person_name: "Detail appointee",
      date: "",
      arrangement: "exclusive",
      explanation: "Supplied authority",
    },
  ],
  ["unit", { name: "Detail unit", branch: "Army", unit_type: "Brigade" }],
  [
    "deployment",
    {
      unit_id: "unit-3inf",
      date: "1993-01-06",
      operation: "ordered",
      mission: "Supplied mission",
    },
  ],
  [
    "treaty",
    {
      name: "Detail treaty",
      terms: "Supplied terms",
      operation: "proposal",
      date_precision: "month",
      date_label: "1992-10",
      new_nation_name: "Detail state",
    },
  ],
  [
    "historical_event",
    {
      title: "Detail event",
      description: "Supplied account",
      category: "history",
      new_related_name: "Detail witness",
    },
  ],
] as const;
function save(kind: string, payload: object) {
  const draft = saveRecordDraft(db, {
    kind,
    payload: {
      source_text: "  Original detail evidence.\nSecond exact line.  ",
      canon: "provisional",
      date_precision: "unknown",
      ...payload,
    },
  });
  const review = reviewRecordDraft(db, draft.id);
  return commitRecordDraft(db, {
    id: draft.id,
    revision: draft.revision,
    token: review.token,
    reason: "Explicit detail test approval",
  });
}
it.each(cases)(
  "opens the exact committed %s target with preserved citations and explicit relationships",
  (kind, payload) => {
    const extra =
      kind === "appointment"
        ? {
            office_id: adminAction(db, {
              action: "office",
              name: "Detail office",
              authority: "Supplied office",
            }).id,
          }
        : kind === "deployment"
          ? {
              location_id: one(
                db,
                "SELECT id FROM locations WHERE name='Dalmatia'",
              )!.id,
            }
          : {};
    // Use a known exact person ID from the preserved seed rather than a guessed identity.
    const data =
      kind === "historical_event"
        ? {
            ...payload,
            related_ids: [
              one(db, "SELECT id FROM entities WHERE name='Darius Younger'")!
                .id,
            ],
          }
        : payload;
    const saved = save(kind, { ...data, ...extra });
    const changes = one(db, "SELECT total_changes() count")!.count;
    const details = savedRecordDetails(db, saved.id);
    expect(details).toMatchObject({
      id: saved.target_id,
      kind,
      approvalReason: "Explicit detail test approval",
    });
    expect(details.evidence).toHaveLength(1);
    expect(
      one(
        db,
        "SELECT content FROM sources WHERE id=?",
        details.evidence[0].source_id,
      )!.content,
    ).toBe("  Original detail evidence.\nSecond exact line.  ");
    expect(details.evidence[0]).toMatchObject({ line_start: 1, line_end: 2 });
    expect(one(db, "SELECT total_changes() count")!.count).toBe(changes);
    if (kind === "historical_event")
      expect(details.links.map((l) => l.label)).toEqual(
        expect.arrayContaining(["Darius Younger", "Detail witness"]),
      );
    if (kind === "treaty") {
      expect(details.links).toEqual([
        expect.objectContaining({ kind: "entity", label: "Detail state" }),
      ]);
      expect(details.fields).toContainEqual({
        label: "Date precision",
        value: "month",
      });
    }
    if (kind === "appointment")
      expect(details.fields).toContainEqual({
        label: "Term starts",
        value: "Not recorded",
      });
    if (kind === "deployment") {
      expect(details.links[0].id).toBe("unit-3inf");
      expect(details.fields).toContainEqual({
        label: "Confirmed arrival date",
        value: "Not recorded",
      });
    }
    if (kind === "bill") expect(details.links[0].label).toBe("Detail sponsor");
  },
);
it("keeps current domain fields distinct from the immutable receipt and preserves explicit zero", () => {
  const unit = save("unit", {
    name: "Original formation",
    branch: "Army",
    unit_type: "Brigade",
  });
  const receipt = recordDraft(db, unit.id);
  db.prepare("UPDATE units SET name='Later recorded name' WHERE id=?").run(
    unit.target_id,
  );
  expect(savedRecordDetails(db, unit.id).title).toBe("Later recorded name");
  expect(recordDraft(db, unit.id)).toEqual(receipt);
  const office = adminAction(db, {
    action: "office",
    name: "Sequence office",
    authority: "Supplied office",
  }).id;
  const appointment = save("appointment", {
    office_id: office,
    new_person_name: "Sequence official",
    date: "",
    arrangement: "exclusive",
    explanation: "Supplied authority",
  });
  db.prepare("UPDATE appointments SET sequence=0 WHERE id=?").run(
    appointment.target_id,
  );
  expect(savedRecordDetails(db, appointment.id).fields).toContainEqual({
    label: "Recorded sequence",
    value: "0",
  });
});
it("rejects unsaved, missing and unavailable targets without guessing a similarly named record", () => {
  const draft = saveRecordDraft(db, {
    kind: "unit",
    payload: { name: "Draft formation" },
  });
  expect(() => savedRecordDetails(db, draft.id)).toThrow("no saved record");
  expect(() => savedRecordDetails(db, "missing")).toThrow("not found");
  const saved = save("unit", {
    name: "Unavailable formation",
    branch: "Army",
    unit_type: "Brigade",
  });
  db.prepare("DELETE FROM units WHERE id=?").run(saved.target_id);
  expect(() => savedRecordDetails(db, saved.id)).toThrow("unavailable");
  expect(recordDraft(db, saved.id).status).toBe("saved");
});
