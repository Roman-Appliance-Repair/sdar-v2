// scripts/gen-marine-heroes-2026-09-16.mjs
// /marine/ hero photos, batch 1 — hub + 5 service pages, Roman as the on-photo technician.
//
// Same reference-image conditioning as gen-roman-weho-2026-07-15.mjs: the three ref crops
// go as inlineData parts BEFORE the text prompt, then the prompt tells the model to hold
// that face. Frames are 21:9 for ServiceHero MODE A (1920×840, left text card — §8.1).
//
// Usage: node scripts/gen-marine-heroes-2026-09-16.mjs [key ...] [--n=3]   (default: all, 3 attempts)
// Attempts land in <TMP>/marine-heroes/ for review by eye; nothing goes to public/ here —
// scripts/convert-marine-heroes-2026-09-16.mjs places the picked frames.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const TMP = path.join(os.tmpdir(), 'marine-heroes');
fs.mkdirSync(TMP, { recursive: true });

const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];

const IDENTITY = `The technician's FACE must match the man in the reference photographs provided above: same man, same facial structure, same very short dark brown hair receding slightly at the temples, same dense short dark beard with a few grey hairs covering a strong square jaw, same straight brows and deep-set eyes, fair skin, European features, athletic build, late thirties. Keep his likeness recognisable and consistent — this is a specific real person, not a generic model. Natural, anatomically correct, undistorted face and hands with the right number of fingers.`;

// photo-pipeline.md §6 + marine specifics: no hull names, home ports, burgees, marina signs.
const NOTEXT = `CRITICAL: the entire image is completely free of any writing — every surface, appliance, bulkhead, hull, transom, garment and object is BLANK and unbranded, with NO logo, NO brand name, NO model number, NO badge, NO nameplate, NO control-panel lettering, NO stickers, NO warning labels, NO signage, NO boat names, NO hull registration numbers, NO home-port lettering on any transom, NO yacht-club burgees, NO flags with emblems, NO marina signs, NO slip numbers, NO printed or engraved characters, NO watermarks anywhere. Any control panel is turned away from the camera or outside the frame. The uniform is plain and unmarked: no patches, no name tag, no embroidery.`;

const SOLO = `EXACTLY ONE person is in the frame — the technician, alone. NO second person, NO boat owner, NO crew, NO customer, NO bystander, NO extra hands, arms, legs, faces or reflections of anyone else anywhere in the frame including the edges, the background and the empty left side. He is in a solo working pose, eyes on the equipment he is working on, NOT gesturing or looking at anyone.`;

const WARDROBE = `He wears a plain dark navy short-sleeve pullover polo shirt (knit collar, two-button placket, NO chest pocket) and a plain solid dark navy baseball cap. The polo chest, sleeves and collar are completely BLANK fabric — NO embroidered logo, NO printed mark, NO name. The cap front panel is completely BLANK — one flat colour, NO embroidery, NO logo, NO emblem, NO patch, NO lettering.`;

// §8.1: 21:9 frame, subject in the right third, left 40% plain.
const COMPOSE = `Ultra-wide 21:9 composition. The technician and the equipment he works on are placed in the RIGHT THIRD of the frame, sharp and in focus. The LEFT 40% of the frame is calm, plain, empty negative space (described below) with NO people, NO objects of interest, NO text — a text card will be overlaid there.`;

const STYLE = `Photorealistic documentary photograph, NOT AI-glossy, no HDR sheen, realistic textures, DSLR 35mm, 2K.`;

