import fs from 'fs';

const files = [
  'src/pages/rancho-cucamonga.astro',
  'src/pages/price-list/commercial-exhaust-hood-repair-cost.astro',
  'src/pages/contact.astro',
  'src/pages/commercial/steamer-repair/brands/market-forge.astro',
  'src/pages/services/refrigerator-repair/freezer-side-issues.astro',
  'src/pages/brands/vinotemp.astro',
  'src/pages/brands/cellarpro.astro',
  'src/pages/commercial/steamer-repair/brands/groen.astro',
  'src/pages/brands/wine-enthusiast-wine-cooler.astro',
  'src/pages/brands/le-cache.astro',
  'src/pages/services/range-hood-repair/not-venting.astro',
  'src/pages/brands/traulsen.astro',
  'src/pages/brands/broan.astro',
  'src/pages/commercial/mixer-repair/brands/univex.astro',
  'src/pages/commercial/kettle-repair/brands/groen.astro',
  'src/pages/brands/summit-wine-cooler.astro',
  'src/pages/brands/danby-wine-cooler.astro',
  'src/pages/commercial/fryer-repair/temperature-recovery-slow.astro'
];

for (const f of files) {
  if (!fs.existsSync(f)) { console.log('[NOT FOUND] ' + f); continue; }
  const src = fs.readFileSync(f, 'utf8');
  const m = src.match(/const\s+description\s*=\s*(["'`])([\s\S]*?)\1\s*;/);
  if (!m) { console.log('[NO MATCH] ' + f); continue; }
  const d = m[2];
  console.log('[' + d.length + '] ' + f);
  console.log('    ' + d);
}
