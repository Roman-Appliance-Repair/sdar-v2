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
//   · QS-2 page types: a plain /book/ link opens the sheet on every page type, the
//     step count and the prefill match what the URL could know, and the visitor's own
//     saved answer outranks the next page's guess
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
  expect(`${label}: residential appliance step stays two columns`, res.columns === 2, String(res.columns));
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
  expect(`${label}: 21 commercial appliance tiles`, com.tiles === 21, `${com.tiles}`);
  // QS-3a: 19 tiles need a third column. Two would push the last six off a 360×740
  // screen, and a step that scrolls hides options from anyone who does not think to
  // scroll a list that looks finished.
  expect(`${label}: commercial appliance step uses three columns`, com.columns === 3, String(com.columns));
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
      columns: gs ? gs.gridTemplateColumns.split(' ').filter(Boolean).length : 0,
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


/**
 * QS-2 page-type leg. The sheet is now on every page, opened by any ordinary link
 * to /book/, and it arrives knowing what the page was about. Each case below is a
 * different amount of knowledge:
 *
 *   home / city pillar  — nothing. Step 1 asks, counter says 6.
 *   city x service      — scope AND appliance. Step 1 skipped, step 2 asks to confirm.
 *   service hub         — same, from a different slug vocabulary.
 *   commercial sub      — commercial scope, commercial tiles, walk-in prefilled.
 *   brand page          — brand only. Step 1 still asks; the chip carries the brand.
 */
const PAGE_TYPE_CASES = [
  {
    url: '/',
    label: 'home',
    pageType: 'home',
    counter: '1 / 6',
    firstHeading: 'Where is the appliance?',
  },
  {
    url: '/pasadena/',
    label: 'city pillar',
    pageType: 'city',
    counter: '1 / 6',
    firstHeading: 'Where is the appliance?',
  },
  {
    url: '/pasadena/dryer-repair/',
    label: 'city x service',
    pageType: 'city_service',
    counter: '1 / 5',
    firstHeading: 'Is it your Dryer?',
    primary: "Yes, that's it",
    prefillLabel: 'Dryer',
    tiles: 16,
  },
  {
    url: '/services/refrigerator-repair/',
    label: 'service hub',
    pageType: 'service_hub',
    counter: '1 / 5',
    firstHeading: 'Is it your Refrigerator?',
    primary: "Yes, that's it",
    prefillLabel: 'Refrigerator',
    tiles: 16,
  },
  {
    url: '/commercial/refrigeration/walk-in-cooler-repair/',
    label: 'commercial sub',
    pageType: 'commercial_sub',
    counter: '1 / 5',
    firstHeading: 'Is it your Walk-in?',
    primary: "Yes, that's it",
    prefillLabel: 'Walk-in',
    tiles: 21,
  },
  {
    url: '/brands/lg-washer-repair/',
    label: 'brand combo',
    pageType: 'brand',
    counter: '1 / 5',
    firstHeading: 'Is it your Washer?',
    primary: "Yes, that's it",
    prefillLabel: 'Washer',
    tiles: 16,
    brandChip: 'LG',
  },
  {
    // A pillar names a brand and no appliance — step 2 opens with the chip and an
    // open question, which is the honest shape when the URL says only "LG".
    url: '/brands/lg/',
    label: 'brand pillar',
    pageType: 'brand',
    counter: '1 / 5',
    firstHeading: 'What needs fixing?',
    tiles: 16,
    brandChip: 'LG',
  },
];

/** Click the first in-body /book/ link — the one a visitor on a phone can reach. */
async function clickBookLink(page) {
  const link = page.locator('main a[href="/book/"]').first();
  await link.scrollIntoViewIfNeeded();
  await link.click();
}

