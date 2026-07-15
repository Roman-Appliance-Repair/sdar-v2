#!/usr/bin/env node
/**
 * sweep-root-dedup.mjs — UI Phase 2, STEP 4
 *
 * Removes page-local `:root { ... }` blocks that only re-declare tokens already
 * defined, with identical values, in global.css. Every page carrying one imports
 * Layout.astro, which imports global.css — verified for all 833 — so the tokens
 * still resolve after removal and rendering is unchanged.
 *
 * SAFETY MODEL — a block is removed only if ALL hold:
 *   1. selector is exactly `:root` (no `:root.x`, no selector list)
 *   2. every declared token exists in the canonical global.css :root
 *   3. every declared value is identical (case-insensitive) to the canonical one
 *   4. the block sits inside a <style> element
 * Anything else is SKIPPED and reported — it may carry an intentional override.
 * Note the page-local blocks are a SUBSET of global.css (6 of 20 tokens), not a
 * byte-identical copy of it; equivalence is checked per declaration, not by
 * comparing the block text to global.css.
 *
 * Wave 35 incident rule: NO whitespace normalization, NO reindentation. Only the
 * matched block span is cut, plus lines the cut leaves blank.
 *
 * Usage: node scripts/sweep-root-dedup.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DRY = process.argv.includes('--dry');
const GLOBAL = 'src/styles/global.css';

function matchBrace(src, open) {
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}') { d--; if (d === 0) return i + 1; }
  }
  throw new Error('unbalanced braces');
}

function parseDecls(body) {
  const out = new Map();
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)) out.set(m[1], m[2].trim());
  return out;
}

function cutSpan(src, start, end) {
  const lineStart = src.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = src.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = src.length;
  const before = src.slice(lineStart, start);
  const after = src.slice(end, lineEnd);
  if (before.trim() === '' && after.trim() === '') {
    return src.slice(0, lineStart) + src.slice(Math.min(lineEnd + 1, src.length));
  }
  return src.slice(0, start) + src.slice(end);
}

/** Ranges of every <style>…</style> in the file. */
function styleRanges(src) {
  const r = [];
  const re = /<style[^>]*>/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    const close = src.indexOf('</style>', m.index);
    if (close === -1) continue;
    r.push([m.index + m[0].length, close]);
  }
  return r;
}

// ---- canonical tokens (first :root in global.css) ----
const g = readFileSync(GLOBAL, 'utf8');
const gOpen = g.indexOf('{', g.indexOf(':root'));
const CANON = parseDecls(g.slice(gOpen + 1, matchBrace(g, gOpen) - 1));

const files = execSync('git ls-files "src/pages/**/*.astro"', { encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => readFileSync(f, 'utf8').includes(':root'));

let touched = 0, removed = 0, bytes = 0;
const skipped = [];
const emptyStyle = [];

for (const file of files) {
  const orig = readFileSync(file, 'utf8');
  let src = orig;
  let fileTouched = false;

  for (;;) {
    const ranges = styleRanges(src);
    let cut = false;
    let searchFrom = 0;

    for (;;) {
      const s = src.indexOf(':root', searchFrom);
      if (s === -1) break;
      searchFrom = s + 5;

      if (!ranges.some(([a, b]) => s >= a && s < b)) continue; // not inside <style>

      const open = src.indexOf('{', s);
      if (open === -1) break;
      const sel = src.slice(s, open).trim();
      const end = matchBrace(src, open);
      const decls = parseDecls(src.slice(open + 1, end - 1));

      const reasons = [];
      if (sel !== ':root') reasons.push(`selector "${sel}"`);
      if (decls.size === 0) reasons.push('empty block');
      for (const [k, v] of decls) {
        if (!CANON.has(k)) reasons.push(`${k} not in global.css`);
        else if (CANON.get(k).toLowerCase() !== v.toLowerCase()) {
          reasons.push(`${k}: ${v} != global ${CANON.get(k)}`);
        }
      }
      if (reasons.length) {
        skipped.push({ file, reasons: [...new Set(reasons)] });
        continue;
      }
      src = cutSpan(src, s, end);
      removed++; cut = true; fileTouched = true;
      break; // offsets shifted — recompute
    }
    if (!cut) break;
  }

  if (!fileTouched) continue;
  // Guard: brace balance inside every <style> must survive.
  for (const [a, b] of styleRanges(src)) {
    const t = src.slice(a, b);
    if ((t.match(/{/g) || []).length !== (t.match(/}/g) || []).length) {
      throw new Error(`brace imbalance introduced in ${file}`);
    }
    if (t.trim() === '') emptyStyle.push(file);
  }
  bytes += Buffer.byteLength(orig) - Buffer.byteLength(src);
  touched++;
  if (!DRY) writeFileSync(file, src);
}

console.log(`${DRY ? '[DRY] ' : ''}files with :root  : ${files.length}`);
console.log(`files touched     : ${touched}`);
console.log(`:root blocks removed : ${removed}`);
console.log(`bytes saved       : ${bytes} (${(bytes / 1024).toFixed(1)} KB)`);
console.log(`\nSKIPPED (kept — possible intentional override): ${skipped.length}`);
for (const s of skipped) console.log(`  ${s.file}\n      ${s.reasons.join('; ')}`);
if (emptyStyle.length) console.log(`\n<style> left empty in ${emptyStyle.length} file(s): ${emptyStyle.join(', ')}`);
