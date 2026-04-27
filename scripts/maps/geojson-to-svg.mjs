// scripts/maps/geojson-to-svg.mjs
//
// Reads:
//   scripts/maps/socal-projected.geojson           (5 county polygons in Albers meters)
//   scripts/maps/branch-points-projected.geojson   (7 branch points in same Albers space)
//
// Writes:
//   src/data/county-boundaries.ts                  (TypeScript module with paths + label coords + pin coords)
//   public/maps/socal-counties.svg                 (standalone SVG asset)
//
// Re-run this script whenever the source GeoJSON changes:
//   node scripts/maps/geojson-to-svg.mjs
//
// Pipeline upstream of this script (one-shot, run manually if regenerating):
//   1. Download Click That Hood CA counties → scripts/maps/socal-raw.geojson
//   2. mapshaper -filter to 5 counties + -simplify 15% keep-shapes → socal-5counties.geojson
//   3. mapshaper -proj +proj=aea ... → socal-projected.geojson
//   4. mapshaper -proj on branch-points.geojson → branch-points-projected.geojson
//   5. node scripts/maps/geojson-to-svg.mjs (this file)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import polylabel from 'polylabel';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const VIEWBOX_W = 1000;
const VIEWBOX_H = 700;
const PADDING = 30; // px of empty space around the map inside viewBox

// ─── Load inputs ────────────────────────────────────────────────────────────
const counties = JSON.parse(
  readFileSync(join(__dirname, 'socal-projected.geojson'), 'utf8'),
);
const branchPoints = JSON.parse(
  readFileSync(join(__dirname, 'branch-points-projected.geojson'), 'utf8'),
);

