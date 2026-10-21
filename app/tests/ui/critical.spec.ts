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
test("government has one resolved entry per office and preserves 1725 in the archive", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Government");
  const cards = page.locator(".government-register .office-tile");
  await expect(cards).toHaveCount(4);
  await expect(
    cards.filter({
      has: page.getByText("Vice President", { exact: true }),
    }),
  ).toHaveCount(1);
  await expect(
    cards.filter({
      has: page.getByText("Heir", { exact: true }),
    }),
  ).toHaveCount(1);
  await expect(page.locator(".government-register")).not.toContainText(
    "Jack Younger",
  );
  await expect(page.locator(".government-register")).not.toContainText(
    "Aurelios",
  );
  await expect(
    page.getByText("No designated heir", { exact: true }),
  ).toBeVisible();
  await navigate(page, "Historical Archive");
  await page.getByLabel("Filter records").fill("1725");
  await expect(
    page.getByText("King Aurelios Leandros Steiner I", { exact: true }).first(),
  ).toBeVisible();
});
test("Cabinet roster opens a source-backed minister profile with progressive evidence", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Cabinet & Institutions");
  await expect(
    page.getByRole("heading", { name: "Cabinet", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Baseline minister", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Search Cabinet").fill("Defense");
  await page
    .getByRole("button", { name: "Gen. Marcus Thaler", exact: true })
    .click();
  const profile = page.getByRole("dialog");
  await expect(
    profile.getByRole("heading", { name: "Gen. Marcus Thaler", exact: true }),
  ).toBeVisible();
  await expect(
    profile.getByText("Minister of Defense", { exact: true }),
  ).toBeVisible();
  await profile.getByText(/Sources and evidence \(/).click();
  await expect(
    profile.getByRole("button", { name: /Original source|BASELINE/ }).first(),
  ).toBeVisible();
  await profile.getByRole("button", { name: "Close", exact: true }).click();
  await expect(profile).toHaveCount(0);
});
test("combined battle report reviews casualties once and persists after reload", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Battles");
  const name = "UI engagement fixture " + Date.now();
  await page.getByLabel("Report title", { exact: true }).fill(name);
  await page
    .getByLabel("Original engagement report")
    .fill(
      "On October 8, the 4th Infantry Brigade fought near UI ridge. It suffered 32 killed and 114 wounded.",
    );
  await page
    .getByRole("button", { name: "Suggest details from report", exact: true })
    .click();
  await expect(
    page.getByLabel("Participant 1 KIA", { exact: true }),
  ).toHaveValue("32");
  await expect(
    page.getByLabel("Participant 1 MIA", { exact: true }),
  ).toHaveValue("");
  await page.getByLabel("New battle name").fill(name);
  await page.getByLabel("Report / combat-phase reference").fill("UI-PHASE-1");
  await page
    .getByRole("button", { name: "Save report and review", exact: true })
    .click();
  await expect(page.locator(".battle-summary")).toContainText("Not reported");
  await page
    .getByLabel("Approval reason")
    .fill("Accept the reviewed test-only engagement");
  await page
    .getByRole("button", {
      name: "Approve battle report and military records",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("saved together");
  await page.reload();
  await navigate(page, "Battles");
  await page.getByLabel("Search battles").fill(name);
  await expect(
    page.getByRole("cell", { name, exact: false }).first(),
  ).toBeVisible();
  const phase = page.locator("details").filter({
    has: page.locator("summary", { hasText: name + " · UI-PHASE-1" }),
  });
  await phase.locator("summary").click();
  await expect(phase).toContainText("KIA 32 · WIA 114 · MIA not reported");
});
test("Archive filters, source-linked details and original text search keep historical records accessible", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Historical Archive");
  await expect(page.locator(".archive-table tbody tr")).toHaveCount(25);
  await page
    .getByLabel("Canon status", { exact: true })
    .selectOption("superseded");
  await page.getByLabel("Filter records").fill("Jack Younger");
  await page.locator(".archive-title").first().click();
  const detail = page.getByRole("dialog");
  await expect(detail).toContainText("Preserved superseded record");
  await expect(detail).toContainText("Darius Younger");
  await page.getByRole("button", { name: "Close record", exact: true }).click();
  await expect(page.getByLabel("Filter records")).toHaveValue("Jack Younger");
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await page.getByLabel("Historical collection").selectOption("1725");
  await expect(page.locator(".archive-table")).toContainText(
    "1725 archive only",
  );
  await page.getByRole("tab", { name: "Original text", exact: true }).click();
  await page
    .getByLabel("Search original text", { exact: true })
    .fill("Darius Younger");
  await page
    .getByRole("button", { name: "Search originals", exact: true })
    .click();
  await page.locator(".archive-passages .text-button").first().click();
  await expect(
    page.getByRole("dialog", { name: "Original source" }),
  ).toBeVisible();
  await expect(page.locator(".source-lines")).toContainText("Darius Younger");
  await page.getByRole("button", { name: "Close source" }).click();
  await expect(
    page.getByRole("tab", { name: "Original text", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});
