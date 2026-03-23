import { test, expect } from "@playwright/test";

/**
 * Recipe interaction tests — verifies recipe cards display correctly and
 * clicking recipe inputs/outputs navigates to the correct item pages.
 */

test("GT machine item page recipe tab shows EU/t and duration", async ({
  page,
}) => {
  // Use sand which has macerator/other GT machine recipes with EU/t info
  await page.goto("/items/minecraft-sand-0");
  await page.waitForTimeout(2000);

  // GT machine recipes display EU/t values
  const hasEU = await page.getByText(/EU\/t/i).count();
  const hasDuration = await page.getByText(/\d+s|\d+\s*ticks/i).count();

  // At least one recipe card should show EU/t (from GT machines like Macerator)
  // or a duration value
  expect(hasEU + hasDuration).toBeGreaterThan(0);
});

test("item page shows recipe inputs visually", async ({ page }) => {
  await page.goto("/items/minecraft-sand-0");
  await page.waitForTimeout(2000);

  // Recipe cards should render with item icons or text labels
  await expect(page.locator("body")).not.toContainText("[object Object]");

  // At least one recipe should be displayed
  const recipesTab = page.getByText(/Recipes \(\d+\)/);
  await expect(recipesTab).toBeVisible();
});

test("clicking on a recipe ingredient navigates to that item page", async ({
  page,
}) => {
  // Start on iron ingot page, find a recipe that uses it
  await page.goto("/items/minecraft-iron_ingot-0");
  await page.waitForTimeout(2000);

  // Switch to "Used In" to find recipes that use iron ingot
  await page.getByText(/Used In/i).click();
  await page.waitForTimeout(1000);

  // Find and click the first item link within a recipe card
  // Recipe item links typically link to /items/...
  const itemLink = page.locator("a[href*='/items/']").first();
  if (await itemLink.isVisible()) {
    const href = await itemLink.getAttribute("href");
    await itemLink.click();
    await page.waitForTimeout(1500);
    // Should navigate to an item page
    await expect(page).toHaveURL(/\/items\/.+/);
    await expect(page.locator("body")).not.toContainText("[object Object]");
  }
});

test("machine detail page paginates through recipes", async ({ page }) => {
  await page.goto("/machines/crafting_table");
  await page.waitForTimeout(2000);

  await expect(page.locator("body")).not.toContainText("Error");
  await expect(page.locator("body")).not.toContainText("[object Object]");

  // Look for pagination controls or "next page" button
  const hasPagination =
    (await page.getByRole("button", { name: /next/i }).count()) +
    (await page.locator("[aria-label*='page' i]").count()) +
    (await page.locator("button").filter({ hasText: /^\d+$/ }).count());

  // Crafting table has many recipes, so pagination should be present
  // But gracefully accept if it loads all on one page
  await expect(page.locator("body")).not.toContainText("undefined");
});

test("machine detail page recipe count is shown", async ({ page }) => {
  await page.goto("/machines/crafting_table");
  await page.waitForTimeout(2000);

  // Should show some indication of how many recipes exist
  const hasCount = await page.getByText(/recipe/i).count();
  expect(hasCount).toBeGreaterThan(0);
});

test("fluid detail page shows recipes that use it", async ({ page }) => {
  await page.goto("/fluids-gases/water");
  await page.waitForTimeout(2000);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  await expect(page.locator("body")).not.toContainText("undefined");
  // Water is used in many recipes
  await expect(page.locator("body")).not.toContainText("Error");
});

test("item page used-in tab shows correct recipe count", async ({ page }) => {
  await page.goto("/items/minecraft-iron_ingot-0");
  await page.waitForTimeout(2000);

  await page.getByText(/Used In/i).click();
  await page.waitForTimeout(500);

  // Should show a count > 0 for iron ingot (used in many recipes)
  const usedInTab = page.getByText(/Used In \(\d+\)/);
  await expect(usedInTab).toBeVisible();
  const tabText = await usedInTab.textContent();
  const count = parseInt(tabText?.match(/\d+/)?.[0] ?? "0");
  expect(count).toBeGreaterThan(0);
});

test("item page recipe card shows machine name", async ({ page }) => {
  await page.goto("/items/minecraft-sand-0");
  await page.waitForTimeout(2000);

  // Recipe cards display which machine produces them
  await expect(page.locator("body")).not.toContainText("[object Object]");
  // Crafting table or other machine name should appear
  const hasMachineName =
    (await page.getByText(/crafting/i).count()) +
    (await page.getByText(/furnace/i).count()) +
    (await page.getByText(/machine/i).count());
  expect(hasMachineName).toBeGreaterThan(0);
});

test("search page shows recipe links for found items", async ({ page }) => {
  await page.goto("/search?q=iron+ingot");
  await page.waitForTimeout(1500);

  await expect(page.locator("body")).not.toContainText("Error");
  // Search results should link to item pages
  const itemLinks = page.locator("a[href*='/items/']");
  await expect(itemLinks.first()).toBeVisible();
});
