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
it("returns one resolved government register and keeps 1725 records archived", async () => {
  const overview = await import("../src/app/api/rnas/route.ts");
  const result = await overview.GET(
    new NextRequest("http://localhost/api/rnas?date=1992-10-03"),
  );
  expect(result.status).toBe(200);
  const data = await result.json();
  expect(
    data.government.filter((r: Record<string, any>) => r.predicate === "Heir"),
  ).toHaveLength(1);
  expect(
    data.government.filter(
      (r: Record<string, any>) => r.predicate === "Vice President",
    ),
  ).toHaveLength(1);
  expect(
    data.government.find(
      (r: Record<string, any>) => r.predicate === "Vice President",
    ).value,
  ).toBe("Darius Younger");
  expect(
    data.government.find((r: Record<string, any>) => r.predicate === "Heir")
      .value,
  ).toBe("No designated heir");
  expect(
    data.records.find((r: Record<string, any>) => r.id === "1725-crown")
      .archive_only,
  ).toBe(true);
  expect(
    data.administrationRecords.some((r: Record<string, any>) => r.archive_only),
  ).toBe(false);
  expect(data.timeline.some((r: Record<string, any>) => r.id === "T009")).toBe(
    true,
  );
  const historic = await (
    await overview.GET(
      new NextRequest("http://localhost/api/rnas?date=1725-01-01"),
    )
  ).json();
  expect(historic.snapshot).toEqual([]);
});
it("serves a sourced Cabinet roster without changing accepted financial canon", async () => {
  const db = storage.getDb();
  const before = storage.all(
    db,
    "SELECT id,value,canon FROM assertions WHERE category='economic' ORDER BY id",
  );
  const overview = await import("../src/app/api/rnas/route.ts");
  const response = await overview.GET(
    new NextRequest("http://localhost/api/rnas?date=1992-10-03"),
  );
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(
    data.cabinet.ministries.find(
      (r: Record<string, any>) => r.ministry === "Ministry of Defense",
    ),
  ).toMatchObject({
    name: "Gen. Marcus Thaler",
    office: "Minister of Defense",
  });
  expect(
    data.cabinet.leadership.find(
      (r: Record<string, any>) => r.office === "Vice President",
    ).name,
  ).toBe("Darius Younger");
  expect(
    data.cabinet.ministries
      .find((r: Record<string, any>) => r.ministry === "Ministry of Finance")
      .history.map((t: Record<string, any>) => t.person),
  ).toEqual(["Dr. Amalia Rehn", "Emilio Curro"]);
  expect(
    storage.all(
      db,
      "SELECT id,value,canon FROM assertions WHERE category='economic' ORDER BY id",
    ),
  ).toEqual(before);
});
it("suggests a battle without writes and atomically approves reviewed facts into Battles", async () => {
  const db = storage.getDb(),
    sourcesBefore = storage.one(db, "SELECT count(*) n FROM sources")!.n;
  const suggested = await route.POST(
    request({
      action: "suggest_battle",
      date: "1992-10-03",
      body: "On October 8, the 4th Infantry Brigade fought near API ridge. It suffered 32 killed and 114 wounded.",
    }),
  );
  expect(suggested.status).toBe(200);
  const s = await suggested.json();
  expect(storage.one(db, "SELECT count(*) n FROM sources")!.n).toBe(
    sourcesBefore,
  );
  const battle = {
    ...s.battle,
    name: "API engagement fixture",
    reference: "API-PHASE-1",
  };
  const submitted = await route.POST(
    request({
      action: "submit",
      title: "API battle fixture",
      body: "API fixture original engagement",
      battle,
      date: "1992-10-08",
    }),
  );
  expect(submitted.status).toBe(200);
  const r = await submitted.json();
  expect(r.actions[0].kind).toBe("battle");
  expect(
    storage.one(db, "SELECT count(*) n FROM battle_report_records")!.n,
  ).toBe(0);
  const approved = await route.POST(
    request({
      action: "approve",
      report_id: r.id,
      revision: r.revision,
      action_ids: [r.actions[0].id],
      reason: "Accept reviewed API engagement",
    }),
  );
  expect(approved.status).toBe(200);
  const overview = await import("../src/app/api/rnas/route.ts");
  const data = await (
    await overview.GET(new NextRequest("http://localhost/api/rnas"))
  ).json();
  const phase = data.battleReports.find(
    (p: Record<string, any>) => p.reference === "API-PHASE-1",
  );
  expect(phase.battle).toBe("API engagement fixture");
  expect(phase.evidence[0].source_id).toBe(r.source_id);
  expect(
    phase.casualties.map((c: Record<string, any>) => [c.category, c.count]),
  ).toEqual([
    ["KIA", 32],
    ["WIA", 114],
  ]);
  const scenario = await (
    await route.POST(
      request({
        action: "submit",
        title: "API battle scenario",
        body: "Hypothetical scenario",
        battle: { ...battle, name: "Scenario battle" },
        mode: "simulate",
      }),
    )
  ).json();
  const blocked = await route.POST(
    request({
      action: "approve",
      report_id: scenario.id,
      revision: scenario.revision,
      action_ids: [scenario.actions[0].id],
      reason: "Attempt scenario approval",
    }),
  );
  expect(blocked.status).toBe(400);
  expect(
    storage.one(db, "SELECT count(*) n FROM battle_report_records")!.n,
  ).toBe(1);
});
