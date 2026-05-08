// src/data/cities.ts
// Canonical city list — synced with src/pages/*.astro single-city pages.
//
// Population rules:
//   - Slug = filename of root-level .astro page (excluding county hubs, combo
//     pages, admin pages like contact/book/index/privacy-policy/terms).
//   - Name = strict Title Case of slug-with-hyphens-as-spaces.
//   - primaryBranch = first BRANCHES[].citiesServed match (BRANCHES order
//     determines tie-break for cities served by multiple branches).
//   - county = primaryBranch.primaryCounty.
//
// Sync state at last edit (2026-04-26):
//   - 87 .astro files matched the canonical city pattern on disk.
//   - 11 slugs in branches.ts citiesServed have NO matching .astro file
//     (mid-wilshire, fairfax, hancock-park, century-city, cheviot-hills,
//      beverly-glen, playa-del-rey, venice, mar-vista, sierra-madre, altadena).
//   - 0 disk pages were missing from any branch.citiesServed.
//   - These are reported in the Step 1 verification output, not auto-fixed.

import { BRANCHES, getBranchForCity } from './branches';

export type CountySlug =
  | 'los-angeles'
  | 'orange'
  | 'ventura'
  | 'san-bernardino'
  | 'riverside';

export interface City {
  slug: string;
  /** Display name e.g. "West Hollywood" — derived Title Case from slug */
  name: string;
  county: CountySlug;
  /** Slug of branch that primarily services this city */
  primaryBranch: string;
}

export const COUNTIES: Record<CountySlug, { name: string; hubUrl: string }> = {
  'los-angeles':    { name: 'Los Angeles County',     hubUrl: '/los-angeles-county/' },
  'orange':         { name: 'Orange County',          hubUrl: '/orange-county/' },
  'ventura':        { name: 'Ventura County',         hubUrl: '/ventura-county/' },
  'san-bernardino': { name: 'San Bernardino County',  hubUrl: '/san-bernardino-county/' },
  'riverside':      { name: 'Riverside County',       hubUrl: '/riverside-county/' }
};

