const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // Navigate directly to the auth page
  await page.goto("http://localhost:8090/showcase/auth", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const result = [];
    result.push("=== PAGE SCROLL ===");
    result.push(
      `scrollH: ${document.documentElement.scrollHeight}, clientH: ${document.documentElement.clientHeight}, overflow: ${Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight)}px`
    );

    result.push("\n=== BODY & WRAPPERS HEIGHT ===");
    const body = document.body;
    const s = getComputedStyle(body);
    result.push(
      `body: h=${body.scrollHeight}, pt=${s.paddingTop}, pb=${s.paddingBottom}`
    );

    result.push("\n=== ALL DIVS WITH SIGNIFICANT SPACING (>16px pt+pb) ===");
    document.querySelectorAll("div").forEach((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const pt = parseFloat(s.paddingTop);
      const pb = parseFloat(s.paddingBottom);
      const mt = parseFloat(s.marginTop);
      const mb = parseFloat(s.marginBottom);
      if (pt + pb > 16 && r.height > 40) {
        result.push(
          `[h:${Math.round(r.height)} top:${Math.round(r.top)}] pt:${pt}px pb:${pb}px mt:${mt}px mb:${mb}px | ${el.className.substring(0, 120)}`
        );
      }
    });
    return result.join("\n");
  });

  console.log(info);

  // Take a screenshot
  await page.screenshot({ path: "auth-spacing-debug.png", fullPage: true });
  console.log("\nScreenshot saved to auth-spacing-debug.png");

  await browser.close();
})();
