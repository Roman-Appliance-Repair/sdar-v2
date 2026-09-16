// scripts/gen-food-truck-hub-hero-2026-09-16.mjs
// Replacement wide hero (21:9, ServiceHero/CommercialHero MODE A) for
// /commercial/food-truck-equipment-repair/. The old frame showed a van side reading
// "Same Day Appliance Repair (323) 870-4790" - the West Hollywood number, while the page CTA
// is (424) 325-0520, and photo-pipeline §6 forbids readable text anyway.
//
// Fix by framing, not by asking the model to erase text: the camera is INSIDE the truck, so no
// exterior side panel can be in the frame at all. The old hero is deliberately NOT sent as a
// scene reference (it carries the lettering). Same pattern as gen-hero-mobile-2026-09-16:
// scene first, Roman's reference crops after, labelled face only - with refs first the model
// tends to return a portrait instead of the scene.
//
// §8.1: subject in the RIGHT third, left 40% plain (the text card covers it).
// hero-mobile.{webp,jpg} for this page are not touched.
//
// Usage:
//   node scripts/gen-food-truck-hub-hero-2026-09-16.mjs --n=3 [--from=1]   generate attempts
//   node scripts/gen-food-truck-hub-hero-2026-09-16.mjs --place=2           place attempt 2
// Attempts land in <TMP>/food-truck-hub-hero/.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];
const TMP = path.join(os.tmpdir(), 'food-truck-hub-hero');
const DST = path.resolve('public/images/commercial/food-truck-equipment-repair');
fs.mkdirSync(TMP, { recursive: true });

const SCENE = `Photorealistic documentary photograph, natural light, NOT AI-glossy, no HDR sheen, DSLR 35mm, 2K. Ultra-wide 21:9 frame. The camera is INSIDE a food truck kitchen, looking along the stainless-steel prep line toward the open service window. The service window is propped open and shows only soft, out-of-focus late-afternoon sky and an empty blurred lot; nothing outside is readable. In the RIGHT THIRD of the frame, an appliance repair technician kneels at an open undercounter stainless refrigerator below the prep counter, holding a digital multimeter (its display turned away from the camera) with red and black leads on the unit's electrical box, eyes on his work, sharp and in focus. The LEFT 40% of the frame is calm and plain: a smooth, brushed stainless-steel wall and the empty stainless counter top with nothing on it, no people, no objects of interest. We never see the outside of the truck: no exterior side panel, no body lettering, no van, no vehicles.`;

const FACE_NOTE = 'FACE REFERENCE ONLY (three portraits of the technician). Use them only for his face. Do NOT output a portrait or a selfie; the output is the kitchen scene described above.';

const PERSON = `EXACTLY ONE person in the frame - the technician, alone. NO second person, NO customer at the window, NO extra hands, faces or reflections anywhere, including the window and the edges. He does not look at the camera. His face matches the reference portraits: same man, very short dark brown hair receding slightly at the temples, dense short dark beard with a few grey hairs, strong square jaw, straight brows, deep-set eyes, fair skin, European features, athletic build, late thirties. Natural, anatomically correct face and hands. He wears a plain dark navy short-sleeve pullover polo (no chest pocket) and a plain solid dark navy baseball cap; both completely BLANK - NO embroidery, NO logo, NO emblem, NO patch, NO lettering.`;

const NOTEXT = `CRITICAL: the image contains NO readable writing of any kind - no logos, brand names, model numbers, badges, nameplates, stickers, warning labels, control-panel lettering, menus, price boards, signage, vehicle lettering, phone numbers or watermarks. Every appliance front is plain stainless; any control panel is turned away or outside the frame.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b64 = (p) => fs.readFileSync(p).toString('base64');

async function gen(attempt) {
  const parts = [{ text: SCENE }, { text: FACE_NOTE }];
  for (const f of REFS) parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64(path.join(REFDIR, f)) } });
  parts.push({ text: `${PERSON} ${NOTEXT}` });
  const body = JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } } });
  const out = path.join(TMP, `hub-a${attempt}.png`);
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
    const card = Buffer.from(`<svg width="1920" height="840"><rect x="2" y="2" width="764" height="836" fill="none" stroke="red" stroke-width="4"/></svg>`);
    await sharp(out).resize(1920, 840, { fit: 'cover', position: 'center' }).composite([{ input: card }])
      .jpeg({ quality: 85 }).toFile(path.join(TMP, `hub-a${attempt}-preview.jpg`));
    const m = await sharp(out).metadata();
    console.log(`✓ hub a${attempt} ${m.width}x${m.height}`);
    return;
  }
  console.error(`✗ hub a${attempt} FAILED`);
}

// Same weight rule as convert-marine-heroes-2026-09-16: hero is the LCP image, so hero.webp
// steps up in quality below 80 KB and only steps down above 200 KB, never below q65.
// hero-960 / hero-640 are derived from the same source. sharp strips EXIF/XMP/ICC by default.
async function place(name) {
  const src = path.join(TMP, `hub-a${name}.png`);
  if (!fs.existsSync(src)) { console.error(`no source ${src}`); process.exit(1); }
  for (const [file, w, h] of [['hero', 1920, 840], ['hero-960', 960, 420], ['hero-640', 640, 280]]) {
    const base = sharp(src).resize(w, h, { fit: 'cover', position: 'center' });
    let q = 80, buf = await base.clone().webp({ quality: q, effort: 6 }).toBuffer();
    if (file === 'hero') {
      while (buf.length < 80 * 1024 && q < 98) { q += 2; buf = await base.clone().webp({ quality: q, effort: 6 }).toBuffer(); }
      while (buf.length > 200 * 1024 && q > 65) { q = Math.max(65, q - 5); buf = await base.clone().webp({ quality: q, effort: 6 }).toBuffer(); }
    }
    fs.writeFileSync(path.join(DST, `${file}.webp`), buf);
    await base.clone().jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(path.join(DST, `${file}.jpg`));
    console.log(`✓ ${file}.webp q${q} ${Math.round(buf.length / 1024)} KB`);
  }
}

const args = process.argv.slice(2);
const placeArg = args.find((a) => a.startsWith('--place='));
if (placeArg) {
  await place(placeArg.slice(8));
} else {
  const n = Number((args.find((a) => a.startsWith('--n=')) || '--n=3').slice(4));
  const from = Number((args.find((a) => a.startsWith('--from=')) || '--from=1').slice(7));
  for (let a = from; a < from + n; a++) await gen(a);
  console.log(`\nAttempts + previews in: ${TMP}`);
}
