#!/usr/bin/env node
// pack-and-ship — validate a skill for marketplace readiness.
// Usage: node scripts/lint.mjs [targetDir=.]
import fs from 'node:fs';
import path from 'node:path';
import { readText } from './text.mjs';

const dir = path.resolve(process.argv[2] || '.');
const has = p => fs.existsSync(path.join(dir, p));
// readText, not readFileSync: a Windows clone (core.autocrlf=true) has CRLF, and
// the frontmatter checks below are all anchored on \n.
const read = p => readText(path.join(dir, p));

let fails = 0, warns = 0;
const ok = (name, cond, detail = '') => {
  console.log((cond ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗\x1b[0m ') + name + (cond || !detail ? '' : ` — ${detail}`));
  if (!cond) fails++;
};
const warn = (name, cond, detail = '') => {
  if (!cond) { console.log('  \x1b[33m!\x1b[0m ' + name + (detail ? ` — ${detail}` : '')); warns++; }
};

// SKILL.md location — root preferred, one folder deep tolerated
const rootSkill = has('SKILL.md');
let skillPath = rootSkill ? 'SKILL.md' : null;
if (!skillPath) {
  const nested = fs.readdirSync(dir).find(d => { try { return fs.statSync(path.join(dir, d)).isDirectory() && has(path.join(d, 'SKILL.md')); } catch { return false; } });
  if (nested) skillPath = path.join(nested, 'SKILL.md');
}
ok('SKILL.md found', !!skillPath, 'none at root or one folder deep');
warn('SKILL.md is at repo ROOT (portable default)', rootSkill, skillPath ? `found at ${skillPath}` : '');
if (!skillPath) { done(); }

const skill = read(skillPath);
const fm = skill.match(/^---\n([\s\S]*?)\n---/);
ok('has YAML frontmatter', !!fm);
const name = fm && (fm[1].match(/^name:\s*(.+)$/m) || [])[1];
const desc = fm && (fm[1].match(/^description:\s*(.+)$/m) || [])[1];
ok('frontmatter name is a lowercase slug', !!name && /^[a-z][a-z0-9-]*$/.test(name.trim()), String(name));
ok('description 100–1024 chars', !!desc && desc.length >= 100 && desc.length <= 1024, `len=${desc ? desc.length : 0}`);
ok('description says WHEN to trigger', !!desc && /use when|use this when/i.test(desc));

// security self-scan (marketplaces reject these)
const risky = skill.match(/curl[^`\n]*\|\s*(ba)?sh|wget[^`\n]*\|\s*(ba)?sh|chmod\s+\+x|\bssh\b.*-i|api[_-]?key\s*=\s*['"][^'"]|password\s*=\s*['"][^'"]|secret\s*=\s*['"][^'"]/i);
ok('no risky imperative patterns (fetch-and-run / secrets)', !risky, risky && risky[0]);

// INPUT_GUARD heads-up (explainx-style uploaders)
const htmlTokens = (skill.match(/<[a-zA-Z/][^>\n]*>|[a-z-]+="[^"]*"/g) || []).length;
warn(`no html/attribute tokens (explainx INPUT_GUARD) — ${htmlTokens} found; pack.mjs makes a plain-text copy`, htmlTokens === 0);

// license
const licFile = ['LICENSE', 'LICENSE.md', 'LICENSE-COMMERCIAL.md'].find(has);
ok('license file present', !!licFile, 'add LICENSE (MIT for free, commercial for paid)');

// README
warn('README present', has('README.md'));

function done() {
  console.log(fails ? `\n\x1b[31m${fails} check(s) FAILED\x1b[0m${warns ? `, ${warns} warning(s)` : ''}`
    : `\n\x1b[32mAll checks passed\x1b[0m${warns ? `, ${warns} warning(s)` : ''}`);
  process.exit(fails ? 1 : 0);
}
done();
