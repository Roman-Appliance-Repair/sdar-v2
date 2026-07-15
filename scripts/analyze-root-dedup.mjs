#!/usr/bin/env node
/**
 * analyze-root-dedup.mjs — STEP 4 recon (read-only).
 * Extracts every page-local :root block, parses its declarations, and compares
 * them against the canonical global.css :root. Classifies each into:
 *   SAFE   — every declaration is a value-identical subset of global.css
 *   DIFFER — declares a token global.css lacks, or with a different value
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const GLOBAL = 'src/styles/global.css';

function matchBrace(src, open) {
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}') { d--; if (d === 0) return i + 1; }
  }
  throw new Error('unbalanced');
}

/** Parse `--tok: value;` pairs out of a rule body. */
function parseDecls(body) {
  const out = new Map();
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) {
    out.set(m[1], m[2].trim());
  }
  return out;
}

/** Canonical tokens from the FIRST :root in global.css. */
const g = readFileSync(GLOBAL, 'utf8');
const gStart = g.indexOf(':root');
const gOpen = g.indexOf('{', gStart);
const canonical = parseDecls(g.slice(gOpen + 1, matchBrace(g, gOpen) - 1));
console.log('canonical global.css :root tokens:');
for (const [k, v] of canonical) console.log(`   ${k}: ${v}`);

const files = execSync('git ls-files "src/pages/**/*.astro"', { encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => readFileSync(f, 'utf8').includes(':root'));

const safe = [], differ = [], multi = [];
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const blocks = [];
  let idx = 0;
  for (;;) {
    const s = src.indexOf(':root', idx);
    if (s === -1) break;
    const open = src.indexOf('{', s);
    const end = matchBrace(src, open);
    // Selector must be exactly `:root` (no `:root.foo`, no `:root, x`)
    const selRaw = src.slice(s, open).trim();
    blocks.push({ s, end, selOk: selRaw === ':root', decls: parseDecls(src.slice(open + 1, end - 1)) });
    idx = end;
  }
  if (blocks.length > 1) multi.push(file);

  for (const b of blocks) {
    const reasons = [];
    if (!b.selOk) reasons.push('non-bare :root selector');
    for (const [k, v] of b.decls) {
      if (!canonical.has(k)) reasons.push(`${k} not in global`);
      else if (canonical.get(k).toLowerCase() !== v.toLowerCase()) {
        reasons.push(`${k}=${v} != global ${canonical.get(k)}`);
      }
    }
    if (b.decls.size === 0) reasons.push('empty block');
    if (reasons.length) differ.push({ file, reasons: [...new Set(reasons)] });
    else safe.push(file);
  }
}

console.log(`\nfiles with a :root  : ${files.length}`);
console.log(`SAFE blocks (pure value-identical subset of global) : ${safe.length}`);
console.log(`DIFFER blocks (must SKIP)                           : ${differ.length}`);
console.log(`files with >1 :root block                           : ${multi.length}`);

const byReason = new Map();
for (const d of differ) {
  for (const r of d.reasons) byReason.set(r, (byReason.get(r) || 0) + 1);
}
console.log('\nDIFFER reasons:');
for (const [r, n] of [...byReason].sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${r}`);
console.log('\nDIFFER sample files:');
differ.slice(0, 12).forEach((d) => console.log(`  ${d.file} :: ${d.reasons.join('; ')}`));
