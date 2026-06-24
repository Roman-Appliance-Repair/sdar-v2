// scripts/wire-counties.mjs
// Make the 5 county-hub heroes full-bleed: inject a background <picture> + a left-dark
// gradient overlay into the existing custom `<section class="hero">`, preserving all
// existing hero content (eyebrow, h1, sub, CTAs, branch-zones). Idempotent.
import fs from 'node:fs';
import path from 'node:path';

const NAMES = {
  'los-angeles-county': 'Los Angeles County',
  'orange-county': 'Orange County',
  'riverside-county': 'Riverside County',
  'san-bernardino-county': 'San Bernardino County',
  'ventura-county': 'Ventura County',
};

const CSS_HERO_OLD = `.hero { background: #0a0a0a; color: #fff; padding: 80px 24px 72px; }`;
const CSS_HERO_NEW = `.hero { position: relative; overflow: hidden; background: #0a0a0a; color: #fff; padding: 80px 24px 72px; }
    .hero-bg { position: absolute; inset: 0; z-index: 0; }
    .hero-bg img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hero-overlay { position: absolute; inset: 0; z-index: 1; background: linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.82) 38%, rgba(10,10,10,0.5) 70%, rgba(10,10,10,0.28) 100%); }`;

const CSS_INNER_OLD = `.hero-inner { max-width: 1100px; margin: 0 auto; }`;
const CSS_INNER_NEW = `.hero-inner { position: relative; z-index: 2; max-width: 1100px; margin: 0 auto; }`;

const MARKUP_RE = /<section class="hero">(\r?\n)\s*<div class="hero-inner">/;
const markupNew = (slug, name, nl) => `<section class="hero">${nl}  <picture class="hero-bg">${nl}    <source media="(max-width: 640px)" srcset="/images/counties/${slug}/hero-640.webp" type="image/webp" />${nl}    <source media="(max-width: 960px)" srcset="/images/counties/${slug}/hero-960.webp" type="image/webp" />${nl}    <source srcset="/images/counties/${slug}/hero.webp" type="image/webp" />${nl}    <img src="/images/counties/${slug}/hero.jpg" alt="Appliance repair across ${name}, California" width="1920" height="840" loading="eager" fetchpriority="high" />${nl}  </picture>${nl}  <div class="hero-overlay"></div>${nl}  <div class="hero-inner">`;

let ok = 0;
for (const [slug, name] of Object.entries(NAMES)) {
  const fp = path.resolve('src/pages', `${slug}.astro`);
  let s = fs.readFileSync(fp, 'utf8');
  if (s.includes('hero-bg')) { console.log(`• ${slug} already wired`); ok++; continue; }
  const m = s.match(MARKUP_RE);
  if (!s.includes(CSS_HERO_OLD) || !s.includes(CSS_INNER_OLD) || !m) {
    console.error(`✗ ${slug}: anchor missing (cssHero=${s.includes(CSS_HERO_OLD)} cssInner=${s.includes(CSS_INNER_OLD)} markup=${!!m})`); process.exit(1);
  }
  const nl = m[1];
  s = s.replace(CSS_HERO_OLD, CSS_HERO_NEW)
       .replace(CSS_INNER_OLD, CSS_INNER_NEW)
       .replace(MARKUP_RE, markupNew(slug, name, nl));
  fs.writeFileSync(fp, s);
  console.log(`✓ wired ${slug}`);
  ok++;
}
console.log(`\n=== WIRE COUNTIES: ${ok}/${Object.keys(NAMES).length} ===`);
