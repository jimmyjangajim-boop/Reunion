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
test("Cabinet connects ministry and officeholder profiles and respects historical selection", async ({
  page,
}, info) => {
  await page.goto("/");
  await navigate(page, "Cabinet & Institutions");
  await page.getByLabel("Search Cabinet").fill("Defense");
  const row = page.locator(".cabinet-table tbody tr").filter({
    has: page.getByRole("button", {
      name: "Ministry of Defense",
      exact: true,
    }),
  });
  await expect(row).toContainText("Appointment date not recorded");
  await expect(row).toContainText("Affiliation not recorded");
  await page
    .getByRole("button", { name: "Ministry of Defense", exact: true })
    .click();
  const profile = page.getByRole("dialog");
  await expect(
    profile.getByRole("heading", { name: "Ministry of Defense", exact: true }),
  ).toBeVisible();
  await profile.screenshot({
    path: info.outputPath("cabinet-office-profile.png"),
  });
  await profile
    .getByRole("button", { name: "Officeholder profile", exact: true })
    .click();
  await expect(
    profile.getByRole("heading", { name: "Gen. Marcus Thaler", exact: true }),
  ).toBeVisible();
  await profile.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByLabel("Search Cabinet").fill("");
  await page
    .locator(".cabinet-roster tbody tr")
    .first()
    .screenshot({ path: info.outputPath("cabinet-first-entry.png") });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("cabinet-directory.png"),
    fullPage: true,
  });
  await page.getByLabel("Historical Date Selector").fill("1993-10-03");
  const later = page.locator(".cabinet-table tbody tr").filter({
    has: page.getByRole("button", {
      name: "Ministry of Defense",
      exact: true,
    }),
  });
  await expect(later).toContainText("Not established for this date");
  await expect(later).not.toContainText("Gen. Marcus Thaler");
});
test("Government keeps Presidency and Crown distinct and links to the Cabinet directory", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Government");
  const government = page.locator(".government-register");
  await expect(
    government.getByRole("heading", { name: "The Presidency", exact: true }),
  ).toBeVisible();
  await expect(
    government.getByRole("heading", { name: "The Crown", exact: true }),
  ).toBeVisible();
  await expect(government.locator(".office-tile")).toHaveCount(4);
  await expect(government).toContainText("Undated canon reference");
  await government
    .getByRole("button", { name: "Open Cabinet directory", exact: true })
    .click();
  await page.getByRole("button", { name: "Term history", exact: true }).click();
  await expect(page.locator(".cabinet-table")).toContainText(
    "All recorded term dates",
  );
  await expect(page.locator(".cabinet-table")).toContainText("Dr. Amalia Rehn");
  await page
    .getByRole("button", { name: "Open Government overview", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The Crown", exact: true }),
  ).toBeVisible();
});
test("approved dated leadership is consistent across dashboard, Government and Cabinet", async ({
  page,
}, info) => {
  const headers = { Origin: "http://127.0.0.1:3001" };
  const state = await (await page.request.get("/api/rnas")).json();
  let office = state.offices.find((o: any) => o.name === "President");
  if (!office) {
    const created = await page.request.post("/api/rnas", {
      headers,
      data: {
        action: "office",
        name: "President",
        authority: "Isolated browser fixture authority",
      },
    });
    expect(created.ok()).toBeTruthy();
    office = (await created.json()).result;
  }
  const date = info.project.name === "desktop" ? "1992-10-10" : "1992-10-12",
    name = "UI president fixture " + Date.now();
  const r = await page.request.post("/api/rnas", {
    headers,
    data: {
      action: "appointment",
      office_id: office.id,
      new_person_name: name,
      date,
      arrangement: "exclusive",
      reshuffle: "yes",
      explanation: "Isolated browser fixture appointment, not production canon",
    },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  await page.goto("/");
  await page.getByLabel("Historical Date Selector").fill(date);
  const president = page
    .locator(".stat")
    .filter({ has: page.getByText("PRESIDENT", { exact: true }) });
  await expect(president.getByText(name, { exact: true })).toBeVisible();
  await navigate(page, "Government");
  await expect(
    page
      .locator(".government-register")
      .getByRole("button", { name, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open Cabinet directory", exact: true })
    .click();
  await expect(
    page
      .locator(".cabinet-workspace")
      .getByRole("button", { name, exact: true }),
  ).toBeVisible();
});
