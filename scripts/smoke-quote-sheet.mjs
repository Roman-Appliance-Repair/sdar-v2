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
//   · fold gate (360×740, 375×812, 1280×800): the "Get your price" button is
//     fully above the fold without scrolling, the call button at least half so
//   · step fold (360×740): the 16-tile appliance step fits with Continue and does
//     not scroll; the symptom step keeps ≤12 tiles with Continue pinned
//   · ZIP from Google: Place Details stays inside the Essentials SKU, fills the
//     ZIP, marks it, and a typed override warns instead of losing the verification
//
// Usage: node scripts/smoke-quote-sheet.mjs [--headed] [--base=https://…]
//        --base points the suite at a deployed origin (release check) instead of dist/.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const HEADED = process.argv.includes('--headed');
const BASE_OVERRIDE = (process.argv.find((a) => a.startsWith('--base=')) || '').slice(7);

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

/**
 * Stands in for the Google Maps JS library. Installed via addInitScript so it is
 * present before the island wires step 6, exactly as a warm real script would be.
 * `failing: true` makes fetchAutocompleteSuggestions throw, which is the only
 * condition allowed to turn the note red.
 */
function mapsMock(failing, detailsFail) {
  return `(() => {
    const PLACE = {
      id: 'mock-place-1',
      formattedAddress: '8746 Rangely Ave, West Hollywood, CA 90048, USA',
      addressComponents: [
        { types: ['street_number'], longText: '8746' },
        { types: ['route'], longText: 'Rangely Ave' },
        { types: ['locality'], longText: 'West Hollywood' },
        { types: ['administrative_area_level_1'], longText: 'California' },
        { types: ['postal_code'], longText: '90048' },
      ],
      location: { lat: () => 34.0800742, lng: () => -118.384211 },
      fetchFields: async (req) => {
        // Recorded so the gate can prove the request stays inside the Essentials SKU.
        window.__qsDetailsFields = (req && req.fields) || [];
        // Reproduces the live project: GetPlaceRequestPerDayPerProject = 0.
        if (${detailsFail ? 'true' : 'false'}) {
          throw new Error(
            "PLACES_GET_PLACE: RESOURCE_EXHAUSTED: Quota exceeded for quota metric 'GetPlaceRequest'"
          );
        }
      },
    };
    window.google = {
      maps: {
        places: {
          AutocompleteSessionToken: function () {},
          Place: function () { return PLACE; },
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: async () => {
              if (${failing ? 'true' : 'false'}) throw new Error('mock lookup failure');
              return {
                suggestions: [{
                  placePrediction: {
                    text: { text: '8746 Rangely Ave, West Hollywood, CA, USA' },
                    structuredFormat: {
                      mainText: { text: '8746 Rangely Ave' },
                      secondaryText: { text: 'West Hollywood, CA, USA' },
                    },
                    placeId: 'mock-place-1',
                    types: ['street_address', 'geocode'],
                    toPlace: () => PLACE,
                  },
                }],
              };
            },
          },
        },
      },
    };
  })();`;
}

/**
 * QS-1.4 fold gate. On a real 360×800 Android the "Get your price" button sat
 * below the fold, so the page opened on an empty grey band and an H1. The rule:
 * with no scrolling at all, the quote button's box is fully inside the viewport
 * (bottom ≤ height − 8px) and the call button is at least half visible.
 *
 * 1280×800 is checked too — on desktop both buttons must be fully visible.
 */
