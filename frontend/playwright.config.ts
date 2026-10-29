import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.playwright" });

const {
  PLAYWRIGHT_BASE_URL: BASE_URL,
  PLAYWRIGHT_PORT: PORT,
  CI,
} = process.env;
const IS_CI = CI === "true";
const WORKERS = process.env.PLAYWRIGHT_WORKERS
  ? Number(process.env.PLAYWRIGHT_WORKERS)
  : IS_CI ? 2 : undefined;

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  workers: WORKERS || 1,

  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  // Output directory for artifacts (videos, screenshots, traces)
  outputDir: "./test-results/e2e/artifacts",

  // Multi-reporter setup for cross-compatibility with Unit/Integration tools
  reporter: [
    [IS_CI ? "github" : "list"],
    ["html", { outputFolder: "./test-results/e2e/html", open: "never" }],
    ["json", { outputFile: "./test-results/e2e/report.json" }],
  ],

  use: {
    baseURL: BASE_URL,
    storageState: "./e2e/auth/state.json",
    trace: "on-first-retry",
    video: "retain-on-failure",
    // Visual regression
    screenshot: { mode: "only-on-failure", fullPage: true },
  },

  // Snapshot configuration
  snapshotDir: "./e2e/snapshots",
  snapshotPathTemplate: "{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}",

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Mobile viewports
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 12"] } },
  ],

  webServer: {
    command: IS_CI ? "npm run preview" : `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
