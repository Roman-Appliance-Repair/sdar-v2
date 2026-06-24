// scripts/wire-logoslug.mjs
// Group 1 — pages that HAVE a photo + ServiceHero but render NO logo because logoSlug
// is not set. Add logoSlug pointing at the existing brand-logo file.
//   B-3 (file name prefix-matches slug)  -> logoSlug = brandLogoFor(slug)
//   B-2 (file under a non-matching name) -> explicit VARIANT map
// Pages whose brand logo does NOT exist on disk (B-1, must be drawn) are SKIPPED.
//
// Dry-run by default. Pass --write to apply.

import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const BRANDS = path.resolve('src/pages/brands');
const IMG = path.resolve('public/images/brands');
const LOGODIR = path.resolve('public/brand-logos');

const LOGOS = fs.readdirSync(LOGODIR).filter(f => f.endsWith('.webp'))
  .map(f => f.replace(/\.webp$/, '')).sort((a, b) => b.length - a.length);
function brandLogoFor(slug) { for (const L of LOGOS) { if (slug === L || slug.startsWith(L + '-')) return L; } return null; }

// B-2 — logo file exists under a non-prefix-matching name
const VARIANT = {
  'ge': 'ge-general-electric',
  'ge-cooktop-repair': 'ge-general-electric',
  'ge-dishwasher-repair': 'ge-general-electric',
  'ge-dryer-repair': 'ge-general-electric',
  'ge-washer-repair': 'ge-general-electric',
  'ge-cafe': 'cafe',
  'true': 'true-refrigeration',
  'middleby-marshall-pizza-oven-repair': 'middleby-marshalls',
  'us-cooler-walk-in-repair': 'u.s-cooler',
  'la-cornue-range-hood-repair': 'la-cornue',          // hyphen copy created by fix-logo-alpha.mjs
  'adc-commercial-dryer-repair': 'american-dryer-corporation',
};

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let ok = 0; const skippedB1 = []; const alreadyRenders = []; const problems = []; const done = [];
for (const f of fs.readdirSync(BRANDS).filter(x => x.endsWith('.astro'))) {
  const slug = f.replace(/\.astro$/, '');
  if (!fs.existsSync(path.join(IMG, slug, 'hero.webp'))) continue;        // photo only
  const file = path.join(BRANDS, f);
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('<ServiceHero')) continue;
  if (/logoSlug="/.test(src)) continue;                                   // already wired (explicit)
  // logo already renders via slug-auto (file named exactly like the slug, e.g. pillars wolf/lg/miele) — leave it
  if (fs.existsSync(path.join(LOGODIR, `${slug}.webp`))) { alreadyRenders.push(slug); continue; }

  let logoSlug = VARIANT[slug] || brandLogoFor(slug);
  if (!logoSlug) { skippedB1.push(slug); continue; }                      // B-1 → draw later

  if (!fs.existsSync(path.join(LOGODIR, `${logoSlug}.webp`))) { problems.push(`${slug}: target logo ${logoSlug}.webp missing`); continue; }

  // operate within the <ServiceHero ... /> block only
  const start = src.indexOf('<ServiceHero');
  const end = src.indexOf('/>', start);
  if (start === -1 || end === -1) { problems.push(`${slug}: ServiceHero block not found`); continue; }
  let block = src.slice(start, end);

  const adds = [];
  const hasSlug = /\bslug="/.test(block);
  const hasImg = /\bimage(Webp)?=/.test(block);
  // pages with neither slug nor explicit image render MODE B (no photo) — give them slug so the
  // on-disk photo + the gold logo both show.
  if (!hasSlug && !hasImg) adds.push(`slug="${slug}"`);
  if (!/section="brands"/.test(block)) adds.push('section="brands"');
  adds.push(`logoSlug="${logoSlug}"`);

  const indMatch = block.match(/\n([ \t]+)\S/);
  const ind = indMatch ? indMatch[1] : '  ';
  const insertion = adds.map(a => '\n' + ind + a).join('');
  const newBlock = block.replace('<ServiceHero', '<ServiceHero' + insertion);
  const out = src.slice(0, start) + newBlock + src.slice(end);
  if (out === src) { problems.push(`${slug}: no change`); continue; }

  if (WRITE) fs.writeFileSync(file, out, 'utf8');
  done.push(`${slug.padEnd(46)} +[${adds.join(' ')}]`);
  ok++;
}

console.log(done.join('\n'));
console.log(`\n${WRITE ? 'WROTE' : 'DRY-RUN'} ${ok} pages wired.`);
console.log(`skipped (logo already renders via slug-auto): ${alreadyRenders.length}`);
console.log(`skipped B-1 (no logo on disk, draw later): ${skippedB1.length}`);
if (problems.length) { console.error('\nPROBLEMS:\n' + problems.join('\n')); process.exit(1); }
