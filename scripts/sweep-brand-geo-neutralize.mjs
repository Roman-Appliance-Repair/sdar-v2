#!/usr/bin/env node
/**
 * sweep-brand-geo-neutralize.mjs
 *
 * T-BRANDS Day 5 — geo-neutralize title / H1 / meta description across
 * src/pages/brands/**\/*.astro. Scope B per Roman 2026-04-29:
 *
 *   TITLE (frontmatter `const title = "..."`):
 *     - " Los Angeles |"  →  " | Southern California |"
 *     - " LA |"           →  " | Southern California |"
 *     - " Los Angeles —"  →  " | Southern California —"   (or hyphen)
 *     - " LA —"           →  " | Southern California —"
 *     - " Los Angeles" trailing  →  " | Southern California"
 *     - " LA" trailing           →  " | Southern California"
 *     - "in Los Angeles"  →  "across Southern California"
 *     - "in LA"           →  "across Southern California"
 *
 *   H1 (`<h1>...</h1>` single-line, body-inline):
 *     - " in Los Angeles" trailing  →  ""  (drop)
 *     - " Los Angeles" trailing     →  ""
 *     - "Los Angeles " leading      →  ""
 *     (No "Southern California" in H1 — brand-categorical, no geo claim.)
 *
 *   DESCRIPTION (frontmatter `const description = "..."`):
 *     - "in Los Angeles" / "in LA"  →  "across Southern California"
 *     - "across Los Angeles" / "across LA"  →  "across Southern California"
 *     - "for LA" / "for Los Angeles"  →  "for Southern California"
 *     - "repair LA" / "repair Los Angeles"  →  "repair Southern California"
 *     - bare " LA " / " Los Angeles " between words  →  " " (collapse)
 *
 * COMPONENTS (separately):
 *   - src/components/BrandHubPlaceholder.astro: H1 strip "Los Angeles"
 *   - src/components/BrandDetailPlaceholder.astro: H1 strip "Los Angeles"
 *   (Hero-eyebrow zip codes left intact — physical branch addresses.)
 *
 * NOT TOUCHED:
 *   - Body content (recent repairs, technician names, neighborhood mentions)
 *   - Internal links to /los-angeles/, /west-hollywood/ etc
 *   - JSON-LD schema (cleaned in Day 3)
 *   - Comments
 *   - Hero-eyebrow zip codes
 *
 * Default: DRY-RUN. Pass --apply to write.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BRANDS = path.join(ROOT, 'src', 'pages', 'brands');
const COMPONENTS = [
  path.join(ROOT, 'src', 'components', 'BrandHubPlaceholder.astro'),
  path.join(ROOT, 'src', 'components', 'BrandDetailPlaceholder.astro'),
];
const APPLY = process.argv.includes('--apply');
const SHOW_DIFF_FOR = process.argv
  .filter((a) => a.startsWith('--diff='))
  .map((a) => a.slice('--diff='.length));

// ─── File enumeration ───────────────────────────────────────────────────────

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) files.push(full);
  }
}
walk(BRANDS);

// ─── Brace/bracket-balance validator ────────────────────────────────────────

function skipString(s, i) {
  const q = s[i];
  i++;
  while (i < s.length) {
    if (s[i] === '\\') { i += 2; continue; }
    if (s[i] === q) return i + 1;
    i++;
  }
  return i;
}
function skipTemplate(s, i) {
  i++;
  while (i < s.length) {
    if (s[i] === '\\') { i += 2; continue; }
    if (s[i] === '`') return i + 1;
    if (s[i] === '$' && s[i + 1] === '{') {
      i += 2;
      let d = 1;
      while (i < s.length && d > 0) {
        if (s[i] === '"' || s[i] === "'") { i = skipString(s, i); continue; }
        if (s[i] === '`') { i = skipTemplate(s, i); continue; }
        if (s[i] === '{') d++;
        else if (s[i] === '}') d--;
        i++;
      }
      continue;
    }
    i++;
  }
  return i;
}
function isBraceBalanced(src) {
  let braces = 0;
  let brackets = 0;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'") { i = skipString(src, i); continue; }
    if (c === '`') { i = skipTemplate(src, i); continue; }
    if (c === '{') braces++;
    else if (c === '}') braces--;
    else if (c === '[') brackets++;
    else if (c === ']') brackets--;
    if (braces < 0 || brackets < 0) return false;
    i++;
  }
  return braces === 0 && brackets === 0;
}

// ─── Transformers ───────────────────────────────────────────────────────────

function transformTitle(s) {
  let r = s;
  // " in Los Angeles" / " in LA" → "across Southern California"
  r = r.replace(/\bin\s+Los Angeles\b/g, 'across Southern California');
  r = r.replace(/\bin\s+LA\b/g, 'across Southern California');
  // ALREADY pipe-separated geo: "| Los Angeles |" → "| Southern California |"
  // (run BEFORE the " Los Angeles |" rule so we don't double-up pipes)
  r = r.replace(/\|\s*(?:Los Angeles|LA)\s*\|/g, '| Southern California |');
  // ALREADY pipe-separated trailing: "| Los Angeles$" → "| Southern California"
  r = r.replace(/\|\s*(?:Los Angeles|LA)\s*$/g, '| Southern California');
  // ALREADY pipe-separated em-dash: "| Los Angeles —" → "| Southern California —"
  r = r.replace(/\|\s*(?:Los Angeles|LA)\s*([—\-])/g, '| Southern California $1');
  // " Los Angeles |" / " LA |" → " | Southern California |"
  r = r.replace(/\s+(?:Los Angeles|LA)\s*\|/g, ' | Southern California |');
  // " Los Angeles —" / " LA —" / " Los Angeles -" → " | Southern California —"
  r = r.replace(/\s+(?:Los Angeles|LA)\s*([—\-])/g, ' | Southern California $1');
  // " Los Angeles" / " LA" trailing (end of string) → " | Southern California"
  r = r.replace(/\s+(?:Los Angeles|LA)\s*$/g, ' | Southern California');
  // Leading "Los Angeles " / "LA " → drop (rare per inventory, but defensive)
  r = r.replace(/^Los Angeles\s+/g, '');
  return r;
}

function transformDescription(s) {
  let r = s;
  // Prepositional patterns
  r = r.replace(/\bin\s+Los Angeles\b/g, 'across Southern California');
  r = r.replace(/\bin\s+LA\b/g, 'across Southern California');
  r = r.replace(/\bacross\s+Los Angeles\b/g, 'across Southern California');
  r = r.replace(/\bacross\s+LA\b/g, 'across Southern California');
  r = r.replace(/\bfor\s+Los Angeles\b/g, 'for Southern California');
  r = r.replace(/\bfor\s+LA\b/g, 'for Southern California');
  r = r.replace(/\brepair\s+Los Angeles\b/g, 'repair Southern California');
  r = r.replace(/\brepair\s+LA\b/g, 'repair Southern California');
  // Bare " LA " / " Los Angeles " between words → collapse
  r = r.replace(/\s+Los Angeles\s+/g, ' ');
  r = r.replace(/\s+LA\s+/g, ' ');
  // " LA," / " Los Angeles," → ","
  r = r.replace(/\s+(?:Los Angeles|LA),/g, ',');
  // " LA." / " Los Angeles." → "."
  r = r.replace(/\s+(?:Los Angeles|LA)\./g, '.');
  return r;
}

function transformH1(inner) {
  let r = inner;
  // " in Los Angeles" trailing → drop
  r = r.replace(/\s+in\s+Los Angeles\s*$/i, '');
  // " Los Angeles" trailing → drop
  r = r.replace(/\s+Los Angeles\s*$/i, '');
  // "Los Angeles " leading → drop
  r = r.replace(/^Los Angeles\s+/i, '');
  return r;
}

// ─── Regex-targeted replacement helpers ─────────────────────────────────────

/**
 * Replace string content of `const <name> = "..."` declaration.
 * Respects backslash-escaped quotes inside the string.
 * Returns { content, count }.
 */