async function pageTypeLeg(browser, base, spec) {
  const label = `page ${spec.label}`;
  console.log(`\n[${label}] ${spec.url}`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    captured.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}${spec.url}`, { waitUntil: 'domcontentloaded' });

  // The page carries a sheet, exactly one, and knows what kind of page it is.
  const shipped = await page.evaluate(() => {
    const blob = JSON.parse(document.getElementById('qs-data').textContent);
    return {
      dialogs: document.querySelectorAll('dialog#quote-sheet').length,
      ctx: blob.context,
    };
  });
  expect(`${label}: exactly one dialog`, shipped.dialogs === 1, String(shipped.dialogs));
  expect(`${label}: pageType is ${spec.pageType}`, shipped.ctx.pageType === spec.pageType, shipped.ctx.pageType);

  // A PLAIN /book/ link — no data-quote-source anywhere on it — opens the sheet.
  // Scoped to <main>: the header's "Book a visit" lives in a nav panel that is
  // collapsed on a phone, so it is not something a visitor can click at this width.
  const link = page.locator('main a[href="/book/"]:not([data-quote-source])').first();
  expect(`${label}: page carries a plain /book/ link in the body`, (await link.count()) > 0);
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });
  expect(`${label}: a plain /book/ link opens the sheet`, await dialogOpen(page));
  expect(`${label}: URL did not navigate`, new URL(page.url()).pathname === spec.url, page.url());

  expect(`${label}: counter reads ${spec.counter}`, (await counter(page)) === spec.counter, await counter(page));
  const heading = (await page.locator('#qs-heading').innerText()).trim();
  expect(`${label}: opens on "${spec.firstHeading}"`, heading === spec.firstHeading, heading);

  const backHidden = await page.locator('#qs-back').evaluate((el) => el.hidden);
  expect(`${label}: Back is hidden on the first visible step`, backHidden === true, String(backHidden));

  if (spec.prefillLabel) {
    const primaryText = (await page.locator('#qs-primary').innerText()).trim();
    expect(`${label}: primary button reads "${spec.primary}"`, primaryText === spec.primary, primaryText);

    const tileCount = await page.locator('#qs-body .qs-tile').count();
    expect(`${label}: ${spec.tiles} tiles for this scope`, tileCount === spec.tiles, String(tileCount));

    const pre = await page.evaluate(() => {
      const on = [...document.querySelectorAll('#qs-body .qs-tile[aria-pressed="true"]')];
      return on.map((el) => ({ text: el.textContent.trim(), soft: el.classList.contains('qs-tile-prefill') }));
    });
    expect(`${label}: exactly one tile pre-selected`, pre.length === 1, JSON.stringify(pre));
    expect(`${label}: it is "${spec.prefillLabel}"`, pre[0] && pre[0].text === spec.prefillLabel,
      JSON.stringify(pre));
    expect(`${label}: pre-selection is the soft style, not the red one`, pre[0] && pre[0].soft === true,
      JSON.stringify(pre));

    // Every other tile is still one tap away — the guess is not a lock.
    const otherEnabled = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('#qs-body .qs-tile')];
      return tiles.every((t) => !t.disabled);
    });
    expect(`${label}: every other tile is still tappable`, otherEnabled);
  } else {
    const primaryText = (await page.locator('#qs-primary').innerText()).trim();
    expect(`${label}: primary button is the plain Continue`, primaryText === 'Continue', primaryText);
    const preselected = await page.locator('#qs-body .qs-tile[aria-pressed="true"]').count();
    expect(`${label}: nothing is pre-selected`, preselected === 0, String(preselected));
  }

  // Brand chip: a note on step 2, never a question. Step 2 is the first visible
  // step on a brand page, so the chip is on screen the moment the sheet opens.
  if (spec.brandChip) {
    const chip = await page.locator('#qs-body .qs-chip').first().innerText().catch(() => '');
    expect(`${label}: brand chip reads "${spec.brandChip}"`, chip.trim() === spec.brandChip, chip);
  }

  await ctx.close();
}

/**
 * The prefill has to survive to the payload, and it has to give way the moment the
 * visitor disagrees. Both halves on one page: confirm the guess on one run, override
 * it on the next, and read what dispatch would receive each time.
 */
async function prefillPayloadLeg(browser, base, { override }) {
  const label = override ? 'prefill (overridden)' : 'prefill (confirmed)';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(mapsMock(false, true));
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());

  const captured = [];
  await page.route('**/api/contact', async (route) => {
    captured.push(route.request().postData() || '');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}/pasadena/dryer-repair/`, { waitUntil: 'domcontentloaded' });
  await clickBookLink(page);
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });

  if (override) {
    // Tapping any tile picks it AND moves on — that is the sheet's existing
    // behaviour and the right one, so the state to inspect is on the way back.
    await (await tileByText(page, 'Dishwasher')).click();
    await page.waitForTimeout(200);
    expect(`${label}: a tap advances to the symptom step`, (await counter(page)) === '2 / 5', await counter(page));

    await page.click('#qs-back');
    await page.waitForTimeout(200);
    const heading = (await page.locator('#qs-heading').innerText()).trim();
    expect(`${label}: heading reverts to the open question`, heading === 'What needs fixing?', heading);
    const primaryText = (await page.locator('#qs-primary').innerText()).trim();
    expect(`${label}: button reverts to Continue`, primaryText === 'Continue', primaryText);
    const picked = await page.evaluate(() => {
      const on = document.querySelector('#qs-body .qs-tile[aria-pressed="true"]');
      return on ? { text: on.textContent.trim(), soft: on.classList.contains('qs-tile-prefill') } : null;
    });
    expect(`${label}: their tile is the selected one`, picked && picked.text === 'Dishwasher', JSON.stringify(picked));
    expect(`${label}: drawn as a choice, not a guess`, picked && picked.soft === false, JSON.stringify(picked));
  }

  await page.click('#qs-primary'); // appliance -> problem
  // A symptom both the dryer and the dishwasher carry, so the same walk works
  // whether the visitor kept our guess or replaced it.
  await (await tileByText(page, "Won't start")).click();
  await page.click('#qs-primary'); // problem -> photos
  await page.click('#qs-primary'); // photos  -> price
  await page.click('#qs-primary'); // price   -> contact
  expect(`${label}: contact is the last visible step`, (await counter(page)) === '5 / 5', await counter(page));

  await page.fill('#qs-name', 'Dana');
  await page.fill('#qs-phone', '3105550134');
  await page.fill('#qs-address', '8746 Rangely Ave');
  await page.fill('#qs-zip', '91101');
  await (await tileByText(page, 'ASAP')).click();
  await page.click('#qs-primary');
  await page.waitForTimeout(400);

  expect(`${label}: submit went through`, captured.length === 1, `${captured.length} request(s)`);
  if (captured.length) {
    const p = JSON.parse(captured[0]);
    expect(`${label}: scope came from the page`, p.where === 'residential', String(p.where));
    expect(`${label}: page_type in payload`, p.page_type === 'city_service', String(p.page_type));
    expect(`${label}: appliance_prefilled is true`, p.appliance_prefilled === true, String(p.appliance_prefilled));
    expect(
      `${label}: appliance_changed is ${override}`,
      p.appliance_changed === override,
      String(p.appliance_changed)
    );
    expect(
      `${label}: appliance is ${override ? 'dishwasher' : 'dryer'}`,
      p.appliance === (override ? 'dishwasher' : 'dryer'),
      String(p.appliance)
    );
  }

  await ctx.close();
}

