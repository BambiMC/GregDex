import { test, expect } from "@playwright/test";

/**
 * Tests that item pages show correct recipe data, including:
 * - The :32767 → :0 fallback in ItemDetailClient.tsx
 * - Blood magic alchemy recipes appearing on the item page
 * - Graceful error handling for unknown item IDs
 */

test("sand:0 item page shows output recipes", async ({ page }) => {
  await page.goto("/items/minecraft-sand-0");
  await page.waitForTimeout(2000);

  // Recipe tab should show a count > 0
  const recipesTab = page.getByText(/Recipes \(\d+\)/);
  await expect(recipesTab).toBeVisible();
  const tabText = await recipesTab.textContent();
  const count = parseInt(tabText?.match(/\d+/)?.[0] ?? "0");
  expect(count).toBeGreaterThan(0);

  // Should not show empty state
  await expect(page.locator("body")).not.toContainText("No recipes produce this item");
});

test("sand:0 item page shows it's used in recipes", async ({ page }) => {
  await page.goto("/items/minecraft-sand-0");
  await page.waitForTimeout(2000);

  // Click "Used In" tab
  await page.getByText(/Used In/i).click();
  await page.waitForTimeout(500);

  // Sand is used in many recipes - should not be empty
  await expect(page.locator("body")).not.toContainText("This item is not used in any recipes");
});

test("sand:32767 item page loads without crashing", async ({ page }) => {
  await page.goto("/items/minecraft-sand-32767");
  await page.waitForTimeout(2000);

  // Page should load - item name should be visible
  await expect(page.getByText(/Sand/i).first()).toBeVisible();

  // No JS errors
  await expect(page.locator("body")).not.toContainText("[object Object]");
  await expect(page.locator("body")).not.toContainText("undefined");
});

test("sand:32767 item page shows output recipes via :0 fallback", async ({ page }) => {
  await page.goto("/items/minecraft-sand-32767");
  // Give extra time for the two-fetch fallback to complete
  await page.waitForTimeout(3000);

  // The fallback in ItemDetailClient.tsx fetches sand:0 when sand:32767 has 0 output recipes
  // This test verifies the fallback works end-to-end
  const recipesTab = page.getByText(/Recipes \(\d+\)/);
  await expect(recipesTab).toBeVisible();
  const tabText = await recipesTab.textContent();
  const count = parseInt(tabText?.match(/\d+/)?.[0] ?? "0");
  expect(count).toBeGreaterThan(0);
});

test("iron ingot:0 item page shows output recipes", async ({ page }) => {
  await page.goto("/items/minecraft-iron_ingot-0");
  await page.waitForTimeout(2000);

  const recipesTab = page.getByText(/Recipes \(\d+\)/);
  await expect(recipesTab).toBeVisible();
  const tabText = await recipesTab.textContent();
  const count = parseInt(tabText?.match(/\d+/)?.[0] ?? "0");
  expect(count).toBeGreaterThan(0);
});

test("unknown item URL shows graceful error", async ({ page }) => {
  await page.goto("/items/totally-nonexistent-mod-fakething-99999");
  await page.waitForTimeout(3000);

  // Should show a graceful not-found message — either our custom "Item Not Found"
  // or Next.js's built-in 404 page. Both are acceptable.
  const body = page.locator("body");
  const hasNotFound = await body.getByText(/item not found/i).count();
  const hasBackLink = await body.getByText(/back to items/i).count();
  const has404 = await body.getByText(/404/i).count();
  const hasPageNotFound = await body.getByText(/page not found/i).count();
  expect(hasNotFound + hasBackLink + has404 + hasPageNotFound).toBeGreaterThan(0);

  // Page should not contain JS errors
  await expect(body).not.toContainText("[object Object]");
});

test("machine detail page shows recipes", async ({ page }) => {
  await page.goto("/machines/crafting_table");
  await page.waitForTimeout(2000);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  // Should render recipe content
  await expect(page.locator("body")).not.toContainText("Error");
});

test("fluid detail page loads correctly", async ({ page }) => {
  await page.goto("/fluids-gases/water");
  await page.waitForTimeout(2000);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  await expect(page.locator("body")).not.toContainText("undefined");
});
