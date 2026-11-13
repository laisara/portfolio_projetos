// Gera launcher/app.ico (16-256 px) a partir de frontend/icons/favicon.svg. Requer Playwright e ImageMagick (convert).
// Uso: node scripts/make_ico.js
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const { chromium } = require("playwright");
const root = path.join(__dirname, "..");
const svg = fs.readFileSync(path.join(root, "frontend", "icons", "favicon.svg"), "utf8");
const sizes = [16, 24, 32, 48, 64, 128, 256];
(async () => {
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "ico-"));
  const b = await chromium.launch();
  const files = [];
  for (const s of sizes) {
    const pg = await b.newPage({ viewport: { width: s, height: s } });
    await pg.setContent(`<body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${s}" height="${s}" `)}</body>`);
    const f = path.join(tmp, `i${s}.png`);
    await pg.screenshot({ path: f, omitBackground: true });
    files.push(f);
    await pg.close();
  }
  await b.close();
  execFileSync("convert", [...files, path.join(root, "launcher", "app.ico")]);
  console.log("ok launcher/app.ico", sizes.join(","));
})();
