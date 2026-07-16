// scripts/gen-neighborhood-wave1-2026-07-15.mjs
// Photo wave 1 — neighborhood section backgrounds for 20 city pillars.
// Template 2 (neighborhood-shot) from docs/photo-pipeline.md §3 + §6 anti-detection.
//
// ASPECT NOTE: the pipeline doc's Template 2 says 4:3 and the wave brief said 3:2, but the
// shipped format (all 5 pilot cities) is 1200x500 = 2.40:1. Cropping 3:2 (1.50) down to 2.40
// throws away ~38% of the frame height and decapitates the houses/palms that ARE the subject.
// Generating 21:9 (2.33) crops to 2.40 losing ~3%. Same output spec, composition intact.
//
// These sit BEHIND an rgba(10,10,10,.72) scrim (ServiceArea .v2-area--photo), so they are
// backdrops, not focal images: mid-tone, no hotspots, nothing that needs to be legible.
//
// Usage: node scripts/gen-neighborhood-wave1-2026-07-15.mjs [slug ...]   (default: all 20)
// Writes attempts to a staging dir; nothing lands in public/ until the QA pass copies it.

import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const KEY = fs.readFileSync('C:/Users/Roman/WebstormProjects/sdar-v2/secrets/gemini-key.txt', 'utf8').trim();
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${KEY}`;
const STAGING = path.join(os.tmpdir(), 'nbhd-wave1');
fs.mkdirSync(STAGING, { recursive: true });

// §6 anti-detection: nothing Google Lens can read, nothing brand-like.
const NOTEXT = `CRITICAL: the image contains NO writing of any kind — no street signs, no house numbers, no address plaques, no shop signage, no banners, no license plates, no logos, no watermarks, no printed or engraved characters anywhere on any surface.`;

// Template 2 constants. "No people, no cars in foreground" is in the doc; cars parked far
// down the street are normal for a real residential street and stay allowed, but nothing
// in the foreground and no moving traffic.
const BASE = `Quiet residential street in %CITY%, California. %ARCH% NO people anywhere in the frame. NO cars, trucks or vehicles in the foreground. Warm afternoon golden-hour light, long soft shadows, clear California sky. Photorealistic documentary photograph, DSLR 35mm, eye level, natural realistic light, NOT AI-glossy, no HDR sheen. Wide establishing shot showing the depth of the street. %COMP% ${NOTEXT} 2K.`;

// Per-city architecture + a DELIBERATELY VARIED composition. The five already-shipped photos
// (beverly-hills, los-angeles, pasadena, santa-monica, west-hollywood) are mostly centred
// avenues receding to a vanishing point — beverly-hills especially. If all 20 of these repeat
// that, the set reads as one template. So each city gets its own camera geometry.
const CITIES = {
  // ── §3-listed architecture (use the doc's wording) ──────────────────────────
  glendale: {
    arch: 'Mediterranean-style estates in the Adams Hill area, terracotta tile roofs, stucco walls, mature landscaping climbing a gentle hillside.',
    comp: 'Camera looking slightly UPHILL along a curving street; the road bends out of frame to the left rather than receding to a centred vanishing point.',
  },
  burbank: {
    arch: 'Modest post-war single-storey bungalows with small front porches and rose bushes, tidy lawns, low hedges, wide sidewalk.',
    comp: 'Camera on the sidewalk, angled ACROSS the street at a shallow diagonal so a row of porches runs left-to-right through the frame. No centred road.',
  },
  malibu: {
    arch: 'Coastal estates set above the Pacific Coast Highway, weathered timber and glass, eucalyptus trees, a glimpse of open ocean and haze on the horizon.',
    comp: 'Camera high, looking slightly DOWN and out toward the ocean; the horizon sits in the upper third and the street falls away to the right.',
  },
  'manhattan-beach': {
    arch: 'Beach bungalows along a narrow pedestrian walk street, no roadway, low fences, hedges and flowering plants right against the path, salt-bleached paint.',
    comp: 'Tight NARROW walk-street corridor — houses close on BOTH sides, path barely two metres wide. Intimate and enclosed, not a wide avenue.',
  },
  'newport-beach': {
    arch: 'Contemporary coastal homes fronting a harbour channel, clean white and glass facades, low seawall, moored boats far in the background.',
    comp: 'Camera looking along the WATERFRONT edge, harbour water occupying the right half of the frame and houses on the left.',
  },
  'pacific-palisades': {
    arch: 'Canyon estates on a bluff, mature sycamores and eucalyptus, dense green canyon walls dropping away behind the houses, palisades cliffs beyond.',
    comp: 'Camera at a bend where the street opens to a canyon view; deep background depth, houses stacked on the slope to the left.',
  },

  // ── derived from region + housing stock (per the wave brief) ────────────────
  'long-beach': {
    arch: 'Early-1900s craftsman houses with deep porches and tapered columns, mixed with modest port-adjacent bungalows; mature street trees.',
    comp: 'Low camera close to a craftsman porch on the right, street receding shallowly to the left. Foreground porch detail, not an empty roadway.',
  },
  hollywood: {
    arch: '1920s two- and three-storey stucco courtyard apartment buildings with arched entries and iron railings, set on a street below the Hollywood Hills, hills rising in the background.',
    comp: 'Camera looking along the street with the HILLS visible above the rooflines in the background; apartment facades fill the left side.',
  },
  'culver-city': {
    arch: 'Mid-century single-storey homes with low-pitched rooflines, carports and mature ficus trees, a studio-era backlot wall of plain stucco visible further down the block.',
    comp: 'Flat, straight-on ELEVATION view of a row of mid-century facades — camera square to the houses, minimal street visible.',
  },
  'marina-del-rey': {
    arch: 'Modern low-rise harbour condominiums with balconies and glass railings facing a marina basin, palms along the quay, masts of moored sailboats in the background.',
    comp: 'Camera at the water edge looking across the marina basin; water fills the lower third, condos across the water in the middle distance.',
  },
  brentwood: {
    arch: 'Large traditional estates set well back behind mature sycamore and magnolia trees, deep green lawns, hedged property lines, dappled shade.',
    comp: 'Camera under a heavy TREE CANOPY — dappled light, branches framing the top of the frame, houses glimpsed through foliage.',
  },
  'bel-air': {
    arch: 'Gated estates on a narrow winding canyon road, tall stone and stucco perimeter walls, wrought-iron gates, dense mature planting spilling over the walls.',
    comp: 'Camera in a TIGHT canyon curve — the road disappears around a bend after only a short distance; enclosed, private, high walls on both sides.',
  },
  irvine: {
    arch: 'Master-planned contemporary tract homes, uniform beige and grey stucco, tile roofs, young evenly-spaced street trees, immaculate landscaped verges.',
    comp: 'Camera high and slightly ELEVATED looking over the uniform rooflines, emphasising the repetition and order of the planned development.',
  },
  'rancho-cucamonga': {
    arch: 'Newer suburban two-storey homes with three-car garages and young palms, wide clean streets, the San Gabriel foothills rising sharply behind the rooflines.',
    comp: 'Camera framing the FOOTHILLS as the dominant background mass above the houses; mountains occupy the upper half.',
  },
  riverside: {
    arch: 'Historic craftsman and Spanish-revival homes on a broad older street, mature citrus and pepper trees, a nod to the city\'s citrus-grove heritage, low stone garden walls.',
    comp: 'Camera looking through the gap between two mature citrus trees toward the houses; foreground foliage frames the shot on both edges.',
  },
  'thousand-oaks': {
    arch: 'Suburban homes set among mature native coast live oaks, dry golden hillsides beyond, generous spacing between houses, oak canopy dominating.',
    comp: 'A huge gnarled OAK dominates the left of the frame; the houses sit small and secondary to the right beneath it.',
  },
  anaheim: {
    arch: 'Modest post-war tract houses, single storey, attached garages, low front lawns and chain-free hedges, flat streets, mature but sparse trees.',
    comp: 'Camera at a quiet CORNER / intersection of two residential streets rather than looking down one street.',
  },
  torrance: {
    arch: 'Post-war single-storey homes with neat lawns, a flat street grid, a low coastal marine layer softening the light and hazing the far end of the street.',
    comp: 'Flat, slightly HAZY marine-layer light and a long flat street grid; softer contrast and cooler tone than the inland cities.',
  },
  'huntington-beach': {
    arch: 'Two-storey beach houses on a wide sunny street a few blocks from the sand, surfboards leaning on porches, low block walls, palms and salt-tolerant shrubs.',
    comp: 'WIDE open sunny street with big open sky — deliberately the opposite of the narrow enclosed Manhattan Beach walk street.',
  },
  temecula: {
    arch: 'Newly-built wine-country homes with clean tile roofs, young landscaping, gentle vineyard-covered hills rolling away in the background.',
    comp: 'Camera looking OUT past the edge of the development toward rolling vineyard hills; the vineyards occupy the background band.',
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
    // Preview at true final geometry so QA judges what actually ships.
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
  if (!CITIES[slug]) { console.error(`unknown slug: ${slug}`); process.exit(1); }
  await genOne(slug, 1);
  await sleep(2000);   // brief asks for 2s pauses between photos
}
console.log(`\nStaging: ${STAGING}`);
