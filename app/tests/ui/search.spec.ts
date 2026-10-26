import { test, expect } from "@playwright/test";
async function search(page: any, query: string) {
  await page.getByLabel("Search records and sources").fill(query);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Search results", exact: true }),
  ).toBeVisible();
}
async function command(page: any, data: object, records = false) {
  const response = await page.request.post(
    records ? "/api/records" : "/api/rnas",
    { headers: { Origin: "http://127.0.0.1:3001" }, data },
  );
  expect(response.ok(), await response.text()).toBeTruthy();
  const result = await response.json();
  return records ? result : result.result;
}
test("broad search retries failed requests, opens a real project and its original source, then preserves filters", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.route(
    "**/api/search?*",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Temporary search interruption" }),
      }),
    { times: 1 },
  );
  await search(page, "Defense");
  await expect(
    page
      .getByRole("region", { name: "Global record search", exact: true })
      .getByRole("alert"),
  ).toContainText("Temporary search interruption");
  await page.getByRole("button", { name: "Retry search", exact: true }).click();
  await page
    .getByLabel("Search category", { exact: true })
    .selectOption("Economy & treasury");
  await page
    .getByLabel("Search record type", { exact: true })
    .selectOption("project");
  const expected = await (
    await page.request.get("/api/search?q=Defense&kind=project")
  ).json();
  expect(expected.rows.length).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: expected.rows[0].title, exact: true })
    .click();
  const detail = page.getByRole("region", {
    name: "Registry record details",
    exact: true,
  });
  await expect(detail).toHaveAttribute("data-target-id", expected.rows[0].id);
  await expect(detail).toContainText("do not establish actual ledger payments");
  await page.screenshot({
    path: info.outputPath("project-search-detail.png"),
    fullPage: true,
  });
  await detail.getByRole("button").last().click();
  await expect(
    page.getByRole("dialog", { name: "Original source", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close source", exact: true }).click();
  await page
    .getByRole("button", { name: "Back to search results", exact: true })
    .click();
  await expect(page.getByLabel("Search category", { exact: true })).toHaveValue(
    "Economy & treasury",
  );
  await expect(
    page.getByLabel("Search record type", { exact: true }),
  ).toHaveValue("project");
});
test("future financial records connect transaction to appropriation and back without changing historical context", async ({
  page,
}, info) => {
  const stamp = Date.now(),
    name = "UI search program " + stamp,
    reference = "UI-SEARCH-" + stamp;
  const budget = await command(page, {
    action: "budget",
    name,
    fiscal_year: 1992,
    currency: "USD",
    appropriated: 100,
    source_text: "Isolated search appropriation authority",
  });
  const entry = await command(page, {
    action: "ledger",
    budget_id: budget.id,
    date: "1993-01-05",
    stage: "committed",
    amount: 40,
    reference,
    memo: "Explicit future commitment",
    source_text: "Isolated financial search evidence",
  });
  await page.goto("/");
  await search(page, reference);
  await page
    .getByLabel("Search category", { exact: true })
    .selectOption("Economy & treasury");
  await page
    .getByLabel("Search record type", { exact: true })
    .selectOption("ledger");
  await page.locator(".search-results .text-button").first().click();
  const detail = page.getByRole("region", {
    name: "Registry record details",
    exact: true,
  });
  await expect(detail).toHaveAttribute("data-target-id", entry.id);
  await expect(detail).toContainText("committed");
  await expect(detail).toContainText("1993-01-05");
  await expect(page.getByLabel("Historical Date Selector")).toHaveValue(
    "1992-10-03",
  );
  await detail.getByRole("button", { name, exact: true }).click();
  await expect(detail).toHaveAttribute("data-target-id", budget.id);
  await expect(detail).toContainText(
    "Stored appropriation, whole currency units",
  );
  await detail.getByRole("button", { name: /committed · 40 USD/ }).click();
  await expect(detail).toHaveAttribute("data-target-id", entry.id);
  await detail
    .getByRole("button", { name: "Back to previous record", exact: true })
    .click();
  await expect(detail).toHaveAttribute("data-target-id", budget.id);
  await page.screenshot({
    path: info.outputPath("financial-record-links.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Back to search results", exact: true })
    .click();
  await expect(
    page.getByLabel("Search record type", { exact: true }),
  ).toHaveValue("ledger");
});
test("search paging resets with categories and source evidence stays usable above archive record dialogs", async ({
  page,
}, info) => {
  await page.goto("/");
  await search(page, "Reunion");
  await expect(page.locator(".search-results article")).toHaveCount(12);
  await page.getByRole("button", { name: "Next results", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Search pages", exact: true }),
  ).toContainText("Page 2");
  await page
    .getByLabel("Search category", { exact: true })
    .selectOption("People");
  await expect(
    page.getByRole("navigation", { name: "Search pages", exact: true }),
  ).toContainText("Page 1");
  await search(page, "Darius Younger");
  await page
    .getByLabel("Search record type", { exact: true })
    .selectOption("fact");
  await page.locator(".search-results .text-button").first().click();
  const record = page
    .getByRole("dialog")
    .filter({ has: page.locator("#archive-detail-title") });
  await expect(record).toBeVisible();
  await record
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: "Source evidence", exact: true }),
    })
    .locator("summary")
    .first()
    .click();
  await record
    .getByRole("button", { name: "Open cited source", exact: true })
    .first()
    .click();
  const source = page.getByRole("dialog", {
    name: "Original source",
    exact: true,
  });
  await expect(source).toBeVisible();
  await expect(page.locator(".source-lines")).toContainText("Darius");
  await page.screenshot({
    path: info.outputPath("source-above-archive.png"),
    fullPage: true,
  });
  await source
    .getByRole("button", { name: "Close source", exact: true })
    .click();
  await expect(record).toBeVisible();
  await record
    .getByRole("button", { name: "Close record", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
});
test("deployment search opens its exact order and connects to the existing formation profile", async ({
  page,
}) => {
  const overview = await (await page.request.get("/api/rnas")).json();
  const mission = "UI search deployment " + Date.now();
  const draft = await command(
    page,
    {
      action: "draft",
      kind: "deployment",
      payload: {
        unit_id: "unit-3inf",
        location_id: overview.locations.find((r: any) => r.name === "Dalmatia")
          .id,
        date: "1993-01-06",
        operation: "ordered",
        mission,
        source_text: "Isolated deployment search evidence",
      },
    },
    true,
  );
  const review = await command(page, { action: "review", id: draft.id }, true);
  const saved = await command(
    page,
    {
      action: "save",
      id: draft.id,
      revision: draft.revision,
      token: review.token,
      reason: "Explicit isolated search approval",
    },
    true,
  );
  await page.goto("/");
  await search(page, mission);
  await page
    .getByLabel("Search category", { exact: true })
    .selectOption("Military");
  await page
    .getByLabel("Search record type", { exact: true })
    .selectOption("deployment");
  await page.locator(".search-results .text-button").first().click();
  const detail = page.getByRole("region", {
    name: "Registry record details",
    exact: true,
  });
  await expect(detail).toHaveAttribute("data-target-id", saved.target_id);
  await expect(detail).toContainText("Confirmed arrival date");
  await expect(detail).toContainText("Not recorded");
  await detail
    .getByRole("button", { name: "3rd Infantry Division", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "3rd Infantry Division", exact: true }),
  ).toBeVisible();
});
