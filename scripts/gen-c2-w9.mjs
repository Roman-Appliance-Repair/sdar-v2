// scripts/gen-c2-w9.mjs
// Wave 9 — 30 COMMERCIAL brand heroes (ice machines, walk-ins, on-premises laundry,
// exhaust hoods, pizza ovens, combi/rapid-cook ovens, warewashers) in jackson
// full-bleed format: ultra-wide 21:9, equipment SHARP in the right two-thirds, LEFT
// third softly blurred for the dark text panel, tools + lively commercial setting,
// realistic, no logos. Subjects brand-authentic (model details from each page's
// researched copy): Hoshizaki/Manitowoc/Scotsman/Kold-Draft cubers + Follett nugget,
// Kolpak/Master-Bilt/Nor-Lake/U.S.Cooler walk-ins, Huebsch/Milnor/Speed Queen/UniMac/
// Wascomat/Whirlpool commercial laundry, Gaylord/Greenheck/Halton/Streivor/Vent Master
// canopy hoods, Forno Bravo/Lincoln/Middleby Marshall/Wood Stone pizza ovens, Rational
// combi + TurboChef rapid-cook + Montague convection, Jackson/Meiko/Winterhalter
// warewashers. Output: <TMP>/c2w9/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w9');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The equipment sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const COMM = 'Stainless steel commercial restaurant kitchen with a tile floor and a ventilation hood line above';
const ICE = 'Stainless steel commercial kitchen beverage and prep station with a tile floor';
const BACK = 'Commercial restaurant back-of-house with stainless prep tables and a tile floor';
const LAUNDRY = 'Industrial commercial on-premises laundry room with rows of machines and a tile floor';
const HOODLINE = 'Stainless steel commercial restaurant kitchen cookline directly below the exhaust hood';

