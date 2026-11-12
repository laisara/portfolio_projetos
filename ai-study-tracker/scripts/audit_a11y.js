// Uso: npm pack axe-core; extraia; NODE_PATH=$(npm root -g) node scripts/audit_a11y.js <caminho/axe.min.js> http://localhost:8000/
const { chromium } = require("playwright");
const fs = require("fs");
const axeSrc = fs.readFileSync(process.argv[2], "utf8");
const base = process.argv[3];
const pages = ["#/", "#/calendar", "#/catalog", "#/course/CLAUDE-002", "#/lab", "#/lab/LAB-2", "#/skills", "#/achievements", "#/sessions", "#/plan", "#/settings"];
(async () => {
  const b = await chromium.launch();
  for (const mobile of [false, true]) {
    const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage();
    for (const h of pages) {
      await pg.goto(base + h, { waitUntil: "networkidle" }); await pg.waitForTimeout(700);
      await pg.evaluate(axeSrc);
      const r = await pg.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(" ") + " | " + (v.nodes[0].any[0]?.message || v.nodes[0].failureSummary || "").slice(0, 110) })));
      console.log((mobile ? "M " : "D ") + h, r.length ? JSON.stringify(r) : "OK");
    }
  }
  await b.close();
})();
