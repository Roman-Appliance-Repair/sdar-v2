// scripts/gen-c2-w6.mjs
// Wave 6 — 30 mainstream + GE-family brand heroes (Maytag, KitchenAid, Frigidaire, GE Profile,
// GE Café, GE Monogram) in jackson full-bleed format: ultra-wide 21:9, appliance SHARP in the
// right two-thirds, LEFT third softly blurred for the text panel, tools + lively setting,
// realistic, no logos. Subjects brand-authentic (web-researched: Maytag rugged fingerprint-
// resistant + commercial coin top-load, KitchenAid pro tubular handles, GE Profile hands-free
// autofill, GE Café matte + brushed-bronze hardware incl. in-door Keurig brewer, GE Monogram
// pro chrome brackets). Output: <TMP>/c2w6/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w6');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const KITCHEN = 'Bright contemporary SoCal family kitchen with clean stone counters';
const LAUNDROMAT = 'Bright commercial laundromat with rows of machines behind';

const ITEMS = [
  [1,'maytag-refrigerator-repair',`A wide French-door refrigerator in fingerprint-resistant brushed stainless steel, two upper doors above a pull-out freezer drawer, bold sturdy tubular handles, a flat rugged front, clean robust proportions`, KITCHEN],
  [2,'maytag-stove-repair',`A freestanding stainless steel electric range with a smooth black ceramic-glass cooktop, a wide glass oven door with a bold handle, a rear backguard control panel with sturdy round knobs, robust proportions`, KITCHEN],
  [3,'maytag-range-repair',`A freestanding stainless steel gas range, sealed burners on heavy continuous cast-iron grates, a wide glass oven door with a bold bar handle, a rear backguard with round knobs, rugged proportions`, KITCHEN],
  [4,'maytag-wall-oven-repair',`A built-in stainless steel single wall oven set into cabinetry, a large glass door with a bold full-width bar handle, a control panel with a display across the top, sturdy rectangular proportions`, KITCHEN],
  [5,'maytag-range-hood-repair',`An under-cabinet stainless steel range hood beneath upper cabinets above a cooktop, a slim sturdy brushed-metal canopy with recessed lighting and push controls underneath, robust low-profile proportions`, KITCHEN],
  [6,'maytag-microwave-repair',`An over-the-range stainless steel microwave mounted beneath an upper cabinet above a cooktop, a wide dark-glass door with a right-side handle, a vertical control panel, vents and a light underneath, sturdy proportions`, KITCHEN],
  [7,'maytag-ice-maker-repair',`An undercounter stainless steel ice maker built flush into cabinetry, a sturdy brushed-metal door with a slim handle, a clear ice bin glowing softly inside, robust compact proportions`, KITCHEN],
  [8,'maytag-commercial-laundry-repair',`A sturdy commercial top-load washing machine with a heavy white-and-grey metal cabinet, a coin-slide payment mechanism along the top console, a robust industrial build, standing at the end of a row of laundromat machines`, LAUNDROMAT],
  [9,'kitchenaid-refrigerator-repair',`A wide built-in French-door refrigerator in brushed stainless steel set flush into cabinetry, two upper doors above a freezer drawer, bold pro-style tubular handles with chrome end-caps, a flat premium front, refined proportions`, KITCHEN],
  [10,'kitchenaid-oven-repair',`A built-in stainless steel double wall oven recessed into cabinetry, two large glass doors with bold pro-style tubular handles, a slim electronic control strip between them, refined rectangular proportions`, KITCHEN],
  [11,'kitchenaid-microwave-repair',`A built-in stainless steel microwave set flush into cabinetry, a wide dark-glass door with a pro-style tubular handle and a recessed control strip, clean refined rectangular proportions`, KITCHEN],
  [12,'kitchenaid-range-hood-repair',`A wall-mounted stainless steel chimney range hood, a wide angled canopy tapering to a rectangular flue duct, brushed-metal surfaces, baffle filters and recessed lighting underneath, refined proportions`, KITCHEN],
  [13,'frigidaire-refrigerator-repair',`A wide French-door refrigerator in brushed stainless steel, two upper doors above a pull-out freezer drawer, smooth tubular handles, a flat front with an external water-and-ice dispenser, clean proportions`, KITCHEN],
  [14,'frigidaire-wall-oven-repair',`A built-in stainless steel single wall oven set into cabinetry, a large glass door with a full-width bar handle, a control panel with a display across the top, clean rectangular proportions`, KITCHEN],
  [15,'frigidaire-microwave-repair',`An over-the-range stainless steel microwave mounted beneath an upper cabinet above a cooktop, a wide dark-glass door with a right-side handle, a vertical control panel, vents and a light underneath, clean proportions`, KITCHEN],
  [16,'frigidaire-range-hood-repair',`An under-cabinet stainless steel range hood beneath upper cabinets above a cooktop, a slim brushed-metal canopy with recessed lighting and push controls underneath, low-profile proportions`, KITCHEN],
  [17,'frigidaire-ice-maker-repair',`An undercounter stainless steel ice maker built flush into cabinetry, a brushed-metal door with a slim handle, a clear ice bin glowing softly inside, compact proportions`, KITCHEN],
  [18,'ge-profile-refrigerator-repair',`A wide French-door refrigerator in fingerprint-resistant brushed stainless steel, two upper doors above a freezer drawer, slim modern handles, a flat front with a recessed hands-free autofill water dispenser, clean upscale proportions`, KITCHEN],
  [19,'ge-profile-stove-repair',`A freestanding stainless steel slide-in range with a smooth black glass-ceramic cooktop, front-mounted round knobs on a low control panel, a wide glass oven door with a handle, clean upscale proportions`, KITCHEN],
  [20,'ge-profile-wall-oven-repair',`A built-in stainless steel single wall oven set into cabinetry, a large glass door with a full-width handle, a modern touch control panel with a display across the top, clean upscale proportions`, KITCHEN],
  [21,'ge-profile-range-hood-repair',`A wall-mounted stainless steel chimney range hood, a wide angled canopy tapering to a rectangular flue duct, brushed-metal surfaces, mesh filters and recessed lighting underneath, clean modern proportions`, KITCHEN],
  [22,'ge-profile-dishwasher-repair',`A built-in stainless steel dishwasher set flush into cabinetry, a smooth flat brushed-metal front with a recessed pocket handle and a hidden top control strip, clean upscale rectangular proportions`, KITCHEN],
  [23,'ge-profile-ice-maker-repair',`An undercounter stainless steel ice maker built flush into cabinetry, a brushed-metal door with a slim handle, a clear ice bin glowing softly inside, compact upscale proportions`, KITCHEN],
  [24,'ge-cafe-wall-oven-repair',`A built-in single wall oven with a smooth matte front and a signature brushed-bronze full-width bar handle and bronze control accents, a large dark-glass door, clean modern proportions`, KITCHEN],
  [25,'ge-cafe-range-hood-repair',`A wall-mounted chimney range hood with a matte-finish canopy and signature brushed-bronze trim and knobs, a wide angled body tapering to a rectangular flue, mesh filters underneath, clean modern proportions`, KITCHEN],
  [26,'ge-cafe-dishwasher-repair',`A built-in dishwasher with a smooth matte front and a signature brushed-bronze tubular bar handle, a flat flush face set into cabinetry, clean contemporary proportions`, KITCHEN],
  [27,'ge-cafe-ice-maker-repair',`An undercounter ice maker with a matte-finish door and a signature brushed-bronze handle, built flush into cabinetry, a clear ice bin softly lit inside, compact proportions`, KITCHEN],
  [28,'ge-cafe-keurig-refrigerator-repair',`A wide French-door refrigerator with a smooth matte front and signature brushed-bronze hardware, a built-in single-serve coffee pod dispenser recessed into the left door above the water dispenser, two upper doors over a freezer drawer, distinctive modern proportions`, KITCHEN],
  [29,'ge-monogram-dishwasher-repair',`A built-in stainless steel dishwasher set flush into cabinetry, a heavy professional tubular bar handle with chunky chrome brackets across a bold flat brushed-stainless front, robust pro-grade proportions`, KITCHEN],
  [30,'ge-monogram-ice-maker-repair',`An undercounter stainless steel ice maker built flush into cabinetry, a bold brushed-metal door with a heavy professional tubular handle, a clear ice bin glowing inside, robust pro-grade proportions`, KITCHEN],
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
console.log('HARD GATE PASS: 30/30 (wave 6 mainstream + GE family, 21:9 jackson-format)');
