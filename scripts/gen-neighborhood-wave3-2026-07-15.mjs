// scripts/gen-neighborhood-wave3-2026-07-15.mjs
// Photo wave 3 — neighborhood section backgrounds, 20 cities.
// Template 2 (docs/photo-pipeline.md §3) + §6 anti-detection, 21:9 -> 1200x500.
//
// City list derived from the ACTUAL tree, not memory: 87 root pillars carrying
// CityLayoutV2, minus the 39 already holding a bgImage = 48 remaining. The five GMB
// roadmap cities among them (chino-hills, ontario, upland, fontana, murrieta — named
// in docs/gmb-strategy.md) go first; the rest follow in file order.
//
// COMPOSITION is now the hard part. 39 photos are already shipped and between them
// they have used most of the obvious framings: the straight palm avenue, the curving
// hill, the canyon bend, the walk street, the tree canopy, the dominant foothills,
// the cul-de-sac, the elevated tract, the corner, the stairway, the utility-pole line,
// the bungalow court, the big empty sky. Reusing any of those makes two cities look
// like the same place. Every frame below is a geometry NOT yet in the set — a median
// strip, a river channel, a field edge, a row of mailboxes, an open gate, a rooftop
// sea seen from a ridge, a bluff looking down onto a harbour.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const STAGING = path.join(os.tmpdir(), 'nbhd-wave3');
fs.mkdirSync(STAGING, { recursive: true });

const NOTEXT = `CRITICAL: the image contains NO writing of any kind — no street signs, no house numbers, no address plaques, no shop signage, no banners, no license plates, no logos, no watermarks, no printed or engraved characters anywhere on any surface.`;

const BASE = `Quiet residential street in %CITY%, California. %ARCH% NO people anywhere in the frame. NO cars, trucks or vehicles in the foreground. Warm afternoon golden-hour light, long soft shadows. Photorealistic documentary photograph, DSLR 35mm, eye level, natural realistic light, NOT AI-glossy, no HDR sheen. %COMP% ${NOTEXT} 2K.`;

