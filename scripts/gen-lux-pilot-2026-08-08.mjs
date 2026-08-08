// scripts/gen-lux-pilot-2026-08-08.mjs
// luxury-repair.webp for the wave-1 pilot cities (san-marino, westlake-village,
// villa-park). Skeleton = gen-roman-cities-2026-08-07.mjs: Roman's ref crops as
// inlineData ahead of the prompt (photo-pipeline.md §4 FINAL), §8.1 exactly-one-
// person, §6 no readable text/brands, NEUTRAL clause for panel-front built-ins.
// Plus the regen-luxury-2026-07-15 lesson: the model's prior puts a nameplate on
// the upper door of "built-in stainless fridge" no matter the prohibition — so
// the framing keeps the top of the appliance above the crop entirely.
//
// Usage: node scripts/gen-lux-pilot-2026-08-08.mjs [slug ...]   (default: all 3)
//        node scripts/gen-lux-pilot-2026-08-08.mjs --place      (newest attempt -> public/)
// Staging: %TMP%/lux-pilot. Nothing ships until --place.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];
const STAGING = path.join(os.tmpdir(), 'lux-pilot');
fs.mkdirSync(STAGING, { recursive: true });

const IDENTITY = `The technician's FACE must match the man in the reference photographs provided above: same man, same facial structure, same short dark brown hair receding slightly at the temples, same short dark stubble beard, same brow and eyes, European features, athletic build, late thirties. Keep his likeness recognisable and consistent — this is a specific real person, not a generic model. Natural, anatomically correct, undistorted face and hands with the right number of fingers.`;

const NOTEXT = `CRITICAL: the entire image is completely free of any writing — every surface, appliance, wall and garment is BLANK and unbranded, with NO logo, NO brand name, NO model number, NO badge, NO nameplate, NO control-panel lettering, NO stickers, NO signage, NO printed or engraved characters, NO watermarks anywhere. The uniform is plain and unmarked: no patches, no name tag, no embroidery.`;

const SOLO = `EXACTLY ONE person is in the frame — the technician, alone. NO second person, NO customer, NO homeowner, NO bystander, NO extra hands, arms, legs, faces or reflections of anyone else anywhere in the frame including the edges and the background. He is in a solo working pose, attention on his own work, NOT gesturing or looking at anyone.`;

// a1 QC: san-marino + westlake caps came back with a faint embroidered mark despite
// NOTEXT — the cap needs its own explicit prohibition, front and center.
const WARDROBE = `He wears a plain dark navy short-sleeve work polo and a completely plain, blank dark navy cap — the cap front is smooth empty fabric with NO emblem, NO embroidery, NO patch, NO stitching pattern, NO mark of any kind anywhere on the cap.`;

const NEUTRAL = `The appliance is a GENERIC, brand-ambiguous design: a fully integrated panel-front refrigerator with simple plain bar handles, NO distinctive louvred grille, NO recognisable designer handle profile, NO signature vent pattern, NO design element that resembles any real appliance brand's styling. Directly above the refrigerator there is ONLY flat plain cabinetry — NO vent band, NO louvred grille, NO slotted panel, NO stainless strip anywhere above the unit.`;

// regen-luxury lesson: frame the nameplate zone out entirely.
const FRAMING = `FRAMING: a waist-up shot, camera close. The TOP of the refrigerator, its upper vent area and the whole upper door face are ABOVE the frame and not visible — only the middle band of the appliance is in frame, from roughly counter height to shoulder height.`;

const INTACT = `The appliance is FULLY INTACT and completely CLOSED: doors shut, every panel on, NOTHING disassembled, no exposed parts, no removed grille, no tools or components lying on the floor.`;

const SCENES = {
  // a3 QC: model keeps putting a stainless louvred grille band above the wood panels
  // (Sub-Zero signature) — scene now spells out flat wood above the unit, montecito-style.
  'san-marino': 'an estate kitchen in a 1920s Colonial Revival San Marino home — warm stained-wood custom cabinetry, a marble island, leaded-glass window light from a mature garden, the refrigerator faced in the same stained wood as the cabinetry, sitting completely flush, with plain flat wood cabinet doors directly above it and no metal anywhere above the unit',
  'westlake-village': 'a lakefront Westlake Village kitchen — pale custom cabinetry, a long quartz island, soft water-reflected morning light through wide windows, the refrigerator column fitted completely flush into the cabinetry run',
  'villa-park': 'a large estate kitchen in an inland Orange County custom home — cream painted cabinetry, an oversized stone island, warm late-afternoon light through French doors onto a wide lot, the refrigerator faced in cream cabinetry panels, fully flush',
};

const promptFor = (scene) =>
  `Photorealistic documentary photograph, natural realistic interior light, NOT AI-glossy, no HDR sheen. An appliance repair technician stands beside a premium built-in refrigerator in ${scene}. ${WARDROBE} He calmly holds a digital multimeter with red and black probes, working at the appliance's front edge. ${INTACT} ${NEUTRAL} ${FRAMING} ${SOLO} ${IDENTITY} ${NOTEXT} Eye level, DSLR 50mm, 2K.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

const refParts = () => REFS.map((f) => ({
  inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(path.join(REFDIR, f)).toString('base64') },
}));

async function genOne(slug, attempt) {
  const out = path.join(STAGING, `${slug}__luxury-repair-a${attempt}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [...refParts(), { text: promptFor(SCENES[slug]) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
  });
  for (let tries = 1; tries <= 4; tries++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${slug} net: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 9000 * tries;
      console.error(`  ${slug} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${slug} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${slug} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${slug} bad PNG`); await sleep(2000); continue; }
    await sharp(out).resize(800, 450, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 92 }).toFile(path.join(STAGING, `${slug}__luxury-repair-a${attempt}-preview.jpg`));
    console.log(`ok ${slug} a${attempt} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    return true;
  }
  console.error(`FAIL ${slug} a${attempt}`);
  return false;
}

if (process.argv.includes('--place')) {
  for (const slug of Object.keys(SCENES)) {
    const cands = fs.readdirSync(STAGING)
      .filter((f) => f.startsWith(`${slug}__luxury-repair-a`) && f.endsWith('.png')).sort();
    if (!cands.length) { console.error(`no staging for ${slug}`); continue; }
    const raw = path.join(STAGING, cands[cands.length - 1]);
    const dir = path.join('public', 'images', 'cities', slug);
    fs.mkdirSync(dir, { recursive: true });
    let chosen = null;
    for (const q of [95, 92, 88, 84, 80, 74, 68, 62, 56, 50]) {
      const buf = await sharp(raw).resize(800, 450, { fit: 'cover', position: 'attention' }).webp({ quality: q }).toBuffer();
      chosen = { buf, q };
      if (buf.length <= 150 * 1024) break;
    }
    const out = path.join(dir, 'luxury-repair.webp');
    fs.writeFileSync(out, chosen.buf);
    console.log(`placed ${out} q${chosen.q} ${(chosen.buf.length / 1024).toFixed(0)}KB (from ${cands[cands.length - 1]})`);
  }
  process.exit(0);
}

const list = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const slugs = list.length ? list : Object.keys(SCENES);
for (const slug of slugs) {
  if (!SCENES[slug]) { console.error(`unknown slug: ${slug}`); process.exit(1); }
  const prev = fs.readdirSync(STAGING).filter((f) => f.startsWith(`${slug}__luxury-repair-a`) && f.endsWith('.png')).length;
  await genOne(slug, prev + 1);
  await sleep(2000);
}
console.log(`\nStaging: ${STAGING}`);
