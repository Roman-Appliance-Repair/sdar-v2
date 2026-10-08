// src/data/city-service-matrix.ts
// Wave 23 MVP: 8 hub cities × 5 highest-volume residential services = 40 combos.
// 2026-10-08: only 12 combos still render — see LIVE_COMBOS at the bottom.
// Extensible: add entries here as new combos ship.
//
// Architecture:
//   - This matrix declares which (city, service) pairs render at /[city]/[service]/.
//   - The parametric template at src/pages/[city]/[service].astro uses
//     getStaticPaths() to read this matrix + emit one static page per combo.
//   - Content per combo lives in src/data/city-service-content.ts.

export interface CityServiceCombo {
  city: string;     // city slug (must exist in cities.ts)
  service: string;  // service slug (must exist in services.ts)
}

// 8 hubs × 5 services. MVP launch matrix.
// Note: 'temecula' here is the city slug used as a HUB anchor for the
// Riverside-county service combos (city pages like /temecula/dishwasher-repair/).
// The branch was renamed temecula→riverside (2026-05-08), but Temecula remains
// a real served city and is the hub anchor for this matrix until/unless the
// matrix is rebuilt around 'riverside' city as the hub.
const HUBS = [
  'west-hollywood',
  'beverly-hills',
  'los-angeles',
  'pasadena',
  'thousand-oaks',
  'irvine',
  'rancho-cucamonga',
  'temecula'
];

const TIER1_SERVICES = [
  'refrigerator-repair',
  'dryer-repair',
  'washer-repair',
  'dishwasher-repair',
  'oven-repair'
];

// Wave 24a — Tier 2 services (8 hubs × 5 = 40 new combos)
const TIER2_SERVICES = [
  'stove-repair',
  'cooktop-repair',
  'range-hood-repair',
  'microwave-repair',
  'wall-oven-repair'
];

// Wave 25a — Tier 3 services (8 hubs × 5 = 40 new combos)
const TIER3_SERVICES = [
  'freezer-repair',
  'ice-maker-repair',
  'wine-cooler-repair',
  'garbage-disposal-repair',
  'range-repair'
];

const ALL_SERVICES = [...TIER1_SERVICES, ...TIER2_SERVICES, ...TIER3_SERVICES];

// Wave 24b — Top 5 non-hub priority cities × Tier 1 services (25 combos).
// Burbank prioritized due to 15,516 imp/mo GSC top priority.
const NON_HUB_PRIORITY_CITIES = [
  'burbank',
  'glendale',
  'santa-monica',
  'long-beach',
  'anaheim'
];

// Wave 27b — final non-hub addition to reach 200/200 master plan target.
// Hollywood (entertainment industry + Hollywood Hills premium tier mix);
// distinct from west-hollywood. Tier 1 only (5 services) to land at exactly 200.
const NON_HUB_TIER1_ONLY_CITIES = [
  'hollywood'
];

// The full 200-combo plan the waves above generated. Kept as the record of what was
// built — NOT what renders any more (see LIVE_COMBOS below).
export const GENERATED_CITY_SERVICE_MATRIX: CityServiceCombo[] = [
  // 8 hubs × 15 services (Tier 1 + Tier 2 + Tier 3) = 120 combos
  ...HUBS.flatMap(city => ALL_SERVICES.map(service => ({ city, service }))),
  // 5 non-hub priority × 5 Tier 1 services = 25 combos
  ...NON_HUB_PRIORITY_CITIES.flatMap(city => TIER1_SERVICES.map(service => ({ city, service }))),
  // Wave 25b — 5 non-hub priority × 5 Tier 2 services = 25 combos
  ...NON_HUB_PRIORITY_CITIES.flatMap(city => TIER2_SERVICES.map(service => ({ city, service }))),
  // Wave 26a — 5 non-hub priority × 5 Tier 3 services = 25 combos
  ...NON_HUB_PRIORITY_CITIES.flatMap(city => TIER3_SERVICES.map(service => ({ city, service }))),
  // Wave 27b — Hollywood × 5 Tier 1 services = 5 combos (200/200 target)
  ...NON_HUB_TIER1_ONLY_CITIES.flatMap(city => TIER1_SERVICES.map(service => ({ city, service })))
];

// City stage 1 (2026-10-08): dead city × service pages retired.
// Rule (owner): a combo survives only with >= 20 GSC impressions OR >= 1 click in the
// 90 days to 2026-10-07 (scratchpad demand-map/combos.csv). 188 of 200 did not; they
// no longer build and each one 301s to its city hub (astro.config.mjs + public/_redirects,
// block "2026-10-08 city stage 1"). The 56 combos that were canonicalized to the hub
// (combo-collapse.ts) were part of the same cut: 54 are retired, the 2 that meet the
// threshold (los-angeles/wall-oven-repair 81 imp / 1 click, burbank/wall-oven-repair
// 20 imp) are kept and are self-canonical again.
// Adding a combo back = add its key here AND delete its redirect line in both files.
export const LIVE_COMBOS = new Set<string>([
  'anaheim/cooktop-repair',            // 23 imp
  'anaheim/wine-cooler-repair',        // 30 imp
  'burbank/cooktop-repair',            // 26 imp
  'burbank/wall-oven-repair',          // 20 imp (was canonicalized)
  'glendale/range-hood-repair',        // 1 click
  'irvine/range-hood-repair',          // 1 click
  'los-angeles/refrigerator-repair',   // 1 click
  'los-angeles/wall-oven-repair',      // 81 imp, 1 click (was canonicalized)
  'rancho-cucamonga/refrigerator-repair', // 1 click
  'rancho-cucamonga/wine-cooler-repair',  // 19 imp, 1 click
  'rancho-cucamonga/ice-maker-repair',    // 33 imp
  'temecula/wine-cooler-repair'        // 17 imp, 2 clicks
]);

export const CITY_SERVICE_MATRIX: CityServiceCombo[] =
  GENERATED_CITY_SERVICE_MATRIX.filter(c => LIVE_COMBOS.has(`${c.city}/${c.service}`));

/** Retired combos — each 301s to `/${city}/`. */
export const RETIRED_CITY_SERVICE_COMBOS: CityServiceCombo[] =
  GENERATED_CITY_SERVICE_MATRIX.filter(c => !LIVE_COMBOS.has(`${c.city}/${c.service}`));

/** True when /{city}/{service}/ is a live page. */
export function isLiveCombo(city: string, service: string): boolean {
  return LIVE_COMBOS.has(`${city}/${service}`);
}

export const TOTAL_CITY_SERVICE_COMBOS = CITY_SERVICE_MATRIX.length;
