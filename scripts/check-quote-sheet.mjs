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

/**
 * Pull the DIAGNOSTIC_TERMS strings out of quote-copy.ts by scanning, not by
 * regex — the quoting inside those lines (apostrophes in "can't") makes a regex
 * fragile and this file is a gate, so it has to be dependable.
 */
function readTerms(src) {
  const open = src.indexOf('export const DIAGNOSTIC_TERMS = [');
  if (open === -1) return null;
  const close = src.indexOf('];', open);
  if (close === -1) return null;
  const body = src.slice(src.indexOf('[', open) + 1, close);
  const out = [];
  for (const rawLine of body.split(String.fromCharCode(10))) {
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) continue;
    const q = line[0];
    if (q !== "'" && q !== '"') continue;
    const last = line.lastIndexOf(q);
    if (last <= 0) continue;
    out.push(line.slice(1, last));
  }
  return out;
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

// ── 6. the three diagnostic terms ship byte-equal to the constants ───────────
{
  const terms = readTerms(copySrc);
  if (!terms) {
    check('DIAGNOSTIC_TERMS readable from quote-copy.ts', false, 'export not found');
  } else {
    check('DIAGNOSTIC_TERMS has exactly three lines', terms.length === 3, `found ${terms.length}`);
    for (const term of terms) {
      check(
        `term ships byte-equal on /book/: "${term.slice(0, 34)}…"`,
        html.includes(term),
        'not found in the built page'
      );
    }
    // The retired single-line clause must not linger anywhere in the built page.
    check(
      'old "Waived when you go ahead…" wording is gone',
      !html.includes('Waived when you go ahead with the repair')
    );
  }
}

// ── 6b. no forbidden marketing words in the sheet's own copy ─────────────────
{
  const FORBIDDEN = [
    'certified technicians', 'our team of experts', 'look no further', 'hassle-free',
    'peace of mind', 'second to none', 'top-of-the-line', 'hesitate to call',
    'we understand the urgency', 'trusted name in the industry',
    'passionate about delivering', 'your satisfaction is our priority',
  ];
  const copyLower = copySrc.toLowerCase();
  const hits = FORBIDDEN.filter((w) => copyLower.includes(w));
  check('no forbidden marketing phrases in quote-copy.ts', hits.length === 0, hits.join(', '));
}

// ── 6c. address verification: token, no raw hex, no eager Maps script ────────
{
  // The confirmation colour is a palette token, defined once.
  check('--color-ok is defined in the built page', /--color-ok:\s*#[0-9a-fA-F]{3,8}/.test(html));

  // …and the ok class consumes the token rather than repeating a hex value.
  const okRule = html.match(/\.qs-ok\s*\{[^}]*\}/);
  if (!okRule) {
    check('.qs-ok rule ships', false, 'rule not found in the built page');
  } else {
    check('.qs-ok uses var(--color-ok)', okRule[0].includes('var(--color-ok)'), okRule[0]);
    check('.qs-ok carries no raw hex colour', !/#[0-9a-fA-F]{3,8}/.test(okRule[0]), okRule[0]);
  }

  // The Maps library must never be a script tag in the initial HTML — the island
  // appends it, and only once step 6 is on screen.
  const eager = /<script[^>]*src=["']https:\/\/maps\.googleapis\.com/.test(html);
  check('Maps library is not a <script src> in the initial HTML', !eager);

  // The loader config (which carries the key) ships exactly once, and only here.
  const cfgCount = countMatches(html, /data-quote-sheet-maps/g);
  check('Maps loader config appears exactly once on /book/', cfgCount === 1, `found ${cfgCount}`);
}

// ── 7. canary containment: the sheet is on /book/ and nowhere else ───────────
{
  const distDir = path.join(ROOT, 'dist');
  const withSheet = [];
  const withKey = [];
  async function walk(dir) {
    for (const entry of await readdir(dir)) {
      const full = path.join(dir, entry);
      const s = await stat(full);
      if (s.isDirectory()) await walk(full);
      else if (entry.endsWith('.html')) {
        const body = await readFile(full, 'utf8');
        if (body.includes('id="quote-sheet"')) withSheet.push(path.relative(distDir, full));
        if (body.includes('data-quote-sheet-maps')) withKey.push(path.relative(distDir, full));
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
  const keyOnly =
    withKey.length === 1 && withKey[0].replace(/\\/g, '/') === 'book/index.html';
  check(
    'the Maps key ships on /book/ and nowhere else',
    keyOnly,
    `present on ${withKey.length} page(s): ${withKey.slice(0, 5).join(', ')}`
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