const CITIES = {
  // ── Inland Empire / GMB roadmap ─────────────────────────────────────────────
  'chino-hills': {
    arch: 'Newer large stucco homes with tile roofs spread across rolling hills, dry golden grass between the ridges, young landscaping, wide clean streets.',
    comp: 'Camera high on a RIDGE looking ACROSS a whole valley of tile rooftops to more hills beyond — a sea of roofs seen from above, no single street in frame.',
  },
  ontario: {
    arch: 'Flat post-war and newer homes on a broad street, a wide grass parkway strip between the sidewalk and the kerb, evenly spaced young trees.',
    comp: 'Camera walking ALONG the wide grass PARKWAY STRIP itself, between sidewalk and kerb — grass fills the lower frame, houses run along the right.',
  },
  upland: {
    arch: 'An older boulevard with a broad landscaped centre median planted with mature trees, historic homes set back on both sides beyond the traffic lanes.',
    comp: 'Camera standing ON the landscaped CENTRE MEDIAN looking down its length, planting either side of the lens, the road lanes flanking it.',
  },
  fontana: {
    arch: 'Modest working single-storey tract homes, a long continuous painted block wall running the length of the street, dry hot light, sparse trees.',
    comp: 'Camera CLOSE to a long BLOCK WALL running away at a sharp angle, one gate set into it, the houses only glimpsed beyond. The wall is the subject.',
  },
  murrieta: {
    arch: 'Newer two-storey homes on gently rolling ground, tile roofs, young trees, dry hills in the far distance.',
    comp: 'Camera at the bottom of a DRIVEWAY looking UP at a house set on a rise above the street — low viewpoint, the house above the lens line.',
  },

  // ── rest, in file order ─────────────────────────────────────────────────────
  'agoura-hills': {
    arch: 'Homes set along the edge of an open grass greenbelt easement, oaks scattered at the margins rather than overhead, chaparral hills behind.',
    comp: 'Camera ACROSS an open GREENBELT of dry grass toward the houses on its far side — foreground is empty open ground, no road at all.',
  },
  alhambra: {
    arch: '1920s California bungalows with low porches and clipped hedges on a flat older grid, mature street trees, short driveways.',
    comp: 'Head-on at a T-JUNCTION: the camera looks straight up the stem of the T at the row of bungalows squarely facing it across the top of the T.',
  },
  arcadia: {
    arch: 'Large newer estate homes behind ornamental wrought-iron gates, manicured lawns, mature pines, the San Gabriel range far behind.',
    comp: 'Camera looking THROUGH AN OPEN WROUGHT-IRON GATE at the house and drive beyond — the gate frames the shot on both sides.',
  },
  'atwater-village': {
    arch: 'Small 1920s and 30s cottages backing onto the concrete channel of the Los Angeles River, a bike path along the top of the bank, willows in the channel.',
    comp: 'Camera ON THE RIVER-CHANNEL BANK looking at the BACKS of the houses across the path — concrete channel in the lower frame, rear elevations beyond.',
  },
  camarillo: {
    arch: 'Newer suburban homes on the edge of the tract where the houses stop and open agricultural fields begin, rows of crops running to the horizon.',
    comp: 'Camera standing IN THE FIELD looking back at the edge of the tract — furrows in the foreground, the houses a low band at the far side.',
  },
  corona: {
    arch: 'Two-storey tract homes packed along the INSIDE of a tightly curving crescent street, tile roofs, low front walls. Mature trees, NOT palms.',
    comp: 'The street CURVES HARD to the right and exits the right edge of the frame within a short distance — the camera sits ON THE INSIDE of the bend so the houses wrap around the lens in an arc. ABSOLUTELY NO straight road, NO vanishing point, NO distant view down the street, NO mountains, NO palm trees, NO open sky above a receding roadway. Tight, enclosed, curving.',
  },
  'dana-point': {
    arch: 'Coastal homes on a bluff above a harbour, low white walls, succulents, boats moored in the basin far below.',
    comp: 'Camera on the BLUFF TOP looking STEEPLY DOWN onto the harbour below — the water is far beneath the lens, houses along the cliff edge in the near frame.',
  },
  'eagle-rock': {
    arch: 'Craftsman and Spanish bungalows sitting below a huge bare sandstone outcrop that rises behind the rooflines, mature trees along the street.',
    comp: 'Camera LOW looking UP past the rooflines at the massive ROCK OUTCROP dominating the sky behind them. The rock, not the street, fills the frame.',
  },
  fullerton: {
    arch: 'Older craftsman and post-war homes on a mature street, a long row of kerbside mailboxes on posts running along the verge, deep front gardens.',
    comp: 'Camera tight on the ROW OF MAILBOXES ON POSTS receding along the verge — posts march through the frame, houses soft behind them.',
  },
  'glassell-park': {
    arch: 'Small stucco and clapboard houses stacked steeply down a hillside, retaining walls, aloes and cactus on the slopes, rooftops layered below.',
    comp: 'Camera HIGH on the hillside looking DOWN onto the ROOFTOPS stacked below — you see roofs and gardens from above, barely any road.',
  },
  hemet: {
    arch: 'Single-storey homes on a very wide flat street with a planted centre island, dry hot light, sparse mature trees, bare mountains far off.',
    comp: 'A very WIDE flat street SPLIT BY A PLANTED CENTRE ISLAND that runs down the middle of the frame, dividing the road in two.',
  },
  'highland-park': {
    arch: 'Craftsman houses raised above a sloping street on stepped concrete retaining walls, each with its own flight of front steps, mature trees.',
    comp: 'Camera along the line of STEPPED CONCRETE RETAINING WALLS and front stairs climbing the slope — the stepping walls are the subject.',
  },
  'la-canada-flintridge': {
    arch: 'Large homes on deep green lots below the San Gabriel Mountains, mature oaks and deodars, dense planting along the street.',
    comp: 'Camera looking THROUGH A GAP in heavy roadside PLANTING — foliage crowds both edges of the frame and the granite mountains show through the opening.',
  },
  'laguna-beach': {
    arch: 'Small art-colony cottages stacked on both walls of a narrow coastal canyon lane, bougainvillea, timber decks, a glimpse of open sea at the bottom.',
    comp: 'A NARROW CANYON LANE falling steeply AWAY from the camera toward a sliver of ocean at the very bottom — cottages tight on both sides, descending.',
  },
  'laguna-niguel': {
    arch: 'Master-planned two-storey homes with uniform tile roofs stepping down a contoured hillside, clipped landscaping, dry hills beyond.',
    comp: 'Camera at a bend where the road CONTOURS around the hillside — the street curves away along the slope and the tile roofs step down beside it.',
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