const ITEMS = [
  // --- Ice machines ---
  [1,'hoshizaki',`A stainless steel modular commercial cube-ice machine head unit sitting on top of a tall stainless ice storage bin, a clean louvered front panel and a hinged top, robust industrial proportions`, ICE],
  [2,'manitowoc',`A stainless steel modular commercial cube-ice machine mounted on a large stainless ice storage bin, a louvered front grille and a small control panel, robust industrial proportions`, ICE],
  [3,'scotsman',`A stainless steel modular commercial ice machine on a stainless storage bin, a brushed front panel with a status indicator strip, robust industrial proportions`, ICE],
  [4,'follett-ice-machine-repair',`A stainless steel commercial nugget-ice machine and dispenser unit, a tall brushed-stainless cabinet with a dispensing nozzle and a drip tray at the front, robust industrial proportions`, ICE],
  [5,'kold-draft-ice-machine-repair',`A stainless steel commercial large-cube ice machine on a stainless storage bin, a heavy hinged front access panel, robust industrial proportions`, ICE],
  // --- Walk-ins ---
  [6,'kolpak-walk-in-repair',`A stainless steel walk-in cooler with insulated metal wall panels and a heavy latching door with a thick handle and a small viewing window, a temperature display above the door, robust industrial proportions`, BACK],
  [7,'master-bilt-walk-in-repair',`A stainless steel walk-in freezer with insulated metal panels and a heavy latching door with a thick handle, a temperature gauge mounted above the door, robust industrial proportions`, BACK],
  [8,'nor-lake-walk-in-repair',`A stainless steel walk-in cold room with insulated wall panels and a heavy sealed door with a latch handle and a digital temperature readout above, robust industrial proportions`, BACK],
  [9,'us-cooler-walk-in-repair',`A stainless steel walk-in cooler entrance with insulated metal panels, a heavy latching door with a thick handle and a viewing window, robust industrial proportions`, BACK],
  // --- Commercial laundry ---
  [10,'huebsch-commercial-laundry-repair',`A heavy-duty commercial on-premises washer-extractor with a white-and-grey metal cabinet, a big round stainless loading door and a digital control panel, robust industrial proportions`, LAUNDRY],
  [11,'milnor-commercial-laundry-repair',`A large industrial washer-extractor with a heavy white-and-grey metal cabinet, a big round stainless loading door and an industrial control panel, robust heavy-duty proportions`, LAUNDRY],
  [12,'speed-queen-commercial-laundry-repair',`A heavy-duty commercial stacked washer-dryer with a rugged white-and-grey metal cabinet, two round stainless doors and sturdy control panels, robust industrial proportions`, LAUNDRY],
  [13,'unimac-commercial-laundry-repair',`A heavy-duty industrial commercial washer-extractor with a rugged metal cabinet, a large round stainless door and a digital control panel, robust industrial proportions`, LAUNDRY],
  [14,'wascomat-commercial-laundry-repair',`A heavy-duty commercial front-load washing machine with a white metal cabinet, a large round chrome-rimmed door and a control panel, robust industrial proportions`, LAUNDRY],
  [15,'whirlpool-commercial-laundry-repair',`A commercial coin-operated top-load washing machine with a white metal cabinet and a coin-slide console along the top, robust industrial proportions`, LAUNDRY],
  // --- Exhaust hoods ---
  [16,'gaylord-hood-repair',`A long stainless steel commercial exhaust canopy hood mounted above a restaurant cookline, baffle filters along the underside and integrated lighting, robust industrial proportions`, HOODLINE],
  [17,'greenheck-hood-repair',`A stainless steel commercial kitchen exhaust canopy hood spanning above a cookline, rows of baffle filters and recessed lights underneath, robust industrial proportions`, HOODLINE],
  [18,'halton-hood-repair',`A sleek stainless steel commercial kitchen ventilation hood mounted above a cookline, a clean canopy face with baffle filters and bright integrated lighting, robust industrial proportions`, HOODLINE],
  [19,'streivor-hood-repair',`A heavy stainless steel Type I commercial exhaust canopy hood over a restaurant cookline, a wide angled capture face with baffle filters and lighting underneath, robust industrial proportions`, HOODLINE],
  [20,'vent-master-hood-repair',`A long stainless steel commercial kitchen exhaust hood mounted above a cookline, baffle filters and integrated lights along the underside, robust industrial proportions`, HOODLINE],
  // --- Pizza ovens ---
  [21,'forno-bravo-pizza-oven-repair',`A commercial wood-fired pizza oven with a domed refractory chamber and a stainless steel front facade, an arched mouth opening glowing warm inside, robust artisan proportions`, COMM],
  [22,'lincoln-pizza-oven-repair',`A stainless steel commercial conveyor pizza oven, a long horizontal tunnel chamber with a wire conveyor belt running through the front opening and a side control panel, robust industrial proportions`, COMM],
  [23,'middleby-marshall-pizza-oven-repair',`A stainless steel commercial conveyor pizza oven with a long tunnel baking chamber and a wire conveyor belt at the front opening, a side-mounted control panel, robust industrial proportions`, COMM],
  [24,'wood-stone-pizza-oven-repair',`A commercial stone-hearth pizza oven with a wide arched stone deck chamber and a stainless steel facade, a glowing mouth opening, robust artisan proportions`, COMM],
  // --- Combi / rapid-cook / convection ovens ---
  [25,'rational',`A stainless steel commercial combi-oven on a stand, a tall glass-and-steel door with a heavy handle and a touchscreen control panel on the side, robust industrial proportions`, COMM],
  [26,'turbochef-rapid-cook-oven-repair',`A compact stainless steel countertop rapid-cook oven sitting on a stainless prep counter, a front swing door with a digital touch panel above, robust compact proportions`, COMM],
  [27,'montague-oven-repair',`A stainless steel commercial convection oven, a tall cabinet with double glass doors and heavy chrome handles, control knobs on the side panel, robust industrial proportions`, COMM],
  // --- Warewashers ---
  [28,'jackson-dishwasher-repair',`A stainless steel commercial door-type dishwasher with a tall square pull-down hood door and a control panel, sitting between stainless dish tables, robust industrial proportions`, COMM],
  [29,'meiko-dishwasher-repair',`A stainless steel commercial hood-type dishwasher with a boxy pull-down door and a digital touch control panel, set between stainless dish tables, robust industrial proportions`, COMM],
  [30,'winterhalter-dishwasher-repair',`A stainless steel commercial undercounter dishwasher built into a stainless prep line, a square front door with a control panel above, robust compact proportions`, COMM],
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
console.log('HARD GATE PASS: 30/30 (wave 9 — commercial ice/walk-in/laundry/hoods/pizza/ovens/warewash, 21:9 jackson-format)');
