#!/usr/bin/env node
// scripts/smoke-quote-sheet.mjs
//
// Behavioural gate for the QS-1 quote sheet. Serves dist/ over a throwaway HTTP
// server, drives Chromium at both a phone and a desktop viewport, and intercepts
// /api/contact so nothing leaves the machine.
//
// Covered:
//   · open → residential path all the way to the price step
//   · back = exactly one step
//   · close + reopen = resume where you left off
//   · submit reaches /api/contact with type 'quote'
//   · computed styles: tiles carry a border, the price renders ≥ 28px
//   · no-JS leg: the fallback form's native POST reaches /api/contact
//
// Usage: node scripts/smoke-quote-sheet.mjs [--headed]

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const HEADED = process.argv.includes('--headed');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

const results = [];
function ok(name) {
  results.push({ name, pass: true });
  console.log(`  ok    ${name}`);
}
function fail(name, detail) {
  results.push({ name, pass: false, detail });
  console.log(`  FAIL  ${name} — ${detail}`);
}
function expect(name, condition, detail = '') {
  condition ? ok(name) : fail(name, detail || 'assertion failed');
}

// ── static server ────────────────────────────────────────────────────────────
async function serve() {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      if (!path.extname(p)) p += '/index.html';
      const file = path.join(DIST, p);
      if (!file.startsWith(DIST)) throw new Error('traversal');
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

// ── helpers ──────────────────────────────────────────────────────────────────
const counter = (page) => page.locator('#qs-counter').innerText();
const dialogOpen = (page) => page.locator('dialog#quote-sheet[open]').count().then((n) => n > 0);

async function tileByText(page, text) {
  return page.locator('#qs-body .qs-tile', { hasText: text }).first();
}

// ── the JS journey, run once per viewport ────────────────────────────────────
async function journey(browser, base, viewport, label) {
  console.log(`\n[${label}] ${viewport.width}×${viewport.height}`);
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    const req = route.request();
    captured.push({
      method: req.method(),
      contentType: req.headers()['content-type'] || '',
      body: req.postData() || '',
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto(`${base}/book/`, { waitUntil: 'domcontentloaded' });

  // open
  await page.click('[data-quote-source]');
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });
  expect(`${label}: sheet opens`, await dialogOpen(page));
  expect(`${label}: counter starts at 1 / 6`, (await counter(page)) === '1 / 6', await counter(page));

  // computed style: tiles carry a border
  const tileBorder = await page.locator('#qs-body .qs-tile').first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      width: parseFloat(cs.borderTopWidth),
      style: cs.borderTopStyle,
      height: el.getBoundingClientRect().height,
    };
  });
  expect(
    `${label}: tiles have a visible border`,
    tileBorder.width > 0 && tileBorder.style !== 'none',
    JSON.stringify(tileBorder)
  );
  expect(`${label}: tiles are at least 56px tall`, tileBorder.height >= 56, `${tileBorder.height}px`);

  // residential path → price
  await (await tileByText(page, 'At home')).click();
  expect(`${label}: step 2 after "At home"`, (await counter(page)) === '2 / 6', await counter(page));

  await (await tileByText(page, 'Refrigerator')).click();
  expect(`${label}: step 3 after appliance`, (await counter(page)) === '3 / 6', await counter(page));

  await (await tileByText(page, 'Not cooling')).click();
  await page.click('#qs-primary');
  expect(`${label}: step 4 (photos)`, (await counter(page)) === '4 / 6', await counter(page));

  await page.click('#qs-primary');
  expect(`${label}: step 5 (price)`, (await counter(page)) === '5 / 6', await counter(page));

  const price = await page.locator('.qs-price-amount').evaluate((el) => ({
    text: el.textContent.trim(),
    fontSize: parseFloat(getComputedStyle(el).fontSize),
  }));
  expect(`${label}: price renders ≥ 28px`, price.fontSize >= 28, `${price.fontSize}px`);
  expect(
    `${label}: residential price shown`,
    price.text === String.fromCharCode(36) + '89',
    price.text
  );
  // The three terms, in order, byte-equal to what quote-copy.ts exports.
  const TERMS = [
    'Credited toward the repair when you hire us for the job.',
    "If our technician can't diagnose the problem, there's no diagnostic fee.",
    'You get a written report: what failed and which parts need replacing.',
  ];
  const shown = await page.locator('.qs-terms li').allInnerTexts();
  expect(`${label}: price step lists three terms`, shown.length === 3, `${shown.length} line(s)`);
  TERMS.forEach((t, i) => {
    expect(
      `${label}: term ${i + 1} byte-equal`,
      (shown[i] || '').trim() === t,
      JSON.stringify(shown[i])
    );
  });
  const heading = await page.locator('#qs-heading').innerText();
  expect(`${label}: price heading is "Diagnostic visit"`, heading.trim() === 'Diagnostic visit', heading);

  // back = exactly one step
  await page.click('#qs-back');
  await page.waitForTimeout(120);
  expect(`${label}: back moves exactly one step`, (await counter(page)) === '4 / 6', await counter(page));

  // close + reopen = resume
  await page.click('#qs-close');
  await page.waitForSelector('.qs-close-confirm', { timeout: 3000 });
  await page.click('[data-act="leave"]');
  await page.waitForTimeout(150);
  expect(`${label}: × closes after confirm`, !(await dialogOpen(page)));

  await page.click('[data-quote-source]');
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });
  expect(`${label}: reopen resumes at step 4`, (await counter(page)) === '4 / 6', await counter(page));

  // finish and submit
  await page.click('#qs-primary'); // photos → price
  await page.click('#qs-primary'); // price → contact
  expect(`${label}: step 6 (contact)`, (await counter(page)) === '6 / 6', await counter(page));

  await page.fill('#qs-name', 'Dana');
  await page.fill('#qs-phone', '3105550134');
  await page.fill('#qs-address', '8746 Rangely Ave');
  await page.fill('#qs-zip', '90048');
  await (await tileByText(page, 'ASAP')).click();
  await page.click('#qs-primary');
  await page.waitForTimeout(400);

  expect(`${label}: submit reached /api/contact`, captured.length === 1, `${captured.length} request(s)`);
  if (captured.length) {
    let parsed = null;
    try { parsed = JSON.parse(captured[0].body); } catch { /* reported below */ }
    expect(`${label}: payload type is 'quote'`, parsed && parsed.type === 'quote', JSON.stringify(parsed && parsed.type));
    expect(`${label}: payload carries the ZIP branch`, parsed && parsed.city === 'west-hollywood', parsed && parsed.city);
    expect(`${label}: payload carries the symptom`, parsed && Array.isArray(parsed.problems) && parsed.problems.includes('Not cooling'), JSON.stringify(parsed && parsed.problems));
    expect(`${label}: out_of_zone is false for 90048`, parsed && parsed.out_of_zone === false, String(parsed && parsed.out_of_zone));
  }

  const doneVisible = await page.locator('.qs-done').count();
  expect(`${label}: done screen shown`, doneVisible === 1, `${doneVisible} node(s)`);

  await ctx.close();
}

