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

// ── 6d. appliance + symptom tiles: shape, counts, provenance ────────────────
{
  // Imported rather than regex-scraped: the file is TypeScript with a type
  // annotation on every export, and a gate that parses its own source with a
  // regex is a gate that goes quiet the day someone reformats the file.
  const mod = await import(
    'file://' + path.join(ROOT, 'src', 'data', 'quote-appliances.ts').split(path.sep).join('/')
  ).catch(() => null);

  const tiles = mod
    ? { residential: mod.RESIDENTIAL_APPLIANCES, commercial: mod.COMMERCIAL_APPLIANCES }
    : null;
  const sources = mod ? mod.APPLIANCE_SOURCES : null;

  check('quote-appliances.ts is importable', Boolean(tiles), 'import failed');

  if (tiles) {
    check('16 residential appliance tiles', tiles.residential.length === 16, `${tiles.residential.length}`);
    check('11 commercial appliance tiles', tiles.commercial.length === 11, `${tiles.commercial.length}`);

    const all = [...tiles.residential, ...tiles.commercial];

    const ids = all.map((a) => a.id);
    check('every appliance id is unique', new Set(ids).size === ids.length, ids.join(', '));

    // The two ids QS-1.5 retired when their tiles split in two. Reusing either
    // would silently repoint every lead already filed under it.
    const retired = ids.filter((id) => id === 'oven_range' || id === 'walk_in_reach_in');
    check('retired ids stay retired', retired.length === 0, retired.join(', '));

    const badCount = all.filter((a) => a.problems.length < 10 || a.problems.length > 12);
    check(
      'every appliance carries 10-12 symptoms',
      badCount.length === 0,
      badCount.map((a) => `${a.id}=${a.problems.length}`).join(', ')
    );

    const notLast = all.filter((a) => a.problems[a.problems.length - 1] !== 'Something else');
    check(
      '"Something else" is the last symptom everywhere',
      notLast.length === 0,
      notLast.map((a) => a.id).join(', ')
    );

    const dupSymptoms = all.filter((a) => new Set(a.problems).size !== a.problems.length);
    check(
      'no appliance repeats a symptom',
      dupSymptoms.length === 0,
      dupSymptoms.map((a) => a.id).join(', ')
    );

    for (const scope of ['residential', 'commercial']) {
      const list = tiles[scope];
      const last = list[list.length - 1];
      check(
        `"Something else" is the last ${scope} appliance tile`,
        last.label === 'Something else',
        last.label
      );
    }

    // Provenance: no tile for equipment the site does not claim to service.
    const orphans = all.filter((a) => !sources || !Array.isArray(sources[a.id]) || !sources[a.id].length);
    check(
      'every appliance tile names its source in APPLIANCE_SOURCES',
      orphans.length === 0,
      orphans.map((a) => a.id).join(', ')
    );

    // …and the catalog slugs it names actually exist in service-catalog.ts.
    const catalogSrc = await readFile(path.join(ROOT, 'src', 'data', 'service-catalog.ts'), 'utf8');
    const named = [...new Set(Object.values(sources || {}).flat())].filter((x) => !x.includes(':'));
    const missing = named.filter((slug) => !catalogSrc.includes(`id: '${slug}'`));
    check(
      'every named catalog slug exists in service-catalog.ts',
      missing.length === 0,
      missing.join(', ')
    );

    // The tiles reach the browser: labels ship inside the serialised #qs-data blob.
    const notShipped = all.filter((a) => !html.includes(`"id":"${a.id}"`));
    check(
      'every appliance id ships in the /book/ payload',
      notShipped.length === 0,
      notShipped.map((a) => a.id).join(', ')
    );
  }
}

// ── 6e. ZIP from Google: copy present, Details stays Essentials ─────────────
{
  check(
    'ZIP_COPY carries the "from Google" marker',
    /fromGoogle:\s*'from Google'/.test(copySrc)
  );
  check(
    'the ZIP disagreement note is templated on {zip}',
    /mismatch:\s*"That ZIP doesn't match the address you picked — we'll go with \{zip\}"/.test(copySrc)
  );

  const clientSrc = await readFile(
    path.join(ROOT, 'src', 'components', 'QuoteSheet.client.ts'),
    'utf8'
  );
  const call = clientSrc.match(/fetchFields\(\{\s*fields:\s*\[([^\]]*)\]/);
  check('Place Details is called with an explicit field list', Boolean(call), 'call not found');
  if (call) {
    const fields = call[1]
      .split(',')
      .map((f) => f.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
    check(
      'Place Details requests formattedAddress + addressComponents only',
      fields.length === 2 &&
        fields.includes('formattedAddress') &&
        fields.includes('addressComponents'),
      fields.join(', ')
    );
  }

  check(
    'the payload carries zip_google and zip_typed',
    clientSrc.includes('zip_google: state.zipFromGoogle') &&
      clientSrc.includes('zip_typed: state.zip'),
    'one or both missing'
  );
  check(
    'routing runs on the effective ZIP, not the typed field',
    !/zipToBranch\(state\.zip\)/.test(clientSrc) && clientSrc.includes('zipToBranch(effectiveZip())'),
    'zipToBranch still reads state.zip'
  );

  const apiSrc = await readFile(path.join(ROOT, 'functions', 'api', 'contact.js'), 'utf8');
  check(
    'the dispatcher card labels the ZIP source',
    apiSrc.includes("' (Google)'") && apiSrc.includes("' (typed)'"),
    'card does not distinguish the two'
  );
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
