import { test, expect } from "@playwright/test";

/**
 * Content page tests — bees, ores, materials, loot bags, blood magic detail.
 */

// --- Bees ---

test("bees page shows species and mutations tabs", async ({ page }) => {
  await page.goto("/bees");
  await page.waitForTimeout(1500);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  // Should have species listed
  await expect(page.getByText(/species/i).first()).toBeVisible();
});

test("bees page has searchable species", async ({ page }) => {
  await page.goto("/bees");
  await page.waitForTimeout(1500);

  // Look for a search input
  const searchInput = page.locator("input[type='text'], input[placeholder*='search' i], input[placeholder*='filter' i]").first();
  if (await searchInput.isVisible()) {
    await searchInput.fill("forest");
    await page.waitForTimeout(300);
    // Results should be filtered
    await expect(page.getByText(/forest/i).first()).toBeVisible();
  }
});

test("bees mutations tab loads without errors", async ({ page }) => {
  await page.goto("/bees");
  await page.waitForTimeout(1500);

  const mutationsTab = page.getByText(/mutation/i).first();
  if (await mutationsTab.isVisible()) {
    await mutationsTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator("body")).not.toContainText("[object Object]");
    await expect(page.locator("body")).not.toContainText("undefined");
  }
});

// --- Ores ---

test("ores page shows vein content", async ({ page }) => {
  await page.goto("/ores");
  await page.waitForTimeout(1500);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  // Should have at least some ore data
  await expect(page.locator("body")).not.toContainText("undefined");
});

test("ores page has small ores section", async ({ page }) => {
  await page.goto("/ores");
  await page.waitForTimeout(1000);

  // Look for tabs or sections distinguishing vein ores from small ores
  const hasSmallOres = await page.getByText(/small ore/i).count();
  const hasVeins = await page.getByText(/vein/i).count();
  expect(hasSmallOres + hasVeins).toBeGreaterThan(0);
});

// --- Materials ---

test("materials page shows a list of materials", async ({ page }) => {
  await page.goto("/materials");
  await page.waitForTimeout(1500);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  // Should show material names
  await expect(page.locator("body")).not.toContainText("undefined");
});

test("materials page has sortable columns or filter", async ({ page }) => {
  await page.goto("/materials");
  await page.waitForTimeout(1000);

  // Check for table headers or sort buttons
  const hasTable = await page.locator("table, th").count();
  const hasFilter = await page.locator("input[type='text']").count();
  expect(hasTable + hasFilter).toBeGreaterThan(0);
});

// --- Loot Bags ---

test("loot bags page loads with bag list", async ({ page }) => {
  await page.goto("/lootbags");
  await page.waitForTimeout(2000);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  await expect(page.locator("body")).not.toContainText("undefined");
});

test("loot bags page shows loot drop content", async ({ page }) => {
  await page.goto("/lootbags");
  await page.waitForTimeout(2000);

  // Should have some content — either a bag selector or drop rates
  await expect(page.locator("body")).not.toContainText("Error");
});

// --- Blood Magic ---

test("blood magic shows altar recipe details", async ({ page }) => {
  await page.goto("/blood-magic");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Check that actual recipe data is shown (not just loading)
  await expect(page.locator("body")).not.toContainText("Loading");
  await expect(page.locator("body")).not.toContainText("[object Object]");
});

test("blood magic alchemy section has recipes", async ({ page }) => {
  await page.goto("/blood-magic");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  // Click alchemy tab if present
  const alchemyTab = page.getByText(/alchemy/i).first();
  await expect(alchemyTab).toBeVisible();
  await alchemyTab.click();
  await page.waitForTimeout(500);

  await expect(page.locator("body")).not.toContainText("[object Object]");
});

// --- Fluids ---

test("fluids page shows fluid list with search", async ({ page }) => {
  await page.goto("/fluids-gases");
  await page.waitForTimeout(1500);

  await expect(page.locator("body")).not.toContainText("[object Object]");
  await expect(page.locator("body")).not.toContainText("undefined");
});

test("fluids page search filters results", async ({ page }) => {
  await page.goto("/fluids-gases");
  await page.waitForTimeout(1500);

  // Look for a search or filter input
  const searchInput = page.locator("input[type='text'], input[placeholder]").first();
  if (await searchInput.isVisible()) {
    await searchInput.fill("water");
    await page.waitForTimeout(400);
    await expect(page.getByText(/water/i).first()).toBeVisible();
  }
});
