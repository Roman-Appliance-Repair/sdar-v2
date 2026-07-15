/**
 * photo-gap-scan.mjs — READ-ONLY photo gap inventory (UI Phase 1, step 1h).
 *
 * Writes audit-output/photo-gap-manifest.csv listing every photo slot the site
 * ACTUALLY renders, and whether its file exists on disk. Modifies no component;
 * slots keep rendering exactly as they do today until photos land.
 *
 * Run:  node --experimental-strip-types scripts/photo-gap-scan.mjs
 *       (Node 24 strips the TS types off the imported data modules natively,
 *        so the matrix/cities lists are the REAL ones, not regex guesses.)
 *
 * Scope decisions — each verified against the components, not assumed:
 *
 *  1. city_pillar_hero      — HeroSection, on all 87 CityLayoutV2 pillars.
 *                             /images/cities/{slug}/hero.webp (+ .jpg fallback)
 *  2. city_pillar_below_fold — the 3 slot components that resolve a file by
 *                             CONVENTION. Emitted ONLY for pillars that actually
 *                             import+use the component. Today that is
 *                             west-hollywood alone — the other 86 pillars never
 *                             render these, so shooting photos for them would
 *                             produce files no page displays.
 *                               NeighborhoodPhoto  -> neighborhood.webp
 *                               LuxurySpecialists  -> luxury-repair.webp
 *                               PropertyManagers   -> property-managers.webp
 *  3. city_service_hero     — every combo in CITY_SERVICE_MATRIX. ServiceHero
 *                             MODE A needs BOTH hero.webp AND hero.jpg
 *                             (see [city]/[service].astro: hasComboPhoto).
 *
 * Deliberately NOT counted as gaps (would be false positives in a photo brief):
 *  - RecentRepairs slot: renders a decorative SVG box with NO <img> and NO path
 *    (RecentRepairs.astro:49). No file can ever fill it. Counted separately.
 *  - CustomNarrative slot: path comes from photoCitySlug/photoFilename PROPS,
 *    not a convention. No page passes photoFilename today, so showPhoto is false
 *    and no slot renders at all. Counted separately.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'src', 'pages');
const PUBLIC = path.join(ROOT, 'public');
const OUT_DIR = path.join(ROOT, 'audit-output');

// pathToFileURL: on Windows a bare absolute path ("C:\...") is rejected by the
// ESM loader as an unknown "c:" protocol.
const { CITY_SERVICE_MATRIX } = await import(
  pathToFileURL(path.join(ROOT, 'src', 'data', 'city-service-matrix.ts')).href
);

/** Slot components whose file path is a fixed convention. */
const CONVENTION_SLOTS = [
  { component: 'NeighborhoodPhoto', slot: 'neighborhood', file: 'neighborhood.webp' },
  { component: 'LuxurySpecialists', slot: 'luxury-repair', file: 'luxury-repair.webp' },
  { component: 'PropertyManagers', slot: 'property-managers', file: 'property-managers.webp' },
];

const rows = [];
const add = (page_url, page_type, slot_type, expected_path) =>
  rows.push({
    page_url,
    page_type,
    slot_type,
    expected_path,
    exists: existsSync(path.join(PUBLIC, expected_path.replace(/^\//, ''))) ? 'yes' : 'no',
  });

// ── City pillars ────────────────────────────────────────────────────────────
const pillars = readdirSync(PAGES)
  .filter((f) => f.endsWith('.astro') && !f.includes('-county'))
  .map((f) => ({ slug: f.replace(/\.astro$/, ''), src: readFileSync(path.join(PAGES, f), 'utf8') }))
  .filter((p) => p.src.includes('CityLayoutV2'));

let decorativeRecentRepairs = 0;
let customNarrativeInactive = 0;

for (const { slug, src } of pillars) {
  add(`/${slug}/`, 'city_pillar', 'hero', `/images/cities/${slug}/hero.webp`);

  for (const { component, slot, file } of CONVENTION_SLOTS) {
    if (src.includes(`<${component}`)) {
      add(`/${slug}/`, 'city_pillar', slot, `/images/cities/${slug}/${file}`);
    }
  }

  if (src.includes('<RecentRepairs')) decorativeRecentRepairs++;
  if (src.includes('<CustomNarrative') && !src.includes('photoFilename')) customNarrativeInactive++;
}

// ── City × service combos ───────────────────────────────────────────────────
for (const { city, service } of CITY_SERVICE_MATRIX) {
  add(
    `/${city}/${service}/`,
    'city_service',
    'hero',
    `/images/city-service/${city}/${service}/hero.webp`
  );
}

// ── Write CSV ───────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
const csv = [
  'page_url,page_type,slot_type,expected_path,exists',
  ...rows.map((r) => [r.page_url, r.page_type, r.slot_type, r.expected_path, r.exists].join(',')),
].join('\n');
writeFileSync(path.join(OUT_DIR, 'photo-gap-manifest.csv'), csv + '\n', 'utf8');

// ── Summary ─────────────────────────────────────────────────────────────────
const missing = rows.filter((r) => r.exists === 'no');
const by = (arr, key) =>
  arr.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});

console.log('PHOTO GAP SCAN — ' + rows.length + ' rendered slots inspected\n');
console.log('  city pillars (CityLayoutV2): ' + pillars.length);
console.log('  city x service combos:       ' + CITY_SERVICE_MATRIX.length);
console.log('\nTOTAL MISSING: ' + missing.length + ' of ' + rows.length + '\n');

console.log('By slot_type:');
const bySlotAll = by(rows, 'slot_type');
const bySlotMiss = by(missing, 'slot_type');
for (const k of Object.keys(bySlotAll).sort()) {
  console.log(
    '  ' + k.padEnd(20) + String(bySlotMiss[k] || 0).padStart(4) + ' missing / ' + bySlotAll[k]
  );
}

console.log('\nBy page_type:');
const byTypeAll = by(rows, 'page_type');
const byTypeMiss = by(missing, 'page_type');
for (const k of Object.keys(byTypeAll).sort()) {
  console.log(
    '  ' + k.padEnd(20) + String(byTypeMiss[k] || 0).padStart(4) + ' missing / ' + byTypeAll[k]
  );
}

if (missing.length) {
  console.log('\nMissing by city:');
  const byCity = by(
    missing.map((r) => ({ city: r.page_url.split('/')[1] })),
    'city'
  );
  for (const [c, n] of Object.entries(byCity).sort((a, b) => b[1] - a[1])) {
    console.log('  ' + c.padEnd(24) + n);
  }
  console.log('\nMissing rows:');
  for (const r of missing) console.log('  ' + r.page_url + '  ' + r.expected_path);
}

console.log('\nNot counted as gaps (no file can fill them today):');
console.log('  RecentRepairs decorative slot : ' + decorativeRecentRepairs +
  ' pillars — SVG-only box, no <img>, no path');
console.log('  CustomNarrative photo slot    : ' + customNarrativeInactive +
  ' pillars use the component but pass no photoFilename -> slot never renders');
console.log('\nWrote audit-output/photo-gap-manifest.csv');
