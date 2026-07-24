#!/usr/bin/env node
// Generate branded listing images from ship.config.json → dist/assets/.
//   social-1280x640.png  (GitHub social preview / OG image)
//   hero-16x9.png        (Polar/marketplace product image)
// Usage: node assets/gen-images.mjs [targetDir=.]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve, pageWithCfg } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
const cfg = fs.existsSync(path.join(dir, 'ship.config.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'ship.config.json'), 'utf8')) : {};
const A = cfg.assets || {};
const brand = A.brand || {};
const out = path.join(dir, 'dist', 'assets');
fs.mkdirSync(out, { recursive: true });

const socialCfg = {
  name: brand.name || cfg.repo || 'Skill', emoji: brand.emoji, accent: brand.accent, accentDark: brand.accentDark,
  tagline: (A.social && A.social.tagline) || cfg.summary, highlight: A.social && A.social.highlight,
  sub: (A.social && A.social.sub) || '', pills: (A.social && A.social.pills) || (cfg.tags || []).slice(0, 5),
  install: cfg.install,
};
const heroCfg = {
  name: brand.name || cfg.repo || 'Skill', emoji: brand.emoji, gold: brand.gold, goldDark: brand.goldDark,
  headline: (A.hero && A.hero.headline) || cfg.summary, highlight: A.hero && A.hero.highlight,
  features: (A.hero && A.hero.features) || [], footer: (A.hero && A.hero.footer) || '',
};

const browser = await launch();
const { server, port } = await serve(here);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 });

let page = await pageWithCfg(ctx, `http://localhost:${port}/social-card.html`, socialCfg);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'social-1280x640.png') });
console.log('✓ dist/assets/social-1280x640.png');

await page.setViewportSize({ width: 1280, height: 720 });
page = await pageWithCfg(ctx, `http://localhost:${port}/hero-card.html`, heroCfg);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'hero-16x9.png') });
console.log('✓ dist/assets/hero-16x9.png');

await ctx.close(); server.close(); await browser.close();
