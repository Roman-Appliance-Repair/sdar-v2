// gen-sb-hero-people-2026-08-06.mjs — Stage F: technician hero photos for the 6
// Santa Barbara County CITY pages (county hub keeps its no-people establishing
// shot — it already matches its scene direction verbatim).
//
// Character: Roman reference crops (photo-pipeline §4 decision 2026-07-15 —
// on-photo person = Roman; "Artur S." remains the text-content name). Refs are
// passed as inlineData BEFORE the prompt, same as gen-roman-weho-2026-07-15.mjs.
//
// Hard rules (task + photo-pipeline §6/§8.1): ONE person, intact CLOSED
// appliance, residential interior, zero readable text anywhere, subject in the
// RIGHT half with the left ~40% calm for the hero text overlay.
//
// Output: overwrites public/images/cities/{slug}/ 6-file adaptive sets
// (hero/‑960/‑640 × webp+jpg, 1920×900), metadata stripped by sharp.
// Usage: node scripts/gen-sb-hero-people-2026-08-06.mjs [slug]
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const REFDIR = 'C:/Users/Roman/WebstormProjects/sdar-v2/reference-photos/roman';
const RAW = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/97a32707-095b-4db5-bac9-10c1ba0cb391/scratchpad/sb-hero-people';
fs.mkdirSync(RAW, { recursive: true });

const REFS = ['ref-01.jpg', 'ref-02.jpg', 'ref-03.jpg'];

const IDENTITY = `The technician's FACE must match the man in the reference photographs provided above: same man, same facial structure, same short dark brown hair receding slightly at the temples, same short dark stubble beard, same brow and eyes, European features, athletic build, late thirties. Keep his likeness recognisable and consistent — this is a specific real person, not a generic model. Natural, anatomically correct, undistorted face and hands with the right number of fingers.`;
const NOTEXT = `CRITICAL: the entire image is completely free of any writing — every surface, appliance, wall and garment is BLANK and unbranded, with NO logo, NO brand name, NO model number, NO badge, NO nameplate, NO control-panel lettering, NO stickers, NO signage, NO printed or engraved characters, NO watermarks anywhere. The uniform is plain and unmarked: no patches, no name tag, no embroidery.`;
const SOLO = `EXACTLY ONE person is in the frame — the technician, alone. NO second person, NO customer, NO homeowner, NO bystander, NO extra hands, arms, legs, faces or reflections of anyone else anywhere in the frame including the edges and the background. He is in a solo working pose, attention on his own work, NOT gesturing or looking at anyone.`;
const WARDROBE = `He wears a plain dark navy short-sleeve work polo and a plain dark navy cap.`;
const COMP = `Composition: the technician and the appliance occupy the RIGHT half of the frame, in sharp focus; the LEFT ~40 percent of the frame is calmer, simpler background with negative space. The appliance is FULLY INTACT and completely CLOSED — doors shut, every panel on, NOTHING disassembled, no exposed parts, no removed grille, no parts or clutter on the floor. Nothing is being carried, moved, loaded or delivered.`;
const STRICT = ` The cap is COMPLETELY plain solid navy fabric with NO emblem, NO squiggle, NO stitching pattern, NO mark of any kind. The appliance face is completely blank: NO nameplate, NO badge, NO metallic plate, NO control-panel lettering or printed rows of any kind — controls are unlabeled. `;
const STYLE = ` Photorealistic documentary photograph, natural realistic interior light, NOT AI-glossy, no HDR sheen. Eye level, DSLR 35mm, 2K.`;

