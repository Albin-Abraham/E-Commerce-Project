import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Global Setup
 * Runs exactly once before the entire test suite starts.
 *
 * Perfect for:
 * 1. Generating a global authentication token.
 * 2. Seeding a test database.
 * 3. Clearing out old test artifacts.
 */
async function globalSetup(config: FullConfig) {
  console.log("🌍 [Global Setup] Booting up E2E environment...");

  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${baseURL}/login?mode=customer...`);
    await page.goto(`${baseURL}/login?mode=customer`);

    // Fill credentials (using robust selectors to catch various form structures)
    await page.fill(
      'input[name="username"], input[name="email"], #username, [placeholder*="sername"]',
      "admin@zenith.local"
    );
    await page.fill(
      'input[name="password"], input[type="password"], #password',
      "admin@123"
    );

    await page.click('button[type="submit"]');

    // Wait for the login redirect to finish
    await page.waitForURL("**/workspace*", { timeout: 10000 }).catch(() => {
      console.log(
        "Did not redirect to workspace, checking if we are at root..."
      );
    });
    // Give it a second to write to localStorage
    await page.waitForTimeout(1000);

    // Ensure directory exists
    const authDirPath = path.resolve("./e2e/auth");
    if (!fs.existsSync(authDirPath)) {
      fs.mkdirSync(authDirPath, { recursive: true });
    }

    // Save session storage and cookies
    await page.context().storageState({ path: "./e2e/auth/state.json" });
    console.log("✅ [Global Setup] Authentication complete and state saved.");
  } catch (error) {
    console.error("❌ [Global Setup] Login failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
