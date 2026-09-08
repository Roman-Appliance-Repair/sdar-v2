#!/usr/bin/env node
// scripts/check-quote-sheet.mjs
//
// Static gate for the quote sheet. Runs against a built dist/ plus the component
// sources. Exits non-zero with a named failure on the first problem.
//
// QS-2 changed the shape of section 7: the sheet is no longer a /book/ canary, so
// the rule flipped from "on one page and nowhere else" to "on every real page,
// exactly once, with a blob that parses". Redirect emissions are excluded and
// counted, so the exclusion cannot quietly swallow a real page.
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
  path.join(ROOT, 'src', 'data', 'quote-context.ts'),
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
    check('21 commercial appliance tiles', tiles.commercial.length === 21, `${tiles.commercial.length}`);

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

    // QS-2 moved the tiles out of the per-page blob and into the lazily-loaded
    // island chunk — 1197 pages do not each need 12 KB of tiles inlined. So the
    // proof that they reach the browser now lives in the chunk.
    const chunkDir = path.join(ROOT, 'dist', '_astro');
    const chunkName = (await readdir(chunkDir)).find(
      (f) => f.startsWith('QuoteSheet.client.') && f.endsWith('.js')
    );
    check('the island chunk is built', Boolean(chunkName), 'no QuoteSheet.client.*.js in dist/_astro');
    if (chunkName) {
      // Follow the chunk's own imports. AID-2 gave quote-appliances a second
      // importer, so Rollup split the tiles into a shared chunk — the ids still
      // reach the browser on the first click, one file further along. Reading the
      // entry chunk alone would have called that a regression; reading the graph
      // asks the question that actually matters, which is whether they ship.
      const seen = new Set();
      const parts = [];
      const walk = async (name) => {
        if (!name || seen.has(name)) return;
        seen.add(name);
        let text;
        try {
          text = await readFile(path.join(chunkDir, name), 'utf8');
        } catch {
          return;
        }
        parts.push(text);
        for (const m of text.matchAll(/from"\.\/([\w.-]+\.js)"|import"\.\/([\w.-]+\.js)"/g)) {
          await walk(m[1] || m[2]);
        }
      };
      await walk(chunkName);
      const chunk = parts.join(String.fromCharCode(10));
      check('the island chunk graph resolved', seen.size >= 1, String(seen.size));
      const notShipped = all.filter((a) => !chunk.includes(`"${a.id}"`));
      check(
        'every appliance id ships in the island chunk',
        notShipped.length === 0,
        notShipped.map((a) => a.id).join(', ')
      );
      check(
        'the tiles are NOT inlined into the page blob',
        !html.includes('"other_residential"'),
        'appliance ids found in /book/ HTML — the per-page blob grew back'
      );
    }
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

// ── 6f. /api/diagnose: English-only prompt, honeypot, rate limit ────────────
// Lives in this gate rather than its own because this is the file `npm run verify`
// already runs against the built site, and a check nobody runs is not a check.
{
  const src = await readFile(path.join(ROOT, 'functions', 'api', 'diagnose.js'), 'utf8');

  // The system prompt used to order a Russian sentence into a reply the same
  // prompt declares English-only, so every working verdict printed Cyrillic to an
  // English-speaking customer. Nothing in this file may carry it again.
  const cyrillic = [...src].filter((c) => c >= 'Ѐ' && c <= 'ӿ');
  check(
    'no Cyrillic in the diagnose prompt',
    cyrillic.length === 0,
    `${cyrillic.length} character(s), e.g. ${cyrillic.slice(0, 12).join('')}`
  );

  check('diagnose honeypot is wired', /function isBot\(/.test(src) && /isBot\(payload\)/.test(src));
  check(
    'diagnose is rate limited',
    /isRateLimited\(env, clientIp\(request\)\)/.test(src) && /RATE_LIMIT_MAX = 5/.test(src)
  );
  check('diagnose caps the description length', /MAX_DESCRIPTION = \d+/.test(src));

  // The outage this gate exists for: a retired model id served every visitor an
  // error fallback, and nothing failed loudly. The check reads the CONSTANT, not
  // the file — the comment above it names the dead id on purpose, so anyone
  // grepping for the outage lands on the explanation.
  const m = src.match(/const MODEL = '([^']+)'/);
  check('the model id is named in one place', Boolean(m), 'no `const MODEL =` found');
  check(
    'the model id is not the retired one',
    Boolean(m) && m[1] !== 'claude-sonnet-4-20250514',
    m ? `MODEL = ${m[1]}` : ''
  );

  // The island has to send the field the API checks, or the honeypot guards nothing.
  const island = await readFile(path.join(ROOT, 'src', 'components', 'AIDiagnostic.jsx'), 'utf8');
  check('the island sends the honeypot field', /website: form\.website/.test(island));
  check(
    'the island reports to GA4',
    ['aid_open', 'aid_step', 'aid_contact_submitted', 'aid_verdict_shown',
     'aid_book_click', 'aid_callback_click', 'aid_call_click'].every((e) => island.includes(e)),
    'one or more aid_* events missing'
  );
}

