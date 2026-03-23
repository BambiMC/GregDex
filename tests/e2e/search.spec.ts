import { test, expect } from "@playwright/test";

/**
 * Regression tests for the sand-type search routing bug.
 *
 * The bug: items-index.json contains `minecraft:sand:32767` (wildcard, 0 recipes)
 * BEFORE `minecraft:sand:0` (40 recipes). Without the sort fix in GlobalSearch.tsx,
 * searching "sand" could return a :32767 item as a top result.
 *
 * The fix: items ending in :32767 are sorted after :0 items.
 * These tests verify: any result that IS clicked never routes to a :32767 URL.
 */

async function openSearchAndType(page: any, query: string) {
  await page.goto("/");
  // Wait for React to hydrate and attach event listeners before pressing Ctrl+K
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  const input = page.locator("input[placeholder*='Search']");
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill(query);
  await page.waitForTimeout(500);
}

test("clicking first search result never routes to a :32767 URL (sand)", async ({ page }) => {
  await openSearchAndType(page, "sand");

  // Click the first result in the dropdown
  const firstResult = page.locator(".fixed button[class*='text-']").first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // The critical regression check: URL must not be a wildcard variant
  await expect(page.url()).not.toMatch(/32767/);
});

test("clicking first search result never routes to a :32767 URL (cobblestone)", async ({ page }) => {
  await openSearchAndType(page, "cobblestone");

  const firstResult = page.locator(".fixed button[class*='text-']").first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(page.url()).not.toMatch(/32767/);
});

test("clicking first search result never routes to a :32767 URL (iron ingot)", async ({ page }) => {
  await openSearchAndType(page, "iron ingot");

  const firstResult = page.locator(".fixed button[class*='text-']").first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  await expect(page.url()).not.toMatch(/32767/);
});

test("search result page shows recipes (not empty)", async ({ page }) => {
  // Navigate directly to a well-known item that has recipes
  await page.goto("/items/minecraft-sand-0");
  await page.waitForTimeout(2000);

  // Recipe tab should show count > 0
  const recipesTab = page.getByText(/Recipes \(\d+\)/);
  await expect(recipesTab).toBeVisible();
  const tabText = await recipesTab.textContent();
  const count = parseInt(tabText?.match(/\d+/)?.[0] ?? "0");
  expect(count).toBeGreaterThan(0);
});

test("search finds items and the result page loads without errors", async ({ page }) => {
  await openSearchAndType(page, "sand");

  const firstResult = page.locator(".fixed button[class*='text-']").first();
  await expect(firstResult).toBeVisible();
  await firstResult.click();

  // Item page should load without JS errors
  await page.waitForTimeout(1500);
  await expect(page.locator("body")).not.toContainText("[object Object]");
  await expect(page.locator("body")).not.toContainText("undefined");
});