async function foldLeg(browser, base, viewport, label, opts = {}) {
  const { desktop = false } = opts;
  console.log(`\n[fold ${label}] ${viewport.width}×${viewport.height}`);
  const ctx = await browser.newContext({
    viewport,
    ...(desktop ? {} : { hasTouch: true, isMobile: true, deviceScaleFactor: 3 }),
  });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.goto(`${base}/book/`, { waitUntil: 'load' });
  // Fonts change line counts, which changes where the buttons land. Wait for the
  // real metrics rather than gating on a fallback-font layout.
  await page.evaluate(() => document.fonts && document.fonts.ready);

  const scrolled = await page.evaluate(() => window.scrollY);
  expect(`fold ${label}: page did not scroll`, scrolled === 0, `scrollY=${scrolled}`);

  const geo = await page.evaluate(() => {
    const q = document.querySelector('[data-quote-source]');
    const c = document.getElementById('heroCall');
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right };
    };
    return { vh: window.innerHeight, vw: window.innerWidth, quote: box(q), call: box(c) };
  });

  const { vh, quote, call } = geo;

  expect(
    `fold ${label}: quote button fully above the fold`,
    quote.top >= 0 && quote.bottom <= vh - 8,
    `top=${quote.top.toFixed(1)} bottom=${quote.bottom.toFixed(1)} vh=${vh}`
  );
  expect(
    `fold ${label}: quote button is ≥ 56px tall`,
    quote.height >= 56,
    `${quote.height.toFixed(1)}px`
  );

  const callVisible = Math.max(0, Math.min(call.bottom, vh) - Math.max(call.top, 0));
  const callRatio = call.height ? callVisible / call.height : 0;
  if (desktop) {
    expect(
      `fold ${label}: call button fully above the fold`,
      call.top >= 0 && call.bottom <= vh,
      `top=${call.top.toFixed(1)} bottom=${call.bottom.toFixed(1)} vh=${vh}`
    );
  } else {
    expect(
      `fold ${label}: call button at least 50% visible`,
      callRatio >= 0.5,
      `${(callRatio * 100).toFixed(0)}% visible (top=${call.top.toFixed(1)} bottom=${call.bottom.toFixed(1)} vh=${vh})`
    );
  }

  // The trigger must still be the sheet's trigger, not a plain link.
  const src = await page.getAttribute('[data-quote-source]', 'data-quote-source');
  expect(`fold ${label}: trigger still carries data-quote-source`, src === 'book-hero', String(src));

  await ctx.close();
}

/** Drives steps 1-5 so the caller lands on step 6 with a resumable state. */
async function walkToContact(page) {
  await page.click('[data-quote-source]');
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });
  await (await tileByText(page, 'At home')).click();
  await (await tileByText(page, 'Refrigerator')).click();
  await (await tileByText(page, 'Not cooling')).click();
  await page.click('#qs-primary'); // problem -> photos
  await page.click('#qs-primary'); // photos  -> price
  await page.click('#qs-primary'); // price   -> contact
}

