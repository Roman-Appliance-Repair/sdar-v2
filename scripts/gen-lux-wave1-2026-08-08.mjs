// scripts/gen-lux-wave1-2026-08-08.mjs
// Wave-1 FULL images: luxury-repair.webp for 12 Group-A cities + property-managers.webp
// for 4 PM cities. Skeleton = gen-lux-pilot-2026-08-08.mjs (which carries the hard-won
// pilot fixes: blank cap clause, no louvred grille above the unit, nameplate zone framed
// out, flat cabinetry above, exactly one person, Roman ref crops) + the managers slot
// from gen-roman-cities-2026-08-07.mjs. Scenes are deliberately visually distinct per
// city — cabinetry color, light direction, window type, counter material.
//
// Usage: node scripts/gen-lux-wave1-2026-08-08.mjs [slug ...]        (default: all)
//        node scripts/gen-lux-wave1-2026-08-08.mjs --slot=luxury|managers
//        node scripts/gen-lux-wave1-2026-08-08.mjs --place           (newest -> public/)
// Staging: %TMP%/lux-wave1. Nothing ships until --place.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];
const STAGING = path.join(os.tmpdir(), 'lux-wave1');
fs.mkdirSync(STAGING, { recursive: true });

const IDENTITY = `The technician's FACE must match the man in the reference photographs provided above: same man, same facial structure, same short dark brown hair receding slightly at the temples, same short dark stubble beard, same brow and eyes, European features, athletic build, late thirties. Keep his likeness recognisable and consistent — this is a specific real person, not a generic model. Natural, anatomically correct, undistorted face and hands with the right number of fingers.`;

const NOTEXT = `CRITICAL: the entire image is completely free of any writing — every surface, appliance, wall and garment is BLANK and unbranded, with NO logo, NO brand name, NO model number, NO badge, NO nameplate, NO control-panel lettering, NO stickers, NO signage, NO street numbers, NO printed or engraved characters, NO watermarks anywhere. The uniform is plain and unmarked: no patches, no name tag, no embroidery.`;

const SOLO = `EXACTLY ONE person is in the frame — the technician, alone. NO second person, NO customer, NO homeowner, NO bystander, NO extra hands, arms, legs, faces or reflections of anyone else anywhere in the frame including the edges and the background. He is in a solo working pose, attention on his own work, NOT gesturing or looking at anyone and NOT looking at the camera.`;

const WARDROBE = `He wears a plain dark navy short-sleeve work polo and a completely plain, blank dark navy cap — the cap front is smooth empty fabric with NO emblem, NO embroidery, NO patch, NO stitching pattern, NO mark of any kind anywhere on the cap. The polo chest is plain fabric with NO printed or embroidered text.`;

const NEUTRAL = `The appliance is a GENERIC, brand-ambiguous design: a fully integrated panel-front refrigerator with simple plain bar handles, NO distinctive louvred grille, NO recognisable designer handle profile, NO signature vent pattern, NO design element that resembles any real appliance brand's styling. Directly above the refrigerator there is ONLY flat plain cabinetry — NO vent band, NO louvred grille, NO slotted panel, NO stainless strip anywhere above or on top of the unit.`;

const FRAMING = `FRAMING: a waist-up shot, camera close. The TOP of the refrigerator, its upper vent area and the whole upper door face are ABOVE the frame and not visible — only the middle band of the appliance is in frame, from roughly counter height to shoulder height.`;

const INTACT = `The appliance is FULLY INTACT and completely CLOSED: doors shut, every panel on, NOTHING disassembled, no exposed parts, no removed grille, no tools or components lying on the floor.`;

