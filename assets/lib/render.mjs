// Shared rendering helpers for the asset generators. Playwright + a tiny static
// server. ffmpeg (for video/reel) is located via $FFMPEG or `ffmpeg` on PATH.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export async function launch() {
  const { chromium } = await import('playwright');
  const exe = process.env.TOUTOUR_CHROMIUM || process.env.PW_CHROMIUM;
  return chromium.launch(exe ? { executablePath: exe } : {});
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
export function serve(dir, port = 0) {
  const server = http.createServer((req, res) => {
    const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]) === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    try { res.setHeader('Content-Type', MIME[path.extname(f)] || 'text/plain'); res.end(fs.readFileSync(f)); }
    catch { res.statusCode = 404; res.end('404'); }
  });
  return new Promise(r => server.listen(port, () => r({ server, port: server.address().port })));
}

// inject a config object the templates read as window.__CFG
export async function pageWithCfg(ctx, url, cfg) {
  const page = await ctx.newPage();
  await page.addInitScript(c => { window.__CFG = c; }, cfg);
  await page.goto(url);
  return page;
}

export function findFfmpeg() {
  if (process.env.FFMPEG && fs.existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg'; } catch {}
  // imageio-ffmpeg bundles a full static build if installed (pip install imageio-ffmpeg)
  try {
    const p = execFileSync('python3', ['-c', 'import imageio_ffmpeg,sys;sys.stdout.write(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
    if (p && fs.existsSync(p)) return p;
  } catch {}
  return null;
}

// Vertical feeds draw their own chrome over your video: a header up top, the
// caption/audio strip along the bottom, an action rail down the right side, and
// on Instagram a profile avatar that juts into the lower right. Anything you put
// there is covered. These fractions are the inset; what is left is 90% × 80% of
// the frame, weighted towards the bottom where the overlays are worst.
//
// This is a deliberate trade: 13% at the bottom is thinner than Instagram's
// caption strip on some devices, so the lowest band of content can still be
// grazed. Raise `bottom` for a reel whose bottom edge carries anything critical.
export const VERTICAL_SAFE_AREA = { top: 0.07, right: 0.05, bottom: 0.13, left: 0.05 };

const even = n => Math.max(2, Math.round(n / 2) * 2);

// ffmpeg takes 0xRRGGBB or a colour name, not the #RRGGBB every config file and
// brand palette is written in. Expands #abc too.
const ffColor = c => {
  const s = String(c ?? '').trim();
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (!m) return s || 'black';
  const hex = m[1].length === 3 ? m[1].replace(/./g, d => d + d) : m[1];
  return '0x' + hex.toLowerCase();
};

// Resolve safe-area fractions into a concrete inset box for a w×h output.
// Record at `innerW`×`innerH` (or that aspect) so the content is composed for
// the visible box rather than scaled into it after the fact.
export function safeFrame(w, h, safeArea = VERTICAL_SAFE_AREA, opts = {}) {
  const frac = k => (typeof safeArea?.[k] === 'number' ? safeArea[k] : 0);
  const left = even(w * frac('left'));
  const top = even(h * frac('top'));
  const innerW = even(w - left - even(w * frac('right')));
  const innerH = even(h - top - even(h * frac('bottom')));
  return { left, top, innerW, innerH, ...opts };
}

// `trimStart` (seconds) drops dead air from the head. Video recording begins when
// the browser context does, but the timeline cannot start until the page has
// loaded and the overlays are injected — a second or more of a still frame, right
// where a feed decides whether to keep watching.
export function webmToMp4(ffmpeg, webm, mp4, { w, h, frame, trimStart = 0 }) {
  let vf = `scale=${w}:${h}`;
  if (frame) {
    const { left, top, innerW, innerH, background = 'black', border } = frame;
    vf = `scale=${innerW}:${innerH}:flags=lanczos,pad=${w}:${h}:${left}:${top}:${ffColor(background)}`;
    if (border && border.width > 0) {
      const bw = Math.max(1, Math.round(border.width));
      vf += `,drawbox=x=${left - bw}:y=${top - bw}:w=${innerW + bw * 2}:h=${innerH + bw * 2}`
          + `:color=${ffColor(border.color || 'white')}:t=${bw}`;
    }
  }
  const seek = trimStart > 0 ? ['-ss', String(trimStart)] : [];
  execFileSync(ffmpeg, ['-y', ...seek, '-i', webm, '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    '-vf', vf, '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', mp4], { stdio: 'ignore' });
}

export function webmToGif(ffmpeg, webm, gif, width = 760) {
  execFileSync(ffmpeg, ['-y', '-i', webm, '-vf',
    `fps=12,scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, gif], { stdio: 'ignore' });
}
