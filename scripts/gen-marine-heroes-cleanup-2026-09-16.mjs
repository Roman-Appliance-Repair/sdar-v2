// scripts/gen-marine-heroes-cleanup-2026-09-16.mjs
// Label-removal pass for picked /marine/ hero attempts (photo-pipeline.md §6).
// The generator keeps painting warning stickers on compressors and lettering on control
// panels even when told not to; regenerating a frame that is otherwise right costs more
// than an edit. This sends the picked frame back with a narrow "remove only X" instruction.
// The result must be re-checked by eye — face, pose and composition have to be unchanged.
//
// Usage: node scripts/gen-marine-heroes-cleanup-2026-09-16.mjs fridge-a6 ac-a4 ...
// Writes <TMP>/marine-heroes/{name}-clean.png (+ -clean-preview.jpg with the card zone).

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'marine-heroes');
const TMP_MOBILE = path.join(os.tmpdir(), 'hero-mobile');

const KEEP = `Keep EVERYTHING else pixel-identical: the same man with the same face, beard, cap, polo, pose, hands and tools; the same framing, camera angle, lighting, colours and background; the same empty left side. Do not add anything. Do not add any person. The output is the same photograph with only those marks removed.`;

const EDITS = {
  'fridge-a6': `Edit this photograph. Remove the orange-and-white warning sticker from the black compressor so the compressor is plain uniform matte black. Also remove any small printed marks or labels on the black control boxes so they are plain black. ${KEEP}`,
  'ac-a4': `Edit this photograph. There is ONE tiny change only: on the black pump mounted on the wall at the upper right (behind the technician's hands, above the bronze strainer), paint over the small white rectangular label so that spot is plain black like the rest of the pump. The technician must keep holding the same clear plastic strainer bowl full of debris in both hands, exactly as in the original. Nothing moves, nothing is swapped. ${KEEP}`,
  // hero-mobile (9:16) frames — see gen-hero-mobile-2026-09-16.mjs
  'm:marine-ice-a2': `Edit this photograph. ONE tiny change only: remove the small white embroidered mark on the chest of the technician's navy polo so the fabric there is plain navy like the rest of the shirt. ${KEEP}`,
  'm:truck-ice-a2': `Edit this photograph. ONE tiny change only: on the tall stainless cabinet in the background behind the technician, remove the small red-and-white label and the printed text on the dark strip near its top, so the strip is plain dark and the panel is plain stainless. ${KEEP}`,
  'm:marine-fridge-a5': `Edit this photograph. ONE tiny change only: remove the small red-and-white warning sticker from the side of the black compressor at the lower centre, so the compressor is plain glossy black. ${KEEP}`,
  'm:marine-laundry-a3': `Edit this photograph. ONE tiny change only: remove the small embroidered logo on the side of the technician's navy baseball cap so the cap is plain solid navy fabric everywhere. ${KEEP}`,
  'laundry-a7': `Edit this photograph. Remove ALL lettering, icons, symbols and printed marks from both washing machines' control panels and from the small display, so the panels are plain white with only the round knob and a blank dark display. Remove any small logo or badge anywhere on the machines. ${KEEP}`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function edit(name) {
  const mobile = name.startsWith('m:');
  const dir = mobile ? TMP_MOBILE : TMP;
  const base = mobile ? name.slice(2) : name;
  const src = path.join(dir, `${base}.png`);
  const out = path.join(dir, `${base}-clean.png`);
  const body = JSON.stringify({
    contents: [{ parts: [
      { inlineData: { mimeType: 'image/png', data: fs.readFileSync(src).toString('base64') } },
      { text: EDITS[name] },
    ] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: mobile ? '9:16' : '21:9' } },
  });
  for (let tries = 1; tries <= 4; tries++) {
    const resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch((e) => ({ status: 0, e }));
    if (resp.status !== 200) {
      const wait = [429, 500, 503].includes(resp.status) ? 10000 * tries : 3000;
      console.error(`  ${name}: HTTP ${resp.status}, retry in ${wait / 1000}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${name}: no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!mobile) {
      const card = Buffer.from(`<svg width="1920" height="840"><rect x="2" y="2" width="764" height="836" fill="none" stroke="red" stroke-width="4"/></svg>`);
      await sharp(out).resize(1920, 840, { fit: 'cover', position: 'center' })
        .composite([{ input: card }]).jpeg({ quality: 85 }).toFile(path.join(TMP, `${name}-clean-preview.jpg`));
    }
    const m = await sharp(out).metadata();
    console.log(`✓ ${name}-clean ${m.width}×${m.height}`);
    return;
  }
  console.error(`✗ ${name} FAILED`);
}

const names = process.argv.slice(2);
for (const n of names) {
  if (!EDITS[n]) { console.error(`no edit defined: ${n}`); process.exit(1); }
  await edit(n);
}
