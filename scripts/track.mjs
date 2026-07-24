#!/usr/bin/env node
// Create/refresh a launch progress tracker at the repo root (launch-tracker.md).
// Idempotent: keeps every row you've edited (status/date/link/notes) and only
// APPENDS platforms it doesn't already have — so re-running never wipes progress.
// Usage: node scripts/track.mjs [targetDir=.]
// Platforms come from ship.config.json `launch.platforms`, else a sensible default
// set (Polar included only for paid skills).
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || '.');
const P = p => path.join(dir, p);
const cfg = fs.existsSync(P('ship.config.json')) ? JSON.parse(fs.readFileSync(P('ship.config.json'), 'utf8')) : {};
const name = cfg.repo || 'skill';
const isPaid = Number(cfg.price?.amount) > 0;

const DEFAULT = ['GitHub', 'Agensi', 'explainx.ai', 'SkillRegistry',
  ...(isPaid ? ['Polar'] : []), 'awesome-list PR', 'Product Hunt', 'Show HN'];
const platforms = cfg.launch?.platforms || DEFAULT;

const HEAD = ['Platform', 'Status', 'Date', 'Link', 'Notes'];
const file = P('launch-tracker.md');

// parse existing rows (keyed by platform name, lowercased) so edits survive
const existing = new Map();
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\|(.+)\|\s*$/);
    if (!m) continue;
    const cells = m[1].split('|').map(c => c.trim());
    if (cells.length < 5) continue;
    const key = cells[0].toLowerCase();
    if (key === 'platform' || /^-+$/.test(cells[0].replace(/[:\s]/g, '') || '-')) continue;
    existing.set(key, cells.slice(0, 5));
  }
}

const rows = [];
let added = 0;
for (const p of platforms) {
  const key = p.toLowerCase();
  if (existing.has(key)) rows.push(existing.get(key));
  else { rows.push([p, '⬜ todo', '', '', '']); added++; }
}
// preserve any extra platforms the user added by hand that aren't in the config list
for (const [key, cells] of existing) {
  if (!platforms.some(p => p.toLowerCase() === key)) rows.push(cells);
}

const out = [];
out.push(`# ${name} — launch tracker`, '');
out.push('Status: ⬜ todo · 🟡 submitted / in review · ✅ live · ❌ rejected · ➖ n/a', '');
out.push('| ' + HEAD.join(' | ') + ' |');
out.push('| ' + HEAD.map(() => '---').join(' | ') + ' |');
for (const r of rows) out.push('| ' + r.join(' | ') + ' |');
out.push('');
fs.writeFileSync(file, out.join('\n'));
console.log(`✓ launch-tracker.md (${rows.length} platforms${added ? `, +${added} new` : ''})`);
