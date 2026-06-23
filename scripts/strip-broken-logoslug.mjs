// scripts/strip-broken-logoslug.mjs
// Remove logoSlug from pages whose brand logo renders BADLY under the ServiceHero gold
// overlay → those pages fall back to clean background (no logo).
//   - 11 pages: the simplified wordmarks generated this task (being deleted per request)
//   - 10 pages: pre-existing legacy logos that are opaque-bg (gold rectangle) or wrong aspect
// Good real logos on the other ~50 pages are untouched.

import fs from 'node:fs';

const MINE = [
  'accurex-hood-repair','adc-commercial-dryer-repair','aga-range-hood-repair','aga-stove-repair',
  'big-chill-refrigerator-repair','bull-grill-repair','capital-bbq-grill-repair','captiveaire',
  'captiveaire-hood-repair','coyote-grill-repair','ge-dishwasher-repair',
];
const BROKEN_LEGACY = [
  'aht-cooling-systems-refrigeration-repair','alto-shaam-oven-repair','asko-dishwasher-repair',
  'asko-dryer-repair','asko-washer-repair','beko-dishwasher-repair','bki-rotisserie-repair',
  'champion-dishwasher-repair','electrolux-professional-dishwasher-repair','whirlpool-dishwasher-repair',
];
const ALL = [...MINE, ...BROKEN_LEGACY];

let ok = 0; const problems = [];
for (const slug of ALL) {
  const f = `src/pages/brands/${slug}.astro`;
  let s = fs.readFileSync(f, 'utf8');
  if (!/logoSlug=/.test(s)) { problems.push(`${slug}: no logoSlug (already clean?)`); continue; }
  const before = s;
  s = s.replace(/\r?\n[ \t]*logoSlug="[^"]*"/, '');
  if (s === before) { problems.push(`${slug}: logoSlug line not matched`); continue; }
  fs.writeFileSync(f, s, 'utf8');
  console.log(`✓ ${slug}`);
  ok++;
}
console.log(`\nStripped logoSlug from ${ok}/${ALL.length} pages (${MINE.length} generated + ${BROKEN_LEGACY.length} broken legacy).`);
if (problems.length) { console.error('PROBLEMS:\n' + problems.join('\n')); process.exit(1); }
