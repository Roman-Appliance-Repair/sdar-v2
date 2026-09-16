// scripts/gen-hero-mobile-2026-09-16.mjs
// Vertical 9:16 hero-mobile frames for the 16 pages that only had the 21:9 hero
// (11 /marine/ + 5 food-truck). Not new scenes: each call sends the page's own wide hero
// as the scene reference and asks for a vertical recomposition of the same photo, so the
// section looks the same on a phone as on desktop.
//
// Composition differs from the wide frame (photo-pipeline §8.1): on a phone the text card
// covers the whole screen and cover-cropping trims both sides equally, so the subject goes
// in the CENTRE. The preview marks the band a 390x1097 phone hero actually shows.
//
// People scenes also get Roman's three reference crops, sent AFTER the scene image and
// labelled face-only. Harbor scenes stay empty of people.
//
// Usage: node scripts/gen-hero-mobile-2026-09-16.mjs [key ...] [--n=2] [--from=1]
// Attempts land in <TMP>/hero-mobile/; the convert step places the picked ones.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];
const TMP = path.join(os.tmpdir(), 'hero-mobile');
fs.mkdirSync(TMP, { recursive: true });

const IDENTITY = `The technician's FACE must match the man in the three reference portraits: same man, same facial structure, same very short dark brown hair receding slightly at the temples, same dense short dark beard with a few grey hairs covering a strong square jaw, same straight brows and deep-set eyes, fair skin, European features, athletic build, late thirties. Natural, anatomically correct face and hands with the right number of fingers.`;

const WARDROBE = `He wears a plain dark navy short-sleeve pullover polo (knit collar, two-button placket, no chest pocket) and a plain solid dark navy baseball cap. Polo and cap are completely BLANK: NO embroidery, NO logo, NO emblem, NO patch, NO lettering anywhere on them.`;

const SOLO = `EXACTLY ONE person in the frame — the technician, alone. NO second person, NO extra hands, arms, faces or reflections anywhere, including the edges and the background. Solo working pose, eyes on his work, not looking at the camera.`;

const EMPTY = `There are NO people anywhere in the image — not on docks, boats, beaches or paths, not even tiny distant figures. NO cars in the foreground.`;

const NOTEXT = `CRITICAL: the image contains NO readable writing of any kind — no logos, brand names, model numbers, badges, nameplates, stickers, warning labels, control-panel lettering, signage, boat names, hull numbers, home ports, slip numbers, flags with emblems, vehicle lettering or phone numbers, no watermarks. Any control panel or lettered surface is turned away or outside the frame.`;

const person = (scene) => `Recompose the SCENE PHOTO provided above as a new VERTICAL 9:16 portrait-orientation photograph of the very same scene: ${scene} Keep the same setting, the same equipment, the same materials and colours, the same lighting and the same photographic style — it must look like the same photo shoot, shot in portrait orientation. The result is a wide working shot with his whole upper body and the equipment in view, NOT a head-and-shoulders portrait, and he does NOT look at the camera. COMPOSITION: the technician and the equipment he works on are CENTRED horizontally in the frame and fully visible, with his face and hands in the middle vertical band of the image; nothing important near the left or right edges. Step the camera back or up as needed so the whole subject fits. ${WARDROBE} ${SOLO} ${IDENTITY} ${NOTEXT} Photorealistic, not AI-glossy, DSLR 35mm.`;

const harbor = (scene) => `Recompose the SCENE PHOTO provided above as a new VERTICAL 9:16 portrait-orientation landscape photograph of the very same place: ${scene} Keep the same light, the same time of day, the same colours, the same kind of boats and shoreline and the same photographic style — it must look like the same shoot, turned to portrait orientation. COMPOSITION: turn the camera so the boats, docks and shoreline sit in the MIDDLE of the frame, filling the central band from left of centre to right of centre — not pushed to one side; the edges may be water or sky. The extra height goes to sky above and water below. Boats are seen from a distance where no hull lettering could exist. ${EMPTY} ${NOTEXT} Photorealistic, natural colours, not AI-glossy, DSLR 35mm.`;

const MARINE = 'public/images/marine';
const TRUCK = 'public/images/commercial/food-truck-equipment-repair';

