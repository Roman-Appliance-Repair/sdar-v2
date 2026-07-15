// scripts/regen-luxury-2026-07-15.mjs — regenerate ONLY west-hollywood/luxury-repair.
//
// Why: the first render put a brand-style nameplate on the refrigerator door
// (garbled glyphs, but unmistakably a badge). docs/photo-pipeline.md §6.1/§6.2
// forbid visible brands and model plates outright — the whole point is that
// Google Lens reads badges. §8.1 says scan after generation and regenerate on a
// find, so this re-rolls that one image with a much harder prohibition and
// verifies before placing.
//
// Same character sheet as the pilot run, so the face still matches
// property-managers on the same page.
//
// Run: node scripts/regen-luxury-2026-07-15.mjs

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KEY_PATHS = [
  'secrets/gemini-key.txt',
  'C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt',
];
const KEY = fs.readFileSync(KEY_PATHS.find((p) => fs.existsSync(p)), 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;

const STAGE = 'scripts/photo-staging';
const SHEET = path.join(STAGE, '_ref-mikhail.png');
const RAW = path.join(STAGE, 'west-hollywood__luxury-repair.png');
const OUT = 'public/images/cities/west-hollywood/luxury-repair.webp';

const PROMPT =
  'Photorealistic photo of ONE appliance repair technician — the same man as the reference image, same face, same build — holding a digital multimeter and checking a fully assembled, completely intact built-in stainless-steel refrigerator in an upscale bright kitchen with marble counters and custom cabinetry. ' +
  'The appliance is closed and undamaged: nothing is disassembled, no panels removed, no tools inside the unit, no parts on the floor. He stands beside it looking at the multimeter reading. ' +
  'He wears a plain dark navy work polo and a plain dark cap, no readable text on the clothing. ' +
  'CRITICAL: EXACTLY ONE person in frame — the technician, alone. No second person, no customer, no bystander, no hands or limbs belonging to anyone else, anywhere in frame including the edges. No handshake, no gesturing at someone. Solo working pose, attention on his own work. ' +
  // the hard part — first render ignored a generic "no badge" line
  'ABSOLUTELY CRITICAL — THE REFRIGERATOR MUST BE COMPLETELY UNMARKED: the stainless steel door, the door handles and every surface of the appliance are perfectly blank, bare, smooth metal. There is NO nameplate, NO badge, NO emblem, NO logo, NO brand name, NO maker mark, NO model plate, NO serial sticker, NO lettering, NO numbers, NO symbols and NO engraved text of any kind anywhere on the appliance. An unbranded prototype appliance with nothing written on it. ' +
  // Two prior attempts put a nameplate on the upper-right door face anyway — the
  // model's prior for "built-in stainless fridge" is too strong to prompt away.
  // So frame it out: keep the top of the appliance above the crop entirely.
  'FRAMING: a tight waist-up shot. The camera is close. The TOP of the refrigerator, its upper vent grille and the whole upper door area are ABOVE the frame and not visible — we only see the middle band of the appliance beside him, from roughly counter height to shoulder height. ' +
  'There is also no text, signage, lettering or writing anywhere else in the frame — not on the cabinets, walls, counters, or the multimeter. ' +
  'Soft natural daylight, DSLR 50mm, eye level. 2K.';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const validPng = (p) => {
  try {
    const fd = fs.openSync(p, 'r');
    const b = Buffer.alloc(8);
    fs.readSync(fd, b, 0, 8, 0);
    fs.closeSync(fd);
    return b.toString('hex').startsWith('89504e470d0a1a0a') && fs.statSync(p).size > 10000;
  } catch {
    return false;
  }
};

async function gen(outPath) {
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          { inlineData: { mimeType: 'image/png', data: fs.readFileSync(SHEET).toString('base64') } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
  });
  let calls = 0;
  for (let a = 1; a <= 16 && calls < 4; a++) {
    let resp;
    try {
      resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    } catch (e) {
      console.error('  net', e.message);
      await sleep(4000);
      continue;
    }
    if ([429, 500, 503].includes(resp.status)) {
      const t = await resp.text();
      const m = t.match(/retry in ([\d.]+)s/i);
      const w = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 9000;
      console.error(`  HTTP ${resp.status} — wait ${Math.round(w / 1000)}s`);
      await sleep(w);
      continue;
    }
    const j = await resp.json();
    calls++;
    if (resp.status !== 200) {
      console.error('  HTTP', resp.status, j?.error?.message);
      await sleep(3000);
      continue;
    }
    const img = (j?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) {
      console.error('  no image fr=', j?.candidates?.[0]?.finishReason);
      await sleep(3000);
      continue;
    }
    fs.writeFileSync(outPath, Buffer.from(img.data, 'base64'));
    if (validPng(outPath)) return true;
    console.error('  bad png');
    await sleep(2000);
  }
  return false;
}

const attempt = Number(process.argv[2] || 1);
const raw = RAW.replace('.png', `-v${attempt}.png`);
console.log(`regen luxury-repair attempt ${attempt} ...`);
if (!(await gen(raw))) {
  console.error('FAILED');
  process.exit(1);
}

let chosen = null;
for (const q of [95, 92, 88, 84, 80, 74]) {
  const buf = await sharp(raw).resize(800, 450, { fit: 'cover', position: 'attention' }).webp({ quality: q }).toBuffer();
  chosen = { buf, q };
  if (buf.length <= 150 * 1024) break;
}
fs.writeFileSync(OUT, chosen.buf);
console.log(`  placed ${OUT} 800x450 q${chosen.q} ${(chosen.buf.length / 1024).toFixed(0)}KB`);
console.log('  raw:', raw, '-> inspect before accepting');