const SCENES = {
  hub: {
    slug: 'marine',
    prompt: `${STYLE} Morning in a Southern California marina, soft low sun, light marine haze. A long floating wooden dock runs from the right side of the frame into the distance; a row of sailboat masts and white hulls recedes deep into the background along the dock. An appliance repair technician walks along the dock on the RIGHT side of the frame toward a moored boat, mid-stride, carrying a canvas tool bag by its handle. His head faces straight forward in the direction he walks and his eyes look ahead along the dock planks in front of him, slightly downward — he is NOT turning his head to the side and NOT looking at the camera. He is walking, not stopped, not working on anything; there are NO utility pedestals, NO electrical cabinets, NO dock boxes near him. ${WARDROBE} LEFT 40% of the frame: open calm blue-green water and empty dock planking, nothing else. Boats are generic, hulls completely plain white with no names or numbers, no flags. ${COMPOSE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  },
  fridge: {
    slug: 'refrigeration-repair',
    prompt: `${STYLE} Interior of a sailboat galley, warm natural light from a hatch above plus cabin light. An undercounter marine refrigerator with a plain stainless door is set into satin-varnished wood joinery on the RIGHT side; its door is open, the lower kick grille is removed and lies out of sight, exposing the compressor compartment with a small plain matte-black 12V DC compressor (NO label, NO sticker on it) and a compact plain black control module with wire terminals. An appliance repair technician crouches on the RIGHT beside it, holding a digital multimeter (display turned away from the camera) with red and black probes touching the module's terminals, eyes on the terminals. ${WARDROBE} LEFT 40% of the frame: a smooth plain cream-painted bulkhead, empty, with soft light falling on it. ${COMPOSE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  },
  ac: {
    slug: 'air-conditioning-repair',
    prompt: `${STYLE} Cramped engine room / lazarette of a motor yacht, dim, lit by the warm beam of a work light and a headlamp. Mounted low on a white fiberglass bulkhead on the RIGHT side: a plain cast-bronze seawater strainer (NO tag, NO plate) whose clear cylindrical sight-bowl has been unscrewed, hoses, and a small plain black seawater pump beside it with NO label plate. An appliance repair technician kneels on the RIGHT, holding the removed clear strainer bowl in both hands, inspecting the debris inside, eyes on the bowl; the work-light beam falls on his hands. Hoses and bronze valves around him, no labels. ${WARDROBE} LEFT 40% of the frame: a blank, plain, smooth grey-white fiberglass bulkhead in soft shadow, empty. ${COMPOSE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  },
  ice: {
    slug: 'ice-maker-repair',
    prompt: `${STYLE} Galley of a motor yacht, bright clean daylight from windows, white solid-surface counters and light oak cabinetry. On the RIGHT side an undercounter stainless ice maker is built into the cabinetry with its front panel removed, exposing the evaporator plate and water distribution tube inside. An appliance repair technician kneels on the RIGHT, shining a small flashlight into the unit at the evaporator, eyes on the evaporator. ${WARDROBE} LEFT 40% of the frame: a long, completely empty white countertop with nothing on it and a plain light cabinet face below it — no objects, no bowls, no bottles. ${COMPOSE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  },
  laundry: {
    slug: 'washer-dryer-repair',
    prompt: `${STYLE} A tight laundry niche inside a yacht's crew passageway, soft overhead cabin light, pale grey-painted panelling. A compact plain white front-loading all-in-one washer-dryer is built into the niche on the RIGHT; the camera is low, so the TOP of the machine and its control panel are cut off above the frame edge. The round glass door is CLOSED. At the very bottom of the machine's front, below the door, a small square access flap is hinged open, revealing the round drain-pump filter opening. An appliance repair technician kneels low on the RIGHT beside the machine, holding the unscrewed round drain filter (a small white cylinder with a grip cap) in one hand over a folded towel on the floor, eyes on the filter. ${WARDROBE} LEFT 40% of the frame: a smooth, plain, pale grey wall panel, empty. ${COMPOSE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  },
  yacht: {
    slug: 'yacht-appliance-repair',
    prompt: `${STYLE} The galley of a large luxury motor yacht: rich warm teak joinery with a high-gloss finish, brushed stainless steel details, pale stone countertop. Soft natural daylight streams through an oval porthole, creating a gentle highlight. On the RIGHT side, a panel-ready built-in refrigerator set flush into the teak joinery has its decorative wood front panel removed and set aside out of view, revealing the stainless unit and its hinge-side mounting brackets. An appliance repair technician stands on the RIGHT, working on the bracket with a nut driver, eyes on his work. Elegant, quiet, expensive, editorial interior photography quality. ${WARDROBE} LEFT 40% of the frame: a clean, completely empty stretch of pale stone countertop and a plain section of glossy teak bulkhead with the porthole light falling on it — no objects. ${COMPOSE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

const refParts = () => REFS.map((f) => ({
  inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(path.join(REFDIR, f)).toString('base64') },
}));

async function genAttempt(key, attempt) {
  const s = SCENES[key];
  const out = path.join(TMP, `${key}-a${attempt}.png`);
  // Refs FIRST, prompt after — the model reads the images as context for the instruction.
  const body = JSON.stringify({
    contents: [{ parts: [...refParts(), { text: s.prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let tries = 1; tries <= 4; tries++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * tries;
      console.error(`  HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  bad PNG, retry`); await sleep(2000); continue; }
    // Preview at the shipping crop with the left-40% card zone outlined, so it's judged as it ships.
    const meta = await sharp(out).metadata();
    const card = Buffer.from(`<svg width="1920" height="840"><rect x="2" y="2" width="764" height="836" fill="none" stroke="red" stroke-width="4"/></svg>`);
    await sharp(out).resize(1920, 840, { fit: 'cover', position: 'center' })
      .composite([{ input: card }]).jpeg({ quality: 85 })
      .toFile(path.join(TMP, `${key}-a${attempt}-preview.jpg`));
    console.log(`✓ ${key} a${attempt} ${meta.width}×${meta.height} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    return true;
  }
  console.error(`✗ ${key} a${attempt} FAILED`);
  return false;
}

const args = process.argv.slice(2);
const n = Number((args.find((a) => a.startsWith('--n=')) || '--n=3').slice(4));
const start = Number((args.find((a) => a.startsWith('--from=')) || '--from=1').slice(7));
const keys = args.filter((a) => !a.startsWith('--'));
for (const key of keys.length ? keys : Object.keys(SCENES)) {
  if (!SCENES[key]) { console.error(`unknown: ${key}`); process.exit(1); }
  for (let a = start; a < start + n; a++) await genAttempt(key, a);
}
console.log(`\nAttempts + previews in: ${TMP}`);
