// scripts/gen-c2-w2c.mjs
// Re-gen the SECOND 40 ex-square brand heroes in jackson full-bleed format:
// ultra-wide 21:9, appliance SHARP in the right two-thirds, LEFT third softly blurred,
// tools + lively setting, realistic, no logos. Subjects are brand-authentic (web-researched).
// Output: <TMP>/c2w2c/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w2c');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const HOME = 'Premium SoCal home kitchen';
const PROHOME = 'High-end SoCal home chef kitchen with stone counters';
const LAUNDRY = 'Clean SoCal home laundry room';
const RESTO = 'Busy commercial restaurant kitchen with stainless prep surfaces';
const OUTDOOR = 'Premium SoCal backyard outdoor kitchen with stone patio';
const COMM_LAUNDRY = 'Commercial laundry facility';

// [N, slug, brand-authentic subject (web-researched), setting]
const ITEMS = [
  [1,'bosch-microwave-repair',`A sleek built-in stainless steel microwave set flush into upper cabinetry, with a brushed metal front, a wide drop-down hinged door framed by a slim handle bar, and a narrow right-side control strip with a glowing digital display and flush touch buttons`, HOME],
  [2,'bosch-range-hood-repair',`A wall-mounted stainless steel chimney range hood with a sloped pyramid-shaped canopy tapering up into a slim rectangular flue duct against the wall, brushed metal finish, a wide angled lower intake with mesh filter panels, and small recessed lights underneath`, HOME],
  [3,'broan-range-hood-repair',`A compact stainless steel under-cabinet range hood, a low rectangular brushed-metal box tucked beneath upper cabinets, with gently rounded front edges, a slim recessed control with rocker buttons on the underside, mesh filter panels, and integrated downward task lighting`, HOME],
  [4,'bull-grill-repair',`A built-in stainless steel outdoor gas grill set into a masonry island, with a seamless double-walled rounded hood, heavy stainless rod cooking grates visible inside, a row of round zinc control knobs across the front face, and a round dial thermometer on the lid`, OUTDOOR],
  [5,'bunn-slushie-machine-repair',`A countertop commercial frozen-drink machine with two tall clear cylindrical bowls side by side showing swirling colored slush, illuminated lid merchandisers glowing on top, a stainless-and-black body below, rotating internal augers, and chrome dispensing spouts with push levers at front`, 'Commercial cafe / convenience-store counter'],
  [6,'capital-bbq-grill-repair',`A wide professional built-in stainless steel outdoor gas grill in an island, with a smooth spring-assisted dome hood, thick reversible channel grates, a polished control panel of large chrome die-cast knobs with indicator lights, illuminated switches, and under-hood halogen lighting`, OUTDOOR],
  [7,'captiveaire',`A large polished stainless steel canopy ventilation hood spanning a full commercial cookline, its angled double-wall front sloping inward, rows of slotted baffle filters set into a deep grease trough, recessed underside lights glowing over ranges and fryers below`, RESTO],
  [8,'captiveaire-hood-repair',`A wall-mounted brushed stainless steel exhaust canopy with a sloped aerodynamic front face, welded seamless corners, a row of angled metal baffle filters, integrated under-lights, and a rear standoff against the kitchen wall, boxy industrial proportions`, RESTO],
  [9,'champion-dishwasher-repair',`A boxy floor-standing stainless steel commercial dishmachine with a tall vertical pull-down door, square chamber opening, control dial and buttons on the front panel, sturdy adjustable legs, and a rack guide rail, heavy industrial proportions`, RESTO],
  [10,'cma-dishmachines-repair',`A compact square stainless steel undercounter dishmachine, brushed metal front with a lift handle on the drop-down door, simple knob and toggle controls on a small front panel, four adjustable feet, cube-like proportions sized to fit beneath a counter`, RESTO],
  [11,'cove-dishwasher-repair',`A sleek 24-inch built-in dishwasher with a flush brushed stainless front, slim tubular bar handle, hidden top-edge controls revealed only when the door tilts open, a discreet floor-projected status light, clean minimalist seamless cabinetry-integrated proportions`, PROHOME],
  [12,'coyote-grill-repair',`A built-in stainless steel outdoor gas grill with a rounded double-wall lift hood, sturdy tubular handle, a row of round backlit control knobs on the brushed front panel, heavy laser-cut rod cooking grates, wide rectangular firebox proportions`, OUTDOOR],
  [13,'dacor-dishwasher-repair',`A 24-inch built-in dishwasher with a seamless dark graphite-stainless front panel, a slim recessed top handle pocket, hidden top-edge controls, and a flush integrated face with crisp minimal lines sitting between cabinetry`, PROHOME],
  [14,'dacor-microwave-repair',`A wide horizontal built-in drawer-style microwave in dark graphite-stainless steel, completely handleless with a smooth flat push-to-open face, a thin discreet status strip, and clean flush proportions slotted into cabinetry`, HOME],
  [15,'dacor-oven-repair',`A 30-inch built-in single wall oven in dark graphite-stainless steel, a large dark glass door with a slim full-width tubular handle, a tilting black glass touch panel above, and flush minimalist framing`, PROHOME],
  [16,'dacor-range-hood-repair',`A wide wall-mounted chimney range hood with a flat box-shaped canopy in dark graphite-stainless steel, a tapering rectangular flue stack rising to the ceiling, a glass touch strip, and slim LED edge lighting underneath`, PROHOME],
  [17,'dacor-refrigerator-repair',`A tall wide built-in 48-inch refrigerator in dark graphite-stainless steel, twin upper French doors over two stacked lower freezer drawers, slim full-length vertical bar handles, and a flush counter-depth columnar profile`, PROHOME],
  [18,'dexter-commercial-laundry-repair',`A heavy industrial front-load washing machine, boxy stainless cabinet, large round glass porthole door with thick chrome rim, prominent red emergency-stop button, payment slot, and a small digital cycle display on a rugged sloped top control panel`, COMM_LAUNDRY],
  [19,'electrolux-dishwasher-repair',`A built-in 24-inch dishwasher with seamless brushed stainless front panel, recessed pocket handle along the top edge, hidden top-mounted touch controls on the door upper lip, clean flat rectangular face, minimal seams, modern flush cabinetry fit`, HOME],
  [20,'electrolux-dryer-repair',`A front-load dryer with gently curved glossy white cabinet, oversized round chrome-rimmed glass door, wide upper control panel featuring a central rotary dial flanked by softly lit touch buttons, raised on a tall matching storage-drawer pedestal`, LAUNDRY],
  [21,'electrolux-oven-repair',`A built-in stainless wall oven, large dark tinted glass door with full-width tubular bar handle, sleek control strip across the top with backlit touch buttons and rotary knobs, clean flat brushed-metal frame, rectangular recessed cavity`, HOME],
  [22,'electrolux-professional-dishwasher-repair',`A commercial hood-type pass-through dishmachine, heavy brushed stainless steel box with a tall lift-up square hood, open pass-through racks on a slatted shelf, angled corner control panel with green accent buttons, industrial bolted legs`, RESTO],
  [23,'electrolux-refrigerator-repair',`A counter-depth French-door refrigerator with brushed stainless steel finish, two top doors over a wide bottom freezer drawer, slim full-length vertical bar handles, flush flat fronts, subtle recessed seams, tall modern proportions`, HOME],
  [24,'electrolux-wall-oven-repair',`A large built-in electric wall oven set flush into cabinetry, brushed stainless steel face with a wide glass door, full-width horizontal tubular handle, and a glowing touch-control panel strip above the door showing a digital readout`, HOME],
  [25,'electrolux-washer-repair',`A modern front-loading washing machine in a sleek titanium-gray finish, large round chrome-rimmed glass porthole door, sloped angular console with backlit touch buttons and a circular dial, clean rectangular cabinet on a low recessed base`, LAUNDRY],
  [26,'fagor-commercial-laundry-repair',`A heavy boxy commercial washer-extractor in industrial brushed stainless steel, large round bolt-rimmed front loading door with thick glass porthole, top-mounted programmable control panel with digital display, mounted on a sturdy reinforced base`, COMM_LAUNDRY],
  [27,'fagor-dishwasher-repair',`A compact square commercial undercounter dishmachine in heavy brushed stainless steel, tall hinged double-skin front door with a deep recessed grip, simple control panel with illuminated buttons and dials, sitting on stubby adjustable legs`, RESTO],
  [28,'fisher-paykel-dishwasher-repair',`Two stacked horizontal pull-out dishwasher drawers in brushed stainless steel, each fronted by a slim full-width tubular handle and a narrow top fascia with touch controls, forming one clean integrated minimalist column`, HOME],
  [29,'fisher-paykel-oven-repair',`A built-in single wall oven with a dark full-glass door framed in brushed stainless steel, slim full-width handle, and a top control band combining a small digital display with precise round stainless rotary dials`, HOME],
  [30,'fisher-paykel-range-hood-repair',`A wall-mounted kitchen exhaust hood with a slim rectangular box canopy in brushed silver metal and dark glass accents, tapering up into a tall straight rectangular flue duct against the wall, clean minimalist edges, flat touch-control strip, recessed LED lighting underneath`, HOME],
  [31,'fisher-paykel-refrigerator-repair',`A tall counter-depth two-door French-door refrigerator in brushed silver metal, doors meeting at the center above a wide pull-out bottom freezer drawer, flat flush panels with slim vertical brushed metal bar handles, streamlined seamless contemporary look`, HOME],
  [32,'frigidaire-dishwasher-repair',`A built-in front-control dishwasher in brushed silver metal, full flat rectangular door with a horizontal control strip across the top edge, a clean recessed pocket-style handle, smooth uninterrupted panel, standard 24-inch under-counter proportions, modern reflective finish`, HOME],
  [33,'ge-dishwasher-repair',`A built-in dishwasher in brushed silver metal with fully hidden top-mounted controls, presenting one smooth uninterrupted flat door panel, a slim horizontal recessed pocket handle near the top, clean seamless integrated look, standard 24-inch under-counter proportions`, HOME],
  [34,'kitchenaid-dishwasher-repair',`A premium built-in dishwasher in dark fingerprint-resistant graphite-stainless finish, flat door featuring a small rectangular glass viewing window glowing with warm interior light, a robust full-width horizontal towel-bar handle, integrated top controls, sturdy substantial proportions`, HOME],
  [35,'lg-dishwasher-repair',`A tall built-in dishwasher with smooth brushed-steel front door, no visible buttons, an integrated recessed pocket handle running across the top edge, clean uninterrupted vertical lines, and a tall roomy interior tub visible when open, modern minimalist proportions`, HOME],
  [36,'lg-microwave-repair',`A sleek over-the-range microwave in brushed silver-gray steel, wide tinted viewing window, slim integrated pocket handle along the door right edge, flat smooth-glass touch control strip glowing softly, vented underside, low-profile rectangular proportions mounted above a cooktop`, HOME],
  [37,'maytag-dishwasher-repair',`A rugged built-in dishwasher with a heavy brushed-steel front door, a thick cylindrical towel-bar handle spanning the width, a flat front-mounted control row with buttons near the top, squared sturdy proportions, and a tough industrial appearance`, HOME],
  [38,'samsung-dishwasher-repair',`A modern built-in dishwasher with an ultra-flat fingerprint-resistant steel door, a thin flush flat-bar handle across the top, hidden top controls leaving the front seamless and smudge-free, crisp minimal lines, contemporary sleek proportions`, HOME],
  [39,'samsung-microwave-repair',`A contemporary over-the-range microwave with a seamless black-glass front blending door and control panel, large edge-to-edge tinted window, slim recessed handle, glowing glass touch controls, soft LED underlighting, sleek flat rectangular form above a range`, HOME],
  [40,'whirlpool-dishwasher-repair',`A built-in dishwasher with a brushed-steel front, integrated recessed pocket handle along the top edge, concealed hidden controls for clean uninterrupted front lines, a small blue cycle-status indicator light low on the door, balanced practical proportions`, HOME],
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
console.log(`\n=== GEN SUMMARY: ${present.length}/40 valid PNG in ${OUTDIR} ===`);
if (failed.length) { console.error('FAILED:\n' + failed.join('\n')); process.exit(1); }
console.log('HARD GATE PASS: 40/40 (21:9 jackson-format, brand-authentic)');
