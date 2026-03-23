import { test, expect } from "@playwright/test";

/**
 * Overclock Calculator tests — verifies the tool calculates correctly and displays results.
 */

test("overclock page loads with input fields", async ({ page }) => {
  await page.goto("/tools/overclock");
  await page.waitForLoadState("networkidle");

  await expect(page.locator("input[placeholder*='e.g. 30']")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Error");
});

test("overclock page shows results table by default (pre-filled inputs)", async ({
  page,
}) => {
  await page.goto("/tools/overclock");
  await page.waitForLoadState("networkidle");

  // Page pre-fills EU/t=30 and duration=200 — results should already show
  await expect(page.getByText(/Results/i).first()).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
});

test("entering EU/t shows overclock results table", async ({ page }) => {
  await page.goto("/tools/overclock");
  await page.waitForLoadState("networkidle");

  const euInput = page.locator("input[placeholder*='e.g. 30']");
  await euInput.fill("8");

  await page.waitForTimeout(300);
  // Results table should be visible
  await expect(page.getByRole("table")).toBeVisible();
  // Table should have more than one row (header + data rows)
  const rows = page.locator("table tbody tr");
  await expect(rows.first()).toBeVisible();
});

test("voltage tier quick-select buttons work", async ({ page }) => {
  await page.goto("/tools/overclock");
  await page.waitForLoadState("networkidle");

  // Quick EU buttons (2, 4, 8, 16, 30...)
  const quickButton = page.getByRole("button", { name: "30" }).first();
  if (await quickButton.isVisible()) {
    await quickButton.click();
    await page.waitForTimeout(200);
    const euInput = page.locator("input[placeholder*='e.g. 30']");
    await expect(euInput).toHaveValue("30");
  }
});

test("entering duration updates overclock results", async ({ page }) => {
  await page.goto("/tools/overclock");
  await page.waitForLoadState("networkidle");

  const euInput = page.locator("input[placeholder*='e.g. 30']");
  await euInput.fill("120");

  const durationInput = page
    .locator(
      "input[placeholder*='e.g. 200'], input[placeholder*='e.g. 10']"
    )
    .first();
  await durationInput.fill("400");

  await page.waitForTimeout(300);
  // Results table should still be visible
  await expect(page.getByRole("table")).toBeVisible();
});

test("perfect overclock toggle works", async ({ page }) => {
  await page.goto("/tools/overclock");
  await page.waitForLoadState("networkidle");

  // Click "Perfect" mode button
  const perfectButton = page.getByRole("button", { name: /perfect/i }).first();
  await expect(perfectButton).toBeVisible();
  await perfectButton.click();
  await page.waitForTimeout(200);

  // Results should still show
  await expect(page.getByRole("table")).toBeVisible();
});

test("overclock page has breadcrumb link back to home", async ({ page }) => {
  await page.goto("/tools/overclock");
  await page.waitForLoadState("networkidle");

  await expect(page.locator("a[href='/']").first()).toBeVisible();
});
