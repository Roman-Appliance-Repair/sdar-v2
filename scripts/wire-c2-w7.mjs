// scripts/wire-c2-w7.mjs
// Wave 7 — convert the text-only dark hero (`<section class="hero">…</section>`)
// of 27 brand pages into the jackson-style full-bleed ServiceHero (MODE A picks up
// the deployed photo automatically). Same canonical end-state as wave 3-6 pages
// (e.g. maytag-refrigerator-repair): ServiceHero call + a standalone
// `<nav class="crumbs">` breadcrumb + the page's existing `.trust-bar` section kept.
//
// Per file (idempotent — skips pages already on ServiceHero, e.g. pitco/frymaster):
//   1. extract <h1> text  → title  (and heroImageTitle)
//   2. extract in-hero <div class="crumb"> → eyebrow (parts minus Home/Brands, " · ")
//   3. replace the whole hero <section> with the <ServiceHero …/> call
//   4. if the page had NO standalone <nav class="crumbs">, add one (verbatim crumb)
//   5. add `import ServiceHero …` after the Layout import
//      subtitle is the existing `const description` (robust: ledes carry JSX/escapes)
//      logoSlug = longest brand-logo prefix match (or omitted → no logo overlay)
// Old `.hero/.crumb/.lede` CSS is left inert (varies per page; `.wrap` is shared).
//
// Dry-run by default. Pass --write to apply.

import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const BRANDS_DIR = path.resolve('src/pages/brands');
const LOGO_DIR = path.resolve('public/brand-logos');

const SLUGS = [
  'fulgor-milano-dishwasher-repair','fulgor-milano-range-hood-repair','fulgor-milano-refrigerator-repair',
  'fulgor-milano-stove-repair','fulgor-milano-wall-oven-repair',
  'hestan-dishwasher-repair','hestan-range-hood-repair','hestan-refrigerator-repair','hestan-stove-repair','hestan-wall-oven-repair',
  'haier','haier-oven-repair','haier-refrigerator-repair','haier-washer-repair',
  'kenmore','kenmore-oven-repair',
  'sharp','sharp-microwave-repair','panasonic-microwave-repair',
  'vulcan','vulcan-fryer-repair','vulcan-oven-repair','vulcan-range-repair','garland-range-repair',
  'pitco-fryer-repair','henny-penny-fryer-repair','southbend-oven-repair',
];

const LOGOS = fs.readdirSync(LOGO_DIR).filter(f => f.endsWith('.webp'))
  .map(f => f.replace(/\.webp$/, '')).sort((a, b) => b.length - a.length);
function brandLogoFor(slug) {
  for (const L of LOGOS) { if (slug === L || slug.startsWith(L + '-')) return L; }
  return null;
}

const stripTags = (s) => s.replace(/<[^>]*>/g, '');
const decodeEntities = (s) => s
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const collapse = (s) => decodeEntities(s.replace(/\s+/g, ' ')).trim();

function eyebrowFromCrumb(crumbInner) {
  const txt = collapse(stripTags(crumbInner));
  const parts = txt.split('›').map(s => s.trim()).filter(Boolean)
    .filter(p => !/^home$/i.test(p) && !/^brands$/i.test(p));
  return parts.length ? parts.join(' · ') : null;
}

let ok = 0; const problems = []; const summary = [];
for (const slug of SLUGS) {
  const file = path.join(BRANDS_DIR, `${slug}.astro`);
  if (!fs.existsSync(file)) { problems.push(`${slug}: MISSING`); continue; }
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes('<ServiceHero')) { summary.push(`${slug.padEnd(40)} already ServiceHero — skip`); continue; }

  const hStart = src.indexOf('<section class="hero"');
  if (hStart === -1) { problems.push(`${slug}: no hero open`); continue; }
  const hEnd = src.indexOf('</section>', hStart);
  if (hEnd === -1) { problems.push(`${slug}: no hero close`); continue; }
  const heroBlock = src.slice(hStart, hEnd + '</section>'.length);

  const h1m = heroBlock.match(/<h1>([\s\S]*?)<\/h1>/);
  if (!h1m) { problems.push(`${slug}: no <h1> in hero`); continue; }
  const title = collapse(stripTags(h1m[1]));
  if (!title) { problems.push(`${slug}: empty h1`); continue; }

  if (!/\bconst description\s*=/.test(src)) { problems.push(`${slug}: no const description`); continue; }

  const crumbM = heroBlock.match(/<div class="crumb">([\s\S]*?)<\/div>/);
  const crumbInner = crumbM ? crumbM[1].trim() : null;
  const eyebrow = crumbInner ? eyebrowFromCrumb(crumbInner) : null;
  const logo = brandLogoFor(slug);
  const hadNavCrumbs = /<nav class="crumbs"/.test(src);

  // --- build ServiceHero call ---
  const lines = ['<ServiceHero', '  section="brands"', `  slug="${slug}"`];
  if (logo) lines.push(`  logoSlug="${logo}"`);
  if (eyebrow) lines.push(`  eyebrow={${JSON.stringify(eyebrow)}}`);
  lines.push(`  title={${JSON.stringify(title)}}`);
  lines.push('  subtitle={description}');
  lines.push(`  heroImageTitle={${JSON.stringify(title)}}`);
  lines.push('/>');
  let replacement = lines.join('\n  ');

  // --- add a standalone breadcrumb if the page lacked one ---
  if (!hadNavCrumbs && crumbInner) {
    replacement += `\n\n  <nav class="crumbs" aria-label="Breadcrumb">${crumbInner}</nav>`;
  }

  let out = src.slice(0, hStart) + replacement + src.slice(hEnd + '</section>'.length);

  if (!/import ServiceHero /.test(out)) {
    out = out.replace(
      /(import Layout from '\.\.\/\.\.\/layouts\/Layout\.astro';\r?\n)/,
      `$1import ServiceHero from '../../components/ServiceHero.astro';\n`
    );
    if (!/import ServiceHero /.test(out)) { problems.push(`${slug}: could not add import`); continue; }
  }

  if (out.includes('<section class="hero"')) { problems.push(`${slug}: hero section still present`); continue; }
  if (!out.includes('<ServiceHero')) { problems.push(`${slug}: ServiceHero missing`); continue; }

  summary.push(`${slug.padEnd(40)} logo=${(logo || '—').padEnd(12)} crumb+=${!hadNavCrumbs && crumbInner ? 'yes' : 'no '}  eyebrow=${eyebrow || '—'}`);
  if (WRITE) fs.writeFileSync(file, out, 'utf8');
  ok++;
}

console.log(summary.join('\n'));
console.log(`\n${WRITE ? 'WROTE' : 'DRY-RUN'} ${ok}/${SLUGS.length} files (excl. already-ServiceHero skips).`);
if (problems.length) { console.error('\nPROBLEMS:\n' + problems.join('\n')); process.exit(1); }
