#!/usr/bin/env node
// Record 9:16 short-form marketing reels (one per language/hook variant) by
// overlaying a caption timeline on the demo page and driving its tour. → mp4s.
// Usage: node assets/gen-reel.mjs [targetDir=.] [--only <variantId>]
//   --only records a single variant — worth using while iterating on the
//   composition, since each one costs ~25s of real-time recording.
// Needs ffmpeg. Config: assets.reel.variants = [{ id, lang, captions:[9 strings], endTag }]
//   captions index: 0-2 = hook (before the tour), 3-8 = over the 6 tour beats.
// The reel is composed inside a safe area and the remainder becomes a border, so
// feed chrome (header, caption strip, action rail, avatar) cannot cover content.
//   assets.reel.safeArea   { top, right, bottom, left } as fractions — see
//                          VERTICAL_SAFE_AREA in lib/render.mjs for the defaults
//   assets.reel.background frame colour (default: brand.bgDark)
//   assets.reel.border     { width, color } — set width 0 for a borderless inset
//   assets.reel.caption    { position:'top'|'bottom', height: 0.16, mask:'dark'|'light' }
//                          a reserved band, not an overlay — the page is moved
//                          aside so captions never land on the page's own chrome
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve, findFfmpeg, webmToMp4, safeFrame, VERTICAL_SAFE_AREA } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const positional = [];
let only = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--only') { only = argv[++i]; continue; }
  if (argv[i].startsWith('--only=')) { only = argv[i].slice('--only='.length); continue; }
  positional.push(argv[i]);
}
const dir = path.resolve(positional[0] || '.');
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
const allVariants = (A.reel && A.reel.variants) || DEF;
const variants = only ? allVariants.filter(v => v.id === only) : allVariants;
if (only && !variants.length) {
  console.error(`! no reel variant with id "${only}" — have: ${allVariants.map(v => v.id).join(', ')}`);
  process.exit(1);
}
const out = path.join(dir, 'dist', 'assets');
fs.mkdirSync(out, { recursive: true });
const ff = findFfmpeg();

// 1080×1920 output, but the reel is composed for the box the feed leaves visible
// and the rest becomes a border. Override per project with assets.reel.safeArea
// (fractions), .background and .border.
const OUT = { w: 1080, h: 1920 };
const R = A.reel || {};
const FRAME = safeFrame(OUT.w, OUT.h, R.safeArea || VERTICAL_SAFE_AREA, {
  background: R.background || brand.bgDark || '#0b0b10',
  border: R.border || { width: 3, color: brand.accent || '#a78bfa' },
});
// Record at half the visible box and let ffmpeg scale up — same trick as before,
// just sized to the frame instead of the whole canvas, so nothing is squashed.
const SHOT = { width: Math.round(FRAME.innerW / 2 / 2) * 2, height: Math.round(FRAME.innerH / 2 / 2) * 2 };

// The caption gets a reserved band rather than floating over the demo, because
// overlaying it collides with whatever the page has along that edge — a nav bar,
// a toolbar — and two sets of text on top of each other is unreadable however
// heavy the scrim. The page is translated away from the band, so the space is
// genuinely given up rather than covered.
const CAP = R.caption || {};
const capPos = CAP.position === 'bottom' ? 'bottom' : 'top';
const capH = Math.round(SHOT.height * (typeof CAP.height === 'number' ? CAP.height : 0.16));
const capLight = CAP.mask === 'light';
// Translating for a top band and clipping for a bottom one costs the page the
// same strip either way — only the side the band sits on differs.
const capShift = capPos === 'top' ? capH : 0;

