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
async function verifySocial(page, wantsMock, wantsTip) {
  return page.evaluate(({ wantsMock, wantsTip }) => {
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
      const litEl = document.querySelector('.cd.lit'), tipEl = document.querySelector('.tip');
      const win = vis(document.querySelector('.win')), lit = vis(litEl), tip = vis(tipEl);
      if (!win || win.width < 40 || win.height < 40) issues.push('mock window missing/degenerate');
      if (document.querySelectorAll('.cd').length < 2) issues.push('faux UI needs ≥2 cards to read as a real interface');
      if (!lit || lit.width < 20) issues.push('spotlit card missing (no iconified emphasis)');
      // the spotlight mask = the lit card's large dark box-shadow spread; assert it's there
      const sh = litEl ? getComputedStyle(litEl).boxShadow : '';
      if (!/rgba?\(0, 0, 0/.test(sh) || !/\b[1-9]\d{2,}px/.test(sh)) issues.push('spotlight mask missing (lit card has no dimming box-shadow spread)');
      // Only assert the tooltip when one is configured. It used to be assumed on every
      // mock, which made a tour product's concept a requirement for everyone else.
      if (wantsTip && (!tip || tip.width < 20 || !(tipEl && tipEl.textContent.trim()))) issues.push('tour tooltip missing/empty');
      if (wantsTip && tip && win && (tip.bottom > win.bottom + 1 || tip.right > win.right + 1 || tip.left < win.left - 1)) issues.push('tooltip escapes the window');
      // text column must not collide with the mockup
      const mr = vis(mock);
      if (col && mr && col.right > mr.left + 2) issues.push('text column overlaps the mockup');
    }
    return issues;
  }, { wantsMock, wantsTip });
}

const browser = await launch();
const { server, port } = await serve(here);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 640 }, deviceScaleFactor: 2 });

let hadDefect = false;
let page = await pageWithCfg(ctx, `http://localhost:${port}/social-card.html`, socialCfg);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(out, 'social-1280x640.png') });
const sIssues = await verifySocial(page, !!(socialCfg.mock && (socialCfg.mock.cards || []).length), !!(socialCfg.mock && socialCfg.mock.tip));
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