// Luxury kitchen scenes — each visually distinct (cabinetry / light / window / counter).
const LUX_SCENES = {
  'bel-air': 'a dark-walnut estate kitchen in a Bel Air canyon home — deep brown cabinetry, a heavy stone island, tall steel-framed windows onto dense green canyon planting, low warm evening light, the refrigerator faced in the same dark walnut, fully flush',
  'beverly-hills': 'a glossy white Beverly Hills estate kitchen — white lacquer cabinetry with plain bar handles, a marble waterfall island, bright midday light through tall French doors onto a hedged garden, the refrigerator faced in white lacquer panels, fully flush',
  'brentwood': 'a sage-green painted shaker kitchen in a Brentwood canyon house — marble counters with a butcher-block prep end, a garden window over the sink, soft morning light, the refrigerator faced in the same sage-green shaker panels, fully flush',
  'pacific-palisades': 'a pale-oak modern kitchen in a newly built Pacific Palisades home — flat-front light oak cabinetry, white quartz counters, one large picture window with hazy coastal light, the refrigerator faced in pale oak, fully flush',
  // a1-a3 QC: this bright scene keeps drawing him turned to the camera — force profile.
  'malibu': 'a whitewashed beach-house kitchen in Malibu — white shiplap wall, pale washed-wood cabinetry, bright reflected ocean light through wide sliding doors, the refrigerator faced in whitewashed wood panels, fully flush. The technician is seen strictly in SIDE PROFILE, his face angled down at the multimeter in his hands, back half-turned to the camera',
  'calabasas': 'an espresso-brown traditional kitchen in a gated Calabasas estate — dark stained cabinetry, travertine floor, an arched window with warm golden-hour light, the refrigerator faced in espresso panels, fully flush',
  'la-canada-flintridge': 'a cream classic kitchen in an older La Canada Flintridge foothill home — glazed cream cabinetry, honed granite counters, divided-light wood windows onto a mountain garden, quiet afternoon light, the refrigerator faced in cream panels, fully flush',
  'manhattan-beach': 'an airy coastal-grey shaker kitchen in a new Manhattan Beach hill-section build — grey-blue cabinetry, white counters, high clerestory windows pouring in even daylight, the refrigerator faced in grey shaker panels, fully flush',
  'santa-monica': 'a two-tone modern kitchen in a remodeled Santa Monica craftsman — white upper cabinets over natural oak lowers, speckled terrazzo-style counters, soft overcast light from a north window, the refrigerator faced in oak lowers-matching panels, fully flush',
  'toluca-lake': 'a mid-century walnut kitchen in a renovated Toluca Lake house — flat-panel walnut cabinetry, pale quartz counters, a clerestory band plus a garden window, late warm light, the refrigerator faced in walnut panels, fully flush',
  'newport-beach': 'a bright coastal-traditional kitchen in a Newport Beach harbor home — white raised-panel cabinetry, a blue-grey island, harbor light through a bay window, the refrigerator faced in white panels, fully flush',
  // a1 QC: model produced a freestanding side-by-side with an ice/water dispenser panel —
  // scene now prohibits dispensers/displays explicitly and insists on integrated panels.
  'laguna-beach': 'a compact artist-cottage kitchen in Laguna Beach — painted blue-grey wood cabinetry, handmade tile counter, one small window with a glimpse of pale ocean, intimate scale, the refrigerator FULLY INTEGRATED behind flat blue-grey painted cabinet panels with plain bar handles, completely flush and snug in the cabinetry, with NO water dispenser, NO ice dispenser, NO display, NO recess of any kind in the door face',
};

// PM entrance scenes — no signage, no numbers, no vehicles (per gen-roman-cities rules).
const PM_SCENES = {
  'malibu': 'the weathered wooden gate and sandy path of a Malibu beach house — timber fence faded by salt, dune grass, ocean haze beyond the roofline, morning light',
  'santa-monica': 'the entrance courtyard of a well-kept 1950s Santa Monica apartment building — clean modern lines, pale stucco, mature ficus trees, a tiled walkway to glass entry doors',
  'newport-beach': 'the compact front porch and white picket fence of a Balboa Island cottage — narrow walk street, flowers along the fence, a sliver of harbor water at the end of the lane',
  'laguna-beach': 'the stepped hillside path to a Laguna Beach cottage — timber stairs with a simple rail, flowering succulents on the slope, pale ocean far below, soft marine light',
};

