import fs from 'node:fs';
import path from 'node:path';

const TOP_LEVEL_SLUGS = [
  'charbroiler-repair',
  'dishwasher-repair',
  'dryer-repair',
  'exhaust-hood-repair',
  'food-processor-repair',
  'fryer-repair',
  'griddle-repair',
  'grill-repair',
  'holding-cabinet-repair',
  'kettle-repair',
  'laundry-repair',
  'mixer-repair',
  'oven-repair',
  'range-repair',
  'refrigerator-repair',
  'slicer-repair',
  'steamer-repair',
  'stove-repair',
  'washer-repair',
];

const SUBDIR_PAGES = [
  ['ice-machines', 'src/pages/commercial/ice-machines/index.astro'],
];

const results = [];

function patchFile(file, slug) {
  if (!fs.existsSync(file)) {
    results.push({ slug, file, status: 'MISSING_FILE' });
    return;
  }
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  const openIdx = src.indexOf('<CommercialHero');
  if (openIdx === -1) {
    results.push({ slug, file, status: 'NO_COMMERCIALHERO' });
    return;
  }
  const closeIdx = src.indexOf('/>', openIdx);
  if (closeIdx === -1) {
    results.push({ slug, file, status: 'UNCLOSED_TAG' });
    return;
  }
  let tagBlock = src.slice(openIdx, closeIdx + 2);
  if (/\n\s*slug="[^"]*"/.test(tagBlock)) {
    tagBlock = tagBlock.replace(/\n\s*slug="[^"]*"/, `\n  slug="${slug}"`);
  } else {
    tagBlock = tagBlock.replace(
      /^<CommercialHero/,
      `<CommercialHero\n  slug="${slug}"`
    );
  }
  src = src.slice(0, openIdx) + tagBlock + src.slice(closeIdx + 2);
  if (src !== before) {
    fs.writeFileSync(file, src, 'utf8');
    results.push({ slug, file, status: 'PATCHED' });
  } else {
    results.push({ slug, file, status: 'NO_CHANGE' });
  }
}

for (const slug of TOP_LEVEL_SLUGS) {
  patchFile(path.join('src', 'pages', 'commercial', `${slug}.astro`), slug);
}
for (const [slug, file] of SUBDIR_PAGES) {
  patchFile(file, slug);
}

console.log('slug                              | status');
console.log('--------------------------------- | -----------');
for (const r of results) {
  console.log(`${r.slug.padEnd(33)} | ${r.status}`);
}
console.log('');
const counts = results.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
console.log('Summary:', counts);
