#!/usr/bin/env node
// Capture N listing screenshots of a demo page, across viewports × themes,
// stepping the demo tour between shots. → dist/assets/shots/
// Usage: node assets/gen-screenshots.mjs [targetDir=.]
// Config: assets.demoUrl (else the bundled templates/showcase.html is used);
//         assets.screenshots { count, viewports:[desktop|mobile], themes:[light|dark] }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
const cfg = fs.existsSync(path.join(dir, 'ship.config.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'ship.config.json'), 'utf8')) : {};
const A = cfg.assets || {};
const S = A.screenshots || {};
const count = Math.max(1, Math.min(65, S.count || 6));
const viewports = (S.viewports || ['desktop', 'mobile']);
const themes = (S.themes || ['light', 'dark']);
const out = path.join(dir, 'dist', 'assets', 'shots');
fs.mkdirSync(out, { recursive: true });

const VP = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844, isMobile: true } };

const browser = await launch();
const { server, port } = await serve(here);
const url = A.demoUrl || `http://localhost:${port}/templates/showcase.html`;

let n = 0;
// distribute `count` shots across viewport×theme combos, stepping the tour
const combos = [];
for (const v of viewports) for (const t of themes) combos.push([v, t]);
const perCombo = Math.max(1, Math.ceil(count / combos.length));

for (const [v, t] of combos) {
  if (n >= count) break;
  const ctx = await browser.newContext({ viewport: { width: VP[v].width, height: VP[v].height }, isMobile: !!VP[v].isMobile, hasTouch: !!VP[v].isMobile, colorScheme: t });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForTimeout(900);
  await page.evaluate(() => window.__startTour && window.__startTour());
  for (let s = 0; s < perCombo && n < count; s++) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, `${String(++n).padStart(2, '0')}-${v}-${t}.png`) });
    await page.evaluate(() => { const b = document.getElementById('ttNext'); if (b) b.click(); });
  }
  await ctx.close();
}
server.close(); await browser.close();
console.log(`✓ ${n} screenshots → dist/assets/shots/`);
