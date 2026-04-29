#!/usr/bin/env node
/**
 * sweep-brand-pattern-a.mjs
 *
 * T-BRANDS Day 6 Step C — migrate 37 Pattern A brand pages to BrandBranchesGrid
 * (P1-4, P1-6 from wiki/audits/brands-audit-2026-04-28.md).
 *
 * Pattern A pages share the Wolf canonical structure:
 *   <section class="section">
 *     <div class="container">
 *       <p class="eyebrow-sub">Where we work</p>
 *       <h2>Brand-specific service-area heading</h2>
 *       <p>Optional brand-specific intro paragraph</p>
 *       <div class="branch-grid">          ← replace ONLY this inner block
 *         <div class="branch-card"> ×5
 *       </div>
 *     </div>
 *   </section>
 *
 * Surgical replacement (Option B per Roman 2026-04-29):
 *   1. Replace ONLY <div class="branch-grid">...</div> with
 *      <BrandBranchesGrid showHeader={false} />
 *      → preserves brand-specific H2 + intro paragraph
 *   2. Add 2 imports to frontmatter:
 *      - BrandBranchesGrid component
 *      - MAIN_PHONE + MAIN_PHONE_TEL from branches.ts
 *   3. Replace hero/bottom CTA hardcoded phones:
 *      - href="tel:+14243250520"   → href={`tel:${MAIN_PHONE_TEL}`}
 *      - >☎ (424) 325-0520<        → >☎ {MAIN_PHONE}<
 *      - >☎ Call (424) 325-0520<   → >☎ Call {MAIN_PHONE}<
 *   4. Remove dead CSS rules (5 selectors):
 *      .branch-grid / .branch-card / .branch-card h3 / .branch-card p / .branch-area
 *      Only if classes no longer appear in markup.
 *
 * NOT TOUCHED:
 *   - section wrapper, container, eyebrow, H2, intro paragraph
 *   - frontmatter title/description (Day 5 cleanup intact)
 *   - body content, FAQ, recent repairs, technical content
 *   - JSON-LD schema (Day 3 cleanup intact)
 *   - internal links to /los-angeles/ etc
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

// ─── File enumeration (only Pattern A files) ────────────────────────────────

const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) allFiles.push(full);
  }
}
walk(BRANDS);

// Pattern A = files containing literal `<div class="branch-grid">`
const files = allFiles.filter((f) => {
  const c = fs.readFileSync(f, 'utf8');
  return /<div class="branch-grid">/.test(c);
});

// ─── Import insertion ───────────────────────────────────────────────────────

function addImports(content, file) {
  // Idempotent: skip if already imported
  if (/from ['"]\.\.\/\.\.\/components\/BrandBranchesGrid\.astro['"]/.test(content)) {
    return { content, added: 0 };
  }
  // Find Layout import line
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

// ─── Inner grid replacement ─────────────────────────────────────────────────

/**
 * Match the inner <div class="branch-grid">...</div> block, anchored by the
 * canonical Pattern A structure (grid is followed by container `</div>` and
 * section `</section>`). Replaces ONLY the grid div, preserves indentation
 * and the surrounding section/container.
 */
const GRID_REGEX = /([ \t]*)<div class="branch-grid">[\s\S]*?<\/div>(\s*<\/div>\s*<\/section>)/;

function replaceGrid(content) {
  if (!GRID_REGEX.test(content)) return { content, replaced: 0 };
  const newContent = content.replace(
    GRID_REGEX,
    (m, indent, trailing) => `${indent}<BrandBranchesGrid showHeader={false} />${trailing}`
  );
  return { content: newContent, replaced: 1 };
}

// ─── Phone CTA replacement ──────────────────────────────────────────────────

function replacePhones(content) {
  let count = 0;
  // tel: hrefs — only the inline literal href="tel:+14243250520"
  const before = content;
  content = content.replace(/href="tel:\+14243250520"/g, () => {
    count++;
    return 'href={`tel:${MAIN_PHONE_TEL}`}';
  });
  // Display phone inside <a>...</a> — anchored by > and < boundaries
  // Variant 1: ">☎ (424) 325-0520<"
  content = content.replace(/>☎ \(424\) 325-0520</g, () => {
    count++;
    return '>☎ {MAIN_PHONE}<';
  });
  // Variant 2: ">☎ Call (424) 325-0520<"
  content = content.replace(/>☎ Call \(424\) 325-0520</g, () => {
    count++;
    return '>☎ Call {MAIN_PHONE}<';
  });
  // Variant 3: ">Call (424) 325-0520<"
  content = content.replace(/>Call \(424\) 325-0520</g, () => {
    count++;
    return '>Call {MAIN_PHONE}<';
  });
  return { content, count };
}

// ─── Dead CSS removal ───────────────────────────────────────────────────────

const DEAD_CSS_SELECTORS = [
  '.branch-grid',
  '.branch-card h3',
  '.branch-card p',
  '.branch-card',
  '.branch-area',
];

