import fs from 'node:fs';
import path from 'node:path';

// Slug per file. Note: wine-cellar-repair.astro is excluded — it was
// just created in Step 4 with section + slug already passed.
const MAPPING = [
  ['outdoor/grill-repair.astro', 'grill-repair'],
  ['outdoor/kitchen-repair.astro', 'kitchen-repair'],
  ['outdoor/pizza-oven-repair.astro', 'pizza-oven-repair'],
  ['outdoor/smoker-repair.astro', 'smoker-repair'],
  ['outdoor/fireplace-repair.astro', 'fireplace-repair'],
  ['outdoor/patio-heater-repair.astro', 'patio-heater-repair'],
  ['outdoor/kitchen-maintenance.astro', 'kitchen-maintenance'],
  ['outdoor/wine-cellar-maintenance.astro', 'wine-cellar-maintenance'],
  ['outdoor/index.astro', 'index'],
  ['outdoor/grill-repair-beverly-hills.astro', 'grill-repair-beverly-hills'],
  ['outdoor/kitchen-repair-malibu.astro', 'kitchen-repair-malibu'],
  ['outdoor/kitchen-repair-newport-beach.astro', 'kitchen-repair-newport-beach'],
  ['outdoor/kitchen-repair-thousand-oaks.astro', 'kitchen-repair-thousand-oaks'],
  ['outdoor/wine-cellar-repair-bel-air.astro', 'wine-cellar-repair-bel-air'],
  ['outdoor/wine-cellar-repair-beverly-hills.astro', 'wine-cellar-repair-beverly-hills'],
  ['outdoor/wine-cellar-repair-malibu.astro', 'wine-cellar-repair-malibu'],
  ['outdoor/wine-cellar-repair-newport-beach.astro', 'wine-cellar-repair-newport-beach'],
  ['outdoor/wine-cellar-repair-pacific-palisades.astro', 'wine-cellar-repair-pacific-palisades'],
];

const results = [];

for (const [rel, slug] of MAPPING) {
  const file = path.join('src', 'pages', rel);
  if (!fs.existsSync(file)) {
    results.push({ slug, file, status: 'MISSING_FILE' });
    continue;
  }
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  const openIdx = src.indexOf('<ServiceHero');
  if (openIdx === -1) {
    results.push({ slug, file, status: 'NO_SERVICEHERO' });
    continue;
  }
  const closeIdx = src.indexOf('/>', openIdx);
  if (closeIdx === -1) {
    results.push({ slug, file, status: 'UNCLOSED_TAG' });
    continue;
  }
  let tagBlock = src.slice(openIdx, closeIdx + 2);
  // Insert section first, slug second (or update if already present).
  if (/\n\s*section="[^"]*"/.test(tagBlock)) {
    tagBlock = tagBlock.replace(/\n\s*section="[^"]*"/, `\n  section="outdoor"`);
  } else {
    tagBlock = tagBlock.replace(/^<ServiceHero/, `<ServiceHero\n  section="outdoor"`);
  }
  if (/\n\s*slug="[^"]*"/.test(tagBlock)) {
    tagBlock = tagBlock.replace(/\n\s*slug="[^"]*"/, `\n  slug="${slug}"`);
  } else {
    // Insert slug right after section=
    tagBlock = tagBlock.replace(/(\n\s*section="outdoor")/, `$1\n  slug="${slug}"`);
  }
  src = src.slice(0, openIdx) + tagBlock + src.slice(closeIdx + 2);
  if (src !== before) {
    fs.writeFileSync(file, src, 'utf8');
    results.push({ slug, file, status: 'PATCHED' });
  } else {
    results.push({ slug, file, status: 'NO_CHANGE' });
  }
}

console.log('slug                                     | status');
console.log('---------------------------------------- | -----------');
for (const r of results) {
  console.log(`${r.slug.padEnd(40)} | ${r.status}`);
}
console.log('');
const counts = results.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
console.log('Summary:', counts);
