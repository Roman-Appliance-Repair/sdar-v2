// scripts/gen-c2-w8.mjs
// Wave 8 — 30 brand heroes (premium built-in / undercounter refrigeration + luxury
// cooking + mainstream Whirlpool + one outdoor grill) in jackson full-bleed format:
// ultra-wide 21:9, appliance SHARP in the right two-thirds, LEFT third softly blurred
// for the dark text panel, tools + lively setting, realistic, no logos. Subjects
// brand-authentic (model details from each page's researched copy): Whirlpool
// (WFE/WFG ranges, OTR micro, modular ice maker), JennAir (Rise/Obsidian dark-glass
// wall ovens, JCR compactor), Smeg (Victoria retro colored enamel + chrome),
// Signature Kitchen Suite (panel-ready LG luxury), Fisher & Paykel (Series 9 flush),
// GE Monogram (Statement pro handles), ILVE (Italian brass-trim Majestic), Marvel /
// U-Line / Perlick / True Residential (undercounter + wine + outdoor + column
// commercial-grade refrigeration), Weber (Genesis gas grill).
// Output: <TMP>/c2w8/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w8');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const KITCHEN = 'Bright contemporary SoCal family kitchen with clean stone counters';
const KITCHEN_LUX = 'Bright upscale SoCal designer kitchen with stone counters and custom cabinetry';
const BAR = 'Upscale SoCal home bar / butler pantry with a stone counter and custom cabinetry';
const OUTDOOR = 'Upscale SoCal outdoor kitchen with stone counters under a covered patio';
const LAUNDRY = 'Bright contemporary SoCal laundry room with cabinetry';

