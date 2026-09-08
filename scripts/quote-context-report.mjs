#!/usr/bin/env node
// scripts/quote-context-report.mjs
//
// QS-2 coverage report. Reads the `context` block out of the #qs-data blob that
// each built page actually ships, and prints what the sheet will know before the
// visitor answers anything:
//
//   pageType -> pages -> % with a scope -> % with an appliance -> % with a brand
//
// …plus the slugs that resolve to NOTHING, listed by name. That list is the point
// of the report: an unmapped slug is a deliberate null, and the only way to keep it
// deliberate is to see it every time.
//
// It reads dist/ rather than importing quote-context.ts on purpose. The question
// worth answering is not "what would the mapping say" but "what did this build
// actually put in front of visitors" — and only dist can answer that.
//
// Redirect emissions (<meta http-equiv="refresh">) are excluded: they do not use
// Layout.astro, carry no sheet, and would drown the table.
//
// Usage: node scripts/quote-context-report.mjs [--json]

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const AS_JSON = process.argv.includes('--json');

/** Every non-redirect index.html in dist, as { url, html }. */
export async function realPages() {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir)) {
      const full = path.join(dir, entry);
      if ((await stat(full)).isDirectory()) {
        await walk(full);
      } else if (entry === 'index.html') {
        const html = await readFile(full, 'utf8');
        if (/http-equiv=["']refresh["']/i.test(html)) continue;
        const rel = path.relative(DIST, full).split(path.sep).join('/');
        out.push({ url: '/' + rel.replace(/index\.html$/, ''), html });
      }
    }
  }
  await walk(DIST);
  out.sort((a, b) => a.url.localeCompare(b.url));
  return out;
}

/** The serialised sheet payload, or null when the page carries no sheet. */
export function readBlob(html) {
  const m = html.match(/<script type="application\/json" id="qs-data">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return undefined; // present but malformed — the caller must treat this as a failure
  }
}

const pages = await realPages();

const byType = new Map();
const unmappedSlug = new Map();
const noBlob = [];
let badBlob = 0;

function noteUnmapped(type, slug) {
  const key = `${type}\t${slug}`;
  unmappedSlug.set(key, (unmappedSlug.get(key) || 0) + 1);
}

for (const { url, html } of pages) {
  const blob = readBlob(html);
  if (blob === null) {
    noBlob.push(url);
    continue;
  }
  if (blob === undefined) {
    badBlob++;
    continue;
  }
  const ctx = blob.context || {};
  const type = ctx.pageType || 'unknown';
  const row = byType.get(type) || { pages: 0, scope: 0, appliance: 0, brand: 0 };
  row.pages++;
  if (ctx.scope) row.scope++;
  if (ctx.appliance) row.appliance++;
  if (ctx.brand) row.brand++;
  byType.set(type, row);

  if (!ctx.appliance) {
    const p = url.split('/').filter(Boolean);
    const seg = (i) => p[i] || '(index)';
    if (type === 'service_hub' || type === 'service_sub') noteUnmapped(type, seg(1));
    else if (type === 'commercial_hub' || type === 'commercial_sub')
      noteUnmapped(type, p.slice(1, 3).join('/') || '(index)');
    else if (type === 'commercial_brand') noteUnmapped(type, seg(1));
    else if (type === 'city_service') noteUnmapped(type, seg(1));
    else if (type === 'outdoor') noteUnmapped(type, seg(1));
    else if (type === 'brand') {
      // A brand slug is brand + category welded together, and there is no reliable
      // way to split one off the other for a brand we do not have a pillar for
      // ("accurex-hood-repair"). So: pillars collapse into one bucket, and every
      // other unresolved page is listed by its whole slug rather than by a guessed
      // suffix — a made-up category name in a report about not guessing would be a
      // poor joke.
      const slug = seg(1);
      noteUnmapped(type, /-repair$/.test(slug) ? slug : '(pillar, no category)');
    }
  }
}

const pct = (n, d) => (d === 0 ? '—' : ((n / d) * 100).toFixed(0) + '%');
const rows = [...byType.entries()].sort((x, y) => y[1].pages - x[1].pages);
const totals = rows.reduce(
  (a, [, r]) => ({
    pages: a.pages + r.pages,
    scope: a.scope + r.scope,
    appliance: a.appliance + r.appliance,
    brand: a.brand + r.brand,
  }),
  { pages: 0, scope: 0, appliance: 0, brand: 0 }
);

const unmapped = [...unmappedSlug.entries()]
  .map(([k, n]) => {
    const [type, slug] = k.split('\t');
    return { type, slug, pages: n };
  })
  .sort((a, b) => a.type.localeCompare(b.type) || b.pages - a.pages || a.slug.localeCompare(b.slug));

if (AS_JSON) {
  console.log(JSON.stringify({ totals, byType: Object.fromEntries(rows), unmapped, noBlob, badBlob }, null, 2));
} else {
  console.log(`QS-2 page-context coverage — ${pages.length} real pages in dist/\n`);
  console.log('  pageType             pages    scope   appliance    brand');
  console.log('  ' + '-'.repeat(58));
  for (const [type, r] of rows) {
    console.log(
      '  ' +
        type.padEnd(20) +
        String(r.pages).padStart(6) +
        pct(r.scope, r.pages).padStart(9) +
        pct(r.appliance, r.pages).padStart(12) +
        pct(r.brand, r.pages).padStart(9)
    );
  }
  console.log('  ' + '-'.repeat(58));
  console.log(
    '  ' +
      'TOTAL'.padEnd(20) +
      String(totals.pages).padStart(6) +
      pct(totals.scope, totals.pages).padStart(9) +
      pct(totals.appliance, totals.pages).padStart(12) +
      pct(totals.brand, totals.pages).padStart(9)
  );

  if (noBlob.length) {
    console.log(`\n  pages with NO sheet payload: ${noBlob.length}`);
    for (const u of noBlob.slice(0, 10)) console.log('    ' + u);
  }
  if (badBlob) console.log(`\n  pages with a MALFORMED payload: ${badBlob}`);

  console.log(`\nSlugs with NO appliance mapping — deliberate nulls, never guessed (${unmapped.length}):\n`);
  let lastType = '';
  for (const u of unmapped) {
    if (u.type !== lastType) {
      console.log(`  [${u.type}]`);
      lastType = u.type;
    }
    console.log('    ' + u.slug.padEnd(48) + String(u.pages).padStart(4) + ' page(s)');
  }
  console.log('');
}
