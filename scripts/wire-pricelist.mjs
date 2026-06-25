// scripts/wire-pricelist.mjs
// Adds a full-bleed background photo to /price-list/* heroes WITHOUT changing the block
// layout. Inserts a bg <picture> after <section class="hero"> and APPENDS minimal CSS
// (position/overflow/z-index + .hero-bg/.hero-overlay) before </style> — so the original
// `.hero` / `.hero-inner` rules (grid 1fr 340px, H1 size, price-box) are untouched.
// Rotation pool: residential pages -> res-1..4, commercial-* -> com-1..2, index -> index.
// Idempotent: skips pages already wired (e.g. refrigerator-repair-cost). Usage: node scripts/wire-pricelist.mjs

import fs from 'node:fs';

const DIR = 'src/pages/price-list';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.astro'));

const commercial = files.filter((f) => f.startsWith('commercial-')).sort();
const residential = files.filter((f) => !f.startsWith('commercial-') && f !== 'index.astro').sort();
const assign = {};
commercial.forEach((f, i) => { assign[f] = `com-${(i % 2) + 1}`; });
residential.forEach((f, i) => { assign[f] = `res-${(i % 4) + 1}`; });
assign['index.astro'] = 'index';

const cssBlock = `
    /* full-bleed hero photo — layout-preserving (positions/grid untouched) */
    .hero { position: relative; overflow: hidden; }
    .hero-bg { position: absolute; inset: 0; z-index: 0; }
    .hero-bg picture, .hero-bg img { width: 100%; height: 100%; object-fit: cover; object-position: 50% center; display: block; }
    .hero-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(100deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.76) 38%, rgba(10,10,10,0.5) 72%, rgba(10,10,10,0.34) 100%); }
    .hero-inner { position: relative; z-index: 2; }
  `;

const bg = (v) => `<section class="hero">
  <div class="hero-bg">
    <picture>
      <source media="(max-width: 640px)" type="image/webp" srcset="/images/price-list/_pool/${v}/hero-640.webp" />
      <source media="(max-width: 640px)" type="image/jpeg" srcset="/images/price-list/_pool/${v}/hero-640.jpg" />
      <source media="(max-width: 960px)" type="image/webp" srcset="/images/price-list/_pool/${v}/hero-960.webp" />
      <source media="(max-width: 960px)" type="image/jpeg" srcset="/images/price-list/_pool/${v}/hero-960.jpg" />
      <source type="image/webp" srcset="/images/price-list/_pool/${v}/hero.webp" />
      <img src="/images/price-list/_pool/${v}/hero.jpg" alt="Appliance repair cost estimate review with a Same Day technician" width="1920" height="840" loading="eager" fetchpriority="high" />
    </picture>
    <div class="hero-overlay"></div>
  </div>`;

let wired = 0, skipped = 0, failed = 0;
const rows = [];
for (const f of files) {
  const file = `${DIR}/${f}`;
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('hero-bg')) { console.log(`skip (wired): ${f}`); skipped++; continue; }
  if (!s.includes('<section class="hero">') || !s.includes('</style>')) { console.error(`MISMATCH: ${f}`); failed++; continue; }
  const v = assign[f];
  s = s.replace('<section class="hero">', bg(v));
  s = s.replace('</style>', `${cssBlock}</style>`);
  fs.writeFileSync(file, s);
  rows.push(`${f} -> ${v}`);
  wired++;
}
console.log('\n' + rows.join('\n'));
console.log(`\n=== wired ${wired}, skipped ${skipped}, failed ${failed} ===`);
if (failed) process.exit(1);
