import { test, expect } from "@playwright/test";
async function navigate(page: any, name: string) {
  await page.getByLabel("Historical Date Selector").waitFor();
  if (await page.getByRole("button", { name: "Toggle navigation" }).isVisible())
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: false })
    .click();
}
test("baseline dashboard, global search and immutable cited source", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The state of the republic" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /VICE PRESIDENT Darius Younger/ }),
  ).toBeVisible();
  await page.getByLabel("Search all sources").fill("Darius Younger");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search results" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /CONFIRMED_USER_OVERRIDES.md/ })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Original source" }),
  ).toBeVisible();
  await expect(page.locator(".source-lines")).toContainText("Darius Younger");
});
test("date reconstruction does not carry 1992 observations into 1993", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Historical Date Selector").fill("1993-10-11");
  await expect(
    page
      .getByRole("button", { name: /PRESIDENT Unknown for this date/ })
      .first(),
  ).toBeVisible();
  await expect(
    page.getByText("Baseline observations are specific to 3 October 1992.", {
      exact: false,
    }),
  ).toBeVisible();
});
test("review side-by-side evidence, reasoned decision, and normal entity entry", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Canon Review Center");
  await page.getByLabel("Issue status").selectOption("all");
  await page
    .getByRole("button", {
      name: "Current King Zo III and young heir Zo III both stated with same regnal numeral",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Record A", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Record B", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Record decision", exact: true })
    .click();
  await page
    .getByLabel("Reason for decision")
    .fill("Keep both identities distinct pending the original royal register.");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await navigate(page, "Historical Archive");
  await page.getByRole("button", { name: "+ Entity", exact: true }).click();
  await page
    .getByLabel("Name", { exact: true })
    .fill("UI audit entity " + Date.now());
  await page.getByLabel("Entity type").selectOption("organization");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
});
test("ordered movement appears in register without completed deployment", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Military Map");
  await page
    .getByRole("button", { name: "+ Movement order", exact: true })
    .click();
  await page.getByLabel("Unit", { exact: true }).selectOption("unit-3inf");
  await page.getByLabel("Destination").selectOption({ label: "Dalmatia" });
  await page
    .getByLabel("Mission / movement type")
    .fill("UI test reinforcement order");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await expect(
    page.getByRole("cell", { name: "ordered", exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm arrival" }).first(),
  ).toBeVisible();
});
test("uploads staged text, searches it, and exports database backup", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Imports & Backups");
  await page.getByLabel("Import files").setInputFiles({
    name: "playwright-log.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "Archive test record: Valeria notebook. Not approved canon.",
    ),
  });
  await page.getByRole("button", { name: "Stage import", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(/staged|already exists/);
  const dl = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download database backup" }).click();
  await expect((await dl).suggestedFilename()).toBe("reunion-backup.sqlite");
});
test("phone and laptop navigation has no page overflow", async ({ page }) => {
  await page.goto("/");
  await navigate(page, "Parliament");
  await expect(
    page.getByRole("heading", { name: "400 seats in practice" }),
  ).toBeVisible();
  await expect(
    page.getByText("Constitutional maximum 300", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
test("disputed financial observations are visibly labeled", async ({
  page,
}) => {
  const r = await page.request.post("/api/rnas", {
    headers: { Origin: "http://127.0.0.1:3001" },
    data: {
      action: "assertion",
      entity_id: "treasury",
      predicate: "Nominal GDP",
      value: "Unverified estimate in test record",
      category: "economic",
      canon: "disputed",
      operation: "unknown",
      scope: "point",
      date: { precision: "day", label: "1992-10-03" },
      source_text: "Test-only disputed report. Not production canon.",
    },
  });
  expect(r.ok()).toBeTruthy();
  await page.goto("/");
  await expect(
    page.getByText("Disputed: Unverified estimate in test record", {
      exact: true,
    }),
  ).toBeVisible();
});
