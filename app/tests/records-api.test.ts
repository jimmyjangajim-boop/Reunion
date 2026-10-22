import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
let route: typeof import("../src/app/api/records/route.ts"),
  storage: typeof import("../src/lib/db.ts");
const directory = mkdtempSync(path.join(tmpdir(), "rnas-record-api-")),
  previous = process.env.RNAS_DB;
beforeAll(async () => {
  process.env.RNAS_DB = path.join(directory, "records.sqlite");
  vi.resetModules();
  storage = await import("../src/lib/db.ts");
  storage.getDb();
  route = await import("../src/app/api/records/route.ts");
});
afterAll(() => {
  storage.getDb().close();
  if (previous === undefined) delete process.env.RNAS_DB;
  else process.env.RNAS_DB = previous;
  rmSync(directory, { recursive: true, force: true });
});
const post = (body: object, origin = "http://localhost") =>
  route.POST(
    new NextRequest("http://localhost/api/records", {
      method: "POST",
      headers: {
        host: "localhost",
        origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }),
  );
it("blocks cross-origin mutations before any draft is created", async () => {
  expect(
    (
      await post(
        { action: "draft", kind: "person", payload: { name: "Blocked" } },
        "http://other.test",
      )
    ).status,
  ).toBe(403);
  expect(
    storage.all(storage.getDb(), "SELECT * FROM record_drafts"),
  ).toHaveLength(0);
});
it("saves, reviews and approves a sourced provisional identity using readable review data", async () => {
  const response = await post({
    action: "draft",
    kind: "person",
    payload: {
      name: "API fixture person",
      canon: "provisional",
      date_precision: "unknown",
      source_text: "API fixture original",
    },
  });
  expect(response.status).toBe(200);
  const draft = await response.json();
  const preview = await post({ action: "review", id: draft.id });
  expect(preview.status).toBe(200);
  const review = await preview.json();
  expect(
    review.fields.find(
      (f: { label: string; value: string }) => f.label === "Canon status",
    ).value,
  ).toBe("provisional");
  expect(storage.all(storage.getDb(), "SELECT * FROM entities")).toHaveLength(
    0,
  );
  const saved = await post({
    action: "save",
    id: draft.id,
    revision: draft.revision,
    token: review.token,
    reason: "Explicit API test approval",
  });
  expect(saved.status).toBe(200);
  const receipt = await route.GET(
    new NextRequest("http://localhost/api/records?id=" + draft.id),
  );
  const detail = await receipt.json();
  expect(detail.status).toBe("saved");
  expect(detail.receipt.fields).toBeDefined();
  expect(
    storage.one(storage.getDb(), "SELECT canon FROM assertions")!.canon,
  ).toBe("provisional");
});
it("rejects unsupported kinds and never delegates arbitrary administrative actions", async () => {
  expect(
    (
      await post({
        action: "draft",
        kind: "advance_preview",
        payload: { date: "1993-01-01" },
      })
    ).status,
  ).toBe(400);
  expect((await post({ action: "approve_event", id: "anything" })).status).toBe(
    400,
  );
});
