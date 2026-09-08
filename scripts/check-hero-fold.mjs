#!/usr/bin/env node
// scripts/check-hero-fold.mjs
//
// QS-4 gate: the hero's CTA row is reachable without scrolling on a phone.
//
// This is its own gate rather than a section of check-quote-sheet.mjs because it
// needs a real browser — a fold is a layout fact, and layout facts cannot be read
// out of HTML with a regex. It is kept out of the smoke suite for a different
// reason: verify-quote-gates re-runs smoke once per mutation, so two minutes of
// measurement there would become an hour across the harness.
//
// What it asserts, per page type:
//   · 360x740 — at least 95% of sampled pages have the CTA row fully above the fold
//   · 375x812 — 100%. A page that fails on the larger phone is broken, not tight.
//   · the AI diagnostic card still starts within 1.5 viewport heights (AID-3's rule,
//     re-checked here because tightening the hero moves the card too)
//
// The sample is deterministic — every Nth page of each type — so a run is
// repeatable and a failure names the same pages twice in a row.
//
// Usage: node scripts/check-hero-fold.mjs [--sample=40] [--verbose]

import {
  foldPages, sample, measureFold, FOLD_TYPES, FOLD_360, FOLD_375,
} from './measure-hero-fold.mjs';

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];
const N = Number(arg('sample') || 40);
const VERBOSE = process.argv.includes('--verbose');

/** The floor at 360x740. Not 100%: page copy is written by people, and one long
 *  H1 should be a content note, not a red build. 95% of a 40-page sample means at
 *  most two pages of a type may run over — a mass regression cannot hide in that. */
const FLOOR_360 = 0.95;

/**
 * Named pages, checked one assertion each, ALONGSIDE the floor.
 *
 * A floor is a mass-regression alarm and nothing else: one page out of a 40-page
 * sample moves it by 2.5%, so a 95% floor cannot see a single page fall under the
 * fold — the mutation harness proved exactly that, reporting BLIND against a
 * deliberately broken /pasadena/dryer-repair/. (QS-3a hit the same trap with its
 * coverage floors and fixed it the same way.)
 *
 * These are the five smoke samples plus the pages that measured worst before QS-4,
 * so the regressions this wave actually fixed each have a check with their name on
 * it.
 */
const FOLD_ANCHORS = [
  '/pasadena/dryer-repair/',
  '/brands/lg-washer-repair/',
  '/services/refrigerator-repair/',
  '/commercial/mixer-repair/',
  '/outdoor/grill-repair/',
  '/hollywood/dishwasher-repair/',
  '/commercial/refrigeration/brands/continental/',
  '/commercial/refrigeration/brands/perlick/',
  '/outdoor/smoker-repair/brands/',
  '/commercial/ice-machines/brands/',
  '/commercial/refrigeration/temperature-fluctuating/',
];

const failures = [];
const passes = [];
function check(name, ok, detail = '') {
  if (ok) {
    passes.push(name);
    if (VERBOSE) console.log(`  ok    ${name}`);
  } else {
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
  }
}

// The per-type floors only concern the six types QS-4 owns; the named anchors are
// looked up in the FULL page list, because two of them (/services/…, /commercial/…)
// are hubs — the fold rule is just as true there, and they are the pages the smoke
// suite drives, so a regression on one should be loud here too.
const allPages = await foldPages();
const all = allPages.filter((p) => FOLD_TYPES.includes(p.type));
const byType = new Map();
for (const p of all) {
  if (!byType.has(p.type)) byType.set(p.type, []);
  byType.get(p.type).push(p);
}
check('every fold-governed page type is present in this build',
  FOLD_TYPES.every((t) => byType.has(t)),
  FOLD_TYPES.filter((t) => !byType.has(t)).join(', '));

const picked = [];
for (const [, list] of byType) picked.push(...sample(list, N));
// The anchors are measured whether or not the sample happened to pick them.
const byUrl = new Map(allPages.map((p) => [p.url, p]));
for (const a of FOLD_ANCHORS) {
  const hit = byUrl.get(a);
  check(`anchor page still exists: ${a}`, Boolean(hit), 'not in dist');
  if (hit && !picked.some((p) => p.url === a)) picked.push(hit);
}
check('the sample actually parsed', picked.length >= 6 * Math.min(N, 10), `${picked.length} pages`);
console.log(`check-hero-fold: measuring ${picked.length} page(s) of ${all.length}\n`);

for (const [label, vp, fold, floor] of [
  ['360x740', { width: 360, height: 740 }, FOLD_360, FLOOR_360],
  ['375x812', { width: 375, height: 812 }, FOLD_375, 1],
]) {
  const rows = await measureFold(picked, { ...vp, fold });
  check(`${label}: every sampled page reported a CTA row`,
    rows.every((r) => r.ctaBottom !== null),
    rows.filter((r) => r.ctaBottom === null).slice(0, 5).map((r) => r.url).join(', '));
  check(`${label}: nothing scrolled to be measured`, rows.every((r) => r.scrolled === 0));

  for (const t of FOLD_TYPES) {
    const r = rows.filter((x) => x.type === t);
    if (!r.length) continue;
    const ok = r.filter((x) => x.above).length;
    const ratio = ok / r.length;
    const worst = r.filter((x) => !x.above).sort((a, b) => b.ctaBottom - a.ctaBottom).slice(0, 3);
    check(
      `${label}: ${t} keeps the CTA row above the fold on ≥${Math.round(floor * 100)}% of pages`,
      ratio >= floor,
      `${ok}/${r.length} (${(ratio * 100).toFixed(0)}%)` +
        (worst.length ? ` — worst: ${worst.map((w) => `${w.url}@${w.ctaBottom}`).join(', ')}` : '')
    );
  }

  // One assertion per anchor, by name, so a single page cannot hide inside a
  // percentage.
  for (const a of FOLD_ANCHORS) {
    const row = rows.find((r) => r.url === a);
    if (!row) continue;
    check(`${label}: ${a} keeps its CTA row above the fold`, row.above === true,
      `ctaBottom ${row.ctaBottom} > ${fold} (lede ${row.ledeLines} lines)`);
  }

  if (label === '360x740') {
    const cards = rows.filter((x) => x.cardTop !== null);
    const over = cards.filter((x) => x.cardTop > x.vh * 1.5);
    check('360x740: the AI diagnostic card still starts within 1.5 viewport heights',
      over.length === 0,
      over.slice(0, 3).map((x) => `${x.url}@${x.cardTop}`).join(', '));
    // The lede is clamped, not deleted. Two lines is the design; anything taller
    // means the clamp stopped applying, which is how the fold regresses silently.
    const unclamped = rows.filter((x) => x.ledeLines > 3);
    check('360x740: the hero lede is clamped to two lines',
      unclamped.length === 0,
      unclamped.slice(0, 3).map((x) => `${x.url}@${x.ledeLines}ln`).join(', '));
  }
}

if (failures.length) {
  console.error(`\ncheck-hero-fold: ${failures.length} FAILED, ${passes.length} passed\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`check-hero-fold: ${passes.length}/${passes.length} passed`);
