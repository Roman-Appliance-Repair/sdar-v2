#!/usr/bin/env node
/**
 * sweep-float-call.mjs — UI Phase 2, STEP 2
 *
 * Physically removes the legacy per-page `.float-call` pill, superseded by
 * StickyCallBar in Layout.astro (and already display:none'd since Phase 1).
 *
 * Removes exactly two things per page, byte-precisely:
 *   (a) the <a ... class="float-call" ...>...</a> element
 *   (b) every `.float-call { ... }` CSS rule in the page-local <style>
 *       (both the standalone rule and the @media override)
 *
 * Wave 35 incident rule: NO whitespace normalization, NO reindentation.
 * Only the matched spans are cut. A line is dropped only when the cut leaves
 * it whitespace-only (i.e. the element/rule was the sole thing on it), which
 * restores the file to what it would have looked like had the pill never been
 * added. Every other byte is preserved verbatim.
 *
 * Usage: node scripts/sweep-float-call.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DRY = process.argv.includes('--dry');

/** Cut [start,end) from src; if the line it lived on is now blank, drop the line. */
function cutSpan(src, start, end) {
  let lineStart = src.lastIndexOf('\n', start - 1) + 1;
  let lineEnd = src.indexOf('\n', end);
  if (lineEnd === -1) lineEnd = src.length;

  const before = src.slice(lineStart, start);
  const after = src.slice(end, lineEnd);

  // Sole occupant of its line(s) -> remove the line entirely (incl. newline).
  if (before.trim() === '' && after.trim() === '') {
    return src.slice(0, lineStart) + src.slice(Math.min(lineEnd + 1, src.length));
  }
  // Otherwise cut only the span, leaving surrounding bytes untouched.
  return src.slice(0, start) + src.slice(end);
}

/** Remove the <a class="float-call">...</a> element. Returns [src, count]. */
function removeMarkup(src) {
  let count = 0;
  for (;;) {
    const attr = src.indexOf('class="float-call"');
    if (attr === -1) break;
    const open = src.lastIndexOf('<a', attr);
    if (open === -1) throw new Error('float-call class attr with no opening <a>');
    const close = src.indexOf('</a>', attr);
    if (close === -1) throw new Error('float-call <a> with no closing </a>');
    // Sanity: no nested <a> between open and close.
    if (src.slice(open + 2, close).includes('<a ')) {
      throw new Error('unexpected nested <a> inside float-call element');
    }
    src = cutSpan(src, open, close + 4);
    count++;
  }
  return [src, count];
}

/** Brace-match forward from the `{` at `open`; returns index just past its `}`. */
function matchBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error('unbalanced braces in <style>');
}

/** Remove every `.float-call { ... }` CSS rule. Returns [src, count]. */
function removeCssRules(src) {
  let count = 0;
  for (;;) {
    const sel = src.indexOf('.float-call');
    if (sel === -1) break;

    // Guard: selector must be bare (verified site-wide: no compound/pseudo forms).
    const next = src[sel + '.float-call'.length];
    if (!/[\s{]/.test(next)) {
      throw new Error(`unexpected .float-call selector form near: ${src.slice(sel, sel + 60)}`);
    }
    const brace = src.indexOf('{', sel);
    if (brace === -1) throw new Error('.float-call selector with no rule block');
    // Nothing but whitespace may sit between selector and `{`.
    if (src.slice(sel + '.float-call'.length, brace).trim() !== '') {
      throw new Error(`unexpected selector list near: ${src.slice(sel, sel + 60)}`);
    }
    const end = matchBrace(src, brace);
    src = cutSpan(src, sel, end);
    count++;
  }
  return [src, count];
}

/** Flag any @media block left with an empty body after rule removal. */
function findEmptyMedia(src) {
  const hits = [];
  const re = /@media[^{]*\{/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const end = matchBrace(src, m.index + m[0].length - 1);
    const body = src.slice(m.index + m[0].length, end - 1);
    if (body.trim() === '') hits.push(src.slice(m.index, end));
  }
  return hits;
}

const files = execSync('git ls-files "src/pages/**/*.astro"', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => readFileSync(f, 'utf8').includes('float-call'));

let touched = 0, markupTotal = 0, cssTotal = 0, bytesSaved = 0;
const emptyMediaFiles = [];
const cssOnly = [];

for (const file of files) {
  const orig = readFileSync(file, 'utf8');
  let src = orig;
  let mCount, cCount;

  try {
    [src, mCount] = removeMarkup(src);
    [src, cCount] = removeCssRules(src);
  } catch (e) {
    console.error(`SKIP ${file}: ${e.message}`);
    continue;
  }

  if (src.includes('float-call')) {
    console.error(`SKIP ${file}: residual float-call after sweep`);
    continue;
  }
  const empties = findEmptyMedia(src);
  if (empties.length) emptyMediaFiles.push(file);
  if (mCount === 0) cssOnly.push(file);

  markupTotal += mCount;
  cssTotal += cCount;
  bytesSaved += Buffer.byteLength(orig) - Buffer.byteLength(src);
  touched++;

  if (!DRY) writeFileSync(file, src);
}

console.log(`${DRY ? '[DRY] ' : ''}files touched : ${touched} / ${files.length}`);
console.log(`markup elements removed : ${markupTotal}`);
console.log(`css rules removed       : ${cssTotal}`);
console.log(`css-only files (no pill markup) : ${cssOnly.length}`);
console.log(`bytes saved             : ${bytesSaved} (${(bytesSaved / 1024).toFixed(1)} KB)`);
if (emptyMediaFiles.length) {
  console.log(`\n!! @media blocks left empty in ${emptyMediaFiles.length} file(s) — review:`);
  emptyMediaFiles.slice(0, 10).forEach((f) => console.log(`   ${f}`));
}
