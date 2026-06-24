// scripts/wire-c2-w9.mjs
// Wave 9 — convert the text-only dark hero (`<section class="hero">…</section>`) of the
// commercial brand pages into the jackson-style full-bleed ServiceHero (MODE A picks up
// the deployed photo automatically). Same canonical end-state as wave 3-8 pages.
// Idempotent — skips pages already on ServiceHero (scotsman, rational → photo only).
//
// Per file: extract <h1> → title; in-hero <div class="crumb"> → eyebrow (parts minus
// Home/Brands, " · ") + standalone <nav class="crumbs"> when none exists; replace hero
// <section> with <ServiceHero …/>; add the import. subtitle = existing const description.
// logoSlug = longest brand-logo prefix match (or omitted → no logo overlay).
//
// Dry-run by default. Pass --write to apply.

import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const BRANDS_DIR = path.resolve('src/pages/brands');
const LOGO_DIR = path.resolve('public/brand-logos');

const SLUGS = [
  'hoshizaki','manitowoc','scotsman','follett-ice-machine-repair','kold-draft-ice-machine-repair',
  'kolpak-walk-in-repair','master-bilt-walk-in-repair','nor-lake-walk-in-repair','us-cooler-walk-in-repair',
  'huebsch-commercial-laundry-repair','milnor-commercial-laundry-repair','speed-queen-commercial-laundry-repair',
  'unimac-commercial-laundry-repair','wascomat-commercial-laundry-repair','whirlpool-commercial-laundry-repair',
  'gaylord-hood-repair','greenheck-hood-repair','halton-hood-repair','streivor-hood-repair','vent-master-hood-repair',
  'forno-bravo-pizza-oven-repair','lincoln-pizza-oven-repair','middleby-marshall-pizza-oven-repair','wood-stone-pizza-oven-repair',
  'rational','turbochef-rapid-cook-oven-repair','montague-oven-repair',
  'jackson-dishwasher-repair','meiko-dishwasher-repair','winterhalter-dishwasher-repair',
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
  if (src.includes('<ServiceHero')) { summary.push(`${slug.padEnd(44)} already ServiceHero — skip`); continue; }

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

  const lines = ['<ServiceHero', '  section="brands"', `  slug="${slug}"`];
  if (logo) lines.push(`  logoSlug="${logo}"`);
  if (eyebrow) lines.push(`  eyebrow={${JSON.stringify(eyebrow)}}`);
  lines.push(`  title={${JSON.stringify(title)}}`);
  lines.push('  subtitle={description}');
  lines.push(`  heroImageTitle={${JSON.stringify(title)}}`);
  lines.push('/>');
  let replacement = lines.join('\n  ');

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

  summary.push(`${slug.padEnd(44)} logo=${(logo || '—').padEnd(16)} crumb+=${!hadNavCrumbs && crumbInner ? 'yes' : 'no '}  eyebrow=${eyebrow || '—'}`);
  if (WRITE) fs.writeFileSync(file, out, 'utf8');
  ok++;
}

console.log(summary.join('\n'));
console.log(`\n${WRITE ? 'WROTE' : 'DRY-RUN'} ${ok}/${SLUGS.length} files (excl. already-ServiceHero skips).`);
if (problems.length) { console.error('\nPROBLEMS:\n' + problems.join('\n')); process.exit(1); }
