#!/usr/bin/env node
// Contrast and theme-responsiveness audit. Renders a page in every theme and
// measures the contrast of each piece of visible text against what is actually
// behind it. → non-zero exit on failures.
// Usage: node assets/check-contrast.mjs [targetDir=. | url] [--themes light,dark]
//
// The bug this exists for: a rule that sets `background` but not `color` on a
// form control. Buttons, inputs and selects do NOT inherit colour from their
// parent — the browser gives them their own default — so the control looks fine
// in the theme that default happens to suit and turns invisible in the other.
// It survives review because nobody reads a stylesheet looking for an absence.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const positional = [];
let themes = ['light', 'dark'];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--themes') { themes = argv[++i].split(','); continue; }
  positional.push(argv[i]);
}
const target = positional[0] || '.';

const AA_NORMAL = 4.5, AA_LARGE = 3;

const IN_PAGE = () => {
  const lum = ([r, g, b]) => {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = s => {
    const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\)/.exec(s || '');
    return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
  };
  const over = (fg, bg) => fg.slice(0, 3).map((c, i) => c * fg[3] + bg[i] * (1 - fg[3]));

  // What is actually behind this element: walk up until something opaque enough
  // to matter. A background image or gradient is not something we can reason
  // about numerically, so say so rather than guess.
  const backdrop = el => {
    let n = el, acc = null;
    while (n && n !== document.documentElement.parentNode) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { unknown: true };
      const bg = parse(cs.backgroundColor);
      if (bg && bg[3] > 0) {
        acc = acc ? over(acc.concat(1), bg) : bg.slice(0, 3).map((c, i) => c * bg[3] + 255 * (1 - bg[3]));
        if (bg[3] >= 0.999) return { rgb: acc };
      }
      n = n.parentElement;
    }
    return { rgb: acc || [255, 255, 255] };
  };

  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const text = Array.from(el.childNodes)
      .filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;

    const fg = parse(cs.color);
    if (!fg || fg[3] === 0) continue;
    const bd = backdrop(el);
    if (bd.unknown) continue;
    const fgOn = over(fg, bd.rgb);
    const L1 = lum(fgOn), L2 = lum(bd.rgb);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);

    const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;

    // A form control with no author colour is the specific failure worth naming:
    // it is not a slightly-off palette choice, it is a rule that forgot a line.
    const formish = /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\s+/).join('.') : '',
      id: el.id ? '#' + el.id : '',
      text: text.slice(0, 32), ratio: +ratio.toFixed(2), need, fontPx: px, formish,
      color: cs.color, bg: `rgb(${bd.rgb.map(Math.round).join(',')})`,
    });
  }
  return out;
};

const url0 = /^https?:\/\//.test(target) ? target : null;
const dir = url0 ? null : path.resolve(target);
const cfg = dir && fs.existsSync(path.join(dir, 'ship.config.json'))
  ? JSON.parse(fs.readFileSync(path.join(dir, 'ship.config.json'), 'utf8')) : {};

const browser = await launch();
const { server, port } = await serve(here);
const url = url0 || cfg.assets?.demoUrl || `http://localhost:${port}/templates/showcase.html`;

let failed = 0, checked = 0;
for (const theme of themes) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
  const page = await ctx.newPage();
  await page.goto(url);
  // Cover both conventions: an explicit data-theme attribute and the media query.
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  await page.waitForTimeout(350);
  const rows = await page.evaluate(IN_PAGE);
  await ctx.close();

  const bad = rows.filter(r => r.ratio < r.need);
  checked += rows.length;
  failed += bad.length;
  console.log(`\n${theme}: ${rows.length} text elements, ${bad.length} below AA`);
  for (const b of bad.sort((x, y) => x.ratio - y.ratio)) {
    console.log(`  ✗ ${b.ratio}:1 (needs ${b.need}) ${b.tag}${b.id}${b.cls}  "${b.text}"`);
    console.log(`      ${b.color} on ${b.bg}${b.formish ? '  ← form control: does it set its own color?' : ''}`);
  }
}

server.close(); await browser.close();
console.log(`\n${checked} checked across ${themes.length} theme(s), ${failed} failure(s)`);
if (failed) process.exit(1);
