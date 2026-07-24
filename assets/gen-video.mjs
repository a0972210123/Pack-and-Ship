#!/usr/bin/env node
// Record a 16:9 demo video of the demo page (drives its tour), → mp4 + gif.
// Usage: node assets/gen-video.mjs [targetDir=.]
// Needs ffmpeg ($FFMPEG or on PATH, or `pip install imageio-ffmpeg`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, serve, findFfmpeg, webmToMp4, webmToGif } from './lib/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2] || '.');
const cfg = fs.existsSync(path.join(dir, 'ship.config.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'ship.config.json'), 'utf8')) : {};
const A = cfg.assets || {};
const out = path.join(dir, 'dist', 'assets');
fs.mkdirSync(out, { recursive: true });
const ff = findFfmpeg();

const browser = await launch();
const { server, port } = await serve(here);
const url = A.demoUrl || `http://localhost:${port}/templates/showcase.html`;
const raw = path.join(out, '_video_raw');
fs.rmSync(raw, { recursive: true, force: true });

const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2, recordVideo: { dir: raw, size: { width: 1280, height: 720 } } });
const page = await ctx.newPage();
await page.goto(url); await page.waitForTimeout(1200);
await page.evaluate(() => window.__startTour && window.__startTour());
await page.waitForTimeout(2000);
for (let i = 0; i < 3; i++) { await page.evaluate(() => document.getElementById('ttNext')?.click()); await page.waitForTimeout(1800); }
await page.evaluate(() => document.getElementById('themeBtn')?.click());  // show dark mode
await page.waitForTimeout(1500);
for (let i = 0; i < 2; i++) { await page.evaluate(() => document.getElementById('ttNext')?.click()); await page.waitForTimeout(1800); }
await page.evaluate(() => document.getElementById('ttNext')?.click());
await page.waitForTimeout(1200);
await ctx.close(); server.close(); await browser.close();

const webm = fs.readdirSync(raw).map(f => path.join(raw, f)).find(f => f.endsWith('.webm'));
if (ff && webm) {
  webmToMp4(ff, webm, path.join(out, 'demo-16x9.mp4'), { w: 1280, h: 720 });
  webmToGif(ff, webm, path.join(out, 'demo.gif'), 760);
  fs.rmSync(raw, { recursive: true, force: true });
  console.log('✓ dist/assets/demo-16x9.mp4 + demo.gif');
} else {
  console.log(`! recorded ${webm} but no ffmpeg — install ffmpeg (or imageio-ffmpeg) to get mp4/gif. Raw webm kept.`);
}
