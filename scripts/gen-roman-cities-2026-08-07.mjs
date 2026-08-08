// scripts/gen-roman-cities-2026-08-07.mjs
// luxury-repair.webp + property-managers.webp for the 12 new SB + SD city pillars.
// Skeleton = gen-roman-weho-2026-07-15.mjs: Roman's ref crops passed as inlineData
// ahead of the prompt (owner = on-photo technician, photo-pipeline.md §4 FINAL).
// Rules: §8.1 exactly-one-person, §6 no readable text/brands. EXTRA brand-neutral
// clause on every luxury frame — panel-front built-ins must not read as any real
// brand's design language under Google Lens (parity-task CRITICAL for Montecito,
// Hope Ranch, La Jolla, Rancho Santa Fe).
//
// Usage: node scripts/gen-roman-cities-2026-08-07.mjs [slug ...]      (default: all 12, both slots)
//        node scripts/gen-roman-cities-2026-08-07.mjs --slot=luxury   (one slot only)
//        node scripts/gen-roman-cities-2026-08-07.mjs --place         (newest attempt -> public/)
// Staging: %TMP%/roman-cities. Nothing ships until --place.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];
const STAGING = path.join(os.tmpdir(), 'roman-cities');
fs.mkdirSync(STAGING, { recursive: true });

const IDENTITY = `The technician's FACE must match the man in the reference photographs provided above: same man, same facial structure, same short dark brown hair receding slightly at the temples, same short dark stubble beard, same brow and eyes, European features, athletic build, late thirties. Keep his likeness recognisable and consistent — this is a specific real person, not a generic model. Natural, anatomically correct, undistorted face and hands with the right number of fingers.`;

const NOTEXT = `CRITICAL: the entire image is completely free of any writing — every surface, appliance, wall and garment is BLANK and unbranded, with NO logo, NO brand name, NO model number, NO badge, NO nameplate, NO control-panel lettering, NO stickers, NO signage, NO street numbers, NO printed or engraved characters, NO watermarks anywhere. The uniform is plain and unmarked: no patches, no name tag, no embroidery.`;

const SOLO = `EXACTLY ONE person is in the frame — the technician, alone. NO second person, NO customer, NO homeowner, NO building manager, NO bystander, NO extra hands, arms, legs, faces or reflections of anyone else anywhere in the frame including the edges and the background. He is in a solo working pose, attention on his own work, NOT gesturing or looking at anyone.`;

const WARDROBE = `He wears a plain dark navy short-sleeve work polo and a plain dark navy cap.`;

// Google-Lens shield for panel-front built-ins: generic design language only.
const NEUTRAL = `The appliance is a GENERIC, brand-ambiguous design: plain flat stainless or panel front, simple plain tubular or bar handles, NO distinctive louvred grille, NO recognisable designer handle profile, NO signature vent pattern, NO design element that resembles any real appliance brand's styling.`;

