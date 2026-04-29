#!/usr/bin/env node
/**
 * sweep-brand-pattern-b.mjs
 *
 * T-BRANDS Day 6 Step D — migrate 294 Pattern B brand pages to BrandBranchesGrid
 * (P1-4, P1-6 from wiki/audits/brands-audit-2026-04-28.md).
 *
 * Pattern B canonical structure (290 of 294 files have BOTH blocks; 4 commercial
 * hubs have only the hero-aside block):
 *
 *   <section class="hero"><div class="wrap"><div class="hero-grid"><div class="hero-text">
 *     ... hero content (crumb, h1, lede, hero-cta, hero-facts) ...
 *   </div><aside class="hero-aside"><div class="aside-card"><h3>Talk to a local branch</h3>
 *     <a class="branch"> ×5
 *   </div></aside></div></div></section>
 *
 *   ... body content (FAQ, technical, service-areas, etc.) ...
 *
 *   <section id="book" class="cta-bottom"><div class="wrap">
 *     <h2>{Brand} {category} service?...</h2>      ← brand-specific, KEEP
 *     <p>Same-day appliance repair...</p>          ← templated, KEEP
 *     <div class="branches"> <a tel:> ×5 </div>    ← DELETE
 *   </div></section>
 *
 * Architectural transformation (Option γ per Roman 2026-04-29):
 *   1. Hero changes from 2-column (text + branches sidebar) to 1-column full-width
 *      → Delete hero-grid wrapper + hero-text wrapper + entire hero-aside block
 *   2. <BrandBranchesGrid /> inserts as new section between hero and body
 *   3. Bottom <div class="branches"> deleted (the brand H2 + intro paragraph KEPT)
 *
 * Phone surfaces refactored (3 standalone per file):
 *   - call-banner (1)  hardcoded → MAIN_PHONE_TEL
 *   - Hero CTA (1)     hardcoded → MAIN_PHONE_TEL
 *   - Float-call (1)   hardcoded → MAIN_PHONE_TEL
 *   - 5 hero-aside anchors deleted with aside
 *   - 5 bottom anchors deleted with branches div
 *
 * Dead CSS rules removed: 10 per file (.branch family + .hero-aside family
 * + .hero-grid + .cta-bottom .branches family).
 *
 * NOT TOUCHED:
 *   - Bottom CTA <h2> brand-specific question (PRESERVED)
 *   - Bottom CTA <p> templated intro (PRESERVED)
 *   - Service Areas section with city neighborhood lists (PRESERVED)
 *   - Body content (FAQ, technical, recent repairs) (PRESERVED)
 *   - Title / H1 / description (Day 5 cleanup intact)
 *   - JSON-LD schema (Day 3 cleanup intact)
 *   - Internal links to /los-angeles/ etc.
 *
 * Default: DRY-RUN. Pass --apply to write.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BRANDS = path.join(ROOT, 'src', 'pages', 'brands');
const APPLY = process.argv.includes('--apply');
const SHOW_DIFF_FOR = process.argv
  .filter((a) => a.startsWith('--diff='))
  .map((a) => a.slice('--diff='.length));

// ─── File enumeration (only Pattern B files) ────────────────────────────────

const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) allFiles.push(full);
  }
}
walk(BRANDS);

// Pattern B = files containing literal `class="branch">`  (anchor pattern)
const files = allFiles.filter((f) => {
  const c = fs.readFileSync(f, 'utf8');
  return /class="branch">/.test(c) && /class="hero-aside"/.test(c);
});

// ─── Import insertion ───────────────────────────────────────────────────────

function addImports(content, file) {
  if (/from ['"]\.\.\/\.\.\/components\/BrandBranchesGrid\.astro['"]/.test(content)) {
    return { content, added: 0 };
  }
  const layoutImportRe = /^(import Layout from ['"]\.\.\/\.\.\/layouts\/Layout\.astro['"];?)$/m;
  const m = content.match(layoutImportRe);
  if (!m) {
    return { content, added: 0, error: `no Layout import found in ${path.relative(ROOT, file)}` };
  }
  const newImports =
    m[0] +
    "\nimport BrandBranchesGrid from '../../components/BrandBranchesGrid.astro';" +
    "\nimport { MAIN_PHONE, MAIN_PHONE_TEL } from '../../data/branches';";
  return { content: content.replace(layoutImportRe, newImports), added: 2 };
}

// ─── Hero restructuring + aside deletion + BrandBranchesGrid insert ─────────

/**
 * Match the entire <section class="hero">...</section> block (non-greedy to
 * stop at the first </section>). Inside, capture the inner content of
 * <div class="hero-text">...</div> (the left column) and discard the rest
 * (hero-grid wrapper, hero-aside, all closing divs).
 *
 * Replace with a single-column hero containing only the hero-text content,
 * and append <BrandBranchesGrid /> as a new section.
 */
