#!/usr/bin/env node
// scripts/check-quote-sheet.mjs
//
// Static gate for the QS-1 quote sheet. Runs against a built dist/ plus the
// component sources. Exits non-zero with a named failure on the first problem.
//
// Usage:
//   node scripts/check-quote-sheet.mjs
//   node scripts/check-quote-sheet.mjs --verbose

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const PAGE = path.join(ROOT, 'dist', 'book', 'index.html');
const COPY_TS = path.join(ROOT, 'src', 'data', 'quote-copy.ts');
const SHEET_SOURCES = [
  path.join(ROOT, 'src', 'components', 'QuoteSheet.astro'),
  path.join(ROOT, 'src', 'components', 'QuoteSheet.client.ts'),
  path.join(ROOT, 'src', 'components', 'QuoteFallbackForm.astro'),
];
const VERBOSE = process.argv.includes('--verbose');

const failures = [];
const passes = [];

function check(name, condition, detail = '') {
  if (condition) {
    passes.push(name);
    if (VERBOSE) console.log(`  ok    ${name}`);
  } else {
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
  }
}

function countMatches(haystack, re) {
  return (haystack.match(re) || []).length;
}

const html = await readFile(PAGE, 'utf8');
const copySrc = await readFile(COPY_TS, 'utf8');

// ── 1. exactly one <dialog id="quote-sheet"> ─────────────────────────────────
const dialogs = countMatches(html, /<dialog\b[^>]*\bid="quote-sheet"/g);
check('one <dialog id="quote-sheet"> on /book/', dialogs === 1, `found ${dialogs}`);

// ── 2. exactly one <h1> ──────────────────────────────────────────────────────
const h1s = countMatches(html, /<h1\b/g);
check('exactly one <h1> on /book/', h1s === 1, `found ${h1s}`);

// ── 3. exactly one fallback form ─────────────────────────────────────────────
const forms = countMatches(html, /<form\b[^>]*\bid="qs-fallback-form"/g);
check('one fallback form on /book/', forms === 1, `found ${forms}`);

// ── 4. honeypot is the last field in the fallback form ───────────────────────
{
  const m = html.match(/<form\b[^>]*id="qs-fallback-form"[\s\S]*?<\/form>/);
  if (!m) {
    check('honeypot is last in the fallback form', false, 'form not found');
  } else {
    const inner = m[0];
    const fields = [...inner.matchAll(/<(input|textarea|select|button)\b[^>]*>/g)];
    const last = fields[fields.length - 1]?.[0] || '';
    const isHoneypot = /name="website"/.test(last);
    const hidden = /display:\s*none/.test(last);
    check('honeypot is last in the fallback form', isHoneypot, `last field was ${last.slice(0, 60)}`);
    check('honeypot is display:none', hidden, 'honeypot lacks display:none');
    check(
      'fallback form posts to /api/contact without JS',
      /method="post"/i.test(inner) && /action="\/api\/contact"/.test(inner),
      'missing method/action'
    );
  }
}

// ── 5. no currency literals in the sheet sources ─────────────────────────────
for (const file of SHEET_SOURCES) {
  const src = await readFile(file, 'utf8');
  const hits = [...src.matchAll(/\$\d/g)];
  check(
    `no currency literal in ${path.relative(ROOT, file)}`,
    hits.length === 0,
    hits.length ? `${hits.length} occurrence(s)` : ''
  );
}

// ── 6. waived clause is byte-equal to the constant ───────────────────────────
{
  const m = copySrc.match(/export const WAIVED_CLAUSE\s*=\s*'([^']*)'/);
  if (!m) {
    check('WAIVED_CLAUSE readable from quote-copy.ts', false, 'export not found');
  } else {
    const clause = m[1];
    const inPage = html.includes(clause);
    check('waived clause ships byte-equal on /book/', inPage, `looked for ${JSON.stringify(clause)}`);
    // and nothing that only nearly matches it
    const nearMiss = /Waived (?!when you go ahead with the repair)/.test(html);
    check('no divergent "Waived …" wording on /book/', !nearMiss);
  }
}

// ── 7. canary containment: the sheet is on /book/ and nowhere else ───────────
{
  const distDir = path.join(ROOT, 'dist');
  const withSheet = [];
  async function walk(dir) {
    for (const entry of await readdir(dir)) {
      const full = path.join(dir, entry);
      const s = await stat(full);
      if (s.isDirectory()) await walk(full);
      else if (entry.endsWith('.html')) {
        const body = await readFile(full, 'utf8');
        if (body.includes('id="quote-sheet"')) withSheet.push(path.relative(distDir, full));
      }
    }
  }
  await walk(distDir);
  const only = withSheet.length === 1 && withSheet[0].replace(/\\/g, '/') === 'book/index.html';
  check(
    'quote sheet is canaried to /book/ only',
    only,
    `present on ${withSheet.length} page(s): ${withSheet.slice(0, 5).join(', ')}`
  );
}

// ── report ───────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\ncheck-quote-sheet: ${failures.length} FAILED, ${passes.length} passed\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`check-quote-sheet: ${passes.length}/${passes.length} passed`);