// Per-city scene flavour. kitchen -> luxury-repair; entrance -> property-managers.
const SCENES = {
  'santa-barbara': {
    kitchen: 'an upscale Santa Barbara kitchen in a Spanish Revival house — warm white plaster walls, dark wood beams overhead, terracotta floor, marble island',
    entrance: 'the arched entry courtyard of a 1920s Spanish Revival multi-unit apartment building — white stucco, red tile, bougainvillea, tiled steps',
  },
  montecito: {
    kitchen: 'a serene Montecito estate kitchen — a FULLY INTEGRATED panel-front refrigerator faced in the same pale wood as the surrounding custom cabinetry, sitting completely flush, with flat cabinetry directly above it (NO vent band, NO louvred grille, NO stainless strip anywhere above or on the unit), honed marble counters, garden light through steel-framed windows',
    entrance: 'the gravel motor court and understated front door of a Montecito estate — sandstone wall, clipped hedges, mature oaks shading the entrance',
  },
  goleta: {
    kitchen: 'a clean ordinary Goleta family kitchen — white shaker cabinets, laminate counters, a plain freestanding stainless refrigerator, morning light',
    entrance: 'the shared walkway of a modest single-storey Goleta rental duplex — plain stucco, trimmed lawn, concrete path to twin front doors',
  },
  carpinteria: {
    kitchen: 'a bright beach-cottage kitchen in Carpinteria — painted wood cabinets, butcher-block counter, compact stainless refrigerator, ocean light through a small window',
    entrance: 'the sandy front path and porch of a small Carpinteria vacation cottage — salt-faded siding, low picket fence, beach chairs stacked on the porch. The wall and trim around the front door are COMPLETELY BARE painted wood: NO house number, NO digits, NO plaque, NO mailbox, NO sign of any kind beside or above the door',
  },
  summerland: {
    kitchen: 'a compact hillside cottage kitchen in Summerland — appliances fitted tightly into painted cabinetry, a small window with a slice of ocean view',
    entrance: 'the narrow stepped entry path of a Summerland hillside cottage — timber railings, flowering shrubs, ocean haze in the background below',
  },
  'hope-ranch': {
    kitchen: 'a large Hope Ranch estate kitchen — twin panel-front built-in refrigerator columns, long marble island, garden and oak trees through French doors',
    entrance: 'the service entrance of a Hope Ranch estate outbuilding — whitewashed wall, dutch door, white three-rail equestrian fence and eucalyptus behind',
  },
  'la-jolla': {
    kitchen: 'a bright La Jolla kitchen in a Mediterranean bluff house — white walls, brass fixtures, marble counters, a large panel-front built-in refrigerator, ocean light',
    entrance: 'the palm-framed entrance of a Mediterranean-style La Jolla condominium building — white stucco, tile roofline, glass entry door, coastal light',
  },
  'rancho-santa-fe': {
    kitchen: 'a ranch-estate kitchen in Rancho Santa Fe — warm plaster walls, dark beams, oversized range area with a plain stainless hood, long stone island',
    entrance: 'the gated drive entrance of a Rancho Santa Fe estate — low white ranch fencing, eucalyptus trees, dry golden hills, an open timber gate',
  },
  carlsbad: {
    kitchen: 'a newer master-planned Carlsbad family kitchen — grey shaker cabinets, quartz counters, freestanding stainless refrigerator, tidy and bright',
    entrance: 'the entry of a newer Carlsbad apartment complex — clean two-storey stucco buildings, young palms, landscaped path to the door',
  },
  'del-mar': {
    kitchen: 'a beach-colony kitchen in Del Mar — white shiplap walls, pale counters, panel-front refrigerator, soft overcast ocean light through the window',
    entrance: 'the shuttered porch and sandy walk of a bluff-top Del Mar beach house in the off-season — shingle siding, white trim, pale ocean haze beyond',
  },
  encinitas: {
    kitchen: 'a relaxed Encinitas surf-bungalow kitchen — painted craftsman cabinets, tile counters, freestanding stainless refrigerator, jacaranda light outside',
    entrance: 'the porch steps of an Encinitas craftsman bungalow duplex — low porch, tapered columns, dry garden planting, a surfboard leaning at the far rail',
  },
  'solana-beach': {
    kitchen: 'a compact modern Solana Beach townhome kitchen — flat-front cabinetry, counter-depth panel refrigerator fitted flush, gallery-clean styling, small footprint',
    entrance: 'the shared courtyard entrance of a compact contemporary Solana Beach townhome building — clean stucco and timber, gated breezeway, coastal midday light',
  },
};

const SLOTS = {
  luxury: {
    file: 'luxury-repair',
    dims: [800, 450],
    prompt: (s) =>
      `Photorealistic documentary photograph, natural realistic interior light, NOT AI-glossy, no HDR sheen. An appliance repair technician stands beside a premium refrigerator in ${s.kitchen}. ${WARDROBE} He calmly holds a digital multimeter with red and black probes, working at the appliance's front edge. The appliance is FULLY INTACT and completely CLOSED: doors shut, every panel on, NOTHING disassembled, no exposed parts, no removed grille, no tools or components lying around. ${NEUTRAL} ${SOLO} ${IDENTITY} ${NOTEXT} Eye level, DSLR 50mm, 2K.`,
  },
  managers: {
    file: 'property-managers',
    dims: [540, 320],
    prompt: (s) =>
      `Photorealistic documentary photograph, warm natural daylight, NOT AI-glossy, no HDR sheen. An appliance repair technician stands at ${s.entrance}. ${WARDROBE} He holds a tablet in one hand, glancing down at it; a canvas tool bag rests on the ground beside his feet. Calm, professional, unhurried. ${SOLO} ${IDENTITY} ${NOTEXT} No readable signage, no building numbers, no plaques, no license plates, no vehicles. Eye level, DSLR 35mm, 2K.`,
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
    contents: [{ parts: [...refParts(), { text: slot.prompt(SCENES[slug]) }] }],
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
  for (const slug of Object.keys(SCENES)) {
    for (const slotKey of Object.keys(SLOTS)) {
      const slot = SLOTS[slotKey];
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
const slugs = list.length ? list : Object.keys(SCENES);
for (const slug of slugs) {
  if (!SCENES[slug]) { console.error(`unknown slug: ${slug}`); process.exit(1); }
  for (const slotKey of slotKeys) {
    const prev = fs.readdirSync(STAGING).filter((f) => f.startsWith(`${slug}__${SLOTS[slotKey].file}-a`) && f.endsWith('.png')).length;
    await genOne(slug, slotKey, prev + 1);
    await sleep(2000);
  }
}
console.log(`\nStaging: ${STAGING}`);
