// scripts/gen-photo-pilot-2026-07-15.mjs — Photo pilot (Variant A).
//
// Scope: 7 deployed images.
//   west-hollywood : neighborhood + luxury-repair + property-managers  (page already wired)
//   bh/la/sm/pas   : neighborhood only  (no people -> independent of the open §4
//                    reference-face decision; no prose -> no content duplication)
//
// Character consistency (docs/photo-pipeline.md §4 + §6.6):
//   §4's reference-photo decision is still open ("генерить AI на старте или Roman
//   даст реальные фото") and NO reference exists on disk. Text-only prompts render a
//   different man every call — the two WeHo people-slots would show two different
//   "Mikhail V." on the SAME page. So we generate a character sheet ONCE and pass it
//   back as an input image, which is what Gemini's character-consistency path expects.
//   PROVISIONAL: if Roman supplies real technician photos, drop the sheet and re-run.
//   WeHo -> Mikhail V. per §4 branch assignment (WeHo/BH/LA = Mikhail).
//
// Rules enforced in prompts: exactly ONE person, no interaction poses (§8.1 people
// rule), no readable brands/logos/model plates (§6.1/§6.2), no people or cars in the
// neighborhood shots (§3 Template 2), varied architecture per city (§6.4).
// §8.1 subject-right/clean-left does NOT apply here — that rule is for ServiceHero
// MODE A, which overlays a text card. These slots render bare, no overlay.
//
// Run: node scripts/gen-photo-pilot-2026-07-15.mjs

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// secrets/ is gitignored, so it exists only in the main checkout — a worktree
// carries tracked files only. Fall back there when running from a worktree.
const KEY_PATHS = [
  'secrets/gemini-key.txt',
  'C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt',
];
const KEY_PATH = KEY_PATHS.find((p) => fs.existsSync(p));
if (!KEY_PATH) throw new Error('gemini key not found in: ' + KEY_PATHS.join(', '));
const KEY = fs.readFileSync(KEY_PATH, 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const STAGE = 'scripts/photo-staging';
fs.mkdirSync(STAGE, { recursive: true });

const NOTX =
  'CRITICAL: absolutely NO readable brand name, NO logo, NO model-number plate, NO badge, NO signage and NO text anywhere in frame.';
const SOLO =
  'CRITICAL: EXACTLY ONE person in frame — the technician, alone. No second person, no customer, no bystander, no hands or limbs belonging to anyone else, anywhere in frame including the edges. No handshake, no gesturing at someone, no looking off toward anyone. Solo working pose, attention on his own work.';
const UNIFORM =
  'He wears a plain dark navy work polo and a plain dark cap, no readable text on the clothing.';

// §4 character #1 — the sheet all WeHo people-shots are conditioned on.
const MIKHAIL =
  'Photorealistic portrait character reference sheet of ONE man: a serious-looking appliance repair technician, early 40s, athletic build, short dark hair, clean-shaven, neutral expression, looking straight at camera. ' +
  UNIFORM +
  ' Plain light grey studio background, even soft lighting, sharp focus, head and shoulders. Photorealistic DSLR 50mm portrait. No text anywhere.';

// slot -> [width, height] exactly as the components declare them
const DIMS = {
  neighborhood: [1200, 500], // NeighborhoodPhoto.astro img width/height
  'luxury-repair': [800, 450], // LuxurySpecialists.astro
  'property-managers': [540, 320], // PropertyManagers.astro
};

const ARCH = {
  'west-hollywood':
    'vintage 1920s Spanish-style low-rise apartment buildings with art-deco detailing, mature street trees',
  'beverly-hills':
    'a wide palm-lined street of Spanish Revival estates behind immaculately manicured hedges',
  'los-angeles':
    'a Westside residential street mixing craftsman bungalows with low mid-century apartment blocks',
  'santa-monica':
    'craftsman homes on a leafy street north of Montana Avenue, a few blocks from the ocean',
  pasadena:
    'historic craftsman houses with deep shaded porches, the San Gabriel Mountains rising in the background',
};

// Neighborhood — Template 2. No people, no cars in foreground, golden hour.
const neighborhoodPrompt = (city) =>
  `A quiet residential street in ${city}, California: ${ARCH[city]}. ` +
  'CRITICAL: absolutely NO people and NO cars in the foreground. Warm late-afternoon golden-hour light, clear California sky. ' +
  'Photorealistic, DSLR 35mm, eye level, wide establishing shot showing the depth of the street. ' +
  NOTX +
  ' 2K.';

// Luxury — technician + INTACT premium appliance, no disassembly.
const LUXURY_PROMPT =
  'Photorealistic photo of ONE appliance repair technician — the same man as the reference image, same face, same build — holding a digital multimeter and checking a fully assembled, completely intact built-in stainless-steel refrigerator in an upscale bright kitchen with marble counters and custom cabinetry. ' +
  'The appliance is closed and undamaged: nothing is disassembled, no panels removed, no tools inside the unit, no parts on the floor. He stands beside it looking at the multimeter reading. ' +
  UNIFORM +
  ' ' +
  SOLO +
  ' Soft natural daylight, DSLR 50mm, slightly above shoulder height. ' +
  NOTX +
  ' 2K.';

// Property managers — technician + tablet at a multi-unit entrance.
const propertyPrompt = (city) =>
  'Photorealistic photo of ONE appliance repair technician — the same man as the reference image, same face, same build — standing at the entrance of a multi-unit residential apartment building, holding a tablet and looking down at it, a canvas tool bag on the ground beside him. ' +
  `The building matches ${city}, California: ${ARCH[city]}. ` +
  UNIFORM +
  ' ' +
  SOLO +
  ' Warm natural daylight, DSLR 35mm, eye level. ' +
  NOTX +
  ' 2K.';

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

/** @param refPath optional character sheet -> conditions the render on that face */
async function gen(outPath, prompt, aspectRatio, refPath) {
  const parts = [];
  if (refPath) {
    parts.push({
      inlineData: { mimeType: 'image/png', data: fs.readFileSync(refPath).toString('base64') },
    });
  }
  parts.push({ text: prompt });
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } },
  });

  let calls = 0;
  for (let a = 1; a <= 16 && calls < 4; a++) {
    let resp;
    try {
      resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    } catch (e) {
      console.error('   net', e.message);
      await sleep(4000);
      continue;
    }
    if ([429, 500, 503].includes(resp.status)) {
      const t = await resp.text();
      const m = t.match(/retry in ([\d.]+)s/i);
      const w = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 9000;
      console.error(`   HTTP ${resp.status} — wait ${Math.round(w / 1000)}s`);
      await sleep(w);
      continue;
    }
    const j = await resp.json();
    calls++;
    if (resp.status !== 200) {
      console.error('   HTTP', resp.status, j?.error?.message);
      await sleep(3000);
      continue;
    }
    const img = (j?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) {
      console.error('   no image, finishReason=', j?.candidates?.[0]?.finishReason);
      await sleep(3000);
      continue;
    }
    fs.writeFileSync(outPath, Buffer.from(img.data, 'base64'));
    if (!validPng(outPath)) {
      console.error('   bad png');
      await sleep(2000);
      continue;
    }
    return true;
  }
  return false;
}

