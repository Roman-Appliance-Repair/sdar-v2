// SD Stage B hero sets: county hub + la-jolla + rancho-santa-fe + carlsbad.
// No-people establishing shots, distinct scenes, no readable text.
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const RAW = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/97a32707-095b-4db5-bac9-10c1ba0cb391/scratchpad/sd-b';
fs.mkdirSync(RAW, { recursive: true });
const NOTX = 'CRITICAL: absolutely NO readable text anywhere — no signs, no lettering, no license plates, no logos. No people, no faces, no cars in the foreground.';
const STYLE = ' Ultra-wide cinematic establishing shot, photorealistic, DSLR 35mm, warm late-afternoon golden-hour light, editorial travel-photography look, NOT AI-glossy. 2K.';
const JOBS = [
  { out: ['public','images','counties','san-diego-county'], ar: '21:9', w: 840/1920,
    prompt: `Sweeping view along the North San Diego County coastline: golden sandstone bluffs dropping to a long straight beach, a coastal lagoon opening to the sea, low coastal scrub and torrey pines on the headland, small beach towns dotted along the shore fading south into haze. ${NOTX}` },
  { out: ['public','images','cities','la-jolla'], ar: '16:9', w: 900/1920,
    prompt: `Charming village street in La Jolla, California: 1920s Spanish and Mediterranean revival buildings with white stucco, arched colonnades and red tile roofs, lush bougainvillea, palm trees, a glimpse of turquoise cove water at the end of the lane between buildings. Empty street. ${NOTX}` },
  { out: ['public','images','cities','rancho-santa-fe'], ar: '16:9', w: 900/1920,
    prompt: `Quiet estate lane in Rancho Santa Fe, California: towering eucalyptus trees lining a winding country road, low white rail fencing along dry golden pastures, olive and citrus trees, a distant hacienda-style rooftop among mature landscaping, inland dry-country light. No vehicles, no horses in the foreground. ${NOTX}` },
  { out: ['public','images','cities','carlsbad'], ar: '16:9', w: 900/1920,
    prompt: `Sunny suburban coastal scene in Carlsbad, California: a tidy residential street of mixed beach cottages and newer Spanish-style tract homes descending gently toward the Pacific, flowering hillside in the middle distance, palms and the ocean horizon beyond. Empty street. ${NOTX}` },
];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const valid = (p) => { try { const b = fs.readFileSync(p); return b.length > 10000 && b[0] === 0x89; } catch { return false; } };
async function gen(raw, prompt, ar) {
  const body = JSON.stringify({ contents: [{ parts: [{ text: prompt + STYLE }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: ar } } });
  for (let a = 1; a <= 10; a++) {
    let r; try { r = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); } catch { await sleep(4000); continue; }
    if ([429,500,503].includes(r.status)) { await sleep(9000); continue; }
    const j = await r.json();
    const img = (j?.candidates?.[0]?.content?.parts || []).find(p => p.inlineData)?.inlineData;
    if (!img) { await sleep(3000); continue; }
    fs.writeFileSync(raw, Buffer.from(img.data, 'base64'));
    if (valid(raw)) return true;
  }
  return false;
}
for (const job of JOBS) {
  const slug = job.out[job.out.length - 1];
  const raw = path.join(RAW, slug + '.png');
  process.stdout.write(`gen ${slug} ... `);
  console.log(await gen(raw, job.prompt, job.ar) ? 'ok' : 'FAIL');
  const dir = path.join(...job.out); fs.mkdirSync(dir, { recursive: true });
  for (const [w, name] of [[1920,'hero'],[960,'hero-960'],[640,'hero-640']]) {
    const h = Math.round(w * job.w);
    await sharp(raw).rotate().resize(w, h, { fit: 'cover', position: 'centre' }).webp({ quality: 72 }).toFile(path.join(dir, name + '.webp'));
    await sharp(raw).rotate().resize(w, h, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(dir, name + '.jpg'));
  }
  console.log('  placed', (fs.statSync(path.join(dir,'hero.webp')).size/1024).toFixed(0)+'KB');
  await sleep(1200);
}
