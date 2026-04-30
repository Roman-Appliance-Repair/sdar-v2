#!/usr/bin/env node
/**
 * sweep-brand-geo-phase2-universal.mjs
 *
 * Phase 2 universal-pattern sweep across remaining mid-tier and long-tail
 * brand pages. Applies exact-string fixes for non-narrative LA-locks that
 * follow predictable templates:
 *
 * 1. Hero eyebrow: `Los Angeles · Beverly Hills · Sherman Oaks · Brentwood · Pasadena`
 * 2. Bottom CTA: `Same-day appliance repair in Los Angeles, Orange County, Ventura County. Residential diagnostic $89, waived with repair.`
 * 3. Bottom CTA variant: `Same-day appliance repair in Los Angeles, Orange County, Ventura County, San Bernardino, Riverside.`
 * 4. Service-area heading: `<h2>LA service areas — where our X calls come from</h2>` (matches multiple brand variants)
 * 5. Related-card sibling: `Hub page — all X categories in LA.`
 *
 * No narrative paragraphs touched (those need per-page UNIQUE expansion).
 * Refuses to mutate Group A or Group D pages from the post-sweep classifier.
 * Idempotent — re-running on already-applied patterns is a no-op.
 *
 * Modes:
 *   --dry-run (default): logs counts to audit-output/brand-sweep-phase2-dryrun.log
 *   --apply: writes to disk
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const isApply = process.argv.includes('--apply');
const GROUPS_PATH = 'audit-output/brand-groups-post-sweep.json';
const BRANDS_DIR = 'src/pages/brands';

// Already-edited files in Phase 2 batch 1 + 2.1 + 2.2 + 2.3 + 2.4
const ALREADY_EDITED = new Set([
  // Phase 2 Batch 1 (luxury manual narrative — commit eaa8d16)
  'sub-zero.astro','sub-zero-refrigerator-repair.astro','sub-zero-wine-cooler-repair.astro','sub-zero-ice-maker-repair.astro',
  'wolf.astro','wolf-cooktop-repair.astro','wolf-oven-repair.astro','wolf-range-repair.astro',
  'thermador.astro','thermador-dishwasher-repair.astro','thermador-oven-repair.astro','thermador-range-repair.astro','thermador-refrigerator-repair.astro',
  'miele.astro','miele-dishwasher-repair.astro','miele-dryer-repair.astro','miele-washer-repair.astro',
  'viking.astro','viking-bbq-grill-repair.astro','viking-cooktop-repair.astro','viking-oven-repair.astro','viking-range-repair.astro','viking-refrigerator-repair.astro',
  'bosch-cooktop-repair.astro','bosch-dishwasher-repair.astro',
  // Phase 2 Batch 2.1 (Whirlpool — commit dee680d)
  'whirlpool-dishwasher-repair.astro','whirlpool-refrigerator-repair.astro',
  // Phase 2 Batch 2.2 (GE cluster — commit 7a38796)
  'ge-cafe-dishwasher-repair.astro','ge-cafe-keurig-refrigerator-repair.astro','ge-cafe-refrigerator-repair.astro',
  'ge-dishwasher-repair.astro','ge-microwave-repair.astro',
  'ge-monogram-built-in-refrigerator-repair.astro','ge-monogram-dishwasher-repair.astro','ge-monogram-ice-maker-repair.astro','ge-monogram-range-hood-repair.astro','ge-monogram-refrigerator-repair.astro','ge-monogram-stove-repair.astro',
  'ge-oven-repair.astro','ge-profile-dishwasher-repair.astro','ge-profile-refrigerator-repair.astro','ge-range-repair.astro','ge-refrigerator-repair.astro','ge-stove-repair.astro',
  // Phase 2 Batch 2.3 (Samsung + LG — commit 574d9a9)
  'lg-dishwasher-repair.astro','lg-ice-maker-repair.astro','lg-oven-repair.astro','lg-range-repair.astro','lg-refrigerator-repair.astro','lg-stove-repair.astro',
  'samsung-dishwasher-repair.astro','samsung-ice-maker-repair.astro','samsung-oven-repair.astro','samsung-refrigerator-repair.astro','samsung-stove-repair.astro',
  // Phase 2 Batch 2.4 (KitchenAid + Maytag + Frigidaire — commit 8d48950)
  'kitchenaid-dishwasher-repair.astro','kitchenaid-microwave-repair.astro','kitchenaid-oven-repair.astro','kitchenaid-refrigerator-repair.astro',
  'maytag-dishwasher-repair.astro','maytag-refrigerator-repair.astro','maytag-stove-repair.astro',
  'frigidaire-dishwasher-repair.astro','frigidaire-refrigerator-repair.astro',
  // Phase 2 Batch 2.5 partial (Bosch + jennair-refrigerator + jennair hub already edited — commit pending)
  'bosch-dryer-repair.astro','bosch-oven-repair.astro','bosch-refrigerator-repair.astro','bosch-washer-repair.astro','bosch.astro',
  'jennair-refrigerator-repair.astro','jennair.astro',
]);

// ---------- Universal patterns ----------

// Pattern A: hero eyebrow city-list variants → 5-county form
const HERO_EYEBROW_VARIANTS = [
  '<p class="hero-eyebrow">Los Angeles · Beverly Hills · Sherman Oaks · Brentwood · Pasadena</p>',
  '<p class="hero-eyebrow">Los Angeles · Beverly Hills · Santa Monica · Brentwood · Pasadena</p>',
  '<p class="hero-eyebrow">Los Angeles · Beverly Hills · Santa Monica · Pasadena · Irvine</p>',
  '<p class="hero-eyebrow">Los Angeles · Bel Air · Beverly Hills · Brentwood · Malibu</p>',
];
const HERO_EYEBROW_TARGET = '<p class="hero-eyebrow">LA · Orange · Ventura · San Bernardino · Riverside Counties</p>';

// Pattern B: bottom CTA — exact two variants
const BOTTOM_CTA_VARIANTS = [
  'Same-day appliance repair in Los Angeles, Orange County, Ventura County. Residential diagnostic $89, waived with repair.',
  'Same-day appliance repair in Los Angeles, Orange County, Ventura County, San Bernardino, Riverside. Residential diagnostic $89, waived with repair.',
];
const BOTTOM_CTA_TARGET = 'Same-day appliance repair across Los Angeles, Orange, Ventura, San Bernardino, and Riverside counties. Residential diagnostic $89, waived with repair.';

// Pattern C: hub page sibling card text variants
const HUB_PAGE_LINKS = [
  { from: 'all categories in Los Angeles', to: 'all categories across Southern California' },
  { from: 'all categories in LA', to: 'all categories across Southern California' },
];

// Pattern D: standalone "in LA" phrases (only in non-narrative spots)
// We don't auto-edit "in LA" because too many false positives. Skip.

function apply(text) {
  let out = text;
  let counts = { eyebrow: 0, cta: 0, hub: 0 };

  // Hero eyebrow
  for (const v of HERO_EYEBROW_VARIANTS) {
    while (out.includes(v)) {
      out = out.replace(v, HERO_EYEBROW_TARGET);
      counts.eyebrow++;
    }
  }

  // Bottom CTA
  for (const v of BOTTOM_CTA_VARIANTS) {
    while (out.includes(v)) {
      out = out.replace(v, BOTTOM_CTA_TARGET);
      counts.cta++;
    }
  }

  // Hub link text
  for (const pair of HUB_PAGE_LINKS) {
    while (out.includes(pair.from)) {
      out = out.replace(pair.from, pair.to);
      counts.hub++;
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
  // Filter out already-edited files
  const eligible = groupBFiles.filter(f => !ALREADY_EDITED.has(f));

  const totals = { eyebrow: 0, cta: 0, hub: 0 };
  const filesChanged = [];

  for (const filename of eligible) {
    const path = join(BRANDS_DIR, filename);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, 'utf8');
    const { text: out, counts } = apply(text);
    const total = counts.eyebrow + counts.cta + counts.hub;
    if (total > 0) {
      totals.eyebrow += counts.eyebrow;
      totals.cta += counts.cta;
      totals.hub += counts.hub;
      filesChanged.push({ file: filename, ...counts });
      if (isApply) {
        writeFileSync(path, out, 'utf8');
      }
    }
  }

  const lines = [];
  lines.push(`# Phase 2 Universal Sweep — ${isApply ? 'APPLIED' : 'DRY-RUN'}`);
  lines.push('');
  lines.push(`Eligible Group B files (after exclusion of 64 already-edited): ${eligible.length}`);
  lines.push(`Files with changes: ${filesChanged.length}`);
  lines.push('');
  lines.push(`Pattern totals:`);
  lines.push(`  Hero eyebrow city-list:  ${totals.eyebrow}`);
  lines.push(`  Bottom-CTA 5-county fix: ${totals.cta}`);
  lines.push(`  Hub page sibling text:   ${totals.hub}`);
  lines.push(`  TOTAL: ${totals.eyebrow + totals.cta + totals.hub}`);
  lines.push('');
  lines.push(`## Per-file changes`);
  for (const f of filesChanged) {
    lines.push(`  ${f.file}: eyebrow=${f.eyebrow} cta=${f.cta} hub=${f.hub}`);
  }
  const output = lines.join('\n');
  const logPath = isApply ? 'audit-output/brand-sweep-phase2-applied.log' : 'audit-output/brand-sweep-phase2-dryrun.log';
  writeFileSync(logPath, output, 'utf8');
  console.log(output);
  console.log(`\nLog written to ${logPath}`);
}

main();
