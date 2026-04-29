#!/usr/bin/env node
/**
 * sweep-brand-body-rating.mjs
 *
 * T-BRANDS Day 4 — body-visible rating cleanup across src/pages/brands/.
 *
 * Removes per NAP & Rating Policy SSOT rule 4 (no body-visible numerical ratings):
 *   Pattern A — Wolf hub canonical div (37 files):
 *     <div class="hero-rating">
 *       <span class="stars">★★★★★</span>
 *       <span>4.6 · 37 reviews · Google</span>
 *     </div>
 *     + dead .hero-rating CSS rule (always remove)
 *     + dead .stars CSS rule (remove ONLY if no other class="stars" usage in file)
 *
 *   Pattern B — single-span pill (~295 files):
 *     <span>★ 4.6 / 37 Google reviews</span>
 *     (siblings — CSLB, Insured, etc — preserved)
 *
 *   Pattern C — ⭐ commercial-refrigeration (~6 files):
 *     <span>⭐ 4.6 · 37 Commercial Reviews</span>
 *     (siblings preserved)
 *
 *   Hub — brands/index.astro programmatic catalog:
 *     <span class="brand-rating">★ 4.6 · 37 reviews</span>  × 4 instances
 *     + dead .brand-rating CSS rule (remove ONLY if no other class="brand-rating" usage)
 *
 * Default: --dry-run. Pass --apply to write.
 *   node scripts/sweep-brand-body-rating.mjs            # dry-run
 *   node scripts/sweep-brand-body-rating.mjs --apply    # actual edits
 *   node scripts/sweep-brand-body-rating.mjs --diff=<rel-path>  # focus diff on one file
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BRANDS = path.join(ROOT, 'src', 'pages', 'brands');
const HUB_FILE = path.join(BRANDS, 'index.astro');

const APPLY = process.argv.includes('--apply');
const SHOW_DIFF_FOR = process.argv
  .filter((a) => a.startsWith('--diff='))
  .map((a) => a.slice('--diff='.length));

// ─── File enumeration ───────────────────────────────────────────────────────

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) files.push(full);
  }
}
walk(BRANDS);

// ─── Patterns ───────────────────────────────────────────────────────────────

// Pattern A: <div class="hero-rating">…</div>
// Match leading whitespace + the opening tag + body (with stars span + 4.6 · 37 span) + closing tag.
// Body content is conservatively flexible (whitespace + spans).
const PATTERN_A_DIV = /\n[ \t]*<div class="hero-rating">[\s\S]*?<\/div>/g;

// Pattern A CSS rule .hero-rating { ... } — single-line or multi-line block
const PATTERN_A_CSS = /\n[ \t]*\.hero-rating\s*\{[^{}]*\}/g;

// .stars CSS rule
const PATTERN_A_STARS_CSS = /\n[ \t]*\.stars\s*\{[^{}]*\}/g;

// Pattern B: <span>★ 4.6 / 37 Google reviews</span>
// Span can be on its own line (multi-line trust-bar) OR inline (single-line <div class="wrap">…</div>).
// The leading \s* greedily consumes preceding whitespace (incl. newline+indent) when the span is on
// its own line, but matches zero chars when the span is sandwiched between adjacent tags inline.
const PATTERN_B_SPAN = /\s*<span>★\s*4\.6\s*\/\s*37\s+Google\s+reviews<\/span>/g;

// Pattern C: <span>⭐ 4.6 · 37 Commercial Reviews</span> or <span>⭐ 4.6 · 37 Reviews</span>
// Same shape; ⭐ unicode (U+2B50) instead of ★ (U+2605). The "Commercial" word is optional
// (5 files have it, Perlick has just "Reviews").
const PATTERN_C_SPAN = /\s*<span>⭐\s*4\.6\s*·\s*37\s+(?:Commercial\s+)?Reviews<\/span>/g;

// Hub brand-rating span — used 4× in brands/index.astro
const HUB_RATING_SPAN = /\n[ \t]*<span class="brand-rating">★\s*4\.6\s*·\s*37\s+reviews<\/span>/g;
const HUB_RATING_CSS = /\n[ \t]*\.brand-rating\s*\{[^{}]*\}/g;

// ─── File-level processing ──────────────────────────────────────────────────

function processBrandFile(content) {
  const orig = content;
  const counts = {
    patternA: 0,
    patternA_css: 0,
    patternA_stars_css: 0,
    patternB: 0,
    patternC: 0,
  };

  // Pattern A: hero-rating div
  content = content.replace(PATTERN_A_DIV, () => {
    counts.patternA++;
    return '';
  });

  // If we removed any Pattern A div, remove the dead .hero-rating CSS rule
  if (counts.patternA > 0) {
    content = content.replace(PATTERN_A_CSS, () => {
      counts.patternA_css++;
      return '';
    });

    // .stars CSS — remove ONLY if no other class="stars" remains in file
    // (after removing hero-rating div, the only stars-class span was inside it)
    const starsClassUsageRemaining = (content.match(/class="stars"/g) || []).length;
    if (starsClassUsageRemaining === 0) {
      content = content.replace(PATTERN_A_STARS_CSS, () => {
        counts.patternA_stars_css++;
        return '';
      });
    }
  }

  // Pattern B
  content = content.replace(PATTERN_B_SPAN, () => {
    counts.patternB++;
    return '';
  });

  // Pattern C
  content = content.replace(PATTERN_C_SPAN, () => {
    counts.patternC++;
    return '';
  });

  return { content, counts, changed: orig !== content, orig };
}

function processHubFile(content) {
  const orig = content;
  const counts = { hubSpans: 0, hubCss: 0 };

  // Remove all 4 brand-rating spans
  content = content.replace(HUB_RATING_SPAN, () => {
    counts.hubSpans++;
    return '';
  });

  // Remove .brand-rating CSS rule ONLY if no other class="brand-rating" remains
  if (counts.hubSpans > 0) {
    const usageRemaining = (content.match(/class="brand-rating"/g) || []).length;
    if (usageRemaining === 0) {
      content = content.replace(HUB_RATING_CSS, () => {
        counts.hubCss++;
        return '';
      });
    }
  }

  return { content, counts, changed: orig !== content, orig };
}

// ─── Mini-diff helper ───────────────────────────────────────────────────────

function makeMiniDiff(orig, modified, file) {
  const oArr = orig.split('\n');
  const mArr = modified.split('\n');
  let head = 0;
  while (head < oArr.length && head < mArr.length && oArr[head] === mArr[head]) head++;
  let tailO = oArr.length - 1;
  let tailM = mArr.length - 1;
  while (tailO >= head && tailM >= head && oArr[tailO] === mArr[tailM]) {
    tailO--;
    tailM--;
  }
  const ctxStart = Math.max(0, head - 2);
  const ctxOEnd = Math.min(oArr.length - 1, tailO + 2);
  const ctxMEnd = Math.min(mArr.length - 1, tailM + 2);

  const lines = [];
  lines.push(`--- ${file} (before)  lines ${ctxStart + 1}..${ctxOEnd + 1}`);
  for (let k = ctxStart; k <= ctxOEnd; k++) {
    const tag = k >= head && k <= tailO ? '-' : ' ';
    lines.push(`${tag} ${oArr[k]}`);
  }
  lines.push(`+++ ${file} (after)   lines ${ctxStart + 1}..${ctxMEnd + 1}`);
  for (let k = ctxStart; k <= ctxMEnd; k++) {
    const tag = k >= head && k <= tailM ? '+' : ' ';
    lines.push(`${tag} ${mArr[k]}`);
  }
  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

const stats = {
  scanned: 0,
  changed: 0,
  unchanged: [],
  totals: {
    A_div: 0,
    A_css: 0,
    A_stars_css: 0,
    B: 0,
    C: 0,
    hub_spans: 0,
    hub_css: 0,
  },
};

const fileResults = new Map();

for (const file of files) {
  stats.scanned++;
  const orig = fs.readFileSync(file, 'utf8');
  let result;
  if (file === HUB_FILE) {
    result = processHubFile(orig);
    stats.totals.hub_spans += result.counts.hubSpans;
    stats.totals.hub_css += result.counts.hubCss;
  } else {
    result = processBrandFile(orig);
    stats.totals.A_div += result.counts.patternA;
    stats.totals.A_css += result.counts.patternA_css;
    stats.totals.A_stars_css += result.counts.patternA_stars_css;
    stats.totals.B += result.counts.patternB;
    stats.totals.C += result.counts.patternC;
  }
  fileResults.set(file, result);
  if (result.changed) {
    stats.changed++;
    if (APPLY) fs.writeFileSync(file, result.content);
  } else {
    stats.unchanged.push(path.relative(ROOT, file));
  }
}

// ─── Sample diffs ───────────────────────────────────────────────────────────

const SAMPLE_FILES = [
  'src/pages/brands/wolf.astro',                                                              // Pattern A
  'src/pages/brands/lg-refrigerator-repair.astro',                                            // Pattern B large
  'src/pages/brands/aga-range-hood-repair.astro',                                             // Pattern B small
  'src/pages/brands/commercial-refrigeration/true-refrigeration-commercial-repair.astro',     // Pattern C
  'src/pages/brands/index.astro',                                                             // Hub
];
const samplesToShow = SHOW_DIFF_FOR.length ? SHOW_DIFF_FOR : SAMPLE_FILES;

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('================================================================');
console.log(` MODE: ${APPLY ? 'APPLY (real edits)' : 'DRY-RUN (no writes)'}`);
console.log(' Brand body-rating sweep — Pattern A div + B span + C span + Hub spans');
console.log('================================================================');
console.log(`Files scanned:    ${stats.scanned}`);
console.log(`Files changed:    ${stats.changed}`);
console.log(`Files unchanged:  ${stats.unchanged.length}`);
console.log();
console.log('Operations:');
console.log(`  Pattern A — hero-rating div blocks deleted:           ${stats.totals.A_div}`);
console.log(`  Pattern A — .hero-rating CSS rule deleted:            ${stats.totals.A_css}`);
console.log(`  Pattern A — .stars CSS rule deleted (only-use):       ${stats.totals.A_stars_css}`);
console.log(`  Pattern B — single-span ★ 4.6 / 37 Google reviews:    ${stats.totals.B}`);
console.log(`  Pattern C — single-span ⭐ 4.6 · 37 Commercial Reviews: ${stats.totals.C}`);
console.log(`  Hub — brand-rating spans deleted:                     ${stats.totals.hub_spans}`);
console.log(`  Hub — .brand-rating CSS rule deleted (only-use):      ${stats.totals.hub_css}`);
console.log();

console.log('Sample diffs:');
console.log();
for (const sf of samplesToShow) {
  const full = path.join(ROOT, sf);
  const r = fileResults.get(full);
  if (!r) {
    console.log(`(skipped — file not found: ${sf})`);
    console.log();
    continue;
  }
  if (!r.changed) {
    console.log(`(no changes — ${sf})`);
    console.log();
    continue;
  }
  console.log('================================================================');
  const c = r.counts;
  const tag = full === HUB_FILE
    ? `Hub spans=${c.hubSpans} hub_css=${c.hubCss}`
    : `A=${c.patternA} A_css=${c.patternA_css} A_stars_css=${c.patternA_stars_css} B=${c.patternB} C=${c.patternC}`;
  console.log(`SAMPLE: ${sf}`);
  console.log(`Counts: ${tag}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, sf));
  console.log();
}

console.log('================================================================');
console.log(` SUMMARY: scanned=${stats.scanned} changed=${stats.changed} unchanged=${stats.unchanged.length}`);
console.log(` ${APPLY ? '★ Files written.' : '★ Dry-run only — no files modified.'}`);
console.log('================================================================');

process.exit(0);
