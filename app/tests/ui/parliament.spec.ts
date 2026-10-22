import { test, expect } from "@playwright/test";
test("Parliament preserves seat counts, party profiles and dated suspension", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByLabel("Historical Date Selector").waitFor();
  if (await page.getByRole("button", { name: "Toggle navigation" }).isVisible())
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Parliament", exact: true })
    .click();
  const w = page.locator(".parliament-workspace");
  await expect(w.locator(".parliament-seats circle")).toHaveCount(400);
  for (const [party, n] of [
    ["RRP", 118],
    ["LUP", 95],
    ["RCA", 82],
    ["NSF", 64],
    ["Dalmatian Autonomy Bloc", 18],
    ["Independents / fringe", 23],
  ] as const)
    await expect(w.locator(`circle[data-party="${party}"]`)).toHaveCount(n);
  await expect(
    w.getByText("Constitutional maximum 300", { exact: true }),
  ).toBeVisible();
  await expect(w.locator(".parliament-masthead")).toContainText(
    "Suspended 06:00",
  );
  await w.getByRole("button", { name: "RRP 118", exact: false }).click();
  await expect(w.getByRole("region", { name: "RRP profile" })).toContainText(
    "No fixed government coalition",
  );
  await page.screenshot({
    path: info.outputPath("parliament.png"),
    fullPage: true,
  });
  await w
    .getByRole("button", { name: "Historical events", exact: true })
    .click();
  await expect(
    w.getByRole("cell", {
      name: "President Donahue suspends/dissolves Assembly for three months",
      exact: true,
    }),
  ).toBeVisible();
  await w.getByRole("button", { name: "Members", exact: true }).click();
  await expect(
    w.getByText("No verified individual mandate register is available.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByLabel("Historical Date Selector").fill("1993-01-03");
  await expect(w.locator(".parliament-masthead")).toContainText(
    "No composition or session status is established",
  );
  await expect(w.locator(".parliament-seats circle")).toHaveCount(0);
  await w
    .getByText("Recorded composition observations · all dates", { exact: true })
    .click();
  await w
    .getByRole("button", { name: "Inspect 1992-10-03", exact: true })
    .click();
  await expect(w.locator(".parliament-seats circle")).toHaveCount(400);
});
