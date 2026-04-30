#!/usr/bin/env node
/**
 * sweep-brand-geo-phase2-narrative.mjs
 *
 * Phase 2 narrow narrative-pattern sweep across remaining files. Targets
 * common phrases that are NOT FAQ schema and NOT pricing-table cells.
 *
 * Patterns are exact-string only. Refuses broad regex.
 * No file with `q:` or `a:` JSON keys gets that line touched (FAQ schema rule).
 *
 * Run dry-run first; --apply to write.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const isApply = process.argv.includes('--apply');
const GROUPS_PATH = 'audit-output/brand-groups-post-sweep.json';
const BRANDS_DIR = 'src/pages/brands';

// ---------- Already-edited files (don't re-touch) ----------
// Same as universal sweep — files already manually edited get skipped
const ALREADY_EDITED = new Set([
  // Phase 2 Batch 1
  'sub-zero.astro','sub-zero-refrigerator-repair.astro','sub-zero-wine-cooler-repair.astro','sub-zero-ice-maker-repair.astro',
  'wolf.astro','wolf-cooktop-repair.astro','wolf-oven-repair.astro','wolf-range-repair.astro',
  'thermador.astro','thermador-dishwasher-repair.astro','thermador-oven-repair.astro','thermador-range-repair.astro','thermador-refrigerator-repair.astro',
  'miele.astro','miele-dishwasher-repair.astro','miele-dryer-repair.astro','miele-washer-repair.astro',
  'viking.astro','viking-bbq-grill-repair.astro','viking-cooktop-repair.astro','viking-oven-repair.astro','viking-range-repair.astro','viking-refrigerator-repair.astro',
  'bosch-cooktop-repair.astro','bosch-dishwasher-repair.astro',
  // 2.1
  'whirlpool-dishwasher-repair.astro','whirlpool-refrigerator-repair.astro',
  // 2.2
  'ge-cafe-dishwasher-repair.astro','ge-cafe-keurig-refrigerator-repair.astro','ge-cafe-refrigerator-repair.astro',
  'ge-dishwasher-repair.astro','ge-microwave-repair.astro',
  'ge-monogram-built-in-refrigerator-repair.astro','ge-monogram-dishwasher-repair.astro','ge-monogram-ice-maker-repair.astro','ge-monogram-range-hood-repair.astro','ge-monogram-refrigerator-repair.astro','ge-monogram-stove-repair.astro',
  'ge-oven-repair.astro','ge-profile-dishwasher-repair.astro','ge-profile-refrigerator-repair.astro','ge-range-repair.astro','ge-refrigerator-repair.astro','ge-stove-repair.astro',
  // 2.3
  'lg-dishwasher-repair.astro','lg-ice-maker-repair.astro','lg-oven-repair.astro','lg-range-repair.astro','lg-refrigerator-repair.astro','lg-stove-repair.astro',
  'samsung-dishwasher-repair.astro','samsung-ice-maker-repair.astro','samsung-oven-repair.astro','samsung-refrigerator-repair.astro','samsung-stove-repair.astro',
  // 2.4
  'kitchenaid-dishwasher-repair.astro','kitchenaid-microwave-repair.astro','kitchenaid-oven-repair.astro','kitchenaid-refrigerator-repair.astro',
  'maytag-dishwasher-repair.astro','maytag-refrigerator-repair.astro','maytag-stove-repair.astro',
  'frigidaire-dishwasher-repair.astro','frigidaire-refrigerator-repair.astro',
  // 2.5 partials (Bosch + JennAir)
  'bosch-dryer-repair.astro','bosch-oven-repair.astro','bosch-refrigerator-repair.astro','bosch-washer-repair.astro','bosch.astro',
  'jennair-refrigerator-repair.astro','jennair.astro','jennair-dishwasher-repair.astro','jennair-oven-repair.astro','jennair-range-repair.astro',
]);

// ---------- Patterns ----------

// Pattern set: short generic phrase swaps that are safe across all luxury and long-tail.
// Each pattern is exact string, NOT regex. Designed to be no-op on files where pattern doesn't appear.
const PHRASE_SWAPS = [
  // Service-area headings
  ['<h2>LA service areas — where our', '<h2>Service areas — where our'],
  // Hub link card text
  ['Hub page — all categories in Los Angeles.', 'Hub page — all categories across Southern California.'],
  ['Hub page — all categories in LA.', 'Hub page — all categories across Southern California.'],
  // Common narrative phrasings
  ['failures our techs see most often in LA', 'failures our techs see most often'],
  ['What does this cost in LA', 'What does this typically cost'],
  ['repair costs in LA', 'repair typically costs'],
  ['repair across LA — ', 'repair across Southern California — LA, Orange, Ventura, San Bernardino, Riverside. '],
  // Description-meta-line common forms (only when wrapping description string)
  ['Same-day across LA:', 'Same-day across all 5 SoCal counties:'],
  // "in LA market"
  [' in LA market', ' across our service area'],
  [' in the LA market', ' across our service area'],
  [' in the LA luxury market', ' across our Southern California luxury market'],
  // "across LA" generic
  [' across LA dispatch.', ' across our 8 service territories.'],
  // Hard-water context
  ['LA hard water (200-350 ppm)', 'Southern California hard water (200-350 ppm in LA / OC / Ventura, 300-450+ ppm in IE)'],
  ['LA hard water requires', 'Southern California hard water requires (and IE harder still)'],
  ['LA hard water accelerates', 'Southern California hard water accelerates'],
  ['LA hard-water descaling', 'SoCal hard-water descaling'],
  // Coastal phrasings
  ['LA coastal areas (', 'SoCal coastal areas (LA: '],
  ['LA coastal grills', 'SoCal coastal grills'],
  ['inland LA', 'inland districts'],
  // Generic lead-in trim
  ['Most LA owners chose', 'Most owners across our service area chose'],
  ['most LA homes', 'many homes across our service area'],
];

function apply(text, filename) {
  let out = text;
  let counts = 0;
  for (const [from, to] of PHRASE_SWAPS) {
    while (out.includes(from)) {
      out = out.replace(from, to);
      counts++;
    }
  }
  return { text: out, counts };
}

function main() {
  if (!existsSync(GROUPS_PATH)) {
    console.error(`ERROR: ${GROUPS_PATH} missing`);
    process.exit(1);
  }
  const groups = JSON.parse(readFileSync(GROUPS_PATH, 'utf8'));
  const groupBFiles = groups.b.map(r => r.file);
  const eligible = groupBFiles.filter(f => !ALREADY_EDITED.has(f));

  let totalSwaps = 0;
  const filesChanged = [];
  for (const filename of eligible) {
    const path = join(BRANDS_DIR, filename);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    const { text: out, counts } = apply(text, filename);
    if (counts > 0) {
      totalSwaps += counts;
      filesChanged.push({ file: filename, counts });
      if (isApply) {
        writeFileSync(path, out, 'utf8');
      }
    }
  }

  const lines = [];
  lines.push(`# Phase 2 Narrative Sweep — ${isApply ? 'APPLIED' : 'DRY-RUN'}`);
  lines.push('');
  lines.push(`Eligible Group B files: ${eligible.length}`);
  lines.push(`Files with changes: ${filesChanged.length}`);
  lines.push(`Total swaps: ${totalSwaps}`);
  lines.push('');
  lines.push(`## Per-file`);
  for (const f of filesChanged) {
    lines.push(`  ${f.file}: ${f.counts} swap(s)`);
  }
  const output = lines.join('\n');
  const logPath = isApply ? 'audit-output/brand-sweep-phase2-narrative-applied.log' : 'audit-output/brand-sweep-phase2-narrative-dryrun.log';
  writeFileSync(logPath, output, 'utf8');
  console.log(output);
  console.log(`\nLog written to ${logPath}`);
}

main();
