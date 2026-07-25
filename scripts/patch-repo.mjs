#!/usr/bin/env node
// Wire the "get it / sponsor" links into the repo from ship.config.json:
//   • .github/FUNDING.yml   — sponsor/checkout buttons
//   • README.md             — an idempotent badge + call-to-action block
// Usage: node scripts/patch-repo.mjs [targetDir=.] [--check]
// --check reports what it would change and exits non-zero if anything is stale
// (drift guard for CI); without it, files are written in place.
import fs from 'node:fs';
import path from 'node:path';
import { readText, detectEol } from './text.mjs';

const dir = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const check = process.argv.includes('--check');
const P = p => path.join(dir, p);
const cfg = fs.existsSync(P('ship.config.json')) ? JSON.parse(readText(P('ship.config.json'))) : {};

const owner = cfg.owner || '';
const repo = cfg.repo || '';
const install = cfg.install || (owner && repo ? `npx skills add ${owner}/${repo}` : '');
const homepage = cfg.homepage || (owner && repo ? `https://github.com/${owner}/${repo}` : '');
const price = cfg.price || {};
const isPaid = Number(price.amount) > 0;
const fund = cfg.funding || {};
// checkout URL: explicit funding.custom / funding.polar, else the paid checkout link
const checkout = fund.polar || price.checkoutUrl || '';
const customUrls = [...(fund.custom || []), ...(checkout ? [checkout] : [])].filter((v, i, a) => v && a.indexOf(v) === i);

let changed = 0;
const note = (what) => { console.log((check ? '• stale: ' : '✓ ') + what); changed++; };

// ── .github/FUNDING.yml ──
const fLines = [];
if (fund.github) fLines.push(`github: [${(Array.isArray(fund.github) ? fund.github : [fund.github]).join(', ')}]`);
if (fund.kofi) fLines.push(`ko_fi: ${fund.kofi}`);
if (fund.openCollective) fLines.push(`open_collective: ${fund.openCollective}`);
if (customUrls.length) fLines.push(`custom: [${customUrls.map(u => `"${u}"`).join(', ')}]`);
if (fLines.length) {
  const fPath = P('.github/FUNDING.yml');
  const prev = fs.existsSync(fPath) ? fs.readFileSync(fPath, 'utf8') : '';
  // match the file's own line ending, or --check calls a CRLF checkout stale forever
  const eol = detectEol(prev);
  const next = fLines.join(eol) + eol;
  if (prev !== next) {
    note('.github/FUNDING.yml');
    if (!check) { fs.mkdirSync(P('.github'), { recursive: true }); fs.writeFileSync(fPath, next); }
  }
}

// ── README badge + CTA block (idempotent between markers) ──
const START = '<!-- pack-and-ship:badges -->';
const END = '<!-- /pack-and-ship:badges -->';
const enc = s => encodeURIComponent(s).replace(/-/g, '--').replace(/_/g, '__');
const badges = [];
if (install) badges.push(`![install](https://img.shields.io/badge/install-${enc(install.replace(/^npx\s+/, ''))}-7c3aed?style=flat-square&logo=npm)`);
badges.push(`![license](https://img.shields.io/badge/license-${isPaid ? 'Commercial' : 'MIT'}-a78bfa?style=flat-square)`);
if (isPaid && checkout) badges.push(`[![get it](https://img.shields.io/badge/get%20it-${enc(price.currency || 'USD')}%20${price.amount}-fbbf24?style=flat-square)](${checkout})`);
else if (checkout) badges.push(`[![sponsor](https://img.shields.io/badge/sponsor-%E2%99%A5-fbbf24?style=flat-square)](${checkout})`);

const cta = [];
cta.push(START);
cta.push('');
cta.push(badges.join(' '));
if (install) cta.push('', '```bash', install, '```');
if (isPaid && checkout) cta.push('', `**[Get ${cfg.repo || 'it'} → ${price.currency || 'USD'} ${price.amount}](${checkout})**`);
else if (checkout) cta.push('', `**[♥ Sponsor this project](${checkout})**`);
cta.push('');
cta.push(END);

const rPath = P('README.md');
if (fs.existsSync(rPath)) {
  let readme = fs.readFileSync(rPath, 'utf8');
  // build the block in the README's own line ending so a CRLF checkout isn't
  // rewritten wholesale (and doesn't read as permanently stale under --check)
  const eol = detectEol(readme);
  const block = cta.join(eol);
  let next;
  if (readme.includes(START) && readme.includes(END)) {
    next = readme.replace(new RegExp(START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), () => block);
  } else {
    // insert right after the first H1 (or at top if none)
    const m = readme.match(/^#\s.*$/m);
    if (m) { const i = readme.indexOf(m[0]) + m[0].length; next = readme.slice(0, i) + eol + eol + block + eol + readme.slice(i); }
    else next = block + eol + eol + readme;
  }
  if (next !== readme) {
    note('README.md badge/CTA block');
    if (!check) fs.writeFileSync(rPath, next);
  }
} else if (badges.length) {
  console.log('! no README.md — skipping badge block');
}

if (!changed) console.log('✓ repo already up to date');
else if (check) { console.error(`\n${changed} file(s) out of date — run: node scripts/patch-repo.mjs ${path.relative(process.cwd(), dir) || '.'}`); process.exit(1); }
