const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("http://localhost:8090/showcase/auth", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(1000);

  const getPanelInfo = async (modeName) => {
    return await page.evaluate((mode) => {
      const result = [];
      result.push(`=================== MODE: ${mode} ===================`);
      result.push(
        `scrollH:${document.documentElement.scrollHeight} clientH:${document.documentElement.clientHeight} overflow:${Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight)}px`
      );

      const formPanel = document.querySelector(
        '[class*="animate-slide-right"]'
      );
      if (!formPanel) {
        result.push("Form panel not found!");
        return result.join("\n");
      }

      const fp = formPanel.getBoundingClientRect();
      result.push(
        `Form Panel: h:${Math.round(fp.height)} top:${Math.round(fp.top)} bottom:${Math.round(fp.bottom)}`
      );

      const walk = (el, depth) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const pt = parseFloat(s.paddingTop);
        const pb = parseFloat(s.paddingBottom);
        const mt = parseFloat(s.marginTop);
        const mb = parseFloat(s.marginBottom);
        const indent = "  ".repeat(depth);
        const cls = (
          typeof el.className === "string" ? el.className : ""
        ).substring(0, 90);
        result.push(
          `${indent}[h:${Math.round(r.height)}] pt:${pt} pb:${pb} mt:${mt} mb:${mb} gap:${s.gap} | ${el.tagName.toLowerCase()}.${cls}`
        );
        if (depth < 16) {
          Array.from(el.children).forEach((child) => walk(child, depth + 1));
        }
      };
      walk(formPanel, 0);
      return result.join("\n");
    }, modeName);
  };

  console.log(await getPanelInfo("SIGN IN"));
  await page.screenshot({ path: "signin-spacing.png" });

  // Click Sign Up tab
  await page.locator('button:has-text("Sign Up")').click();
  await page.waitForTimeout(1000);

  console.log(await getPanelInfo("SIGN UP"));
  await page.screenshot({ path: "signup-spacing.png" });

  await browser.close();
})();