// ── the no-JS leg ────────────────────────────────────────────────────────────
async function noJsLeg(browser, base) {
  console.log('\n[no-JS] fallback form');
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    const req = route.request();
    captured.push({ method: req.method(), body: req.postData() || '' });
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>ok</h1>' });
  });

  await page.goto(`${base}/book/`, { waitUntil: 'load' });

  const sheetOpen = await page.locator('dialog#quote-sheet[open]').count();
  expect('no-JS: sheet stays closed', sheetOpen === 0, `${sheetOpen} open dialog(s)`);

  const formVisible = await page.locator('#qs-fallback-form').isVisible();
  expect('no-JS: fallback form is visible', formVisible);

  await page.fill('#qs-fallback-form [name="name"]', 'Dana');
  await page.fill('#qs-fallback-form [name="phone"]', '(310) 555-0134');
  await page.fill('#qs-fallback-form [name="problem_text"]', 'Sub-Zero warm on one side');
  // force: the page is still settling webfonts with JS off, so Playwright's
  // stability check never clears on its own.
  await page.locator('#qs-fallback-form button[type="submit"]').click({ force: true });
  await page.waitForTimeout(500);

  expect('no-JS: POST reached /api/contact', captured.length === 1, `${captured.length} request(s)`);
  if (captured.length) {
    expect('no-JS: method is POST', captured[0].method === 'POST', captured[0].method);
    const params = new URLSearchParams(captured[0].body);
    expect('no-JS: type=quote', params.get('type') === 'quote', String(params.get('type')));
    expect('no-JS: name delivered', params.get('name') === 'Dana', String(params.get('name')));
    expect('no-JS: honeypot empty', (params.get('website') || '') === '', String(params.get('website')));
  }

  await ctx.close();
}

// ── run ──────────────────────────────────────────────────────────────────────
const { server, base } = await serve();
const browser = await chromium.launch({ headless: !HEADED });
try {
  await journey(browser, base, { width: 375, height: 812 }, 'phone');
  await journey(browser, base, { width: 1280, height: 800 }, 'desktop');
  await noJsLeg(browser, base);
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.pass);
console.log('');
if (failed.length) {
  console.error(`smoke-quote-sheet: ${failed.length} FAILED, ${results.length - failed.length} passed`);
  process.exit(1);
}
console.log(`smoke-quote-sheet: ${results.length}/${results.length} passed`);
