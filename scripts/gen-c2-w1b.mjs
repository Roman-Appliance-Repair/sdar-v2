// scripts/gen-c2-w1b.mjs
// Re-gen 30 brand heroes (the first 30 ex-square pages) in jackson full-bleed format:
// ultra-wide 21:9, appliance SHARP in the right two-thirds, LEFT third softly blurred
// (the dark text panel overlays it), tools + lively setting, realistic, no logos.
// Subjects are brand-authentic (web-researched design cues). Output: <TMP>/c2w1b/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w1b');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const HOME = 'Premium SoCal home kitchen';
const PROHOME = 'High-end SoCal home chef kitchen with stone counters';
const LAUNDRY = 'Clean SoCal home laundry room';
const RESTO = 'Busy commercial restaurant kitchen with stainless prep surfaces';

// [N, slug, brand-authentic subject (web-researched), setting]
const ITEMS = [
  [1,'accurex-hood-repair','Large brushed stainless steel wall-mounted canopy hood with crisp standing-seam panels and a sloped front lip, angled baffle grease filters in a row, integrated linear lights, suspended above a stainless commercial cookline', RESTO],
  [2,'adc-commercial-dryer-repair','Tall boxy industrial tumble dryer with smooth powder-coated steel cabinet, a large round stainless-rimmed glass door revealing the drum, recessed top-mounted control panel with knobs and buttons, heavy-duty front-access look', 'Commercial laundry facility'],
  [3,'aga-range-hood-repair','Freestanding decorative range hood with a commanding arched trapezoidal canopy in glossy cream vitreous enamel, polished chrome banding trim, gently curved sculpted form, soft LED underlighting, premium farmhouse-kitchen presence', 'Charming SoCal farmhouse-style home kitchen'],
  [4,'aga-stove-repair','Heavy cast-iron heat-storage range in deep glossy cream enamel, rounded compact silhouette, two domed polished chrome insulated hotplate covers on top, multiple stout oven doors with chrome handles, solid timeless rounded proportions', 'Charming SoCal country-style home kitchen'],
  [5,'aht-cooling-systems-refrigeration-repair','Sleek freestanding glass-lidded chest display freezer, linear low-profile body in white and silver aluminum, curved sliding glass tops revealing frosted product, brightly illuminated interior, clean modern supermarket merchandiser styling', 'Supermarket refrigeration aisle'],
  [6,'alto-shaam-oven-repair','Floor-standing stainless steel commercial combi oven on a tubular stand, brushed metal body, right-hinged door with large viewing window, digital touchscreen control panel on the side, boxy professional proportions', RESTO],
  [7,'amana-dishwasher-repair','A 24-inch built-in dishwasher with a flat brushed stainless steel front panel, a slim recessed pocket handle along the top edge, and a clean front-control row of simple buttons set into the slender top console, no protruding knobs', HOME],
  [8,'amana-refrigerator-repair','A freestanding glossy white top-freezer refrigerator, tall narrow box proportions, a small upper freezer door above a larger lower door, slim vertical recessed pocket handle grips molded into the right edges, flat unadorned panels, rounded subtle edges', HOME],
  [9,'amana-wall-oven-repair','A built-in single electric wall oven in brushed stainless steel, large rectangular glass door with full-width black glass and a straight horizontal tubular bar handle, slim top control strip with simple touch buttons and a small digital readout', HOME],
  [10,'american-range-repair','A heavy-duty commercial gas range in raw stainless steel, six open cast-iron burners under thick square black grates, chunky red knobs in a row across the front, a tall backsplash, deep front ledge, sturdy adjustable steel legs', RESTO],
  [11,'asko-dishwasher-repair','A minimalist 24-inch stainless steel dishwasher, perfectly flat seamless front with no visible buttons, a clean slim integrated T-bar tubular handle spanning the top, understated Scandinavian lines, brushed silver finish, hidden top-edge controls', HOME],
  [12,'asko-dryer-repair','A compact front-load tumble dryer in brushed stainless steel, a large round porthole glass door with chrome rim, a top control panel featuring one rotary program dial beside a small digital display and a tidy row of minimalist buttons', LAUNDRY],
  [13,'asko-washer-repair','A minimalist Scandinavian front-load washing machine in clean matte white, a perfectly square cabinet with a large circular chrome-rimmed glass porthole door, a single round program selector dial, and a slim row of discreet flush buttons above', LAUNDRY],
  [14,'avantco-ice-machine-repair','A tall two-piece commercial ice machine: a boxy brushed stainless steel ice-maker head with louvered front vent panel seated atop a wider stainless storage bin with a hinged insulated lid, standing on four adjustable round legs', RESTO],
  [15,'bakers-pride-pizza-oven-repair','A heavy-duty commercial double-stacked deck pizza oven in brushed stainless steel, two independent baking chambers with wide hinged drop-down doors, chunky tubular handles, dial thermostats and damper controls, mounted on sturdy tubular legs', RESTO],
  [16,'beko-dishwasher-repair','A sleek 24-inch built-in dishwasher with a flat fingerprint-resistant brushed stainless front, a recessed pocket handle along the top edge, and a slim row of visible function buttons with small indicator lights on the upper panel', HOME],
  [17,'bertazzoni-dishwasher-repair','A built-in dishwasher with a seamless full-height cabinetry-matched front panel, a substantial rounded tubular metal bar handle spanning the width, concealed top-edge controls, a clean integrated flush look harmonizing with surrounding kitchen units', HOME],
  [18,'bertazzoni-oven-repair','A built-in single wall oven in brushed stainless steel with a large square glass viewing window, a thick full-width tubular bar handle, and signature heavy round metal control knobs with deep accent rings flanking a central display', HOME],
  [19,'bertazzoni-range-hood-repair','A wall-mounted brushed stainless steel chimney hood: a wide angled trapezoidal canopy tapering up into a slim rectangular telescopic duct cover against the wall, smooth seamless metal panels, recessed LED light strip and exposed baffle filters underneath', HOME],
  [20,'bertazzoni-refrigerator-repair','A tall counter-depth French-door refrigerator with two narrow upper doors over a bottom freezer drawer, smooth seamless stainless steel panels, long full-height tubular vertical bar handles, clean squared edges and a sophisticated minimalist flush face', HOME],
  [21,'bertazzoni-stove-repair','A freestanding pro-style range in glossy vivid orange-yellow automotive lacquer, heavy cast-iron grates over brass burners, a row of large beveled metal control knobs across the front, a chunky tubular handle and a low rear backguard', PROHOME],
  [22,'bertazzoni-wall-oven-repair','A built-in single electric wall oven set flush in cabinetry, brushed stainless steel front, a large glass door with a full-width tubular handle, a small touch display flanked by two round metal control knobs', HOME],
  [23,'beverage-air','A commercial under-counter back-bar cooler in black-painted steel, two wide glass-front swing doors framed in metal showing interior shelving, bright LED-lit interior, recessed pull handles and short legs on a low rectangular box form', 'Behind a restaurant bar'],
  [24,'big-chill-refrigerator-repair','A retro single-door refrigerator with a rounded stamped-metal body in glossy pastel buttercup yellow, gleaming chrome trim strips, a vintage chrome pivoting latch handle, softly curved edges and slim polished metal legs', 'Bright retro-style SoCal home kitchen'],
  [25,'bki-rotisserie-repair','A tall floor-standing commercial rotisserie, brushed stainless cabinet with curved insulated glass doors front and back, two glowing stacked decks of golden rotating chickens skewered on horizontal spits, warm interior light, touchscreen panel below', 'Commercial deli kitchen'],
  [26,'blodgett-oven-repair','Two heavy stainless commercial convection ovens stacked into one tall unit, each with a full-width door, large viewing window, sturdy chrome wire racks inside, dial thermostats and timer knobs on the side, boxy industrial proportions on short legs', RESTO],
  [27,'bluestar-range-hood-repair','A large pro-style stainless steel range hood, tall chimney flue tapering to a wide canted canopy, seamless welded corners, a riveted accent strip, recessed dishwasher-safe baffle filters underneath, discreet push-button controls, heavy-gauge industrial proportions', PROHOME],
  [28,'bluestar-refrigerator-repair','A tall built-in counter-depth French-door refrigerator with a bold painted cobalt-blue exterior, full-length tubular metal handles in brushed brass, clean flush panels, glossy commercial finish, sleek imposing floor-to-ceiling proportions', PROHOME],
  [29,'bluestar-stove-repair','A heavy professional freestanding range in vivid cobalt blue, black porcelain cast-iron continuous grates over big open star burners, a row of bold brass-trimmed control knobs on a one-piece panel, a tall framed oven door window, sturdy commercial proportions', PROHOME],
  [30,'bluestar-wall-oven-repair','A built-in commercial-grade stainless steel wall oven set into cabinetry, large rectangular tempered-glass door with full-width tubular handle, brass-accented control knobs and digital display along the top, clean brushed-metal face, robust squared proportions', PROHOME],
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
console.log('HARD GATE PASS: 30/30 (21:9 jackson-format, brand-authentic)');
