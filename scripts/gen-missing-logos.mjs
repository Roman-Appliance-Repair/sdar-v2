// scripts/gen-missing-logos.mjs
// Make simplified gold wordmark logos (our own version, not a copy of any real mark)
// for the 9 brands among the 70 hero pages that had no file in public/brand-logos/.
// Plain brand name set in a bold sans serif, gold fill, transparent background, .webp.
// 500x222 to match existing logos (ServiceHero gold-tints them via CSS anyway).

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('public/brand-logos');
const W = 500, H = 222, GOLD = '#E8B23A';

// slug (file name = brand) → display wordmark text
const BRANDS = [
  { slug: 'accurex',     text: 'ACCUREX' },
  { slug: 'adc',         text: 'ADC' },
  { slug: 'aga',         text: 'AGA' },
  { slug: 'big-chill',   text: 'BIG CHILL' },
  { slug: 'bull',        text: 'BULL' },
  { slug: 'capital',     text: 'CAPITAL' },
  { slug: 'captiveaire', text: 'CAPTIVEAIRE' },
  { slug: 'coyote',      text: 'COYOTE' },
  { slug: 'ge',          text: 'GE' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svgFor(text) {
  // Size by estimated rendered width so the wordmark fits inside ~440px (30px margins),
  // never exceeding 150px. Arial bold caps advance ~0.70em; letter-spacing ~0.04em per gap.
  const n = text.length;
  const fs_ = Math.min(150, Math.floor(440 / (0.70 * n + 0.04 * (n - 1))));
  const ls = (fs_ * 0.04).toFixed(1);
  return Buffer.from(
`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="${W/2}" y="${H/2}" fill="${GOLD}"
    font-family="Arial, 'Helvetica Neue', Helvetica, sans-serif" font-weight="800"
    font-size="${fs_}" letter-spacing="${ls}"
    text-anchor="middle" dominant-baseline="central">${esc(text)}</text>
</svg>`);
}

let n = 0;
for (const { slug, text } of BRANDS) {
  const dest = path.join(OUT, `${slug}.webp`);
  if (fs.existsSync(dest)) { console.log(`• ${slug}.webp exists, skip`); continue; }
  await sharp(svgFor(text), { density: 200 })
    .resize(W, H, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(dest);
  const meta = await sharp(dest).metadata();
  console.log(`✓ ${slug.padEnd(13)} "${text}" → ${meta.width}x${meta.height} alpha=${meta.hasAlpha}`);
  n++;
}
console.log(`\nWrote ${n} logo files to public/brand-logos/.`);
