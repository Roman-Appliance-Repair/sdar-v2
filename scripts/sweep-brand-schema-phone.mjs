#!/usr/bin/env node
/**
 * sweep-brand-schema-phone.mjs
 *
 * T-BRANDS Day 6 Step E — schema telephone + commercial-refrigeration phone
 * normalization (P1-4 from wiki/audits/brands-audit-2026-04-28.md).
 *
 * Closes Day 6 phone consolidation. After this sweep:
 *   - Schema telephone field reads from MAIN_PHONE_TEL / MAIN_PHONE constants
 *   - Commercial-refrigeration `const phone` / `const phoneRaw` declarations
 *     reference the constants instead of literal strings
 *   - When MAIN_PHONE changes in branches.ts, ALL 380 brand pages auto-update:
 *     schema, body CTAs (Pattern A/B already done in Step C/D), BrandBranchesGrid.
 *
 * Substitution rules:
 *   1. Schema telephone (347 files): inside `set:html={JSON.stringify({...})}`
 *      object literal:
 *        "telephone": "+1-424-325-0520"  →  "telephone": MAIN_PHONE_TEL  (287 files)
 *        "telephone": "(424) 325-0520"   →  "telephone": MAIN_PHONE       (60 files)
 *
 *   2. Commercial-refrigeration const declarations (6 files):
 *        const phone = "(424) 325-0520";   →  const phone = MAIN_PHONE;
 *        const phoneRaw = "4243250520";    →  const phoneRaw = MAIN_PHONE_TEL;
 *      Template usages of `${phone}`, `tel:${phoneRaw}`, `{phone}` are NOT touched.
 *
 *   3. Import insertion (16 files — those without MAIN_PHONE_TEL already imported):
 *        - top-level `src/pages/brands/<file>.astro`           → '../../data/branches'
 *        - `src/pages/brands/commercial-refrigeration/<file>`  → '../../../data/branches'
 *
 * NOT TOUCHED:
 *   - Description text (Day 5 cleanup) — body content
 *   - Title / H1 — Day 5 work
 *   - Schema fields other than telephone (Day 3 cleanup intact)
 *   - Pattern A grid replacement (Step C work intact)
 *   - Pattern B hero/bottom restructure (Step D work intact)
 *   - Body content (FAQ, recent repairs, internal links, comments)
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

// ─── File enumeration ───────────────────────────────────────────────────────

const allFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) allFiles.push(full);
  }
}
walk(BRANDS);

// Files in scope: those with `"telephone":` in source.
const files = allFiles.filter((f) => /"telephone"/.test(fs.readFileSync(f, 'utf8')));

// ─── Helpers ────────────────────────────────────────────────────────────────

function isCommercialRefrigeration(file) {
  return file.includes(path.join('brands', 'commercial-refrigeration'));
}

function importPathFor(file) {
  return isCommercialRefrigeration(file)
    ? '../../../data/branches'
    : '../../data/branches';
}

function isBraceBalanced(src) {
  // Quick brace/bracket sanity check.
  const opens  = (src.match(/[{([]/g) || []).length;
  const closes = (src.match(/[})\]]/g) || []).length;
  return opens === closes;
}

// ─── 1. Schema telephone substitution ───────────────────────────────────────

function substituteSchemaTelephone(content) {
  let count = 0;
  // E.164 dashed format → MAIN_PHONE_TEL
  content = content.replace(/"telephone":\s*"\+1-424-325-0520"/g, () => {
    count++;
    return '"telephone": MAIN_PHONE_TEL';
  });
  // Display format → MAIN_PHONE
  content = content.replace(/"telephone":\s*"\(424\)\s+325-0520"/g, () => {
    count++;
    return '"telephone": MAIN_PHONE';
  });
  return { content, count };
}

// ─── 2. Commercial-refrigeration const declarations ─────────────────────────

function substituteCommercialConst(content) {
  let count = 0;
  // const phone = "(424) 325-0520";
  content = content.replace(
    /(const\s+phone\s*=\s*)"\(424\)\s+325-0520"\s*;/g,
    (full, lhs) => {
      count++;
      return `${lhs}MAIN_PHONE;`;
    }
  );
  // const phoneRaw = "4243250520";
  content = content.replace(
    /(const\s+phoneRaw\s*=\s*)"4243250520"\s*;/g,
    (full, lhs) => {
      count++;
      return `${lhs}MAIN_PHONE_TEL;`;
    }
  );
  return { content, count };
}

// ─── 3. Import insertion (idempotent) ───────────────────────────────────────

function addImports(content, file) {
  if (/MAIN_PHONE_TEL/.test(content) && /import\s*\{[^}]*MAIN_PHONE_TEL/.test(content)) {
    // Already imported.
    return { content, added: 0 };
  }
  const importLine = `import { MAIN_PHONE, MAIN_PHONE_TEL } from '${importPathFor(file)}';`;
  // Insert immediately after the Layout import line.
  const layoutImportRe = /^(import Layout from ['"][^'"]+layouts\/Layout\.astro['"];?)$/m;
  const m = content.match(layoutImportRe);
  if (!m) {
    return { content, added: 0, error: `no Layout import found in ${path.relative(ROOT, file)}` };
  }
  return {
    content: content.replace(layoutImportRe, `${m[0]}\n${importLine}`),
    added: 1,
  };
}

// ─── File processing ────────────────────────────────────────────────────────

function processOne(file) {
  const orig = fs.readFileSync(file, 'utf8');
  let content = orig;

  const schema = substituteSchemaTelephone(content);
  content = schema.content;

  let commercialCount = 0;
  if (isCommercialRefrigeration(file)) {
    const c = substituteCommercialConst(content);
    content = c.content;
    commercialCount = c.count;
  }

  // Only add imports if we actually changed something AND imports are missing.
  let importsAdded = 0;
  let importError;
  if (orig !== content) {
    const r = addImports(content, file);
    content = r.content;
    importsAdded = r.added;
    importError = r.error;
  }

  return {
    file,
    orig,
    content,
    counts: {
      schema: schema.count,
      commercial: commercialCount,
      imports: importsAdded,
    },
    diff: orig !== content,
    balanced: isBraceBalanced(content),
    importError,
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
  totals: { schema: 0, commercial: 0, imports: 0 },
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
    stats.totals.schema += r.counts.schema;
    stats.totals.commercial += r.counts.commercial;
    stats.totals.imports += r.counts.imports;
    if (APPLY) fs.writeFileSync(file, r.content);
  }
}

// ─── Sample diffs ───────────────────────────────────────────────────────────

const SAMPLE_FILES = [
  'src/pages/brands/wolf.astro',
  'src/pages/brands/lg-refrigerator-repair.astro',
  'src/pages/brands/commercial-refrigeration/true-refrigeration-commercial-repair.astro',
  'src/pages/brands/breezaire.astro',
  'src/pages/brands/perlick-outdoor-refrigerator-repair.astro',
  'src/pages/brands/miele-professional-dishwasher-repair.astro',
];
const samplesToShow = SHOW_DIFF_FOR.length ? SHOW_DIFF_FOR : SAMPLE_FILES;

// ─── Report ─────────────────────────────────────────────────────────────────

console.log('================================================================');
console.log(` MODE: ${APPLY ? 'APPLY (real edits)' : 'DRY-RUN (no writes)'}`);
console.log(' Schema telephone + commercial-refrigeration phone normalization');
console.log('================================================================');
console.log(`Date:           ${new Date().toISOString()}`);
console.log(`Files scanned:  ${stats.scanned}  (files containing "telephone": in source)`);
console.log(`Files changed:  ${stats.wouldChange}`);
console.log(`Files w/ brace errors: ${stats.errors.length}`);
console.log(`Files w/ import errors: ${stats.importErrors.length}`);
console.log();
console.log('Replacement totals:');
console.log(`  schema telephone substitutions:  ${stats.totals.schema}`);
console.log(`  commercial const substitutions:  ${stats.totals.commercial}  (6 files × 2 const each = 12 expected)`);
console.log(`  imports added:                   ${stats.totals.imports}  (16 files expected — 10 misc + 6 commercial)`);
console.log();

if (stats.errors.length) {
  console.log('!!! FILES THAT FAILED BRACE-BALANCE VALIDATION (NOT WRITTEN) !!!');
  for (const f of stats.errors) console.log(`  ${f}`);
  console.log();
}
if (stats.importErrors.length) {
  console.log('!!! IMPORT INSERTION ERRORS !!!');
  for (const e of stats.importErrors) console.log(`  ${e.file}: ${e.error}`);
  console.log();
}

console.log('Sample diffs:');
console.log();
for (const sf of samplesToShow) {
  const full = path.join(ROOT, sf);
  const r = fileResults.get(full);
  if (!r) {
    console.log(`(skipped — not in scope: ${sf})`);
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
  console.log(`Counts: schema=${r.counts.schema}  commercial=${r.counts.commercial}  imports=${r.counts.imports}  balanced=${r.balanced}`);
  console.log('================================================================');
  console.log(makeMiniDiff(r.orig, r.content, sf));
  console.log();
}

console.log('================================================================');
console.log(` SUMMARY: scanned=${stats.scanned} changed=${stats.wouldChange} braceErrors=${stats.errors.length} importErrors=${stats.importErrors.length}`);
console.log(` ${APPLY ? '★ Files written.' : '★ Dry-run only — no files modified.'}`);
console.log('================================================================');

process.exit((stats.errors.length + stats.importErrors.length) > 0 ? 1 : 0);
