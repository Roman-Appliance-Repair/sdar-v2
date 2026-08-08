// scripts/gen-neighborhood-wave5-2026-08-07.mjs
// Photo wave 5 — neighborhood backgrounds for the 12 new SB + SD city pillars.
// Skeleton = gen-neighborhood-wave1-2026-07-15.mjs (Template 2 + §6 anti-detection +
// per-city varied camera geometry). Scene briefs per the parity task.
//
// Usage: node scripts/gen-neighborhood-wave5-2026-08-07.mjs [slug ...]  (default: all 12)
//        node scripts/gen-neighborhood-wave5-2026-08-07.mjs --place     (copy approved a1 to public/)
// Staging: %TMP%/nbhd-wave5. Nothing lands in public/ until --place.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const STAGING = path.join(os.tmpdir(), 'nbhd-wave5');
fs.mkdirSync(STAGING, { recursive: true });

const NOTEXT = `CRITICAL: the image contains NO writing of any kind — no street signs, no house numbers, no address plaques, no shop signage, no banners, no license plates, no logos, no watermarks, no printed or engraved characters anywhere on any surface.`;

const BASE = `Quiet residential street in %CITY%, California. %ARCH% NO people anywhere in the frame. NO cars, trucks or vehicles in the foreground. %LIGHT% Photorealistic documentary photograph, DSLR 35mm, eye level, natural realistic light, NOT AI-glossy, no HDR sheen. Wide establishing shot showing the depth of the street. %COMP% ${NOTEXT} 2K.`;

const GOLDEN = 'Warm afternoon golden-hour light, long soft shadows, clear California sky.';

const CITIES = {
  'santa-barbara': {
    arch: 'Spanish Colonial Revival houses with white stucco walls, red clay tile roofs and arched facades, bougainvillea over garden walls, mature palms.',
    comp: 'Camera at a shallow diagonal ACROSS the street so a run of arched stucco facades and red tile rooflines steps left-to-right through the frame; no centred vanishing point.',
    light: GOLDEN,
  },
  montecito: {
    arch: 'A narrow oak-lined estate lane, high clipped hedges and low sandstone walls, a pair of understated wrought-iron estate gates far in the distance, everything green and shaded.',
    comp: 'Tight lane fully enclosed by a coast-live-oak CANOPY overhead — dappled light, the lane curving gently away, the distant gates small and secondary.',
    light: 'Soft mid-morning light filtering through the oak canopy, cool shade with warm patches.',
  },
  goleta: {
    arch: 'Modest post-war single-storey tract houses, flat rooflines, plain stucco, small tidy lawns, an ordinary flat suburban street.',
    comp: 'Dead-flat straight residential street under a low MARINE-LAYER overcast; the far end of the street softens into fog. Muted, even, grey-cool light — deliberately the plainest frame of the set.',
    light: 'Low marine-layer overcast, soft shadowless grey light, the street fading into thin fog.',
  },
  carpinteria: {
    arch: 'Small single-storey beach cottages with low rooflines, salt-faded paint, picket and low block fences, sandy verges.',
    comp: 'Camera looking straight down the street to where it ENDS at a small bright band of ocean and sky between the last cottages; ocean glimpse is the payoff of the frame.',
    light: GOLDEN,
  },
  summerland: {
    arch: 'Small hillside cottages stacked above the ocean, narrow lanes, mixed rooflines, flowering shrubs against fences.',
    comp: 'Camera looking DOWNHILL along a narrow lane, cottage rooftops stepping below the road line and a wide band of ocean and haze beyond them in the upper third.',
    light: GOLDEN,
  },
  'hope-ranch': {
    arch: 'A broad avenue under towering eucalyptus and coast live oak, WHITE three-rail equestrian fencing running along both sides, deep lawns, houses invisible behind the trees.',
    comp: 'The white rail FENCE is the leading line — camera low beside it, fence receding along the right side under the eucalyptus colonnade; no houses visible.',
    light: 'Late-afternoon light in long bars between the eucalyptus trunks.',
  },
  'la-jolla': {
    arch: 'Mediterranean-style coastal homes with white walls and tile roofs on a street along the top of an ocean bluff, wind-shaped Torrey pines.',
    comp: 'Camera at the bluff edge of the street: houses on the LEFT half, and on the right the ground falls away to blue Pacific and coastline haze; horizon in the upper third.',
    light: 'Bright clear coastal mid-afternoon light with sea haze softening the distance.',
  },
  'rancho-santa-fe': {
    arch: 'A gated country lane through dry golden hills, tall blue-gum eucalyptus in loose rows, low white ranch fencing, a distant private gate, horse-country openness.',
    comp: 'WIDE dry-country frame: the lane runs diagonally from lower-right toward a far gate at mid-left, golden hills rolling behind; eucalyptus shadows cross the lane.',
    light: 'Dry inland golden-hour light, warmer and dustier than the coastal frames.',
  },
  carlsbad: {
    arch: 'A street where older coastal village cottages in the foreground give way to newer master-planned two-storey homes with tile roofs further up the block — two housing generations on one street.',
    comp: 'Camera framing the OLD/NEW seam: weathered cottage and picket fence large in the left foreground, the uniform newer tile rooflines rising smaller in the right background.',
    light: GOLDEN,
  },
  'del-mar': {
    arch: 'Bluff-top beach-colony houses, shingle and white-trim, closed shutters and empty porches, sandy lane, ocean haze beyond the roofline — a beach town in its quiet season.',
    comp: 'Still, EMPTY off-season mood: camera centred on a short sandy lane, houses shuttered and quiet on both sides, pale ocean haze glowing past the end of the lane.',
    light: 'Soft pale late-morning coastal light, slightly overcast, gentle contrast.',
  },
  encinitas: {
    arch: 'Older craftsman surf bungalows on a coastal side street, low porches, mature jacarandas and palms, a surfboard leaning against one porch rail, dry garden planting.',
    comp: 'Low camera close to a bungalow porch on the LEFT with the surfboard detail, street receding shallowly to the right; relaxed surf-town texture, not a grand avenue.',
    light: GOLDEN,
  },
  'solana-beach': {
    arch: 'A compact coastal street of small closely-spaced contemporary buildings — clean gallery-like stucco and timber facades, courtyard gaps, design-district character, dense but low-rise.',
    comp: 'Tight URBAN-VILLAGE compression: facades close on both sides, short sightline ending at a cross-street, layered planes rather than open depth. The densest frame of the set.',
    light: 'Bright even coastal midday light with crisp small shadows.',
  },
};

