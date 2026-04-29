#!/usr/bin/env node
/**
 * sweep-services-schema.mjs
 *
 * T-BRANDS Day 4 Commit 2 — services schema cleanup across
 * src/pages/services/**\/*.astro.
 *
 * CONSERVATIVE SCOPE per Roman 2026-04-29:
 *   DELETE:
 *     - aggregateRating block (11 services pages)
 *     - address block (only if contains "PMB 2267" — PMB-gated, branch addrs preserved)
 *     - geo block
 *
 *   PRESERVE:
 *     - areaServed in any shape (City[], 3 counties, 5 counties, dual-block)
 *     - All other schema fields (name, telephone, FAQ, hasOfferCatalog, etc.)
 *     - LocalBusiness vs Service dual-block architecture
 *
 * Mirror of Day 3 brand sweep but services-scoped + areaServed left alone.
 *
 * Default mode: DRY-RUN. Pass --apply to write changes.
 *   node scripts/sweep-services-schema.mjs            # dry-run, no writes
 *   node scripts/sweep-services-schema.mjs --apply    # actual edits
 *
 * Validates each modified file's brace/bracket balance after edits AND
 * attempts JSON.parse on every inline `<script type="application/ld+json">`
 * block (skipping `set:html={...}` blocks which have no inline JSON).
 * Files that fail validation are NOT written and are reported as errors.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVICES = path.join(ROOT, 'src', 'pages', 'services');
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
walk(SERVICES);

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

// ─── Inline JSON-LD extractor + parser ──────────────────────────────────────

/**
 * Find every `<script type="application/ld+json"> ... </script>` block whose
 * body is inline JSON (NOT a `set:html={...}` expression). Returns an array
 * of { jsonText, ok, error }. set:html blocks are skipped (no inline JSON).
 */
function validateInlineJsonLd(src) {
  const results = [];
  const openRe = /<script\s+type="application\/ld\+json"([^>]*)>/g;
  let m;
  while ((m = openRe.exec(src)) !== null) {
    const attrs = m[1];
    if (/\bset:html\b/.test(attrs)) continue;
    const start = m.index + m[0].length;
    const end = src.indexOf('</script>', start);
    if (end === -1) continue;
    const body = src.slice(start, end).trim();
    if (!body) continue;
    try {
      JSON.parse(body);
      results.push({ ok: true });
    } catch (e) {
      results.push({ ok: false, error: e.message, snippet: body.slice(0, 120) });
    }
  }
  return results;
}

// ─── Regex building blocks ──────────────────────────────────────────────────

const OBJ_1_DEEP = '\\{(?:[^{}]|\\{[^{}]*\\})*\\}';

// ─── Field deletion (handles trailing/leading/standalone comma) ─────────────

