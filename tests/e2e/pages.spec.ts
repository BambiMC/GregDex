import { test, expect } from "@playwright/test";

/**
 * Smoke tests — verifies each key page loads with real content, no blank/broken renders.
 */

test("homepage loads with navigation", async ({ page }) => {
  await page.goto("/");
  // Nav links are present (multiple may exist in sidebar + mobile nav, use .first())
  await expect(page.locator("a[href='/items']").first()).toBeVisible();
  await expect(page.locator("a[href='/machines']").first()).toBeVisible();
});

test("items index page loads with item list", async ({ page }) => {
  await page.goto("/items");
  // Should show a list of items
  await expect(page.locator("a[href*='/items/']").first()).toBeVisible();
});

test("machines page loads with machine list", async ({ page }) => {
  await page.goto("/machines");
  await expect(page.locator("a[href*='/machines/']").first()).toBeVisible();
});

test("fluids page loads with content", async ({ page }) => {
  await page.goto("/fluids-gases");
  await expect(page.locator("body")).not.toContainText("Error");
  // Wait for client-side data
  await page.waitForTimeout(1000);
  await expect(page.locator("body")).not.toContainText("Loading");
});

test("blood magic page loads with altar and alchemy recipes", async ({ page }) => {
  await page.goto("/blood-magic");
  await expect(page.getByText(/altar/i).first()).toBeVisible();
  await expect(page.getByText(/alchemy/i).first()).toBeVisible();
});

test("bees page loads with content", async ({ page }) => {
  await page.goto("/bees");
  await page.waitForTimeout(1500);
  await expect(page.locator("body")).not.toContainText("undefined");
  await expect(page.locator("body")).not.toContainText("[object Object]");
});

test("ores page loads with content", async ({ page }) => {
  await page.goto("/ores");
  await page.waitForTimeout(1000);
  await expect(page.locator("body")).not.toContainText("[object Object]");
});

test("materials page loads with content", async ({ page }) => {
  await page.goto("/materials");
  await page.waitForTimeout(1000);
  await expect(page.locator("body")).not.toContainText("[object Object]");
});

test("production line planner loads with toolbar", async ({ page }) => {
  await page.goto("/tools/planner");
  await page.waitForTimeout(500);
  // The toolbar has an "Add Node" button — use first() in case of multiple matches
  await expect(page.getByRole("button", { name: /Add Node/i }).first()).toBeVisible();
});

test("search page loads with results for known query", async ({ page }) => {
  await page.goto("/search?q=iron");
  await expect(page.locator("body")).not.toContainText("Error");
  await expect(page.getByText(/iron/i).first()).toBeVisible();
});
