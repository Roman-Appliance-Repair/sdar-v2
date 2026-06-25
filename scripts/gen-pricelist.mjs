// scripts/gen-pricelist.mjs
// /price-list/* hero pool — full-bleed 21:9. Theme: "transparent pricing / honest quote":
// a technician in a dark navy uniform holds a tablet/clipboard beside an INTACT CLOSED
// appliance and calmly reviews the estimate with a relaxed, satisfied customer. The
// tablet/documents are held naturally and NOT close-up — NO readable text/numbers anywhere.
// 7-image rotation pool: res-1..4 (residential), com-1..2 (commercial), index (generic).
// Output: public/images/price-list/_pool/{variant}/{hero,hero-960,hero-640}.{webp,jpg}
// Usage: node scripts/gen-pricelist.mjs <variant ...>   (or 'all')
// Gemini 21:9 -> sharp 1920x840/960x420/640x280, webp+jpg, EXIF stripped, brighten+gamma.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'pricelist-photos');
fs.mkdirSync(TMP, { recursive: true });
const OUTROOT = path.resolve('public/images/price-list/_pool');

const NOTEXT = `CRITICAL: the entire image is completely free of any READABLE writing — the tablet/clipboard is held at a natural angle and is NOT shown close-up; its screen/paper shows no legible text or numbers. No appliance has a logo, brand name, model number or control-panel lettering; uniforms are plain and unmarked; no signage, stickers, labels or watermarks anywhere. Every person has a natural, anatomically correct, undistorted face and hands with the right number of fingers.`;

const FRAME = `COMPOSITION (important): the technician (a white Caucasian man in a plain dark navy uniform) and the satisfied customer stand TOGETHER IN THE CENTER of the frame, both fully visible in an open clear spot, calmly looking at a tablet the technician holds — a relaxed, trustworthy "here is your fair price" moment. The closed appliance sits to the LEFT, toward the left edge, partly behind them. The RIGHT third of the frame is calm, clean and empty — plain wall or open kitchen, NO people and no important detail there (room for a card). Keep BOTH people centred and well clear of the left and right edges, never cropped, never hidden behind anything. NO van, NO hand truck, NO dolly.`;

const SCENE = {
  'res-1': 'Inside a tidy modern home kitchen, a technician in a plain dark navy uniform holds a tablet beside an intact, fully closed stainless refrigerator (doors shut), reviewing the estimate with a relaxed, satisfied homeowner.',
  'res-2': 'Inside a clean home laundry area, a technician in a plain dark navy uniform holds a clipboard beside an intact, fully closed front-load washer and dryer (doors shut), going over the quote with a satisfied homeowner.',
  'res-3': 'Inside a tasteful home kitchen, a technician in a plain dark navy uniform holds a tablet beside an intact, fully closed stainless range / wall oven (door shut), explaining the price calmly to a happy homeowner.',
  'res-4': 'Inside a bright home kitchen, a technician in a plain dark navy uniform holds a tablet beside an intact, fully closed built-in dishwasher (door shut and flush), discussing the estimate with a relaxed homeowner.',
  'com-1': 'Inside a clean professional commercial restaurant kitchen, a technician in a plain dark navy uniform holds a tablet beside an intact, fully closed stainless commercial reach-in refrigerator, reviewing the quote with a satisfied restaurant owner or manager.',
  'com-2': 'Inside a clean professional commercial kitchen, a technician in a plain dark navy uniform holds a clipboard beside an intact, fully closed stainless commercial range / fryer, going over pricing with a business owner.',
  index: 'Inside a clean kitchen, a technician in a plain dark navy uniform and cap holds a tablet beside an intact, fully closed stainless appliance, calmly reviewing the estimate with a relaxed, satisfied customer.',
};

const STYLE = (v) => `Ultra-wide 21:9 cinematic photograph, photorealistic documentary style, natural realistic light, NOT AI-glossy, no HDR sheen. ${SCENE[v]} ${FRAME} ${NOTEXT} 2K.`;

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(v) {
  if (!SCENE[v]) { console.error(`✗ unknown variant: ${v}`); return false; }
  const out = path.join(TMP, `${v}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(v) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${v} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * attempt;
      console.error(`  ${v} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${v} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${v} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${v} bad PNG, retry`); await sleep(2000); continue; }
    console.log(`✓ gen ${v} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`); return true;
  }
  console.error(`✗ ${v} FAILED`); return false;
}

async function convertOne(v) {
  const src = path.join(TMP, `${v}.png`);
  if (!isValidPng(src)) return false;
  const dir = path.join(OUTROOT, v);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, w, h] of SIZES) {
    const base = () => sharp(src).resize(w, h, { fit: 'cover', position: 'center' }).modulate({ brightness: 1.06 }).gamma(1.05);
    await base().webp({ quality: 80, effort: 6 }).toFile(path.join(dir, `${name}.webp`));
    await base().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
  }
  return true;
}

let targets = process.argv.slice(2);
if (!targets.length || targets[0] === 'all') targets = Object.keys(SCENE);
for (const v of targets) if (!SCENE[v]) { console.error(`unknown variant: ${v}`); process.exit(1); }

console.log(`Targets: ${targets.join(', ')}`);
const done = [], failed = [];
for (const v of targets) {
  const ok = await genOne(v);
  if (ok && await convertOne(v)) done.push(v); else failed.push(v);
  await sleep(1000);
}
console.log(`\n=== done ${done.length}, failed ${failed.length} ===`);
if (failed.length) { console.error('FAILED: ' + failed.join(', ')); process.exit(1); }
