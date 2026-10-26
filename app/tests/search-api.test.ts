import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
const directory = mkdtempSync(path.join(tmpdir(), "rnas-search-api-")),
  previous = process.env.RNAS_DB;
let route: typeof import("../src/app/api/search/route.ts"),
  storage: typeof import("../src/lib/db.ts");
beforeAll(async () => {
  process.env.RNAS_DB = path.join(directory, "search.sqlite");
  vi.resetModules();
  storage = await import("../src/lib/db.ts");
  const { importRecovery } = await import("../src/lib/importer.ts");
  importRecovery(storage.getDb());
  route = await import("../src/app/api/search/route.ts");
});
afterAll(() => {
  storage.getDb().close();
  if (previous === undefined) delete process.env.RNAS_DB;
  else process.env.RNAS_DB = previous;
  rmSync(directory, { recursive: true, force: true });
});
it("returns no-cache typed hits and exact details with no database changes", async () => {
  const before = storage.one(storage.getDb(), "SELECT total_changes() n")!.n;
  const result = await route.GET(
    new NextRequest("http://localhost/api/search?q=unit-3inf&kind=unit"),
  );
  expect(result.status).toBe(200);
  expect(result.headers.get("Cache-Control")).toBe("no-store");
  expect((await result.json()).rows[0]).toMatchObject({
    kind: "unit",
    id: "unit-3inf",
  });
  const detail = await route.GET(
    new NextRequest(
      "http://localhost/api/search?view=record&kind=unit&id=unit-3inf",
    ),
  );
  expect(detail.status).toBe(200);
  expect((await detail.json()).id).toBe("unit-3inf");
  expect(storage.one(storage.getDb(), "SELECT total_changes() n")!.n).toBe(
    before,
  );
});
it("rejects invalid input and exposes no record-write endpoint", async () => {
  for (const suffix of [
    "",
    "?q=x&page=-1",
    "?q=x&kind=audit",
    "?q=x&category=SQL",
    "?view=record&kind=sources&id=x",
    "?view=record&kind=unit&id=missing",
  ]) {
    expect(
      (await route.GET(new NextRequest("http://localhost/api/search" + suffix)))
        .status,
    ).toBe(400);
  }
  expect("POST" in route).toBe(false);
});