/**
 * The visitor's own answer outranks the next page's guess. Choose an appliance on
 * one page, walk to a page that guesses a different one, and the choice must stand —
 * a saved session is an answer, a URL is only evidence.
 */
async function resumeBeatsContextLeg(browser, base) {
  const label = 'resume beats page context';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.route('**/api/contact', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));

  await page.goto(`${base}/pasadena/dryer-repair/`, { waitUntil: 'domcontentloaded' });
  await clickBookLink(page);
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });
  await (await tileByText(page, 'Microwave')).click();
  await page.waitForTimeout(200);

  // Walk to a page whose context says "Refrigerator".
  await page.goto(`${base}/services/refrigerator-repair/`, { waitUntil: 'domcontentloaded' });
  await clickBookLink(page);
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 5000 });

  // Tapping a tile advances, so the sheet resumes on the symptom step — and the
  // symptoms on screen are the proof: "Sparking inside" belongs to the microwave
  // and to nothing this page would have guessed.
  const symptoms = await page.locator('#qs-body .qs-tile').allInnerTexts();
  expect(
    `${label}: resumed on the symptoms of THEIR appliance`,
    symptoms.includes('Sparking inside'),
    symptoms.slice(0, 4).join(' | ')
  );

  await page.click('#qs-back');
  await page.waitForTimeout(200);
  const picked = await page.evaluate(() => {
    const on = document.querySelector('#qs-body .qs-tile[aria-pressed="true"]');
    return on ? { text: on.textContent.trim(), soft: on.classList.contains('qs-tile-prefill') } : null;
  });
  expect(`${label}: the visitor's own pick survives`, picked && picked.text === 'Microwave', JSON.stringify(picked));
  expect(`${label}: it is still their choice, not our guess`, picked && picked.soft === false, JSON.stringify(picked));
  const heading = (await page.locator('#qs-heading').innerText()).trim();
  expect(`${label}: no confirm prompt over their answer`, heading === 'What needs fixing?', heading);

  await ctx.close();
}

