// scripts/gen-c2-w3.mjs
// Wave 3 — 30 premium brand heroes (Wolf, Sub-Zero, Viking, Thermador, Miele, Gaggenau,
// Liebherr) in jackson full-bleed format: ultra-wide 21:9, appliance SHARP in the right
// two-thirds, LEFT third softly blurred for the text panel, tools + lively setting,
// realistic, no logos. Subjects are brand-authentic (web-researched). Output: <TMP>/c2w3/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w3');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const PROHOME = 'High-end SoCal home chef kitchen with stone counters';
const OUTDOOR = 'Premium SoCal backyard outdoor kitchen with natural stone';
const RESTO = 'Busy commercial restaurant kitchen with stainless prep surfaces';
const WINE = 'Elegant SoCal home wine room with warm accent lighting';

const ITEMS = [
  [1,'wolf-stove-repair',`Heavy freestanding professional stainless steel range, four open dual-ring burners on continuous edge-to-edge black cast-iron grates, broad red enamel control knobs in a row across the brushed metal front panel, large glass oven door below, sturdy bar handle`, PROHOME],
  [2,'wolf-wall-oven-repair',`Built-in stainless steel single wall oven recessed into cabinetry, large dark glass door with thick brushed-metal frame and full-width tubular handle, a row of bright red cylindrical control knobs across the upper panel, clean rectangular professional proportions`, PROHOME],
  [3,'wolf-range-hood-repair',`Pro-style brushed stainless steel chimney range hood, wide angled canopy tapering up to a tall rectangular flue duct against the wall, restaurant-grade stainless baffle filters underneath, hemmed welded edges, recessed controls, heavy seamless professional construction`, PROHOME],
  [4,'wolf-microwave-repair',`Sleek built-in stainless steel microwave drawer set flush into cabinetry, smooth brushed metal front face with a long horizontal tubular pull handle and a small recessed control strip, clean minimal undercounter rectangular proportions`, PROHOME],
  [5,'sub-zero-built-in-refrigerator-repair',`A tall narrow floor-to-ceiling brushed-stainless column refrigerator set flush into surrounding wood cabinetry, single seamless door spanning full height, vertical edge-mounted tubular pro handle, crisp rectangular proportions, soft interior LED glow visible at the edges`, PROHOME],
  [6,'sub-zero-outdoor-refrigerator-repair',`A compact stainless-steel undercounter refrigerator built beneath a stone countertop in an outdoor kitchen, single solid door with horizontal bar handle, weather-rated brushed-metal finish, low boxy proportions framed by natural stone masonry and patio surroundings`, OUTDOOR],
  [7,'viking-stove-repair',`Commercial-grade freestanding stainless steel range, boxy heavy proportions, four exposed open gas burners under continuous matte-black porcelain cast-iron grates, a row of bold cylindrical metal control knobs across the front, full-width lower oven with a thick tubular pro handle`, PROHOME],
  [8,'viking-built-in-refrigerator-repair',`Tall floor-to-ceiling built-in stainless steel column refrigerator, full-height flush flat door panel, vertical brushed-steel tubular pro handle running nearly the entire height with chunky chrome mounting brackets, clean seamless flat-front commercial styling, minimal trim`, PROHOME],
  [9,'viking-wall-oven-repair',`Built-in stainless steel single wall oven recessed into cabinetry, large rectangular dark tinted glass window, broad horizontal brushed-steel pro handle on chrome brackets, black control panel along the top with electronic display, squared heavy-gauge professional framing`, PROHOME],
  [10,'viking-range-hood-repair',`Pro-style wall-mounted stainless steel chimney range hood, wide angled canopy tapering to a tall rectangular flue duct above, heavy-gauge brushed steel, exposed commercial baffle filters beneath, slim recessed lighting strip, clean seamless industrial proportions`, PROHOME],
  [11,'viking-wine-cooler-repair',`Undercounter stainless steel wine cellar, full-front dual-pane tinted glass door framed in brushed steel with a slim vertical tubular handle, interior rows of horizontal maple wood-front racks softly LED-lit, compact built-in cabinet proportions`, WINE],
  [12,'thermador-stove-repair',`Hefty freestanding professional gas range in brushed stainless steel, raised six-pointed star-shaped pedestal burners on a smooth porcelain top, heavy edge-to-edge cast grates, tall backguard, a row of chunky cylindrical metal control knobs above a wide glass oven door`, PROHOME],
  [13,'thermador-built-in-refrigerator-repair',`Tall full-height built-in stainless steel column refrigerator set flush within cabinetry, a single seamless brushed-metal door spanning floor to ceiling, fronted by a long bold tubular professional-style handle, narrow even gaps, minimal lines, imposing vertical proportions`, PROHOME],
  [14,'thermador-wall-oven-repair',`Built-in stainless steel single wall oven recessed in cabinetry, large glass door with a heavy horizontal pro handle, interior glowing with warm theater lighting, framed by a control panel with bright metallic blue cylindrical knobs and a slim display`, PROHOME],
  [15,'thermador-range-hood-repair',`Wall-mounted professional stainless steel range hood with a wide flat canopy tapering upward into a slim pyramid chimney flue, brushed-metal surfaces, recessed white LED lighting underneath, framed mesh baffle filters, clean minimalist contemporary lines`, PROHOME],
  [16,'thermador-wine-cooler-repair',`Undercounter stainless steel wine reserve with a framed UV-tinted glass door and slim pro handle, revealing rows of dark hardwood dowel shelves cradling bottles, bathed in soft adjustable LED accent lighting, compact built-in proportions`, WINE],
  [17,'miele-refrigerator-repair',`Tall freestanding bottom-freezer fridge in brushed stainless steel, counter-depth proportions, two flush full-height upper doors above a single pull-out freezer drawer, slim recessed vertical bar handles, crisp clean edges, understated minimalist German styling`, PROHOME],
  [18,'miele-built-in-refrigerator-repair',`Floor-to-ceiling integrated column refrigerator, perfectly flush with surrounding cabinetry, smooth handleless push-to-open front in seamless stainless, ultra-tall slim proportions, no visible seams or controls, bright interior LED strips glowing within`, PROHOME],
  [19,'miele-wall-oven-repair',`Built-in single wall oven set into cabinetry, large dark full-glass door framed in stainless, slim horizontal high-resolution touch control strip across the top, minimal flush front, soft-close handle, clean rectangular minimalist proportions`, PROHOME],
  [20,'miele-range-hood-repair',`Wall-mounted canopy range hood in brushed stainless steel with a wide slanted tempered-glass visor panel angled outward, slim profile, smooth seamless sealed surface, soft dimmable ambient under-lighting, discreet touch controls, sleek minimalist geometry`, PROHOME],
  [21,'miele-wine-cooler-repair',`Built-in undercounter wine conditioning unit with a tinted dark UV-protective glass door framed in slim stainless, handleless push-to-open flush front, horizontal beechwood bottle racks inside, bottles softly lit by warm amber LED glow, refined and understated`, WINE],
  [22,'miele-professional-dishwasher-repair',`Heavy-duty commercial undercounter dishwasher fully clad in industrial brushed stainless steel, compact boxy footprint, robust flush door with sturdy recessed handle, slim digital control panel, rugged utilitarian lab-grade build, clean rivetless surfaces`, RESTO],
  [23,'gaggenau-oven-repair',`A built-in oven with a flush full-surface deep anthracite smoked-glass door framed in brushed stainless steel, a single large round solid metal rotary control knob beside a slim dark display strip, handleless minimalist front, museum-grade architectural proportions`, PROHOME],
  [24,'gaggenau-wall-oven-repair',`A tall built-in wall oven set into cabinetry, dark tinted glass door bordered by brushed stainless steel, a slim recessed horizontal control panel with a small display and one round metal dial, clean rectangular architectural lines, heavy premium build`, PROHOME],
  [25,'gaggenau-stove-repair',`A professional stainless-steel cooktop with heavy continuous cast-iron grates over brass multi-ring burners, a row of front-mounted solid metal control knobs, precise modular layout, brushed metal surface, robust commercial-grade industrial proportions`, PROHOME],
  [26,'gaggenau-range-hood-repair',`A minimalist wall-mounted stainless-steel range hood, slim flat rectangular canopy with angled brushed-metal baffle filters underneath, soft warm white LED glow along the edge, clean architectural lines, understated premium engineered form`, PROHOME],
  [27,'gaggenau-wine-cooler-repair',`A tall built-in wine climate cabinet behind a dark tinted glass door framed in brushed stainless steel, horizontal oak and anthracite pull-out shelves cradling angled bottles, warm glare-free amber interior spotlighting, dramatic museum-grade illuminated showcase`, WINE],
  [28,'liebherr-built-in-refrigerator-repair',`A tall slim built-in column refrigerator integrated flush into minimalist European cabinetry, single full-height door with smooth brushed-steel face, recessed slim handle, clean straight lines, bright white softly-lit interior peeking through the seam`, PROHOME],
  [29,'liebherr-refrigerator-repair',`A freestanding bottom-freezer refrigerator with clean European lines, smooth stainless face, tall upper fridge door above a pull-out lower freezer drawer, slim vertical recessed handles, rounded edges, understated minimalist proportions standing alone`, PROHOME],
  [30,'liebherr-wine-cooler-repair',`A tall slender wine cabinet with a full-length tinted glass door framed in dark metal, rows of horizontal solid-beechwood shelves cradling bottles on their sides, warm dimmable LED interior lighting glowing amber, sleek vertical proportions`, WINE],
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
console.log('HARD GATE PASS: 30/30 (wave 3 premium, 21:9 jackson-format)');
