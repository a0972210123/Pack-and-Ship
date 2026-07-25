#!/usr/bin/env node
// pack-and-ship — produce a plain-text-safe copy of a SKILL.md for uploaders
// that reject "html/script-like input" (e.g. explainx.ai INPUT_GUARD).
// Strips frontmatter and neutralizes angle-bracket tags + attribute="value".
// Usage: node scripts/sanitize.mjs <file.md> [outFile]
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { normalizeText, readText } from './text.mjs';

export function sanitize(md) {
  // CRLF in, LF out — uploaders want clean text, and the strips below assume \n
  let s = normalizeText(md);
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

// pathToFileURL, not `file://${argv[1]}`: on Windows argv[1] is D:\path\to\x.mjs
// while import.meta.url is file:///D:/path/to/x.mjs, so the naive compare never
// matched and running this file directly silently did nothing.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const inFile = process.argv[2];
  if (!inFile) { console.error('usage: sanitize.mjs <file.md> [outFile]'); process.exit(2); }
  const out = process.argv[3] || inFile.replace(/\.md$/, '') + '-plaintext.md';
  fs.writeFileSync(out, sanitize(readText(inFile)));
  console.log('wrote', out);
}