const SIZE = [1200, 500];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

const promptFor = (slug) => BASE
  .replace('%CITY%', slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '))
  .replace('%ARCH%', CITIES[slug].arch)
  .replace('%COMP%', CITIES[slug].comp)
  .replace('%LIGHT%', CITIES[slug].light);

async function genOne(slug, attempt) {
  const out = path.join(STAGING, `${slug}-a${attempt}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: promptFor(slug) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let tries = 1; tries <= 4; tries++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${slug} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * tries;
      console.error(`  ${slug} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${slug} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${slug} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${slug} bad PNG, retry`); await sleep(2000); continue; }
    await sharp(out).resize(SIZE[0], SIZE[1], { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 }).toFile(path.join(STAGING, `${slug}-a${attempt}-preview.jpg`));
    console.log(`ok ${slug} a${attempt} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    return true;
  }
  console.error(`FAIL ${slug} a${attempt}`);
  return false;
}

// --place: newest valid attempt per slug -> public/images/cities/{slug}/neighborhood.webp
// Same encode ladder as gen-photo-pilot place(): best quality under the 150KB ceiling.
if (process.argv.includes('--place')) {
  for (const slug of Object.keys(CITIES)) {
    const cands = fs.readdirSync(STAGING)
      .filter((f) => f.startsWith(slug + '-a') && f.endsWith('.png'))
      .sort();
    if (!cands.length) { console.error(`no staging for ${slug}`); continue; }
    const raw = path.join(STAGING, cands[cands.length - 1]);
    const dir = path.join('public', 'images', 'cities', slug);
    fs.mkdirSync(dir, { recursive: true });
    let chosen = null;
    for (const q of [95, 92, 88, 84, 80, 74, 68, 62, 56, 50]) {
      const buf = await sharp(raw).resize(SIZE[0], SIZE[1], { fit: 'cover', position: 'center' }).webp({ quality: q }).toBuffer();
      chosen = { buf, q };
      if (buf.length <= 150 * 1024) break;
    }
    const out = path.join(dir, 'neighborhood.webp');
    fs.writeFileSync(out, chosen.buf);
    console.log(`placed ${out} q${chosen.q} ${(chosen.buf.length / 1024).toFixed(0)}KB (from ${cands[cands.length - 1]})`);
  }
  process.exit(0);
}

const list = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const slugs = list.length ? list : Object.keys(CITIES);
for (const slug of slugs) {
  if (!CITIES[slug]) { console.error(`unknown slug: ${slug}`); process.exit(1); }
  const attempts = fs.readdirSync(STAGING).filter((f) => f.startsWith(slug + '-a') && f.endsWith('.png')).length;
  await genOne(slug, attempts + 1);
  await sleep(2000);
}
console.log(`\nStaging: ${STAGING}`);
