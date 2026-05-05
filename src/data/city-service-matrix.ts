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

export const CITY_SERVICE_MATRIX: CityServiceCombo[] = HUBS.flatMap(city =>
  TIER1_SERVICES.map(service => ({ city, service }))
);

export const TOTAL_CITY_SERVICE_COMBOS = CITY_SERVICE_MATRIX.length;
