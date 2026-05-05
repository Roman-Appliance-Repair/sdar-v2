// src/data/city-service-matrix.ts
// Wave 23 MVP: 8 hub cities × 5 highest-volume residential services = 40 combos.
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
const HUBS = [
  'west-hollywood',
  'beverly-hills',
  'los-angeles',
  'pasadena',
  'thousand-oaks',
  'irvine',
  'rancho-cucamonga',
  'temecula',
];

const TIER1_SERVICES = [
  'refrigerator-repair',
  'dryer-repair',
  'washer-repair',
  'dishwasher-repair',
  'oven-repair',
];

// Wave 24a — Tier 2 services (8 hubs × 5 = 40 new combos)
const TIER2_SERVICES = [
  'stove-repair',
  'cooktop-repair',
  'range-hood-repair',
  'microwave-repair',
  'wall-oven-repair',
];

// Wave 25a — Tier 3 services (8 hubs × 5 = 40 new combos)
const TIER3_SERVICES = [
  'freezer-repair',
  'ice-maker-repair',
  'wine-cooler-repair',
  'garbage-disposal-repair',
  'range-repair',
];

const ALL_SERVICES = [...TIER1_SERVICES, ...TIER2_SERVICES, ...TIER3_SERVICES];

// Wave 24b — Top 5 non-hub priority cities × Tier 1 services (25 combos).
// Burbank prioritized due to 15,516 imp/mo GSC top priority.
const NON_HUB_PRIORITY_CITIES = [
  'burbank',
  'glendale',
  'santa-monica',
  'long-beach',
  'anaheim',
];

// Wave 27b — final non-hub addition to reach 200/200 master plan target.
// Hollywood (entertainment industry + Hollywood Hills premium tier mix);
// distinct from west-hollywood. Tier 1 only (5 services) to land at exactly 200.
const NON_HUB_TIER1_ONLY_CITIES = [
  'hollywood',
];

export const CITY_SERVICE_MATRIX: CityServiceCombo[] = [
  // 8 hubs × 15 services (Tier 1 + Tier 2 + Tier 3) = 120 combos
  ...HUBS.flatMap(city => ALL_SERVICES.map(service => ({ city, service }))),
  // 5 non-hub priority × 5 Tier 1 services = 25 combos
  ...NON_HUB_PRIORITY_CITIES.flatMap(city => TIER1_SERVICES.map(service => ({ city, service }))),
  // Wave 25b — 5 non-hub priority × 5 Tier 2 services = 25 combos
  ...NON_HUB_PRIORITY_CITIES.flatMap(city => TIER2_SERVICES.map(service => ({ city, service }))),
  // Wave 26a — 5 non-hub priority × 5 Tier 3 services = 25 combos
  ...NON_HUB_PRIORITY_CITIES.flatMap(city => TIER3_SERVICES.map(service => ({ city, service }))),
  // Wave 27b — Hollywood × 5 Tier 1 services = 5 combos (200/200 target)
  ...NON_HUB_TIER1_ONLY_CITIES.flatMap(city => TIER1_SERVICES.map(service => ({ city, service }))),
];

export const TOTAL_CITY_SERVICE_COMBOS = CITY_SERVICE_MATRIX.length;
