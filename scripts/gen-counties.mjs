// scripts/gen-counties.mjs
// County hub heroes — 5 region establishing landscapes (no people, no foreground cars,
// no text/logos), full-bleed for the county hero with a dark text panel on the LEFT.
// Generates 21:9 via Gemini, then sharp -> the 6-file responsive set per county slug:
//   public/images/counties/{slug}/{hero,hero-960,hero-640}.{webp,jpg}
// Sizes 1920x840 / 960x420 / 640x280 (cover, centered). Gentle brighten + gamma.
// sharp drops EXIF/ICC by default (no withMetadata) — anti-detection clean.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'counties');
fs.mkdirSync(TMP, { recursive: true });
const DST = path.resolve('public/images/counties');

const STYLE = (scene) => `Ultra-wide 21:9 cinematic establishing landscape photograph, photorealistic documentary style, natural realistic daytime lighting, NOT AI-glossy, no HDR sheen. ${scene} The RIGHT two-thirds carries the main scene in crisp focus; the LEFT third is calmer and more open (sky or hazy distance) so a dark text panel can be laid over it. Bright clear Southern California daylight, believable lived-in residential region. NO people anywhere. NO cars in the foreground. No text, no signs, no logos, no readable labels, no watermarks. 2K.`;

const ITEMS = [
  ['los-angeles-county', `A sweeping high vantage view across Los Angeles County residential hills: palm-lined streets winding among Spanish-revival and mid-century homes on green hillsides, the San Gabriel Mountains rising in the hazy blue distance.`],
  ['orange-county', `A sweeping view across an Orange County master-planned suburb: neat rows of red clay-tile-roof stucco homes with manicured lawns and palm trees, gentle coastal hills in the distance.`],
  ['riverside-county', `A sweeping view across a Riverside County inland valley: newer stucco tract homes spread across a wide sunny valley floor, dry chaparral foothills and rugged mountains rising behind under a vast clear sky.`],
  ['san-bernardino-county', `A sweeping view across a San Bernardino County foothill suburb: stucco homes along curving streets at the base of tall mountains, the snow-dusted San Bernardino Mountains rising sharply behind.`],
  ['ventura-county', `A sweeping view across a Ventura County coastal-agricultural landscape: rolling green hills with citrus and avocado groves, scattered ranch-style homes, and a glimpse of the blue Pacific Ocean beyond the coastal plain.`],
];

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(slug, scene) {
  const out = path.join(TMP, `${slug}.png`);
  if (isValidPng(out)) { console.log(`• ${slug} cached`); return true; }
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(scene) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${slug} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * attempt;
      console.error(`  ${slug} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${slug} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${slug} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${slug} bad PNG, retry`); await sleep(2000); continue; }
    console.log(`✓ gen ${slug} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`); return true;
  }
  console.error(`✗ ${slug} FAILED`); return false;
}

async function convertOne(slug) {
  const src = path.join(TMP, `${slug}.png`);
  if (!isValidPng(src)) return false;
  const dir = path.join(DST, slug);
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, w, h] of SIZES) {
    const base = () => sharp(src).resize(w, h, { fit: 'cover', position: 'center' }).modulate({ brightness: 1.06 }).gamma(1.05);
    await base().webp({ quality: 80, effort: 6 }).toFile(path.join(dir, `${name}.webp`));
    await base().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
  }
  const kb = (fs.statSync(path.join(dir, 'hero.webp')).size / 1024).toFixed(0);
  console.log(`  ↳ wrote ${slug} (hero.webp ${kb} KB)`);
  return true;
}

const failed = [];
for (const [slug, scene] of ITEMS) {
  const g = await genOne(slug, scene);
  if (g) await convertOne(slug); else failed.push(slug);
  await sleep(1200);
}
console.log(`\n=== COUNTIES: ${ITEMS.length - failed.length}/${ITEMS.length} done ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
