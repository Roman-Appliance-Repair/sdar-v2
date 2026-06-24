// scripts/gen-c2-w7.mjs
// Wave 7 — 30 brand heroes (19 residential premium/mainstream + 11 commercial
// foodservice) in jackson full-bleed format: ultra-wide 21:9, appliance SHARP in
// the right two-thirds, LEFT third softly blurred for the dark text panel, tools +
// lively setting, realistic, no logos. Subjects brand-authentic (model details
// pulled from each page's researched copy): Fulgor Milano (Distinto column / Sofia
// French Door / 600-700 pro ranges / Italian chimney hoods / panel-ready dw),
// Hestan (Pro Series colored ranges w/ brass burners + marquee knobs, column
// fridge, G-Series hoods, KDW24 dw), Haier (24" compact apartment-scale), Kenmore
// (mainstream Whirlpool/LG chassis), Sharp (microwave drawer pioneer), Panasonic
// (Inverter countertop), Vulcan / Garland (heavy-duty commercial ranges + fryers +
// convection ovens), Pitco / Frymaster (foodservice fryer batteries w/ filtration),
// Henny Penny (round pressure fryer), Southbend (commercial convection).
// Output: <TMP>/c2w7/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w7');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const KITCHEN = 'Bright contemporary SoCal family kitchen with clean stone counters';
const KITCHEN_LUX = 'Bright upscale SoCal designer kitchen with stone counters and custom cabinetry';
const KITCHEN_SMALL = 'Small bright urban SoCal apartment kitchen with compact counters';
const COMMERCIAL = 'Stainless steel commercial restaurant kitchen with a tile floor and a ventilation hood line above';

