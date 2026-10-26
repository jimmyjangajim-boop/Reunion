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
test("categorized sourced-fact chooser preserves the exact selected identity while filtering and connects its saved fact", async ({
  page,
}, info) => {
  await page.goto("/");
  await navigate(page, "Historical Archive");
  await page
    .getByRole("button", { name: "Add Historical Record", exact: true })
    .click();
  await page
    .getByLabel("Subject category", { exact: true })
    .selectOption("People");
  await page.getByLabel("Find Subject", { exact: true }).fill("Darius");
  const subject = page.getByLabel("Subject", { exact: true });
  await subject.selectOption({ label: "Darius Younger · person" });
  const id = await subject.inputValue();
  await page
    .getByLabel("Subject category", { exact: true })
    .selectOption("Military");
  await page
    .getByLabel("Find Subject", { exact: true })
    .fill("no such identity");
  await expect(subject).toHaveValue(id);
  await expect(
    page.getByText("No matching records. Try another category or name.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Subject category", { exact: true })
    .selectOption("People");
  await page.getByLabel("Find Subject", { exact: true }).fill("Darius");
  await page.screenshot({
    path: info.outputPath("categorized-subject.png"),
    fullPage: true,
  });
  const predicate = "UI connected fact " + Date.now();
  await page.getByLabel("Claim / field", { exact: true }).fill(predicate);
  await page
    .getByLabel("Value or explicit Unknown")
    .fill("Test-only sourced note");
  await page.getByLabel("Category", { exact: true }).selectOption("political");
  await page
    .getByLabel("Or write your original decision")
    .fill("Temporary browser-test source");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.locator(".notice[role=status]")).toContainText("Saved");
  const data = await (await page.request.get("/api/rnas")).json();
  expect(
    data.records.find((r: any) => r.predicate === predicate).entity_id,
  ).toBe(id);
  await page.getByLabel("Search records and sources").fill(predicate);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("button", { name: `Darius Younger: ${predicate}`, exact: true })
    .click();
  const detail = page.getByRole("dialog");
  await expect(detail).toContainText("Test-only sourced note");
  await detail
    .getByRole("button", { name: "Darius Younger", exact: true })
    .click();
  await expect(detail).toContainText("Linked records");
  await detail
    .getByRole("button", { name: "Browse linked records", exact: true })
    .click();
  await expect(page.getByLabel("Entity", { exact: true })).toHaveValue(id);
});

test("related-record choices retain links across categories, search and saved draft reload", async ({
  page,
}, info) => {
  await page.goto("/");
  await navigate(page, "New Record");
  await page
    .getByRole("navigation", { name: "Record categories" })
    .getByRole("button", { name: "Historical Archive", exact: true })
    .click();
  await page
    .locator("button.record-type")
    .filter({ has: page.getByText("Historical event", { exact: true }) })
    .click();
  const title = "UI relationship draft " + Date.now();
  await page.getByLabel("Event title", { exact: true }).fill(title);
  const chooser = page.getByRole("group", {
    name: "Related people, places and organizations chooser",
    exact: true,
  });
  await chooser.getByRole("combobox").selectOption("People");
  await chooser.getByRole("searchbox").fill("Darius");
  await chooser
    .getByRole("checkbox", { name: "Darius Younger · person", exact: true })
    .check();
  await chooser.getByRole("combobox").selectOption("Military");
  await chooser.getByRole("searchbox").fill("Altis");
  const second = chooser.getByRole("checkbox").first();
  const secondName =
    (await second.getAttribute("aria-label")) ||
    (await second.locator("..").innerText());
  await second.check();
  await expect(
    chooser.getByRole("button", { name: "Remove Darius Younger", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("connected-choices.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "No national records changed",
  );
  await page.reload();
  await navigate(page, "New Record");
  await page
    .locator(".record-draft-list tr")
    .filter({ has: page.getByRole("cell", { name: title, exact: true }) })
    .getByRole("button", { name: "Resume draft" })
    .click();
  await expect(
    chooser.getByRole("button", { name: "Remove Darius Younger", exact: true }),
  ).toBeVisible();
  await expect(
    chooser.getByRole("button", {
      name: "Remove " + secondName.split(" · ")[0].trim(),
      exact: true,
    }),
  ).toBeVisible();
  await chooser
    .getByRole("button", { name: "Remove Darius Younger", exact: true })
    .click();
  await expect(
    chooser.getByRole("button", { name: "Remove Darius Younger", exact: true }),
  ).toHaveCount(0);
});
