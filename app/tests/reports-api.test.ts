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
