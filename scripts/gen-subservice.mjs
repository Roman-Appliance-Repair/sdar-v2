// scripts/gen-subservice.mjs
// Sub-service (failure-mode) hero photos: /services/{service}/{problem}/.
// Concept: the problem is FIXED — appliance INTACT, closed and working (no panels off,
// no exposed parts). A technician stands beside it with a HAPPY homeowner thanking him
// (handshake or genuine smile/thumbs-up). Tool bag on the floor. Neutral upscale/mid-range
// interior (sub-services have no city -> no tier). No van, no dolly, no disassembly.
// Output mirrors the URL under the services section so ServiceHero(section=services,
// slug="{service}/{problem}") picks it up:
//   public/images/services/{service}/{problem}/{hero,hero-960,hero-640}.{webp,jpg}
// Usage: node scripts/gen-subservice.mjs <service/problem | --all>
// Gemini 21:9 -> sharp 1920x840/960x420/640x280, webp+jpg, EXIF stripped, brighten+gamma.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'subservice');
fs.mkdirSync(TMP, { recursive: true });
const SVCDIR = path.resolve('public/images/services');
const SRC = 'src/pages/services';

// parent service dir -> [room, intact appliance]
const APPLIANCE = {
  'cooktop-repair': ['kitchen', 'a built-in cooktop set into the countertop, intact and clean'],
  'dishwasher-repair': ['kitchen', 'a built-in dishwasher installed under the counter, door fully shut and flush'],
  'dryer-repair': ['laundry room', 'a front-load clothes dryer, door shut'],
  'dryer-vent-repair': ['laundry room', 'a front-load clothes dryer with its vent neatly connected behind it, door shut'],
  'garbage-disposal-repair': ['kitchen', 'a clean kitchen sink with tidy cabinetry below'],
  'microwave-repair': ['kitchen', 'an over-the-range microwave mounted above the range, door shut'],
  'oven-repair': ['kitchen', 'a built-in wall oven, door shut'],
  'range-hood-repair': ['kitchen', 'a stainless range hood mounted above the cooktop'],
  'refrigerator-repair': ['kitchen', 'a refrigerator, doors closed'],
  'trash-compactor-repair': ['kitchen', 'a tidy run of intact lower kitchen cabinets and drawer fronts, every door and drawer fully shut and flush, nothing open, nothing pulled out, no gaps'],
  'wall-oven-repair': ['kitchen', 'a built-in wall oven, door shut'],
  'washer-repair': ['laundry room', 'a front-load washing machine, door shut'],
  'wine-cooler-repair': ['kitchen', 'a built-in wine cooler with its glass door closed, bottles inside'],
};

function gesture(i) {
  return (i % 2 === 0)
    ? 'sharing a warm friendly handshake'
    : 'the homeowner smiling broadly and giving a relieved thumbs-up while thanking the technician';
}

const STYLE = (service, i) => {
  const [room, appliance] = APPLIANCE[service];
  return `Ultra-wide 21:9 cinematic interior photograph, photorealistic documentary style, natural realistic daytime light from a window, NOT AI-glossy, no HDR sheen. Inside a tasteful upscale-to-mid-range residential ${room}. The repair is finished and successful: ${appliance}, fully assembled and working normally — NO panels removed, NO open access covers, NO exposed wiring, NO visible internal parts. A friendly appliance repair technician in a plain dark navy work polo and cap stands beside the appliance with a happy satisfied homeowner; they are ${gesture(i)}, a warm positive "it works again" moment. A closed tool bag with a few hand tools rests on the floor nearby. Both people have natural, anatomically correct, undistorted faces and hands with the right number of fingers; relaxed natural expressions. The RIGHT two-thirds holds the two people and the appliance in crisp focus; the LEFT third is calmer and more open (room interior / soft window light) so a dark text panel can be laid over it. EXACTLY two people and no one else. NO van, NO hand truck, NO dolly. No text, no signs, no logos, no brand badges, no readable labels, no watermarks. 2K.`;
};

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(service, problem, i) {
  const out = path.join(TMP, `${service}__${problem}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(service, i) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${service}/${problem} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * attempt;
      console.error(`  ${service}/${problem} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${service}/${problem} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${service}/${problem} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${service}/${problem} bad PNG, retry`); await sleep(2000); continue; }
    console.log(`✓ gen ${service}/${problem} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`); return true;
  }
  console.error(`✗ ${service}/${problem} FAILED`); return false;
}

async function convertOne(service, problem) {
  const src = path.join(TMP, `${service}__${problem}.png`);
  if (!isValidPng(src)) return false;
  const dir = path.join(SVCDIR, service, problem);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, w, h] of SIZES) {
    const base = () => sharp(src).resize(w, h, { fit: 'cover', position: 'center' }).modulate({ brightness: 1.06 }).gamma(1.05);
    await base().webp({ quality: 80, effort: 6 }).toFile(path.join(dir, `${name}.webp`));
    await base().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
  }
  return true;
}

function allSubservices() {
  const out = [];
  for (const svc of fs.readdirSync(SRC)) {
    const d = path.join(SRC, svc);
    if (!fs.statSync(d).isDirectory()) continue;
    if (!APPLIANCE[svc]) continue;
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith('.astro')) continue;
      out.push([svc, f.replace(/\.astro$/, '')]);
    }
  }
  return out;
}

const args = process.argv.slice(2);
let targets;
if (args[0] === '--all') targets = allSubservices();
else if (args.length && args.every((a) => a.includes('/'))) {
  targets = args.map((a) => { const [s, p] = a.split('/'); if (!APPLIANCE[s]) { console.error(`unknown service: ${s}`); process.exit(1); } return [s, p]; });
}
else { console.error('usage: node scripts/gen-subservice.mjs <service/problem ...> | --all'); process.exit(1); }

console.log(`Targets: ${targets.length}`);
const done = [], failed = [];
for (let i = 0; i < targets.length; i++) {
  const [s, p] = targets[i];
  const ok = await genOne(s, p, i);
  if (ok && await convertOne(s, p)) done.push(`${s}/${p}`); else failed.push(`${s}/${p}`);
  await sleep(1000);
}
console.log(`\n=== done ${done.length}, failed ${failed.length} ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
