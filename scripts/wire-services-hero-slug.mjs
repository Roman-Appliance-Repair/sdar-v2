import fs from 'node:fs';
import path from 'node:path';

const SLUGS = [
  'refrigerator-repair',
  'built-in-refrigerator-repair',
  'freezer-repair',
  'washer-repair',
  'dryer-repair',
  'dryer-vent-repair',
  'laundry-repair',
  'stackable-washer-dryer-repair',
  'dishwasher-repair',
  'oven-repair',
  'wall-oven-repair',
  'range-repair',
  'stove-repair',
  'cooktop-repair',
  'induction-cooktop-repair',
  'range-hood-repair',
  'microwave-repair',
  'ice-maker-repair',
  'garbage-disposal-repair',
  'trash-compactor-repair',
  'wine-cooler-repair',
  'wine-cellar-repair',
  'wine-cellar-cooling-repair',
  'bbq-grill-repair',
  'outdoor-refrigerator-repair',
  'pizza-oven-repair',
  'fireplace-repair',
];

const REDUNDANT_PROPS = [
  'image',
  'imageWebp',
  'imageWebpMobile',
  'imageAlt',
];

const results = [];

for (const slug of SLUGS) {
  const file = path.join('src', 'pages', 'services', `${slug}.astro`);
  if (!fs.existsSync(file)) {
    results.push({ slug, status: 'MISSING_FILE' });
    continue;
  }
  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  // Find the <ServiceHero call (assume only one per page).
  const openIdx = src.indexOf('<ServiceHero');
  if (openIdx === -1) {
    results.push({ slug, status: 'NO_SERVICEHERO_CALL' });
    continue;
  }
  // Tag closes at first /> we encounter after openIdx.
  const closeIdx = src.indexOf('/>', openIdx);
  if (closeIdx === -1) {
    results.push({ slug, status: 'UNCLOSED_TAG' });
    continue;
  }

  let tagBlock = src.slice(openIdx, closeIdx + 2);

  // Drop redundant image/imageWebp/imageWebpMobile/imageAlt props if present.
  for (const prop of REDUNDANT_PROPS) {
    // Match a line like:  \n  image="..."  OR  \n  imageWebp={...}
    // Whole line including the leading newline + indent.
    const lineRegex = new RegExp(
      `\\n\\s*${prop}=(?:"[^"]*"|\\{[^}]*\\})`,
      'g'
    );
    tagBlock = tagBlock.replace(lineRegex, '');
  }

  // If slug="…" already exists, replace it; otherwise insert it right after
  // the opening <ServiceHero token.
  if (/\n\s*slug="[^"]*"/.test(tagBlock)) {
    tagBlock = tagBlock.replace(/\n\s*slug="[^"]*"/, `\n  slug="${slug}"`);
  } else {
    tagBlock = tagBlock.replace(
      /^<ServiceHero/,
      `<ServiceHero\n  slug="${slug}"`
    );
  }

  src = src.slice(0, openIdx) + tagBlock + src.slice(closeIdx + 2);

  if (src !== before) {
    fs.writeFileSync(file, src, 'utf8');
    results.push({ slug, status: 'PATCHED' });
  } else {
    results.push({ slug, status: 'NO_CHANGE' });
  }
}

console.log('slug                              | status');
console.log('--------------------------------- | -----------');
for (const r of results) {
  console.log(`${r.slug.padEnd(33)} | ${r.status}`);
}
console.log('');
const counts = results.reduce((m, r) => ((m[r.status] = (m[r.status] || 0) + 1), m), {});
console.log('Summary:', counts);