/** Address verification, both legs. */
async function addressLeg(browser, base, failing) {
  const label = failing ? 'address (lookup fails)' : 'address (verified)';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(mapsMock(failing, false));
  const page = await ctx.newPage();

  // The real library must never be fetched during the test.
  await page.route('**maps.googleapis.com/**', (r) => r.abort());

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    captured.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}/book/`, { waitUntil: 'domcontentloaded' });
  await walkToContact(page);
  expect(`${label}: reached step 6`, (await counter(page)) === '6 / 6', await counter(page));

  // Type enough to pass the 4-character threshold and let the 250 ms debounce fire.
  await page.fill('#qs-address', '8746 Rangely');
  await page.waitForTimeout(600);

  if (!failing) {
    const items = await page.locator('#qs-addr-list .qs-addr-item').count();
    expect(`${label}: suggestion list opens`, items === 1, `${items} item(s)`);

    // Click the suggestion the way a visitor does — the island's own pointerdown
    // handler, not a class poked from the test.
    await page.locator('#qs-addr-list .qs-addr-item').first().dispatchEvent('pointerdown');
    await page.waitForTimeout(300);

    const note = await page.locator('#qs-addr-note').evaluate((el) => ({
      cls: el.className,
      text: el.textContent.trim(),
      color: getComputedStyle(el).color,
    }));
    expect(`${label}: note turns green`, note.cls === 'qs-ok', JSON.stringify(note));
    expect(`${label}: note reads the city`, note.text === '✓ West Hollywood, CA', note.text);

    const addr = await page.inputValue('#qs-address');
    const zip = await page.inputValue('#qs-zip');
    expect(`${label}: address replaced by the formatted one`,
      addr === '8746 Rangely Ave, West Hollywood, CA 90048, USA', addr);
    expect(`${label}: ZIP filled from the place`, zip === '90048', zip);
  } else {
    const note = await page.locator('#qs-addr-note').evaluate((el) => ({
      cls: el.className,
      text: el.textContent.trim(),
    }));
    expect(`${label}: note turns red`, note.cls === 'qs-err', JSON.stringify(note));
    expect(
      `${label}: red text is the lookup message`,
      note.text === "Address lookup isn't responding — type it in full and we'll confirm by phone.",
      note.text
    );
    const items = await page.locator('#qs-addr-list .qs-addr-item').count();
    expect(`${label}: no suggestion list`, items === 0, `${items} item(s)`);
    // A broken lookup must never stop a submit — fill the rest by hand.
    await page.fill('#qs-zip', '90048');
  }

  await page.fill('#qs-name', 'Dana');
  await page.fill('#qs-phone', '3105550134');
  await (await tileByText(page, 'ASAP')).click();
  await page.click('#qs-primary');
  await page.waitForTimeout(400);

  expect(`${label}: submit went through`, captured.length === 1, `${captured.length} request(s)`);
  if (captured.length) {
    const p = JSON.parse(captured[0]);
    expect(`${label}: address_verified is ${!failing}`, p.address_verified === !failing,
      String(p.address_verified));
    if (!failing) {
      expect(`${label}: place_id in payload`, p.place_id === 'mock-place-1', String(p.place_id));
      // QS-1.5: Place Details is asked for formattedAddress + addressComponents only,
      // so no coordinates arrive even though the mock place carries a location.
      expect(`${label}: no lat/lng — location was not requested`,
        p.lat === null && p.lng === null, `${p.lat}, ${p.lng}`);
      expect(`${label}: city from Google in payload`, p.city_display === 'West Hollywood',
        String(p.city_display));
      expect(`${label}: branch still routed by ZIP`, p.city === 'west-hollywood', String(p.city));
    }
  }

  await ctx.close();
}

/**
 * QS-1.3a regression. On the live project Place Details is capped at zero requests a
 * day, so fetchFields always throws; the sheet used to treat that as a failed lookup
 * and shipped the lead marked unverified. Verification now comes from the prediction,
 * and Details is only an upgrade. Driven on a touch device with the full tap sequence
 * a phone actually delivers.
 */
async function detailsBlockedLeg(browser, base) {
  const label = 'address (details quota-blocked, touch)';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2.625,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });
  await ctx.addInitScript(mapsMock(false, true));
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    captured.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}/book/`, { waitUntil: 'domcontentloaded' });
  await walkToContact(page);

  await page.fill('#qs-address', '816 Bartlett');
  await page.waitForTimeout(600);
  const items = await page.locator('#qs-addr-list .qs-addr-item').count();
  expect(`${label}: suggestion list opens`, items === 1, `${items} item(s)`);

  // A real tap: touchstart/touchend, then the click the browser synthesises after it.
  const box = await page.locator('#qs-addr-list .qs-addr-item').first().boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);

  const note = await page.locator('#qs-addr-note').evaluate((el) => ({
    cls: el.className,
    text: el.textContent.trim(),
  }));
  expect(`${label}: note is green, not red`, note.cls === 'qs-ok', JSON.stringify(note));
  expect(`${label}: note names the city`, note.text === '✓ West Hollywood, CA', note.text);

  const addr = await page.inputValue('#qs-address');
  expect(
    `${label}: address kept from the prediction`,
    addr === '8746 Rangely Ave, West Hollywood, CA, USA',
    addr
  );

  // Details never answered, so the ZIP is still the visitor's to enter.
  await page.fill('#qs-zip', '90048');
  await page.fill('#qs-name', 'Dana');
  await page.fill('#qs-phone', '3105550134');
  await (await tileByText(page, 'ASAP')).click();

  // One tap, one selection: the sheet must not have fired choose() three times.
  await page.tap('#qs-primary');
  await page.waitForTimeout(500);

  expect(`${label}: exactly one submit`, captured.length === 1, `${captured.length} request(s)`);
  if (captured.length) {
    const p = JSON.parse(captured[0]);
    expect(`${label}: address_verified is true`, p.address_verified === true, String(p.address_verified));
    expect(`${label}: place_id survived`, p.place_id === 'mock-place-1', String(p.place_id));
    expect(`${label}: city from Google`, p.city_display === 'West Hollywood', String(p.city_display));
    expect(`${label}: lat/lng absent without details`, p.lat === null && p.lng === null, `${p.lat}/${p.lng}`);
    expect(`${label}: branch routed by the typed ZIP`, p.city === 'west-hollywood', String(p.city));
  }

  await ctx.close();
}