function transformConstString(content, constName, transformer) {
  const re = new RegExp(`(const\\s+${constName}\\s*=\\s*)"((?:[^"\\\\]|\\\\.)*)"`, 'g');
  let count = 0;
  const newContent = content.replace(re, (full, lhs, str) => {
    const newStr = transformer(str);
    if (newStr !== str) count++;
    return `${lhs}"${newStr}"`;
  });
  return { content: newContent, count };
}

/**
 * Transform inner text of single-line `<h1[^>]*>...</h1>` tags.
 * Single-line only. H1s with nested elements skipped (not present in scope).
 */
function transformH1Tags(content, transformer) {
  const re = /(<h1[^>]*>)([^<]*)(<\/h1>)/g;
  let count = 0;
  const newContent = content.replace(re, (full, open, inner, close) => {
    const newInner = transformer(inner);
    if (newInner !== inner) count++;
    return `${open}${newInner}${close}`;
  });
  return { content: newContent, count };
}

// ─── File processing ────────────────────────────────────────────────────────

function processOne(file) {
  const orig = fs.readFileSync(file, 'utf8');
  let content = orig;

  const t = transformConstString(content, 'title', transformTitle);
  content = t.content;

  const d = transformConstString(content, 'description', transformDescription);
  content = d.content;

  const h = transformH1Tags(content, transformH1);
  content = h.content;

  return {
    file,
    orig,
    content,
    counts: { title: t.count, description: d.count, h1: h.count },
    diff: orig !== content,
    balanced: isBraceBalanced(content),
  };
}

