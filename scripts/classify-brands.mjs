// scripts/classify-brands.mjs
// Regenerate src/data/commercial-brand-slugs.ts — the allowlist of /brands/ pages whose
// own diagnostic fee is COMMERCIAL ($120). Classifies each brand page by its diagnostic-
// fee phrasing ("$120 commercial diagnostic" vs "$89 diagnostic"). Pages that emit BOTH
// signals are resolved by manual review (FORCE_COMM / FORCE_RESI below — dominant own-fee
// from the hero/trust-bar). Run: node scripts/classify-brands.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DIR = 'src/pages/brands';
const commRe = /\$120[^.<]{0,30}diagnostic|commercial diagnostic[^.<]{0,25}\$120|commercial diagnostic is \$120|\$120 flat commercial/i;
const resiRe = /\$89[^.<]{0,30}diagnostic/i;

// Mixed-signal pages resolved by dominant own-fee (manual review 2026-06-24):
const FORCE_COMM = new Set(['captiveaire-hood-repair', 'halton-hood-repair', 'maytag-commercial-laundry-repair', 'speed-queen-commercial-laundry-repair', 'traulsen']);
const FORCE_RESI = new Set(['electrolux', 'electrolux-dishwasher-repair', 'marvel', 'maytag-wall-oven-repair']);

const commercial = [];
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.astro'))) {
  const slug = f.replace(/\.astro$/, '');
  if (FORCE_RESI.has(slug)) continue;
  const s = readFileSync(path.join(DIR, f), 'utf8');
  if (FORCE_COMM.has(slug) || (commRe.test(s) && !resiRe.test(s))) commercial.push(slug);
}
commercial.sort();

const body = `// src/data/commercial-brand-slugs.ts
// Allowlist of /brands/{slug}/ pages whose own diagnostic fee is COMMERCIAL ($120)
// — foodservice / commercial-grade equipment under /brands/. Used by MegaMenu so the
// header promo shows $120 (not the $89 residential default) on these pages, matching
// the fee printed on the page itself. Derived from each page's diagnostic-fee phrasing
// ("$120 commercial diagnostic" vs "$89 diagnostic"); 9 mixed-signal pages resolved by
// dominant own-fee. Regenerate via scripts/classify-brands.mjs if brand pages change.
// Count: ${commercial.length}.
export const COMMERCIAL_BRAND_SLUGS = new Set<string>([
${commercial.map((s) => `  '${s}',`).join('\n')}
]);
`;
writeFileSync('src/data/commercial-brand-slugs.ts', body);
console.log(`Wrote src/data/commercial-brand-slugs.ts — ${commercial.length} slugs`);
