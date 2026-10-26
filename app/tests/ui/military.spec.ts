import { test, expect } from "@playwright/test";
async function nav(page: any, name: string) {
  await page.getByLabel("Historical Date Selector").waitFor();
  if (await page.getByRole("button", { name: "Toggle navigation" }).isVisible())
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
test("military directory opens sourced unit profiles and preserves unknown strength bounds", async ({
  page,
}, info) => {
  await page.goto("/");
  await nav(page, "Armed Forces");
  const workspace = page.locator(".military-workspace");
  await workspace
    .getByLabel("Search formations", { exact: true })
    .fill("Auxiliary");
  await workspace
    .getByRole("button", { name: "1st “Auxiliary” Division", exact: true })
    .click();
  const profile = page.getByRole("dialog");
  await expect(profile).toContainText("15,000 minimum; upper bound unknown");
  await expect(profile).toContainText("No parent established");
  await profile.getByRole("button", { name: "Equipment", exact: true }).click();
  await expect(profile).toContainText("Only explicitly tracked assignments");
  await profile
    .getByRole("button", { name: "Observations", exact: true })
    .click();
  await expect(
    profile.getByRole("cell", { name: "1992-10-03", exact: true }),
  ).toBeVisible();
  await profile
    .getByRole("button", { name: /View source/ })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "Original source", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close source", exact: true }).click();
  await expect(profile).toContainText("1992-10-03");
  await profile.screenshot({ path: info.outputPath("unit-profile.png") });
  await profile
    .getByRole("button", { name: "Close unit profile", exact: true })
    .click();
  await workspace.getByLabel("Search formations", { exact: true }).fill("");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: info.outputPath("military-workspace.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByLabel("Historical Date Selector").fill("1992-10-02");
  await workspace
    .getByRole("button", { name: "3rd Infantry Division", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("No dated observation");
});
test("formation search retains hierarchy context and expands recorded children", async ({
  page,
}) => {
  const headers = { Origin: "http://127.0.0.1:3001" };
  const name = "UI child formation " + Date.now();
  const r = await page.request.post("/api/rnas", {
    headers,
    data: {
      action: "unit",
      name,
      branch: "Army",
      unit_type: "Battalion",
      source_text: "Isolated test authority",
    },
  });
  expect(r.ok()).toBeTruthy();
  const id = (await r.json()).result.id;
  const s = await page.request.post("/api/rnas", {
    headers,
    data: {
      action: "unit_state",
      unit_id: id,
      date: "1992-10-03",
      parent_id: "unit-3inf",
      commander: "Fixture commander",
      garrison: "",
      personnel_low: 0,
      personnel_high: 0,
      authorized: "",
      readiness: "",
      mission: "",
      supply: "",
      operation: "unknown",
      source_text: "Isolated sourced hierarchy observation",
    },
  });
  expect(s.ok(), await s.text()).toBeTruthy();
  await page.goto("/");
  await nav(page, "Armed Forces");
  await page.getByLabel("Search formations", { exact: true }).fill(name);
  await expect(
    page.getByText(/3rd Infantry Division · .*subordinate record/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  await expect(
    page.getByText("Context ancestor", { exact: false }),
  ).toBeVisible();
});
test("procurement and completed movement views follow their distinct date semantics", async ({
  page,
}, info) => {
  const headers = { Origin: "http://127.0.0.1:3001" };
  const data = await (await page.request.get("/api/rnas")).json();
  const place = data.locations.find((l: any) => l.name === "Dalmatia");
  const mission = "UI dated arrival " + Date.now();
  const r = await page.request.post("/api/rnas", {
    headers,
    data: {
      action: "movement",
      unit_id: "unit-3inf",
      location_id: place.id,
      date: "1992-10-08",
      operation: "ordered",
      mission,
      source_text: "Isolated movement fixture",
    },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  const id = (await r.json()).result.id;
  const arrival = await page.request.post("/api/rnas", {
    headers,
    data: {
      action: "complete_movement",
      id,
      date: "1992-10-10",
      explanation: "Isolated arrival confirmation",
    },
  });
  expect(arrival.ok(), await arrival.text()).toBeTruthy();
  await page.goto("/");
  await nav(page, "Military Map");
  await page.getByLabel("Historical Date Selector").fill("1992-10-09");
  const row = page.getByRole("row").filter({ hasText: mission });
  await expect(
    row.getByRole("cell", { name: "ordered", exact: true }),
  ).toBeVisible();
  await expect(
    row.getByRole("cell", { name: "1992-10-10", exact: true }),
  ).toHaveCount(0);
  await expect(
    row.getByRole("button", { name: "Confirm arrival", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Historical Date Selector").fill("1992-10-10");
  await expect(
    row.getByRole("cell", { name: "completed", exact: true }),
  ).toBeVisible();
  await row
    .getByRole("button", { name: "3rd Infantry Division", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "3rd Infantry Division", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close unit profile", exact: true })
    .click();
  await page.getByRole("button", { name: "Equipment", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "F-16C/D Block 40/42", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Equipment dates", { exact: true }).selectOption("all");
  await expect(
    page.getByRole("cell", { name: "F-16C/D Block 40/42", exact: true }),
  ).toBeVisible();
});