const SLOTS = {
  luxury: {
    file: 'luxury-repair',
    dims: [800, 450],
    scenes: LUX_SCENES,
    prompt: (scene) =>
      `Photorealistic documentary photograph, natural realistic interior light, NOT AI-glossy, no HDR sheen. An appliance repair technician stands beside a premium built-in refrigerator in ${scene}. ${WARDROBE} He calmly holds a digital multimeter with red and black probes, working at the appliance's front edge. ${INTACT} ${NEUTRAL} ${FRAMING} ${SOLO} ${IDENTITY} ${NOTEXT} Eye level, DSLR 50mm, 2K.`,
  },
  managers: {
    file: 'property-managers',
    dims: [540, 320],
    scenes: PM_SCENES,
    prompt: (scene) =>
      `Photorealistic documentary photograph, warm natural daylight, NOT AI-glossy, no HDR sheen. An appliance repair technician stands at ${scene}. ${WARDROBE} He holds a tablet in one hand, glancing down at it; a canvas tool bag rests on the ground beside his feet. Calm, professional, unhurried. ${SOLO} ${IDENTITY} ${NOTEXT} No readable signage, no building numbers, no plaques, no license plates, no vehicles. Eye level, DSLR 35mm, 2K.`,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

const refParts = () => REFS.map((f) => ({
  inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(path.join(REFDIR, f)).toString('base64') },
}));

async function genOne(slug, slotKey, attempt) {
  const slot = SLOTS[slotKey];
  const out = path.join(STAGING, `${slug}__${slot.file}-a${attempt}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [...refParts(), { text: slot.prompt(slot.scenes[slug]) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
  });
  for (let tries = 1; tries <= 4; tries++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${slug}/${slotKey} net: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 9000 * tries;
      console.error(`  ${slug}/${slotKey} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${slug}/${slotKey} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${slug}/${slotKey} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${slug}/${slotKey} bad PNG`); await sleep(2000); continue; }
    const [w, h] = slot.dims;
    await sharp(out).resize(w, h, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 92 }).toFile(path.join(STAGING, `${slug}__${slot.file}-a${attempt}-preview.jpg`));
    console.log(`ok ${slug}/${slot.file} a${attempt} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    return true;
  }
  console.error(`FAIL ${slug}/${slotKey} a${attempt}`);
  return false;
}

if (process.argv.includes('--place')) {
  for (const slotKey of Object.keys(SLOTS)) {
    const slot = SLOTS[slotKey];
    for (const slug of Object.keys(slot.scenes)) {
      const cands = fs.readdirSync(STAGING)
        .filter((f) => f.startsWith(`${slug}__${slot.file}-a`) && f.endsWith('.png')).sort();
      if (!cands.length) { console.error(`no staging for ${slug}/${slot.file}`); continue; }
      const raw = path.join(STAGING, cands[cands.length - 1]);
      const [w, h] = slot.dims;
      const dir = path.join('public', 'images', 'cities', slug);
      fs.mkdirSync(dir, { recursive: true });
      let chosen = null;
      for (const q of [95, 92, 88, 84, 80, 74, 68, 62, 56, 50]) {
        const buf = await sharp(raw).resize(w, h, { fit: 'cover', position: 'attention' }).webp({ quality: q }).toBuffer();
        chosen = { buf, q };
        if (buf.length <= 150 * 1024) break;
      }
      const out = path.join(dir, `${slot.file}.webp`);
      fs.writeFileSync(out, chosen.buf);
      console.log(`placed ${out} q${chosen.q} ${(chosen.buf.length / 1024).toFixed(0)}KB (from ${cands[cands.length - 1]})`);
    }
  }
  process.exit(0);
}

const slotArg = process.argv.find((a) => a.startsWith('--slot='));
const slotKeys = slotArg ? [slotArg.split('=')[1]] : Object.keys(SLOTS);
const list = process.argv.slice(2).filter((a) => !a.startsWith('--'));
for (const slotKey of slotKeys) {
  const slot = SLOTS[slotKey];
  const slugs = list.length ? list.filter((s) => slot.scenes[s]) : Object.keys(slot.scenes);
  for (const slug of slugs) {
    const prev = fs.readdirSync(STAGING).filter((f) => f.startsWith(`${slug}__${slot.file}-a`) && f.endsWith('.png')).length;
    await genOne(slug, slotKey, prev + 1);
    await sleep(2000);
  }
}
console.log(`\nStaging: ${STAGING}`);
