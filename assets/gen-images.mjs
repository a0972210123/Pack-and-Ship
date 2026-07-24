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
  install: cfg.install, mock: A.social && A.social.mock,
};
const heroCfg = {
  name: brand.name || cfg.repo || 'Skill', emoji: brand.emoji, gold: brand.gold, goldDark: brand.goldDark,
  headline: (A.hero && A.hero.headline) || cfg.summary, highlight: A.hero && A.hero.highlight,
  features: (A.hero && A.hero.features) || [], footer: (A.hero && A.hero.footer) || '',
};

// Verify layout (no overflow / no text-over-mockup collision) and, when a mock is
// configured, that the iconified example actually rendered. Returns issue strings.
async function verifySocial(page, wantsMock) {
  return page.evaluate((wantsMock) => {
    const issues = [];
    const W = 1280, H = 640, vis = el => el && el.getBoundingClientRect();
    const col = vis(document.querySelector('.col'));
    // check real content elements against the frame (the decorative .glow bleeds off-frame
    // on purpose and is clipped by overflow:hidden — don't flag it via body.scrollWidth)
    for (const sel of ['.col', '#h1', '#sub', '.row', '#install', '.mock', '.win']) {
      const r = vis(document.querySelector(sel));
      if (r && r.width > 0 && (r.right > W + 1 || r.bottom > H + 1 || r.left < -1 || r.top < -1)) issues.push(`${sel} outside frame`);
    }
    const h1 = vis(document.querySelector('#h1'));
    if (h1 && h1.height > 210) issues.push(`headline wraps too tall (${Math.round(h1.height)}px) — shorten tagline/highlight`);
    const mock = document.getElementById('mock');
    const shown = mock && getComputedStyle(mock).display !== 'none';
    if (wantsMock) {
      if (!shown) { issues.push('mock configured but not rendered'); return issues; }
      const win = vis(document.querySelector('.win')), lit = vis(document.querySelector('.cd.lit')), tip = vis(document.querySelector('.tip'));
      if (!win || win.width < 40 || win.height < 40) issues.push('mock window missing/degenerate');
      if (!lit || lit.width < 20) issues.push('spotlit card missing (no iconified emphasis)');
      if (!tip || tip.width < 20 || !document.querySelector('.tip').textContent.trim()) issues.push('tour tooltip missing/empty');
      // text column must not collide with the mockup
      const mr = vis(mock);
      if (col && mr && col.right > mr.left + 2) issues.push('text column overlaps the mockup');
    }
    return issues;
  }, wantsMock);
}

const browser = await launch();
const { server, port } = await serve(here);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 });

let hadDefect = false;
let page = await pageWithCfg(ctx, `http://localhost:${port}/social-card.html`, socialCfg);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'social-1280x640.png') });
const sIssues = await verifySocial(page, !!(socialCfg.mock && (socialCfg.mock.cards || []).length));
if (sIssues.length) { hadDefect = true; console.log('✗ social-1280x640.png — layout/iconification issues:'); sIssues.forEach(i => console.log('  · ' + i)); }
else console.log('✓ dist/assets/social-1280x640.png (layout + iconification verified)');

await page.setViewportSize({ width: 1280, height: 720 });
page = await pageWithCfg(ctx, `http://localhost:${port}/hero-card.html`, heroCfg);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'hero-16x9.png') });
console.log('✓ dist/assets/hero-16x9.png');

await ctx.close(); server.close(); await browser.close();

if (hadDefect) {
  console.error('\n! social card failed verification — the PNG was written so you can inspect it, but fix the issues above before shipping it.');
  process.exit(1);
}