// ── 7. QS-2 site-wide mount: one sheet on every real page, nowhere twice ─────
{
  const distDir = path.join(ROOT, 'dist');
  const pages = [];
  async function walk(dir) {
    for (const entry of await readdir(dir)) {
      const full = path.join(dir, entry);
      const s = await stat(full);
      if (s.isDirectory()) await walk(full);
      else if (entry.endsWith('.html')) {
        const body = await readFile(full, 'utf8');
        const rel = path.relative(distDir, full).split(path.sep).join('/');
        // Astro's redirect emissions do not use Layout.astro and carry no sheet.
        // They are not pages a visitor reads — excluded on purpose, and counted so
        // the exclusion can never quietly swallow a real page.
        // public/ carries a couple of raw verification files that are .html in name
        // only — no document, no layout, no sheet. A rendered page has a </body>.
        if (!/<\/body>/i.test(body)) continue;
        pages.push({ rel, body, stub: /http-equiv=["']refresh["']/i.test(body) });
      }
    }
  }
  await walk(distDir);

  const real = pages.filter((p) => !p.stub);
  const stubs = pages.filter((p) => p.stub);

  // 1197 index.html routes + 404.html, which is a real Astro page and carries the
  // sheet like any other.
  check('dist contains the expected 1198 rendered pages', real.length === 1198, `found ${real.length}`);
  check('redirect stubs are still emitted', stubs.length > 0, `${stubs.length}`);

  const dialogCount = (b) => (b.match(/<dialog\b[^>]*\bid="quote-sheet"/g) || []).length;
  const wrong = real.filter((p) => dialogCount(p.body) !== 1);
  check(
    'every real page carries exactly one quote-sheet dialog',
    wrong.length === 0,
    wrong.slice(0, 6).map((p) => `${p.rel}=${dialogCount(p.body)}`).join(', ')
  );

  // /book/ used to mount its own alongside the layout's. The dedupe is the single
  // most likely thing to regress, so it gets its own named check.
  const book = real.find((p) => p.rel === 'book/index.html');
  check('/book/ mounts the sheet once, not twice', book ? dialogCount(book.body) === 1 : false,
    book ? `found ${dialogCount(book.body)}` : '/book/ missing');

  // The loader is the component's own inline <script>, which Astro bundles to a
  // hashed module under this name. Without it a /book/ link is just a link.
  const LOADER = /src="\/_astro\/QuoteSheet\.astro_astro_type_script[^"]*\.js"/;
  const noLoader = real.filter((p) => !LOADER.test(p.body));
  check(
    'every real page ships the trigger loader',
    noLoader.length === 0,
    `${noLoader.length} page(s), e.g. ${noLoader.slice(0, 3).map((p) => p.rel).join(', ')}`
  );

  // One JSON blob per page, and it must actually parse — an unparseable blob means
  // the sheet cannot open at all, and nothing else on the page would show it.
  let badBlob = [];
  let noBlob = [];
  for (const p of real) {
    const m = p.body.match(/<script type="application\/json" id="qs-data">([\s\S]*?)<\/script>/g) || [];
    if (m.length !== 1) {
      noBlob.push(`${p.rel}=${m.length}`);
      continue;
    }
    const inner = m[0].replace(/^[\s\S]*?>/, '').replace(/<\/script>$/, '');
    try {
      const parsed = JSON.parse(inner);
      if (!parsed.context || typeof parsed.context.pageType !== 'string') badBlob.push(p.rel);
    } catch {
      badBlob.push(p.rel);
    }
  }
  check('exactly one #qs-data blob per real page', noBlob.length === 0, noBlob.slice(0, 6).join(', '));
  check('every blob parses and carries a pageType', badBlob.length === 0, badBlob.slice(0, 6).join(', '));

  // QS-2 changed this from a canary rule to a site-wide one: the Maps config now
  // ships everywhere the sheet does, because step 6 exists on every page.
  //  at the end, or `data-quote-sheet-maps-gone` counts as the real attribute —
  // which is exactly how the first version of this check went blind.
  const MAPS_CFG = /data-quote-sheet-maps(?![\w-])/g;
  const cfgCount = (b) => (b.match(MAPS_CFG) || []).length;
  const wrongKey = real.filter((p) => cfgCount(p.body) !== 1);
  check(
    'every real page ships exactly one Maps loader config',
    wrongKey.length === 0,
    wrongKey.slice(0, 6).map((p) => `${p.rel}=${cfgCount(p.body)}`).join(', ')
  );
  const stubsWithKey = stubs.filter((p) => cfgCount(p.body) > 0);
  check('redirect stubs carry no Maps key', stubsWithKey.length === 0, `${stubsWithKey.length}`);

  const eager = real.filter((p) => /<script[^>]*src=["']https:\/\/maps\.googleapis\.com/.test(p.body));
  check('no page loads the Maps library eagerly', eager.length === 0,
    eager.slice(0, 3).map((p) => p.rel).join(', '));
}

// ── 7b. QS-2 context coverage: the table, and the floor under it ─────────────
{
  const { realPages, readBlob } = await import(
    'file://' + path.join(ROOT, 'scripts', 'quote-context-report.mjs').split(path.sep).join('/')
  );
  const pages = await realPages();
  const byType = new Map();
  for (const { url, html: body } of pages) {
    const blob = readBlob(body);
    const ctx = (blob && blob.context) || {};
    const t = ctx.pageType || 'unknown';
    const r = byType.get(t) || { pages: 0, scope: 0, appliance: 0 };
    r.pages++;
    if (ctx.scope) r.scope++;
    if (ctx.appliance) r.appliance++;
    byType.set(t, r);
    if (url === '/') check('the homepage resolves to no context', !ctx.scope && !ctx.appliance);
  }

  const g = (t) => byType.get(t) || { pages: 0, scope: 0, appliance: 0 };

  // Floors, not exact numbers. Page counts move when content ships; a mapping that
  // silently stops resolving does not, and that is what these catch.
  check('city_service: every page resolves a scope', g('city_service').scope === g('city_service').pages,
    `${g('city_service').scope}/${g('city_service').pages}`);
  check('city_service: every page resolves an appliance',
    g('city_service').appliance === g('city_service').pages,
    `${g('city_service').appliance}/${g('city_service').pages}`);
  check('service_sub: every page resolves an appliance',
    g('service_sub').appliance === g('service_sub').pages,
    `${g('service_sub').appliance}/${g('service_sub').pages}`);
  check('commercial pages all resolve commercial scope',
    g('commercial_hub').scope === g('commercial_hub').pages &&
      g('commercial_sub').scope === g('commercial_sub').pages &&
      g('commercial_brand').scope === g('commercial_brand').pages,
    'a commercial page resolved no scope');
  // QS-3a floors. Set just under what this build reaches, so a mapping regression
  // trips them and ordinary content growth does not.
  const floor = (t, pctWanted) =>
    check(
      `${t}: at least ${pctWanted}% of pages resolve an appliance`,
      g(t).pages === 0 || g(t).appliance / g(t).pages >= pctWanted / 100,
      `${g(t).appliance}/${g(t).pages}`
    );
  floor('commercial_sub', 80);
  floor('commercial_brand', 65);
  floor('commercial_hub', 70);

  // A floor is a mass-regression alarm: one page out of twenty-four moves it by 4%,
  // so it cannot see a single slug stop resolving. These name the pages the QS-3a
  // tiles were added FOR, one assertion each, so losing any single mapping is loud.
  // Bar fridge and proofer are absent on purpose — both are real catalog services
  // with no page of their own, so there is nothing here to assert against.
  const QS3A_PAGES = [
    ['/commercial/mixer-repair/', 'mixer'],
    ['/commercial/steamer-repair/', 'steamer'],
    ['/commercial/oven-repair/combi-oven-repair/', 'steamer'],
    ['/commercial/holding-cabinet-repair/', 'holding_cabinet'],
    ['/commercial/grill-repair/', 'grill_charbroiler'],
    ['/commercial/charbroiler-repair/', 'grill_charbroiler'],
    ['/commercial/exhaust-hood-repair/', 'commercial_range_hood'],
    ['/commercial/slicer-repair/', 'slicer'],
    ['/commercial/kettle-repair/', 'kettle'],
    ['/commercial/kettle-repair/brands/groen/', 'kettle'],
    ['/commercial/food-processor-repair/', 'food_processor'],
    ['/commercial/food-processor-repair/brands/robot-coupe/', 'food_processor'],
    ['/brands/rational-combi-oven-repair/', 'steamer'],
    ['/brands/accurex-hood-repair/', 'commercial_range_hood'],
  ];
  const byUrl = new Map(pages.map((p) => [p.url, p]));
  for (const [url, want] of QS3A_PAGES) {
    const page = byUrl.get(url);
    if (!page) {
      check(`QS-3a page still exists: ${url}`, false, 'not in dist');
      continue;
    }
    const ctx = (readBlob(page.html) || {}).context || {};
    check(
      `${url} prefills ${want}`,
      ctx.appliance === want && ctx.scope === 'commercial',
      `got ${ctx.scope} / ${ctx.appliance}`
    );
  }

  check('outdoor pages all resolve residential scope',
    g('outdoor').scope === g('outdoor').pages, `${g('outdoor').scope}/${g('outdoor').pages}`);
  check('city pillars resolve nothing (mixed scope by nature)',
    g('city').scope === 0 && g('city').appliance === 0);
  check('blog resolves nothing', g('blog').scope === 0 && g('blog').appliance === 0);
  check('brand pages resolve a brand on most of the tree',
    g('brand').pages > 0, `${g('brand').pages} brand page(s)`);

  const total = [...byType.values()].reduce((a, r) => a + r.pages, 0);
  const scoped = [...byType.values()].reduce((a, r) => a + r.scope, 0);
  const applianced = [...byType.values()].reduce((a, r) => a + r.appliance, 0);
  // The site-wide floor. Set just under what this build achieves, so a mapping
  // regression trips it and ordinary content growth does not.
  check('site-wide scope coverage is at least 50%', scoped / total >= 0.5,
    `${((scoped / total) * 100).toFixed(1)}%`);
  check('site-wide appliance coverage is at least 30%', applianced / total >= 0.3,
    `${((applianced / total) * 100).toFixed(1)}%`);
}

// ── 8. AID-2: the hero card, its sheet, and the handoff map ──────────────────
{
  const home = await readFile(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const cardSrc = await readFile(path.join(ROOT, 'src', 'components', 'AIDiagnosticCard.astro'), 'utf8');
  const sheetSrc = await readFile(path.join(ROOT, 'src', 'components', 'AIDiagnosticSheet.astro'), 'utf8');
  const clientSrc = await readFile(path.join(ROOT, 'src', 'components', 'AIDiagnosticSheet.client.ts'), 'utf8');
  const mapSrc = await readFile(path.join(ROOT, 'src', 'data', 'aid-to-quote-map.ts'), 'utf8');
  const islandSrc = await readFile(path.join(ROOT, 'src', 'components', 'AIDiagnostic.jsx'), 'utf8');
  const applSrc = await readFile(path.join(ROOT, 'src', 'data', 'quote-appliances.ts'), 'utf8');
  const qsClient = await readFile(path.join(ROOT, 'src', 'components', 'QuoteSheet.client.ts'), 'utf8');
  const contactSrc = await readFile(path.join(ROOT, 'functions', 'api', 'contact.js'), 'utf8');

  // -- the homepage carries one of each sheet, and one card -------------------
  check(
    'homepage has exactly one aid-sheet dialog',
    countMatches(home, /<dialog[^>]*id="aid-sheet"/g) === 1,
    String(countMatches(home, /<dialog[^>]*id="aid-sheet"/g))
  );
  check(
    'homepage still has exactly one quote-sheet dialog',
    countMatches(home, /<dialog[^>]*id="quote-sheet"/g) === 1,
    String(countMatches(home, /<dialog[^>]*id="quote-sheet"/g))
  );
  check(
    'homepage has exactly one diagnostic card',
    countMatches(home, /data-aid-card/g) === 1,
    String(countMatches(home, /data-aid-card/g))
  );
  check('the card carries a real input', /id="aid-card-input"/.test(home));
  check(
    'the card button is a link to /ai-diagnostic/ with JS off',
    /<a[^>]+href="\/ai-diagnostic\/"[^>]*class="aid-card-btn"/.test(home) ||
      /<a[^>]+class="aid-card-btn"[^>]*href="\/ai-diagnostic\/"/.test(home)
  );

  // -- no React on the homepage until the card is used ------------------------
  // The island is mounted by hand from a dynamically imported chunk. If anyone
  // wires it as a client: directive instead, Astro emits <astro-island> with a
  // renderer-url and the homepage starts paying for React on every visit.
  check('homepage ships no astro-island', !/<astro-island/.test(home), 'an island is hydrating on load');
  check('homepage ships no renderer-url', !/renderer-url=/.test(home));
  check(
    'the sheet loader imports its chunk dynamically',
    /import\(\s*['"]\.\/AIDiagnosticSheet\.client['"]\s*\)/.test(sheetSrc)
  );
  check(
    'the sheet chunk is prefetched on pointerenter and touchstart',
    /pointerenter/.test(sheetSrc) && /touchstart/.test(sheetSrc)
  );
  check('the island is mounted with createRoot, not a client: directive', /createRoot/.test(clientSrc));
  check(
    'no client: directive on AIDiagnostic outside its own page',
    !/AIDiagnostic[^\n]*client:/.test(
      await readFile(path.join(ROOT, 'src', 'pages', 'index.astro'), 'utf8')
    )
  );

  // -- tap targets and the iOS zoom rule --------------------------------------
  check('the card button is at least 52px tall', /min-height:\s*52px/.test(cardSrc));
  check('the card input is 16px, so iOS does not zoom the hero', /font-size:\s*16px/.test(cardSrc));

  // -- copy ------------------------------------------------------------------
  {
    const FORBIDDEN = [
      'certified technicians', 'our team of experts', 'look no further', 'hassle-free',
      'peace of mind', 'second to none', 'top-of-the-line', 'hesitate to call',
      'we understand the urgency', 'trusted name in the industry',
      'passionate about delivering', 'your satisfaction is our priority',
    ];
    const lower = cardSrc.toLowerCase();
    const hits = FORBIDDEN.filter((w) => lower.includes(w));
    check('no forbidden marketing phrases in the card copy', hits.length === 0, hits.join(', '));
  }

  // -- the island's one new prop, and the attributes the handoff reads --------
  check('the island takes initialDetail', /initialDetail\s*=\s*""/.test(islandSrc));
  check(
    'initialDetail seeds step 4 detail and nothing else',
    /\.\.\.initialForm,\s*detail:\s*initialDetail/.test(islandSrc)
  );
  for (const attr of ['data-aid-category', 'data-aid-appliance', 'data-aid-symptom', 'data-aid-detail']) {
    check(`the verdict's Book Online link carries ${attr}`, islandSrc.includes(attr));
  }
  check('the verdict link is still a real link to /book/', /href="\/book\/"/.test(islandSrc));

  // -- the handoff is wired end to end ---------------------------------------
  check('the handoff writes the quote sheet session key', /sdar_qs_v1/.test(clientSrc));
  check('the handoff marks the lead as ai-diagnostic', /'ai-diagnostic'/.test(clientSrc));
  check('the handoff reports aid_handoff_to_quote', /aid_handoff_to_quote/.test(clientSrc));
  check('the card reports aid_card_open', /aid_card_open/.test(clientSrc));
  check('the quote sheet lets a handoff name its own source', /aidHandoff\s*\?\s*'ai-diagnostic'/.test(qsClient));
  check('the quote payload carries aid_handoff', /aid_handoff:\s*state\.aidHandoff/.test(qsClient));
  check("the dispatch card prints 'From AI diagnostic'", /From AI diagnostic/.test(contactSrc));

  // -- the map itself: every pair has to be real ------------------------------
  const tiles = {};
  {
    const re = /id:\s*'([a-z_]+)',\s*\r?\n\s*label:\s*(?:'([^']*)'|ELSE),\s*\r?\n\s*problems:\s*\[([\s\S]*?)\n\s*\],/g;
    let m;
    while ((m = re.exec(applSrc))) {
      const probs = [...m[3].matchAll(/'((?:[^'\\]|\\.)*)'|"([^"]*)"/g)].map((x) =>
        (x[1] ?? x[2]).replace(/\\'/g, "'")
      );
      tiles[m[1]] = probs;
    }
  }
  check('the tile table parsed', Object.keys(tiles).length >= 30, String(Object.keys(tiles).length));

  /** Pull a `label: 'value'` style record literal out of the map source. */
  function recordBlock(src, name) {
    const at = src.indexOf(name);
    if (at === -1) return null;
    const open = src.indexOf('{', at);
    const close = src.indexOf('\n};', open);
    return close === -1 ? null : src.slice(open + 1, close);
  }
  const applBlock = recordBlock(mapSrc, 'export const APPLIANCE_TO_QUOTE_ID');
  const mapped = {};
  for (const m of (applBlock || '').matchAll(/(?:'([^']+)'|([A-Za-z_][\w]*)):\s*'([a-z_]+)'/g)) {
    mapped[m[1] || m[2]] = m[3];
  }
  check('APPLIANCE_TO_QUOTE_ID parsed', Object.keys(mapped).length >= 20, String(Object.keys(mapped).length));

  const badIds = Object.entries(mapped).filter(([, id]) => !tiles[id]);
  check(
    'every mapped appliance points at a tile that exists',
    badIds.length === 0,
    badIds.map(([l, i]) => `${l}->${i}`).join(', ')
  );

  // The diagnostic's own appliance list, from the island.
  const diagLabels = new Set();
  {
    const block = islandSrc.split('const APPLIANCES_BY_CATEGORY = {')[1].split('};')[0];
    for (const m of block.matchAll(/"([^"]+)"/g)) diagLabels.add(m[1]);
  }
  check('the diagnostic appliance list parsed', diagLabels.size >= 30, String(diagLabels.size));

  const ghosts = Object.keys(mapped).filter((l) => !diagLabels.has(l));
  check(
    'no mapped label is missing from the diagnostic itself',
    ghosts.length === 0,
    ghosts.join(', ')
  );

  const unmapped = [...(mapSrc.split('UNMAPPED_APPLIANCES')[1] || '').split('];')[0].matchAll(/'([^']+)'/g)].map(
    (m) => m[1]
  );
  const both = unmapped.filter((l) => mapped[l]);
  check('nothing is both mapped and declared unmapped', both.length === 0, both.join(', '));

  // Completeness. This is the one that catches a new appliance being added to the
  // diagnostic and silently falling through the handoff — it must be mapped or
  // named as deliberately unmapped, never merely absent.
  const orphans = [...diagLabels].filter((l) => !mapped[l] && !unmapped.includes(l));
  check(
    'every diagnostic appliance is either mapped or listed as unmapped',
    orphans.length === 0,
    orphans.join(', ')
  );

  // Every alias must land on words the tile actually offers, or the sheet would
  // pre-select a problem that has no tile and the step would render empty.
  const aliasBlock = mapSrc.split('export const SYMPTOM_ALIASES')[1] || '';
  const badAlias = [];
  {
    const perTile = aliasBlock.split(/\n  ([a-z_]+):\s*\{/);
    for (let i = 1; i < perTile.length; i += 2) {
      const id = perTile[i];
      const body = perTile[i + 1].split('\n  }')[0];
      for (const m of body.matchAll(/(?:'([^']+)'|([A-Za-z][\w]*)):\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)")/g)) {
        const value = (m[3] ?? m[4]).replace(/\\'/g, "'");
        if (!tiles[id]) badAlias.push(`${id}: no such tile`);
        else if (!tiles[id].includes(value)) badAlias.push(`${id}: "${value}"`);
      }
    }
  }
  check('every symptom alias exists verbatim in its tile', badAlias.length === 0, badAlias.join(' | '));
}

// ── report ───────────────────────────────────────────────────────────────────
if (failures.length) {
  console.error(`\ncheck-quote-sheet: ${failures.length} FAILED, ${passes.length} passed\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`check-quote-sheet: ${passes.length}/${passes.length} passed`);
