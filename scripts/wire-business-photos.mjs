// scripts/wire-business-photos.mjs
// Full-bleed photo wiring for the 5 uniform /for-business/ segment pages.
// Adds bg <picture> + dark overlay to `.hero`, hides `.hero-badge-grid`, single-col inner.
// White H1 comes from the global `.hero:has(.hero-bg) h1` rule. Idempotent.
// Usage: node scripts/wire-business-photos.mjs <slug ...>

import fs from 'node:fs';

const ALT = {
  'bars-nightclubs': 'Bar and nightclub appliance repair in Los Angeles',
  hotels: 'Hotel and hospitality appliance repair in Los Angeles',
  'property-management': 'Appliance repair for Los Angeles property managers',
  'airbnb-short-term-rentals': 'Airbnb and short-term rental appliance repair in Los Angeles',
  'retail-grocery': 'Commercial refrigeration repair for Los Angeles retail and grocery',
};

const HERO_OLD = '.hero { background: var(--black); color: #fff; padding: 80px 24px 72px; }';
const HERO_NEW = `.hero { position: relative; overflow: hidden; background: var(--black); color: #fff; padding: 80px 24px 72px; min-height: 460px; display: flex; align-items: center; }
    .hero-bg { position: absolute; inset: 0; z-index: 0; }
    .hero-bg picture, .hero-bg img { width: 100%; height: 100%; object-fit: cover; object-position: 70% center; display: block; }
    .hero-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(100deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.88) 30%, rgba(10,10,10,0.58) 60%, rgba(10,10,10,0.25) 100%); }`;

const INNER_OLD = '.hero-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }';
const INNER_NEW = `.hero-inner { position: relative; z-index: 2; max-width: 1100px; width: 100%; margin: 0 auto; }
    .hero-inner > div:first-child { max-width: 600px; }
    .hero-badge-grid { display: none; }`;

const MARKUP_OLD = `<section class="hero">
  <div class="hero-inner">`;
const bg = (slug) => `<section class="hero">
  <div class="hero-bg">
    <picture>
      <source media="(max-width: 640px)" type="image/webp" srcset="/images/for-business/${slug}/hero-640.webp" />
      <source media="(max-width: 640px)" type="image/jpeg" srcset="/images/for-business/${slug}/hero-640.jpg" />
      <source media="(max-width: 960px)" type="image/webp" srcset="/images/for-business/${slug}/hero-960.webp" />
      <source media="(max-width: 960px)" type="image/jpeg" srcset="/images/for-business/${slug}/hero-960.jpg" />
      <source type="image/webp" srcset="/images/for-business/${slug}/hero.webp" />
      <img src="/images/for-business/${slug}/hero.jpg" alt="${ALT[slug]}" width="1920" height="840" loading="eager" fetchpriority="high" />
    </picture>
    <div class="hero-overlay"></div>
  </div>
  <div class="hero-inner">`;

let wired = 0, failed = 0;
for (const slug of process.argv.slice(2)) {
  const file = `src/pages/for-business/${slug}.astro`;
  if (!fs.existsSync(file)) { console.error(`MISSING: ${file}`); failed++; continue; }
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('hero-bg')) { console.log(`skip (wired): ${slug}`); continue; }
  if (!ALT[slug]) { console.error(`no ALT for: ${slug}`); failed++; continue; }
  if (!s.includes(MARKUP_OLD) || !s.includes(HERO_OLD) || !s.includes(INNER_OLD)) {
    console.error(`pattern mismatch: ${slug}`); failed++; continue;
  }
  s = s.replace(MARKUP_OLD, bg(slug)).replace(HERO_OLD, HERO_NEW).replace(INNER_OLD, INNER_NEW);
  fs.writeFileSync(file, s);
  console.log(`wired: ${slug}`);
  wired++;
}
console.log(`\n=== wired ${wired}, failed ${failed} ===`);
if (failed) process.exit(1);
