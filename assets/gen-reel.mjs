#!/usr/bin/env node
// Record 9:16 short-form marketing reels (one per language/hook variant) by
// overlaying a caption timeline on the demo page and driving its tour. → mp4s.
// Usage: node assets/gen-reel.mjs [targetDir=.]
// Needs ffmpeg. Config: assets.reel.variants = [{ id, lang, captions:[9 strings], endTag }]
//   captions index: 0-2 = hook (before the tour), 3-8 = over the 6 tour beats.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve, findFfmpeg, webmToMp4 } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
const cfg = fs.existsSync(path.join(dir, 'ship.config.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'ship.config.json'), 'utf8')) : {};
const A = cfg.assets || {};
const brand = A.brand || {};
const name = brand.name || cfg.repo || 'Skill';
const install = cfg.install || '';
const DEF = [
  { id: 'en-pain', lang: 'en', captions: [`Your app has <b>40 features</b>.`, `New users find <b>4</b>.`, `So they leave. 😔`,
    `One command reads your UI…`, `…and builds a <span class="p">guided tour</span>`, `step by step`, `dark mode · any language 🌍`, `accessible · <b>colorblind-safe</b> ♿`, `and <b>verified</b> ✓`],
    endTag: 'One command, done.' },
];
const variants = (A.reel && A.reel.variants) || DEF;
const out = path.join(dir, 'dist', 'assets');
fs.mkdirSync(out, { recursive: true });
const ff = findFfmpeg();

const OVERLAY_CSS = `#rcap{position:fixed;top:0;left:0;right:0;padding:34px 30px 40px;text-align:center;z-index:99500;background:linear-gradient(180deg,rgba(0,0,0,.82),rgba(0,0,0,.55) 70%,transparent);pointer-events:none}
#rcap h2{color:#fff;font:850 40px/1.12 system-ui,sans-serif;letter-spacing:-.01em;opacity:0;transform:translateY(12px);transition:opacity .35s,transform .35s;text-shadow:0 3px 20px rgba(0,0,0,.5);margin:0}
#rcap.show h2{opacity:1;transform:none}#rcap h2 b{color:#fbbf24}#rcap h2 .p{color:#c4b5fd}
#rend{position:fixed;inset:0;z-index:99700;background:radial-gradient(120% 120% at 50% 30%,#2b2350,#0b0b10 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;opacity:0;transition:opacity .5s;pointer-events:none;font-family:system-ui,sans-serif}
#rend.show{opacity:1}#rend .lg{width:96px;height:96px;border-radius:26px;background:linear-gradient(135deg,#a78bfa,#7c3aed);display:grid;place-items:center;font-size:3rem;color:#fff}
#rend h1{color:#fff;font-size:50px;font-weight:850;margin:0}#rend .tag{color:#c4b5fd;font-size:23px;font-weight:700}
#rend .cmd{margin-top:8px;background:#0f0f14;border:1px solid #2a2a33;color:#c4b5fd;font-family:ui-monospace,Menlo,monospace;font-size:19px;font-weight:700;padding:14px 20px;border-radius:14px}`;

async function record(v) {
  const browser = await launch();
  const { server, port } = await serve(here);
  const url = A.demoUrl || `http://localhost:${port}/templates/showcase.html`;
  const raw = path.join(out, '_reel_raw_' + v.id);
  fs.rmSync(raw, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, recordVideo: { dir: raw, size: { width: 540, height: 960 } } });
  const page = await ctx.newPage();
  await page.goto(url); await page.waitForTimeout(600);
  await page.addStyleTag({ content: OVERLAY_CSS });
  await page.evaluate(({ caps, endTag, name, install }) => {
    const cap = document.createElement('div'); cap.id = 'rcap'; cap.innerHTML = '<h2 id="rcapT"></h2>'; document.body.appendChild(cap);
    const end = document.createElement('div'); end.id = 'rend';
    end.innerHTML = `<div class="lg">✦</div><h1>${name}</h1><div class="tag">${endTag || ''}</div>${install ? `<div class="cmd">${install}</div>` : ''}`;
    document.body.appendChild(end);
    const T = document.getElementById('rcapT');
    const show = h => { cap.classList.remove('show'); setTimeout(() => { T.innerHTML = h; cap.classList.add('show'); }, 180); };
    const hide = () => cap.classList.remove('show');
    const next = () => document.getElementById('ttNext')?.click();
    const dark = () => document.documentElement.setAttribute('data-theme', 'dark');
    const c = caps; const S = (ms, fn) => setTimeout(fn, ms);
    S(300, () => show(c[0])); S(2100, () => show(c[1])); S(3900, () => show(c[2]));
    S(5600, () => { hide(); window.__startTour && window.__startTour(); });
    S(7000, () => show(c[3])); S(9200, () => { next(); show(c[4]); }); S(11400, () => { next(); show(c[5]); });
    S(13600, () => { next(); dark(); show(c[6]); }); S(15800, () => show(c[7])); S(18000, () => show(c[8]));
    S(20200, () => { try { Toutour.end(); } catch (e) {} hide(); end.classList.add('show'); });
  }, { caps: v.captions, endTag: v.endTag, name, install });
  await page.waitForTimeout(23000);
  await ctx.close(); server.close(); await browser.close();
  const webm = fs.readdirSync(raw).map(f => path.join(raw, f)).find(f => f.endsWith('.webm'));
  if (ff && webm) { webmToMp4(ff, webm, path.join(out, `reel-${v.id}-9x16.mp4`), { w: 1080, h: 1920 }); fs.rmSync(raw, { recursive: true, force: true }); console.log(`✓ dist/assets/reel-${v.id}-9x16.mp4`); }
  else console.log(`! recorded ${v.id} but no ffmpeg — raw webm kept at ${raw}`);
}

for (const v of variants) await record(v);
