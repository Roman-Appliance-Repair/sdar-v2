// Generate placeholder brand pages (16 hubs + 79 details).
// Skips files that already exist to preserve real content.
// Run: node scripts/generate-brand-pages.mjs

import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = join(__dirname, '..', 'src', 'pages', 'brands');

// ─── Brand structure: slug → { name, categories } ───
const brands = {
  lg:         { name: 'LG',         categories: ['refrigerator','washer','dryer','dishwasher','range','microwave','freezer'] },
  samsung:    { name: 'Samsung',    categories: ['refrigerator','washer','dryer','dishwasher','range','microwave'] },
  ge:         { name: 'GE',         categories: ['refrigerator','range','dishwasher','dryer','washer','microwave','cooktop'] },
  whirlpool:  { name: 'Whirlpool',  categories: ['refrigerator','washer','dryer','dishwasher','range','cooktop','microwave'] },
  bosch:      { name: 'Bosch',      categories: ['dishwasher','washer','dryer','refrigerator','oven','cooktop'] },
  miele:      { name: 'Miele',      categories: ['dishwasher','washer','dryer'] },
  thermador:  { name: 'Thermador',  categories: ['range','oven','cooktop','refrigerator','dishwasher'] },
  viking:     { name: 'Viking',     categories: ['refrigerator','range','bbq-grill','oven','cooktop'] },
  wolf:       { name: 'Wolf',       categories: ['range','oven','cooktop'] },
  'sub-zero': { name: 'Sub-Zero',   categories: ['refrigerator','wine-cooler','ice-maker'] },
  kitchenaid: { name: 'KitchenAid', categories: ['refrigerator','dishwasher','oven','stand-mixer','cooktop'] },
  dacor:      { name: 'Dacor',      categories: [] }, // hub only, no detail pages listed
  jennair:    { name: 'JennAir',    categories: ['refrigerator','range','oven','cooktop','dishwasher','microwave'] },
  frigidaire: { name: 'Frigidaire', categories: ['refrigerator','freezer','dishwasher','range','washer','dryer','microwave'] },
  maytag:     { name: 'Maytag',     categories: ['washer','dryer','refrigerator','range','dishwasher','microwave'] },
  amana:      { name: 'Amana',      categories: ['refrigerator','laundry','range'] },
};

// Map category slug → display label
const catLabel = {
  refrigerator: 'Refrigerator',
  washer: 'Washer',
  dryer: 'Dryer',
  dishwasher: 'Dishwasher',
  range: 'Range',
  microwave: 'Microwave',
  freezer: 'Freezer',
  cooktop: 'Cooktop',
  oven: 'Oven',
  'bbq-grill': 'BBQ Grill',
  'wine-cooler': 'Wine Cooler',
  'ice-maker': 'Ice Maker',
  'stand-mixer': 'Stand Mixer',
  laundry: 'Laundry',
};

// Map category slug → /services/ URL slug. Some brands use different service-page names.
const serviceSlug = {
  refrigerator: 'refrigerator-repair',
  washer: 'washer-repair',
  dryer: 'dryer-repair',
  dishwasher: 'dishwasher-repair',
  range: 'stove-repair',
  microwave: 'microwave-repair',
  freezer: 'freezer-repair',
  cooktop: 'cooktop-repair',
  oven: 'oven-repair',
  'bbq-grill': 'bbq-grill-repair',
  'wine-cooler': 'wine-cooler-repair',
  'ice-maker': 'ice-maker-repair',
  'stand-mixer': 'stove-repair', // fallback — no stand mixer service page
  laundry: 'washer-repair',
};

function hubTemplate(slug, brand) {
  const { name, categories } = brand;
  const title = `${name} Appliance Repair Los Angeles | Same Day Service`;
  const categoriesList = categories.map(cat => {
    const label = catLabel[cat] || cat;
    return `  { label: "${label}", url: "/brands/${slug}-${cat}-repair/" }`;
  }).join(',\n');

  const catNames = categories.map(c => catLabel[c] || c).join(', ').toLowerCase();
  const description = categories.length
    ? `Expert ${name} appliance repair across LA, Orange, Ventura counties. All ${name} categories — ${catNames}. Call (424) 325-0520.`
    : `Expert ${name} appliance repair across Los Angeles, Orange, and Ventura counties. Same-day service, OEM parts. Call (424) 325-0520.`;

  return `---
import Layout from '../../layouts/Layout.astro';
import BrandHubPlaceholder from '../../components/BrandHubPlaceholder.astro';

const title = ${JSON.stringify(title)};
const description = ${JSON.stringify(description)};

const categories = [
${categoriesList}
];
---

<Layout title={title} description={description}>
  <BrandHubPlaceholder brandName=${JSON.stringify(name)} brandSlug=${JSON.stringify(slug)} categories={categories} />
</Layout>
`;
}

function detailTemplate(brandSlug, brand, categorySlugRaw) {
  const { name } = brand;
  const category = catLabel[categorySlugRaw] || categorySlugRaw;
  const categorySlug = serviceSlug[categorySlugRaw] || `${categorySlugRaw}-repair`;
  const hubUrl = `/brands/${brandSlug}/`;
  const title = `${name} ${category} Repair Los Angeles | Same Day Service`;
  const description = `Expert ${name} ${category.toLowerCase()} repair in Los Angeles. Same-day appointments, OEM parts, licensed technicians. Call (424) 325-0520.`;

  return `---
import Layout from '../../layouts/Layout.astro';
import BrandDetailPlaceholder from '../../components/BrandDetailPlaceholder.astro';

const title = ${JSON.stringify(title)};
const description = ${JSON.stringify(description)};
---

<Layout title={title} description={description}>
  <BrandDetailPlaceholder
    brandName=${JSON.stringify(name)}
    brandSlug=${JSON.stringify(brandSlug)}
    category=${JSON.stringify(category)}
    categorySlug=${JSON.stringify(categorySlug)}
    hubUrl=${JSON.stringify(hubUrl)}
  />
</Layout>
`;
}

// ─── Generate ───
if (!existsSync(PAGES_DIR)) mkdirSync(PAGES_DIR, { recursive: true });

const created = [];
const skipped = [];

for (const [slug, brand] of Object.entries(brands)) {
  // Hub page
  const hubPath = join(PAGES_DIR, `${slug}.astro`);
  if (existsSync(hubPath)) {
    skipped.push(`brands/${slug}.astro`);
  } else {
    writeFileSync(hubPath, hubTemplate(slug, brand), 'utf8');
    created.push(`brands/${slug}.astro`);
  }

  // Detail pages
  for (const cat of brand.categories) {
    const detailPath = join(PAGES_DIR, `${slug}-${cat}-repair.astro`);
    if (existsSync(detailPath)) {
      skipped.push(`brands/${slug}-${cat}-repair.astro`);
    } else {
      writeFileSync(detailPath, detailTemplate(slug, brand, cat), 'utf8');
      created.push(`brands/${slug}-${cat}-repair.astro`);
    }
  }
}

console.log(`\n✓ Created: ${created.length} files`);
created.forEach(f => console.log(`  + ${f}`));
console.log(`\n⚠ Skipped (already exist): ${skipped.length} files`);
skipped.forEach(f => console.log(`  · ${f}`));
console.log(`\nTotal target: ${created.length + skipped.length} files`);