const SCENES = {
  'santa-barbara': `An appliance repair technician stands with a digital multimeter in a tight galley kitchen inside a 1920s Spanish Revival home in Santa Barbara — an arched doorway at one end, hand-painted ceramic tile backsplash in faded blues and terracotta, thick plastered white walls, dark wood beams, a closed built-in refrigerator with COMPLETELY SMOOTH BLANK stainless doors — no plate, no label, no marking of any size anywhere on it — fitted snugly into old cabinetry beside him. He faces the refrigerator with the BACK of his cap toward the camera side, cap fabric entirely uniform navy. ${COMP} ${WARDROBE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  'montecito': `An appliance repair technician stands holding a digital multimeter beside a large closed professional-style range in an understated Montecito estate kitchen — tall steel-framed windows with mature coast live oak trees visible outside, honed marble island, warm neutral cabinetry, quiet old-money restraint rather than glitz. ${COMP} ${WARDROBE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  'goleta': `An appliance repair technician stands in the RIGHT THIRD of the frame with a screwdriver in hand beside a closed ordinary white refrigerator in a bright, modest postwar tract-home kitchen in Goleta — plain laminate counters, simple white cabinets, a sunny window over the sink, cheerful and completely unfancy. ${COMP} ${WARDROBE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  'carpinteria': `An appliance repair technician stands with a digital multimeter beside a closed front-load washing machine in a casual beach-cottage laundry nook in Carpinteria — light whitewashed wood plank walls, driftwood tones, a woven basket, soft coastal daylight through a small curtained window. ${COMP} ${WARDROBE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  'summerland': `An appliance repair technician stands with a screwdriver in a compact, narrow cottage kitchen in Summerland — older painted wood cabinets with vintage hardware, a small closed freestanding range fitted between them, low ceiling, cozy and slightly worn fixtures from decades of village life. ${COMP} ${WARDROBE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
  'hope-ranch': `An appliance repair technician stands with a digital multimeter beside a closed stainless undercounter refrigerator built into a bar counter in a Hope Ranch pool-house kitchen — a light, airy secondary kitchen with glass doors to a sunlit patio, simple stone counter, the relaxed feel of an estate outbuilding rather than a main residence. ${COMP} ${WARDROBE} ${SOLO} ${IDENTITY} ${NOTEXT}`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 10000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };
const refParts = () => REFS.map((f) => ({ inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(path.join(REFDIR, f)).toString('base64') } }));

async function gen(slug, attempt) {
  const out = path.join(RAW, `${slug}-a3.png`);
  const body = JSON.stringify({
    contents: [{ parts: [...refParts(), { text: SCENES[slug] + STRICT + STYLE }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } },
  });
  for (let tries = 1; tries <= 6; tries++) {
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
    if (!isValidPng(out)) { console.error(`  bad PNG`); await sleep(2000); continue; }
    return out;
  }
  return null;
}

// Place a QC-approved raw png into the 6-file adaptive set. Quality steps down
// until hero.webp ≤ 150 KB (photo-pipeline §8 target), floor q55.
export async function place(rawPath, slug) {
  const dir = path.join('public', 'images', 'cities', slug);
  fs.mkdirSync(dir, { recursive: true });
  let q = 72, size = Infinity;
  while (q >= 55) {
    await sharp(rawPath).rotate().resize(1920, 900, { fit: 'cover', position: 'centre' }).webp({ quality: q }).toFile(path.join(dir, 'hero.webp'));
    size = fs.statSync(path.join(dir, 'hero.webp')).size / 1024;
    if (size <= 150) break;
    q -= 5;
  }
  for (const [w, name] of [[960, 'hero-960'], [640, 'hero-640']]) {
    const h = Math.round(w * 900 / 1920);
    await sharp(rawPath).rotate().resize(w, h, { fit: 'cover', position: 'centre' }).webp({ quality: Math.max(q - 2, 55) }).toFile(path.join(dir, `${name}.webp`));
    await sharp(rawPath).rotate().resize(w, h, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
  }
  await sharp(rawPath).rotate().resize(1920, 900, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(dir, 'hero.jpg'));
  return `${size.toFixed(0)}KB@q${q}`;
}

const mode = process.argv[2];
if (mode === '--place') {
  // --place slug rawfile : promote an approved attempt
  const [, , , slug, raw] = process.argv;
  console.log(`placed ${slug}: hero.webp ${await place(raw, slug)}`);
} else {
  const slugs = mode ? [mode] : Object.keys(SCENES);
  for (const slug of slugs) {
    process.stdout.write(`gen ${slug} ... `);
    const raw = await gen(slug, 1);
    console.log(raw ? `ok -> ${raw}` : 'FAIL');
    await sleep(1500);
  }
  console.log('\nRaw attempts ready for visual QC. Nothing placed yet.');
}
