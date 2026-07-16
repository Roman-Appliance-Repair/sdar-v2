// scripts/gen-neighborhood-wave2-2026-07-15.mjs
// Photo wave 2 — neighborhood section backgrounds. Same pipeline as wave 1:
// Template 2 (docs/photo-pipeline.md §3) + §6 anti-detection, 21:9 -> 1200x500.
//
// 14 cities, not the briefed 20: santa-clarita, van-nuys, echo-park,
// downtown-los-angeles, hermosa-beach and palos-verdes are NOT pages on this site.
// They are absent from src/pages/, absent from the cities SSOT (whose header defines
// slug = filename of a root .astro page), and prod serves the Cloudflare
// 404->homepage fallback for all six — md5 of each equals the homepage's.
//
// COMPOSITION is the real constraint here. 25 photos already shipped, and six of
// these cities (sherman-oaks, studio-city, encino, woodland-hills, tarzana,
// north-hollywood) are the same San Fernando Valley floor — same ranch houses, same
// flat grid, same light. Left to the model they render as one photo six times. Each
// gets a camera geometry that exists nowhere else in the set, and the already-shipped
// framings are explicitly avoided (bel-air owns the gated canyon curve, beverly-hills
// the symmetrical palm avenue, manhattan-beach the narrow walk street,
// rancho-cucamonga the dominant foothills, brentwood the tree canopy, anaheim the
// corner, thousand-oaks the single dominant oak, irvine the elevated tract).

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const STAGING = path.join(os.tmpdir(), 'nbhd-wave2');
fs.mkdirSync(STAGING, { recursive: true });

const NOTEXT = `CRITICAL: the image contains NO writing of any kind — no street signs, no house numbers, no address plaques, no shop signage, no banners, no license plates, no logos, no watermarks, no printed or engraved characters anywhere on any surface.`;

const BASE = `Quiet residential street in %CITY%, California. %ARCH% NO people anywhere in the frame. NO cars, trucks or vehicles in the foreground. Warm afternoon golden-hour light, long soft shadows. Photorealistic documentary photograph, DSLR 35mm, eye level, natural realistic light, NOT AI-glossy, no HDR sheen. %COMP% ${NOTEXT} 2K.`;

