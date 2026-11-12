// Gera os PNGs do PWA a partir de frontend/icons/favicon.svg (Playwright/Chromium).
// Uso: node scripts/make_icons.js
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ICONS = path.join(__dirname, "..", "frontend", "icons");
const svg = fs.readFileSync(path.join(ICONS, "favicon.svg"), "utf8");
const targets = [["icon-192.png", 192, 0], ["icon-512.png", 512, 0], ["apple-touch-icon.png", 180, 0], ["maskable-512.png", 512, 0.2]];

(async () => {
  const b = await chromium.launch();
  for (const [name, size, pad] of targets) {
    const pg = await b.newPage({ viewport: { width: size, height: size } });
    const inner = Math.round(size * (1 - pad));
    const bg = pad ? "#070a09" : "transparent";
    await pg.setContent(`<html><body style="margin:0;background:${bg};display:grid;place-items:center;width:${size}px;height:${size}px">
      <div style="width:${inner}px;height:${inner}px">${svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
    await pg.screenshot({ path: path.join(ICONS, name), omitBackground: !pad });
    await pg.close();
  }
  await b.close();
  console.log("ok");
})();
