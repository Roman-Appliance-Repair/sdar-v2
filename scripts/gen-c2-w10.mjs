// scripts/gen-c2-w10.mjs
// Wave 10 (FINAL) — the last 20 photoless brand product pages. Mixed residential +
// commercial, jackson full-bleed 21:9, unit SHARP in the right two-thirds, LEFT third
// softly blurred for the dark text panel, realistic, no logos. Excludes brands/index
// (hub) and the magic-chef pillar (301 → refrigerator-repair); magic-chef-* combos ARE
// real pages and included. Subjects brand-authentic (model details from page copy):
// Champion warewasher, Heatcraft condensing unit, Hobart planetary mixer, Imperial
// convection oven + range, Kratos/MainStreet convection, Lang clamshell griddle,
// Magic Chef compact range/stove/wall-oven, Napoleon gas grill, Perlick draft tower +
// glycol, Roper budget dishwasher/fridge, Speed Queen top-load pair, True reach-in,
// WhisperKool/Wine Guardian cellar cooling, Zephyr designer hood.
// Output: <TMP>/c2w10/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w10');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The unit sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const KITCHEN = 'Bright contemporary SoCal family kitchen with clean stone counters';
const KITCHEN_SMALL = 'Small bright SoCal apartment kitchen with compact counters';
const LAUNDRY = 'Bright contemporary SoCal laundry room with cabinetry';
const OUTDOOR = 'Upscale SoCal backyard patio with clean hardscape';
const COMM = 'Stainless steel commercial restaurant kitchen with a tile floor and a ventilation hood line above';
const BACK = 'Commercial restaurant back-of-house with stainless prep tables and a tile floor';
const BAR = 'Upscale craft-bar back-bar area with a stone counter';
const CELLAR = 'Climate-controlled residential wine cellar with wooden wine racks';

const ITEMS = [
  // --- Commercial foodservice ---
  [1,'champion',`A stainless steel commercial door-type warewasher with a tall square pull-down hood door and a control panel, standing between stainless dish tables, robust industrial proportions`, COMM],
  [2,'heatcraft-condensing-unit-repair',`A commercial refrigeration condensing unit on a steel base frame, a finned condenser coil with a round fan grille and a compressor mounted on the base, copper refrigerant lines running out, robust industrial proportions`, BACK],
  [3,'hobart',`A heavy stainless steel commercial planetary floor mixer with a large round mixing bowl raised on the lift, a bowl guard and a gear-shift lever on the mixing head, robust industrial proportions`, COMM],
  [4,'imperial-oven-repair',`A stainless steel commercial convection oven, a tall cabinet with double glass doors and heavy chrome bar handles, control knobs on the side panel, robust industrial proportions`, COMM],
  [5,'imperial-range-repair',`A heavy-duty stainless steel commercial restaurant range with open gas burners on heavy cast-iron grates above a stainless oven base, a high stainless back riser, robust industrial proportions`, COMM],
  [6,'kratos-oven-repair',`A stainless steel commercial convection oven on a stand, a wide glass door with a chrome bar handle and a side-mounted control panel, robust industrial proportions`, COMM],
  [7,'lang-oven-repair',`A stainless steel commercial countertop clamshell griddle with a hinged heated upper platen over a flat cooking surface, a front control panel, robust industrial proportions`, COMM],
  [8,'mainstreet-equipment-oven-repair',`A stainless steel commercial convection oven, a single tall cabinet with a glass door and a chrome handle, control knobs on the side, robust industrial proportions`, COMM],
  [9,'true',`A stainless steel commercial reach-in refrigerator with a tall solid door and a heavy vertical handle, a digital temperature display at the top, standing in a commercial kitchen, robust industrial proportions`, BACK],
  // --- Bar / cellar refrigeration ---
  [10,'perlick-draft-beer-system-repair',`A polished stainless steel multi-tap draft beer tower mounted on a bar counter with several plain tap handles and a drip tray below, a glycol chiller power pack unit beside it, clean bar-equipment proportions`, BAR],
  [11,'whisperkool-wine-cellar-repair',`A wine cellar cooling unit mounted high on the wall of a wood-racked wine cellar, a rectangular stainless-and-black vented air unit, rows of wine bottles below, climate-controlled proportions`, CELLAR],
  [12,'wine-guardian-repair',`A ducted wine cellar cooling unit, a rectangular stainless air-handler with insulated ducting attached, mounted near a wood-racked wine cellar, climate-control proportions`, CELLAR],
  // --- Residential ---
  [13,'magic-chef-oven-repair',`A compact freestanding stainless steel electric range with a smooth cooktop, a glass oven door with a simple handle, a rear control panel with round knobs, compact apartment-scale proportions`, KITCHEN_SMALL],
  [14,'magic-chef-stove-repair',`A compact freestanding stainless steel gas stove with sealed burners on grates, a glass oven door with a simple handle, a rear control panel with round knobs, compact apartment-scale proportions`, KITCHEN_SMALL],
  [15,'magic-chef-wall-oven-repair',`A compact 24-inch built-in stainless steel single wall oven set into cabinetry, a glass door with a simple bar handle and a small control panel, compact proportions`, KITCHEN_SMALL],
  [16,'roper-dishwasher-repair',`A built-in stainless steel dishwasher set into cabinetry, a front control panel along the top edge and a simple bar handle, clean budget proportions`, KITCHEN],
  [17,'roper-refrigerator-repair',`A freestanding white top-freezer refrigerator standing in a simple kitchen, a freezer compartment on top above a fridge door, simple recessed handles, clean budget proportions`, KITCHEN],
  [18,'speed-queen-washer-dryer-repair',`A rugged commercial-grade residential top-load washing machine with a white metal cabinet and a simple control panel beside a matching dryer, standing in a bright laundry room, sturdy proportions`, LAUNDRY],
  [19,'napoleon-grill-repair',`A freestanding stainless steel gas barbecue grill with a domed lid and a stainless front control panel, mounted on a cart with side shelves, standing on a backyard patio, clean modern proportions`, OUTDOOR],
  [20,'zephyr-range-hood-repair',`A sleek wall-mounted designer stainless steel chimney range hood with a curved glass canopy and a slim flue, touch controls and perimeter lighting underneath, contemporary proportions`, KITCHEN],
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
console.log(`\n=== GEN SUMMARY: ${present.length}/20 valid PNG in ${OUTDIR} ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
console.log('HARD GATE PASS: 20/20 (wave 10 FINAL — last photoless brand pages, 21:9 jackson-format)');
