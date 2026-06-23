// scripts/audit-hero-logos.mjs — read-only audit.
// For each of the 70 converted brand pages, resolve the logo ServiceHero would show
// (logoSlug attr, else slug fallback), inspect the file, and flag ones that render
// BROKEN under the gold overlay: opaque background (no alpha → solid gold rectangle)
// or extreme aspect ratio (giant/stretched).

import fs from 'node:fs';
import sharp from 'sharp';

function slugsFrom(file) {
  return [...fs.readFileSync(file, 'utf8').matchAll(/\d+:'([a-z0-9-]+)'/g)].map(m => m[1]);
}
const pages = [...new Set([...slugsFrom('scripts/convert-c2-w1b.mjs'), ...slugsFrom('scripts/convert-c2-w2c.mjs')])];

const MINE = new Set(['accurex','adc','aga','big-chill','bull','capital','captiveaire','coyote','ge']);

const rows = [];
for (const slug of pages) {
  const src = fs.readFileSync(`src/pages/brands/${slug}.astro`, 'utf8');
  const m = src.match(/logoSlug="([^"]+)"/);
  const logoKey = m ? m[1] : slug;               // ServiceHero: logoSlug ?? slug
  const file = `public/brand-logos/${logoKey}.webp`;
  if (!fs.existsSync(file)) { rows.push({ slug, logoKey, state: 'no-logo (clean bg)' }); continue; }
  const meta = await sharp(file).metadata();
  const ar = meta.width / meta.height;
  let broken = null;
  if (!meta.hasAlpha) broken = 'OPAQUE→gold rectangle';
  else if (ar > 3.2) broken = `wide ${ar.toFixed(2)}:1 → giant`;
  else if (ar < 0.6) broken = `tall ${ar.toFixed(2)}:1`;
  rows.push({ slug, logoKey, dims: `${meta.width}x${meta.height}`, alpha: meta.hasAlpha, ar: ar.toFixed(2), mine: MINE.has(logoKey), broken });
}

const broken = rows.filter(r => r.broken);
const okLogo = rows.filter(r => !r.broken && r.dims);
const noLogo = rows.filter(r => !r.dims);

console.log('=== BROKEN (would show badly under gold overlay) ===');
for (const r of broken) console.log(`  ${r.slug.padEnd(40)} logo=${r.logoKey.padEnd(20)} ${r.dims} ${r.broken}`);
console.log(`\n=== OK logos (${okLogo.length}) — keep ===`);
const okBrands = [...new Set(okLogo.map(r => r.logoKey + (r.mine ? '*' : '')))].sort();
console.log('  ' + okBrands.join(', ') + '   (* = generated this task)');
console.log(`\n=== no logo / clean bg (${noLogo.length}) ===`);
console.log('  ' + noLogo.map(r => r.slug).join(', ') || '  (none)');

const brokenBrands = [...new Set(broken.map(r => r.logoKey))].sort();
console.log(`\nBROKEN logo files: ${brokenBrands.join(', ')}`);
console.log(`Pages affected by broken logos: ${broken.map(r => r.slug).join(', ')}`);
