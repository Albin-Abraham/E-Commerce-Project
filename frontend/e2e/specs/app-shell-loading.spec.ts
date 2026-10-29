import { expect, test } from "@playwright/test";

test.describe("App Shell Loading Performance", () => {
  test("should load critical dependencies and calculate load times", async ({
    page,
  }) => {
    test.setTimeout(60000);
    const resources: any[] = [];

    // Listen for all network responses to track dependency loading
    page.on("response", (response) => {
      resources.push({
        url: response.url(),
        status: response.status(),
        type: response.request().resourceType(),
        size: response.request().headers()["content-length"] || 0,
      });
    });

    const startTime = Date.now();

    // Navigate to the app shell entry point
    await page.goto("/");

    // Wait for the network to be completely idle (no new requests for 500ms)
    await page.waitForLoadState("networkidle");

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    console.log(`[Performance] App Shell network idle in ${loadTime}ms`);

    // Categorize dependencies
    const jsResources = resources.filter(
      (r) => r.type === "script" || r.url.endsWith(".js")
    );
    const cssResources = resources.filter(
      (r) => r.type === "stylesheet" || r.url.endsWith(".css")
    );
    const fetchResources = resources.filter(
      (r) => r.type === "fetch" || r.type === "xhr"
    );

    console.log(`[Dependencies] Loaded ${jsResources.length} JS files`);
    console.log(`[Dependencies] Loaded ${cssResources.length} CSS files`);
    console.log(`[Dependencies] Made ${fetchResources.length} API/Fetch calls`);

    // Output critical dependencies (often bundled in vendor or main files)
    const criticalDeps = resources.filter(
      (r) => r.url.includes("vendor") || r.url.includes("main")
    );
    if (criticalDeps.length > 0) {
      console.log(
        "[Critical Packages] Loaded:",
        criticalDeps.map((r) => r.url)
      );
    }

    // Verify the App Shell itself successfully mounted on the DOM
    const root = page.locator("#root"); // Update to your app's mount point if different
    await expect(root).toBeVisible();

    // Basic performance assertion to ensure it meets our baseline
    expect(loadTime).toBeLessThan(45000);
  });
});
