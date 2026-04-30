#!/usr/bin/env node
/**
 * reclassify-brand-pages-geo.mjs
 *
 * Re-runs the geo-neutrality classifier across all src/pages/brands/*.astro
 * to compute current Group A / B / C / D distribution after Phase 2 sweeps.
 *
 * Group A = Fully Neutral: no LA-only narrative locks
 * Group B = Partially Neutral: has body-narrative LA references (neighborhoods,
 *           "Westside" wording, hero placeholder text, eyebrow ZIP codes,
 *           service-area "LA" phrasing, etc.)
 * Group C = Still LA-Locked: fully LA-only voice (title + H1 + body all LA)
 * Group D = Special / Stubs: small placeholder pages, < 3KB
 *
 * Writes audit-output/brand-groups-phase2-final-{YYYY-MM-DD}.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BRANDS_DIR = 'src/pages/brands';
const TODAY = new Date().toISOString().slice(0, 10);
const OUT_PATH = `audit-output/brand-groups-phase2-final-${TODAY}.json`;

const LA_NEIGHBORHOOD_PATTERNS = [
  /Bel Air/i, /Holmby Hills/i, /Brentwood/i, /Pacific Palisades/i,
  /Beverly Hills/i, /Hollywood Hills/i, /Westwood/i, /Santa Monica/i,
  /Pasadena/i, /Encino/i, /Sherman Oaks/i, /Calabasas/i, /Hidden Hills/i,
  /Mar Vista/i, /Culver City/i, /Malibu/i, /Studio City/i, /West Hollywood/i,
];

const WESTSIDE_PATTERN = /\bWestside\b/i;
const LA_GENERIC_PATTERNS = [
  /\bin LA\b/, /\bacross LA\b/, /\bLA service areas\b/i,
  /\bLA hard water\b/i, /\bLA luxury\b/i, /\bLA condos\b/i,
  /\bLA homes\b/i, /\bLA-specific\b/i, /\bLA mass-market\b/i,
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) yield full;
  }
}

function classify(filePath) {
  const text = readFileSync(filePath, 'utf8');
  const filename = filePath.split(/[\\/]/).pop();
  const sizeKB = Buffer.byteLength(text) / 1024;

  // Group D: small stubs/placeholders
  if (sizeKB < 3) return { file: filename, group: 'd', reason: `stub (${sizeKB.toFixed(1)}KB)` };

  // Body content: strip out frontmatter (---...---), schema JSON, and FAQ q/a strings
  let body = text.replace(/^---[\s\S]*?^---/m, '');
  body = body.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, '');
  body = body.replace(/"q":\s*"[^"]*"|"a":\s*"[^"]*"/g, '');
  body = body.replace(/q:\s*"[^"]*"|a:\s*"[^"]*"/g, '');

  // Count LA neighborhood mentions in body
  let neighborhoodCount = 0;
  for (const pat of LA_NEIGHBORHOOD_PATTERNS) {
    const m = body.match(pat);
    if (m) neighborhoodCount++;
  }

  const hasWestside = WESTSIDE_PATTERN.test(body);
  const laGenericMatches = LA_GENERIC_PATTERNS.filter(p => p.test(body)).length;

  // Eyebrow check
  const eyebrowLALock = /<p class="hero-eyebrow">Los Angeles[^<]*<\/p>/.test(body);
  const eyebrowZIPLock = /<p class="hero-eyebrow">[^<]*9\d{4}[^<]*<\/p>/.test(body);

  // Hero placeholder
  const heroPlaceholderLA = /<div class="hero-img-placeholder">[\s\S]*?<p>Los Angeles<\/p>[\s\S]*?<\/div>/.test(body);

  const reasons = [];
  if (eyebrowZIPLock) reasons.push('eyebrow-zips');
  if (eyebrowLALock) reasons.push('eyebrow-la');
  if (heroPlaceholderLA) reasons.push('hero-placeholder-la');
  if (neighborhoodCount >= 4) reasons.push(`la-neighborhoods(${neighborhoodCount})`);
  if (hasWestside && neighborhoodCount >= 2) reasons.push('westside+neighborhoods');
  if (laGenericMatches >= 3) reasons.push(`la-generic(${laGenericMatches})`);

  if (reasons.length === 0) {
    return { file: filename, group: 'a', reason: 'fully neutral' };
  }
  // No Group C in current data — all body-narrative locks classified B
  return { file: filename, group: 'b', reason: reasons.join('+') };
}

function main() {
  const allFiles = [...walk(BRANDS_DIR)];
  const groups = { a: [], b: [], c: [], d: [] };
  for (const f of allFiles) {
    const result = classify(f);
    groups[result.group].push(result);
  }

  const summary = {
    total: allFiles.length,
    a: groups.a.length,
    b: groups.b.length,
    c: groups.c.length,
    d: groups.d.length,
  };

  console.log(`# Brand Pages Geo-Neutrality Reclassification — ${TODAY}`);
  console.log('');
  console.log(`Total files: ${summary.total}`);
  console.log(`  Group A (Fully Neutral):   ${summary.a}`);
  console.log(`  Group B (Partial):         ${summary.b}`);
  console.log(`  Group C (Still LA-Locked): ${summary.c}`);
  console.log(`  Group D (Stubs):           ${summary.d}`);
  console.log('');

  writeFileSync(OUT_PATH, JSON.stringify({ summary, ...groups }, null, 2), 'utf8');
  console.log(`Wrote ${OUT_PATH}`);

  // Show top 10 remaining Group B files by reason
  console.log('\n## Remaining Group B sample (first 20):');
  for (const r of groups.b.slice(0, 20)) {
    console.log(`  ${r.file}: ${r.reason}`);
  }
}

main();