function removeDeadCss(content) {
  // Sanity: only remove CSS if these classes are no longer in markup
  const stillUsed = /class="(branch-grid|branch-card|branch-area)"/.test(content);
  if (stillUsed) return { content, removed: 0 };

  let removed = 0;
  for (const sel of DEAD_CSS_SELECTORS) {
    // Escape selector for regex (escape dots and whitespace)
    const escaped = sel.replace(/\./g, '\\.').replace(/ /g, '\\s+');
    // Match: optional leading whitespace + selector + { ... } + optional trailing newline
    const re = new RegExp(`^[ \\t]*${escaped}\\s*\\{[^{}]*\\}\\s*\\n`, 'gm');
    content = content.replace(re, () => {
      removed++;
      return '';
    });
  }
  return { content, removed };
}

// ─── Brace-balance validator (sanity) ───────────────────────────────────────

function isBraceBalanced(src) {
  // Simple: count open/close pairs across the whole file. Astro is permissive
  // with JSX-in-markup so we just verify no obvious break.
  const opens = (src.match(/\{/g) || []).length;
  const closes = (src.match(/\}/g) || []).length;
  return opens === closes;
}

// ─── File processing ────────────────────────────────────────────────────────

function processOne(file) {
  const orig = fs.readFileSync(file, 'utf8');
  let content = orig;

  const importRes = addImports(content, file);
  content = importRes.content;

  const gridRes = replaceGrid(content);
  content = gridRes.content;

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
      grid: gridRes.replaced,
      phones: phoneRes.count,
      css: cssRes.removed,
    },
    diff: orig !== content,
    balanced: isBraceBalanced(content),
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
  errors: [],
  importErrors: [],
  totals: { imports: 0, grid: 0, phones: 0, css: 0 },
};

const fileResults = new Map();
for (const file of files) {
  stats.scanned++;
  const r = processOne(file);
  fileResults.set(file, r);
  if (r.importError) {
    stats.importErrors.push({ file: path.relative(ROOT, file), error: r.importError });
  }
  if (!r.balanced) {
    stats.errors.push(path.relative(ROOT, file));
    continue;
  }
  if (r.diff) {
    stats.wouldChange++;
    stats.totals.imports += r.counts.imports;
    stats.totals.grid += r.counts.grid;
    stats.totals.phones += r.counts.phones;
    stats.totals.css += r.counts.css;
    if (APPLY) fs.writeFileSync(file, r.content);
  }
}

// ─── Sample diffs ───────────────────────────────────────────────────────────

const SAMPLE_FILES = [
  'src/pages/brands/wolf.astro',
  'src/pages/brands/bosch-washer-repair.astro',
  'src/pages/brands/viking.astro',
];
const samplesToShow = SHOW_DIFF_FOR.length ? SHOW_DIFF_FOR : SAMPLE_FILES;

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('================================================================');
console.log(` MODE: ${APPLY ? 'APPLY (real edits)' : 'DRY-RUN (no writes)'}`);
console.log(' Pattern A → BrandBranchesGrid migration');
console.log(' Surgical: replace inner <div class="branch-grid"> only.');
console.log('================================================================');
console.log(`Date:           ${new Date().toISOString()}`);
console.log(`Files scanned:  ${stats.scanned}  (Pattern A only — files containing <div class="branch-grid">)`);
console.log(`Files changed:  ${stats.wouldChange}`);
console.log(`Files w/ brace errors:  ${stats.errors.length}`);
console.log(`Files w/ import errors: ${stats.importErrors.length}`);
console.log();
console.log('Replacement totals (across changed files):');
console.log(`  imports added:           ${stats.totals.imports}  (2 per file expected — BrandBranchesGrid + MAIN_PHONE/_TEL)`);
console.log(`  grid replacements:       ${stats.totals.grid}`);
console.log(`  hero/bottom phone CTAs:  ${stats.totals.phones}`);
console.log(`  dead CSS rules removed:  ${stats.totals.css}`);
console.log();

if (stats.errors.length) {
  console.log('!!! FILES THAT FAILED BRACE-BALANCE VALIDATION (NOT WRITTEN) !!!');
  for (const f of stats.errors) console.log(`  ${f}`);
  console.log();
}
if (stats.importErrors.length) {
  console.log('!!! FILES WITH IMPORT INSERTION ERRORS !!!');
  for (const e of stats.importErrors) console.log(`  ${e.file}: ${e.error}`);
  console.log();
}

console.log('Sample diffs:');
console.log();
for (const sf of samplesToShow) {
  const full = path.join(ROOT, sf);
  const r = fileResults.get(full);
  if (!r) {
    console.log(`(skipped — not in Pattern A scope: ${sf})`);
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
  console.log(`Counts: imports=${r.counts.imports}  grid=${r.counts.grid}  phones=${r.counts.phones}  css=${r.counts.css}  balanced=${r.balanced}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, sf));
  console.log();
}

console.log('================================================================');
console.log(` SUMMARY: scanned=${stats.scanned} changed=${stats.wouldChange} braceErrors=${stats.errors.length} importErrors=${stats.importErrors.length}`);
console.log(` ${APPLY ? '★ Files written.' : '★ Dry-run only — no files modified.'}`);
console.log('================================================================');

process.exit((stats.errors.length + stats.importErrors.length) > 0 ? 1 : 0);