// Sizes are vw so the composition holds whatever the safe area is set to —
// px values baked for one viewport width silently overflow a narrower frame.
const MASK = capLight ? 'rgba(255,255,255,.78)' : 'rgba(0,0,0,.66)';
const CAPTXT = capLight ? '#14141a' : '#fff';
const CAPSHADOW = capLight ? 'none' : '0 3px 20px rgba(0,0,0,.5)';
// Feather the edge facing the stage so the band reads as a scrim rather than a
// hard letterbox bar.
const MASK_DIR = capPos === 'top' ? '180deg' : '0deg';
// Padding, not a transform. A transformed body becomes the containing block for
// its position:fixed descendants, and a spotlight tour puts its mask there — so
// the offset lands twice, once in the measured rect and once in the mask, and the
// highlight sits a band's height below its target. Padding shifts layout without
// touching how fixed elements resolve, so measurement and mask still agree.
const OVERLAY_CSS = `${capShift ? `body{padding-top:${capShift}px!important;box-sizing:border-box}` : ''}
#rcap{position:fixed;${capPos}:0;left:0;right:0;height:${capH}px;box-sizing:border-box;padding:0 5.6vw;display:flex;align-items:center;justify-content:center;text-align:center;z-index:99500;background:linear-gradient(${MASK_DIR},${MASK} 0%,${MASK} 84%,transparent 100%);pointer-events:none}
#rcap h2{color:${CAPTXT};font:850 7.4vw/1.12 system-ui,sans-serif;letter-spacing:-.01em;opacity:0;transform:translateY(12px);transition:opacity .35s,transform .35s;text-shadow:${CAPSHADOW};margin:0}
#rcap.show h2{opacity:1;transform:none}#rcap h2 b{color:${capLight ? '#b45309' : '#fbbf24'}}#rcap h2 .p{color:${capLight ? '#6d28d9' : '#c4b5fd'}}
#rend{position:fixed;inset:0;z-index:99700;background:radial-gradient(120% 120% at 50% 30%,#2b2350,#0b0b10 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3.3vw;opacity:0;transition:opacity .5s;pointer-events:none;font-family:system-ui,sans-serif}
#rend.show{opacity:1}#rend .lg{width:17.8vw;height:17.8vw;border-radius:4.8vw;background:linear-gradient(135deg,#a78bfa,#7c3aed);display:grid;place-items:center;font-size:8.9vw;color:#fff}
#rend h1{color:#fff;font-size:9.3vw;font-weight:850;margin:0}#rend .tag{color:#c4b5fd;font-size:4.3vw;font-weight:700}
#rend .cmd{margin-top:1.5vw;background:#0f0f14;border:1px solid #2a2a33;color:#c4b5fd;font-family:ui-monospace,Menlo,monospace;font-size:3.5vw;font-weight:700;padding:2.6vw 3.7vw;border-radius:2.6vw}`;

async function record(v) {
  const browser = await launch();
  const { server, port } = await serve(here);
  const url = A.demoUrl || `http://localhost:${port}/templates/showcase.html`;
  const raw = path.join(out, '_reel_raw_' + v.id);
  fs.rmSync(raw, { recursive: true, force: true });
  const ctx = await browser.newContext({ viewport: SHOT, deviceScaleFactor: 2, recordVideo: { dir: raw, size: SHOT } });
  const page = await ctx.newPage();
  await page.goto(url); await page.waitForTimeout(600);
  await page.addStyleTag({ content: OVERLAY_CSS });
  await page.evaluate(({ caps, endTag, name, install }) => {
    // Mounted on <html>, not <body>: the body carries the translate that frees up
    // the caption band, and an overlay inside it would be shifted along with the
    // page it is supposed to sit clear of.
    const cap = document.createElement('div'); cap.id = 'rcap'; cap.innerHTML = '<h2 id="rcapT"></h2>'; document.documentElement.appendChild(cap);
    const end = document.createElement('div'); end.id = 'rend';
    end.innerHTML = `<div class="lg">✦</div><h1>${name}</h1><div class="tag">${endTag || ''}</div>${install ? `<div class="cmd">${install}</div>` : ''}`;
    document.documentElement.appendChild(end);
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
  if (ff && webm) { webmToMp4(ff, webm, path.join(out, `reel-${v.id}-9x16.mp4`), { ...OUT, frame: FRAME }); fs.rmSync(raw, { recursive: true, force: true }); console.log(`✓ dist/assets/reel-${v.id}-9x16.mp4`); }
  else console.log(`! recorded ${v.id} but no ffmpeg — raw webm kept at ${raw}`);
}

for (const v of variants) await record(v);
