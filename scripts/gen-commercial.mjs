// scripts/gen-commercial.mjs
// Commercial failure-mode / subcategory hero photos for /commercial/* pages.
// Concept: COMMERCIAL setting (professional stainless restaurant kitchen). A technician
// in a dark uniform stands beside INTACT, CLOSED commercial equipment holding a test
// tool (digital multimeter / probe). NO disassembly, NO panels off, NO exposed parts.
// Optionally one kitchen-staff member in the background — NEVER a homeowner/customer.
// Equipment matches the page (fryer -> commercial deep fryer, refrigeration -> reach-in /
// walk-in, ice -> ice machine, etc.). No van, no text, no logos, no readable labels.
// Output mirrors the URL under /commercial/ so the page's full-bleed hero picks it up:
//   public/images/commercial/{path}/{hero,hero-960,hero-640}.{webp,jpg}
// Usage: node scripts/gen-commercial.mjs <path ...>      e.g. refrigeration/not-cooling
// Gemini 21:9 -> sharp 1920x840/960x420/640x280, webp+jpg, EXIF stripped, brighten+gamma.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'commercial-photos');
fs.mkdirSync(TMP, { recursive: true });
const OUTROOT = path.resolve('public/images/commercial');

// first path segment -> intact, closed commercial equipment description
const EQUIP = {
  'fryer-repair': 'a free-standing stainless-steel commercial deep fryer with fry baskets resting in the closed oil vats, fully assembled',
  'kettle-repair': 'a large stainless-steel steam-jacketed tilting kettle, lid down and intact',
  'refrigeration': 'a tall stainless-steel commercial reach-in refrigerator, solid doors fully shut and flush',
  'steamer-repair': 'a stainless-steel commercial convection steamer, doors shut and intact',
  'ice-machines': 'a stainless-steel modular commercial ice machine head on a storage bin, front panel closed',
  'dishwasher-repair': 'a stainless-steel commercial conveyor dishwasher, hood down and side doors closed',
  'food-processor-repair': 'a stainless-steel commercial food processor on a prep counter, bowl and lid seated and closed',
  'holding-cabinet-repair': 'a stainless-steel commercial heated holding cabinet on casters, solid door fully shut',
  'mixer-repair': 'a floor-standing commercial planetary mixer with the bowl raised and seated, intact and assembled',
  'slicer-repair': 'a stainless-steel commercial gravity-feed meat slicer on a prep counter, fully assembled with the guard in place',
  'washer-repair': 'a stainless-steel on-premise commercial laundry washer-extractor, loading door shut',
};

const PEOPLE = (i) => (i % 2 === 0)
  ? 'A single appliance repair technician in a plain dark navy work uniform and cap stands beside the equipment, calmly holding a digital multimeter with both hands as if confirming a reading, relaxed and satisfied. EXACTLY one person.'
  : 'An appliance repair technician in a plain dark navy work uniform and cap stands beside the equipment holding a digital test probe, with one kitchen-staff member in a chef coat standing nearby looking satisfied. EXACTLY two people, both clearly staff (NOT a homeowner or residential customer).';

const STYLE = (seg, i) => {
  const equip = EQUIP[seg];
  return `Ultra-wide 21:9 cinematic photograph, photorealistic documentary style, natural realistic light, NOT AI-glossy, no HDR sheen. Inside a clean professional commercial restaurant kitchen with stainless-steel surfaces and tiled walls. The repair is finished and successful: ${equip}, working normally — NO panels removed, NO open access covers, NO exposed wiring, NO visible internal parts. ${PEOPLE(i)} Every person has a natural, anatomically correct, undistorted face and hands with the right number of fingers; relaxed natural expressions. The RIGHT two-thirds holds the equipment and any people in crisp focus; the LEFT third is calmer and more open (clean stainless wall / soft kitchen light) so a dark text panel can be laid over it. NO van, NO hand truck, NO dolly. CRITICAL: the entire image is completely free of any writing — the appliance and every surface are BLANK and unbranded, with NO manufacturer nameplate, NO logo, NO brand name, NO model number, NO control-panel lettering, NO stickers, NO engraved or printed characters anywhere. Absolutely no letters, words, numbers, symbols, signage, labels or watermarks in the whole picture. 2K.`;
};

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(rel, i) {
  const seg = rel.split('/')[0];
  if (!EQUIP[seg]) { console.error(`✗ ${rel}: unknown category "${seg}"`); return false; }
  const out = path.join(TMP, rel.replace(/\//g, '__') + '.png');
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(seg, i) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${rel} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * attempt;
      console.error(`  ${rel} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${rel} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${rel} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${rel} bad PNG, retry`); await sleep(2000); continue; }
    console.log(`✓ gen ${rel} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`); return true;
  }
  console.error(`✗ ${rel} FAILED`); return false;
}

async function convertOne(rel) {
  const src = path.join(TMP, rel.replace(/\//g, '__') + '.png');
  if (!isValidPng(src)) return false;
  const dir = path.join(OUTROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, w, h] of SIZES) {
    const base = () => sharp(src).resize(w, h, { fit: 'cover', position: 'center' }).modulate({ brightness: 1.06 }).gamma(1.05);
    await base().webp({ quality: 80, effort: 6 }).toFile(path.join(dir, `${name}.webp`));
    await base().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
  }
  return true;
}

const targets = process.argv.slice(2);
if (!targets.length || !targets.every((t) => t.includes('/'))) {
  console.error('usage: node scripts/gen-commercial.mjs <category/page ...>  e.g. refrigeration/not-cooling');
  process.exit(1);
}

console.log(`Targets: ${targets.length}`);
const done = [], failed = [];
for (let i = 0; i < targets.length; i++) {
  const rel = targets[i];
  const ok = await genOne(rel, i);
  if (ok && await convertOne(rel)) done.push(rel); else failed.push(rel);
  await sleep(1000);
}
console.log(`\n=== done ${done.length}, failed ${failed.length} ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
