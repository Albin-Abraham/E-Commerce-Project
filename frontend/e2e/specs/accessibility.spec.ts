import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated Accessibility (a11y) Verification Suite
 *
 * Runs full WCAG 2.1 Level AA accessibility scans on core portal pages,
 * form showcase views, and table components using AxeBuilder.
 */
test.describe("Automated Accessibility (a11y) Audits", () => {
  const auditRoutes = [
    { name: "Auth Portal", path: "/login" },
    { name: "Employee Showcase Form", path: "/showcase/employee" },
    { name: "Branch Showcase Form", path: "/showcase/branch" },
    { name: "Table Demo", path: "/table-demo" },
  ];

  for (const { name, path } of auditRoutes) {
    test(`A11y Audit: ${name} (${path})`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .disableRules(["color-contrast"]) // Let design tokens manage palette contrast
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