const ITEMS = [
  // --- Fulgor Milano (Italian, Meneghetti) ---
  [1,'fulgor-milano-dishwasher-repair',`A 24-inch built-in stainless steel dishwasher set flush into Italian-style cabinetry, a sleek minimalist front with a slim recessed bar handle and a clean control strip along the top edge, refined contemporary European proportions`, KITCHEN_LUX],
  [2,'fulgor-milano-range-hood-repair',`A wall-mounted stainless steel Italian chimney range hood with a sleek angular canopy tapering to a slim rectangular flue duct, brushed-metal surfaces, soft perimeter lighting and touch controls underneath, refined contemporary proportions`, KITCHEN_LUX],
  [3,'fulgor-milano-refrigerator-repair',`A tall built-in column refrigerator in brushed stainless steel set flush into Italian cabinetry, a single full-height door with a slim vertical tubular handle, clean minimalist contemporary European proportions`, KITCHEN_LUX],
  [4,'fulgor-milano-stove-repair',`A freestanding stainless steel Italian pro-style range, heavy continuous cast-iron grates over sealed brass burners, a wide glass oven door with a bold tubular handle, a row of solid metal control knobs along the front, refined European proportions`, KITCHEN_LUX],
  [5,'fulgor-milano-wall-oven-repair',`A built-in stainless steel single wall oven set into cabinetry, a large glass door with a bold professional tubular bar handle, a clean horizontal control panel with a display, refined contemporary European proportions`, KITCHEN_LUX],
  // --- Hestan (Anaheim CA, colored finishes, brass burners, marquee knobs) ---
  [6,'hestan-dishwasher-repair',`A 24-inch built-in dishwasher with a bold deep-colored enamel front panel and a heavy professional stainless tubular bar handle, set flush into luxury cabinetry, robust premium proportions`, KITCHEN_LUX],
  [7,'hestan-range-hood-repair',`A wall-mounted professional range hood with a bold deep-colored enamel canopy and brushed-metal trim, a wide angled body tapering to a rectangular flue, heavy baffle filters and warm lighting underneath, robust premium proportions`, KITCHEN_LUX],
  [8,'hestan-refrigerator-repair',`A tall built-in column refrigerator with a bold deep-colored front panel and a heavy professional stainless tubular handle, set flush into luxury cabinetry, robust premium proportions`, KITCHEN_LUX],
  [9,'hestan-stove-repair',`A freestanding professional range with a bold deep-colored enamel body, heavy continuous cast-iron grates over signature brass burners, a wide glass oven door with a thick stainless tubular handle, large metal control knobs with subtle illuminated rings, robust premium proportions`, KITCHEN_LUX],
  [10,'hestan-wall-oven-repair',`A built-in single wall oven with a bold deep-colored enamel front and a heavy professional stainless tubular bar handle, a large dark-glass door, robust premium proportions`, KITCHEN_LUX],
  // --- Haier (24" compact, apartment-scale) ---
  [11,'haier',`A compact 24-inch stainless steel bottom-freezer refrigerator standing in a small apartment kitchen, a slim upper door above a freezer drawer, simple tubular handles, clean compact proportions`, KITCHEN_SMALL],
  [12,'haier-oven-repair',`A compact 24-inch freestanding stainless steel electric range with a smooth black glass cooktop, a glass oven door with a simple handle, a rear control panel with round knobs, compact apartment-scale proportions`, KITCHEN_SMALL],
  [13,'haier-refrigerator-repair',`A compact stainless steel top-freezer refrigerator standing in a small bright kitchen, a freezer compartment on top above a fridge door, simple recessed handles, clean compact proportions`, KITCHEN_SMALL],
  [14,'haier-washer-repair',`A compact front-load washing machine with a white-and-grey body and a round chrome-rimmed glass door, a simple top control panel, standing in a small apartment laundry nook, compact proportions`, KITCHEN_SMALL],
  // --- Kenmore (mainstream, Whirlpool/LG chassis) ---
  [15,'kenmore',`A freestanding stainless steel French-door refrigerator in a bright mainstream family kitchen, two upper doors above a pull-out freezer drawer, sturdy tubular handles, an external water-and-ice dispenser, clean mainstream proportions`, KITCHEN],
  [16,'kenmore-oven-repair',`A freestanding stainless steel electric range with a smooth black ceramic-glass cooktop, a wide glass oven door with a bar handle, a rear backguard control panel with round knobs and a display, clean mainstream proportions`, KITCHEN],
  // --- Sharp (microwave drawer pioneer) ---
  [17,'sharp',`A stainless steel microwave drawer built flush into a kitchen island below the stone countertop, a wide brushed-metal drawer front with a horizontal recessed pocket handle and a slim touch control strip, clean modern proportions`, KITCHEN],
  [18,'sharp-microwave-repair',`A stainless steel microwave drawer built into lower cabinetry beneath a stone countertop, a wide brushed-metal drawer front with a horizontal recessed handle and touch controls, clean modern proportions`, KITCHEN],
  // --- Panasonic (Inverter countertop) ---
  [19,'panasonic-microwave-repair',`A countertop stainless steel microwave oven sitting on a clean kitchen counter, a wide dark-glass door with a right-side bar handle and a vertical touch control panel, compact modern proportions`, KITCHEN],
  // --- Vulcan (ITW heavy-duty commercial cooking) ---
  [20,'vulcan',`A heavy-duty stainless steel commercial cooking range in a professional restaurant kitchen, a row of open gas burners over heavy cast-iron grates beside a flat griddle section, a stainless oven base below and a high back shelf, robust industrial proportions`, COMMERCIAL],
  [21,'vulcan-fryer-repair',`A stainless steel commercial gas floor fryer in a professional kitchen, a deep oil vat with twin wire fry baskets and a tall rear flue, sturdy legs and a front control panel, robust industrial proportions`, COMMERCIAL],
  [22,'vulcan-oven-repair',`A stainless steel commercial convection oven in a professional kitchen, a tall double-door cabinet with large glass windows and heavy chrome bar handles, control knobs on the side panel, robust industrial proportions`, COMMERCIAL],
  [23,'vulcan-range-repair',`A heavy-duty stainless steel commercial range in a restaurant kitchen, six open gas burners on heavy cast-iron grates above a stainless oven base, a high stainless back riser, robust industrial proportions`, COMMERCIAL],
  // --- Garland (heavy-duty range + charbroiler) ---
  [24,'garland-range-repair',`A heavy-duty stainless steel commercial restaurant range with open gas burners on heavy cast-iron grates next to a charbroiler grate section, a stainless oven base below and a high back riser, robust industrial proportions`, COMMERCIAL],
  // --- Pitco (Frialator fryers, Middleby) ---
  [25,'pitco',`A stainless steel commercial gas floor fryer in a professional kitchen, a deep oil vat with twin fry baskets and a tall rear flue, a front control panel and sturdy legs, robust industrial proportions`, COMMERCIAL],
  [26,'pitco-fryer-repair',`A bank of two stainless steel commercial gas floor fryers side by side in a professional kitchen, deep oil vats with wire fry baskets and tall rear flues, front control panels, robust industrial proportions`, COMMERCIAL],
  // --- Frymaster (LOV/FilterQuick, integrated filtration) ---
  [27,'frymaster',`A stainless steel commercial fryer battery in a fast-food kitchen, several oil vats in a row with wire fry baskets above an integrated filtration cabinet, digital controllers on the front, robust industrial proportions`, COMMERCIAL],
  [28,'frymaster-fryer-repair',`A stainless steel commercial gas fryer with a built-in oil-filtration drawer below the vat, a digital controller panel on the front, wire fry baskets in the oil well, robust industrial proportions`, COMMERCIAL],
  // --- Henny Penny (round pressure fryer) ---
  [29,'henny-penny-fryer-repair',`A stainless steel commercial pressure fryer in a professional kitchen, a distinctive round closed lid with a locking handle over a deep fry pot, a digital control panel on the front cabinet, sturdy legs, robust industrial proportions`, COMMERCIAL],
  // --- Southbend (commercial convection oven) ---
  [30,'southbend-oven-repair',`A stainless steel commercial convection oven in a professional kitchen, a tall single cabinet with a large glass door and a heavy chrome bar handle, control knobs on the side panel, a high stainless body, robust industrial proportions`, COMMERCIAL],
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
console.log('HARD GATE PASS: 30/30 (wave 7 — 19 residential + 11 commercial, 21:9 jackson-format)');