export const CITIES: City[] = [
  { slug: 'agoura-hills',         name: 'Agoura Hills',         county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'alhambra',             name: 'Alhambra',             county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'anaheim',              name: 'Anaheim',              county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'arcadia',              name: 'Arcadia',              county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'atwater-village',      name: 'Atwater Village',      county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'bel-air',              name: 'Bel Air',              county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'beverly-hills',        name: 'Beverly Hills',        county: 'los-angeles',    primaryBranch: 'beverly-hills' },
  { slug: 'brentwood',            name: 'Brentwood',            county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'burbank',              name: 'Burbank',              county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'calabasas',            name: 'Calabasas',            county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'camarillo',            name: 'Camarillo',            county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'chino-hills',          name: 'Chino Hills',          county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'corona',               name: 'Corona',               county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'costa-mesa',           name: 'Costa Mesa',           county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'culver-city',          name: 'Culver City',          county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'dana-point',           name: 'Dana Point',           county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'eagle-rock',           name: 'Eagle Rock',           county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'el-segundo',           name: 'El Segundo',           county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'encino',               name: 'Encino',               county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'fontana',              name: 'Fontana',              county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'fullerton',            name: 'Fullerton',            county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'glassell-park',        name: 'Glassell Park',        county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'glendale',             name: 'Glendale',             county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'hemet',                name: 'Hemet',                county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'highland-park',        name: 'Highland Park',        county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'hollywood',            name: 'Hollywood',            county: 'los-angeles',    primaryBranch: 'west-hollywood' },
  { slug: 'huntington-beach',     name: 'Huntington Beach',     county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'irvine',               name: 'Irvine',               county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'koreatown',            name: 'Koreatown',            county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'la-canada-flintridge', name: 'La Canada Flintridge', county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'laguna-beach',         name: 'Laguna Beach',         county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'laguna-niguel',        name: 'Laguna Niguel',        county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'lake-elsinore',        name: 'Lake Elsinore',        county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'loma-linda',           name: 'Loma Linda',           county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'long-beach',           name: 'Long Beach',           county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'los-angeles',          name: 'Los Angeles',          county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'los-feliz',            name: 'Los Feliz',            county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'malibu',               name: 'Malibu',               county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'manhattan-beach',      name: 'Manhattan Beach',      county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'marina-del-rey',       name: 'Marina Del Rey',       county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'menifee',              name: 'Menifee',              county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'mission-viejo',        name: 'Mission Viejo',        county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'monrovia',             name: 'Monrovia',             county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'monterey-park',        name: 'Monterey Park',        county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'moorpark',             name: 'Moorpark',             county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'moreno-valley',        name: 'Moreno Valley',        county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'murrieta',             name: 'Murrieta',             county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'newbury-park',         name: 'Newbury Park',         county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'newport-beach',        name: 'Newport Beach',        county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'north-hollywood',      name: 'North Hollywood',      county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'oak-park',             name: 'Oak Park',             county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'ojai',                 name: 'Ojai',                 county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'ontario',              name: 'Ontario',              county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'oxnard',               name: 'Oxnard',               county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'pacific-palisades',    name: 'Pacific Palisades',    county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'pasadena',             name: 'Pasadena',             county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'rancho-cucamonga',     name: 'Rancho Cucamonga',     county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'redlands',             name: 'Redlands',             county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'redondo-beach',        name: 'Redondo Beach',        county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'riverside',            name: 'Riverside',            county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'san-bernardino',       name: 'San Bernardino',       county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'san-clemente',         name: 'San Clemente',         county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'san-gabriel',          name: 'San Gabriel',          county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'san-marino',           name: 'San Marino',           county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'santa-ana',            name: 'Santa Ana',            county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'santa-monica',         name: 'Santa Monica',         county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'sherman-oaks',         name: 'Sherman Oaks',         county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'silver-lake',          name: 'Silver Lake',          county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'simi-valley',          name: 'Simi Valley',          county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'south-pasadena',       name: 'South Pasadena',       county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'studio-city',          name: 'Studio City',          county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'tarzana',              name: 'Tarzana',              county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'temecula',             name: 'Temecula',             county: 'riverside',      primaryBranch: 'riverside' },
  { slug: 'temple-city',          name: 'Temple City',          county: 'los-angeles',    primaryBranch: 'pasadena' },
  { slug: 'thousand-oaks',        name: 'Thousand Oaks',        county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'toluca-lake',          name: 'Toluca Lake',          county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'torrance',             name: 'Torrance',             county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'tustin',               name: 'Tustin',               county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'upland',               name: 'Upland',               county: 'san-bernardino', primaryBranch: 'rancho-cucamonga' },
  { slug: 'ventura',              name: 'Ventura',              county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'villa-park',           name: 'Villa Park',           county: 'orange',         primaryBranch: 'irvine' },
  { slug: 'west-hollywood',       name: 'West Hollywood',       county: 'los-angeles',    primaryBranch: 'west-hollywood' },
  { slug: 'west-los-angeles',     name: 'West Los Angeles',     county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'westlake-village',     name: 'Westlake Village',     county: 'ventura',        primaryBranch: 'thousand-oaks' },
  { slug: 'westwood',             name: 'Westwood',             county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'woodland-hills',       name: 'Woodland Hills',       county: 'los-angeles',    primaryBranch: 'los-angeles' },
  { slug: 'yorba-linda',          name: 'Yorba Linda',          county: 'orange',         primaryBranch: 'irvine' }
];

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find(c => c.slug === slug);
}

export function getCitiesByCounty(county: CountySlug): City[] {
  return CITIES.filter(c => c.county === county);
}

export function getCitiesByBranch(branchSlug: string): City[] {
  return CITIES.filter(c => c.primaryBranch === branchSlug);
}

export const TOTAL_CITY_COUNT = CITIES.length;

// Re-export for downstream consumers that need the branch resolver alongside city data.
export { BRANCHES, getBranchForCity };
