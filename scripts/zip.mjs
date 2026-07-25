#!/usr/bin/env node
// pack-and-ship — dependency-free ZIP writer (deflate, falling back to store).
// Replaces the `zip` CLI, which does not exist on Windows: the old code shelled
// out to it, printed a warning on failure, and carried on — producing a dist/
// whose listing.md pointed at a zip that was never written. node:zlib is
// everywhere, so build the archive ourselves and fail loudly if we can't.
//
// Module:  createZip({ cwd, outFile, exclude })  ->  { files, bytes }
// CLI:     node scripts/zip.mjs <srcDir> <out.zip> [exclude...]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

// ── CRC-32 (IEEE 802.3 polynomial, the one ZIP specifies) ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();
const crc32 = buf => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

// ── exclusion matching ──
// A bare name ("node_modules") excludes that entry anywhere in the tree — the
// same net effect as the old `-x node_modules -x node_modules/*` pair, and it
// also catches nested copies, which is what "exclude dev dirs" always meant.
// Anything containing a slash or wildcard is globbed against the full relative
// path, with `*` spanning separators as Info-ZIP's -x does, and a match on a
// directory takes its whole subtree.
const globToRe = g => {
  const body = g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^(?:${body})(?:/.*)?$`);
};

export function makeMatcher(patterns = []) {
  const names = new Set(), globs = [];
  for (const raw of patterns) {
    const p = String(raw).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
    if (!p) continue;
    if (/[*?/]/.test(p)) globs.push(globToRe(p));
    else names.add(p);
  }
  return rel => rel.split('/').some(s => names.has(s)) || globs.some(re => re.test(rel));
}

// ── walk ──
function walk(root, rel, matcher, out) {
  const entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (matcher(r)) continue;
    let isDir = e.isDirectory(), isFile = e.isFile();
    if (e.isSymbolicLink()) {
      let st;
      try { st = fs.statSync(path.join(root, r)); } catch { continue; }  // broken link
      if (st.isDirectory()) continue;                                    // cycle guard
      isDir = false; isFile = st.isFile();
    }
    if (isDir) walk(root, r, matcher, out);
    else if (isFile) out.push(r);
  }
  return out;
}

// ── DOS timestamp (ZIP's native clock: 2-second resolution, epoch 1980) ──
function dosStamp(d) {
  const y = d.getFullYear();
  if (y < 1980 || y > 2107) return { time: 0, date: (1 << 5) | 1 };  // 1980-01-01
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((y - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

const U16 = 0xffff, U32 = 0xffffffff;

/**
 * Build a ZIP of `cwd` at `outFile`, skipping anything `exclude` matches.
 * Throws on any failure — callers must not continue as though a zip exists.
 */
export function createZip({ cwd, outFile, exclude = [] }) {
  const root = path.resolve(cwd);
  const out = path.resolve(outFile);
  const matcher = makeMatcher(exclude);
  const selfRel = path.relative(root, out).replace(/\\/g, '/');
  const isSelf = selfRel && !selfRel.startsWith('../');

  const files = walk(root, '', matcher, []).filter(r => !(isSelf && r === selfRel));
  if (!files.length) throw new Error(`nothing to archive in ${root} (everything excluded?)`);
  if (files.length > U16) throw new Error(`${files.length} entries exceeds the ZIP limit (${U16}); add to zip.exclude`);

  const parts = [], central = [];
  let offset = 0;

  for (const rel of files) {
    const abs = path.join(root, rel);
    const st = fs.statSync(abs);
    if (st.size > U32) throw new Error(`${rel} is larger than 4 GB — beyond this writer (no zip64)`);
    const data = fs.readFileSync(abs);
    const name = Buffer.from(rel, 'utf8');

    // Deflate unless it makes the entry bigger (tiny/already-compressed files).
    let method = 8, body = zlib.deflateRawSync(data, { level: 9 });
    if (body.length >= data.length) { method = 0; body = data; }

    const crc = crc32(data);
    const { time, date } = dosStamp(st.mtime);
    const flags = 0x800;  // bit 11: the name is UTF-8

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);   // local file header signature
    local.writeUInt16LE(20, 4);           // version needed (2.0 — deflate)
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);           // no extra field
    parts.push(local, name, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);      // central directory header signature
    cd.writeUInt16LE(0x031e, 4);          // made by: UNIX, spec 3.0 (so mode below is read)
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(flags, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(time, 12);
    cd.writeUInt16LE(date, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt16LE(0, 30);              // extra len
    cd.writeUInt16LE(0, 32);              // comment len
    cd.writeUInt16LE(0, 34);              // disk number
    cd.writeUInt16LE(0, 36);              // internal attrs
    cd.writeUInt32LE(((st.mode & 0xffff) << 16) >>> 0, 38);  // unix mode, keeps the exec bit
    cd.writeUInt32LE(offset, 42);         // offset of the local header
    central.push(cd, name);

    offset += local.length + name.length + body.length;
    if (offset > U32) throw new Error('archive exceeds 4 GB — beyond this writer (no zip64)');
  }

  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);      // end of central directory signature
  eocd.writeUInt16LE(0, 4);               // this disk
  eocd.writeUInt16LE(0, 6);               // disk with the start of the CD
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);              // no archive comment

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = Buffer.concat([...parts, cdBuf, eocd]);
  fs.writeFileSync(out, buf);
  return { files, bytes: buf.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const [src, out, ...exclude] = process.argv.slice(2);
  if (!src || !out) { console.error('usage: zip.mjs <srcDir> <out.zip> [exclude...]'); process.exit(2); }
  try {
    const { files, bytes } = createZip({ cwd: src, outFile: out, exclude });
    console.log(`wrote ${out} — ${files.length} files, ${(bytes / 1024).toFixed(1)} KB`);
  } catch (e) { console.error('zip failed:', e.message); process.exit(1); }
}