export const SCENES = {
  'marine-hub':     { dir: `${MARINE}/marine`, people: true, prompt: person('a technician carrying a canvas tool bag walks along a wooden floating dock in a California marina at hazy morning, sailboat masts along the dock, looking down at the planks ahead of him.') },
  'marine-fridge':  { dir: `${MARINE}/refrigeration-repair`, people: true, prompt: person('in a sailboat galley with varnished wood joinery, the technician crouches at an open undercounter marine refrigerator with the lower grille removed, testing the compressor control module with a multimeter.') },
  'marine-ac':      { dir: `${MARINE}/air-conditioning-repair`, people: true, prompt: person('in a dim, cramped engine room, the technician holds a clear plastic seawater strainer bowl full of debris in both hands under a work light, a bronze strainer and a black pump on the bulkhead beside him.') },
  'marine-ice':     { dir: `${MARINE}/ice-maker-repair`, people: true, prompt: person('in a bright yacht galley with light oak cabinets and white counters, the technician kneels at an undercounter ice maker with its front panel off and shines a flashlight on the evaporator.') },
  'marine-laundry': { dir: `${MARINE}/washer-dryer-repair`, people: true, prompt: person('in a pale grey laundry niche aboard a yacht, the technician kneels by a white front-loading washer-dryer with its lower access flap open, holding the drain filter. The machine control panel is above the top edge of the frame.') },
  'marine-yacht':   { dir: `${MARINE}/yacht-appliance-repair`, people: true, prompt: person('in a luxury yacht galley with glossy teak joinery and daylight from a porthole, the technician works at the hinge of a built-in refrigerator set into the teak.') },
  'mdr':            { dir: `${MARINE}/marina-del-rey`, people: false, prompt: harbor('a wide, glassy man-made marina basin at soft early morning. LAYOUT: a calm channel runs from the bottom centre of the frame straight away from the camera; rows of sailboats with tall masts line BOTH sides of it, and low modern apartment buildings and palm trees close the view at the centre of the horizon.') },
  'newport':        { dir: `${MARINE}/newport-beach`, people: false, prompt: harbor('a narrow harbor channel at bright midday with light ripples. LAYOUT: the channel runs from the bottom centre of the frame into the distance; low waterfront homes with private docks line BOTH banks, and small boats on mooring buoys sit in the middle of the channel in the centre of the frame.') },
  'dana':           { dir: `${MARINE}/dana-point`, people: false, prompt: harbor('a small harbor under tall brush-covered coastal bluffs in warm evening light, boats moored inside a curving rock breakwater, open Pacific beyond.') },
  'sd':             { dir: `${MARINE}/san-diego`, people: false, prompt: harbor('a hazy bay in soft diffused light. LAYOUT: a floating dock with white motor yachts and sportfishing boats moored on both sides runs from the bottom centre of the frame straight out toward a faint, generic high-rise skyline that sits at the centre of the horizon.') },
  'sb':             { dir: `${MARINE}/santa-barbara`, people: false, prompt: harbor('a sunny harbor in clear golden California light, seen from above the water. LAYOUT: the harbor full of sailboats sits in the centre of the frame, wrapped by a rock breakwater that curves across the middle; a sandy beach and the town behind it, and a steep mountain range rises right behind the town across the upper centre of the frame.') },
  'truck-hub':      { dir: TRUCK, people: true, prompt: person('the technician stands at the open side service door of a white food truck in a parking lot at soft evening light, one hand on the door frame, a canvas tool bag in the other hand, looking inside the truck. No other vehicles in the frame.') },
  'truck-fryer':    { dir: `${TRUCK}/fryer-not-heating`, people: true, prompt: person('inside a stainless-steel food truck kitchen, the technician kneels at a fryer cabinet with the door open, working on the brass gas valve with a tool, a fry basket beside it.') },
  'truck-griddle':  { dir: `${TRUCK}/griddle-wont-light`, people: true, prompt: person('inside a stainless-steel food truck kitchen, the technician tests the brass gas valves under a flat-top griddle with a multimeter, the lower front panel removed, a service window behind him.') },
  'truck-ice':      { dir: `${TRUCK}/ice-machine-not-making-ice`, people: true, prompt: person('in a clean commissary room with a light grey floor, the technician crouches at a stainless undercounter ice machine on casters with its front open, shining a flashlight on the evaporator.') },
  'truck-fridge':   { dir: `${TRUCK}/refrigeration-not-cooling`, people: true, prompt: person('inside a stainless-steel food truck kitchen with a sliding service window, the technician stands at an open upright stainless refrigerator holding a multimeter with red and black leads.') },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b64 = (p) => fs.readFileSync(p).toString('base64');

async function gen(key, attempt) {
  const s = SCENES[key];
  // Scene first, face refs after: with refs first the model sometimes just returned a
  // re-lit copy of a reference portrait instead of the scene (first run, 7 of 22 people frames).
  const parts = [{ text: 'SCENE PHOTO (wide version of the shot to recompose):' },
    { inlineData: { mimeType: 'image/jpeg', data: b64(path.join(s.dir, 'hero.jpg')) } }];
  if (s.people) {
    parts.push({ text: 'FACE REFERENCE ONLY (three portraits of the technician). Use them only for his face. Do NOT output a portrait or a selfie; the output is the work scene from the SCENE PHOTO.' });
    for (const f of REFS) parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64(path.join(REFDIR, f)) } });
  }
  parts.push({ text: s.prompt });
  const body = JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16' } } });
  const out = path.join(TMP, `${key}-a${attempt}.png`);
  for (let tries = 1; tries <= 4; tries++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * tries;
      console.error(`  ${key}: HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${key}: HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${key}: no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    // Preview at 1080x1920 with the band a 390x1097 phone hero shows under cover-crop
    // (box ratio 0.356 vs frame 0.5625 -> centre 63% of the width).
    const band = Math.round(1080 * (1 - 0.356 / 0.5625) / 2);
    const svg = Buffer.from(`<svg width="1080" height="1920"><rect x="${band}" y="2" width="${1080 - 2 * band}" height="1916" fill="none" stroke="red" stroke-width="6"/></svg>`);
    await sharp(out).resize(1080, 1920, { fit: 'cover' }).composite([{ input: svg }]).jpeg({ quality: 82 })
      .toFile(path.join(TMP, `${key}-a${attempt}-preview.jpg`));
    const m = await sharp(out).metadata();
    console.log(`✓ ${key} a${attempt} ${m.width}x${m.height}`);
    return;
  }
  console.error(`✗ ${key} a${attempt} FAILED`);
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  const n = Number((args.find((a) => a.startsWith('--n=')) || '--n=2').slice(4));
  const from = Number((args.find((a) => a.startsWith('--from=')) || '--from=1').slice(7));
  const keys = args.filter((a) => !a.startsWith('--'));
  for (const k of keys.length ? keys : Object.keys(SCENES)) {
    if (!SCENES[k]) { console.error(`unknown: ${k}`); process.exit(1); }
    for (let a = from; a < from + n; a++) await gen(k, a);
  }
  console.log(`\nAttempts + previews in: ${TMP}`);
}