/**
 * QS-1.5 step-fold gate. The appliance step grew from 10 tiles to 16, and a step
 * whose options run off the bottom of a 360×740 phone loses the ones below the
 * cut. Rule for the APPLIANCE step: the whole grid plus Continue fits with the
 * sheet body not scrolling at all. Rule for the SYMPTOM step: at most 12 tiles,
 * the body may scroll, but Continue stays pinned and fully visible.
 */
async function stepFoldLeg(browser, base) {
  const label = 'step fold 360×740';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
  });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.goto(`${base}/book/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  await page.click('[data-quote-source]');
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });

  // ── residential appliance step ────────────────────────────────────────────
  await (await tileByText(page, 'At home')).click();
  await page.waitForTimeout(150);

  const res = await measureStep(page);
  expect(`${label}: 16 residential appliance tiles`, res.tiles === 16, `${res.tiles}`);
  expect(`${label}: appliance grid is the compact variant`, res.compact, JSON.stringify(res.style));
  expect(
    `${label}: compact tile is 44px min / 10px 12px / 15px`,
    res.style.minHeight === '44px' && res.style.padding === '10px 12px' && res.style.fontSize === '15px',
    JSON.stringify(res.style)
  );
  expect(`${label}: compact grid gap is 8px`, res.style.gap === '8px', res.style.gap);
  expect(
    `${label}: appliance step does not scroll`,
    res.overflow === 0,
    `body overflows by ${res.overflow}px`
  );
  expect(
    `${label}: last appliance tile sits above Continue`,
    res.lastTileBottom <= res.primaryTop,
    `tile ends ${res.lastTileBottom}, Continue starts ${res.primaryTop}`
  );
  expect(
    `${label}: Continue fully visible on the appliance step`,
    res.primaryBottom <= res.vh,
    `${res.primaryBottom} > ${res.vh}`
  );

  // ── residential symptom step ──────────────────────────────────────────────
  await (await tileByText(page, 'Refrigerator')).click();
  await page.waitForTimeout(150);
  const sym = await measureStep(page);
  expect(`${label}: symptom step carries 10-12 tiles`, sym.tiles >= 10 && sym.tiles <= 12, `${sym.tiles}`);
  expect(
    `${label}: symptom tiles keep the full 56px size`,
    !sym.compact && sym.style.minHeight === '56px' && sym.style.fontSize === '16px',
    JSON.stringify(sym.style)
  );
  expect(
    `${label}: Continue stays pinned on the symptom step`,
    sym.primaryBottom <= sym.vh && sym.primaryTop >= 0,
    `${sym.primaryTop}-${sym.primaryBottom} vs ${sym.vh}`
  );
  expect(`${label}: last symptom tile is "Something else"`, sym.lastTileText === 'Something else', sym.lastTileText);

  // ── commercial appliance step ─────────────────────────────────────────────
  await page.click('#qs-back');
  await page.waitForTimeout(120);
  await page.click('#qs-back');
  await page.waitForTimeout(120);
  await (await tileByText(page, 'In a business')).click();
  await page.waitForTimeout(150);
  const com = await measureStep(page);
  expect(`${label}: 11 commercial appliance tiles`, com.tiles === 11, `${com.tiles}`);
  expect(
    `${label}: commercial appliance step does not scroll`,
    com.overflow === 0,
    `body overflows by ${com.overflow}px`
  );

  await (await tileByText(page, 'Walk-in')).click();
  await page.waitForTimeout(150);
  const comSym = await measureStep(page);
  expect(
    `${label}: commercial symptom step carries 10-12 tiles`,
    comSym.tiles >= 10 && comSym.tiles <= 12,
    `${comSym.tiles}`
  );
  expect(
    `${label}: Continue stays pinned on the commercial symptom step`,
    comSym.primaryBottom <= comSym.vh,
    `${comSym.primaryBottom} > ${comSym.vh}`
  );

  await ctx.close();
}

/** Geometry + computed style of the tile grid currently on screen. */
function measureStep(page) {
  return page.evaluate(() => {
    const body = document.getElementById('qs-body');
    const grid = document.querySelector('#qs-body .qs-tiles');
    const tiles = [...document.querySelectorAll('#qs-body .qs-tile')];
    const primary = document.getElementById('qs-primary').getBoundingClientRect();
    const last = tiles.length ? tiles[tiles.length - 1].getBoundingClientRect() : null;
    const cs = tiles.length ? getComputedStyle(tiles[0]) : null;
    const gs = grid ? getComputedStyle(grid) : null;
    return {
      tiles: tiles.length,
      compact: Boolean(grid && grid.classList.contains('qs-compact')),
      overflow: body.scrollHeight - body.clientHeight,
      lastTileBottom: last ? +last.bottom.toFixed(1) : 0,
      lastTileText: tiles.length ? tiles[tiles.length - 1].textContent.trim() : '',
      primaryTop: +primary.top.toFixed(1),
      primaryBottom: +primary.bottom.toFixed(1),
      vh: window.innerHeight,
      style: cs
        ? {
            minHeight: cs.minHeight,
            padding: cs.padding,
            fontSize: cs.fontSize,
            gap: gs ? gs.rowGap : '',
          }
        : {},
    };
  });
}

/**
 * QS-1.5 ZIP-from-Google gate. Place Details fills the ZIP from the building the
 * visitor picked, the field says so and stays editable, and a ZIP typed over it
 * is a disagreement to be reported — not a reason to throw away a verified
 * address. Routing follows Google's ZIP; dispatch gets both numbers.
 */
async function zipLeg(browser, base) {
  const label = 'zip (from Google)';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(mapsMock(false, false));
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    captured.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}/book/`, { waitUntil: 'domcontentloaded' });
  await walkToContact(page);

  await page.fill('#qs-address', '8746 Rangely');
  await page.waitForTimeout(600);
  await page.locator('#qs-addr-list .qs-addr-item').first().click();
  await page.waitForTimeout(500);

  // Essentials SKU: the two fields the sheet consumes, and nothing else.
  const fields = await page.evaluate(() => window.__qsDetailsFields || null);
  expect(`${label}: Place Details was called`, Array.isArray(fields), String(fields));
  expect(
    `${label}: Details asks for formattedAddress + addressComponents only`,
    Array.isArray(fields) &&
      fields.length === 2 &&
      fields.includes('formattedAddress') &&
      fields.includes('addressComponents'),
    JSON.stringify(fields)
  );

  const zipVal = await page.inputValue('#qs-zip');
  expect(`${label}: ZIP filled from Place Details`, zipVal === '90048', zipVal);
  const zipLabel = await page.locator('#qs-zip').evaluate(
    (el) => el.closest('.qs-field').querySelector('span').textContent.trim()
  );
  expect(`${label}: field is marked as coming from Google`, /from Google/.test(zipLabel), zipLabel);
  const editable = await page.locator('#qs-zip').evaluate((el) => !el.readOnly && !el.disabled);
  expect(`${label}: the ZIP stays editable`, editable);
  expect(`${label}: no disagreement note yet`, (await page.locator('#qs-zip-mismatch').count()) === 0);

  // The visitor overrides it with a ZIP that belongs to a different city.
  await page.fill('#qs-zip', '90032');
  await page.waitForTimeout(200);
  const warn = await page.locator('#qs-zip-mismatch').innerText();
  expect(
    `${label}: disagreement note names Google's ZIP`,
    warn.trim() === "That ZIP doesn't match the address you picked — we'll go with 90048",
    JSON.stringify(warn)
  );
  const stillGreen = await page.locator('#qs-addr-note').evaluate((el) => el.className);
  expect(`${label}: the address stays verified`, stillGreen === 'qs-ok', stillGreen);

  await page.fill('#qs-name', 'Dana');
  await page.fill('#qs-phone', '3105550134');
  await (await tileByText(page, 'ASAP')).click();
  await page.click('#qs-primary');
  await page.waitForTimeout(400);

  expect(`${label}: submit went through`, captured.length === 1, `${captured.length} request(s)`);
  if (captured.length) {
    const p = JSON.parse(captured[0]);
    expect(`${label}: zip is Google's`, p.zip === '90048', String(p.zip));
    expect(`${label}: zip_google in payload`, p.zip_google === '90048', String(p.zip_google));
    expect(`${label}: zip_typed keeps what the visitor typed`, p.zip_typed === '90032', String(p.zip_typed));
    expect(`${label}: routed on the Google ZIP`, p.city === 'west-hollywood', String(p.city));
    expect(`${label}: address still verified`, p.address_verified === true, String(p.address_verified));
    expect(`${label}: in zone by the Google ZIP`, p.out_of_zone === false, String(p.out_of_zone));
  }

  await ctx.close();
}