const ITEMS = [
  // --- Whirlpool (mainstream stainless, Benton Harbor) ---
  [1,'whirlpool-range-repair',`A freestanding stainless steel range with a smooth black ceramic-glass cooktop, a wide glass oven door with a bar handle, a rear backguard control panel with round knobs and a digital display, clean mainstream proportions`, KITCHEN],
  [2,'whirlpool-wall-oven-repair',`A built-in stainless steel single wall oven set into cabinetry, a large glass door with a full-width bar handle, a control panel with a display across the top, clean mainstream proportions`, KITCHEN],
  [3,'whirlpool-cooktop-repair',`A built-in stainless steel gas cooktop set into a stone countertop, sealed burners on heavy continuous cast-iron grates, sturdy metal control knobs along the front edge, clean mainstream proportions`, KITCHEN],
  [4,'whirlpool-microwave-repair',`An over-the-range stainless steel microwave mounted beneath an upper cabinet above a cooktop, a wide dark-glass door with a right-side handle, a vertical control panel, vents and a light underneath, clean mainstream proportions`, KITCHEN],
  [5,'whirlpool-range-hood-repair',`An under-cabinet stainless steel range hood beneath upper cabinets above a cooktop, a slim brushed-metal canopy with recessed lighting and push controls underneath, low-profile mainstream proportions`, KITCHEN],
  [6,'whirlpool-ice-maker-repair',`An undercounter stainless steel ice maker built flush into cabinetry, a brushed-metal door with a slim handle, a clear ice bin glowing softly inside, compact proportions`, KITCHEN],
  // --- JennAir (Rise/Obsidian dark-glass luxury, Whirlpool) ---
  [7,'jennair-wall-oven-repair',`A built-in single wall oven with a bold dark-glass front and a thick floating tubular metal handle, a sleek modern control panel, set into luxury cabinetry, refined premium proportions`, KITCHEN_LUX],
  [8,'jennair-range-hood-repair',`A wall-mounted professional chimney range hood with a wide angular stainless canopy tapering to a rectangular flue, brushed-metal surfaces, baffle filters and warm lighting underneath, refined premium proportions`, KITCHEN_LUX],
  [9,'jennair-microwave-repair',`A built-in stainless steel microwave set flush into luxury cabinetry, a wide dark-glass door with a sleek tubular handle and a recessed control strip, refined premium proportions`, KITCHEN_LUX],
  [10,'jennair-trash-compactor-repair',`A 15-inch built-in stainless steel trash compactor set flush into lower cabinetry, a narrow brushed-metal drawer front with a slim handle and a small control panel, compact premium proportions`, KITCHEN_LUX],
  // --- Smeg (Victoria retro colored enamel + chrome, Italian) ---
  [11,'smeg-stove-repair',`A freestanding retro-style range with a glossy colored enamel body and softly rounded edges, chrome trim, cast-iron grates over gas burners, a wide oven door with a chrome bar handle and vintage round control knobs, distinctive retro proportions`, KITCHEN_LUX],
  [12,'smeg-dishwasher-repair',`A built-in dishwasher with a glossy colored enamel front panel, chrome trim and a chrome bar handle, set flush into cabinetry, distinctive retro-modern proportions`, KITCHEN_LUX],
  [13,'smeg-wall-oven-repair',`A built-in single wall oven with a glossy colored enamel front, chrome trim and a vintage chrome bar handle over a glass door, distinctive retro proportions`, KITCHEN_LUX],
  // --- Signature Kitchen Suite (LG luxury, panel-ready) ---
  [14,'signature-kitchen-suite-wall-oven-repair',`A built-in stainless steel single wall oven set into luxury cabinetry, a large glass door with a heavy professional tubular bar handle and a wide control display, refined upscale proportions`, KITCHEN_LUX],
  [15,'signature-kitchen-suite-dishwasher-repair',`A 24-inch panel-ready built-in dishwasher set perfectly flush into custom cabinetry, a clean integrated front with a discreet recessed handle, refined upscale proportions`, KITCHEN_LUX],
  [16,'signature-kitchen-suite-range-hood-repair',`A wall-mounted professional stainless steel range hood with a wide angular canopy tapering to a rectangular flue, brushed surfaces, baffle filters and recessed lighting underneath, refined upscale proportions`, KITCHEN_LUX],
  // --- Fisher & Paykel (Series 9 flush minimalist) ---
  [17,'fisher-paykel-wall-oven-repair',`A built-in stainless steel single wall oven set flush into cabinetry, a clean minimalist front with a slim full-width handle and a subtle touch control strip, refined contemporary proportions`, KITCHEN_LUX],
  [18,'fisher-paykel-washer-repair',`A front-load washing machine with a clean white body and a round chrome-rimmed glass door, a minimalist top control panel, standing in a bright laundry room, refined contemporary proportions`, LAUNDRY],
  // --- GE Monogram (Statement pro handles) ---
  [19,'ge-monogram-wall-oven-repair',`A built-in stainless steel single wall oven set into cabinetry, a large glass door with a heavy professional tubular handle and bold chunky chrome brackets, a wide control panel, robust pro-grade proportions`, KITCHEN_LUX],
  // --- ILVE (Italian brass-trim Majestic) ---
  [20,'ilve-wall-oven-repair',`A built-in single wall oven with a deep-colored enamel front and brass trim, a glass door with a brass-accented handle and round brass control knobs, distinctive Italian proportions`, KITCHEN_LUX],
  [21,'ilve-range-hood-repair',`A wall-mounted Italian range hood with a colored enamel canopy and brass trim, a wide angled body tapering to a rectangular flue, baffle filters and warm lighting underneath, distinctive Italian proportions`, KITCHEN_LUX],
  // --- Marvel (undercounter premium, AGA/Middleby) ---
  [22,'marvel-refrigerator-repair',`An undercounter built-in refrigerator in stainless steel set flush into bar cabinetry, a single solid door with a slim professional tubular handle, a clean stainless front with a vented toe-kick grille, compact premium proportions`, BAR],
  // --- U-Line (undercounter / wine / outdoor) ---
  [23,'u-line-refrigerator-repair',`An undercounter stainless steel refrigerator built flush into cabinetry, a solid brushed-stainless door with a slim tubular handle, a clean compact front, premium undercounter proportions`, BAR],
  [24,'u-line-wine-cooler-repair',`An undercounter wine refrigerator built into cabinetry, a stainless-framed glass door revealing horizontal wooden wine racks softly lit inside, a slim handle, premium undercounter proportions`, BAR],
  [25,'u-line-outdoor-refrigerator-repair',`An undercounter stainless steel outdoor refrigerator built into a stone outdoor-kitchen island, a heavy marine-grade stainless door with a tubular handle and a vented grille, robust weatherized proportions`, OUTDOOR],
  // --- Perlick (undercounter / outdoor, glass + solid) ---
  [26,'perlick-refrigerator-repair',`An undercounter stainless steel refrigerator built flush into home-bar cabinetry, a solid brushed-stainless door with a professional tubular handle, a clean front with a vented toe-kick grille, premium undercounter proportions`, BAR],
  [27,'perlick-outdoor-refrigerator-repair',`An undercounter stainless steel outdoor refrigerator built into a stone patio bar, a heavy marine-grade stainless door with a tubular handle and a vented grille, robust weatherized proportions`, OUTDOOR],
  // --- True Residential (column commercial-grade + wine, Anaheim CA) ---
  [28,'true-residential-built-in-refrigerator-repair',`A tall built-in column refrigerator with a heavy commercial-grade stainless front and a thick full-height professional tubular handle, set flush into luxury cabinetry, robust premium proportions`, KITCHEN_LUX],
  [29,'true-residential-wine-cooler-repair',`A built-in wine refrigerator column with a heavy stainless-framed glass door revealing rows of horizontal wine bottles softly lit inside, a thick professional tubular handle, set into luxury cabinetry, robust premium proportions`, KITCHEN_LUX],
  // --- Weber (Genesis gas grill) ---
  [30,'weber-grill-repair',`A freestanding gas barbecue grill with a black domed lid and a stainless steel front control panel, mounted on a wheeled cart with side shelves, standing on a SoCal backyard patio, clean modern proportions`, OUTDOOR],
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
console.log('HARD GATE PASS: 30/30 (wave 8 — premium refrigeration + luxury cooking + Weber, 21:9 jackson-format)');
