import { test, expect } from "@playwright/test";
async function navigate(page: any, name: string) {
  await page.getByLabel("Historical Date Selector").waitFor();
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  if (await toggle.isVisible()) await toggle.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name, exact: true })
    .click();
}
async function choose(page: any, category: string, type: string) {
  await navigate(page, "New Record");
  await page
    .getByRole("navigation", { name: "Record categories" })
    .getByRole("button", { name: category, exact: true })
    .click();
  await page
    .locator("button.record-type")
    .filter({ has: page.getByText(type, { exact: true }) })
    .click();
}
async function approve(page: any) {
  await page
    .getByRole("button", { name: "Review record", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review before saving", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Approval reason", { exact: true })
    .fill("Explicit approval of temporary UI fixture");
  await page
    .getByRole("button", { name: "Approve and save record", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved record", exact: true }),
  ).toBeVisible();
}

test("homepage entry saves an incomplete draft, resumes after reload, and preserves a readable receipt", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "New Record", exact: true })
    .last()
    .click();
  await page
    .getByRole("navigation", { name: "Record categories" })
    .getByRole("button", { name: "Historical Archive", exact: true })
    .click();
  await page
    .locator("button.record-type")
    .filter({ has: page.getByText("Person", { exact: true }) })
    .click();
  const name = "UI draft person " + Date.now();
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "No national records changed",
  );
  await page.reload();
  await navigate(page, "New Record");
  const row = page
    .locator(".record-draft-list tr")
    .filter({ has: page.getByRole("cell", { name, exact: true }) });
  await row.getByRole("button", { name: "Resume draft" }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(name);
  await page
    .getByLabel("Original evidence or source citation", { exact: true })
    .fill("Test-only identity source; historical date unknown.");
  await page
    .getByRole("button", { name: "Review record", exact: true })
    .click();
  await expect(page.locator(".record-review")).toContainText(
    "historical effective date remains unknown",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("New-record-review.png"),
    fullPage: true,
  });
  await page
    .getByLabel("Approval reason", { exact: true })
    .fill("Accept provisional test identity");
  await page
    .getByRole("button", { name: "Approve and save record", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved record", exact: true }),
  ).toBeVisible();
  await page.reload();
  await navigate(page, "New Record");
  const receipt = page
    .locator(".record-draft-list tr")
    .filter({ has: page.getByRole("cell", { name, exact: true }) });
  await receipt.getByRole("button", { name: "View receipt" }).click();
  await expect(page.locator(".record-review")).toContainText(name);
});
test("Parliament creates a bill and missing sponsor through the central reviewed workflow", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Parliament");
  await page.getByRole("button", { name: "+ Bill", exact: true }).click();
  const stamp = Date.now(),
    title = "UI linked bill " + stamp,
    person = "UI sponsor " + stamp;
  await page.getByLabel("Bill identifier", { exact: true }).fill("UI-" + stamp);
  await page
    .getByLabel("Introduction date", { exact: true })
    .fill("1992-10-08");
  await page.getByLabel("Bill title", { exact: true }).fill(title);
  await page
    .getByLabel("Bill summary", { exact: true })
    .fill("Temporary supplied bill summary");
  await page.getByLabel("New sponsor name", { exact: true }).fill(person);
  await page
    .getByLabel("Original evidence or source citation", { exact: true })
    .fill("Temporary bill and named sponsor authority");
  await approve(page);
  await page
    .getByRole("button", { name: "Open related registry", exact: true })
    .click();
  await page.getByLabel("Parliament registry dates").selectOption("all");
  await expect(
    page.getByRole("cell", { name: title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: person, exact: true }),
  ).toBeVisible();
});
test("historical event links a supplied missing entity and exposes the relationship in Archive", async ({
  page,
}) => {
  await page.goto("/");
  await choose(page, "Historical Archive", "Historical event");
  const stamp = Date.now(),
    title = "UI linked event " + stamp,
    person = "UI witness " + stamp;
  await page.getByLabel("Event title", { exact: true }).fill(title);
  await page
    .getByLabel("Historical subject", { exact: true })
    .selectOption("history");
  await page
    .getByLabel("Historical account and notes", { exact: true })
    .fill("Temporary supplied event account");
  await page
    .getByText("Create a missing related entity", { exact: true })
    .click();
  await page
    .getByLabel("New related entity name", { exact: true })
    .fill(person);
  await page
    .getByLabel("Original evidence or source citation", { exact: true })
    .fill("Temporary event authority names the witness");
  await approve(page);
  await page
    .getByRole("button", { name: "Open related registry", exact: true })
    .click();
  await page.getByRole("tab", { name: "Timeline", exact: true }).click();
  await page.getByLabel("Filter records", { exact: true }).fill(title);
  await page.locator(".archive-title").first().click();
  await expect(page.getByRole("dialog")).toContainText(
    "Related people, places and organizations",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: person, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Linked events (1)");
});
test("central categories retain the existing battle and financial workflows", async ({
  page,
}) => {
  await page.goto("/");
  await choose(page, "Military", "Battle, casualties or equipment loss");
  await expect(page.getByLabel("Original engagement report")).toBeVisible();
  await choose(
    page,
    "Economy and Treasury",
    "Financial transaction or expenditure",
  );
  await expect(
    page.getByRole("dialog", { name: "Record entry" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Transaction reference", { exact: true }),
  ).toBeVisible();
});