/** crop to the slot's exact box + webp, tuned into the 80-150KB band, metadata stripped */
async function place(rawPath, slug, slotType) {
  const [w, h] = DIMS[slotType];
  const dir = path.join('public', 'images', 'cities', slug);
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, `${slotType}.webp`);

  // Walk DOWN from max quality and take the first that fits the 150KB ceiling, so
  // each slot gets the best quality its byte budget allows. (Walking up from a low
  // q and breaking on the first fit under-uses the budget badly on the small slots —
  // 800x450 landed at 18KB/q86 that way.)
  let chosen = null;
  for (const q of [95, 92, 88, 84, 80, 74, 68, 62, 56, 50]) {
    // sharp drops all input metadata unless .withMetadata() is called — we never call it
    const buf = await sharp(rawPath)
      .resize(w, h, { fit: 'cover', position: 'attention' })
      .webp({ quality: q })
      .toBuffer();
    chosen = { buf, q, kb: buf.length / 1024 };
    if (buf.length <= 150 * 1024) break;
  }
  fs.writeFileSync(out, chosen.buf);
  return { out, ...chosen, w, h };
}

const JOBS = [
  { slug: 'west-hollywood', slot: 'neighborhood', ar: '21:9', ref: false },
  { slug: 'west-hollywood', slot: 'luxury-repair', ar: '16:9', ref: true },
  { slug: 'west-hollywood', slot: 'property-managers', ar: '16:9', ref: true },
  { slug: 'beverly-hills', slot: 'neighborhood', ar: '21:9', ref: false },
  { slug: 'los-angeles', slot: 'neighborhood', ar: '21:9', ref: false },
  { slug: 'santa-monica', slot: 'neighborhood', ar: '21:9', ref: false },
  { slug: 'pasadena', slot: 'neighborhood', ar: '21:9', ref: false },
];

const promptFor = (slug, slot) =>
  slot === 'neighborhood'
    ? neighborhoodPrompt(slug)
    : slot === 'luxury-repair'
      ? LUXURY_PROMPT
      : propertyPrompt(slug);

// ── 1. character sheet (staging only — never deployed) ──────────────────────
const sheet = path.join(STAGE, '_ref-mikhail.png');
if (!fs.existsSync(sheet)) {
  console.log('Character sheet — Mikhail V. (§4 #1)');
  if (!(await gen(sheet, MIKHAIL, '1:1'))) {
    console.error('FAILED: character sheet — cannot hold faces consistent. Aborting.');
    process.exit(1);
  }
  console.log('  ok ->', sheet, (fs.statSync(sheet).size / 1024).toFixed(0) + 'KB\n');
  await sleep(2000);
} else {
  console.log('Character sheet exists, reusing:', sheet, '\n');
}

// ── 2. the 7 deployed images ────────────────────────────────────────────────
const results = [];
for (const j of JOBS) {
  const raw = path.join(STAGE, `${j.slug}__${j.slot}.png`);
  process.stdout.write(`${j.slug} / ${j.slot} ... `);
  const ok = await gen(raw, promptFor(j.slug, j.slot), j.ar, j.ref ? sheet : null);
  if (!ok) {
    console.log('FAILED');
    results.push({ ...j, ok: false });
    await sleep(2000);
    continue;
  }
  const p = await place(raw, j.slug, j.slot);
  console.log(`ok  ${p.w}x${p.h}  q${p.q}  ${p.kb.toFixed(0)}KB`);
  results.push({ ...j, ok: true, ...p });
  await sleep(2000); // task: 2s between calls
}

console.log('\n── RESULT ──');
const good = results.filter((r) => r.ok);
console.log(`${good.length}/${JOBS.length} generated`);
for (const r of good) console.log(`  ${r.out.padEnd(52)} ${r.w}x${r.h}  ${r.kb.toFixed(0)}KB  q${r.q}`);
const bad = results.filter((r) => !r.ok);
if (bad.length) {
  console.log('\nFAILED:');
  for (const r of bad) console.log('  ' + r.slug + ' / ' + r.slot);
}
