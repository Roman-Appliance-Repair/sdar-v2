#!/usr/bin/env node
/**
 * sweep-brand-schema.mjs
 *
 * T-BRANDS Day 3 — mass schema cleanup across src/pages/brands/**\/*.astro.
 *
 * Removes per NAP & Rating Policy SSOT (wiki/decisions/nap-rating-policy-ssot.md):
 *   - aggregateRating block
 *   - address block (only if contains "6230 Wilshire" PMB; safety-checked)
 *   - geo block (Brand pages aren't city-bound — coords misleading)
 *
 * Normalizes:
 *   - areaServed → canonical 5-county AdministrativeArea array
 *
 * Default mode: DRY-RUN. Pass --apply to write changes.
 *   node scripts/sweep-brand-schema.mjs            # dry-run, no writes
 *   node scripts/sweep-brand-schema.mjs --apply    # actual edits
 *
 * Validates each modified file's brace/bracket balance after edits. Files that
 * fail validation are NOT written and are reported as errors.
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

// ─── Canonical 5-county areaServed ──────────────────────────────────────────

const FIVE_COUNTIES = `[
      { "@type": "AdministrativeArea", "name": "Los Angeles County" },
      { "@type": "AdministrativeArea", "name": "Orange County" },
      { "@type": "AdministrativeArea", "name": "Ventura County" },
      { "@type": "AdministrativeArea", "name": "San Bernardino County" },
      { "@type": "AdministrativeArea", "name": "Riverside County" }
    ]`;

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

/** Returns true if the source has balanced braces/brackets (respecting strings, templates, comments). */
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

// ─── Regex building blocks ──────────────────────────────────────────────────

// Object literal with up to 1 level of nested braces.
// Matches `{...}` where any inner `{...}` doesn't itself contain nested objects.
// PostalAddress (1 level deep), aggregateRating (no deeper), geo (no deeper) all qualify.
const OBJ_1_DEEP = '\\{(?:[^{}]|\\{[^{}]*\\})*\\}';
// Array literal with up to 1 level of nested arrays/objects.
const ARR_1_DEEP = '\\[(?:[^\\[\\]{}]|\\{[^{}]*\\}|\\[[^\\[\\]]*\\])*\\]';
// Quoted string (no escape support needed beyond backslash quote — JSON-LD strings are simple).
const QSTR = '"(?:[^"\\\\]|\\\\.)*"';

// ─── Field deletion (handles trailing/leading/standalone comma) ─────────────

/**
 * Delete a single occurrence of `"fieldName": <value>` from `content`.
 * `valueRegex` is the regex source for the value pattern.
 * `validator(matchedSubstring)` is an optional gate; if provided and returns false, skip this match.
 *
 * Tries three patterns in order:
 *   1. Field with trailing comma  (mid- or first-position field)
 *   2. Field with leading comma   (last-position field)
 *   3. Standalone field           (only field in object — rare)
 *
 * Returns { content, deleted: boolean }.
 */
function deleteOneField(content, fieldName, valueRegex, validator) {
  // 1. trailing comma
  let re = new RegExp(`(\\s*)"${fieldName}"\\s*:\\s*(${valueRegex})\\s*,`, 's');
  let m = re.exec(content);
  if (m && (!validator || validator(m[0]))) {
    return { content: content.slice(0, m.index) + content.slice(m.index + m[0].length), deleted: true };
  }
  // 2. leading comma
  re = new RegExp(`,(\\s*)"${fieldName}"\\s*:\\s*(${valueRegex})`, 's');
  m = re.exec(content);
  if (m && (!validator || validator(m[0]))) {
    return { content: content.slice(0, m.index) + content.slice(m.index + m[0].length), deleted: true };
  }
  // 3. standalone
  re = new RegExp(`(\\s*)"${fieldName}"\\s*:\\s*(${valueRegex})`, 's');
  m = re.exec(content);
  if (m && (!validator || validator(m[0]))) {
    return { content: content.slice(0, m.index) + content.slice(m.index + m[0].length), deleted: true };
  }
  return { content, deleted: false };
}

function deleteAllFields(content, fieldName, valueRegex, validator, maxIter = 20) {
  let count = 0;
  for (let i = 0; i < maxIter; i++) {
    const r = deleteOneField(content, fieldName, valueRegex, validator);
    if (!r.deleted) break;
    content = r.content;
    count++;
  }
  return { content, count };
}

// ─── areaServed replacement ─────────────────────────────────────────────────

/**
 * Replace every `"areaServed": <value>` with the canonical 5-county form.
 * Accepts: array literal (City | AdministrativeArea | string entries) OR single string.
 */
function replaceAreaServed(content) {
  let count = 0;
  // Match array form first (greedy because arrays are more specific)
  let re = new RegExp(`"areaServed"\\s*:\\s*${ARR_1_DEEP}`, 'gs');
  content = content.replace(re, () => {
    count++;
    return `"areaServed": ${FIVE_COUNTIES}`;
  });
  // Then any remaining string form (Hobart Service.areaServed = "Los Angeles")
  re = new RegExp(`"areaServed"\\s*:\\s*${QSTR}`, 'g');
  content = content.replace(re, () => {
    count++;
    return `"areaServed": ${FIVE_COUNTIES}`;
  });
  return { content, count };
}

