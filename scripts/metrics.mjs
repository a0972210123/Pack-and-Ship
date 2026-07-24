#!/usr/bin/env node
// Append a dated results snapshot to results-tracker.md — a time series of how the launch
// is performing, so you accumulate proof over time. GitHub stars/forks are auto-filled when
// reachable; "Listings" (live/total) is derived from launch-tracker.md; fill or override the
// rest by hand or with --set. Re-running on the same day UPDATES that day's row (merging —
// your manual values survive) instead of duplicating it.
//
// Usage:
//   node scripts/metrics.mjs [targetDir=.]
//   node scripts/metrics.mjs [targetDir] --set "YT views=1200, Installs=40, Pro sales=1"
//   node scripts/metrics.mjs [targetDir] --date 2026-07-24   (override the snapshot date)
//
// Columns come from ship.config.json → metrics.columns (a sensible default otherwise).
// The --set flag (and the auto/derived values) are the same shape a future automated
// reporting agent would feed in: { column: value }.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const dir = path.resolve(argv.find(a => !a.startsWith('--')) || '.');
const P = p => path.join(dir, p);
const cfg = fs.existsSync(P('ship.config.json')) ? JSON.parse(fs.readFileSync(P('ship.config.json'), 'utf8')) : {};
const owner = cfg.owner, repo = cfg.repo;
const isPaid = Number(cfg.price?.amount) > 0 || !!cfg.price?.checkoutUrl || !!cfg.funding?.polar;

// --set "col=val, col2=val2"  → overrides for today's row
function flagVal(name) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; }
const overrides = {};
const setStr = flagVal('--set');
if (setStr) for (const pair of setStr.split(',')) { const i = pair.indexOf('='); if (i > 0) overrides[pair.slice(0, i).trim()] = pair.slice(i + 1).trim(); }

const DEFAULT_COLS = ['⭐ Stars', 'Forks', 'YT views', 'Installs', 'Listings', ...(isPaid ? ['Pro sales'] : []), 'Notes'];
const cols = cfg.metrics?.columns || DEFAULT_COLS;
const HEAD = ['Date', ...cols];

// derive "live/total" from launch-tracker.md
function listings() {
  const f = P('launch-tracker.md');
  if (!fs.existsSync(f)) return '';
  let live = 0, total = 0;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(/^\|(.+)\|\s*$/); if (!m) continue;
    const cells = m[1].split('|').map(c => c.trim());
    if (cells.length < 5) continue;
    const p = cells[0].toLowerCase();
    if (p === 'platform' || /^-+$/.test((cells[0] || '-').replace(/[:\s]/g, '') || '-')) continue;
    total++; if (cells[1].includes('✅')) live++;
  }
  return total ? `${live}/${total}` : '';
}

// best-effort GitHub stars/forks (public repo, no auth). Never throws.
async function github() {
  if (!owner || !repo) return {};
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: { 'User-Agent': 'pack-and-ship', Accept: 'application/vnd.github+json' } });
    if (!r.ok) return {};
    const j = await r.json();
    return { '⭐ Stars': String(j.stargazers_count ?? ''), 'Forks': String(j.forks_count ?? '') };
  } catch { return {}; }
}

const today = flagVal('--date') || new Date().toISOString().slice(0, 10);
const gh = await github();
const auto = { ...gh, 'Listings': listings() };          // auto/derived (refreshed each run)
const fresh = { ...auto, ...overrides };                 // --set wins over auto

// ── read existing rows (append-only time series, keyed by date) ──
const file = P('results-tracker.md');
const rows = new Map();  // date -> { col: val }
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\|(.+)\|\s*$/); if (!m) continue;
    const cells = m[1].split('|').map(c => c.trim());
    if (cells[0] === 'Date' || /^-+$/.test((cells[0] || '-').replace(/[:\s]/g, '') || '-')) continue;
    const rec = {}; HEAD.slice(1).forEach((c, i) => rec[c] = cells[i + 1] ?? '');
    rows.set(cells[0], rec);
  }
}

// merge into today's row: refresh auto + apply overrides, KEEP existing manual values
const prev = rows.get(today) || {};
const merged = {};
for (const c of cols) {
  if (c in fresh && fresh[c] !== '' && fresh[c] != null) merged[c] = fresh[c];  // new value wins
  else merged[c] = prev[c] || '';                                               // else keep prior
}
rows.set(today, merged);

const sorted = [...rows.keys()].sort();
const out = [];
out.push(`# ${repo || 'skill'} — results tracker`, '');
out.push('Dated snapshots of launch performance. `node scripts/metrics.mjs <dir>` appends/refreshes', 'today\'s row (stars/forks auto, Listings from launch-tracker.md); fill the rest by hand or --set.', '');
out.push('| ' + HEAD.join(' | ') + ' |');
out.push('| ' + HEAD.map(() => '---').join(' | ') + ' |');
for (const d of sorted) out.push('| ' + [d, ...cols.map(c => rows.get(d)[c] || '')].join(' | ') + ' |');
out.push('');
fs.writeFileSync(file, out.join('\n'));

const gotGh = '⭐ Stars' in gh;
console.log(`✓ results-tracker.md — ${today} row ${prev && Object.keys(prev).length ? 'updated' : 'added'} (${sorted.length} snapshot${sorted.length > 1 ? 's' : ''})`);
console.log(`  GitHub: ${gotGh ? `⭐${gh['⭐ Stars']} · ${gh['Forks']} forks` : 'not reachable — fill Stars/Forks by hand'} · Listings: ${auto.Listings || 'n/a'}`);
if (Object.keys(overrides).length) console.log(`  set: ${Object.entries(overrides).map(([k, v]) => `${k}=${v}`).join(', ')}`);
