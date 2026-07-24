#!/usr/bin/env node
// Generate a 16:9 YouTube thumbnail (1280×720) — big text + play affordance.
// → dist/assets/thumbnail-16x9.png
// Usage: node assets/gen-thumbnail.mjs [targetDir=.]
// Config: assets.thumbnail { title, highlight, badge }. Falls back to social.tagline.
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

const c = {
  name: brand.name || cfg.repo || 'Skill', emoji: brand.emoji,
  accent: brand.accent, accentDark: brand.accentDark, gold: brand.gold, goldDark: brand.goldDark,
  title: T.title || (A.social && A.social.tagline) || cfg.summary,
  highlight: T.highlight || (A.social && A.social.highlight),
  badge: T.badge || (cfg.price && cfg.price.amount ? '' : 'FREE · MIT'),
};

const browser = await launch();
const { server, port } = await serve(here);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const page = await pageWithCfg(ctx, `http://localhost:${port}/thumbnail.html`, c);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'thumbnail-16x9.png') });
await ctx.close(); server.close(); await browser.close();
console.log('✓ dist/assets/thumbnail-16x9.png');
