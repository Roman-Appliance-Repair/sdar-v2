// scripts/gen-neighborhood-wave4-2026-07-16.mjs
// Photo wave 4 — FINAL. The last 28 city pillars without a neighborhood background.
// List derived from the tree: 87 CityLayoutV2 pillars minus the 59 carrying bgImage.
//
// COMPOSITION is maximal-constraint now. 59 photos are shipped and between them they
// have consumed every obvious framing: straight avenue, curving hill, canyon bend,
// walk street, tree canopy, dominant foothills, cul-de-sac, elevated tract, corner,
// stairway, utility poles, bungalow court, big empty sky, rooftop sea, parkway strip,
// centre median, block wall, open greenbelt, T-junction, gate framing, river channel,
// field furrows, hard crescent, bluff-to-harbour, rock outcrop, mailbox row, roofs from
// above, road split by island, stepped walls, gap-in-planting, canyon lane, contour road.
// Every geometry below is one NOT yet in the set. Same-region pairs are deliberately
// split apart (villa-park paddock fence vs yorba-linda raised bridle trail;
// lake-elsinore across-the-water vs westlake-village along-the-waterline).

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const STAGING = path.join(os.tmpdir(), 'nbhd-wave4');
fs.mkdirSync(STAGING, { recursive: true });

const NOTEXT = `CRITICAL: the image contains NO writing of any kind — no street signs, no house numbers, no address plaques, no shop signage, no banners, no license plates, no logos, no watermarks, no printed or engraved characters anywhere on any surface.`;

const BASE = `Quiet residential street in %CITY%, California. %ARCH% NO people anywhere in the frame. NO cars, trucks or vehicles in the foreground. Warm afternoon golden-hour light, long soft shadows. Photorealistic documentary photograph, DSLR 35mm, eye level, natural realistic light, NOT AI-glossy, no HDR sheen. %COMP% ${NOTEXT} 2K.`;

