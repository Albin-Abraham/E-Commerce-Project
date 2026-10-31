import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || "/home/albin-abraham/.gemini/antigravity-cli/brain/05c0810d-6b44-4fcf-8d60-408c3e923a18/screenshots";
const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  console.log(`Starting Visual Audit against ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const pagesToCapture = [
    {
      name: "01-persona-selection-desktop",
      url: `${BASE_URL}/login`,
      viewport: { width: 1440, height: 900 },
      waitFor: "text=Choose Your Portal",
    },
    {
      name: "02-persona-selection-mobile",
      url: `${BASE_URL}/login`,
      viewport: { width: 390, height: 844 },
      waitFor: "text=Choose Your Portal",
    },
    {
      name: "03-customer-auth-desktop",
      url: `${BASE_URL}/login?mode=customer`,
      viewport: { width: 1440, height: 900 },
      waitFor: "text=Retail Consumer Hub",
    },
    {
      name: "04-partner-auth-desktop",
      url: `${BASE_URL}/login?mode=partner`,
      viewport: { width: 1440, height: 900 },
      waitFor: "text=B2B Supplier & Partner Gateway",
    },
    {
      name: "05-staff-auth-desktop",
      url: `${BASE_URL}/login?mode=staff`,
      viewport: { width: 1440, height: 900 },
      waitFor: "text=Enterprise Operations Terminal",
    },
    {
      name: "06-detail-renderer-showcase",
      url: `${BASE_URL}/showcase/detail`,
      viewport: { width: 1440, height: 1100 },
      waitFor: "text=DetailRenderer System Showcase",
    },
    {
      name: "07-customer-auth-mobile",
      url: `${BASE_URL}/login?mode=customer`,
      viewport: { width: 390, height: 844 },
      waitFor: "text=Welcome to ZenOS",
    },
  ];

  for (const item of pagesToCapture) {
    console.log(`Navigating to ${item.name} (${item.url})...`);
    await page.setViewportSize(item.viewport);
    try {
      await page.goto(item.url, { waitUntil: "networkidle", timeout: 15000 });
      if (item.waitFor) {
        await page.waitForSelector(item.waitFor, { timeout: 10000 });
      }
      await page.waitForTimeout(600); // Allow animations & layout to settle
      const outputPath = path.join(ARTIFACT_DIR, `${item.name}.png`);
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`✓ Saved screenshot: ${outputPath}`);
    } catch (err) {
      console.error(`✗ Error capturing ${item.name}:`, err.message);
      // Attempt screenshot anyway
      try {
        const errPath = path.join(ARTIFACT_DIR, `${item.name}-fallback.png`);
        await page.screenshot({ path: errPath, fullPage: true });
        console.log(`✓ Saved fallback screenshot: ${errPath}`);
      } catch (e) {
        console.error("Failed fallback screenshot:", e.message);
      }
    }
  }

  await browser.close();
  console.log("Visual audit capture completed successfully!");
}

run().catch((err) => {
  console.error("Visual audit failed:", err);
  process.exit(1);
});
