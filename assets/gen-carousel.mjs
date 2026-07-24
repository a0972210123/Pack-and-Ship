#!/usr/bin/env node
// Generate a branded LinkedIn/Instagram carousel (1080×1350, 4:5 portrait) —
// one PNG per slide: cover → features → CTA. → dist/assets/carousel/
// Usage: node assets/gen-carousel.mjs [targetDir=.]
// Config: assets.carousel.slides = [{ type:'cover'|'feature'|'cta', ... }].
//   If absent, slides are derived from assets.social + assets.hero.features.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve, pageWithCfg } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
const cfg = fs.existsSync(path.join(dir, 'ship.config.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'ship.config.json'), 'utf8')) : {};
const A = cfg.assets || {};
const brand = A.brand || {};
const name = brand.name || cfg.repo || 'Skill';

// derive slides from social/hero if the config doesn't spell them out
function derive() {
  const social = A.social || {}, hero = A.hero || {};
  const slides = [{ type: 'cover', title: social.tagline || cfg.summary || name, highlight: social.highlight, sub: social.sub }];
  (hero.features || (cfg.tags || []).slice(0, 3)).slice(0, 4).forEach((f, i) => {
    const [title, ...rest] = String(f).split(' — ');
    slides.push({ type: 'feature', n: i + 1, title, text: rest.join(' — ') });
  });
  slides.push({ type: 'cta', title: 'Get it in one command', highlight: 'one command', lic: hero.footer || (cfg.price && cfg.price.amount ? '' : 'Free · MIT') });
  return slides;
}

const slides = (A.carousel && A.carousel.slides) || derive();
const out = path.join(dir, 'dist', 'assets', 'carousel');
fs.mkdirSync(out, { recursive: true });

const browser = await launch();
const { server, port } = await serve(here);
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });

for (let i = 0; i < slides.length; i++) {
  const c = {
    name, emoji: brand.emoji, accent: brand.accent, accentDark: brand.accentDark,
    install: cfg.install, homepage: cfg.homepage,
    slide: slides[i], index: i, total: slides.length,
  };
  const page = await pageWithCfg(ctx, `http://localhost:${port}/carousel-slide.html`, c);
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, `${String(i + 1).padStart(2, '0')}-${slides[i].type}.png`) });
  await page.close();
}
await ctx.close(); server.close(); await browser.close();
console.log(`✓ ${slides.length} carousel slides → dist/assets/carousel/`);
