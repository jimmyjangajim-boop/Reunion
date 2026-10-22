import { test, expect } from "@playwright/test";
test("Treasury charts, evidence and program windows follow the selected date", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByLabel("Historical Date Selector").waitFor();
  if (await page.getByRole("button", { name: "Toggle navigation" }).isVisible())
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Economy & Treasury" })
    .click();
  const treasury = page.locator(".treasury-workspace");
  await expect(
    treasury
      .locator(".treasury-metrics")
      .getByText("USD 255B", { exact: true }),
  ).toBeVisible();
  await expect(treasury.getByText("32.2%", { exact: true })).toBeVisible();
  await expect(
    treasury.getByRole("meter", { name: "Revenue estimate", exact: true }),
  ).toHaveAttribute("value", "160000000000");
  await expect(
    treasury.getByRole("cell", {
      name: "National Infrastructure Spine",
      exact: false,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("treasury.png"),
    fullPage: true,
  });
  await treasury
    .getByRole("button", { name: "Inspect chart evidence" })
    .click();
  await expect(
    treasury.getByRole("heading", { name: "Evidence for the selected date" }),
  ).toBeVisible();
  await treasury
    .getByText("Undated economic reference records", { exact: true })
    .click();
  await expect(
    treasury.getByText("spending_headline", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Historical Date Selector").fill("1992-10-04");
  await expect(
    treasury.getByText(
      "No comparable dated figures are established for this date.",
    ),
  ).toBeVisible();
  await expect(
    treasury
      .locator(".treasury-metrics")
      .getByText("USD 255B", { exact: true }),
  ).toHaveCount(0);
  await treasury.getByRole("button", { name: "Programs", exact: true }).click();
  await expect(
    treasury.getByRole("cell", {
      name: "National Infrastructure Spine",
      exact: false,
    }),
  ).toHaveCount(0);
});