const CITIES = {
  // ── San Fernando Valley floor — the six that must not converge ───────────────
  'sherman-oaks': {
    arch: 'Single-storey 1950s ranch houses south of Ventura Blvd, long low rooflines, wide eaves, mature liquidambar street trees, lawns behind low block walls.',
    comp: 'Camera down LOW at kerb height, almost on the asphalt, looking along a continuous low block wall and hedge line. Ground-level worm view — nothing else in the set is shot this low.',
  },
  'studio-city': {
    arch: 'A two-storey 1960s dingbat apartment building on stilts over an open tuck-under carport, decorative screen block, a ranch house next door.',
    comp: 'Camera from the sidewalk looking slightly UP at the dingbat\'s overhanging second storey and the open carport void beneath it. Upward angle, building fills the upper frame.',
  },
  encino: {
    arch: 'Large single-storey ranch estates on deep lots, long horizontal facades, circular driveways, mature magnolias and pines, generous setbacks.',
    comp: 'Camera standing back at the mouth of a wide circular DRIVEWAY APRON, looking straight across at one long low ranch facade — the house reads as a horizontal band, street barely visible.',
  },
  'woodland-hills': {
    arch: 'Ranch and split-level homes on a street that climbs toward the chaparral-covered Santa Monica Mountains, dry green-grey slopes, eucalyptus.',
    comp: 'Camera at the BOTTOM of a street that RISES away and to the right, so the road climbs out of frame; chaparral ridgeline sits behind the rooflines, not dominating.',
  },
  tarzana: {
    arch: 'Wide flat residential street, ranch houses on unusually deep lots, some white three-rail horse fencing, utility poles and overhead wires running the block, sparse older trees.',
    comp: 'Dead-flat straight street with UTILITY POLES AND OVERHEAD WIRES marching to a distant vanishing point. Dry, plain, no palms, no canopy — the wires are the subject line.',
  },
  'north-hollywood': {
    arch: 'A 1930s bungalow court — six or eight tiny detached stucco cottages facing each other across a shared central garden walkway, no roadway at all.',
    comp: 'Standing at the ENTRANCE of the bungalow court looking down the shared central walkway between the two facing rows of cottages. Enclosed, communal, no street in frame.',
  },

  // ── Eastside hills ──────────────────────────────────────────────────────────
  'silver-lake': {
    arch: 'A steep hillside of mixed 1920s Spanish bungalows and white modernist boxes stacked on the slope, retaining walls, succulents spilling over.',
    comp: 'A long public CONCRETE STAIRWAY climbing steeply between the houses, handrail down the middle, no road anywhere. Vertical, stepped, unique in the set.',
  },
  'los-feliz': {
    arch: 'Craftsman and Spanish-revival homes on a steep street below green wooded parkland hills, deep porches, mature sycamores, stone retaining walls.',
    comp: 'Camera at the foot of a STEEP street looking UP its incline; the road tilts away and the wooded hills close the top of the frame.',
  },
  koreatown: {
    arch: 'A dense block of four- and five-storey 1920s brick and terracotta apartment buildings, fire escapes, arched ground-floor entries, street trees squeezed into the sidewalk.',
    comp: 'Street-level looking UP into the narrow canyon between two tall brick facades — a slot of sky above, walls on both sides. Urban, vertical, unlike any other frame here.',
  },

  // ── South Bay / Orange County ───────────────────────────────────────────────
  'el-segundo': {
    arch: 'Small tidy post-war bungalows on a flat compact grid, short driveways, low chain-link and picket fences, few trees, big open sky.',
    comp: 'Very WIDE FLAT frame with a big empty sky filling the top two-thirds and a low band of small houses across the bottom third. Deliberately plain and horizontal.',
  },
  'redondo-beach': {
    arch: 'Two- and three-storey beach townhomes stepping down toward the shore, balconies, a low bluff edge and the ocean beyond.',
    comp: 'Camera ON THE BLUFF EDGE looking back INLAND at the townhomes rising up the slope, ocean behind the camera not in shot. Reverse of the usual sea view — and not the narrow walk street.',
  },
  'costa-mesa': {
    arch: 'Post-war single-storey tract homes around a quiet cul-de-sac, wide aprons, basketball hoop on a garage, mature ficus.',
    comp: 'Standing in the middle of a CUL-DE-SAC BULB, houses curving around the camera in an arc. Circular geometry — no through-street, no corner.',
  },
  tustin: {
    arch: 'Old Town Tustin — early-1900s cottages and craftsman homes on a mature street, huge old pepper trees, low picket fences, deep front gardens.',
    comp: 'Camera under the drooping fronds of a huge old PEPPER TREE that hangs into the top of the frame, houses glimpsed beneath the hanging foliage.',
  },

  // ── West Valley edge ────────────────────────────────────────────────────────
  calabasas: {
    arch: 'Newer large stucco homes on a flat approach road at the foot of dry golden hills, young landscaping, valley oaks left standing between lots.',
    comp: 'FLAT straight approach to a modern neighbourhood, dry golden hills as a low band behind — open, sunlit and horizontal. NOT a gated canyon curve, no walls, no gate in frame.',
  },
};

const SIZE = [1200, 500];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

const promptFor = (slug) => BASE
  .replace('%CITY%', slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '))
  .replace('%ARCH%', CITIES[slug].arch)
  .replace('%COMP%', CITIES[slug].comp);

async function genOne(slug, attempt) {
  const out = path.join(STAGING, `${slug}-a${attempt}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: promptFor(slug) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let t = 1; t <= 4; t++) {
    let resp;
    try { resp = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    catch (e) { console.error(`  ${slug} net err: ${e.message}`); await sleep(4000); continue; }
    if ([429, 500, 503].includes(resp.status)) {
      const txt = await resp.text(); const m = txt.match(/retry in ([\d.]+)s/i);
      const wait = m ? Math.ceil(parseFloat(m[1]) * 1000) + 1500 : 8000 * t;
      console.error(`  ${slug} HTTP ${resp.status}, wait ${Math.round(wait / 1000)}s`); await sleep(wait); continue;
    }
    const json = await resp.json();
    if (resp.status !== 200) { console.error(`  ${slug} HTTP ${resp.status}: ${json?.error?.message}`); await sleep(3000); continue; }
    const img = (json?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData)?.inlineData;
    if (!img) { console.error(`  ${slug} no image (fr=${json?.candidates?.[0]?.finishReason})`); await sleep(3000); continue; }
    fs.writeFileSync(out, Buffer.from(img.data, 'base64'));
    if (!isValidPng(out)) { console.error(`  ${slug} bad PNG`); await sleep(2000); continue; }
    await sharp(out).resize(SIZE[0], SIZE[1], { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 }).toFile(path.join(STAGING, `${slug}-a${attempt}-preview.jpg`));
    console.log(`✓ ${slug} a${attempt} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
    return true;
  }
  console.error(`✗ ${slug} a${attempt} FAILED`);
  return false;
}

const list = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CITIES);
for (const slug of list) {
  if (!CITIES[slug]) { console.error(`unknown: ${slug}`); process.exit(1); }
  await genOne(slug, 1);
  await sleep(2000);
}
console.log(`\nStaging: ${STAGING}`);
