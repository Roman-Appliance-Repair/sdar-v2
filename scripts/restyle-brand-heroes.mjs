// scripts/restyle-brand-heroes.mjs
// Convert the 70 "square photo beside text" brand pages (inline .hero-split)
// to the jackson-style full-bleed ServiceHero component.
//
// Per file:
//   1. add `import ServiceHero ...` after the Layout import (idempotent).
//   2. replace the whole `<section class="hero">…</section>` block with a
//      <ServiceHero section="brands" slug=… logoSlug=… eyebrow=… title=…
//      subtitle={description} heroImageTitle=… /> call.
//        - title       = the page <h1> text (verified: 0 JSX in any h1)
//        - subtitle    = reference to the existing `description` const (robust:
//                        avoids re-escaping ledes, 6 of which contain JSX)
//        - eyebrow     = crumb trail minus Home/Brands, joined " · "
//        - logoSlug    = longest brand-logo prefix match (or omitted → no logo)
//   3. delete the uniform split-CSS snippet from the page <style>.
// Base dark-hero rules (.hero/.lede/.crumb/.hero-cta/.hero-facts) are left in
// place — after the markup is gone they match nothing (inert), and their
// formatting varies (some crammed one-liners) so surgical removal is unsafe.
//
// Dry-run by default. Pass --write to apply. Pass --one=<slug> to limit.

import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const ONE = (process.argv.find(a => a.startsWith('--one=')) || '').split('=')[1] || null;

const BRANDS_DIR = path.resolve('src/pages/brands');
const LOGO_DIR = path.resolve('public/brand-logos');

// Available brand logos (basename without .webp), longest first for prefix match.
const LOGOS = fs.readdirSync(LOGO_DIR)
  .filter(f => f.endsWith('.webp'))
  .map(f => f.replace(/\.webp$/, ''))
  .sort((a, b) => b.length - a.length);

function brandLogoFor(slug) {
  for (const L of LOGOS) {
    if (slug === L || slug.startsWith(L + '-')) return L;
  }
  return null;
}

const stripTags = (s) => s.replace(/<[^>]*>/g, '');
const decodeEntities = (s) => s
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const collapse = (s) => decodeEntities(s.replace(/\s+/g, ' ')).trim();

function eyebrowFromCrumb(heroBlock) {
  const m = heroBlock.match(/<div class="crumb">([\s\S]*?)<\/div>/);
  if (!m) return null;
  const txt = collapse(stripTags(m[1].replace(/›/g, '›')));
  const parts = txt.split('›').map(s => s.trim()).filter(Boolean)
    .filter(p => !/^home$/i.test(p) && !/^brands$/i.test(p));
  return parts.length ? parts.join(' · ') : null;
}

const files = ONE
  ? [path.join(BRANDS_DIR, `${ONE}.astro`)]
  : fs.readdirSync(BRANDS_DIR).filter(f => f.endsWith('.astro')).map(f => path.join(BRANDS_DIR, f))
      .filter(f => fs.readFileSync(f, 'utf8').includes('hero-split'));

const SPLIT_CSS_RE = /\r?\n[^\n]*\/\* C2 wave 2 — split hero[^\n]*\r?\n(?:[^\n]*\.hero-split[^\n]*\r?\n?)*/g;
// Fallback removals for split rules regardless of comment presence:
const SPLIT_LINE_RES = [
  /\r?\n[ \t]*\.hero-split \{ display: grid;[^\n]*\}/g,
  /\r?\n[ \t]*\.hero-split-img \{ aspect-ratio:[^\n]*\}/g,
  /\r?\n[ \t]*\.hero-split-img img \{[^\n]*\}/g,
  /\r?\n[ \t]*@media \(max-width: 768px\) \{ \.hero-split \{[^\n]*\}/g,
  /\r?\n[ \t]*\/\* C2 wave 2 — split hero[^\n]*\*\//g,
];

let ok = 0; const problems = []; const summary = [];
for (const file of files) {
  const slug = path.basename(file, '.astro');
  let src = fs.readFileSync(file, 'utf8');

  // --- locate hero block ---
  const hStart = src.indexOf('<section class="hero">');
  if (hStart === -1) { problems.push(`${slug}: no hero open`); continue; }
  const hEnd = src.indexOf('</section>', hStart);
  if (hEnd === -1) { problems.push(`${slug}: no hero close`); continue; }
  const heroBlock = src.slice(hStart, hEnd + '</section>'.length);

  // --- extract title (h1) ---
  const h1m = heroBlock.match(/<h1>([\s\S]*?)<\/h1>/);
  if (!h1m) { problems.push(`${slug}: no <h1>`); continue; }
  const title = collapse(stripTags(h1m[1]));
  if (!title) { problems.push(`${slug}: empty h1`); continue; }

  // --- description const must exist (used as subtitle) ---
  if (!/\bconst description\s*=/.test(src)) { problems.push(`${slug}: no const description`); continue; }

  const eyebrow = eyebrowFromCrumb(heroBlock);
  const logo = brandLogoFor(slug);

  // --- build ServiceHero call ---
  const lines = ['<ServiceHero', '  section="brands"', `  slug="${slug}"`];
  if (logo) lines.push(`  logoSlug="${logo}"`);
  if (eyebrow) lines.push(`  eyebrow={${JSON.stringify(eyebrow)}}`);
  lines.push(`  title={${JSON.stringify(title)}}`);
  lines.push('  subtitle={description}');
  lines.push(`  heroImageTitle={${JSON.stringify(title)}}`);
  lines.push('/>');
  const heroCall = lines.join('\n  ');

  let out = src.slice(0, hStart) + heroCall + src.slice(hEnd + '</section>'.length);

  // --- add import (idempotent) ---
  if (!/import ServiceHero /.test(out)) {
    out = out.replace(
      /(import Layout from '\.\.\/\.\.\/layouts\/Layout\.astro';\r?\n)/,
      `$1import ServiceHero from '../../components/ServiceHero.astro';\r\n`
    );
    if (!/import ServiceHero /.test(out)) { problems.push(`${slug}: could not add import`); continue; }
  }

  // --- strip split CSS ---
  const before = out;
  out = out.replace(SPLIT_CSS_RE, '');
  for (const re of SPLIT_LINE_RES) out = out.replace(re, '');
  const cssStripped = before !== out;

  // --- validations ---
  if (out.includes('hero-split')) { problems.push(`${slug}: hero-split still present after strip`); continue; }
  if ((out.match(/<h1>/g) || []).length > 0 && (out.match(/<h1>/g) || []).length !== 0) {
    // page h1 was only in hero; after removal expect 0 literal <h1> tags in template
  }
  if (!out.includes('<ServiceHero')) { problems.push(`${slug}: ServiceHero call missing`); continue; }

  summary.push(`${slug.padEnd(44)} logo=${logo || '—'}  eyebrow=${eyebrow || '—'}`);
  if (WRITE) fs.writeFileSync(file, out, 'utf8');
  ok++;
}

console.log(summary.join('\n'));
console.log(`\n${WRITE ? 'WROTE' : 'DRY-RUN'} ${ok}/${files.length} files.`);
const withLogo = summary.filter(s => !/logo=—/.test(s)).length;
console.log(`with brand logo: ${withLogo} · without logo: ${ok - withLogo}`);
if (problems.length) { console.error('\nPROBLEMS:\n' + problems.join('\n')); process.exit(1); }
