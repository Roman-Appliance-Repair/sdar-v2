// scripts/gen-business.mjs
// /for-business/* hero photos — full-bleed 21:9. B2B context: a technician in a dark
// navy uniform in a COMMERCIAL / multi-unit setting, INTACT CLOSED equipment (no panels
// off, no exposed parts), optionally one staff member (chef/manager/employee, NEVER a
// residential homeowner-customer). Left third calmer for a dark text panel. The ONLY text
// rule: NO text/logos/labels/watermarks anywhere; uniforms plain and unmarked.
// Output: public/images/for-business/{slug}/{hero,hero-960,hero-640}.{webp,jpg}
// Usage: node scripts/gen-business.mjs <slug ...>   (slugs below, or 'all')
// Gemini 21:9 -> sharp 1920x840/960x420/640x280, webp+jpg, EXIF stripped, brighten+gamma.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'business-photos');
fs.mkdirSync(TMP, { recursive: true });
const OUTROOT = path.resolve('public/images/for-business');

const NOTEXT = `CRITICAL: the entire image is completely free of any writing — every surface, appliance, wall and garment is BLANK and unbranded, with NO logo, NO brand name, NO model number, NO control-panel lettering, NO stickers, NO signage, NO printed or engraved characters, NO watermarks anywhere. The work uniforms are plain and unmarked (no patches, no name tags). Every person has a natural, anatomically correct, undistorted face and hands with the right number of fingers.`;

const FRAME = `The RIGHT two-thirds holds the technician and the equipment in crisp focus; the LEFT third is calmer and more open (clean wall / soft light) so a dark text panel can be laid over it. NO van, NO hand truck, NO dolly.`;

const SCENE = {
  restaurants: 'Inside a clean professional commercial restaurant kitchen, stainless-steel surfaces and tiled walls. A technician in a plain dark navy work uniform and cap calmly holds a digital multimeter beside an intact, fully closed stainless commercial cooking range / reach-in, optionally one chef in whites nearby. Everything assembled and working — NO panels removed.',
  'bars-nightclubs': 'Behind the bar of a stylish upscale cocktail bar / lounge, warm moody ambient lighting, polished counter and back-bar shelving. A technician in a plain dark navy work uniform holds a digital multimeter beside an intact, fully closed stainless back-bar bottle cooler / undercounter ice machine. Premium nightlife atmosphere, everything closed and tidy.',
  hotels: 'Inside a clean commercial hotel laundry / back-of-house room, a neat row of large stainless front-load commercial washers and dryers, all doors shut. A technician in a plain dark navy work uniform holds a digital multimeter beside the closed machines, optionally one hotel staff member in uniform nearby. Discreet, professional, well-lit.',
  'property-management': 'Inside a tidy shared laundry room of a multi-unit residential building, a row of stacked card-operated front-load washers and dryers, all doors shut and intact. A technician in a plain dark navy work uniform holds a digital multimeter, optionally a building manager holding a tablet nearby. Clean, organized, professional.',
  'airbnb-short-term-rentals': 'Inside a tidy, tastefully furnished short-term-rental apartment kitchen (styled like an Airbnb listing), clean staging. A technician in a plain dark navy work uniform holds a digital multimeter beside an intact, fully closed stainless refrigerator, doors shut. Bright, welcoming, move-in-ready feel.',
  'retail-grocery': 'Inside a grocery / retail store aisle, a run of glass-door refrigerated display cases and reach-in beverage coolers, all doors shut and stocked. A technician in a plain dark navy work uniform holds a digital multimeter beside the closed refrigerated cases. Clean bright retail environment.',
  index: 'In a professional commercial setting (a clean stainless commercial kitchen / back-of-house), a confident technician in a plain dark navy work uniform and cap holds a digital multimeter beside intact, fully closed stainless commercial equipment. Capable, trustworthy, business-grade service.',
};

const STYLE = (slug) => `Ultra-wide 21:9 cinematic photograph, photorealistic documentary style, natural realistic light, NOT AI-glossy, no HDR sheen. ${SCENE[slug]} ${FRAME} ${NOTEXT} 2K.`;

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(slug) {
  if (!SCENE[slug]) { console.error(`✗ unknown slug: ${slug}`); return false; }
  const out = path.join(TMP, `${slug}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(slug) }] }],
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
  const dir = path.join(OUTROOT, slug);
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
for (const s of targets) if (!SCENE[s]) { console.error(`unknown slug: ${s}`); process.exit(1); }

console.log(`Targets: ${targets.join(', ')}`);
const done = [], failed = [];
for (const slug of targets) {
  const ok = await genOne(slug);
  if (ok && await convertOne(slug)) done.push(slug); else failed.push(slug);
  await sleep(1000);
}
console.log(`\n=== done ${done.length}, failed ${failed.length} ===`);
if (failed.length) { console.error('FAILED: ' + failed.join(', ')); process.exit(1); }
