// scripts/gen-marine-geo-heroes-2026-09-16.mjs
// /marine/ hero photos, batch 2 — the five harbor geo pages. No people, no technician:
// photo-pipeline.md §3 neighborhood-shot adapted to marinas, so no reference crops are sent.
// Frames are 21:9 for ServiceHero MODE A (1920×840, left text card — §8.1).
//
// Usage: node scripts/gen-marine-geo-heroes-2026-09-16.mjs [key ...] [--n=3] [--from=1]
// Attempts land in <TMP>/marine-heroes/ (same folder as batch 1, keys don't collide);
// scripts/convert-marine-heroes-2026-09-16.mjs places the picked frames.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const TMP = path.join(os.tmpdir(), 'marine-heroes');
fs.mkdirSync(TMP, { recursive: true });

// §6 for marina exteriors: distance does most of the work — hull lettering too small to exist.
const NOTEXT = `CRITICAL: the entire image contains NO writing of any kind. Boats are seen from a distance where no hull lettering could be read, and every hull, transom, bow and sail is plain and blank: NO boat names, NO home ports, NO registration numbers, NO sail numbers, NO insignia on sails. NO marina signs, NO slip numbers, NO dock markers with numbers, NO street signs, NO building signage, NO billboards, NO logos, NO yacht-club burgees, NO flags with emblems (no flags at all is best), NO buoys with numbers, NO watermarks. No recognisable branded or landmark buildings — generic architecture only.`;

const EMPTY = `There are NO people anywhere in the image — not on docks, boats, beaches, paths or balconies, not even tiny distant figures. NO cars or vehicles in the foreground.`;

const COMPOSE = `Ultra-wide 21:9 landscape composition. The main visual interest (boats, docks, shoreline, buildings) sits in the RIGHT half of the frame. The LEFT 40% of the frame is calm, simple and empty (described below) with no objects of interest — a text card will be overlaid there.`;

const STYLE = `Photorealistic landscape photograph of a Southern California harbor, natural colours, NOT AI-glossy, no HDR sheen, realistic detail, DSLR 35mm, 2K.`;

const SCENES = {
  mdr: {
    slug: 'marina-del-rey',
    prompt: `${STYLE} Soft early-morning light over a wide man-made marina basin with glassy calm water. On the RIGHT half, dense rows of white sailboats in their slips, a forest of masts receding deep into the distance; behind them low modern apartment buildings and tall palm trees. Seen from across the water, so the boats are mid-distance. LEFT 40%: open, calm, reflective water and pale morning sky, nothing in it. ${COMPOSE} ${EMPTY} ${NOTEXT}`,
  },
  newport: {
    slug: 'newport-beach',
    prompt: `${STYLE} Bright midday sun on a narrow, sheltered harbor channel with light ripples. On the RIGHT half, a shoreline of low two-story waterfront homes, each with its own small private wooden dock; a scattering of small sailboats and motorboats on mooring buoys in the channel in front of them. LEFT 40%: open rippled blue water catching sun reflections, nothing in it. ${COMPOSE} ${EMPTY} ${NOTEXT}`,
  },
  dana: {
    slug: 'dana-point',
    prompt: `${STYLE} Warm golden evening light. A small harbor sits beneath tall, steep, brush-covered coastal bluffs. On the RIGHT half, a long rock breakwater with boats moored inside it, and beyond it the open Pacific Ocean. The high headland bluff rises on the LEFT side of the frame. LEFT 40%: warm evening sky and the plain, soft-lit slope of the bluff, nothing else. ${COMPOSE} ${EMPTY} ${NOTEXT}`,
  },
  sd: {
    slug: 'san-diego',
    prompt: `${STYLE} Hazy, soft diffused light over a wide bay. On the RIGHT half, in the foreground, white motor yachts and sportfishing boats tied to floating docks; far across the water a faint, generic silhouette of a downtown high-rise skyline softened by marine haze. LEFT 40%: open grey-blue bay water fading into haze and pale sky, nothing in it. ${COMPOSE} ${EMPTY} ${NOTEXT}`,
  },
  sb: {
    slug: 'santa-barbara',
    prompt: `${STYLE} Clear sunny day with crisp golden California light. On the RIGHT half, a harbor full of moored sailboats behind a rock breakwater, a strip of sandy beach beside it, and a steep green-and-tan mountain range rising right behind the town close to the shore. LEFT 40%: open deep-blue water and clear sky, nothing in it. ${COMPOSE} ${EMPTY} ${NOTEXT}`,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isValidPng = (p) => { try { const b = fs.readFileSync(p); return b.length > 5000 && b[0] === 0x89 && b[1] === 0x50; } catch { return false; } };

async function genAttempt(key, attempt) {
  const s = SCENES[key];
  const out = path.join(TMP, `${key}-a${attempt}.png`);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: s.prompt }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '21:9' } },
  });
  for (let tries = 1; tries <= 4; tries++) {
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
    if (!isValidPng(out)) { console.error(`  bad PNG, retry`); await sleep(2000); continue; }
    const card = Buffer.from(`<svg width="1920" height="840"><rect x="2" y="2" width="764" height="836" fill="none" stroke="red" stroke-width="4"/></svg>`);
    await sharp(out).resize(1920, 840, { fit: 'cover', position: 'center' })
      .composite([{ input: card }]).jpeg({ quality: 85 })
      .toFile(path.join(TMP, `${key}-a${attempt}-preview.jpg`));
    console.log(`✓ ${key} a${attempt}`);
    return true;
  }
  console.error(`✗ ${key} a${attempt} FAILED`);
  return false;
}

const args = process.argv.slice(2);
const n = Number((args.find((a) => a.startsWith('--n=')) || '--n=3').slice(4));
const start = Number((args.find((a) => a.startsWith('--from=')) || '--from=1').slice(7));
const keys = args.filter((a) => !a.startsWith('--'));
for (const key of keys.length ? keys : Object.keys(SCENES)) {
  if (!SCENES[key]) { console.error(`unknown: ${key}`); process.exit(1); }
  for (let a = start; a < start + n; a++) await genAttempt(key, a);
}
console.log(`\nAttempts + previews in: ${TMP}`);
