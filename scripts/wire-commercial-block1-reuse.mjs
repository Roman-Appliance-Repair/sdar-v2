// scripts/wire-commercial-block1-reuse.mjs
//
// Block 1 reuse-wiring: give every commercial subpage (LIST B, the 161 without
// their own hero photo) a hero by setting the hero-component slug to either
//   (a) a NEW unique folder (walk-in / reach-in / prep / cube / flake / nugget), or
//   (b) its family HUB folder (reuse of the existing 22 hub photos).
//
// Two hero components in play:
//   - <CommercialHero slug="X" />            → resolves /images/commercial/X/hero.webp
//   - <ServiceHero section="commercial" slug="X" /> → same path
//
// Hub pages (22, already have photo + slug) are NOT touched. Pages whose hero is
// a hand-authored <section class="hero"> / <section class="hub-hero"> have no photo
// slot — reported as SKIP_NO_SLOT for a separate markup task (incl. commercial/index,
// which is converted by hand).
//
// Idempotent. Usage: node scripts/wire-commercial-block1-reuse.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src/pages/commercial');

// 22 hub files that already carry a photo + correct slug — never touch.
const HUB_FILES = new Set([
  'charbroiler-repair.astro', 'dishwasher-repair.astro', 'dryer-repair.astro',
  'exhaust-hood-repair.astro', 'food-processor-repair.astro', 'fryer-repair.astro',
  'griddle-repair.astro', 'grill-repair.astro', 'holding-cabinet-repair.astro',
  'kettle-repair.astro', 'laundry-repair.astro', 'mixer-repair.astro',
  'oven-repair.astro', 'range-repair.astro', 'refrigerator-repair.astro',
  'slicer-repair.astro', 'steamer-repair.astro', 'stove-repair.astro',
  'washer-repair.astro',
  path.join('ice-machines', 'index.astro'),
  path.join('refrigeration', 'index.astro'),
]);

// NEW unique folder overrides (relative page path without .astro → photo folder slug)
const NEW_UNIQUE = {
  'refrigeration/walk-in-cooler-repair': 'walk-in-cooler-repair',
  'refrigeration/walk-in-cooler-not-cooling': 'walk-in-cooler-repair',
  'refrigeration/walk-in-freezer-repair': 'walk-in-cooler-repair',
  'refrigeration/walk-in-freezer-troubleshooting': 'walk-in-cooler-repair',
  'refrigeration/reach-in-cooler-repair': 'reach-in-cooler-repair',
  'refrigeration/reach-in-cooler-not-cooling': 'reach-in-cooler-repair',
  'refrigeration/reach-in-freezer-repair': 'reach-in-cooler-repair',
  'refrigeration/prep-table-repair': 'prep-table-repair',
  'refrigeration/undercounter-refrigerator-repair': 'prep-table-repair',
  'refrigeration/display-case-repair': 'prep-table-repair',
  'ice-machines/cube-ice-repair': 'cube-ice-repair',
  'ice-machines/flake-ice-repair': 'flake-ice-repair',
  'ice-machines/nugget-ice-repair': 'nugget-ice-repair',
};

// manual-only (converted by hand) — skip in script
const MANUAL = new Set(['index']);

function relSlug(file) {
  return path.relative(ROOT, file).replace(/\\/g, '/').replace(/\.astro$/, '');
}

// reuse slug = first path segment (each maps 1:1 to a hub photo folder)
function slugFor(rel) {
  if (NEW_UNIQUE[rel]) return NEW_UNIQUE[rel];
  return rel.split('/')[0];
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.astro')) out.push(p);
  }
  return out;
}

function setAttr(tagBlock, attr, value) {
  const re = new RegExp(`\\n\\s*${attr}="[^"]*"`);
  if (re.test(tagBlock)) return tagBlock.replace(re, `\n  ${attr}="${value}"`);
  // insert right after the opening component name
  return tagBlock.replace(/^<(CommercialHero|ServiceHero)/, `<$1\n  ${attr}="${value}"`);
}

const results = [];

for (const file of walk(ROOT)) {
  const relFromRoot = path.relative(ROOT, file).replace(/\\/g, '/');
  const rel = relSlug(file);

  if (HUB_FILES.has(path.relative(ROOT, file))) { results.push({ rel, status: 'HUB_SKIP' }); continue; }
  if (MANUAL.has(rel)) { results.push({ rel, status: 'MANUAL_SKIP' }); continue; }

  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  const slug = slugFor(rel);

  let comp = null;
  if (src.includes('<CommercialHero')) comp = 'CommercialHero';
  else if (src.includes('<ServiceHero')) comp = 'ServiceHero';

  if (!comp) { results.push({ rel, slug, status: 'SKIP_NO_SLOT' }); continue; }

  const openIdx = src.indexOf(`<${comp}`);
  const closeIdx = src.indexOf('/>', openIdx);
  if (closeIdx === -1) { results.push({ rel, slug, status: 'UNCLOSED' }); continue; }

  let tag = src.slice(openIdx, closeIdx + 2);
  tag = setAttr(tag, 'slug', slug);
  if (comp === 'ServiceHero') tag = setAttr(tag, 'section', 'commercial');
  src = src.slice(0, openIdx) + tag + src.slice(closeIdx + 2);

  if (src !== before) { fs.writeFileSync(file, src, 'utf8'); results.push({ rel, slug, comp, status: 'PATCHED' }); }
  else results.push({ rel, slug, comp, status: 'NO_CHANGE' });
}

const counts = results.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
console.log('=== PATCHED (sample) ===');
for (const r of results.filter(r => r.status === 'PATCHED').slice(0, 12)) console.log(`  ${r.comp.padEnd(14)} ${r.rel}  → slug="${r.slug}"`);
console.log('\n=== SKIP_NO_SLOT (need markup task) ===');
for (const r of results.filter(r => r.status === 'SKIP_NO_SLOT')) console.log(`  ${r.rel}`);
console.log('\nSummary:', counts);
