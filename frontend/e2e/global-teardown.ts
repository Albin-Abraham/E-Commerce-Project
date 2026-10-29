import type { FullConfig } from "@playwright/test";
/**
 * Global Teardown
 * Runs exactly once after the entire test suite finishes.
 *
 * Perfect for:
 * 1. Cleaning up database entries created during the test.
 * 2. Generating custom summaries.
 * 3. Clearing auth state files.
 */
async function globalTeardown(_config: FullConfig) {
  console.log("🧹 [Global Teardown] Cleaning up E2E environment...");

  // Example: Delete the auth state file created in global-setup.ts
  // import fs from 'fs';
  // if (fs.existsSync('./e2e/auth/state.json')) {
  //   fs.unlinkSync('./e2e/auth/state.json');
  // }

  console.log("✅ [Global Teardown] Complete.");
}

export default globalTeardown;