function deleteOneField(content, fieldName, valueRegex, validator) {
  let re = new RegExp(`(\\s*)"${fieldName}"\\s*:\\s*(${valueRegex})\\s*,`, 's');
  let m = re.exec(content);
  if (m && (!validator || validator(m[0]))) {
    return { content: content.slice(0, m.index) + content.slice(m.index + m[0].length), deleted: true };
  }
  re = new RegExp(`,(\\s*)"${fieldName}"\\s*:\\s*(${valueRegex})`, 's');
  m = re.exec(content);
  if (m && (!validator || validator(m[0]))) {
    return { content: content.slice(0, m.index) + content.slice(m.index + m[0].length), deleted: true };
  }
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

// ─── File processing ────────────────────────────────────────────────────────

function processOne(file) {
  const orig = fs.readFileSync(file, 'utf8');
  let content = orig;

  const aggr = deleteAllFields(content, 'aggregateRating', OBJ_1_DEEP);
  content = aggr.content;

  // Address: gate on "PMB 2267" — never touch branch addresses.
  const addr = deleteAllFields(content, 'address', OBJ_1_DEEP, (m) => m.includes('PMB 2267'));
  content = addr.content;

  // geo: services pages aren't city-bound — coords misleading. Delete unconditionally.
  const geo = deleteAllFields(content, 'geo', OBJ_1_DEEP);
  content = geo.content;

  // CONSERVATIVE: areaServed left untouched.

  const balanced = isBraceBalanced(content);
  const jsonChecks = validateInlineJsonLd(content);
  const jsonOk = jsonChecks.every((r) => r.ok);
  const jsonErrors = jsonChecks.filter((r) => !r.ok);

  return {
    file,
    orig,
    content,
    counts: { aggr: aggr.count, addr: addr.count, geo: geo.count },
    diff: orig !== content,
    balanced,
    jsonOk,
    jsonErrors,
    jsonBlocksChecked: jsonChecks.length,
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
  jsonErrors: [],
  totals: { aggr: 0, addr: 0, geo: 0 },
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
  if (!r.jsonOk) {
    stats.jsonErrors.push({
      file: path.relative(ROOT, file),
      errors: r.jsonErrors,
    });
    continue;
  }
  if (r.diff) {
    stats.wouldChange++;
    stats.totals.aggr += r.counts.aggr;
    stats.totals.addr += r.counts.addr;
    stats.totals.geo += r.counts.geo;
    if (APPLY) fs.writeFileSync(file, r.content);
  } else {
    stats.unchanged.push(path.relative(ROOT, file));
  }
}

// ─── Sample diffs ───────────────────────────────────────────────────────────

const SAMPLE_FILES = [
  'src/pages/services/induction-cooktop-repair.astro',
  'src/pages/services/wine-cellar-repair.astro',
  'src/pages/services/laundry-repair.astro',
  'src/pages/services/wall-oven-repair.astro',
  'src/pages/services/stackable-washer-dryer-repair.astro',
];
const samplesToShow = SHOW_DIFF_FOR.length ? SHOW_DIFF_FOR : SAMPLE_FILES;

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('================================================================');
console.log(` MODE: ${APPLY ? 'APPLY (real edits)' : 'DRY-RUN (no writes)'}`);
console.log(' Services schema sweep — aggregateRating + PMB address + geo');
console.log(' Conservative: areaServed PRESERVED in any shape.');
console.log('================================================================');
console.log(`Date:           ${new Date().toISOString()}`);
console.log(`Repo root:      ${ROOT}`);
console.log(`Services dir:   ${path.relative(ROOT, SERVICES)}`);
console.log(`Files scanned:  ${stats.scanned}`);
console.log(`Files changed:  ${stats.wouldChange}`);
console.log(`Files unchanged: ${stats.unchanged.length}`);
console.log(`Files w/ brace errors: ${stats.errors.length}`);
console.log(`Files w/ JSON.parse errors: ${stats.jsonErrors.length}`);
console.log();
console.log('Field deletions (totals across changed files):');
console.log(`  aggregateRating deleted: ${stats.totals.aggr}`);
console.log(`  address      deleted:    ${stats.totals.addr}  (PMB-gated, branch addresses preserved)`);
console.log(`  geo          deleted:    ${stats.totals.geo}`);
console.log();

if (stats.errors.length) {
  console.log('!!! FILES THAT FAILED BRACE-BALANCE VALIDATION (NOT WRITTEN) !!!');
  for (const f of stats.errors) console.log(`  ${f}`);
  console.log();
}

if (stats.jsonErrors.length) {
  console.log('!!! FILES THAT FAILED JSON.parse VALIDATION (NOT WRITTEN) !!!');
  for (const e of stats.jsonErrors) {
    console.log(`  ${e.file}`);
    for (const err of e.errors) {
      console.log(`    - ${err.error}`);
      console.log(`      snippet: ${err.snippet}...`);
    }
  }
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
  console.log(`Counts: aggr=${r.counts.aggr}  addr=${r.counts.addr}  geo=${r.counts.geo}  balanced=${r.balanced}  jsonBlocks=${r.jsonBlocksChecked}  jsonOk=${r.jsonOk}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, sf));
  console.log();
}

console.log('================================================================');
console.log(` SUMMARY: scanned=${stats.scanned} changed=${stats.wouldChange} braceErrors=${stats.errors.length} jsonErrors=${stats.jsonErrors.length} unchanged=${stats.unchanged.length}`);
console.log(` ${APPLY ? '★ Files written.' : '★ Dry-run only — no files modified.'}`);
console.log('================================================================');

process.exit((stats.errors.length + stats.jsonErrors.length) > 0 ? 1 : 0);