// ─── Drop offshore islands: keep only the largest polygon per county ────────
// Census Bureau geometries include Catalina, San Clemente, San Nicolas, etc.
// as separate polygons inside MultiPolygon features. SDAR doesn't service the
// Channel Islands, so we collapse each MultiPolygon to its largest member
// (the mainland) before any bbox / path / centroid math runs.
function ringAreaXY(ring) {
  let a = 0;
  for (let i = 0, n = ring.length; i < n - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}
function mainlandOnly(geom) {
  if (geom.type !== 'MultiPolygon') return geom;
  let largestIdx = 0;
  let largestArea = -1;
  for (let i = 0; i < geom.coordinates.length; i++) {
    const a = ringAreaXY(geom.coordinates[i][0]);
    if (a > largestArea) {
      largestArea = a;
      largestIdx = i;
    }
  }
  return { type: 'Polygon', coordinates: geom.coordinates[largestIdx] };
}
for (const f of counties.features) {
  f.geometry = mainlandOnly(f.geometry);
}

// ─── Compute combined bbox of the 5 counties ────────────────────────────────
let minX = +Infinity, minY = +Infinity, maxX = -Infinity, maxY = -Infinity;
function visit(coords) {
  if (typeof coords[0] === 'number') {
    const [x, y] = coords;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  } else {
    for (const c of coords) visit(c);
  }
}
for (const f of counties.features) visit(f.geometry.coordinates);

const dataW = maxX - minX;
const dataH = maxY - minY;

// Fit dataspace into viewBox preserving aspect ratio, with PADDING on all sides
const innerW = VIEWBOX_W - 2 * PADDING;
const innerH = VIEWBOX_H - 2 * PADDING;
const scale = Math.min(innerW / dataW, innerH / dataH);
const renderedW = dataW * scale;
const renderedH = dataH * scale;
const offsetX = (VIEWBOX_W - renderedW) / 2;
const offsetY = (VIEWBOX_H - renderedH) / 2;

/** Project a single (Albers-meter) point to viewBox space. Y is flipped (SVG Y-down). */
function project([x, y]) {
  const px = offsetX + (x - minX) * scale;
  // Flip Y: data Y grows northward, SVG Y grows downward.
  const py = offsetY + (maxY - y) * scale;
  return [round(px), round(py)];
}
function round(n) {
  return Math.round(n * 100) / 100; // 2 decimal places
}

// ─── Convert each county to an SVG path string ──────────────────────────────
function ringToPath(ring) {
  const pts = ring.map(project);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0]} ${pts[i][1]}`;
  }
  return d + 'Z';
}

function geometryToPath(geom) {
  if (geom.type === 'Polygon') {
    return geom.coordinates.map(ringToPath).join(' ');
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates
      .map(poly => poly.map(ringToPath).join(' '))
      .join(' ');
  }
  throw new Error(`Unsupported geometry: ${geom.type}`);
}

// ─── Visual centroid via polylabel on the largest polygon ───────────────────
function ringArea(ring) {
  let a = 0;
  for (let i = 0, n = ring.length; i < n - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function visualCentroid(geom) {
  let largestPoly;
  let largestArea = -1;
  if (geom.type === 'Polygon') {
    largestPoly = geom.coordinates;
    largestArea = ringArea(geom.coordinates[0]);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      const a = ringArea(poly[0]);
      if (a > largestArea) {
        largestArea = a;
        largestPoly = poly;
      }
    }
  }
  // polylabel expects polygon = array of rings, each ring = array of [x, y]
  const point = polylabel(largestPoly, 1);
  return project(point);
}

// ─── Slug map (Click That Hood uses 'name' property) ────────────────────────
const SLUG_BY_NAME = {
  'Los Angeles': 'los-angeles',
  'Orange': 'orange',
  'Ventura': 'ventura',
  'San Bernardino': 'san-bernardino',
  'Riverside': 'riverside',
};

const COUNTY_ORDER = ['ventura', 'los-angeles', 'orange', 'san-bernardino', 'riverside'];

const records = [];
for (const f of counties.features) {
  const slug = SLUG_BY_NAME[f.properties.name];
  if (!slug) {
    console.warn(`Skipping unknown county: ${f.properties.name}`);
    continue;
  }
  const path = geometryToPath(f.geometry);
  const [labelX, labelY] = visualCentroid(f.geometry);
  records.push({
    slug,
    name: `${f.properties.name} County`,
    path,
    hubUrl: `/${slug}-county/`,
    labelX,
    labelY,
  });
}
records.sort(
  (a, b) => COUNTY_ORDER.indexOf(a.slug) - COUNTY_ORDER.indexOf(b.slug),
);

// ─── Project branch points into the same viewBox space ──────────────────────
const branchPositions = {};
for (const f of branchPoints.features) {
  const [x, y] = project(f.geometry.coordinates);
  branchPositions[f.properties.slug] = { x, y };
}

// ─── Emit src/data/county-boundaries.ts ─────────────────────────────────────
const tsLines = [];
tsLines.push('// AUTO-GENERATED from scripts/maps/socal-projected.geojson');
tsLines.push('// DO NOT EDIT manually — re-run scripts/maps/geojson-to-svg.mjs to regenerate.');
tsLines.push('//');
tsLines.push('// Pipeline:');
tsLines.push('//   1. Click That Hood CA counties → socal-raw.geojson');
tsLines.push('//   2. mapshaper -filter to 5 counties + -simplify 15% keep-shapes');
tsLines.push('//   3. mapshaper -proj Albers Equal Area (lat_1=34 lat_2=40.5 lon_0=-120)');
tsLines.push('//   4. node scripts/maps/geojson-to-svg.mjs');
tsLines.push('');
tsLines.push("export type CountySlug = 'los-angeles' | 'orange' | 'ventura' | 'san-bernardino' | 'riverside';");
tsLines.push('');
tsLines.push('export interface CountyBoundary {');
tsLines.push('  /** Slug matching cities.ts COUNTIES keys */');
tsLines.push('  slug: CountySlug;');
tsLines.push('  /** Display name for hover labels */');
tsLines.push('  name: string;');
tsLines.push('  /** SVG path d= attribute string */');
tsLines.push('  path: string;');
tsLines.push('  /** URL to county hub page */');
tsLines.push('  hubUrl: string;');
tsLines.push('  /** Approximate label position inside the county (visual centroid via polylabel) */');
tsLines.push('  labelX: number;');
tsLines.push('  labelY: number;');
tsLines.push('}');
tsLines.push('');
tsLines.push("export const SVG_VIEWBOX = '0 0 1000 700';");
tsLines.push('export const SVG_WIDTH = 1000;');
tsLines.push('export const SVG_HEIGHT = 700;');
tsLines.push('');
tsLines.push('export const COUNTY_BOUNDARIES: CountyBoundary[] = [');
for (const r of records) {
  tsLines.push('  {');
  tsLines.push(`    slug: '${r.slug}',`);
  tsLines.push(`    name: '${r.name}',`);
  tsLines.push(`    hubUrl: '${r.hubUrl}',`);
  tsLines.push(`    labelX: ${r.labelX},`);
  tsLines.push(`    labelY: ${r.labelY},`);
  tsLines.push(`    path: '${r.path}',`);
  tsLines.push('  },');
}
tsLines.push('];');
tsLines.push('');
tsLines.push('/** City center positions in SVG coordinate space — for branch pins (Phase B) */');
tsLines.push('export const BRANCH_PIN_POSITIONS: Record<string, { x: number; y: number }> = {');
for (const slug of Object.keys(branchPositions)) {
  const { x, y } = branchPositions[slug];
  tsLines.push(`  '${slug}': { x: ${x}, y: ${y} },`);
}
tsLines.push('};');
tsLines.push('');

const tsOutPath = join(ROOT, 'src', 'data', 'county-boundaries.ts');
mkdirSync(dirname(tsOutPath), { recursive: true });
writeFileSync(tsOutPath, tsLines.join('\n'));
console.log(`Wrote ${tsOutPath}`);

// ─── Emit public/maps/socal-counties.svg ────────────────────────────────────
const svgLines = [];
svgLines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
svgLines.push(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_W} ${VIEWBOX_H}" role="img" aria-labelledby="map-title map-desc">`,
);
svgLines.push(
  `  <title id="map-title">Same Day Appliance Repair Service Area — Southern California</title>`,
);
svgLines.push(
  `  <desc id="map-desc">Map of five Southern California counties served by Same Day Appliance Repair: Los Angeles, Orange, Ventura, San Bernardino, and Riverside.</desc>`,
);
svgLines.push(`  <defs>`);
svgLines.push(
  `    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(212,175,55,0.03)" stroke-width="1"/></pattern>`,
);
svgLines.push(
  `    <radialGradient id="county-fill" cx="50%" cy="50%" r="80%"><stop offset="0%" stop-color="#1a1a1a"/><stop offset="100%" stop-color="#0a0a0a"/></radialGradient>`,
);
svgLines.push(`  </defs>`);
svgLines.push(
  `  <rect width="${VIEWBOX_W}" height="${VIEWBOX_H}" fill="#0a0a0a"/>`,
);
svgLines.push(
  `  <rect width="${VIEWBOX_W}" height="${VIEWBOX_H}" fill="url(#grid)"/>`,
);
svgLines.push(`  <g class="counties">`);
for (const r of records) {
  svgLines.push(
    `    <a href="${r.hubUrl}" aria-label="${r.name} service area"><path d="${r.path}" fill="url(#county-fill)" stroke="#D4AF37" stroke-width="1.5" stroke-linejoin="round"><title>${r.name}</title></path></a>`,
  );
}
svgLines.push(`  </g>`);
svgLines.push(`  <g class="county-labels">`);
for (const r of records) {
  const label = r.name.replace(' County', '').toUpperCase();
  svgLines.push(
    `    <text x="${r.labelX}" y="${r.labelY}" text-anchor="middle" fill="#D4AF37" font-family="'Cinzel',serif" font-size="14" font-weight="600" letter-spacing="2.1" pointer-events="none">${label}</text>`,
  );
}
svgLines.push(`  </g>`);
svgLines.push(`</svg>`);
svgLines.push('');

