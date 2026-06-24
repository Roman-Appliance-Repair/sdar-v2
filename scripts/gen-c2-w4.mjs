// scripts/gen-c2-w4.mjs
// Wave 4 — 30 premium/luxury + commercial brand heroes in jackson full-bleed format:
// ultra-wide 21:9, appliance SHARP in the right two-thirds, LEFT third softly blurred
// for the text panel, tools + lively setting, realistic, no logos. Subjects brand-authentic
// (web-researched: Cafe brushed-bronze hardware, Smeg FAB retro pastel, ILVE colored enamel +
// brass, La Cornue brass banding, True Residential round dial gauge, JennAir obsidian, Monogram
// pro handles). Output: <TMP>/c2w4/{N}_{slug}.png

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const OUTDIR = path.join(os.tmpdir(), 'c2w4');
fs.mkdirSync(OUTDIR, { recursive: true });

const STYLE = (setting) => `Ultra-wide 21:9 cinematic hero photograph, photorealistic documentary style, natural realistic lighting, NOT AI-glossy, no HDR sheen. The appliance sits in the RIGHT two-thirds of the frame, fully in frame and in crisp sharp focus, shown complete with breathing room around it. The LEFT third of the frame is a soft, out-of-focus blurred background (shallow depth of field), calm and uncluttered so a dark text panel can be laid over it. ${setting}, bright daylight, lively believable working environment. An open tool bag with a few hand tools resting on the floor nearby. ONE single unit only, no second unit or adjacent fronts. No people, no logos, no text, no brand badges, no readable labels. 2K.`;

const PROHOME = 'High-end SoCal home chef kitchen with stone counters';
const OUTDOOR = 'Premium SoCal backyard outdoor kitchen with natural stone';
const RESTO = 'Busy commercial restaurant kitchen with stainless prep surfaces';

