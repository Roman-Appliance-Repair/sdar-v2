// scripts/wire-missing-logoslug.mjs
// Add logoSlug="{brand}" to the ServiceHero call on the 11 pages whose brand logo
// was just created, so the gold wordmark overlay resolves by brand (not combo slug).

import fs from 'node:fs';

const MAP = {
  'accurex-hood-repair': 'accurex',
  'adc-commercial-dryer-repair': 'adc',
  'aga-range-hood-repair': 'aga',
  'aga-stove-repair': 'aga',
  'big-chill-refrigerator-repair': 'big-chill',
  'bull-grill-repair': 'bull',
  'capital-bbq-grill-repair': 'capital',
  'captiveaire': 'captiveaire',
  'captiveaire-hood-repair': 'captiveaire',
  'coyote-grill-repair': 'coyote',
  'ge-dishwasher-repair': 'ge',
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let ok = 0; const problems = [];
for (const [slug, brand] of Object.entries(MAP)) {
  const f = `src/pages/brands/${slug}.astro`;
  let s = fs.readFileSync(f, 'utf8');
  if (/logoSlug=/.test(s)) { problems.push(`${slug}: logoSlug already present`); continue; }
  const re = new RegExp(`(\\n([ \\t]*)slug="${esc(slug)}")(\\r?\\n)`);
  if (!re.test(s)) { problems.push(`${slug}: slug line not found`); continue; }
  s = s.replace(re, (m, p1, indent, nl) => `${p1}${nl}${indent}logoSlug="${brand}"${nl}`);
  fs.writeFileSync(f, s, 'utf8');
  console.log(`✓ ${slug.padEnd(34)} logoSlug="${brand}"`);
  ok++;
}
console.log(`\nUpdated ${ok}/11 pages.`);
if (problems.length) { console.error('PROBLEMS:\n' + problems.join('\n')); process.exit(1); }
