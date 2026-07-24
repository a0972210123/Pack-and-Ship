#!/usr/bin/env node
// pack-and-ship — produce a plain-text-safe copy of a SKILL.md for uploaders
// that reject "html/script-like input" (e.g. explainx.ai INPUT_GUARD).
// Strips frontmatter and neutralizes angle-bracket tags + attribute="value".
// Usage: node scripts/sanitize.mjs <file.md> [outFile]
import fs from 'node:fs';

export function sanitize(md) {
  let s = md;
  // drop YAML frontmatter (the platform has separate name/description fields)
  if (s.startsWith('---')) { const parts = s.split('---'); if (parts.length >= 3) s = parts.slice(2).join('---').replace(/^\n+/, ''); }
  // attribute="value"  ->  attribute=value   (kills the quote+equals pattern)
  s = s.replace(/([a-zA-Z-]+)="([^"]*)"/g, '$1=$2');
  // <tag> or <thing>  ->  thing   (kills angle brackets, keeps inner text)
  s = s.replace(/<([a-zA-Z][^>\n]*)>/g, '$1');
  // bare-input phrasings read oddly after stripping — tidy the common one
  s = s.replace(/\ba bare input\b/g, 'a bare input element');
  return s;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inFile = process.argv[2];
  if (!inFile) { console.error('usage: sanitize.mjs <file.md> [outFile]'); process.exit(2); }
  const out = process.argv[3] || inFile.replace(/\.md$/, '') + '-plaintext.md';
  fs.writeFileSync(out, sanitize(fs.readFileSync(inFile, 'utf8')));
  console.log('wrote', out);
}