const HERO_RE = /<section class="hero">([\s\S]*?)<\/section>/;

function transformHero(content) {
  const m = content.match(HERO_RE);
  if (!m) return { content, changed: 0 };
  const heroInner = m[1];

  // Extract the hero-text inner content (between <div class="hero-text"> and the
  // closing </div> that's followed by <aside class="hero-aside">)
  const textRe = /<div class="hero-text">([\s\S]*?)<\/div>\s*<aside class="hero-aside"/;
  const textMatch = heroInner.match(textRe);
  if (!textMatch) return { content, changed: 0 };

  const heroTextContent = textMatch[1];

  // Build the new hero — single column, plus <BrandBranchesGrid /> below
  const newHero =
    `<section class="hero"><div class="wrap">${heroTextContent}</div></section>\n\n` +
    `  <BrandBranchesGrid />`;

  return {
    content: content.replace(m[0], newHero),
    changed: 1,
  };
}

// ─── Bottom branches block deletion ─────────────────────────────────────────

/**
 * Inside <section id="book" class="cta-bottom">, delete the
 * <div class="branches">...</div> block. The H2 + intro paragraph that
 * precede it are PRESERVED.
 */
const BOTTOM_RE = /\s*<div class="branches">[\s\S]*?<\/div>/;

function deleteBottomBlock(content) {
  if (!BOTTOM_RE.test(content)) return { content, deleted: 0 };
  return {
    content: content.replace(BOTTOM_RE, ''),
    deleted: 1,
  };
}

// ─── Standalone phone CTA refactor ──────────────────────────────────────────

function replacePhones(content) {
  let count = 0;
  // tel: hrefs
  content = content.replace(/href="tel:\+14243250520"/g, () => {
    count++;
    return 'href={`tel:${MAIN_PHONE_TEL}`}';
  });
  // Display phone variants — anchored by > and < boundaries so frontmatter
  // string-literal phone references are NOT affected.
  content = content.replace(/>☎ Call \(424\) 325-0520</g, () => { count++; return '>☎ Call {MAIN_PHONE}<'; });
  content = content.replace(/>Call \(424\) 325-0520</g, () => { count++; return '>Call {MAIN_PHONE}<'; });
  content = content.replace(/>☎ \(424\) 325-0520</g, () => { count++; return '>☎ {MAIN_PHONE}<'; });
  content = content.replace(/>\(424\) 325-0520</g, () => { count++; return '>{MAIN_PHONE}<'; });
  return { content, count };
}

// ─── Dead CSS removal ───────────────────────────────────────────────────────

const DEAD_SELECTORS = [
  // Most specific first to avoid ambiguity.
  '.cta-bottom .branches a span',
  '.cta-bottom .branches a',
  '.cta-bottom .branches',
  '.hero-aside .aside-card',
  '.hero-aside h3',
  '.hero-aside',
  '.hero-grid',
  '.branch:first-of-type',
  '.branch b',
  '.branch span',
  '.branch',
];