/**
 * The other half: Place Details never answers (the live project's quota), so there
 * is no Google ZIP at all. The typed ZIP is then the only one, it routes, and it
 * must not be labelled as Google's.
 */
async function zipManualLeg(browser, base) {
  const label = 'zip (details quota-blocked)';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(mapsMock(false, true));
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    captured.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}/book/`, { waitUntil: 'domcontentloaded' });
  await walkToContact(page);
  await page.fill('#qs-address', '8746 Rangely');
  await page.waitForTimeout(600);
  await page.locator('#qs-addr-list .qs-addr-item').first().click();
  await page.waitForTimeout(500);

  expect(`${label}: ZIP left empty for the visitor`, (await page.inputValue('#qs-zip')) === '');
  const zipLabel = await page.locator('#qs-zip').evaluate(
    (el) => el.closest('.qs-field').querySelector('span').textContent.trim()
  );
  expect(`${label}: field is NOT marked as coming from Google`, !/from Google/.test(zipLabel), zipLabel);

  await page.fill('#qs-zip', '90032');
  await page.waitForTimeout(200);
  expect(
    `${label}: a typed ZIP raises no disagreement`,
    (await page.locator('#qs-zip-mismatch').count()) === 0
  );

  await page.fill('#qs-name', 'Dana');
  await page.fill('#qs-phone', '3105550134');
  await (await tileByText(page, 'ASAP')).click();
  await page.click('#qs-primary');
  await page.waitForTimeout(400);

  expect(`${label}: submit went through`, captured.length === 1, `${captured.length} request(s)`);
  if (captured.length) {
    const p = JSON.parse(captured[0]);
    expect(`${label}: zip is the typed one`, p.zip === '90032', String(p.zip));
    expect(`${label}: zip_google is empty`, p.zip_google === '', JSON.stringify(p.zip_google));
    expect(`${label}: zip_typed matches`, p.zip_typed === '90032', String(p.zip_typed));
    expect(`${label}: routed on the typed ZIP`, p.city === 'los-angeles', String(p.city));
    expect(`${label}: address still verified from the prediction`, p.address_verified === true,
      String(p.address_verified));
  }

  await ctx.close();
}

// ── run ──────────────────────────────────────────────────────────────────────
// --base=https://… drives the whole suite against a deployed origin instead of the
// throwaway dist/ server. Used to verify a release: /api/contact is still routed and
// fulfilled inside the browser, so pointing this at production sends nothing anywhere.
const { server, base } = BASE_OVERRIDE
  ? { server: { close() {} }, base: BASE_OVERRIDE.replace(/\/+$/, '') }
  : await serve();
if (BASE_OVERRIDE) console.log(`(running against ${base}, not dist/)`);
const browser = await chromium.launch({ headless: !HEADED });
try {
  await foldLeg(browser, base, { width: 360, height: 740 }, '360');
  await foldLeg(browser, base, { width: 375, height: 812 }, '375');
  await foldLeg(browser, base, { width: 1280, height: 800 }, 'desktop', { desktop: true });
  await journey(browser, base, { width: 375, height: 812 }, 'phone');
  await journey(browser, base, { width: 1280, height: 800 }, 'desktop');
  await noJsLeg(browser, base);
  await addressLeg(browser, base, false);
  await addressLeg(browser, base, true);
  await detailsBlockedLeg(browser, base);
  await stepFoldLeg(browser, base);
  await zipLeg(browser, base);
  await zipManualLeg(browser, base);
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
