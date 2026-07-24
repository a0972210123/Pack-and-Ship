#!/usr/bin/env node
// Generate 16:9 YouTube thumbnail(s) (1280×720) from ship.config.json.
// Styles (assets.thumbnail.styles, default ["simple"]):
//   "simple"       → big 2-line text + play affordance      → thumbnail-16x9.png
//   "before-after" → big hook + before/after faux dashboards → thumbnail-beforeafter-16x9.png
// Usage: node assets/gen-thumbnail.mjs [targetDir=.]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve, pageWithCfg } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
const cfg = fs.existsSync(path.join(dir, 'ship.config.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'ship.config.json'), 'utf8')) : {};
const A = cfg.assets || {};
const brand = A.brand || {};
const T = A.thumbnail || {};
const out = path.join(dir, 'dist', 'assets');
fs.mkdirSync(out, { recursive: true });

const styles = T.styles || ['simple'];
const base = { name: brand.name || cfg.repo || 'Skill', emoji: brand.emoji, accent: brand.accent, accentDark: brand.accentDark, gold: brand.gold, goldDark: brand.goldDark };

const RENDER = {
  simple: {
    file: 'thumbnail.html', out: 'thumbnail-16x9.png',
    cfg: () => ({ ...base,
      title: T.title || (A.social && A.social.tagline) || cfg.summary,
      highlight: T.highlight || (A.social && A.social.highlight),
      badge: T.badge || (cfg.price && cfg.price.amount ? '' : 'FREE · MIT') }),
  },
  'before-after': {
    file: 'thumbnail-beforeafter.html', out: 'thumbnail-beforeafter-16x9.png',
    cfg: () => ({ ...base, ...(T.beforeAfter || {}) }),
  },
};

const browser = await launch();
const { server, port } = await serve(here);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });

for (const s of styles) {
  const R = RENDER[s];
  if (!R) { console.log(`! unknown thumbnail style "${s}" — skipping`); continue; }
  const page = await pageWithCfg(ctx, `http://localhost:${port}/${R.file}`, R.cfg());
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, R.out) });
  await page.close();
  console.log(`✓ dist/assets/${R.out}`);
}
await ctx.close(); server.close(); await browser.close();
