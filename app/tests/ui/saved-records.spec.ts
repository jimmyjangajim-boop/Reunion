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
async function save(page: any, kind: string, payload: object) {
  const post = async (data: object) => {
    const r = await page.request.post("/api/records", {
      headers: { Origin: "http://127.0.0.1:3001" },
      data,
    });
    expect(r.ok(), await r.text()).toBeTruthy();
    return r.json();
  };
  const draft = await post({
    action: "draft",
    kind,
    payload: {
      canon: "provisional",
      date_precision: "unknown",
      source_text: `Original saved-target evidence for ${kind}.`,
      ...payload,
    },
  });
  const review = await post({ action: "review", id: draft.id });
  return post({
    action: "save",
    id: draft.id,
    revision: draft.revision,
    token: review.token,
    reason: "Explicit approval of isolated browser fixture",
  });
}
async function receipt(page: any, id: string) {
  await navigate(page, "New Record");
  await page
    .locator(`tr[data-receipt-id="${id}"]`)
    .getByRole("button", { name: "View receipt", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open saved record", exact: true })
    .click();
}
test("all nine guided receipts open exact records, evidence and existing entity/unit profiles across dates", async ({
  page,
}, info) => {
  const stamp = Date.now();
  const overview = await (await page.request.get("/api/rnas")).json();
  const officeResponse = await page.request.post("/api/rnas", {
    headers: { Origin: "http://127.0.0.1:3001" },
    data: {
      action: "office",
      name: `UI detail office ${stamp}`,
      authority: "Isolated test authority",
    },
  });
  expect(officeResponse.ok()).toBeTruthy();
  const office = (await officeResponse.json()).result.id;
  const cases: [string, object][] = [
    [
      "person",
      {
        name: `UI detail person ${stamp}`,
        description: "Reported description",
      },
    ],
    ["institution", { name: `UI detail institution ${stamp}` }],
    ["organization", { name: `UI detail organization ${stamp}` }],
    [
      "bill",
      {
        title: `UI detail bill ${stamp}`,
        identifier: `DETAIL-${stamp}`,
        summary: "Reported bill summary",
        date: "1993-01-05",
        new_sponsor_name: `UI detail sponsor ${stamp}`,
      },
    ],
    [
      "appointment",
      {
        office_id: office,
        new_person_name: `UI detail appointee ${stamp}`,
        date: "",
        arrangement: "exclusive",
        explanation: "Supplied authority",
      },
    ],
    [
      "unit",
      { name: `UI detail unit ${stamp}`, branch: "Army", unit_type: "Brigade" },
    ],
    [
      "deployment",
      {
        unit_id: "unit-3inf",
        location_id: overview.locations.find((r: any) => r.name === "Dalmatia")
          .id,
        date: "1993-01-06",
        operation: "ordered",
        mission: `UI detail mission ${stamp}`,
      },
    ],
    [
      "treaty",
      {
        name: `UI detail agreement ${stamp}`,
        terms: "Reported terms",
        operation: "proposal",
        date_precision: "month",
        date_label: "1992-10",
        new_nation_name: `UI detail state ${stamp}`,
      },
    ],
    [
      "historical_event",
      {
        title: `UI detail event ${stamp}`,
        description: "Reported account",
        category: "history",
        new_related_name: `UI detail witness ${stamp}`,
      },
    ],
  ];
  const saved: { kind: string; id: string; target_id: string }[] = [];
  for (const [kind, payload] of cases)
    saved.push({ kind, ...(await save(page, kind, payload)) });
  await page.goto("/");
  for (const item of saved) {
    await receipt(page, item.id);
    const details = page.getByRole("region", {
      name: "Saved record details",
      exact: true,
    });
    await expect(details).toHaveAttribute("data-target-id", item.target_id);
    await expect(details).toContainText(
      "current stored fields across all recorded dates",
    );
    await expect(page.getByLabel("Historical Date Selector")).toHaveValue(
      "1992-10-03",
    );
    await details.getByRole("button", { name: /lines 1–1/ }).click();
    await expect(page.locator(".source-lines")).toContainText(
      `Original saved-target evidence for ${item.kind}.`,
    );
    await page
      .getByRole("button", { name: "Close source", exact: true })
      .click();
    if (["appointment", "deployment", "treaty"].includes(item.kind))
      await page.screenshot({
        path: info.outputPath(`${item.kind}-saved-detail.png`),
        fullPage: true,
      });
    if (item.kind === "person" || item.kind === "unit") {
      const name = `UI detail ${item.kind} ${stamp}`;
      await details.getByRole("button", { name, exact: true }).click();
      await expect(
        page.getByRole("dialog").getByRole("heading", { name, exact: true }),
      ).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: /Close/, exact: false })
        .first()
        .click();
    }
  }
});

test("unavailable saved-record view preserves its receipt and can be retried", async ({
  page,
}) => {
  const saved = await save(page, "person", {
    name: "UI saved view retry " + Date.now(),
  });
  await page.goto("/");
  await page.route(
    "**/api/records?view=target&*",
    (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Saved record temporarily unavailable. Receipt preserved.",
        }),
      }),
    { times: 1 },
  );
  await receipt(page, saved.id);
  const details = page.getByRole("region", {
    name: "Saved record details",
    exact: true,
  });
  await expect(details.getByRole("alert")).toContainText("Receipt preserved");
  await expect(
    page.getByRole("heading", { name: "Saved record", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hide saved record", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open saved record", exact: true })
    .click();
  await expect(details).toHaveAttribute("data-target-id", saved.target_id);
  await expect(details.getByRole("alert")).toHaveCount(0);
});