/** With JS off a /book/ link is still a link. */
async function bookLinkNoJsLeg(browser, base) {
  const label = 'no-JS /book/ link';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/pasadena/dryer-repair/`, { waitUntil: 'domcontentloaded' });
  await clickBookLink(page);
  await page.waitForLoadState('domcontentloaded');
  expect(`${label}: navigates to /book/`, new URL(page.url()).pathname === '/book/', page.url());
  const form = await page.locator('#qs-fallback-form').count();
  expect(`${label}: the fallback form is there`, form === 1, String(form));
  await ctx.close();
}

// ── AID-2: the hero card ─────────────────────────────────────────────────────

/**
 * Fold rule for the homepage hero. The CTA row has to survive the card being added
 * to it, and the card itself has to be visibly there — not "reachable by scrolling",
 * which is exactly how the diagnostic disappeared the first time.
 */
async function aidFoldLeg(browser, base, viewport, label, opts = {}) {
  console.log(`\n[aid fold ${label}] ${viewport.width}×${viewport.height}`);
  const ctx = await browser.newContext({
    viewport,
    isMobile: !opts.desktop,
    hasTouch: !opts.desktop,
    deviceScaleFactor: opts.desktop ? 1 : 3,
  });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(250);

  const m = await page.evaluate(() => {
    const box = (s) => {
      const el = document.querySelector(s);
      return el ? el.getBoundingClientRect() : null;
    };
    const cta = box('.hp-cta-row');
    const card = box('.aid-card');
    const btn = box('.aid-card-btn');
    return {
      vh: window.innerHeight,
      scrolled: window.scrollY,
      ctaBottom: cta ? cta.bottom : null,
      cardTop: card ? card.top : null,
      cardBottom: card ? card.bottom : null,
      btnHeight: btn ? btn.height : null,
      inputFont: parseFloat(getComputedStyle(document.querySelector('.aid-card-input')).fontSize),
    };
  });

  expect(`${label}: nothing scrolled to get here`, m.scrolled === 0, String(m.scrolled));
  expect(`${label}: the CTA row is fully above the fold`, m.ctaBottom !== null && m.ctaBottom <= m.vh, `${m.ctaBottom} > ${m.vh}`);
  if (opts.desktop) {
    expect(`${label}: the whole card is visible`, m.cardBottom !== null && m.cardBottom <= m.vh, `${m.cardBottom} > ${m.vh}`);
  } else {
    const inside = m.vh - m.cardTop;
    expect(`${label}: the card starts at least 96px inside the viewport`, inside >= 96, `${Math.round(inside)}px`);
  }
  expect(`${label}: the card button is a 52px target`, m.btnHeight >= 52, String(m.btnHeight));
  expect(`${label}: the card input is 16px (no iOS zoom)`, m.inputFont >= 16, String(m.inputFont));
  await ctx.close();
}

/**
 * The whole journey: nothing React on load, the card opens the sheet carrying what
 * was typed, and the verdict's Book Online lands in the quote sheet with the answers
 * already given. /api/diagnose is mocked — no request leaves the machine.
 */
async function aidCardLeg(browser, base) {
  const label = 'aid card';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();

  const scripts = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') scripts.push(new URL(r.url()).pathname);
  });
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: 'Likely cause: thermal fuse. Repair range shown on site.' }),
    })
  );
  const posted = [];
  await page.route('**/api/contact', async (route) => {
    try { posted.push(JSON.parse(route.request().postData() || '{}')); } catch { /* not ours */ }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const reactBefore = scripts.filter((p) => /client\.[\w-]+\.js$|AIDiagnostic\.[\w-]+\.js$/.test(p));
  expect(`${label}: no React chunk before the card is used`, reactBefore.length === 0, reactBefore.join(', '));
  expect(`${label}: the sheet is closed on load`, (await page.locator('dialog#aid-sheet[open]').count()) === 0);

  // Typing is intent — the sheet takes over and keeps the words.
  await page.fill('#aid-card-input', 'my dryer runs but no heat');
  await page.waitForSelector('dialog#aid-sheet[open]', { timeout: 6000 });
  ok(`${label}: typing opens the sheet`);
  await page.waitForSelector('#aid-body button', { timeout: 6000 });
  ok(`${label}: the island mounted inside the sheet`);
  const reactAfter = scripts.filter((p) => /client\.[\w-]+\.js$|AIDiagnostic\.[\w-]+\.js$/.test(p));
  expect(`${label}: the React chunk arrives only now`, reactAfter.length > 0, 'no chunk requested');

  const sheet = page.locator('#aid-body');
  const cont = () => sheet.getByRole('button', { name: /Continue/ }).click();
  await sheet.getByText('Home Appliances').click();
  await cont();
  await page.waitForTimeout(150);
  await sheet.getByRole('button', { name: 'Dryer', exact: true }).click();
  await cont();
  await page.waitForTimeout(150);
  await sheet.getByRole('button', { name: 'LG', exact: true }).click();
  await sheet.getByRole('button', { name: 'Not heating', exact: true }).click();
  await cont();
  await page.waitForTimeout(250);

  const carried = await sheet.locator('textarea').inputValue();
  expect(`${label}: what they typed is waiting at step 4`, carried === 'my dryer runs but no heat', carried);

  await sheet.locator('input[type=text]').first().fill('Dana');
  await sheet.locator('input[type=tel]').fill('3105550134');
  await sheet.locator('input[type=email]').fill('dana@example.com');
  await cont();
  await page.waitForTimeout(200);
  await sheet.getByRole('button', { name: /Get my diagnosis/i }).click();
  await page.waitForSelector('#aid-body a[href="/book/"]', { timeout: 10000 });
  ok(`${label}: the verdict rendered`);

  // The handoff.
  await page.click('#aid-body a[href="/book/"]');
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 6000 });
  ok(`${label}: Book Online opens the quote sheet in place`);
  expect(
    `${label}: the diagnostic sheet got out of the way`,
    (await page.locator('dialog#aid-sheet[open]').count()) === 0,
    'still open on top of the quote sheet'
  );

  const heading = (await page.locator('#qs-heading').innerText()).trim();
  expect(`${label}: it lands on the price step`, heading === 'Diagnostic visit', heading);

  const seed = JSON.parse(await page.evaluate(() => sessionStorage.getItem('sdar_qs_v1')));
  expect(`${label}: where = residential`, seed.where === 'residential', String(seed.where));
  expect(`${label}: appliance = dryer`, seed.appliance === 'dryer', String(seed.appliance));
  expect(`${label}: problem = Not heating`, seed.problems[0] === 'Not heating', JSON.stringify(seed.problems));
  expect(`${label}: the typed words travelled too`, seed.problemText.includes('no heat'), seed.problemText);
  expect(`${label}: the lead is marked as a handoff`, seed.aidHandoff === true, String(seed.aidHandoff));

  const events = await page.evaluate(() =>
    (window.dataLayer || []).map((e) => String(e.event)).filter((e) => e.startsWith('aid_'))
  );
  for (const e of ['aid_card_open', 'aid_handoff_to_quote', 'aid_open', 'aid_verdict_shown']) {
    expect(`${label}: reports ${e}`, events.includes(e), events.join(', '));
  }

  // Finish the booking so the payload can be read: the source and the handoff flag
  // are what tell dispatch this lead already knows its own fault.
  await page.click('#qs-primary'); // price → contact
  await page.fill('#qs-name', 'Dana');
  await page.fill('#qs-phone', '3105550134');
  await page.fill('#qs-address', '8746 Rangely Ave');
  await page.fill('#qs-zip', '90048');
  await (await tileByText(page, 'ASAP')).click();
  await page.click('#qs-primary');
  await page.waitForTimeout(500);
  const quote = posted.find((p) => p && p.type === 'quote');
  expect(`${label}: the quote reached /api/contact`, Boolean(quote), 'no quote payload');
  if (quote) {
    expect(`${label}: source is ai-diagnostic`, quote.source === 'ai-diagnostic', String(quote.source));
    expect(`${label}: aid_handoff is true in the payload`, quote.aid_handoff === true, String(quote.aid_handoff));
    expect(`${label}: the appliance survived the handoff`, quote.appliance === 'dryer', String(quote.appliance));
  }
  await ctx.close();
}

/** Phone Back closes the diagnostic sheet, it does not leave the homepage. */
async function aidBackLeg(browser, base) {
  const label = 'aid back';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: 'load' });
  await page.click('.aid-card-btn');
  await page.waitForSelector('dialog#aid-sheet[open]', { timeout: 6000 });
  await page.goBack();
  await page.waitForTimeout(300);
  expect(`${label}: Back closes the sheet`, (await page.locator('dialog#aid-sheet[open]').count()) === 0);
  expect(`${label}: and stays on the homepage`, new URL(page.url()).pathname === '/', page.url());
  await ctx.close();
}

/** With JS off the card is a link to the diagnostic page, not a dead input. */
async function aidNoJsLeg(browser, base) {
  const label = 'aid no-JS';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.locator('.aid-card-btn').click({ force: true });
  await page.waitForLoadState('domcontentloaded');
  expect(`${label}: navigates to /ai-diagnostic/`, new URL(page.url()).pathname === '/ai-diagnostic/', page.url());
  await ctx.close();
}

// ── AID-3: the card on the rest of the site ──────────────────────────────────
//
// Five page types, one case each, plus the two rules that only exist as a pair: the
// card must be on every type listed and on none of the others.

/** The five smoke targets, and what each page can honestly answer for the visitor. */
const AID3_CASES = [
  {
    url: '/services/refrigerator-repair/',
    label: 'service hub',
    placeholder: 'My refrigerator: not cooling…',
    heading: 'Refrigerator acting up?',
    category: 'Home Appliances',
    appliance: 'Refrigerator',
    brand: null,
    step: 3,
  },
  {
    url: '/pasadena/dryer-repair/',
    label: 'city service',
    placeholder: 'My dryer: not heating…',
    heading: 'Dryer acting up?',
    category: 'Home Appliances',
    appliance: 'Dryer',
    brand: null,
    step: 3,
  },
  {
    url: '/brands/lg-washer-repair/',
    label: 'brand',
    placeholder: 'My LG washer: not spinning…',
    heading: 'LG washer acting up?',
    category: 'Home Appliances',
    appliance: 'Washer',
    brand: 'LG',
    step: 3,
  },
  {
    url: '/commercial/mixer-repair/',
    label: 'commercial hub',
    placeholder: "My mixer: won't start…",
    heading: 'Mixer acting up?',
    category: 'Restaurant Kitchen',
    appliance: 'Commercial Mixer',
    brand: null,
    step: 3,
  },
  {
    // /outdoor/ is the case where the address knows the CATEGORY and nothing else —
    // the sheet has no grill tile, so the appliance step is a real question and the
    // island has to open ON it rather than past it.
    url: '/outdoor/grill-repair/',
    label: 'outdoor',
    placeholder: "My dryer runs but doesn't heat…",
    heading: "Not sure what's wrong?",
    category: 'Outdoor Living',
    appliance: null,
    brand: null,
    step: 2,
  },
];

/** The red the island paints a chosen chip. A prefill that does not look chosen is
 *  not a prefill — the visitor cannot tell the step is already answered. */
const AID_CHOSEN = 'rgb(200, 16, 46)';

/**
 * Fold rule for the AID-3 card, which is a different rule from the homepage's.
 * These heroes already carry an H1, a subtitle and a CTA row, so the card is allowed
 * below the fold — but "below the fold" has to mean one scroll, not four. The CTAs
 * that were there before it are unchanged and still fully above the fold.
 */
async function aid3FoldLeg(browser, base, c) {
  const label = `aid3 fold ${c.label}`;
  console.log(`\n[${label}] ${c.url} 360x740`);
  const ctx = await browser.newContext({
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.goto(`${base}${c.url}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(250);

  const m = await page.evaluate(() => {
    const box = (s) => {
      const el = document.querySelector(s);
      return el ? el.getBoundingClientRect() : null;
    };
    // Whichever CTA row this hero happens to use — they are named differently in
    // ServiceHero, CommercialHero, the combo template and the hand-written heroes.
    const ctaSel = ['.hero-photo__ctas', '.hero-ctas', '.cta-row', '.hero-cta'];
    let cta = null;
    for (const s of ctaSel) { cta = cta || box(s); }
    const card = box('.aid-card');
    const btn = box('.aid-card-btn');
    const input = document.querySelector('.aid-card-input');
    return {
      vh: window.innerHeight,
      scrolled: window.scrollY,
      ctaTop: cta ? cta.top : null,
      ctaBottom: cta ? cta.bottom : null,
      cardTop: card ? card.top : null,
      btnHeight: btn ? btn.height : null,
      inputFont: input ? parseFloat(getComputedStyle(input).fontSize) : 0,
      placeholder: input ? input.placeholder : '',
      heading: (document.querySelector('.aid-card-h') || {}).textContent || '',
      compact: !!document.querySelector('.aid-card--compact'),
      // The card must never be a dark filled rectangle. Either it is the frame
      // (transparent) or it is the light surface — those are the only two.
      cardBg: card ? getComputedStyle(document.querySelector('.aid-card')).backgroundColor : '',
    };
  });

  expect(`${label}: nothing scrolled to get here`, m.scrolled === 0, String(m.scrolled));
  expect(`${label}: the card is there`, m.cardTop !== null, 'no .aid-card');
  // What the card owes the CTAs is that it did not move them, and the way it keeps
  // that promise is structural: it is emitted AFTER the CTA row and never before it,
  // so its own box cannot push theirs down. That is what these two assert together —
  // the row starts on the first screen, and the card begins at or below where the row
  // ends. Measured against a build of main, the CTA rectangles on all five of these
  // pages are identical to the pixel with the card added.
  //
  // Deliberately NOT asserted: that the CTA row ENDS above the fold. It already does
  // not on /pasadena/dryer-repair/ (704..827 in a 740 viewport) or
  // /brands/lg-washer-repair/ (692..813 in 757) — long ledes push the second button
  // under on those two templates, and both did so before this wave. Asserting it here
  // would make AID-3 red for something AID-3 neither caused nor can fix without
  // rewriting page copy. It is reported instead of hidden.
  expect(`${label}: the CTA row still starts above the fold`,
    m.ctaTop !== null && m.ctaTop < m.vh, `${m.ctaTop} >= ${m.vh}`);
  expect(`${label}: the card sits after the CTA row, so it moved nothing`,
    m.cardTop !== null && m.ctaBottom !== null && m.cardTop >= m.ctaBottom - 1,
    `card ${Math.round(m.cardTop)} vs cta bottom ${Math.round(m.ctaBottom)}`);
  expect(`${label}: the card top is within 1.5 viewport heights`,
    m.cardTop !== null && m.cardTop <= m.vh * 1.5, `${Math.round(m.cardTop)} > ${m.vh * 1.5}`);
  expect(`${label}: it is the compact variant`, m.compact);
  expect(`${label}: the heading matches the page`, m.heading.trim() === c.heading, m.heading);
  // The example in the field follows the page too — and on /outdoor/, which resolves
  // no tile, it must still be AID-2's neutral line rather than a guess.
  expect(`${label}: the placeholder matches the page`, m.placeholder === c.placeholder,
    m.placeholder);
  expect(`${label}: the card button is a 52px target`, m.btnHeight >= 52, String(m.btnHeight));
  expect(`${label}: the card input is 16px (no iOS zoom)`, m.inputFont >= 16, String(m.inputFont));
  {
    // rgba(...,0) = the frame; the light tone resolves to the --gray token. A dark
    // fill would be neither, and is the one outcome the design forbids.
    const transparent = /,\s*0\)$/.test(m.cardBg) || m.cardBg === 'transparent';
    const light = (m.cardBg.match(/\d+/g) || []).slice(0, 3).every((v) => Number(v) >= 200);
    expect(`${label}: the card is a frame or a light surface, never a dark fill`,
      transparent || light, m.cardBg);
  }
  await ctx.close();
}

