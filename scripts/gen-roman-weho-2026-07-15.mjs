// scripts/gen-roman-weho-2026-07-15.mjs
// Regenerate the two WeHo people-photos with Roman's likeness (owner = on-photo technician).
//
// Character consistency comes from REFERENCE-IMAGE conditioning: the three ref crops are
// passed as inlineData parts ahead of the text prompt, so the model matches the face rather
// than inventing one. This is the only difference from the text-only gen-* scripts.
//
// The refs live OUTSIDE the repo tree on purpose (reference-photos/ is gitignored) — they are
// Roman's personal photos, they never deploy, and only the generated output under
// public/images/ ships. Path is absolute to the main worktree, where Roman put them.
//
// Usage: node scripts/gen-roman-weho-2026-07-15.mjs [luxury|managers]   (default: both)
// Writes every attempt to a temp dir so the best can be picked by eye; nothing is
// placed into public/ automatically — see the PLACE step at the bottom.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const TMP = path.join(os.tmpdir(), 'roman-weho');
fs.mkdirSync(TMP, { recursive: true });

// The three ref crops: frontal (sharpest), three-quarter, frontal (different light).
const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];

const IDENTITY = `The technician's FACE must match the man in the reference photographs provided above: same man, same facial structure, same short dark brown hair receding slightly at the temples, same short dark stubble beard, same brow and eyes, European features, athletic build, late thirties. Keep his likeness recognisable and consistent — this is a specific real person, not a generic model. Natural, anatomically correct, undistorted face and hands with the right number of fingers.`;

// Same "no text anywhere" gate the rest of the pipeline uses (photo-pipeline.md §6).
const NOTEXT = `CRITICAL: the entire image is completely free of any writing — every surface, appliance, wall and garment is BLANK and unbranded, with NO logo, NO brand name, NO model number, NO badge, NO nameplate, NO control-panel lettering, NO stickers, NO signage, NO street numbers, NO printed or engraved characters, NO watermarks anywhere. The uniform is plain and unmarked: no patches, no name tag, no embroidery.`;

// photo-pipeline.md §8.1 people rule: exactly ONE person, no interaction poses.
const SOLO = `EXACTLY ONE person is in the frame — the technician, alone. NO second person, NO customer, NO homeowner, NO building manager, NO bystander, NO extra hands, arms, legs, faces or reflections of anyone else anywhere in the frame including the edges and the background. He is in a solo working pose, attention on his own work, NOT gesturing or looking at anyone.`;

const WARDROBE = `He wears a plain dark navy short-sleeve work polo and a plain dark navy cap.`;

const SCENES = {
  luxury: {
    out: 'luxury-repair',
    aspect: '16:9',
    dims: [800, 450],
    prompt: `Photorealistic documentary photograph, natural realistic interior light, NOT AI-glossy, no HDR sheen. An appliance repair technician stands beside a large premium stainless-steel built-in refrigerator in an upscale West Hollywood kitchen — marble counters, pale custom cabinetry, tasteful and expensive. ${WARDROBE} He calmly holds a digital multimeter with red and black probes, working at the refrigerator's front edge. The refrigerator is FULLY INTACT and completely CLOSED: doors shut, every panel on, NOTHING disassembled, no exposed parts, no removed grille, no tools or components lying around. ${SOLO} ${IDENTITY} ${NOTEXT} Eye level, DSLR 50mm, 2K.`,
  },
  managers: {
    out: 'property-managers',
    aspect: '16:9',
    dims: [540, 320],
    prompt: `Photorealistic documentary photograph, warm natural afternoon daylight, NOT AI-glossy, no HDR sheen. An appliance repair technician stands on the sidewalk at the entrance of a 1920s Spanish-Revival multi-unit apartment building in West Hollywood — stucco facade, arched doorway, mature street trees. ${WARDROBE} He holds a tablet in one hand, glancing down at it; a canvas tool bag rests on the ground beside his feet. Calm, professional, unhurried. ${SOLO} ${IDENTITY} ${NOTEXT} No readable signage, no building numbers, no plaques, no license plates, no vehicles. Eye level, DSLR 35mm, wide establishing shot, 2K.`,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

function refParts() {
  return REFS.map((f) => ({
    inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(path.join(REFDIR, f)).toString('base64') },
  }));
}

async function genAttempt(key, attempt) {
  const s = SCENES[key];
  const out = path.join(TMP, `${s.out}-a${attempt}.png`);
  // Refs FIRST, prompt after — the model reads the images as context for the instruction.
  const body = JSON.stringify({
    contents: [{ parts: [...refParts(), { text: s.prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: s.aspect } },
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
    // Preview at final aspect so the attempt is judged as it will actually ship.
    const [w, h] = s.dims;
    await sharp(out).resize(w * 2, h * 2, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 }).toFile(path.join(TMP, `${s.out}-a${attempt}-preview.jpg`));
    console.log(`✓ ${s.out} attempt ${attempt} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    return true;
  }
  console.error(`✗ ${s.out} attempt ${attempt} FAILED`);
  return false;
}

const which = process.argv[2] ? [process.argv[2]] : ['luxury', 'managers'];
for (const key of which) {
  if (!SCENES[key]) { console.error(`unknown: ${key}`); process.exit(1); }
  for (let a = 1; a <= 3; a++) await genAttempt(key, a);
}
console.log(`\nAttempts + previews in: ${TMP}`);
