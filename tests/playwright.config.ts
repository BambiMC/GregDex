import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 15000,
  expect: { timeout: 8000 },
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    // Don't take screenshots/traces by default to keep things fast
    screenshot: "only-on-failure",
    trace: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No webServer — dev server is always running at localhost:3000 per project setup
});
