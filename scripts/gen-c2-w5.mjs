// scripts/gen-c2-w5.mjs
// Wave 5 — 30 high-traffic mainstream brand heroes (LG, Samsung, GE, Whirlpool) in jackson
// full-bleed format: ultra-wide 21:9, appliance SHARP in the right two-thirds, LEFT third
// softly blurred for the text panel, tools + lively setting, realistic, no logos. Subjects are
// brand-authentic (web-researched: LG InstaView dispenser door, Samsung gloss front-load with
// pedestal, GE OTR microwave, Whirlpool top-load console). Output: <TMP>/c2w5/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w5');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const KITCHEN = 'Bright contemporary SoCal family kitchen with clean stone counters';
const LAUNDRY = 'Bright tidy SoCal home laundry room with cabinetry';

const ITEMS = [
  [1,'lg-refrigerator-repair',`A wide counter-depth French-door refrigerator in brushed stainless steel, two upper doors above a pull-out freezer drawer, a smooth flat front with slim recessed handles and a tall water-and-ice dispenser inset on the left door, clean modern proportions`, KITCHEN],
  [2,'lg-stove-repair',`A freestanding stainless steel electric range with a smooth black ceramic-glass cooktop, a wide curved-handle glass oven door, a rear backguard control panel with round knobs, clean contemporary proportions`, KITCHEN],
  [3,'lg-range-repair',`A freestanding stainless steel gas range, four sealed burners on edge-to-edge matte-black cast-iron grates, a wide glass oven door with a full-width bar handle, a rear backguard control panel with round knobs, clean modern proportions`, KITCHEN],
  [4,'lg-oven-repair',`A built-in stainless steel double wall oven recessed into cabinetry, two large glass doors with full-width bar handles, a slim electronic control strip with a small display between them, clean rectangular proportions`, KITCHEN],
  [5,'lg-wall-oven-repair',`A built-in stainless steel single wall oven set flush into cabinetry, a large glass door with a full-width bar handle, a slim touch control strip with a small display across the top, clean flush rectangular proportions`, KITCHEN],
  [6,'lg-range-hood-repair',`An under-cabinet stainless steel range hood mounted beneath upper cabinets above a cooktop, a slim flat brushed-metal canopy, recessed LED lighting and a row of push controls underneath, clean low-profile proportions`, KITCHEN],
  [7,'lg-ice-maker-repair',`An undercounter stainless steel ice maker built flush into cabinetry, a full-front brushed-metal door with a slim recessed handle, a clear ice bin glowing soft blue-white inside, compact boxy proportions`, KITCHEN],
  [8,'lg-stackable-washer-dryer-repair',`A stacked front-load washer and dryer column in white, two large round tempered-glass doors one above the other, sloped control panels with round selector dials and digital displays, clean modern laundry proportions`, LAUNDRY],
  [9,'samsung-refrigerator-repair',`A wide French-door refrigerator in brushed stainless steel with a smooth flat front, two upper doors above a freezer drawer, slim recessed handles, a subtle flush water dispenser, clean minimalist modern proportions`, KITCHEN],
  [10,'samsung-washer-repair',`A large front-load washing machine with a glossy finish, a big round chrome-rimmed tempered-glass door, a sloped top control panel with a round selector dial and a digital display, sitting on a matching pedestal storage drawer`, LAUNDRY],
  [11,'samsung-dryer-repair',`A large front-load dryer with a wide round tempered-glass door, a sloped control panel with a round dial and a digital display, a smooth glossy front, sitting on a matching pedestal beside laundry cabinetry`, LAUNDRY],
  [12,'samsung-stove-repair',`A freestanding stainless steel electric range with a smooth black glass-ceramic cooktop, a wide glass oven door with a full-width handle, a flat front control panel with knobs, clean contemporary proportions`, KITCHEN],
  [13,'samsung-range-repair',`A freestanding stainless steel gas range, sealed burners on continuous matte-black grates, a wide glass oven door with a bar handle, a rear backguard control panel with round knobs, modern proportions`, KITCHEN],
  [14,'samsung-oven-repair',`A built-in stainless steel double wall oven set into cabinetry, two large glass doors with bar handles, a slim touch control strip between them, clean rectangular proportions`, KITCHEN],
  [15,'samsung-wall-oven-repair',`A built-in stainless steel single wall oven recessed into cabinetry, a large dark glass door with a full-width bar handle, a flat touch control panel across the top, clean flush proportions`, KITCHEN],
  [16,'samsung-range-hood-repair',`A wall-mounted stainless steel chimney range hood, a wide angled canopy tapering to a rectangular flue duct, brushed-metal surfaces, recessed lighting and mesh filters underneath, clean modern proportions`, KITCHEN],
  [17,'samsung-ice-maker-repair',`An undercounter stainless steel ice maker built into cabinetry, a full-front brushed-metal door with a slim handle, a clear ice bin softly lit inside, compact boxy proportions`, KITCHEN],
  [18,'samsung-stackable-washer-dryer-repair',`A stacked front-load washer and dryer column, two large round tempered-glass doors one above the other, sloped control panels with round dials and digital displays, clean modern laundry-room proportions`, LAUNDRY],
  [19,'ge-refrigerator-repair',`A wide French-door refrigerator in brushed stainless steel, two upper doors above a pull-out freezer drawer, sturdy tubular handles, a flat front with an external water-and-ice dispenser, clean straightforward proportions`, KITCHEN],
  [20,'ge-stove-repair',`A freestanding stainless steel electric range with a smooth black glass-ceramic cooktop, a wide glass oven door with a handle, a rear control backguard with knobs and a display, clean proportions`, KITCHEN],
  [21,'ge-range-repair',`A freestanding stainless steel gas range, sealed burners on cast-iron grates, a wide glass oven door with a bar handle, a rear backguard control panel, modern proportions`, KITCHEN],
  [22,'ge-oven-repair',`A built-in stainless steel double wall oven set into cabinetry, two glass doors with bar handles, an electronic control strip between them, clean rectangular proportions`, KITCHEN],
  [23,'ge-wall-oven-repair',`A built-in stainless steel single wall oven recessed into cabinetry, a large glass door with a bar handle, a control panel with a display across the top, clean flush proportions`, KITCHEN],
  [24,'ge-range-hood-repair',`An under-cabinet stainless steel range hood beneath upper cabinets above a cooktop, a slim brushed-metal canopy with recessed lighting and push controls underneath, low-profile proportions`, KITCHEN],
  [25,'ge-ice-maker-repair',`An undercounter stainless steel ice maker built flush into cabinetry, a brushed-metal door with a slim handle, a clear ice bin glowing softly inside, compact proportions`, KITCHEN],
  [26,'ge-microwave-repair',`An over-the-range stainless steel microwave mounted beneath an upper cabinet above a cooktop, a wide dark-glass door with a right-side handle, a vertical control panel, vents and a light underneath, clean rectangular proportions`, KITCHEN],
  [27,'whirlpool-refrigerator-repair',`A French-door refrigerator in brushed stainless steel, two upper doors above a pull-out freezer drawer, sturdy tubular handles, a smooth flat front, clean straightforward proportions`, KITCHEN],
  [28,'whirlpool-washer-repair',`A top-load washing machine in white with a clear glass lid, a curved rear control console with a large round dial and buttons, a smooth boxy cabinet, standing in a home laundry room`, LAUNDRY],
  [29,'whirlpool-dryer-repair',`A top-load dryer in white with a wide front door, a curved rear control console with a round dial and buttons, a smooth boxy cabinet beside laundry cabinetry`, LAUNDRY],
  [30,'whirlpool-stove-repair',`A freestanding stainless steel electric range with a smooth black ceramic-glass cooktop, a wide glass oven door with a handle, a rear control backguard with knobs, clean proportions`, KITCHEN],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function isValidPng(p) {
  try { const fd = fs.openSync(p, 'r'); const b = Buffer.alloc(8); fs.readSync(fd, b, 0, 8, 0); fs.closeSync(fd);
    return b.toString('hex').startsWith('89504e470d0a1a0a') && fs.statSync(p).size > 10000; } catch { return false; }
}

async function genOne(num, slug, subject, setting) {
  const out = path.join(OUTDIR, `${num}_${slug}.png`);
  if (isValidPng(out)) { console.log(`• #${num} ${slug} — present, skip`); return true; }
  const body = JSON.stringify({
    contents: [{ parts: [{ text: `${subject}. ${STYLE(setting)}` }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let attempt = 1; attempt <= 5; attempt++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  #${num} ${slug} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * attempt;
      console.error(`  #${num} ${slug} HTTP ${resp.status}, wait ${Math.round(wait/1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  #${num} ${slug} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  #${num} ${slug} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  #${num} ${slug} bad PNG, retry`); await sleep(2000); continue; }
    console.log(`✓ #${num} ${slug} (${(fs.statSync(out).size/1024).toFixed(0)} KB)`); return true;
  }
  console.error(`✗ #${num} ${slug} FAILED`); return false;
}

const failed = [];
for (const [n, s, subj, set] of ITEMS) { if (!(await genOne(n, s, subj, set))) failed.push(`#${n} ${s}`); await sleep(1200); }
const present = ITEMS.filter(([n, s]) => isValidPng(path.join(OUTDIR, `${n}_${s}.png`)));
console.log(`\n=== GEN SUMMARY: ${present.length}/30 valid PNG in ${OUTDIR} ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
console.log('HARD GATE PASS: 30/30 (wave 5 mainstream, 21:9 jackson-format)');