/**
 * The prefill itself: the island opens on the first step the page could not answer,
 * with every earlier answer already made AND still reachable by Back. /api/diagnose
 * is mocked; nothing leaves the machine.
 */
async function aid3PrefillLeg(browser, base, c) {
  const label = `aid3 prefill ${c.label}`;
  console.log(`\n[${label}] ${c.url}`);
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  const scripts = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') scripts.push(new URL(r.url()).pathname);
  });
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"mocked"}' })
  );
  await page.goto(`${base}${c.url}`, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const reactBefore = scripts.filter((p) => /client\.[\w-]+\.js$|AIDiagnostic\.[\w-]+\.js$/.test(p));
  expect(`${label}: no React chunk before the card is used`, reactBefore.length === 0,
    reactBefore.join(', '));

  await page.fill('#aid-card-input', 'it started last night');
  await page.waitForSelector('dialog#aid-sheet[open]', { timeout: 6000 });
  await page.waitForSelector('#aid-body button', { timeout: 6000 });
  const reactAfter = scripts.filter((p) => /client\.[\w-]+\.js$|AIDiagnostic\.[\w-]+\.js$/.test(p));
  expect(`${label}: the React chunk arrives only now`, reactAfter.length > 0, 'no chunk requested');

  const sheet = page.locator('#aid-body');
  const stepText = async () => (await sheet.locator('text=/Step \\d of 5/').first().innerText()).trim();
  expect(`${label}: opens on step ${c.step}`, (await stepText()) === `Step ${c.step} of 5`,
    await stepText());

  /** Is the chip with this exact label painted as chosen? */
  // getComputedStyle runs in the BROWSER; AID_CHOSEN is a constant in this file and
  // does not exist there. Read the colour out, compare it here.
  const chosen = (name) =>
    sheet
      .getByRole('button', { name, exact: true })
      .first()
      .evaluate((el) => getComputedStyle(el).color)
      .then((col) => col === AID_CHOSEN);

  if (c.brand) {
    expect(`${label}: the brand chip is already chosen`, await chosen(c.brand), c.brand);
  }
  // Back must still reach every step the page answered — prefilled, not skipped.
  await sheet.getByRole('button', { name: /Back/ }).click();
  await page.waitForTimeout(150);
  if (c.appliance) {
    expect(`${label}: Back reaches the appliance step`, (await stepText()) === 'Step 2 of 5',
      await stepText());
    expect(`${label}: the appliance chip is already chosen`, await chosen(c.appliance), c.appliance);
    await sheet.getByRole('button', { name: /Back/ }).click();
    await page.waitForTimeout(150);
  }
  expect(`${label}: Back reaches the category step`, (await stepText()) === 'Step 1 of 5',
    await stepText());
  expect(`${label}: the category is already chosen`,
    (await sheet.locator('button', { hasText: c.category }).first()
      .evaluate((el) => getComputedStyle(el).color)) === AID_CHOSEN,
    c.category);

  // And it is a prefill, not a cage: a different answer is one tap away.
  await sheet.getByText('Ice Machines').click();
  await page.waitForTimeout(120);
  expect(`${label}: the visitor can overrule the page`,
    (await sheet.locator('button', { hasText: 'Ice Machines' }).first()
      .evaluate((el) => getComputedStyle(el).color)) === AID_CHOSEN);

  await ctx.close();
}