function escapeForCss(sel) {
  // Escape regex specials, normalize whitespace.
  return sel.replace(/[.+*?^$(){}|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function removeDeadCss(content) {
  // Safety: only remove CSS if the markup classes are no longer present
  // (post hero/aside/bottom deletion).
  const stillUsed = /class="(?:branch|branches|hero-aside|aside-card|hero-grid|hero-text)"/.test(content);
  if (stillUsed) return { content, removed: 0 };

  let removed = 0;
  for (const sel of DEAD_SELECTORS) {
    const escaped = escapeForCss(sel);
    // Match the rule even when packed on a shared line: `.x { ... } .y { ... }`
    // We strip only the rule portion plus optional surrounding whitespace.
    const re = new RegExp(`\\s*${escaped}\\s*\\{[^{}]*\\}`, 'g');
    content = content.replace(re, () => {
      removed++;
      return '';
    });
  }
  // Cleanup: collapse 3-or-more consecutive blank lines to 2 (or whatever
  // happens after CSS rule removal) — keep readable.
  content = content.replace(/\n{3,}/g, '\n\n');
  return { content, removed };
}

// ─── File processing ────────────────────────────────────────────────────────

function processOne(file) {
  const orig = fs.readFileSync(file, 'utf8');
  let content = orig;

  const importRes = addImports(content, file);
  content = importRes.content;

  const heroRes = transformHero(content);
  content = heroRes.content;

  const bottomRes = deleteBottomBlock(content);
  content = bottomRes.content;

  const phoneRes = replacePhones(content);
  content = phoneRes.content;

  const cssRes = removeDeadCss(content);
  content = cssRes.content;

  return {
    file,
    orig,
    content,
    counts: {
      imports: importRes.added,
      hero: heroRes.changed,
      bottom: bottomRes.deleted,
      phones: phoneRes.count,
      css: cssRes.removed,
    },
    diff: orig !== content,
    importError: importRes.error,
  };
}

// ─── Diff helper ────────────────────────────────────────────────────────────

function makeMiniDiff(orig, modified, file) {
  const oArr = orig.split('\n');
  const mArr = modified.split('\n');
  let head = 0;
  while (head < oArr.length && head < mArr.length && oArr[head] === mArr[head]) head++;
  let tailO = oArr.length - 1;
  let tailM = mArr.length - 1;
  while (tailO >= head && tailM >= head && oArr[tailO] === mArr[tailM]) {
    tailO--;
    tailM--;
  }
  const ctxStart = Math.max(0, head - 2);
  const ctxOEnd = Math.min(oArr.length - 1, tailO + 2);
  const ctxMEnd = Math.min(mArr.length - 1, tailM + 2);

  const lines = [];
  lines.push(`--- ${file} (before)  lines ${ctxStart + 1}..${ctxOEnd + 1}`);
  for (let k = ctxStart; k <= ctxOEnd; k++) {
    const tag = k >= head && k <= tailO ? '-' : ' ';
    lines.push(`${tag} ${oArr[k]}`);
  }
  lines.push(`+++ ${file} (after)   lines ${ctxStart + 1}..${ctxMEnd + 1}`);
  for (let k = ctxStart; k <= ctxMEnd; k++) {
    const tag = k >= head && k <= tailM ? '+' : ' ';
    lines.push(`${tag} ${mArr[k]}`);
  }
  return lines.join('\n');
}

// ─── Main ───────────────────────────────────────────────────────────────────

const stats = {
  scanned: 0,
  wouldChange: 0,
  importErrors: [],
  heroErrors: [],
  totals: { imports: 0, hero: 0, bottom: 0, phones: 0, css: 0 },
};

const fileResults = new Map();
for (const file of files) {
  stats.scanned++;
  const r = processOne(file);
  fileResults.set(file, r);
  if (r.importError) {
    stats.importErrors.push({ file: path.relative(ROOT, file), error: r.importError });
  }
  if (r.counts.hero === 0) {
    stats.heroErrors.push(path.relative(ROOT, file));
  }
  if (r.diff) {
    stats.wouldChange++;
    stats.totals.imports += r.counts.imports;
    stats.totals.hero += r.counts.hero;
    stats.totals.bottom += r.counts.bottom;
    stats.totals.phones += r.counts.phones;
    stats.totals.css += r.counts.css;
    if (APPLY) fs.writeFileSync(file, r.content);
  }
}

// ─── Sample diffs ───────────────────────────────────────────────────────────

const SAMPLE_FILES = [
  'src/pages/brands/amana-dishwasher-repair.astro',
  'src/pages/brands/lg-refrigerator-repair.astro',
  'src/pages/brands/ge-refrigerator-repair.astro',
  'src/pages/brands/true.astro',
  'src/pages/brands/miele-professional-dishwasher-repair.astro',
];
const samplesToShow = SHOW_DIFF_FOR.length ? SHOW_DIFF_FOR : SAMPLE_FILES;

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('================================================================');
console.log(` MODE: ${APPLY ? 'APPLY (real edits)' : 'DRY-RUN (no writes)'}`);
console.log(' Pattern B → BrandBranchesGrid migration (Option γ — new section between hero and body)');
console.log('================================================================');
console.log(`Date:           ${new Date().toISOString()}`);
console.log(`Files scanned:  ${stats.scanned}  (Pattern B only — files with class="branch"> + hero-aside)`);
console.log(`Files changed:  ${stats.wouldChange}`);
console.log(`Files w/ import errors:        ${stats.importErrors.length}`);
console.log(`Files w/ hero-restructure failures: ${stats.heroErrors.length}`);
console.log();
console.log('Replacement totals (across changed files):');
console.log(`  imports added:           ${stats.totals.imports}  (2 per file expected — BrandBranchesGrid + MAIN_PHONE/_TEL)`);
console.log(`  hero restructures:       ${stats.totals.hero}  (delete aside + restructure to 1-column + insert <BrandBranchesGrid />)`);
console.log(`  bottom block deletions:  ${stats.totals.bottom}  (290 expected; 4 commercial hubs have no bottom block)`);
console.log(`  standalone phone CTAs:   ${stats.totals.phones}  (~3 per file — call-banner, hero CTA, float-call)`);
console.log(`  dead CSS rules removed:  ${stats.totals.css}  (~10 per file)`);
console.log();

if (stats.importErrors.length) {
  console.log('!!! FILES WITH IMPORT INSERTION ERRORS !!!');
  for (const e of stats.importErrors) console.log(`  ${e.file}: ${e.error}`);
  console.log();
}
if (stats.heroErrors.length) {
  console.log('!!! FILES WITH HERO-RESTRUCTURE FAILURES (regex no-match) !!!');
  for (const f of stats.heroErrors) console.log(`  ${f}`);
  console.log();
}

console.log('Sample diffs:');
console.log();
for (const sf of samplesToShow) {
  const full = path.join(ROOT, sf);
  const r = fileResults.get(full);
  if (!r) {
    console.log(`(skipped — not in Pattern B scope: ${sf})`);
    console.log();
    continue;
  }
  if (!r.diff) {
    console.log(`(no changes — ${sf})`);
    console.log();
    continue;
  }
  console.log('================================================================');
  console.log(`SAMPLE: ${sf}`);
  console.log(`Counts: imports=${r.counts.imports}  hero=${r.counts.hero}  bottom=${r.counts.bottom}  phones=${r.counts.phones}  css=${r.counts.css}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, sf));
  console.log();
}

console.log('================================================================');
console.log(` SUMMARY: scanned=${stats.scanned} changed=${stats.wouldChange} importErrors=${stats.importErrors.length} heroErrors=${stats.heroErrors.length}`);
console.log(` ${APPLY ? '★ Files written.' : '★ Dry-run only — no files modified.'}`);
console.log('================================================================');

process.exit((stats.importErrors.length + stats.heroErrors.length) > 0 ? 1 : 0);
