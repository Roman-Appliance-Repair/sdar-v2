#!/usr/bin/env node
// scripts/measure-hero-fold.mjs
//
// QS-4. Where the hero's CTA row lands relative to a phone fold, measured rather
// than eyeballed.
//
// The rule this exists to serve: on a 360x740 phone the "Call" and "Book Online"
// buttons must be reachable without scrolling. A hero can look fine in a desktop
// preview and still push its own call button under the fold on the device most of
// this traffic actually arrives on.
//
// It serves two callers with the same numbers, on purpose:
//   · a person running an audit  — `--report`, prints the table and the worst pages
//   · the static gate            — imports measureFold() and asserts a floor
// One measurement, so the gate cannot pass on a number the report never saw.
//
// The fold line is 732, not 740: mobile Chrome's own UI is not the only thing that
// eats the bottom of a phone screen, and a button whose last 8px sit on the crease
// is not "above the fold" to a thumb. 375x812 is measured too and is expected to be
// clean at 100% — a page that fails THERE is broken, not tight.
//
// Usage:
//   node scripts/measure-hero-fold.mjs --report            # full audit, all pages
//   node scripts/measure-hero-fold.mjs --report --sample=40
//   node scripts/measure-hero-fold.mjs --report --type=brand

import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');

/** The fold, in CSS pixels, with a small allowance for the browser's own chrome. */
export const FOLD_360 = 732;
export const FOLD_375 = 800;

/** The page types this wave is responsible for. */
export const FOLD_TYPES = [
  'city_service',
  'brand',
  'commercial_brand',
  'service_sub',
  'commercial_sub',
  'outdoor',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

async function serve() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      if (!path.extname(p)) p += '/index.html';
      const buf = await readFile(path.join(DIST, p));
      res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
      res.end(buf);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise((r) => server.listen(0, r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

/** Every real page in dist, with the page type it declares in the quote sheet blob. */
export async function foldPages() {
  const out = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name === 'index.html') {
        const html = await readFile(p, 'utf8');
        // Astro's redirect emissions are not pages.
        if (/<meta http-equiv="refresh"/i.test(html) && html.length < 2000) continue;
        const m = html.match(/"pageType":"(\w+)"/);
        const rel = path.relative(DIST, path.dirname(p)).split(path.sep).filter(Boolean);
        out.push({ url: '/' + (rel.length ? rel.join('/') + '/' : ''), type: m ? m[1] : 'unknown' });
      }
    }
  }
  await walk(DIST);
  return out;
}

/** Deterministic sample: every Nth page, so a run is repeatable and spread out. */
export function sample(list, n) {
  if (!n || list.length <= n) return list;
  const step = list.length / n;
  return Array.from({ length: n }, (_, i) => list[Math.floor(i * step)]);
}

/**
 * Measure one page at one viewport. Returns the CTA row's box plus the pieces of
 * the hero above it, so a failure says WHAT ate the space and not merely that it
 * was eaten.
 */