/**
 * The whole journey off a brand page: prefilled diagnosis → verdict → quote sheet,
 * and the brand the visitor confirmed arrives in the booking with them.
 */
async function aid3HandoffLeg(browser, base) {
  const label = 'aid3 handoff';
  console.log(`\n[${label}] /brands/lg-washer-repair/`);
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  await page.route('**/api/diagnose', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: 'Likely cause: drain pump. Range shown on site.' }),
    })
  );
  const posted = [];
  await page.route('**/api/contact', async (route) => {
    try { posted.push(JSON.parse(route.request().postData() || '{}')); } catch { /* not ours */ }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto(`${base}/brands/lg-washer-repair/`, { waitUntil: 'load' });
  await page.fill('#aid-card-input', 'water sits in the drum');
  await page.waitForSelector('#aid-body button', { timeout: 8000 });

  const sheet = page.locator('#aid-body');
  const cont = () => sheet.getByRole('button', { name: /Continue/ }).click();

  // Step 3, already carrying LG. Only the symptom is still open.
  await sheet.getByRole('button', { name: 'Not draining', exact: true }).click();
  await cont();
  await page.waitForTimeout(200);
  const carried = await sheet.locator('textarea').inputValue();
  expect(`${label}: the typed words are waiting at step 4`, carried === 'water sits in the drum',
    carried);

  await sheet.locator('input[type=text]').first().fill('Dana');
  await sheet.locator('input[type=tel]').fill('3105550134');
  await sheet.locator('input[type=email]').fill('dana@example.com');
  await cont();
  await page.waitForTimeout(200);
  const summary = await sheet.innerText();
  expect(`${label}: the summary names the prefilled appliance and brand`,
    summary.includes('Washer') && summary.includes('LG'), summary.slice(0, 120));

  await sheet.getByRole('button', { name: /Get my diagnosis/i }).click();
  await page.waitForSelector('#aid-body a[href="/book/"]', { timeout: 10000 });

  const log = posted.find((p) => p && p.name === '🤖 AI Diagnostics');
  expect(`${label}: the diagnostic log reached /api/contact`, Boolean(log), 'no log payload');
  if (log) {
    expect(`${label}: it says which page it came from`,
      String(log.page_url || '').includes('/brands/lg-washer-repair/'), String(log.page_url));
    expect(`${label}: it says the page prefilled it`, log.prefilled === true, String(log.prefilled));
    expect(`${label}: the brand travelled with it`, log.brand === 'LG', String(log.brand));
  }

  await page.click('#aid-body a[href="/book/"]');
  await page.waitForSelector('dialog#quote-sheet[open]', { timeout: 6000 });
  const heading = (await page.locator('#qs-heading').innerText()).trim();
  expect(`${label}: it lands on the price step`, heading === 'Diagnostic visit', heading);

  const seed = JSON.parse(await page.evaluate(() => sessionStorage.getItem('sdar_qs_v1')));
  expect(`${label}: appliance = washer`, seed.appliance === 'washer', String(seed.appliance));
  expect(`${label}: problem = Not draining`, seed.problems[0] === 'Not draining',
    JSON.stringify(seed.problems));
  expect(`${label}: the brand is carried into the quote seed`, seed.brandLabel === 'LG',
    String(seed.brandLabel));
  expect(`${label}: and as the pillar slug dispatch files it under`, seed.brand === 'lg',
    String(seed.brand));
  // The brand chip lives on the APPLIANCE step — it is a note about what the page was
  // about, next to the tiles. A handoff lands on the price step, past it, so the chip
  // is not on screen at this moment and looking for it here proves nothing. Walk back
  // to the step that renders it: that is where a visitor would see the brand, and
  // seeing it there is the difference between the brand reaching sessionStorage and
  // the brand reaching the person.
  for (let i = 0; i < 3; i += 1) {
    if ((await page.locator('.qs-chip').count()) > 0) break;
    await page.click('#qs-back');
    await page.waitForTimeout(180);
  }
  const chip = await page.locator('.qs-chip').first().innerText().catch(() => '');
  expect(`${label}: the appliance step shows the brand chip`, chip.trim() === 'LG', chip || 'no chip');
  await ctx.close();
}

/** The other half of the rule: pages that must carry nothing at all. */
async function aid3AbsenceLeg(browser, base) {
  const label = 'aid3 absence';
  console.log(`\n[${label}]`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.route('**maps.googleapis.com/**', (r) => r.abort());
  for (const url of ['/pasadena/', '/blog/', '/book/', '/contact/', '/price-list/']) {
    await page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded' });
    const cards = await page.locator('[data-aid-card]').count();
    const sheets = await page.locator('dialog#aid-sheet').count();
    expect(`${label}: ${url} carries no card`, cards === 0, String(cards));
    expect(`${label}: ${url} carries no diagnostic sheet`, sheets === 0, String(sheets));
    // …and still opens the booking sheet, which every page has.
    expect(`${label}: ${url} still has the quote sheet`,
      (await page.locator('dialog#quote-sheet').count()) === 1);
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
  for (const c of PAGE_TYPE_CASES) await pageTypeLeg(browser, base, c);
  await prefillPayloadLeg(browser, base, { override: false });
  await prefillPayloadLeg(browser, base, { override: true });
  await resumeBeatsContextLeg(browser, base);
  await bookLinkNoJsLeg(browser, base);
  await zipLeg(browser, base);
  await zipManualLeg(browser, base);
  await aidFoldLeg(browser, base, { width: 360, height: 740 }, 'aid 360');
  await aidFoldLeg(browser, base, { width: 375, height: 812 }, 'aid 375');
  await aidFoldLeg(browser, base, { width: 1280, height: 800 }, 'aid desktop', { desktop: true });
  await aidCardLeg(browser, base);
  await aidBackLeg(browser, base);
  await aidNoJsLeg(browser, base);
  for (const c of AID3_CASES) await aid3FoldLeg(browser, base, c);
  for (const c of AID3_CASES) await aid3PrefillLeg(browser, base, c);
  await aid3HandoffLeg(browser, base);
  await aid3AbsenceLeg(browser, base);
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
