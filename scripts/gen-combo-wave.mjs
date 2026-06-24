// scripts/gen-combo-wave.mjs
// City×service combo heroes, rolled out by WAVE (whole cities at a time). Reusable:
//   - add the city's researched street scene to CITY_SCENES
//   - list the wave's cities in WAVE_CITIES
//   - run: node scripts/gen-combo-wave.mjs
// Idempotent: skips combos that already have a photo and combos with no built page
// (dist/{city}/{service}/index.html), so non-hub cities (5 services) don't get orphans.
// Gemini 21:9 -> sharp 1920x840 / 960x420 / 640x280, webp+jpg, EXIF/ICC stripped, gentle
// brighten+gamma. Output: public/images/city-service/{city}/{service}/...

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'combo-wave');
fs.mkdirSync(TMP, { recursive: true });
const DST = path.resolve('public/images/city-service');

// ── This wave ──────────────────────────────────────────────────────────────
const WAVE_CITIES = ['rancho-cucamonga', 'santa-monica'];

// ── Researched street scenes per city (from CITY_DESCRIPTORS.homeStock + local knowledge)
const CITY_SCENES = {
  'anaheim': `An established residential street in Anaheim, Orange County, California: single-story 1950s-1960s ranch and mid-century tract homes with low-pitched roofs and attached carports, a few 1920s Spanish bungalows, mature shade trees and palms on flat sunny Orange County terrain.`,
  'beverly-hills': `A wide palm-lined residential street in Beverly Hills, California: Spanish-revival and Mediterranean estates behind manicured hedges and emerald lawns in bright affluent daylight.`,
  'burbank': `A quiet flat residential street in the Magnolia Park area of Burbank, California (San Fernando Valley): tidy 1920s-1940s craftsman and Spanish-revival bungalows with small front porches, rose bushes and trim lawns, mature street trees in warm valley daylight.`,
  'glendale': `A residential hillside street in the Rossmoyne / Adams Hill area of Glendale, California: 1920s-1930s Spanish-revival and Mediterranean homes with red-tile roofs and arched windows on gently sloping streets, the Verdugo Mountains rising in the background under clear daylight.`,
  'hollywood': `A winding hillside residential street in the Beachwood Canyon / Hollywood Hills area of Los Angeles: Spanish-revival and Mediterranean homes on steep leafy lots with palms and eucalyptus, a hazy view over the city below in warm daylight.`,
  'irvine': `A clean master-planned residential street in Irvine, California: modern Mediterranean stucco tract homes with red clay-tile roofs and manicured landscaping under a bright clear sky.`,
  'long-beach': `A flat residential street in the Belmont Shore / California Heights area of Long Beach, California: 1920s Spanish-revival and craftsman bungalows set close together with small front lawns and palm trees in bright coastal daylight.`,
  'los-angeles': `A tree-lined residential street in the Hancock Park / Larchmont area of Los Angeles: stately 1920s-1930s pre-war Spanish-revival, Tudor and Colonial-revival homes with broad green lawns and tall mature street trees in warm daylight.`,
  'pasadena': `A historic residential street in the Bungalow Heaven area of Pasadena, California: 1910s-1940s Craftsman bungalows with deep eaves and wide front porches under mature oak trees, the San Gabriel Mountains rising hazy in the distance.`,
  'rancho-cucamonga': `A suburban residential street in the Alta Loma / Etiwanda area of Rancho Cucamonga, California (Inland Empire): newer 1990s-2010s two-story stucco tract homes with red clay-tile roofs and tidy manicured lawns, the San Gabriel Mountains rising close behind under a bright clear sky.`,
  'santa-monica': `A leafy residential street in Santa Monica, California north of Montana Avenue: craftsman and Spanish-revival bungalows behind low hedges and tall palm trees in soft coastal light.`,
};

// ── Service appliance that appears naturally in frame (city stays the focus) ──
const SERVICE_APPLIANCE = {
  'cooktop-repair': 'a stainless glass cooktop panel',
  'dishwasher-repair': 'a stainless dishwasher',
  'dryer-repair': 'a white clothes dryer on a hand truck',
  'freezer-repair': 'a white upright freezer on a hand truck',
  'garbage-disposal-repair': 'a small garbage disposal unit in hand',
  'ice-maker-repair': 'a stainless ice-maker unit',
  'microwave-repair': 'an over-the-range microwave unit',
  'oven-repair': 'a stainless wall oven',
  'range-hood-repair': 'a stainless range hood',
  'range-repair': 'a freestanding stainless range on a hand truck',
  'refrigerator-repair': 'a stainless refrigerator on a hand truck',
  'stove-repair': 'a freestanding stove on a hand truck',
  'wall-oven-repair': 'a built-in stainless wall oven',
  'washer-repair': 'a white washing machine on a hand truck',
  'wine-cooler-repair': 'a stainless wine cooler',
};
const SERVICES = Object.keys(SERVICE_APPLIANCE);

const STYLE = (cityScene, appliance) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic daytime lighting, NOT AI-glossy, no HDR sheen. ${cityScene} A single appliance repair technician in a plain dark navy work polo and cap works by a plain white work van — the van is completely plain with NO text, NO logo, NO badge, NO writing anywhere on it. The technician is handling ${appliance} near the open van. An open tool bag with a few hand tools rests on the ground nearby. The RIGHT two-thirds holds the technician, van and street in crisp focus; the LEFT third is calmer and more open (sky / leafy distance) so a dark text panel can be laid over it. Bright clear Southern California daylight. NO other people anywhere, NO other cars in the frame. No text, no signs, no logos, no readable labels, no watermarks. 2K.`;

const SIZES = [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genOne(city, service, scene, appliance) {
  const out = path.join(TMP, `${city}__${service}.png`);
  if (isValidPng(out)) { console.log(`• ${city}/${service} cached`); return true; }
  const body = JSON.stringify({
    contents: [{ parts: [{ text: STYLE(scene, appliance) }] }],
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

const done = [], failed = [], skipped = [];
for (const city of WAVE_CITIES) {
  const scene = CITY_SCENES[city];
  if (!scene) { console.error(`!! no CITY_SCENES entry for ${city}`); process.exit(1); }
  for (const service of SERVICES) {
    const distPage = path.join('dist', city, service, 'index.html');
    if (!fs.existsSync(distPage)) continue; // combo not built for this city
    const distHtml = fs.readFileSync(distPage, 'utf8');
    if (/http-equiv=["']refresh["']/i.test(distHtml) && distHtml.length < 2000) continue; // redirect stub, not a real template page
    if (fs.existsSync(path.join(DST, city, service, 'hero.webp'))) { skipped.push(`${city}/${service}`); continue; }
    const ok = await genOne(city, service, scene, SERVICE_APPLIANCE[service]);
    if (ok && await convertOne(city, service)) done.push(`${city}/${service}`);
    else failed.push(`${city}/${service}`);
    await sleep(1000);
  }
}
console.log(`\n=== WAVE: done ${done.length}, skipped(existing) ${skipped.length}, failed ${failed.length} ===`);
console.log('DONE:\n' + done.join('\n'));
if (skipped.length) console.log('SKIPPED:\n' + skipped.join('\n'));
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
