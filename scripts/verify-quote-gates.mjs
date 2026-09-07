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
    gate: 'static', name: 'Maps key leaks onto a second page', file: path.join(ROOT, 'dist', 'contact', 'index.html'), cmd: STATIC_GATE,
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
    mutate: (s) => s.replace("  garbage_disposal: ['garbage-disposal-repair'],\n", ''),
  },
  {
    gate: 'static', name: 'QS-1.5: a tile cites a service the catalog does not have', file: APPL_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("['microwave-repair']", "['air-fryer-repair']"),
  },
  {
    gate: 'static', name: 'QS-1.5: a symptom list drops below ten', file: APPL_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace("      'Splash guard damaged',\n", ''),
  },
  {
    gate: 'static', name: 'QS-1.5: "Something else" stops being last', file: APPL_TS, cmd: STATIC_GATE,
    mutate: (s) => s.replace(
      "      'Keeps tripping the reset',\n      'Splash guard damaged',\n      ELSE,",
      "      'Keeps tripping the reset',\n      ELSE,\n      'Splash guard damaged',"
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
