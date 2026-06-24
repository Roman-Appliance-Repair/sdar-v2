// scripts/gen-combo-repair.mjs
// NEW combo-photo concept: ON-SITE in-home REPAIR (not delivery). A technician working
// ON the service appliance inside the home — multimeter/screwdriver in hand, unit opened
// mid-repair. NO van, NO hand truck, NO unloading. Interior subtly hints the city's tier.
// Same output format/paths so the page template needs no change (only image files change):
//   public/images/city-service/{city}/{service}/{hero,hero-960,hero-640}.{webp,jpg}
//
// Usage:
//   node scripts/gen-combo-repair.mjs city/service      # single (test) — overwrites it
//   node scripts/gen-combo-repair.mjs --all             # regenerate ALL real combos
// Gemini 21:9 -> sharp 1920x840/960x420/640x280, webp+jpg, EXIF/ICC stripped, brighten+gamma.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CITY_DESCRIPTORS } from '../src/data/city-service-content.ts';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'combo-repair');
fs.mkdirSync(TMP, { recursive: true });
const DST = path.resolve('public/images/city-service');

// service -> { room, appliance (intact / closed / installed) }
const SERVICE = {
  'cooktop-repair': ['kitchen', 'a built-in cooktop set into the countertop'],
  'dishwasher-repair': ['kitchen', 'a built-in dishwasher installed under the counter, its door fully shut and flush with the cabinet fronts so you cannot see inside'],
  'dryer-repair': ['laundry room', 'a front-load clothes dryer, door closed'],
  'freezer-repair': ['kitchen', 'an upright freezer, door closed'],
  'garbage-disposal-repair': ['kitchen', 'a kitchen sink with cabinetry below housing the garbage disposal'],
  'ice-maker-repair': ['kitchen', 'a refrigerator with a built-in ice maker, doors closed'],
  'microwave-repair': ['kitchen', 'an over-the-range microwave mounted above the range, door closed'],
  'oven-repair': ['kitchen', 'a built-in wall oven, door closed'],
  'range-hood-repair': ['kitchen', 'a range hood mounted above the cooktop'],
  'range-repair': ['kitchen', 'a freestanding range with the oven door closed'],
  'refrigerator-repair': ['kitchen', 'a refrigerator, doors closed'],
  'stove-repair': ['kitchen', 'a freestanding stove with the oven door closed'],
  'wall-oven-repair': ['kitchen', 'a built-in wall oven, door closed'],
  'washer-repair': ['laundry room', 'a front-load washing machine, door closed'],
  'wine-cooler-repair': ['kitchen', 'a built-in wine cooler with its glass door closed, bottles inside'],
};

function tierHint(citySlug) {
  const t = CITY_DESCRIPTORS[citySlug]?.tier || '';
  if (t === 'ULTRA-PREMIUM') return 'a luxurious high-end';
  if (t === 'PREMIUM' || t === 'PREMIUM-OC') return 'an upscale';
  if (t.startsWith('INLAND')) return 'a clean suburban';
  return 'a comfortable mid-range'; // GENERAL / MID-TIER-*
}

const STYLE = (citySlug, service) => {
  const [room, appliance] = SERVICE[service];
  const tier = tierHint(citySlug);
  return `Ultra-wide 21:9 cinematic interior photograph, photorealistic documentary style, natural realistic daytime light coming from a window, NOT AI-glossy, no HDR sheen. The scene is inside ${tier} residential ${room}. A single appliance repair technician in a plain dark navy work polo and cap stands or crouches NEXT TO ${appliance}, holding a digital multimeter and a screwdriver, about to diagnose it during an on-site service visit; he may be reaching into his tool bag for a tester. A small open tool bag with a few hand tools sits on the floor beside him. IMPORTANT: the appliance is COMPLETELY INTACT AND CLOSED — every door, lid, drawer and access cover is FULLY SHUT and flush, the inside of the appliance is NOT visible at all (no open door, no visible racks/shelves/drum interior), and NOTHING is opened, pulled out, removed or taken apart; NO panels off, NO exposed wiring, NO internal parts visible — it simply looks like a normal undamaged installed appliance. The RIGHT two-thirds holds the technician and the appliance in crisp focus; the LEFT third is calmer and more open (room interior / soft window light) so a dark text panel can be laid over it. This is an on-site in-home service visit: NO van, NO hand truck, NO dolly, nothing being carried or wheeled. NO other people anywhere. No text, no signs, no logos, no brand badges, no readable labels, no watermarks. 2K.`;
};

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(city, service) {
  const out = path.join(TMP, `${city}__${service}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(city, service) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${city}/${service} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * attempt;
      console.error(`  ${city}/${service} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${city}/${service} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${city}/${service} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${city}/${service} bad PNG, retry`); await sleep(2000); continue; }
    console.log(`✓ gen ${city}/${service} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`); return true;
  }
  console.error(`✗ ${city}/${service} FAILED`); return false;
}

async function convertOne(city, service) {
  const src = path.join(TMP, `${city}__${service}.png`);
  if (!isValidPng(src)) return false;
  const dir = path.join(DST, city, service);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, w, h] of SIZES) {
    const base = () => sharp(src).resize(w, h, { fit: 'cover', position: 'center' }).modulate({ brightness: 1.06 }).gamma(1.05);
    await base().webp({ quality: 80, effort: 6 }).toFile(path.join(dir, `${name}.webp`));
    await base().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
  }
  return true;
}

function allRealCombos() {
  const citiesSrc = fs.readFileSync('src/data/cities.ts', 'utf8');
  const citySet = new Set([...citiesSrc.matchAll(/slug:\s*'([a-z0-9-]+)'/g)].map((m) => m[1]));
  const out = [];
  for (const city of fs.readdirSync('dist')) {
    if (!citySet.has(city)) continue;
    const cdir = path.join('dist', city);
    if (!fs.statSync(cdir).isDirectory()) continue;
    for (const service of fs.readdirSync(cdir)) {
      const f = path.join(cdir, service, 'index.html');
      if (!fs.existsSync(f)) continue;
      const h = fs.readFileSync(f, 'utf8');
      if (/http-equiv=["']refresh["']/i.test(h) && h.length < 2000) continue;
      if (!SERVICE[service]) continue; // only known services
      out.push([city, service]);
    }
  }
  return out;
}

const arg = process.argv[2];
let targets;
if (arg === '--all') {
  targets = allRealCombos();
} else if (arg === '--cities') {
  const set = new Set((process.argv[3] || '').split(',').filter(Boolean));
  targets = allRealCombos().filter(([c]) => set.has(c));
} else if (arg && arg.includes('/')) {
  const [c, s] = arg.split('/');
  if (!SERVICE[s]) { console.error(`unknown service: ${s}`); process.exit(1); }
  targets = [[c, s]];
} else { console.error('usage: node scripts/gen-combo-repair.mjs <city/service | --all | --cities a,b,c>'); process.exit(1); }

console.log(`Targets: ${targets.length}`);
const done = [], failed = [];
for (const [city, service] of targets) {
  const ok = await genOne(city, service);
  if (ok && await convertOne(city, service)) done.push(`${city}/${service}`);
  else failed.push(`${city}/${service}`);
  await sleep(1000);
}
console.log(`\n=== done ${done.length}, failed ${failed.length} ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
