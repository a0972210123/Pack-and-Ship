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

export function webmToMp4(ffmpeg, webm, mp4, { w, h }) {
  execFileSync(ffmpeg, ['-y', '-i', webm, '-movflags', '+faststart', '-pix_fmt', 'yuv420p',
    '-vf', `scale=${w}:${h}`, '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', mp4], { stdio: 'ignore' });
}

export function webmToGif(ffmpeg, webm, gif, width = 760) {
  execFileSync(ffmpeg, ['-y', '-i', webm, '-vf',
    `fps=12,scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, gif], { stdio: 'ignore' });
}
