import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
let route: typeof import("../src/app/api/reports/route.ts");
let storage: typeof import("../src/lib/db.ts");
const directory = mkdtempSync(path.join(tmpdir(), "rnas-report-api-"));
const previous = process.env.RNAS_DB;
beforeAll(async () => {
  process.env.RNAS_DB = path.join(directory, "api.sqlite");
  vi.resetModules();
  storage = await import("../src/lib/db.ts");
  const { importRecovery } = await import("../src/lib/importer.ts");
  const { importReviewedCanon } = await import("../src/lib/review-import.ts");
  const db = storage.getDb();
  importRecovery(db);
  importReviewedCanon(db);
  route = await import("../src/app/api/reports/route.ts");
});
afterAll(() => {
  storage.getDb().close();
  if (previous === undefined) delete process.env.RNAS_DB;
  else process.env.RNAS_DB = previous;
  rmSync(directory, { recursive: true, force: true });
});
const request = (body: Record<string, unknown>, origin = "http://localhost") =>
  new NextRequest("http://localhost/api/reports", {
    method: "POST",
    headers: { host: "localhost", origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
it("rejects cross-origin mutation before preserving any submitted source", async () => {
  const response = await route.POST(
    request(
      {
        action: "submit",
        title: "Cross-origin fixture",
        body: "Do not import this",
      },
      "https://other.invalid",
    ),
  );
  expect(response.status).toBe(403);
  expect(
    storage.all(storage.getDb(), "SELECT * FROM national_reports"),
  ).toHaveLength(0);
});
it("persists a complete API report review and approval into shared national records", async () => {
  const response = await route.POST(
    request({
      action: "submit",
      title: "API order fixture",
      body: "Order 3rd Infantry Division to Dalmatia",
      date: "1992-10-04",
    }),
  );
  expect(response.status).toBe(200);
  const proposed = await response.json();
  expect(storage.all(storage.getDb(), "SELECT * FROM movements")).toHaveLength(
    0,
  );
  const approval = await route.POST(
    request({
      action: "approve",
      report_id: proposed.id,
      revision: proposed.revision,
      action_ids: [proposed.actions[0].id],
      reason: "Accept API fixture order",
    }),
  );
  expect(approval.status).toBe(200);
  const detail = await (
    await route.GET(
      new NextRequest("http://localhost/api/reports?id=" + proposed.id),
    )
  ).json();
  expect(detail.status).toBe("applied");
  expect(
    storage.one(storage.getDb(), "SELECT operation FROM movements")?.operation,
  ).toBe("ordered");
  expect(
    storage.one(
      storage.getDb(),
      "SELECT value FROM assertions WHERE id='review-override-heir'",
    )?.value,
  ).toBe("No designated heir");
});
it("approves sourced bill passage through the API into Parliament without financial effects", async () => {
  const db = storage.getDb();
  const before = storage.one(db, "SELECT count(*) n FROM ledger")!.n;
  const response = await route.POST(
    request({
      action: "submit",
      title: "API bill fixture",
      body: "Parliament passed Bill API-1: Public works",
      date: "1992-10-04",
    }),
  );
  expect(response.status).toBe(200);
  const r = await response.json();
  expect(r.actions[0].kind).toBe("legislation");
  const approved = await route.POST(
    request({
      action: "approve",
      report_id: r.id,
      revision: r.revision,
      action_ids: [r.actions[0].id],
      reason: "Accept reported parliamentary passage",
    }),
  );
  expect(approved.status).toBe(200);
  expect(
    storage.one(db, "SELECT * FROM bills WHERE identifier='API-1'"),
  ).toMatchObject({
    stage: "passed",
    introduced_date: null,
    effective_date: null,
  });
  expect(storage.one(db, "SELECT count(*) n FROM ledger")!.n).toBe(before);
  const overview = await import("../src/app/api/rnas/route.ts");
  const state = await (
    await overview.GET(new NextRequest("http://localhost/api/rnas"))
  ).json();
  expect(
    state.billEvents.some(
      (e: Record<string, any>) =>
        e.identifier === "API-1" && e.evidence[0].source_id === r.source_id,
    ),
  ).toBe(true);
});
it("approves an appropriation and payment through the API into Treasury with linked sources", async () => {
  const db = storage.getDb();
  const { adminAction } = await import("../src/lib/admin.ts");
  const budget = adminAction(db, {
    action: "budget",
    name: "API finance fixture",
    fiscal_year: 1992,
    currency: "USD",
    appropriated: 100,
    source_text: "API fixture budget authority",
  }).id;
  const response = await route.POST(
    request({
      action: "submit",
      title: "API financial fixture",
      date: "1992-10-04",
      body: "Treasury added an appropriation of USD 100 to Budget API finance fixture; reference APP-1\nTreasury disbursed USD 150 for Budget API finance fixture; reference PAY-1: Public works",
    }),
  );
  expect(response.status).toBe(200);
  const r = await response.json();
  expect(r.actions.every((a: Record<string, any>) => a.ready)).toBe(true);
  const approval = await route.POST(
    request({
      action: "approve",
      report_id: r.id,
      revision: r.revision,
      action_ids: r.actions.map((a: Record<string, any>) => a.id),
      reason: "Approve explicit financing and payment",
    }),
  );
  expect(approval.status).toBe(200);
  const overview = await import("../src/app/api/rnas/route.ts");
  const before = await (
    await overview.GET(
      new NextRequest("http://localhost/api/rnas?date=1992-10-03"),
    )
  ).json();
  expect(
    before.budgets.find((b: Record<string, any>) => b.id === budget)
      .appropriated_asof,
  ).toBe(100);
  const after = await (
    await overview.GET(
      new NextRequest("http://localhost/api/rnas?date=1992-10-04"),
    )
  ).json();
  expect(
    after.budgets.find((b: Record<string, any>) => b.id === budget)
      .appropriated_asof,
  ).toBe(200);
  expect(
    after.ledger.find(
      (l: Record<string, any>) =>
        l.budget_id === budget && l.stage === "disbursed",
    ),
  ).toMatchObject({ amount: 150, reference: "PAY-1", source_id: r.source_id });
  expect(
    after.ledger
      .filter((l: Record<string, any>) => l.budget_id === budget)
      .every(
        (l: Record<string, any>) => l.evidence[0].source_id === r.source_id,
      ),
  ).toBe(true);
});
