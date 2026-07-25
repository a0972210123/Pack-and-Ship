// pack-and-ship — one place for the "read a text file portably" rule.
// Windows clones (core.autocrlf=true) hand these scripts CRLF, and some editors
// prepend a UTF-8 BOM. Every frontmatter/line regex here is written against \n
// with nothing before the first `---`, so normalize once at the edge rather than
// hardening each pattern. Read raw bytes elsewhere (the zip stores files as-is).
import fs from 'node:fs';

const BOM = 0xfeff;
export const normalizeText = s =>
  (s.charCodeAt(0) === BOM ? s.slice(1) : s).replace(/\r\n?/g, '\n');
export const readText = f => normalizeText(fs.readFileSync(f, 'utf8'));

// The line ending a file already uses — so rewriting one block of a CRLF file
// doesn't churn every other line into the diff.
export const detectEol = s => (/\r\n/.test(s) ? '\r\n' : '\n');