async function measureOne(page, base, url, fold) {
  await page.goto(`${base}${url}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(120);
  return page.evaluate((foldPx) => {
    const box = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    };
    const first = (list) => {
      for (const s of list) {
        const b = box(s);
        if (b) return b;
      }
      return null;
    };
    const lines = (s) => {
      const el = document.querySelector(s);
      if (!el) return 0;
      const lh = parseFloat(getComputedStyle(el).lineHeight);
      if (!lh) return 0;
      return Math.round(el.getBoundingClientRect().height / lh);
    };
    const cta = first(['.hero-photo__ctas', '.hero-ctas', '.cta-row', '.hero-cta']);
    const h1 = box('h1');
    const lede = first(['.lede', '.hero-photo__sub', '.hero-sub', '.hub-lede']);
    const eyebrow = first(['.eyebrow', '.hero-photo__eyebrow', '.hero-eyebrow']);
    const crumb = first(['.crumb', '.breadcrumbs', 'nav[aria-label="Breadcrumb"]']);
    const nav = first(['.navbar', 'header']);
    const trust = first(['.trust-bar', '.hero-photo__branches']);
    const card = box('.aid-card');
    return {
      vh: window.innerHeight,
      scrolled: window.scrollY,
      ctaTop: cta ? Math.round(cta.top) : null,
      ctaBottom: cta ? Math.round(cta.bottom) : null,
      above: cta ? cta.bottom <= foldPx : null,
      h1Top: h1 ? Math.round(h1.top) : null,
      h1Lines: lines('h1'),
      h1Height: h1 ? Math.round(h1.height) : 0,
      ledeLines: lede
        ? Math.round(lede.height / (parseFloat(getComputedStyle(
            document.querySelector('.lede') || document.querySelector('.hero-photo__sub') ||
            document.querySelector('.hero-sub') || document.querySelector('.hub-lede')
          ).lineHeight) || 1))
        : 0,
      ledeHeight: lede ? Math.round(lede.height) : 0,
      eyebrowHeight: eyebrow ? Math.round(eyebrow.height) : 0,
      crumbHeight: crumb ? Math.round(crumb.height) : 0,
      navHeight: nav ? Math.round(nav.height) : 0,
      trustHeight: trust ? Math.round(trust.height) : 0,
      cardTop: card ? Math.round(card.top) : null,
    };
  }, fold);
}

/**
 * Measure a list of {url} at one viewport. Exported so the static gate runs the
 * very same code the audit did.
 */
export async function measureFold(urls, { width = 360, height = 740, fold = FOLD_360 } = {}) {
  const { server, base } = await serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.route('**googletagmanager.com/**', (r) => r.abort());
  const rows = [];
  try {
    for (const u of urls) {
      const url = typeof u === 'string' ? u : u.url;
      const type = typeof u === 'string' ? 'unknown' : u.type;
      rows.push({ url, type, ...(await measureOne(page, base, url, fold)) });
    }
  } finally {
    await ctx.close();
    await browser.close();
    server.close();
  }
  return rows;
}

// ── report mode ──────────────────────────────────────────────────────────────
if (process.argv.includes('--report')) {
  const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1];
  const n = Number(arg('sample') || 0);
  const only = arg('type');

  const all = await foldPages();
  const wanted = all.filter((p) => FOLD_TYPES.includes(p.type) && (!only || p.type === only));
  const byType = new Map();
  for (const p of wanted) {
    if (!byType.has(p.type)) byType.set(p.type, []);
    byType.get(p.type).push(p);
  }

  const picked = [];
  for (const [, list] of byType) picked.push(...sample(list, n));
  console.log(`measuring ${picked.length} page(s) of ${wanted.length} across ${byType.size} type(s)\n`);

  for (const [label, fold, vp] of [
    ['360x740', FOLD_360, { width: 360, height: 740 }],
    ['375x812', FOLD_375, { width: 375, height: 812 }],
  ]) {
    const rows = await measureFold(picked, { ...vp, fold });
    console.log(`\n=== ${label} (fold line ${fold}) ===`);
    console.log(
      'type'.padEnd(18) + 'pages'.padStart(6) + 'above'.padStart(8) + '  %above' +
        '  medianBottom' + '  medH1ln' + '  medLedeln'
    );
    const med = (a) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);
    for (const t of FOLD_TYPES) {
      const r = rows.filter((x) => x.type === t);
      if (!r.length) continue;
      const ok = r.filter((x) => x.above).length;
      console.log(
        t.padEnd(18) + String(r.length).padStart(6) + String(ok).padStart(8) +
          `  ${((ok / r.length) * 100).toFixed(0).padStart(5)}%` +
          `  ${String(med(r.map((x) => x.ctaBottom ?? 0))).padStart(11)}` +
          `  ${String(med(r.map((x) => x.h1Lines))).padStart(6)}` +
          `  ${String(med(r.map((x) => x.ledeLines))).padStart(9)}`
      );
    }
    const worst = rows.filter((x) => x.ctaBottom !== null)
      .sort((a, b) => b.ctaBottom - a.ctaBottom).slice(0, 5);
    console.log(`\n  worst 5 @ ${label}:`);
    for (const w of worst) {
      console.log(
        `    ${String(w.ctaBottom).padStart(4)}  ${w.url}` +
          `\n          nav ${w.navHeight} · crumb ${w.crumbHeight} · eyebrow ${w.eyebrowHeight}` +
          ` · h1 ${w.h1Height}px/${w.h1Lines}ln · lede ${w.ledeHeight}px/${w.ledeLines}ln` +
          ` · h1Top ${w.h1Top} · ctaTop ${w.ctaTop}`
      );
    }
    if (label === '360x740') {
      const cards = rows.filter((x) => x.cardTop !== null);
      const bad = cards.filter((x) => x.cardTop > x.vh * 1.5);
      console.log(`\n  AI card within 1.5vh: ${cards.length - bad.length}/${cards.length}` +
        (bad.length ? ` — worst ${bad[0].url} @ ${bad[0].cardTop}` : ''));
    }
  }
}
