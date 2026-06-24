// scripts/gen-combo-photos.mjs
// City×service combo heroes (TEST BATCH of 4) — city-specific residential street with a
// technician + plain white van, service appliance present but the STREET/CITY is the
// focus. Generates 21:9 via Gemini, then sharp -> the 6-file responsive set per combo:
//   public/images/city-service/{city}/{service}/{hero,hero-960,hero-640}.{webp,jpg}
// Sizes 1920x840 / 960x420 / 640x280 (cover, centered). Gentle brighten + gamma.
// sharp drops EXIF/ICC by default (no withMetadata) — anti-detection clean.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'combo-photos');
fs.mkdirSync(TMP, { recursive: true });
const DST = path.resolve('public/images/city-service');

const STYLE = (scene) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic daytime lighting, NOT AI-glossy, no HDR sheen. ${scene} A single appliance repair technician in a plain dark navy work polo and cap works by a plain white work van — the van is completely plain with NO text, NO logo, NO badge, NO writing anywhere on it. An open tool bag with a few hand tools rests on the ground nearby. The RIGHT two-thirds holds the technician, van and street in crisp focus; the LEFT third is calmer and more open (sky / leafy distance) so a dark text panel can be laid over it. Bright clear Southern California daylight. NO other people anywhere, NO other cars in the frame. No text, no signs, no logos, no readable labels, no watermarks. 2K.`;

// [city, service, scene]
const ITEMS = [
  ['santa-monica', 'refrigerator-repair', `A leafy residential street in Santa Monica, California north of Montana Avenue: craftsman and Spanish-revival bungalows behind low hedges and tall palm trees in soft coastal light. The technician is easing a stainless refrigerator on a hand truck near the open back of the van.`],
  ['beverly-hills', 'oven-repair', `A wide palm-lined residential street in Beverly Hills, California: Spanish-revival and Mediterranean estates behind manicured hedges and emerald lawns in bright affluent daylight. The technician carries a stainless wall-oven service part toward the open van.`],
  ['pasadena', 'washer-repair', `A historic residential street in Pasadena, California: Craftsman bungalows with deep eaves and wide porches under mature oak trees, the San Gabriel Mountains rising hazy in the distance. The technician stands at the open van with a white washing machine on a hand truck.`],
  ['irvine', 'dishwasher-repair', `A clean master-planned residential street in Irvine, California: modern Mediterranean stucco tract homes with red clay-tile roofs and manicured landscaping under a bright clear sky. The technician carries a stainless dishwasher by the open side door of the van.`],
];

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(city, service, scene) {
  const out = path.join(TMP, `${city}__${service}.png`);
  if (isValidPng(out)) { console.log(`• ${city}/${service} cached`); return true; }
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(scene) }] }],
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
  const kb = (fs.statSync(path.join(dir, 'hero.webp')).size / 1024).toFixed(0);
  console.log(`  ↳ wrote ${city}/${service} (hero.webp ${kb} KB)`);
  return true;
}

const failed = [];
for (const [city, service, scene] of ITEMS) {
  const g = await genOne(city, service, scene);
  if (g) await convertOne(city, service); else failed.push(`${city}/${service}`);
  await sleep(1200);
}
console.log(`\n=== COMBO PHOTOS: ${ITEMS.length - failed.length}/${ITEMS.length} done ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
