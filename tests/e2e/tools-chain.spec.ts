import { test, expect } from "@playwright/test";

/**
 * Chain Calculator and Throughput Calculator tests.
 */

test("chain calculator page loads", async ({ page }) => {
  await page.goto("/tools/chain");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).not.toContainText("Error");
  await expect(page.locator("body")).not.toContainText("[object Object]");
});

test("chain calculator has item search input", async ({ page }) => {
  await page.goto("/tools/chain");
  await page.waitForLoadState("networkidle");

  // Should have a search/input for items
  const searchInput = page.locator("input").first();
  await expect(searchInput).toBeVisible();
});

test("chain calculator item search returns results", async ({ page }) => {
  await page.goto("/tools/chain");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500); // wait for items index to load

  const searchInput = page.locator("input").first();
  await searchInput.fill("iron");
  await page.waitForTimeout(500);

  // Should show some results matching "iron"
  await expect(page.getByText(/iron/i).first()).toBeVisible();
});

test("throughput calculator page loads", async ({ page }) => {
  await page.goto("/tools/throughput");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).not.toContainText("Error");
  await expect(page.locator("body")).not.toContainText("[object Object]");
});

test("throughput calculator has item search input", async ({ page }) => {
  await page.goto("/tools/throughput");
  await page.waitForLoadState("networkidle");

  const searchInput = page.locator("input").first();
  await expect(searchInput).toBeVisible();
});

test("throughput calculator item search returns results", async ({ page }) => {
  await page.goto("/tools/throughput");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const searchInput = page.locator("input").first();
  await searchInput.fill("sand");
  await page.waitForTimeout(500);

  await expect(page.getByText(/sand/i).first()).toBeVisible();
});
