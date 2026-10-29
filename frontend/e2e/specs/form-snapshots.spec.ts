import { test } from "@playwright/test";

test.describe("Form Snapshots", () => {
  const urls = [
    { name: "employee_form", url: "http://localhost:8090/showcase/employee" },
    { name: "branch_form", url: "http://localhost:8090/showcase/branch" },
    { name: "wizard_form", url: "http://localhost:8090/showcase/wizard" },
  ];

  for (const { name, url } of urls) {
    test(`Snapshot for ${name}`, async ({ page }) => {
      await page.goto(url, { waitUntil: "networkidle" });
      // Wait a moment for any client-side rendering/animations to finish
      await page.waitForTimeout(1500);

      const screenshotPath = `./e2e/snapshots/${name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log(`Saved snapshot for ${name} at ${screenshotPath}`);
    });
  }
});