// ─── File processing ────────────────────────────────────────────────────────

function processOne(file) {
  const orig = fs.readFileSync(file, 'utf8');
  let content = orig;

  const aggr = deleteAllFields(content, 'aggregateRating', OBJ_1_DEEP);
  content = aggr.content;

  // Address: gate on "6230 Wilshire" (PMB) — never touch branch addresses.
  const addr = deleteAllFields(content, 'address', OBJ_1_DEEP, (m) => m.includes('6230 Wilshire'));
  content = addr.content;

  // geo: brand pages aren't city-bound; coords misleading. Delete unconditionally.
  const geo = deleteAllFields(content, 'geo', OBJ_1_DEEP);
  content = geo.content;

  // areaServed: replace with canonical 5-county.
  const area = replaceAreaServed(content);
  content = area.content;

  const balanced = isBraceBalanced(content);
  return {
    file,
    orig,
    content,
    counts: { aggr: aggr.count, addr: addr.count, geo: geo.count, area: area.count },
    diff: orig !== content,
    balanced,
  };
}

// ─── Diff helper (small unified-ish output for samples) ─────────────────────

function makeMiniDiff(orig, modified, file) {
  const oArr = orig.split('\n');
  const mArr = modified.split('\n');
  // Find first differing line index (common prefix)
  let head = 0;
  while (head < oArr.length && head < mArr.length && oArr[head] === mArr[head]) head++;
  // Find last differing line index from end (common suffix)
  let tailO = oArr.length - 1;
  let tailM = mArr.length - 1;
  while (tailO >= head && tailM >= head && oArr[tailO] === mArr[tailM]) {
    tailO--;
    tailM--;
  }
  // Pad context: 2 lines before head, 2 lines after tail
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
  totals: { aggr: 0, addr: 0, geo: 0, area: 0 },
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
    stats.totals.aggr += r.counts.aggr;
    stats.totals.addr += r.counts.addr;
    stats.totals.geo += r.counts.geo;
    stats.totals.area += r.counts.area;
    if (APPLY) fs.writeFileSync(file, r.content);
  } else {
    stats.unchanged.push(path.relative(ROOT, file));
  }
}

// ─── Sample diffs ────────────────────────────────────────────────────────────

const SAMPLE_FILES = [
  'src/pages/brands/aga-range-hood-repair.astro',
  'src/pages/brands/lg-refrigerator-repair.astro',
  'src/pages/brands/wolf.astro',
  'src/pages/brands/hobart-dishwasher-repair.astro',
  'src/pages/brands/commercial-refrigeration/true-refrigeration-commercial-repair.astro',
];
const samplesToShow = SHOW_DIFF_FOR.length ? SHOW_DIFF_FOR : SAMPLE_FILES;

// ─── Report ──────────────────────────────────────────────────────────────────

console.log('================================================================');
console.log(` MODE: ${APPLY ? 'APPLY (real edits)' : 'DRY-RUN (no writes)'}`);
console.log(' Brand schema sweep — aggregateRating + PMB address + geo + areaServed');
console.log('================================================================');
console.log(`Date:           ${new Date().toISOString()}`);
console.log(`Repo root:      ${ROOT}`);
console.log(`Brands dir:     ${path.relative(ROOT, BRANDS)}`);
console.log(`Files scanned:  ${stats.scanned}`);
console.log(`Files changed:  ${stats.wouldChange}`);
console.log(`Files unchanged: ${stats.unchanged.length}`);
console.log(`Files w/ errors: ${stats.errors.length}`);
console.log();
console.log('Field deletions/replacements (totals across changed files):');
console.log(`  aggregateRating deleted: ${stats.totals.aggr}`);
console.log(`  address      deleted:    ${stats.totals.addr}  (PMB-gated, branch addresses preserved)`);
console.log(`  geo          deleted:    ${stats.totals.geo}`);
console.log(`  areaServed   replaced:   ${stats.totals.area}  (canonical 5-county AdministrativeArea)`);
console.log();

if (stats.errors.length) {
  console.log('!!! FILES THAT FAILED BRACE-BALANCE VALIDATION (NOT WRITTEN) !!!');
  for (const f of stats.errors) console.log(`  ${f}`);
  console.log();
}

console.log('Sample diffs:');
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
  console.log(`Counts: aggr=${r.counts.aggr}  addr=${r.counts.addr}  geo=${r.counts.geo}  area=${r.counts.area}  balanced=${r.balanced}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, sf));
  console.log();
}

console.log('================================================================');
console.log(` SUMMARY: scanned=${stats.scanned} changed=${stats.wouldChange} errors=${stats.errors.length} unchanged=${stats.unchanged.length}`);
console.log(` ${APPLY ? '★ Files written.' : '★ Dry-run only — no files modified.'}`);
console.log('================================================================');

process.exit(stats.errors.length > 0 ? 1 : 0);
