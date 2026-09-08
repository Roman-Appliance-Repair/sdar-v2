#!/usr/bin/env node
// scripts/verify-quote-gates.mjs
//
// Gate self-check: proves the QS-1 gates actually fail when the thing they guard
// is broken. For each mutation it backs the file up, breaks one specific thing,
// runs the gate, asserts a NON-zero exit, and restores the file.
//
// A gate that cannot fail is not a gate. Run this after touching either gate.
//
// Usage: node scripts/verify-quote-gates.mjs

import { readFile, writeFile, copyFile, unlink, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = process.cwd();
const PAGE = path.join(ROOT, 'dist', 'book', 'index.html');
const CLIENT_SRC = path.join(ROOT, 'src', 'components', 'QuoteSheet.client.ts');
const COPY_TS = path.join(ROOT, 'src', 'data', 'quote-copy.ts');
const APPL_TS = path.join(ROOT, 'src', 'data', 'quote-appliances.ts');
const CONTEXT_TS = path.join(ROOT, 'src', 'data', 'quote-context.ts');
// A blog post: proves the mount reaches pages served through BlogLayout, not just
// the ones that use Layout.astro directly.
const BLOG_PAGE = path.join(ROOT, 'dist', 'blog', 'index.html');
// A brand combo page: its appliance comes from the category suffix in its own slug.
const BRAND_COMBO_PAGE = path.join(ROOT, 'dist', 'brands', 'lg-washer-repair', 'index.html');
// A QS-3a page: /commercial/mixer-repair/ had no tile at all before this wave.
const COMMERCIAL_HUB_PAGE = path.join(ROOT, 'dist', 'commercial', 'mixer-repair', 'index.html');
// A /services/ sub-page: its appliance is inherited from the parent hub, so it is
// the row the coverage floor watches most closely.
const SERVICE_SUB_PAGE = path.join(
  ROOT, 'dist', 'services', 'refrigerator-repair', 'not-cooling', 'index.html'
);

const STATIC_GATE = ['scripts/check-quote-sheet.mjs'];
const SMOKE_GATE = ['scripts/smoke-quote-sheet.mjs'];

function run(args) {
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

async function distChunk() {
  // The state-machine chunk is reached through a dynamic import inside the loader,
  // so it is not named in the page HTML — find it by its hashed filename instead.
  const dir = path.join(ROOT, 'dist', '_astro');
  const hit = (await readdir(dir)).find(
    (f) => f.startsWith('QuoteSheet.client.') && f.endsWith('.js')
  );
  if (!hit) throw new Error('built QuoteSheet.client chunk not found in dist/_astro');
  return path.join(dir, hit);
}

const CHUNK = await distChunk();

/** The loader's own bundled module — where the /book/ link trigger lives. */
async function loaderScript() {
  const dir = path.join(ROOT, 'dist', '_astro');
  const hit = (await readdir(dir)).find(
    (f) => f.startsWith('QuoteSheet.astro_astro_type_script') && f.endsWith('.js')
  );
  if (!hit) throw new Error('built QuoteSheet loader script not found in dist/_astro');
  return path.join(dir, hit);
}

const PAGE_SCRIPT = await loaderScript();

// ── AID-2 ────────────────────────────────────────────────────────────────────
const HOME_PAGE = path.join(ROOT, 'dist', 'index.html');
const CARD_SRC = path.join(ROOT, 'src', 'components', 'AIDiagnosticCard.astro');
const SHEET_SRC = path.join(ROOT, 'src', 'components', 'AIDiagnosticSheet.astro');
const ISLAND_JSX = path.join(ROOT, 'src', 'components', 'AIDiagnostic.jsx');
const MAP_TS = path.join(ROOT, 'src', 'data', 'aid-to-quote-map.ts');
const CONTACT_JS = path.join(ROOT, 'functions', 'api', 'contact.js');
// ── AID-3 ────────────────────────────────────────────────────────────────────
const CLIENT_TS_AID = path.join(ROOT, 'src', 'components', 'AIDiagnosticSheet.client.ts');
// A /services/ hub: the page type with the most pages behind it, and the one whose
// hero component (ServiceHero) also renders brand and outdoor pages — so breaking
// the card here is breaking it for two thirds of the site.
const SERVICE_HUB_PAGE = path.join(ROOT, 'dist', 'services', 'refrigerator-repair', 'index.html');
// The oven hub: one of the three tiles whose label is a slashed pair written for a
// grid of choices, so it is where a grid label would show up inside a sentence.
const OVEN_HUB_PAGE = path.join(ROOT, 'dist', 'services', 'oven-repair', 'index.html');

/** The diagnostic sheet's own chunk — same trick as the quote sheet's. */
async function aidChunk() {
  const dir = path.join(ROOT, 'dist', '_astro');
  const hit = (await readdir(dir)).find(
    (f) => f.startsWith('AIDiagnosticSheet.client.') && f.endsWith('.js')
  );
  if (!hit) throw new Error('built AIDiagnosticSheet.client chunk not found in dist/_astro');
  return path.join(dir, hit);
}

const AID_CHUNK = await aidChunk();

/**
 * The ISLAND's chunk, which is not the sheet's.
 *
 * Rollup splits AIDiagnostic.jsx into a chunk of its own — the loader chunk only
 * imports it. Two AID-3 mutations were written against the loader chunk and reported
 * SKIP, because the strings they hunt for were never in that file: the checks they
 * were meant to prove had no coverage at all and nobody would have known. That is
 * why a SKIP counts as a blind spot here and not as a pass.
 */
async function aidIslandChunk() {
  const dir = path.join(ROOT, 'dist', '_astro');
  const hit = (await readdir(dir)).find(
    (f) => f.startsWith('AIDiagnostic.') && f.endsWith('.js')
  );
  if (!hit) throw new Error('built AIDiagnostic island chunk not found in dist/_astro');
  return path.join(dir, hit);
}

const AID_ISLAND = await aidIslandChunk();

/** Each case: break one thing, expect the named gate to go red. */
const CASES = [
  // ── static gate ───────────────────────────────────────────────────────────
  {
    gate: 'static', name: 'duplicate <dialog id="quote-sheet">', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('<dialog id="quote-sheet"', '<dialog id="quote-sheet"></dialog><dialog id="quote-sheet"'),
  },
  {
    gate: 'static', name: 'second <h1> on the page', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('<h1', '<h1>stray</h1><h1'),
  },
  {
    gate: 'static', name: 'fallback form removed', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('id="qs-fallback-form"', 'id="qs-fallback-form-REMOVED"'),
  },
  {
    gate: 'static', name: 'honeypot no longer last', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/(<input[^>]*name="website"[^>]*>)/, '$1<input type="text" name="trailing">'),
  },
  {
    gate: 'static', name: 'honeypot visible', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/(<input[^>]*name="website"[^>]*)display:none/, '$1display:block'),
  },
  {
    gate: 'static', name: 'fallback form loses its action', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('action="/api/contact"', 'action="#"'),
  },
  {
    gate: 'static', name: 'currency literal hard-coded in the island', file: CLIENT_SRC, cmd: STATIC_GATE,
    mutate: (s) => s.replace('const STORE_KEY', "const PRICE_HARDCODED = '$89';\nconst STORE_KEY"),
  },
  {
    gate: 'static', name: 'a diagnostic term drifts from the constant', file: COPY_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace(
      "'Credited toward the repair when you hire us for the job.'",
      "'Credited toward the repair.'"
    ),
  },
  {
    gate: 'static', name: 'a fourth diagnostic term sneaks in', file: COPY_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace(
      "'You get a written report: what failed and which parts need replacing.',",
      "'You get a written report: what failed and which parts need replacing.', 'A fourth line nobody approved.',"
    ),
  },
  {
    gate: 'static', name: 'forbidden marketing phrase in the copy', file: COPY_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace(
      'export const HOURS_LINE =',
      "export const MARKETING_SLIP = 'peace of mind'; export const HOURS_LINE ="
    ),
  },

  {
    gate: 'static', name: 'ok class hard-codes a hex instead of the token', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('.qs-ok{display:block', '.qs-ok{color:#0F7B3D;display:block'),
  },
  {
    gate: 'static', name: '--color-ok token removed', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replaceAll('--color-ok', '--color-gone'),
  },
  {
    gate: 'static', name: 'Maps loaded eagerly as a script tag', file: PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('<body', '<body><script src="https://maps.googleapis.com/maps/api/js"></script>'),
  },
  {
    // QS-2 retired the old "key only on /book/" rule — the key now ships wherever
    // the sheet does, which is everywhere. What is still wrong is TWO configs on one
    // page: a second mount, loading Maps twice and billing twice.
    gate: 'static', name: 'Maps config duplicated on a page', file: path.join(ROOT, 'dist', 'contact', 'index.html'), cmd: STATIC_GATE,
    mutate: (s) => s.replace('<body', '<body><script type="application/json" data-quote-sheet-maps>{}</script>'),
  },
  {
    gate: 'smoke', name: 'verified pick no longer sets address_verified', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('addressVerified=!0', 'addressVerified=!1'),
  },
  {
    gate: 'smoke', name: 'failed lookup paints the note green instead of red', file: CHUNK, cmd: SMOKE_GATE,
    // Target setNote's ternary specifically. A plain replace of the first '"qs-err"'
    // hits a field-error template instead and proves nothing — that false pass is
    // exactly what this harness caught on the first run.
    mutate: (s) => s.replace(/\?"qs-ok":(\w+)==="err"\?"qs-err"/, '?"qs-ok":$1==="err"?"qs-ok"'),
  },
  {
    gate: 'smoke', name: 'QS-1.3a regression: verification requires Place Details again', file: CHUNK, cmd: SMOKE_GATE,
    // Forces the pre-fix behaviour: the prediction stops counting as verification, so
    // a project with GetPlaceRequest capped at zero ships every lead unverified.
    mutate: (s) => s.replace(/(\w+)\.addressVerified=(\w+),\2\?/, '$1.addressVerified=!1,$2?'),
  },
  {
    gate: 'smoke', name: 'tile border removed', file: PAGE, cmd: SMOKE_GATE,
    mutate: (s) => s.replace(/\.qs-tile\{([^}]*?)border:1px solid var\(--border\)/, '.qs-tile{$1border:none'),
  },
  {
    gate: 'smoke', name: 'price shrunk below 28px', file: PAGE, cmd: SMOKE_GATE,
    mutate: (s) => s.replace(/(\.qs-price-amount\{[^}]*?)font-size:clamp\([^)]*\)/, '$1font-size:14px'),
  },
  {
    gate: 'smoke', name: 'back button jumps two steps', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('history.back()', 'history.go(-2)'),
  },
  {
    gate: 'smoke', name: 'payload type is not "quote"', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('type:"quote"', 'type:"booking"'),
  },
  {
    gate: 'smoke', name: 'a price term is reworded in the shipped island', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('qs-terms', 'qs-terms-renamed'),
  },
  {
    gate: 'smoke', name: 'price heading changed', file: PAGE, cmd: SMOKE_GATE,
    // replaceAll: the phrase appears several times in the serialised payload, and
    // changing only the first one leaves the rendered heading intact — which is
    // exactly the false pass this harness caught the first time round.
    mutate: (s) => s.replaceAll('Diagnostic visit', 'Your price'),
  },
  {
    gate: 'smoke', name: 'no-JS form posts somewhere else', file: PAGE, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('action="/api/contact"', 'action="/api/nowhere"'),
  },
  {
    gate: 'smoke', name: 'QS-1.4: a taller hero pushes the quote button below the fold',
    file: PAGE, cmd: SMOKE_GATE,
    // The regression class the fold gate exists for: anything that grows the hero
    // above the buttons — dead padding, another paragraph, a badge row — pushes
    // "Get your price" under a 360×740 fold. Padding is the cheapest stand-in.
    // The rule ships as `.book-hero[data-astro-cid-…]{padding:12px 0 40px;…}`;
    // the desktop override inside the media query is a second, later copy, so a
    // non-global replace hits the mobile one — the one the fold depends on.
    mutate: (s) => s.replace(/(\.book-hero\[[^\]]*\]\{)padding:12px 0 40px/, '$1padding:400px 0 40px'),
  },
  // ── QS-1.5: tiles, symptoms, ZIP-from-Google ──────────────────────────────
  {
    gate: 'static', name: 'QS-1.5: an appliance tile loses its provenance', file: APPL_TS, cmd: STATIC_GATE,
    // A tile with no entry in APPLIANCE_SOURCES is a tile for equipment nobody
    // checked we service. That is exactly the invention the gate exists to stop.
    // \r?\n, not \n: this repo checks .ts files out with CRLF on Windows, and a
    // mutation anchored on a bare \n silently stops applying — which turns a proven
    // gate into a SKIP nobody reads. Same for the two cases below.
    mutate: (s) => s.replace(/ {2}garbage_disposal: \['garbage-disposal-repair'\],\r?\n/, ''),
  },
  {
    gate: 'static', name: 'QS-1.5: a tile cites a service the catalog does not have', file: APPL_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("['microwave-repair']", "['air-fryer-repair']"),
  },
  {
    gate: 'static', name: 'QS-1.5: a symptom list drops below ten', file: APPL_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/ +'Splash guard damaged',\r?\n/, ''),
  },
  {
    gate: 'static', name: 'QS-1.5: "Something else" stops being last', file: APPL_TS, cmd: STATIC_GATE,
    // Swap the last real symptom with the ELSE that must follow it.
    mutate: (s) => s.replace(
      /( +)('Splash guard damaged',)(\r?\n)( +)(ELSE,)/,
      (_m, i1, sym, nl, i2, els) => `${i1}${els}${nl}${i2}${sym}`
    ),
  },
  {
    gate: 'static', name: 'QS-1.5: a retired appliance id comes back', file: APPL_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("    id: 'range_stove',", "    id: 'oven_range',"),
  },
  {
    gate: 'static', name: 'QS-1.5: Place Details asks for a Pro-SKU field', file: CLIENT_SRC, cmd: STATIC_GATE,
    // The whole point of the two-field call is staying inside Essentials. Adding a
    // Pro field is a silent bill, so the gate has to see it.
    mutate: (s) => s.replace(
      "fields: ['formattedAddress', 'addressComponents']",
      "fields: ['formattedAddress', 'addressComponents', 'displayName']"
    ),
  },
  {
    gate: 'static', name: 'QS-1.5: routing goes back to the typed ZIP', file: CLIENT_SRC, cmd: STATIC_GATE,
    mutate: (s) => s.replace('const branch = zipToBranch(effectiveZip());', 'const branch = zipToBranch(state.zip);'),
  },
  {
    gate: 'smoke', name: 'QS-1.5: compact tiles grow and the appliance step scrolls', file: PAGE, cmd: SMOKE_GATE,
    // Sixteen tiles only clear a 360×740 fold at the compact size; put the 56px
    // tile back and the last options fall off the bottom of the step.
    mutate: (s) => s.replace('qs-compact .qs-tile{min-height:44px', 'qs-compact .qs-tile{min-height:76px'),
  },
  {
    gate: 'smoke', name: 'QS-1.5: zip_google stops reaching dispatch', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('zip_google:', 'zipGoogle:'),
  },
  {
    gate: 'smoke', name: 'QS-1.5: the ZIP disagreement note never renders', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replaceAll('qs-zip-mismatch', 'qs-zip-mismatch-gone'),
  },
  {
    gate: 'smoke', name: 'QS-1.5: a typed ZIP silently un-verifies the address', file: CHUNK, cmd: SMOKE_GATE,
    // The pre-QS-1.5 behaviour: touch the ZIP field and the verified pin is thrown
    // away, so a confirmed building reaches dispatch marked unverified. The anchor is
    // the tail of the ZIP branch in onBodyInput: `n==="zip"&&(syncZone(),syncMismatch())`.
    mutate: (s) => {
      // The state object's minified name moves between builds, so read it off the
      // one place it is unmistakable — effectiveZip's `state.zipFromGoogle || state.zip`.
      const m = s.match(/(\w+)\.zipFromGoogle\|\|\1\.zip/);
      if (!m) return s;
      return s.replace(/(==="zip"&&\()/, `$1${m[1]}.addressVerified=!1,`);
    },
  },
  // ── QS-2: site-wide mount, page context, prefill ──────────────────────────
  {
    gate: 'static', name: 'QS-2: a layout stops carrying the sheet', file: BLOG_PAGE, cmd: STATIC_GATE,
    // BlogLayout wraps Layout.astro, so a blog post proves the mount reaches every
    // layout. Strip the dialog from one and the site-wide rule has to notice.
    mutate: (s) => s.replace(/<dialog\b[^>]*\bid="quote-sheet"/, '<dialog id="quote-sheet-gone"'),
  },
  {
    gate: 'static', name: 'QS-2: /book/ mounts the sheet twice again', file: PAGE, cmd: STATIC_GATE,
    // The exact regression the dedupe exists for: /book/ kept its own mount after
    // the layout gained one, and every visitor got two dialogs stacked.
    mutate: (s) => s.replace(/(<dialog\b[^>]*\bid="quote-sheet"[^>]*>)/, '$1</dialog>$1'),
  },
  {
    gate: 'static', name: 'QS-2: a page ships a malformed context blob', file: BLOG_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('"context":{', '"context":{,'),
  },
  {
    gate: 'static', name: 'QS-2: the Maps config stops shipping site-wide', file: BLOG_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('data-quote-sheet-maps', 'data-quote-sheet-maps-gone'),
  },
  {
    gate: 'static', name: 'QS-2: a page stops resolving its appliance', file: SERVICE_SUB_PAGE, cmd: STATIC_GATE,
    // Coverage is a floor, not a decoration. Mutating the SOURCE map would prove
    // nothing — the gate reads dist, and nothing rebuilds between the two — so this
    // breaks the shipped answer, which is what the floor actually measures.
    mutate: (s) => s.replace('"appliance":"refrigerator"', '"appliance":null'),
  },
  {
    gate: 'static', name: 'QS-2: a currency literal creeps into quote-context.ts', file: CONTEXT_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace('const EMPTY:', "const FEE = '" + String.fromCharCode(36) + "89';\nconst EMPTY:"),
  },
  {
    gate: 'smoke', name: 'QS-2: step 1 is no longer skipped when the page knows the scope',
    file: CHUNK, cmd: SMOKE_GATE,
    // firstStep() is what turns "2 / 6 with an unreachable page 1" into "1 / 5".
    // Never flagging the scope as prefilled puts the dead step back in front of
    // every commercial and every city-service visitor.
    mutate: (s) => s.replace('scopePrefilled=!0', 'scopePrefilled=!1'),
  },
  {
    gate: 'smoke', name: 'QS-2: the appliance prefill is lost', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('appliancePrefilled=!0', 'appliancePrefilled=!1'),
  },
  {
    gate: 'smoke', name: 'QS-2: a guess is drawn as a confirmed choice', file: CHUNK, cmd: SMOKE_GATE,
    // The soft grey is the whole honesty of the prefill — it says "we guessed".
    // Painting it like a selection tells the visitor they already answered.
    mutate: (s) => s.replace('qs-tile-prefill', 'qs-tile-prefill-gone'),
  },
  {
    gate: 'smoke', name: 'QS-2: an override stops being reported to dispatch', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('applianceChanged=!0', 'applianceChanged=!1'),
  },
  {
    gate: 'smoke', name: 'QS-2: the page guess overwrites the visitor’s saved answer',
    file: CHUNK, cmd: SMOKE_GATE,
    // Drop the "only fill a blank" guard on the appliance, and walking from one page
    // to the next silently replaces what they already chose.
    mutate: (s) => {
      const m = s.match(/(\w+)\.appliance&&!\1\.appliance/);
      if (m) return s.replace(m[0], `${m[1]}.appliance&&!!${m[1]}.appliance`);
      // Minifier shape drifted; fall back to the readable guard if it survived.
      return s.replace('&&!e.appliance&&', '&&!!e.appliance&&');
    },
  },
  {
    gate: 'smoke', name: 'QS-2: a brand page stops naming its appliance', file: BRAND_COMBO_PAGE, cmd: SMOKE_GATE,
    // 413 brand pages carry the appliance in their own slug. Losing it puts the
    // largest page group back on an open sixteen-tile question.
    mutate: (s) => s.replace('"appliance":"washer"', '"appliance":null'),
  },
  {
    gate: 'smoke', name: 'QS-2: the brand chip stops reaching the sheet', file: BRAND_COMBO_PAGE, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('"brandLabel":"LG"', '"brandLabel":null'),
  },
  {
    gate: 'smoke', name: 'QS-2: a plain /book/ link stops opening the sheet', file: PAGE_SCRIPT, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('"/book/"', '"/book-never/"'),
  },
  // ── QS-3a: the eight new commercial tiles ─────────────────────────────────
  {
    gate: 'static', name: 'QS-3a: a new tile ships with no provenance', file: APPL_TS, cmd: STATIC_GATE,
    // Every tile has to name the catalog slug or the page tree that makes it
    // something we actually repair. A tile for equipment nobody checked we service
    // is exactly the invention APPLIANCE_SOURCES exists to stop.
    mutate: (s) => s.replace("  mixer: ['commercial-mixer-repair'],", ''),
  },
  {
    gate: 'static', name: 'QS-3a: a new tile cites a catalog slug that does not exist',
    file: APPL_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("['commercial-steamer-repair']", "['commercial-sous-vide-repair']"),
  },
  {
    gate: 'static', name: 'QS-3a: a commercial slug loses its mapping', file: COMMERCIAL_HUB_PAGE, cmd: STATIC_GATE,
    // The commercial coverage floors are the point of this wave. Break the shipped
    // answer on one hub and commercial_hub drops below its floor.
    mutate: (s) => s.replaceAll('"appliance":"mixer"', '"appliance":null'),
  },
  {
    gate: 'smoke', name: 'QS-3a: the commercial step falls back to two columns',
    file: PAGE, cmd: SMOKE_GATE,
    // Nineteen tiles two-wide overflow a 360x740 body by 154px, so the last six
    // options sit below a fold on a step that looks complete.
    mutate: (s) => s.replace('qs-tiles.qs-three{grid-template-columns:1fr 1fr 1fr}',
                             'qs-tiles.qs-three{grid-template-columns:1fr 1fr}'),
  },
  {
    gate: 'static', name: 'QS-3a: a page-tree-only tile loses its source', file: APPL_TS, cmd: STATIC_GATE,
    // Kettle, food processor and slicer have no catalog slug at all — the page tree
    // is the only thing that makes them real, so the source entry is the only record
    // that anyone checked.
    mutate: (s) => s.replace("  kettle: ['commercial:kettle-repair'],", ''),
  },
  // ── AID-2: the hero card, its sheet, and the handoff ──────────────────────
  {
    gate: 'static', name: 'AID-2: duplicate aid-sheet dialog', file: HOME_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('<dialog id="aid-sheet"', '<dialog id="aid-sheet"></dialog><dialog id="aid-sheet"'),
  },
  {
    gate: 'static', name: 'AID-2: the card falls off the homepage', file: HOME_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('data-aid-card', 'data-aid-card-gone'),
  },
  {
    gate: 'static', name: 'AID-2: React starts hydrating on the homepage', file: HOME_PAGE, cmd: STATIC_GATE,
    // What a `client:load` on the island would emit. The whole point of the manual
    // mount is that the homepage pays nothing until the card is used.
    mutate: (s) => s.replace('<dialog id="aid-sheet"', '<astro-island renderer-url="/x.js"></astro-island><dialog id="aid-sheet"'),
  },
  {
    gate: 'static', name: 'AID-2: card button below a 52px tap target', file: CARD_SRC, cmd: STATIC_GATE,
    // Both the input and the button carry it; a mutation that changed only the
    // first would leave the gate's own pattern satisfied by the second.
    mutate: (s) => s.replace(/min-height: 52px/g, 'min-height: 40px'),
  },
  {
    gate: 'static', name: 'AID-2: card input drops under 16px (iOS zooms)', file: CARD_SRC, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/font-size: 16px/g, 'font-size: 14px'),
  },
  {
    gate: 'static', name: 'AID-2: a forbidden phrase enters the card copy', file: CARD_SRC, cmd: STATIC_GATE,
    // AID-3 moved the neutral heading out of this file and into diagnosticHeading(),
    // so the old anchor stopped existing here and the case became a silent SKIP. The
    // sub-line is the card's own copy and stays here — anchor on that. The heading
    // strings are not left uncovered: the static gate now runs the same forbidden
    // list over every heading the build actually rendered.
    mutate: (s) => s.replace('Describe it in your own words', 'Peace of mind — describe it'),
  },
  {
    gate: 'static', name: 'AID-2: the loader stops prefetching the chunk', file: SHEET_SRC, cmd: STATIC_GATE,
    mutate: (s) => s.replace("'pointerenter'", "'pointerenterX'"),
  },
  {
    gate: 'static', name: 'AID-2: the island loses initialDetail', file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace('initialDetail = ""', 'initialDetailUnused = ""'),
  },
  {
    gate: 'static', name: 'AID-2: initialDetail stops seeding step 4', file: ISLAND_JSX, cmd: STATIC_GATE,
    // AID-3 spliced `...seed` between the two halves of this anchor, so the string
    // stopped existing and the case silently became a SKIP — a check that proves
    // nothing while still printing a line. Anchor on the tail instead: dropping
    // `detail: initialDetail` is exactly the regression this was always proving.
    mutate: (s) => s.replace(/,\s*detail: initialDetail/g, ''),
  },
  {
    gate: 'static', name: 'AID-2: the verdict link loses its appliance attribute', file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace('data-aid-appliance', 'data-aid-appliance-gone'),
  },
  {
    gate: 'static', name: 'AID-2: a symptom alias names words no tile has', file: MAP_TS, cmd: STATIC_GATE,
    // "Drum stopped" is not on the dryer tile, so the sheet would resume a symptom
    // step with a selection that matches nothing on screen.
    mutate: (s) => s.replace("'Not tumbling'", "'Drum stopped'"),
  },
  {
    gate: 'static', name: 'AID-2: a mapped appliance points at no tile', file: MAP_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("Refrigerator: 'refrigerator',", "Refrigerator: 'fridge',"),
  },
  {
    gate: 'static', name: 'AID-2: a diagnostic appliance falls through the map', file: MAP_TS, cmd: STATIC_GATE,
    // Neither translated nor declared untranslatable — the silent case, the one a
    // pair of hand-kept tables always drifts into.
    mutate: (s) => s.replace("  'Pizza Oven',", ''),
  },
  {
    gate: 'static', name: 'AID-2: a label is both mapped and declared unmapped', file: MAP_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("  'Ice Dispenser',", "  'Ice Dispenser',\n  'Dryer',"),
  },
  {
    gate: 'static', name: 'AID-2: the quote payload drops aid_handoff', file: CLIENT_SRC, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/aid_handoff: state\.aidHandoff,/g, ''),
  },
  {
    gate: 'static', name: 'AID-2: a handoff stops naming its own source', file: CLIENT_SRC, cmd: STATIC_GATE,
    mutate: (s) => s.replace("state.aidHandoff ? 'ai-diagnostic' :", ''),
  },
  {
    gate: 'static', name: 'AID-2: the dispatch card stops saying where the lead came from',
    file: CONTACT_JS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("row('From AI diagnostic', 'yes')", "null"),
  },
  {
    gate: 'smoke', name: 'AID-2: the card is above the fold no longer', file: HOME_PAGE, cmd: SMOKE_GATE,
    // 400px of extra top padding on the hero pushes the card past a 740px screen —
    // the exact failure the diagnostic died of the first time round.
    mutate: (s) => s.replace('padding:72px 24px 40px', 'padding:472px 24px 40px'),
  },
  {
    gate: 'smoke', name: 'AID-2: the typed sentence is dropped on the way in',
    file: AID_CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('initialDetail:', 'initialDetailIgnored:'),
  },
  {
    gate: 'smoke', name: 'AID-2: the handoff writes no session for the quote sheet',
    file: AID_CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('sdar_qs_v1', 'sdar_qs_v0'),
  },
  // ── AID-3: the card everywhere else, and the prefill it carries ───────────
  {
    // The headline failure: a page type quietly loses its card. One page of a type
    // is enough — the rule is "every page of these eight", not "most of them".
    gate: 'static', name: 'AID-3: the card falls off a whole page type',
    file: SERVICE_HUB_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/data-aid-card(?![\w-])/, 'data-aid-card-gone'),
  },
  {
    // The opposite failure, and the one a page-type rule exists to catch: the card
    // turns up somewhere it was never meant to be. /blog/ has no hero and no card.
    gate: 'static', name: 'AID-3: a card leaks onto an excluded page type',
    file: BLOG_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('<body', '<body><div data-aid-card></div>'),
  },
  {
    gate: 'static', name: 'AID-3: a sheet leaks onto an excluded page type',
    file: BLOG_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('<body', '<body><dialog id="aid-sheet"></dialog>'),
  },
  {
    // Card without a sheet: the input opens nothing, and the button silently becomes
    // a page navigation. Looks fine in a screenshot, dead to a visitor.
    gate: 'static', name: 'AID-3: a card is left with no sheet to open',
    file: BRAND_COMBO_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/<dialog[^>]*\bid="aid-sheet"/, '<dialog id="aid-sheet-gone"'),
  },
  {
    gate: 'static', name: 'AID-3: the prefill attributes stop shipping',
    file: BRAND_COMBO_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/data-aid-pre-appliance="[^"]*"/, ''),
  },
  {
    // A prefill that is WRONG rather than absent — the one failure mode the whole
    // "unmapped resolves to nothing" doctrine exists to prevent.
    gate: 'static', name: 'AID-3: a page prefills an appliance it does not have',
    file: BRAND_COMBO_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('data-aid-pre-appliance="Washer"', 'data-aid-pre-appliance="Dryer"'),
  },
  {
    gate: 'static', name: 'AID-3: the heading stops matching the page',
    file: BRAND_COMBO_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('LG washer acting up?', 'Something is wrong?'),
  },
  {
    gate: 'static', name: 'AID-3: the brand drops out of the heading',
    file: BRAND_COMBO_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('LG washer acting up?', 'Washer acting up?'),
  },
  {
    gate: 'static', name: 'AID-3: a reverse-mapped label is not in that category',
    file: MAP_TS, cmd: STATIC_GATE,
    // "Commercial Fryer" is a restaurant label; filing it under `home` would open the
    // island on a step whose tile grid does not contain it.
    mutate: (s) => s.replace(
      "dryer: { category: 'home', appliance: 'Dryer', noun: 'Dryer' },",
      "dryer: { category: 'home', appliance: 'Commercial Fryer', noun: 'Dryer' },"
    ),
  },
  {
    gate: 'static', name: 'AID-3: a heading noun goes back to being a tile label',
    file: MAP_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("noun: 'Wine cooler'", "noun: 'Wine Cooler / Cellar'"),
  },
  {
    gate: 'static', name: 'AID-3: a tile falls through the reverse map', file: MAP_TS,
    cmd: STATIC_GATE,
    // Neither translated nor declared untranslatable — the silent case, the one a
    // pair of hand-kept tables always drifts into.
    mutate: (s) => s.replace("  'garbage_disposal',\r\n", '').replace("  'garbage_disposal',\n", ''),
  },
  {
    gate: 'static', name: 'AID-3: a brand is spelled a way the diagnostic has never heard',
    file: MAP_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("  lg: 'LG',", "  lg: 'L.G.',"),
  },
  {
    gate: 'static', name: 'AID-3: a page type is dropped from the carded list',
    file: MAP_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("  'outdoor',\r\n]);", "]);").replace("  'outdoor',\n]);", "]);"),
  },
  {
    gate: 'static', name: 'AID-3: the city pillar is added to the carded list',
    file: MAP_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("  'service_hub',", "  'city',\n  'service_hub',"),
  },
  {
    gate: 'static', name: 'AID-3: the island stops taking the page prefill',
    file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace('initialAppliance = ""', 'initialApplianceUnused = ""'),
  },
  {
    gate: 'static', name: 'AID-3: the island accepts a brand the appliance does not list',
    file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace(
      '(BRANDS_BY_APPLIANCE[appliance] || []).includes(initialBrand)',
      'true'
    ),
  },
  {
    gate: 'static', name: 'AID-3: the entry step stops following the answers',
    file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace(
      'useState(() =>\n    firstOpenStep(',
      'useState(() =>\n    (() => 1)('
    ).replace(
      'useState(() =>\r\n    firstOpenStep(',
      'useState(() =>\r\n    (() => 1)('
    ),
  },
  {
    gate: 'static', name: 'AID-3: Continue and the entry step stop agreeing',
    file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace(
      'const canAdvance = () => stepAnswered(step, form);',
      'const canAdvance = () => !!form.category;'
    ),
  },
  {
    gate: 'static', name: 'AID-3: the loader stops handing the prefill over',
    file: CLIENT_TS_AID, cmd: STATIC_GATE,
    mutate: (s) => s.replace('initialAppliance: pre.appliance', 'initialApplianceIgnored: pre.appliance'),
  },
  {
    gate: 'static', name: 'AID-3: the brand stops travelling into the quote seed',
    file: CLIENT_TS_AID, cmd: STATIC_GATE,
    mutate: (s) => s.replace('brand: seed.brandSlug', 'brandIgnored: seed.brandSlug'),
  },
  {
    gate: 'static', name: 'AID-3: the verdict link stops carrying the brand',
    file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace('data-aid-brand', 'data-aid-brand-gone'),
  },
  {
    gate: 'static', name: 'AID-3: the payload stops saying which page it came from',
    file: ISLAND_JSX, cmd: STATIC_GATE,
    mutate: (s) => s.replace(/page_url: pageUrl/g, 'pageUrlDropped: pageUrl'),
  },
  {
    gate: 'static', name: 'AID-3: the dispatch card stops printing the page',
    file: CONTACT_JS, cmd: STATIC_GATE,
    mutate: (s) => s.replace('Страница: ${escape(p.page_url', 'Page: ${escape(p.page_url'),
  },
  {
    gate: 'static', name: 'AID-3: React starts hydrating on a service page',
    file: SERVICE_HUB_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('<body', '<body><astro-island renderer-url="/x.js"></astro-island>'),
  },
  {
    gate: 'smoke', name: 'AID-3: the island stops opening past the answered steps',
    file: AID_ISLAND, cmd: SMOKE_GATE,
    // firstOpenStep is what turns "step 1 of 5 with two answers already made" into
    // "step 3 of 5". Pinning it to 1 puts the dead steps back in front of everyone.
    // Anchored on the loop header, which the minifier keeps verbatim. Short-circuit
    // it and every visitor is back on step 1 with two answers already made.
    // No backreference in this pattern on purpose: written with one, the `\1`s were
    // lost on the way into this file and the regex silently became unmatchable, which
    // is how the case reported SKIP twice. Three bare \w+ cannot drift that way.
    mutate: (s) =>
      s.replace(
        /for\(let \w+=1;\w+<=4;\w+\+=1\)/,
        'if(1)return 1;for(let n=1;n<=4;n+=1)'
      ),
  },
  {
    gate: 'smoke', name: 'AID-3: the prefilled chip stops looking chosen',
    file: AID_ISLAND, cmd: SMOKE_GATE,
    // The red is how a visitor knows the step is already answered. Without it the
    // step opens looking blank and they answer it again — or bounce.
    mutate: (s) => s.replaceAll('#C8102E', '#333333'),
  },
  {
    gate: 'smoke', name: 'AID-3: the card stops reading the page prefill',
    file: AID_CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('aidPreAppliance', 'aidPreApplianceGone'),
  },
  {
    gate: 'smoke', name: 'AID-3: the brand is not carried through the handoff',
    file: AID_CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace(/brandLabel:(\w+)\.brandLabel\|\|""/, 'brandLabel:""'),
  },
  {
    gate: 'smoke', name: 'AID-3: a card sinks past a screen and a half',
    file: SERVICE_HUB_PAGE, cmd: SMOKE_GATE,
    // The regression class the 1.5vh rule exists for: anything that grows the hero
    // above the card — another paragraph, a badge row, dead padding — pushes it far
    // enough down that nobody scrolling normally ever meets it.
    // BOTH rules, not the first one. `.hero-aid` ships twice — the base 22px and an
    // 18px override inside `@media (max-width: 768px)` — and this leg runs at 360px
    // wide, where the override wins. Mutating only the first left the phone layout
    // untouched and the gate green over a broken rule: the exact false pass this
    // harness exists to find.
    mutate: (s) =>
      s.replace(/(\.hero-aid\[[^\]]*\]\{)margin-top:22px/g, '$1margin-top:1400px')
        .replace(/(\.hero-aid\[[^\]]*\]\{)margin-top:18px/g, '$1margin-top:1400px'),
  },
  {
    // The placeholder stops following the page and every card is back to talking
    // about a dryer — including the mixer pages and the walk-in pages.
    gate: 'static', name: 'AID-3: the placeholder stops following the page',
    file: BRAND_COMBO_PAGE, cmd: STATIC_GATE,
    mutate: (s) =>
      s.replace('My LG washer: not spinning…', 'My dryer runs but doesn\'t heat…'),
  },
  {
    // Worse than not following it: following it to a fault the sheet does not list
    // for that appliance. The words have to be the tile's own, which is the whole
    // reason they are read out of quote-appliances.ts instead of written.
    gate: 'static', name: 'AID-3: the placeholder suggests a fault the tile does not list',
    file: BRAND_COMBO_PAGE, cmd: STATIC_GATE,
    mutate: (s) => s.replace('not spinning…', 'smells like burning…'),
  },
  {
    // Reaching for the tile label instead of the heading noun would put
    // "My oven / wall oven: not heating…" in the field, which reads as a typo. The
    // gate reads dist, not the resolver, so the break has to be in dist: mutating the
    // source here would change nothing the gate looks at and prove nothing.
    gate: 'static', name: 'AID-3: a grid label leaks into the placeholder sentence',
    file: OVEN_HUB_PAGE, cmd: STATIC_GATE,
    mutate: (s) =>
      s.replace('My oven: not heating…', 'My oven / wall oven: not heating…'),
  },
  {
    gate: 'smoke', name: 'AID-3: the placeholder a visitor sees stops matching the page',
    file: SERVICE_HUB_PAGE, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('My refrigerator: not cooling…', 'My dryer runs but doesn\'t heat…'),
  },
  {
    gate: 'smoke', name: 'resume forgets the saved step', file: CHUNK, cmd: SMOKE_GATE,
    mutate: (s) => s.replace('sessionStorage.getItem', 'sessionStorage.getItemMissing'),
  },
];

let broken = 0;
let proven = 0;

console.log('Breaking each gate once — every line must read PROVEN.\n');

for (const c of CASES) {
  const backup = c.file + '.gatebak';
  await copyFile(c.file, backup);
  try {
    const before = await readFile(c.file, 'utf8');
    const after = c.mutate(before);
    if (after === before) {
      console.log(`  SKIP    [${c.gate}] ${c.name} — mutation did not apply (selector drifted)`);
      broken++;
      continue;
    }
    await writeFile(c.file, after, 'utf8');
    const { code } = run(c.cmd);
    if (code !== 0) {
      console.log(`  PROVEN  [${c.gate}] ${c.name} → gate exits ${code}`);
      proven++;
    } else {
      console.log(`  BLIND   [${c.gate}] ${c.name} → gate still passed (exit 0)`);
      broken++;
    }
  } finally {
    await copyFile(backup, c.file);
    await unlink(backup);
  }
}

console.log('');
if (broken) {
  console.error(`verify-quote-gates: ${broken} blind spot(s), ${proven} proven`);
  process.exit(1);
}
console.log(`verify-quote-gates: ${proven}/${proven} gate checks proven to fail when broken`);
