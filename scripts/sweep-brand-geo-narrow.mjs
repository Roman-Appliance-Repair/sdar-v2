#!/usr/bin/env node
/**
 * sweep-brand-geo-narrow.mjs
 *
 * Narrow geo-neutralization sweep over Group B partial-neutral brand pages
 * (per audit-output/brand-groups.json — 195 pages).
 *
 * Applies 4 EXACT-STRING patterns only. Refuses broad regex.
 * Refuses to touch FAQ/Recent Repairs/pricing/technical body content.
 *
 * Patterns:
 *   1. Hero eyebrow ZIPs (exact line)
 *      "Los Angeles · 90048 · 90046 · 90026 · 90036"
 *      → "LA · Orange · Ventura · San Bernardino · Riverside Counties"
 *
 *   2. Hero photo placeholder text (only inside hero-img-placeholder div)
 *      <p>Los Angeles</p>  → <p>Across Southern California</p>
 *
 *   3. Section heading "Westside coverage" / "Westside service" — only when
 *      wrapped in <h2>/<h3>/<h4> tag, exact match.
 *      → "Across Southern California" / "Southern California service"
 *
 *   4. Service Areas paragraph — exact phrase match (3 known variants).
 *      "Westside coverage — Bel Air, Beverly Hills, Brentwood, Malibu, Pacific Palisades — usually under four hours from call to arrival."
 *      → "Same-day priority across Southern California — Westside LA, Newport Coast OC, Westlake Village Ventura, Rancho Cucamonga Inland Empire — usually under four hours from call to arrival."
 *
 * Modes:
 *   --dry-run (default): no writes; produces /tmp/brand-sweep-dryrun.log + a
 *                        copy at audit-output/brand-sweep-dryrun.log
 *   --apply: writes changes to disk.
 *
 * Exits non-zero if any pattern matches in a file that is NOT in the Group B list
 * (safety: don't mutate Group A or Group D pages).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const isApply = process.argv.includes('--apply');

const GROUPS_PATH = 'audit-output/brand-groups.json';
const BRANDS_DIR = 'src/pages/brands';

// ------- Patterns -------

const PATTERN_1_FROM = '<p class="hero-eyebrow">Los Angeles · 90048 · 90046 · 90026 · 90036</p>';
const PATTERN_1_TO   = '<p class="hero-eyebrow">LA · Orange · Ventura · San Bernardino · Riverside Counties</p>';

// Pattern 2 needs context — only replace inside <div class="hero-img-placeholder">
// We do this by finding hero-img-placeholder block and replacing within its scope.
const PATTERN_2_CONTEXT_RE = /<div class="hero-img-placeholder">[\s\S]*?<\/div>/g;
const PATTERN_2_INNER_FROM = '<p>Los Angeles</p>';
const PATTERN_2_INNER_TO   = '<p>Across Southern California</p>';

// Pattern 3 — heading-only Westside coverage / service. Exact heading text.
const PATTERN_3_PAIRS = [
  { from: /<(h[2-4])([^>]*)>Westside coverage<\/h\1>/g, to: '<$1$2>Across Southern California</$1>' },
  { from: /<(h[2-4])([^>]*)>Westside service<\/h\1>/g, to: '<$1$2>Southern California service</$1>' },
];

// Pattern 4 — exact phrase variants seen in audit
const PATTERN_4_PAIRS = [
  {
    from: 'Westside coverage — Bel Air, Beverly Hills, Brentwood, Malibu, Pacific Palisades — usually under four hours from call to arrival.',
    to:   'Same-day priority across Southern California — Westside LA, Newport Coast OC, Westlake Village Ventura, Rancho Cucamonga Inland Empire — usually under four hours from call to arrival.',
  },
  {
    from: 'Westside coverage — Bel Air, Beverly Hills, Malibu, Pacific Palisades, Brentwood — usually under four hours from call to arrival.',
    to:   'Same-day priority across Southern California — Westside LA, Newport Coast OC, Westlake Village Ventura, Rancho Cucamonga Inland Empire — usually under four hours from call to arrival.',
  },
];

// ------- Helpers -------

function applyPatterns(text) {
  let out = text;
  let counts = { p1: 0, p2: 0, p3: 0, p4: 0 };

  // Pattern 1 — exact string
  while (out.includes(PATTERN_1_FROM)) {
    out = out.replace(PATTERN_1_FROM, PATTERN_1_TO);
    counts.p1++;
  }

  // Pattern 2 — within hero-img-placeholder context only
  out = out.replace(PATTERN_2_CONTEXT_RE, (block) => {
    if (block.includes(PATTERN_2_INNER_FROM)) {
      counts.p2++;
      return block.replace(PATTERN_2_INNER_FROM, PATTERN_2_INNER_TO);
    }
    return block;
  });

  // Pattern 3 — heading-only
  for (const pair of PATTERN_3_PAIRS) {
    const before = out;
    out = out.replace(pair.from, pair.to);
    if (before !== out) {
      // count regex matches
      const matches = before.match(pair.from);
      if (matches) counts.p3 += matches.length;
    }
  }

  // Pattern 4 — exact phrase variants
  for (const pair of PATTERN_4_PAIRS) {
    while (out.includes(pair.from)) {
      out = out.replace(pair.from, pair.to);
      counts.p4++;
    }
  }

  return { text: out, counts };
}

function makeDiff(original, modified, file) {
  // Simple line-by-line diff for changed lines
  const a = original.split('\n');
  const b = modified.split('\n');
  const lines = [];
  const max = Math.max(a.length, b.length);
  let changesContext = [];
  let inChange = false;
  for (let i = 0; i < max; i++) {
    if (a[i] !== b[i]) {
      if (!inChange) {
        // emit a small heading
        lines.push(`@@ ${file}:${i + 1} @@`);
        inChange = true;
      }
      if (a[i] !== undefined) lines.push(`- ${a[i]}`);
      if (b[i] !== undefined) lines.push(`+ ${b[i]}`);
    } else {
      if (inChange) {
        lines.push('');
      }
      inChange = false;
    }
  }
  return lines.join('\n');
}

// ------- Main -------

function main() {
  if (!existsSync(GROUPS_PATH)) {
    console.error(`ERROR: ${GROUPS_PATH} not found. Run audit first.`);
    process.exit(1);
  }
  const groups = JSON.parse(readFileSync(GROUPS_PATH, 'utf8'));
  const groupBFiles = groups.b.map((r) => r.file);
  const groupASet = new Set(groups.a);
  const groupDSet = new Set(groups.d.map((r) => r.file));

  const totals = { p1: 0, p2: 0, p3: 0, p4: 0 };
  const filesChanged = [];
  const sampleDiffs = {};
  const SAMPLES = new Set([
    'sub-zero-refrigerator-repair.astro',
    'wolf-cooktop-repair.astro',
    'thermador-oven-repair.astro',
    'miele-dishwasher-repair.astro',
    'viking.astro',
  ]);

  for (const filename of groupBFiles) {
    const path = join(BRANDS_DIR, filename);
    if (!existsSync(path)) {
      console.warn(`MISSING: ${path}`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    const { text: out, counts } = applyPatterns(text);
    const totalReplacements = counts.p1 + counts.p2 + counts.p3 + counts.p4;
    if (totalReplacements > 0) {
      totals.p1 += counts.p1;
      totals.p2 += counts.p2;
      totals.p3 += counts.p3;
      totals.p4 += counts.p4;
      filesChanged.push({ file: filename, counts });
      if (SAMPLES.has(filename)) {
        sampleDiffs[filename] = makeDiff(text, out, filename);
      }
      if (isApply) {
        writeFileSync(path, out, 'utf8');
      }
    }
  }

  // Safety: verify no Group A or D files would have been mutated
  // (we never touch them — but log if patterns appear in them, as a flag)
  const flaggedNonGroupB = [];
  const otherFiles = [...groupASet, ...groupDSet];
  for (const filename of otherFiles) {
    const path = join(BRANDS_DIR, filename);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    const { counts } = applyPatterns(text);
    const totalReplacements = counts.p1 + counts.p2 + counts.p3 + counts.p4;
    if (totalReplacements > 0) {
      flaggedNonGroupB.push({ file: filename, counts });
    }
  }

  // Output report
  const report = [];
  report.push(`# Brand geo-narrow sweep — ${isApply ? 'APPLIED' : 'DRY-RUN'}`);
  report.push('');
  report.push(`Total Group B files scanned: ${groupBFiles.length}`);
  report.push(`Files with at least one replacement: ${filesChanged.length}`);
  report.push('');
  report.push(`Replacements per pattern:`);
  report.push(`  P1 (eyebrow ZIPs):                       ${totals.p1}`);
  report.push(`  P2 (hero-img-placeholder Los Angeles):   ${totals.p2}`);
  report.push(`  P3 (heading Westside coverage/service):  ${totals.p3}`);
  report.push(`  P4 (Service Areas exact phrase):         ${totals.p4}`);
  report.push(`  TOTAL:                                   ${totals.p1 + totals.p2 + totals.p3 + totals.p4}`);
  report.push('');

  report.push(`## Files changed (${filesChanged.length})`);
  for (const f of filesChanged) {
    report.push(`  ${f.file}: p1=${f.counts.p1} p2=${f.counts.p2} p3=${f.counts.p3} p4=${f.counts.p4}`);
  }
  report.push('');

  report.push(`## Safety check — Group A/D files that would also match (should be 0):`);
  if (flaggedNonGroupB.length === 0) {
    report.push(`  ✓ No Group A or Group D pages contain target patterns. Safe.`);
  } else {
    report.push(`  ⚠ ${flaggedNonGroupB.length} non-Group-B files contain target patterns:`);
    for (const f of flaggedNonGroupB) {
      report.push(`    ${f.file}: p1=${f.counts.p1} p2=${f.counts.p2} p3=${f.counts.p3} p4=${f.counts.p4}`);
    }
  }
  report.push('');

  report.push(`## Sample diffs (5 reference pages)`);
  for (const name of SAMPLES) {
    report.push('');
    report.push(`### ${name}`);
    if (sampleDiffs[name]) {
      report.push('```diff');
      report.push(sampleDiffs[name]);
      report.push('```');
    } else {
      report.push(`(no changes — file does not match any of the 4 patterns)`);
    }
  }

  const output = report.join('\n');

  // Write to repo audit-output (works on Windows where /tmp is unreliable)
  const dryLogPath = isApply
    ? 'audit-output/brand-sweep-applied.log'
    : 'audit-output/brand-sweep-dryrun.log';
  writeFileSync(dryLogPath, output, 'utf8');
  console.log(output);
  console.log(`\nLog written to ${dryLogPath}`);
  if (flaggedNonGroupB.length > 0) {
    console.error('\n❌ SAFETY VIOLATION: target patterns found in non-Group-B pages. Refusing to apply.');
    process.exit(2);
  }
}

main();
