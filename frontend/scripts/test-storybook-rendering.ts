import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const PORT = 6007;
const STATIC_DIR = path.resolve(process.cwd(), "storybook-static");
const SCREENSHOT_DIR = path.resolve(process.cwd(), "test-results/storybook-screenshots");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function createStaticServer(): http.Server {
  return http.createServer((req, res) => {
    let reqPath = req.url ? req.url.split("?")[0] : "/";
    if (reqPath === "/") reqPath = "/index.html";

    const filePath = path.join(STATIC_DIR, reqPath);
    if (!filePath.startsWith(STATIC_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      res.writeHead(200, { "Content-Type": contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });
}

const STORIES_TO_VERIFY = [
  // ── Atoms ─────────────────────────────────────────────────────────────
  { id: "form-atoms-fieldicon--default", title: "FieldIcon - Default" },
  { id: "form-atoms-fieldicon--custom-scale", title: "FieldIcon - CustomScale (Settings)" },
  { id: "form-atoms-fieldicon--icon-registry-gallery", title: "FieldIcon - IconRegistryGallery" },
  { id: "form-atoms-fieldtooltip--default", title: "FieldTooltip - Default" },
  { id: "form-atoms-fieldtooltip--long-text", title: "FieldTooltip - LongText" },

  // ── Structure ─────────────────────────────────────────────────────────
  { id: "form-structure-fieldshell--top-label-default", title: "FieldShell - TopLabelDefault" },
  { id: "form-structure-fieldshell--side-label-layout", title: "FieldShell - SideLabelLayout" },
  { id: "form-structure-fieldshell--inline-label-layout", title: "FieldShell - InlineLabelLayout" },
  { id: "form-structure-fieldshell--hidden-label-accessibility", title: "FieldShell - HiddenLabelAccessibility" },
  { id: "form-structure-fieldshell--error-state-with-reservation", title: "FieldShell - ErrorStateWithReservation" },
  { id: "form-structure-fieldshell--density-permutations", title: "FieldShell - DensityPermutations" },
  { id: "form-structure-inputwrapper--top-placement", title: "InputWrapper - TopPlacement" },
  { id: "form-structure-inputwrapper--side-placement", title: "InputWrapper - SidePlacement" },
  { id: "form-structure-inputwrapper--inline-placement", title: "InputWrapper - InlinePlacement" },
  { id: "form-structure-inputwrapper--error-reservation-toggle", title: "InputWrapper - ErrorReservationToggle" },
  { id: "form-structure-outerwrapper--default-surface", title: "OuterWrapper - DefaultSurface" },
  { id: "form-structure-outerwrapper--with-start-and-end-slots", title: "OuterWrapper - WithStartAndEndSlots" },
  { id: "form-structure-outerwrapper--textarea-surface", title: "OuterWrapper - TextareaSurface" },

  // ── Primitives (Static) ───────────────────────────────────────────────
  { id: "form-static-staticfieldssuite--h-3-default", title: "StaticFields - H3Default" },
  { id: "form-static-staticfieldssuite--all-heading-levels", title: "StaticFields - AllHeadingLevels" },
  { id: "form-static-staticfieldssuite--standalone-header-without-field", title: "StaticFields - StandaloneHeader" },
  { id: "form-static-staticfieldssuite--paragraph-and-html", title: "StaticFields - ParagraphAndHTML" },
  { id: "form-static-staticfieldssuite--dividers-showcase", title: "StaticFields - DividersShowcase" },
  { id: "form-static-staticfieldssuite--raw-html-block", title: "StaticFields - RawHtmlBlock" },

  // ── WrapperFields & Integration ───────────────────────────────────────
  { id: "form-integration-wrapperfieldssuite--controlled-field-focus-stability", title: "WrapperFields - ControlledFieldFocusStability" },
  { id: "form-integration-wrapperfieldssuite--uncontrolled-field-binding", title: "WrapperFields - UncontrolledFieldBinding" },
  { id: "form-integration-wrapperfieldssuite--nested-composition-anti-double-wrap", title: "WrapperFields - NestedCompositionAntiDoubleWrap" },
  { id: "form-integration-wrapperfieldssuite--unified-field-smart-switching", title: "WrapperFields - UnifiedFieldSmartSwitching" },

  // ── Upgraded Primitive Fields ─────────────────────────────────────────
  { id: "form-fields-buttonfield--all-variants-showcase", title: "ButtonField - AllVariantsShowcase" },
  { id: "form-fields-buttonfield--sizes-showcase", title: "ButtonField - SizesShowcase" },
  { id: "form-fields-buttonfield--loading-state", title: "ButtonField - LoadingState" },
  { id: "form-fields-radiofield--card-variant-showcase", title: "RadioField - CardVariantShowcase" },
  { id: "form-fields-radiofield--segmented-control-showcase", title: "RadioField - SegmentedControlShowcase" },
  { id: "form-fields-checkboxfield--card-variant-showcase", title: "CheckboxField - CardVariantShowcase" },
  { id: "form-fields-checkboxfield--indeterminate-state", title: "CheckboxField - IndeterminateState" },
  { id: "form-fields-switchfield--card-variant-showcase", title: "SwitchField - CardVariantShowcase" },
  { id: "form-fields-switchfield--sizes-showcase", title: "SwitchField - SizesShowcase" },
  { id: "form-fields-rangefield--with-unit-and-badge", title: "RangeField - WithUnitAndBadge" },
  { id: "form-fields-filefield--default", title: "FileField - DefaultDropzone" },
  { id: "form-fields-filefield--compact-variant-showcase", title: "FileField - CompactVariantShowcase" },
  { id: "form-fields-multiselectfield--with-chips-and-tags", title: "MultiSelectField - WithChipsAndTags" },

  // ── Formless DetailRenderer & Slots ───────────────────────────────────
  { id: "form-detail-detailrenderer--product-detail-showcase", title: "DetailRenderer - ProductDetailShowcase" },
  { id: "form-detail-detailrenderer--key-value-layout-showcase", title: "DetailRenderer - KeyValueLayoutShowcase" },
  { id: "form-detail-detailrenderer--slot-injection-showcase", title: "DetailRenderer - SlotInjectionShowcase" },
  { id: "form-detail-detailrenderer--interactive-widgets-without-form", title: "DetailRenderer - InteractiveWidgetsWithoutForm" },
  { id: "form-detail-detailrenderer--flat-layout-showcase", title: "DetailRenderer - FlatLayoutShowcase" },
];

async function main() {
  console.log("===============================================================================");
  console.log("🚀 Starting Storybook Live On-Screen Rendering Verification Runner");
  console.log(`📁 Static Directory: ${STATIC_DIR}`);
  console.log(`📸 Screenshots Directory: ${SCREENSHOT_DIR}`);
  console.log("===============================================================================\n");

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const server = createStaticServer();
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  console.log(`📡 Static Storybook server listening on http://localhost:${PORT}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  let totalPassed = 0;
  let totalFailed = 0;
  const failureDetails: string[] = [];

  try {
    for (const story of STORIES_TO_VERIFY) {
      const page = await context.newPage();
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];

      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      const storyUrl = `http://localhost:${PORT}/iframe.html?id=${story.id}&viewMode=story`;

      try {
        await page.goto(storyUrl, { waitUntil: "networkidle", timeout: 15000 });

        // Wait for Storybook root to mount
        await page.waitForSelector("#storybook-root", { timeout: 10000 });

        // Check if there is any critical root content rendered
        const rootContent = await page.locator("#storybook-root").innerHTML();
        if (!rootContent || rootContent.trim().length === 0) {
          throw new Error("Story rendered an empty #storybook-root container");
        }

        // Check for active Storybook error display (only active if body has class sb-show-errordisplay)
        const isErrorVisible = await page.evaluate(() => {
          return document.body.classList.contains("sb-show-errordisplay");
        });
        if (isErrorVisible) {
          const errText = await page.locator("#error-message, #error-stack").allInnerTexts();
          throw new Error(`Storybook Error Display: ${errText.join(" | ")}`);
        }

        if (pageErrors.length > 0) {
          throw new Error(`Uncaught runtime exceptions:\n  ${pageErrors.join("\n  ")}`);
        }

        // Specific behavioral assertions
        if (story.id === "form-integration-wrapperfieldssuite--controlled-field-focus-stability") {
          const input = page.locator('input[placeholder*="Type continuously here"]');
          await input.waitFor({ state: "visible", timeout: 5000 });
          await input.click();
          await input.pressSequentially("ZenOS Keystrokes", { delay: 15 });

          const isFocused = await page.evaluate(() => {
            const el = document.querySelector('input[placeholder*="Type continuously here"]');
            return document.activeElement === el;
          });
          if (!isFocused) {
            throw new Error("Focus dropped during typing in ControlledField!");
          }

          const val = await input.inputValue();
          if (val !== "ZenOS Keystrokes") {
            throw new Error(`Input value mismatch. Expected 'ZenOS Keystrokes', got '${val}'`);
          }

          const keystrokesText = await page.locator("text=Keystrokes:").innerText();
          if (!keystrokesText.includes("16")) {
            throw new Error(`Expected keystroke count of 16, got '${keystrokesText}'`);
          }
        }

        if (story.id === "form-integration-wrapperfieldssuite--nested-composition-anti-double-wrap") {
          const surfaceCount = await page.evaluate(() => {
            return document.querySelectorAll(".form-field-surface").length;
          });
          if (surfaceCount !== 1) {
            throw new Error(`Double-wrap detected! Expected exactly 1 .form-field-surface, found ${surfaceCount}`);
          }
          const labelCount = await page.evaluate(() => {
            return document.querySelectorAll("label").length;
          });
          if (labelCount !== 1) {
            throw new Error(`Duplicate label detected! Expected exactly 1 label, found ${labelCount}`);
          }
        }

        if (story.id === "form-atoms-fieldicon--icon-registry-gallery") {
          const svgCount = await page.evaluate(() => {
            return document.querySelectorAll("svg").length;
          });
          if (svgCount < 12) {
            throw new Error(`Expected at least 12 SVGs in IconRegistryGallery, found ${svgCount}`);
          }
        }

        // Take on-screen screenshot with retry
        const screenshotPath = path.join(SCREENSHOT_DIR, `${story.id}.png`);
        try {
          await page.screenshot({ path: screenshotPath, fullPage: true });
        } catch {
          await page.waitForTimeout(300);
          await page.screenshot({ path: screenshotPath, fullPage: true });
        }

        console.log(`✅ [PASS] ${story.title} -> saved to ${path.basename(screenshotPath)}`);
        totalPassed += 1;
      } catch (err: any) {
        console.error(`❌ [FAIL] ${story.title}: ${err.message}`);
        failureDetails.push(`${story.title} (${story.id}): ${err.message}`);
        totalFailed += 1;
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
    await browser.close();
    server.close();
  }

  console.log("\n===============================================================================");
  console.log("📊 STORYBOOK LIVE ON-SCREEN VERIFICATION SUMMARY");
  console.log("===============================================================================");
  console.log(`Total Stories Checked: ${STORIES_TO_VERIFY.length}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);

  if (failureDetails.length > 0) {
    console.log("\n❌ Failure Details:");
    failureDetails.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  } else {
    console.log("\n🎉 ALL STORIES RENDERED ON-SCREEN WITH 100% INTEGRITY & ZERO ERRORS!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal runner error:", err);
  process.exit(1);
});
