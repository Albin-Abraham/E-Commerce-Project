const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("http://localhost:8090/showcase/auth");
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const result = [];
    const scroll = {
      scrollH: document.documentElement.scrollHeight,
      clientH: document.documentElement.clientHeight,
      overflow: Math.max(
        0,
        document.documentElement.scrollHeight -
          document.documentElement.clientHeight
      ),
    };
    result.push("=== PAGE SCROLL ===");
    result.push(JSON.stringify(scroll));

    const elements = document.querySelectorAll("div");
    result.push("\n=== ELEMENTS WITH SIGNIFICANT PADDING/MARGIN ===");
    elements.forEach((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const pt = parseFloat(s.paddingTop);
      const pb = parseFloat(s.paddingBottom);
      const mt = parseFloat(s.marginTop);
      const mb = parseFloat(s.marginBottom);
      if (pt + pb + mt + mb > 20 && r.height > 20) {
        const cls = el.className.substring(0, 100);
        result.push(
          `h:${Math.round(r.height)} pt:${pt} pb:${pb} mt:${mt} mb:${mb} | ${cls}`
        );
      }
    });
    return result.join("\n");
  });

  console.log(info);
  await browser.close();
})();