function processComponent(file) {
  // Components have NO frontmatter title/description — only inline H1.
  const orig = fs.readFileSync(file, 'utf8');
  let content = orig;
  const h = transformH1Tags(content, transformH1);
  content = h.content;
  return {
    file,
    orig,
    content,
    counts: { title: 0, description: 0, h1: h.count },
    diff: orig !== content,
    balanced: isBraceBalanced(content),
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
  unchanged: [],
  errors: [],
  componentsProcessed: 0,
  componentsChanged: 0,
  totals: { title: 0, description: 0, h1: 0 },
};

const fileResults = new Map();

for (const file of files) {
  stats.scanned++;
  const r = processOne(file);
  fileResults.set(file, r);
  if (!r.balanced) {
    stats.errors.push(path.relative(ROOT, file));
    continue;
  }
  if (r.diff) {
    stats.wouldChange++;
    stats.totals.title += r.counts.title;
    stats.totals.description += r.counts.description;
    stats.totals.h1 += r.counts.h1;
    if (APPLY) fs.writeFileSync(file, r.content);
  } else {
    stats.unchanged.push(path.relative(ROOT, file));
  }
}

const componentResults = [];
for (const cf of COMPONENTS) {
  if (!fs.existsSync(cf)) {
    stats.errors.push(`(missing) ${path.relative(ROOT, cf)}`);
    continue;
  }
  stats.componentsProcessed++;
  const r = processComponent(cf);
  componentResults.push(r);
  if (!r.balanced) {
    stats.errors.push(path.relative(ROOT, cf));
    continue;
  }
  if (r.diff) {
    stats.componentsChanged++;
    stats.totals.h1 += r.counts.h1;
    if (APPLY) fs.writeFileSync(cf, r.content);
  }
}

// ─── Sample diffs ───────────────────────────────────────────────────────────

const SAMPLE_FILES = [
  'src/pages/brands/wolf.astro',
  'src/pages/brands/lg-refrigerator-repair.astro',
  'src/pages/brands/miele-professional-repair.astro',
  'src/pages/brands/commercial-refrigeration/true-refrigeration-commercial-repair.astro',
  'src/pages/brands/index.astro',
  'src/pages/brands/lg-dryer-repair.astro',
  'src/pages/brands/beverage-air.astro',
  'src/pages/brands/bosch-dishwasher-repair.astro',
];
const samplesToShow = SHOW_DIFF_FOR.length ? SHOW_DIFF_FOR : SAMPLE_FILES;

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('================================================================');
console.log(` MODE: ${APPLY ? 'APPLY (real edits)' : 'DRY-RUN (no writes)'}`);
console.log(' Brand title/H1/description geo-neutralization (Scope B)');
console.log(' "Los Angeles" + "LA" abbreviation → "Southern California"');
console.log('================================================================');
console.log(`Date:           ${new Date().toISOString()}`);
console.log(`Repo root:      ${ROOT}`);
console.log(`Brands dir:     ${path.relative(ROOT, BRANDS)}`);
console.log(`Files scanned:  ${stats.scanned}`);
console.log(`Files changed:  ${stats.wouldChange}`);
console.log(`Files unchanged: ${stats.unchanged.length}`);
console.log(`Files w/ brace errors: ${stats.errors.length}`);
console.log(`Components processed: ${stats.componentsProcessed}`);
console.log(`Components changed:   ${stats.componentsChanged}`);
console.log();
console.log('Replacement totals (across changed files + components):');
console.log(`  title       changed:    ${stats.totals.title}`);
console.log(`  description changed:    ${stats.totals.description}`);
console.log(`  H1          changed:    ${stats.totals.h1}`);
console.log();

if (stats.errors.length) {
  console.log('!!! FILES THAT FAILED VALIDATION (NOT WRITTEN) !!!');
  for (const f of stats.errors) console.log(`  ${f}`);
  console.log();
}

console.log('Sample diffs (brand pages):');
console.log();
for (const sf of samplesToShow) {
  const full = path.join(ROOT, sf);
  const r = fileResults.get(full);
  if (!r) {
    console.log(`(skipped — file not found: ${sf})`);
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
  console.log(`Counts: title=${r.counts.title}  desc=${r.counts.description}  h1=${r.counts.h1}  balanced=${r.balanced}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, sf));
  console.log();
}

console.log('Sample diffs (placeholder components):');
console.log();
for (const r of componentResults) {
  const rel = path.relative(ROOT, r.file);
  if (!r.diff) {
    console.log(`(no changes — ${rel})`);
    console.log();
    continue;
  }
  console.log('================================================================');
  console.log(`SAMPLE: ${rel}`);
  console.log(`Counts: h1=${r.counts.h1}  balanced=${r.balanced}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, rel));
  console.log();
}

console.log('================================================================');
console.log(` SUMMARY: scanned=${stats.scanned} changed=${stats.wouldChange} components=${stats.componentsChanged}/${stats.componentsProcessed} errors=${stats.errors.length}`);
console.log(` ${APPLY ? '★ Files written.' : '★ Dry-run only — no files modified.'}`);
console.log('================================================================');

process.exit(stats.errors.length > 0 ? 1 : 0);