const ITEMS = [
  [1,'wolf-pizza-oven-repair',`Built-in stainless steel convection oven recessed into cabinetry, large dark glass door with a thick brushed-metal frame and a full-width tubular handle, a row of bright red cylindrical control knobs across the upper panel, interior glowing warm with a round ceramic pizza stone on the rack, sturdy professional rectangular proportions`, PROHOME],
  [2,'gaggenau-dishwasher-repair',`Fully-integrated built-in dishwasher with a flush deep anthracite stainless-steel front panel set seamlessly into cabinetry, a slim recessed handle channel and a single round solid metal control dial, minimalist handleless architectural face, heavy premium build`, PROHOME],
  [3,'miele-oven-repair',`Built-in single wall oven set into cabinetry, large dark full-glass door framed in brushed stainless steel, a slim horizontal high-resolution touch control strip across the top with a small display, clean flush minimalist front, soft-close bar handle, precise rectangular proportions`, PROHOME],
  [4,'miele-microwave-repair',`Built-in stainless steel speed-microwave oven set flush into upper cabinetry, smooth handleless push-to-open dark-glass front, a slim horizontal touch control strip, compact rectangular minimalist German proportions`, PROHOME],
  [5,'miele-ice-maker-repair',`Tall slim built-in stainless steel standalone ice maker integrated flush into cabinetry, handleless dark-glass push-to-open door, narrow column proportions, soft blue-white interior LED glow over a clear ice bin, understated minimalist styling`, PROHOME],
  [6,'thermador-cooktop-repair',`Professional stainless-steel gas cooktop with raised six-pointed star-shaped pedestal burners on a smooth porcelain surface, heavy continuous cast-iron grates, a row of chunky cylindrical metal control knobs across the front edge, precise modular pro-grade layout`, PROHOME],
  [7,'thermador-microwave-repair',`Built-in stainless steel microwave drawer set flush beneath the counter, smooth brushed-metal front face with a long horizontal tubular pull handle and a recessed touch control strip, clean undercounter rectangular proportions`, PROHOME],
  [8,'thermador-ice-maker-repair',`Tall slim built-in stainless steel column ice maker recessed flush into cabinetry, brushed-metal door with a slim vertical tubular handle, a clear ice bin glowing soft blue-white inside, narrow architectural proportions`, PROHOME],
  [9,'viking-outdoor-refrigerator-repair',`A compact stainless-steel undercounter refrigerator built beneath a stone countertop in an outdoor kitchen, full-front solid door with a bold tubular pro handle, heavy weather-rated 304 brushed-stainless finish, low boxy commercial-grade proportions framed by natural stone masonry and patio surroundings`, OUTDOOR],
  [10,'viking-ice-maker-repair',`Undercounter stainless steel ice maker built flush into cabinetry, full-front brushed-metal door with a slim tubular pro handle, heavy professional-grade construction, a clear ice bin glowing softly inside, compact boxy proportions`, PROHOME],
  [11,'viking-trash-compactor-repair',`Undercounter stainless steel trash compactor built flush into cabinetry, smooth brushed-metal drawer front with a horizontal tubular pro handle, heavy commercial-grade build, clean rectangular undercounter proportions`, PROHOME],
  [12,'ge-monogram-refrigerator-repair',`A wide built-in French-door stainless steel refrigerator set flush into cabinetry, two upper doors above a lower freezer drawer, heavy professional tubular handles with chunky chrome end-caps, a bold flat stainless front with a thick framed edge`, PROHOME],
  [13,'ge-monogram-built-in-refrigerator-repair',`A tall full-height built-in stainless steel column refrigerator recessed flush into cabinetry, a single seamless flat door, a long bold professional tubular handle on substantial chrome brackets, imposing vertical proportions, soft interior LED glow at the seam`, PROHOME],
  [14,'ge-monogram-range-hood-repair',`A pro-style wall-mounted stainless steel chimney range hood, a wide angled canopy tapering to a tall rectangular flue duct, heavy-gauge brushed steel, exposed commercial baffle filters underneath, bold framed professional construction`, PROHOME],
  [15,'ge-monogram-stove-repair',`A heavy professional freestanding stainless steel range, four sealed gas burners under continuous matte-black cast-iron grates, a row of bold cylindrical metal control knobs across the front, a full-width glass oven door with a thick tubular pro handle, boxy commercial-grade proportions`, PROHOME],
  [16,'ge-cafe-refrigerator-repair',`A wide French-door refrigerator with a smooth matte-finish front and signature brushed-bronze tubular hardware and hinges, two upper doors above a freezer drawer, clean modern proportions, the warm brushed-bronze handles contrasting the soft matte face`, PROHOME],
  [17,'ge-cafe-stove-repair',`A freestanding range with a smooth matte front and signature brushed-bronze cylindrical control knobs and a matching brushed-bronze bar handle on the glass oven door, sealed gas burners under cast-iron grates, clean contemporary proportions`, PROHOME],
  [18,'signature-kitchen-suite-refrigerator-repair',`A tall full-height built-in stainless steel column refrigerator integrated flush into cabinetry, a single seamless brushed-metal door with a slim recessed pro handle, soft interior LED glow, clean precise architectural proportions`, PROHOME],
  [19,'signature-kitchen-suite-stove-repair',`A professional freestanding stainless steel range, sealed gas burners on continuous cast-iron grates, a row of solid metal control knobs across the front, a full glass oven door with a heavy tubular handle, precise modern pro-grade proportions`, PROHOME],
  [20,'ilve-stove-repair',`A grand Italian freestanding range with a richly colored deep-burgundy enamel front and polished brass trim, brass knobs and a brass bullnose, multiple brass-ringed gas burners on heavy cast-iron grates, a wide glass oven door with a brass bar handle, ornate luxury proportions`, PROHOME],
  [21,'la-cornue-range-hood-repair',`An ornate French range hood with a hand-finished colored enamel body and polished brass banding and rivets, a wide gently rounded canopy, luxurious bespoke craftsmanship, a statement centerpiece form`, PROHOME],
  [22,'fisher-paykel-stove-repair',`A freestanding stainless steel range with clean minimalist styling, sealed gas burners on edge-to-edge cast-iron grates, a row of slim cylindrical control knobs across the front, a wide glass oven door with a full-width tubular handle, understated modern proportions`, PROHOME],
  [23,'smeg-refrigerator-repair',`An iconic retro-styled freestanding refrigerator with a rounded body, a glossy pastel cream enamel finish, a single full-height door, a slim chrome tubular handle, and bright chrome trim along the base, playful mid-century proportions standing alone`, PROHOME],
  [24,'jennair-stove-repair',`A professional freestanding range in dark obsidian-toned stainless steel, sealed gas burners under continuous matte-black grates, a row of bold metal control knobs across a dark front panel, a full glass oven door with a heavy tubular handle, sleek contemporary luxury proportions`, PROHOME],
  [25,'hobart-dishwasher-repair',`A heavy-duty commercial door-type dishwasher fully clad in industrial brushed stainless steel, a tall square hood door lifted on rails over a corner wash chamber, robust controls and rack rails, rugged utilitarian build mounted on a stainless table`, RESTO],
  [26,'rational-combi-oven-repair',`A commercial combi-steam oven in brushed stainless steel, a tall glass door with a heavy lever handle, a bright touchscreen control panel on the right side, multiple internal wire-rack levels visible through the glass, robust restaurant-grade construction`, RESTO],
  [27,'hoshizaki-ice-machine-repair',`A modular commercial ice machine head unit in brushed stainless steel seated atop a large stainless storage bin with a hinged access door, boxy industrial proportions, louvered side vents, rugged restaurant-grade build`, RESTO],
  [28,'scotsman-ice-machine-repair',`A modular commercial ice machine in brushed stainless steel mounted on a tall stainless storage bin with a wide front access door, clean louvered panels, boxy industrial proportions, robust foodservice-grade construction`, RESTO],
  [29,'manitowoc-ice-machine-repair',`A modular commercial ice machine head in brushed stainless steel seated on a large stainless ice storage bin, a hinged scoop door, vented side panels, sturdy boxy industrial proportions, heavy restaurant-grade build`, RESTO],
  [30,'true-residential-refrigerator-repair',`A bold commercial-style residential column refrigerator with a heavy flat stainless steel front, a large round analog temperature gauge mounted on the door, a substantial full-height tubular handle, thick framed edges, statement pro-grade proportions`, PROHOME],
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
console.log('HARD GATE PASS: 30/30 (wave 4 premium+commercial, 21:9 jackson-format)');
