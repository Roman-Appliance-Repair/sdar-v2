// Stage A San Diego: branch schema-image hero set. No city page yet — this set
// exists so HomepageSchema's /images/cities/san-diego/hero.jpg resolves to real
// bytes (recon correction #2). Reused later by the Wave-2 city page.
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const RAW = 'C:/Users/Roman/AppData/Local/Temp/claude/C--Users-Roman/97a32707-095b-4db5-bac9-10c1ba0cb391/scratchpad/sd-hero.png';
const PROMPT = `Sweeping coastal view of La Jolla, San Diego, California from a bluff-top path: rugged sandstone cliffs and coves with turquoise Pacific water, palm trees leaning over the walkway, white Mediterranean-style homes with terracotta roofs stepping up the hillside, the curve of the coastline fading north into haze. Empty path. CRITICAL: absolutely NO readable text anywhere — no signs, no lettering, no license plates, no logos. No people, no faces, no cars in the foreground. Ultra-wide cinematic establishing shot, photorealistic, DSLR 35mm, warm late-afternoon golden-hour light, editorial travel-photography look, NOT AI-glossy. 2K.`;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const body = JSON.stringify({ contents: [{ parts: [{ text: PROMPT }] }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '16:9' } } });
let ok = false;
for (let a = 1; a <= 8 && !ok; a++) {
  let resp; try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); } catch (e) { console.error('net', e.message); await sleep(4000); continue; }
  if ([429, 500, 503].includes(resp.status)) { await sleep(9000); continue; }
  const j = await resp.json();
  const img = (j?.candidates?.[0]?.content?.parts || []).find(p => p.inlineData)?.inlineData;
  if (!img) { console.error('no image', j?.candidates?.[0]?.finishReason); await sleep(3000); continue; }
  fs.writeFileSync(RAW, Buffer.from(img.data, 'base64')); ok = true;
}
if (!ok) { console.log('FAIL'); process.exit(1); }
const dir = path.join('public', 'images', 'cities', 'san-diego'); fs.mkdirSync(dir, { recursive: true });
for (const [w, name] of [[1920, 'hero'], [960, 'hero-960'], [640, 'hero-640']]) {
  const h = Math.round(w * 900 / 1920);
  await sharp(RAW).rotate().resize(w, h, { fit: 'cover', position: 'centre' }).webp({ quality: 72 }).toFile(path.join(dir, `${name}.webp`));
  await sharp(RAW).rotate().resize(w, h, { fit: 'cover', position: 'centre' }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(dir, `${name}.jpg`));
}
console.log('placed san-diego hero set:', (fs.statSync(path.join(dir, 'hero.webp')).size / 1024).toFixed(0) + 'KB');