const CITIES = {
  'lake-elsinore': {
    arch: 'Newer homes along the shoreline of a wide inland lake, dry hills rising behind them, reeds at the water edge.',
    comp: 'Camera AT WATER LEVEL on the shore looking ACROSS the flat open lake at the houses on the far side — water fills the lower half, town is a thin band beyond.',
  },
  'loma-linda': {
    arch: 'Modest post-war single-storey homes beside a large institutional campus edge, low buildings, mature pepper trees, clipped lawns.',
    comp: 'Camera tight against a CHAIN-LINK FENCE running away at a diagonal — the mesh in the near foreground, the houses seen through and beyond it.',
  },
  menifee: {
    arch: 'Very new stucco tract homes around a landscaped storm-water retention basin, young trees, dry hills far off.',
    comp: 'Camera across a RETENTION BASIN — still shallow water and reeds in the near frame, the ring of new houses standing around its far rim.',
  },
  'mission-viejo': {
    // a1 REJECTED at QA: the pergola-framed shot collided with santa-ana's carport "proscenium" — same
    // look-out-through-a-timber-frame geometry, and both cities are Orange County. "Gate framing" is also
    // already spent among the 59 shipped, so framing-through is out entirely. Re-aimed at a geometry that
    // is in neither set: a frontal shared MOTOR COURT, no framing device and no road running to a vanishing point.
    arch: 'Master-planned homes around a shared paved motor court, tile roofs, mature landscaping, a small planted island in the middle of the apron.',
    comp: 'Camera FACING a shallow arc of GARAGE DOORS around a shared MOTOR COURT — the doors and their paved apron fill the frame head-on, tile roofs and planting above them. FLAT FRONTAL VIEW: no road receding to a vanishing point, and NOTHING overhead or at the edges framing the shot.',
  },
  monrovia: {
    arch: 'Craftsman and Spanish homes in an old foothill town, their garages opening onto a narrow rear service alley, power poles, back fences.',
    comp: 'Camera IN THE REAR ALLEY behind the houses — garages and back gates either side, no front elevation and no street in the frame at all.',
  },
  'monterey-park': {
    arch: 'Compact post-war homes packed on a hillside grid, low stucco walls, security screens, mature fruit trees in tight side yards.',
    comp: 'Camera looking down the NARROW SIDE-YARD SLOT between two houses — walls close on both sides, a sliver of the next street visible at the far end.',
  },
  moorpark: {
    arch: 'Homes at the edge of a working citrus grove, rows of orange trees running away in straight lines, dry hills behind.',
    comp: 'Camera INSIDE the citrus GROVE looking down a planted row — trunks and rows recede on both sides, the houses glimpsed at the end of the row.',
  },
  'moreno-valley': {
    arch: 'Wide flat streets of newer tract homes with no kerb, a broad dirt shoulder instead, the Box Springs hills bare and distant.',
    comp: 'Camera standing on the wide DIRT SHOULDER where the asphalt simply ends — bare graded earth across the near frame, houses set back beyond it.',
  },
  'newbury-park': {
    arch: 'Suburban homes screened by a long windrow of mature eucalyptus, chaparral slopes behind, dry grass verges.',
    comp: 'Camera looking THROUGH a dense EUCALYPTUS WINDROW — a curtain of tall trunks across the frame with the houses visible in the gaps between them.',
  },
  'oak-park': {
    arch: 'Newer homes bordering an open school playing field, oaks at the far margin, low fencing, dry hills beyond.',
    comp: 'Camera at the edge of an empty PLAYING FIELD looking across the mown grass at the backs of the houses on its far side. Nothing but turf in the foreground.',
  },
  ojai: {
    arch: 'A Spanish-revival arcade — a covered walkway of white plastered arches beside a quiet street, tile roof, bougainvillea, oaks and mountains beyond.',
    comp: 'Camera UNDER the ARCADE looking along its length — repeated arches march away down the frame, the street and mountains visible through the openings.',
  },
  oxnard: {
    arch: 'Homes at the edge of coastal farmland, a raised earthen levee and irrigation ditch running between the tract and the fields.',
    comp: 'Camera ON TOP of the earthen LEVEE looking along it — the ditch below on one side, the houses on the other, the levee line receding.',
  },
  redlands: {
    arch: 'Large Victorian and craftsman homes on old streets, screened by very tall clipped hedges, mature magnolias, remnant citrus.',
    comp: 'Camera looking THROUGH A BREAK IN A TALL HEDGE WALL — dense clipped green filling almost the whole frame with the house visible through the gap.',
  },
  'san-bernardino': {
    arch: 'Older modest homes on a street that meets a railway line, timber sleepers and rails crossing the road, bare mountains far behind.',
    comp: 'Camera at the LEVEL CROSSING looking ALONG the RAILWAY LINE — the rails run away diagonally through the frame, houses on the flank.',
  },
  'san-clemente': {
    arch: 'White Spanish-revival houses with red tile roofs stacked on a coastal bluff, ice plant and agave on the slope below them.',
    comp: 'Camera DOWN on the beach trail at the foot of the bluff looking UP at the houses on the cliff above — the bluff face fills the frame, sky at the top.',
  },
  'san-gabriel': {
    // a1 REJECTED at QA: a white signboard with two rows of pseudo-lettering appeared mid-frame.
    // Composition kept; the NOTEXT rule is restated as a ban on sign-shaped OBJECTS, not just on writing.
    arch: 'Mixed older homes around a small landscaped traffic circle, mature trees, low walls, mission-era plaster on some facades.',
    comp: 'Camera at a small ROUNDABOUT / TRAFFIC CIRCLE — the planted island curves through the middle of the frame and the road bends around it both ways.',
    extra: 'ABSOLUTELY NO SIGN-SHAPED OBJECTS ANYWHERE: no signboards, no notice boards, no real-estate or yard signs, no banners, no plaques, no posts carrying any panel. If a sign would normally stand somewhere in this scene, leave that spot empty.',
  },
  'san-marino': {
    arch: 'Very large estates on flat deep lots screened by immense clipped ficus hedges, wide verges, mature oaks.',
    comp: 'Camera close alongside a towering green FICUS HEDGE WALL running away down the frame — dense living green filling one whole side, house glimpsed past it.',
  },
  'santa-ana': {
    arch: 'Dense older homes with detached garages and deep carports, security screens, mature street trees, tight lots.',
    comp: 'Camera INSIDE an open CARPORT looking OUT — the carport posts and roof frame the shot like a proscenium, the street and houses beyond in daylight.',
  },
  'simi-valley': {
    arch: 'Suburban homes either side of a dry sandy arroyo, a low concrete road bridge crossing it, sandstone outcrops in the distance.',
    comp: 'Camera standing IN the dry ARROYO bed looking UP at the road BRIDGE crossing overhead — sandy wash in the foreground, houses above the banks.',
  },
  'south-pasadena': {
    arch: 'Craftsman houses facing a small mature neighbourhood green, huge old oaks and camphors, a park bench, deep shade.',
    comp: 'Camera at bench height on the edge of a small GREEN looking ACROSS the open lawn at the houses opposite — park in the foreground, street barely visible.',
  },
  'temple-city': {
    // a1 REJECTED at QA: a white yard sign on a post carried a row of pseudo-lettering. Same fix as san-gabriel.
    arch: 'Neat single-storey homes on a flat grid, camellias and clipped shrubs, a long continuous sidewalk with a low hedge running beside it.',
    comp: 'Camera ON the SIDEWALK at walking height looking straight along it — the path runs away dead centre with hedge on one side and lawns on the other.',
    extra: 'ABSOLUTELY NO SIGN-SHAPED OBJECTS ANYWHERE: no signboards, no notice boards, no real-estate or yard signs, no banners, no plaques, no posts carrying any panel. Front lawns stay completely empty of signage.',
  },
  'toluca-lake': {
    arch: 'Substantial traditional homes backing onto a golf course, mature trees, clipped fairway grass, low boundary hedges.',
    comp: 'Camera OUT ON the golf FAIRWAY looking back at the houses along its edge — mown turf sweeping across the foreground, homes lining the far side.',
  },
  ventura: {
    arch: 'Older hillside homes stepping down toward the coast, mixed bungalows and Spanish cottages, the Pacific a flat band on the horizon.',
    comp: 'Camera on a steep hillside street looking out over the LAYERED ROOFTOPS below with the OCEAN as a hard horizontal band across the top third. Roofs and sea together.',
  },
  'villa-park': {
    arch: 'Large ranch estates on horse-zoned acre lots, white three-rail paddock fencing, mature pepper and eucalyptus, dry hills.',
    comp: 'Camera pressed against a white three-rail PADDOCK FENCE looking across the open paddock at the house beyond — rails across the near frame.',
  },
  'west-los-angeles': {
    arch: 'A block where a two-storey mid-century apartment building stands directly beside small single-family houses, mature street trees.',
    comp: 'Camera at the JUNCTION OF TWO SCALES — the tall apartment block filling one half of the frame and the low little houses the other, meeting at the middle.',
  },
  'westlake-village': {
    arch: 'Homes backing directly onto a man-made lake, private docks and timber decks over the water, mature landscaping.',
    comp: 'Camera ON a timber DOCK at the waterline looking ALONG the shore — the lake surface running away beside the frame, backs of the houses and their decks in a line.',
  },
  westwood: {
    arch: 'Small older houses on a leafy street with tall mid-rise towers standing close behind their rooflines, mature jacarandas.',
    comp: 'Camera low on the street so the little houses sit across the bottom and the TOWERS RISE directly behind their roofs — a deliberate collision of scales.',
  },
  'yorba-linda': {
    arch: 'Suburban homes along a road with a raised decomposed-granite bridle trail running parallel to it, white fencing, dry hills.',
    comp: 'Camera ON the raised BRIDLE TRAIL looking along its length — the soft granite path receding, the road and houses running parallel below and to the side.',
  },
};

const SIZE = [1200, 500];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

const promptFor = (slug) => (BASE
  .replace('%CITY%', slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '))
  .replace('%ARCH%', CITIES[slug].arch)
  .replace('%COMP%', CITIES[slug].comp)
  + (CITIES[slug].extra ? ' ' + CITIES[slug].extra : ''));

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

const ATTEMPT = Number(process.env.ATTEMPT || 1);   // QA retries: ATTEMPT=2 keeps the a1 reject as evidence
const list = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CITIES);
for (const slug of list) {
  if (!CITIES[slug]) { console.error(`unknown: ${slug}`); process.exit(1); }
  await genOne(slug, ATTEMPT);
  await sleep(2000);
}
console.log(`\nStaging: ${STAGING}`);
