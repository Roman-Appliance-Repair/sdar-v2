#!/usr/bin/env node
/**
 * audit-brand-files.mjs
 *
 * Sanity-check counter for the brands SSOT cleanup sweep.
 * Reports the number of files in src/pages/brands/**\/*.astro that match
 * each compliance check.
 *
 * Run BEFORE the sweep to capture baseline:
 *   node scripts/audit-brand-files.mjs > wiki/audits/brands-baseline-2026-04-28.txt
 *
 * Run AFTER the sweep to verify counts dropped to expected post-sweep targets.
 *
 * Created 2026-04-28 for the refactor/brands-ssot-cleanup branch.
 * Reference: wiki/audits/brands-audit-2026-04-28.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BRANDS_DIR = path.join(REPO_ROOT, 'src', 'pages', 'brands');

// ─── Walk the tree ───────────────────────────────────────────────────────────

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.astro')) files.push(full);
  }
}
walk(BRANDS_DIR);

// ─── Compliance checks ──────────────────────────────────────────────────────

const CHECKS = [
  {
    key: 'aggregateRating',
    label: 'aggregateRating in JSON-LD (SSOT rule 3 violation)',
    regex: /aggregateRating/,
    expected_baseline: 347,
    expected_after_sweep: 0,
  },
  {
    key: 'streetAddress',
    label: 'streetAddress in JSON-LD (SSOT rule 2 violation if PMB)',
    regex: /streetAddress/,
    expected_baseline: 332,
    expected_after_sweep: 0,
  },
  {
    key: 'pmbAddress',
    label: '6230 Wilshire Blvd Ste A PMB 2267 (legal-only address leak)',
    regex: /6230 Wilshire Blvd/,
    expected_baseline: 332,
    expected_after_sweep: 0,
  },
  {
    key: 'bodyRating',
    label: 'Body-visible numerical rating (SSOT rule 4 violation)',
    // Matches: "★ 4.6", "4.6 · 37", "4.6 / 37", "37 reviews", "37 Google reviews", "★★★★★ 4.6"
    regex: /★\s*4\.6|★★★★★|4\.6\s*[·•\/]\s*37|\b37\s+(reviews|Google\s+reviews|Google\s+rating|Commercial\s+Reviews)\b/i,
    expected_baseline: 338,
    expected_after_sweep: 0,
  },
  {
    key: 'mainPhoneImport',
    label: 'MAIN_PHONE / getBranchForCity import from branches.ts (SSOT rule 1 compliance)',
    regex: /import\s*\{[^}]*\b(MAIN_PHONE|getBranchForCity|BRANCHES|HEADQUARTERS|isPlaceholderPhone|SERVICE_AREAS|LEGAL_ADDRESS)\b[^}]*\}\s*from\s+['"][^'"]*\/data\/branches/,
    expected_baseline: 0,
    expected_after_sweep: '380 (or close — depends on Wave-2 architectural fix)',
  },
  {
    key: 'hardcoded323Phone',
    label: 'Hardcoded (323) 870-4790 (West Hollywood phone — wrong default for non-WeHo brand pages)',
    regex: /\(323\)\s*870-4790|tel:\+?1?-?\(?323\)?-?870-?4790/,
    expected_baseline: 294,
    expected_after_sweep: 'lower (depends on whether Wave 1 sweep replaces hardcoded phones with MAIN_PHONE)',
  },
  {
    key: 'localBusinessSchema',
    label: '"@type": "LocalBusiness" schema (legacy type — wiki canonical pattern)',
    regex: /"@type":\s*"LocalBusiness"/,
    expected_baseline: 347,
    expected_after_sweep: 'unchanged unless type-migration is part of sweep scope',
  },
  {
    key: 'brandHubPlaceholder',
    label: 'Uses BrandHubPlaceholder or BrandDetailPlaceholder component',
    regex: /BrandHubPlaceholder|BrandDetailPlaceholder/,
    expected_baseline: 32,
    expected_after_sweep: 'unchanged (placeholders fixed via component edit, not page edit)',
  },
  {
    key: 'patternBSchema',
    label: 'Pattern B schema injection (inline body <script>, not Fragment slot)',
    // Matches inline body <script type="application/ld+json"> NOT inside a <Fragment slot="head-scripts">.
    // Approximation: any page with `<script type="application/ld+json">` not preceded by `set:html=` on the same line.
    // This is rough — false-positives possible.
    regex: /<script\s+type="application\/ld\+json"\s*>(?![^<]*set:html)/,
    expected_baseline: '~30 (Pattern B files)',
    expected_after_sweep: 'depends on whether pattern migration is part of sweep',
  },
];

// ─── Run checks ─────────────────────────────────────────────────────────────

const counts = Object.fromEntries(CHECKS.map((c) => [c.key, 0]));
const matchingFiles = Object.fromEntries(CHECKS.map((c) => [c.key, []]));

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const check of CHECKS) {
    if (check.regex.test(content)) {
      counts[check.key]++;
      matchingFiles[check.key].push(path.relative(REPO_ROOT, file));
    }
  }
}

const total = files.length;
const pct = (n) => `${((n / total) * 100).toFixed(1)}%`;

// ─── Report ─────────────────────────────────────────────────────────────────

const isoDate = new Date().toISOString();
const branch = (() => {
  try {
    const headFile = path.join(REPO_ROOT, '.git', 'HEAD');
    const head = fs.readFileSync(headFile, 'utf8').trim();
    if (head.startsWith('ref: ')) return head.slice('ref: refs/heads/'.length);
    return head.slice(0, 8) + ' (detached)';
  } catch {
    return 'unknown';
  }
})();

console.log('=================================================================');
console.log(' Brands SSOT cleanup — file-level audit counter');
console.log('=================================================================');
console.log(`Date:            ${isoDate}`);
console.log(`Branch:          ${branch}`);
console.log(`Repo root:       ${REPO_ROOT}`);
console.log(`Brands dir:      ${path.relative(REPO_ROOT, BRANDS_DIR)}`);
console.log(`Total files:     ${total}`);
console.log('=================================================================');
console.log();

for (const check of CHECKS) {
  const got = counts[check.key];
  const baseline = check.expected_baseline;
  const after = check.expected_after_sweep;
  const status = (() => {
    if (typeof baseline !== 'number') return '   ';
    if (got === baseline) return ' ✓ ';
    return ' ⚠ ';
  })();

  console.log(`${status}${check.label}`);
  console.log(`     Match count:      ${got} of ${total} (${pct(got)})`);
  console.log(`     Baseline (audit): ${baseline}`);
  console.log(`     Target post-sweep: ${after}`);
  console.log();
}

console.log('=================================================================');
console.log(' Summary table (machine-parsable)');
console.log('=================================================================');
console.log('check,count,total,baseline,target_after_sweep');
for (const check of CHECKS) {
  console.log([check.key, counts[check.key], total, check.expected_baseline, check.expected_after_sweep]
    .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
    .join(','));
}
console.log();

// ─── Optional: emit file lists if --verbose flag is set ─────────────────────

if (process.argv.includes('--verbose')) {
  console.log('=================================================================');
  console.log(' Per-check file lists (--verbose)');
  console.log('=================================================================');
  for (const check of CHECKS) {
    console.log();
    console.log(`### ${check.key} — ${counts[check.key]} files`);
    for (const f of matchingFiles[check.key]) console.log(`  ${f}`);
  }
}

// Exit code: 0 if all numeric baselines match, 1 otherwise.
const baselineMismatch = CHECKS.some(
  (c) => typeof c.expected_baseline === 'number' && counts[c.key] !== c.expected_baseline,
);
process.exit(baselineMismatch ? 1 : 0);
