import { test, expect } from "@playwright/test";

/**
 * Navigation tests — verifies sidebar links, mobile nav, and page transitions work correctly.
 */

test("sidebar nav links navigate to correct pages", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Click Items in sidebar
  await page.locator("a[href='/items']").first().click();
  await expect(page).toHaveURL(/\/items/);

  // Click Machines
  await page.locator("a[href='/machines']").first().click();
  await expect(page).toHaveURL(/\/machines/);
});

test("navigating to fluids page and back works", async ({ page }) => {
  await page.goto("/fluids-gases");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("body")).not.toContainText("Error");

  // Navigate to items via nav link
  await page.locator("a[href='/items']").first().click();
  await expect(page).toHaveURL(/\/items/);
});

test("all top-level nav links exist on the homepage", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const expectedLinks = [
    "/items",
    "/machines",
    "/fluids-gases",
    "/materials",
    "/bees",
    "/ores",
    "/blood-magic",
  ];

  for (const href of expectedLinks) {
    const link = page.locator(`a[href='${href}']`).first();
    await expect(link).toBeVisible();
  }
});

test("tools links are present in navigation", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Tools section links
  await expect(page.locator("a[href='/tools/planner']").first()).toBeVisible();
  await expect(page.locator("a[href='/tools/overclock']").first()).toBeVisible();
});

test("clicking item in items list navigates to item detail page", async ({
  page,
}) => {
  await page.goto("/items");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const firstItem = page.locator("a[href*='/items/']").first();
  await expect(firstItem).toBeVisible();
  const href = await firstItem.getAttribute("href");
  await firstItem.click();

  await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await expect(page.locator("body")).not.toContainText("[object Object]");
});

test("clicking machine in machines list navigates to machine detail page", async ({
  page,
}) => {
  await page.goto("/machines");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const firstMachine = page.locator("a[href*='/machines/']").first();
  await expect(firstMachine).toBeVisible();
  await firstMachine.click();

  await expect(page).toHaveURL(/\/machines\/.+/);
  await expect(page.locator("body")).not.toContainText("Error");
});

test("loot bags page loads with content", async ({ page }) => {
  await page.goto("/lootbags");
  await page.waitForTimeout(1500);
  await expect(page.locator("body")).not.toContainText("[object Object]");
  await expect(page.locator("body")).not.toContainText("undefined");
});

test("saved page loads with tabs", async ({ page }) => {
  await page.goto("/saved");
  await page.waitForLoadState("networkidle");

  // Should have two tabs (German UI)
  await expect(page.getByText(/gespeicherte items/i).first()).toBeVisible();
  await expect(page.getByText(/verlauf/i).first()).toBeVisible();
});

test("saved page tab switching works", async ({ page }) => {
  await page.goto("/saved");
  await page.waitForLoadState("networkidle");

  // Switch to history tab
  await page.getByText(/verlauf/i).first().click();
  await page.waitForTimeout(300);

  // Switch back to saved tab
  await page.getByText(/gespeicherte items/i).first().click();
  await page.waitForTimeout(300);

  await expect(page.locator("body")).not.toContainText("[object Object]");
});