const svgOutPath = join(ROOT, 'public', 'maps', 'socal-counties.svg');
mkdirSync(dirname(svgOutPath), { recursive: true });
writeFileSync(svgOutPath, svgLines.join('\n'));
console.log(`Wrote ${svgOutPath}`);

// ─── Summary ────────────────────────────────────────────────────────────────
console.log('');
console.log('=== Summary ===');
console.log(`Counties: ${records.length}`);
for (const r of records) {
  console.log(`  ${r.slug.padEnd(16)} label=(${r.labelX}, ${r.labelY})  path-length=${r.path.length}`);
}
console.log(`Branch pins: ${Object.keys(branchPositions).length}`);
for (const slug of Object.keys(branchPositions)) {
  const { x, y } = branchPositions[slug];
  console.log(`  ${slug.padEnd(16)} (${x}, ${y})`);
}
console.log('');
console.log('Bounding box (Albers meters):');
console.log(`  X: [${minX.toFixed(0)}, ${maxX.toFixed(0)}]   width=${dataW.toFixed(0)}`);
console.log(`  Y: [${minY.toFixed(0)}, ${maxY.toFixed(0)}]   height=${dataH.toFixed(0)}`);
console.log(`  Scale: ${scale.toFixed(6)} px/m`);
console.log(`  Rendered (px): ${renderedW.toFixed(1)} × ${renderedH.toFixed(1)}`);
