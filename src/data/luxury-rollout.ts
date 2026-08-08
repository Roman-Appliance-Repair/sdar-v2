// src/data/luxury-rollout.ts — LuxurySpecialists rollout SSOT (approved 2026-08-08).
//
// Segmentation law (Roman, 2026-08-08): the LuxurySpecialists block ships ONLY to the
// 42 cities below. Group C (mass-market: LG/Samsung/Whirlpool territory — 44 cities
// including the borderline five tustin/upland/redlands/silver-lake/redondo-beach) is
// SKIPPED deliberately: a luxury block there would read as a lie and dilute the page.
// Do not add cities here without a segmentation decision.
//
//   A = luxury genuine  — real built-in / pro-brand density; block speaks for the city.
//   B = mixed           — luxury pockets in a mass-market city; block prose MUST name
//                         the pocket ("the newer builds on the hill run built-ins"),
//                         never claim the whole city is estate country.
//
// Brand pills come from getLuxuryBrands(slug): per-city override first (the city's own
// verified mix — keep it consistent with what the page prose already claims), else the
// group pool. Display names must match brand-pillar-map.ts keys to render as links;
// unmapped names render as plain pills (LuxurySpecialists handles both).
//
// The 13 pages that already carry the block (west-hollywood + 6 Santa Barbara + 6 San
// Diego) pass their own hand-authored brands and are not listed here.

export type LuxuryGroup = 'A' | 'B';

export const LUXURY_CITIES: Record<string, LuxuryGroup> = {
  // ---- Group A (15) ----
  'bel-air': 'A',
  'beverly-hills': 'A',
  'brentwood': 'A',
  'pacific-palisades': 'A',
  'malibu': 'A',
  'calabasas': 'A',
  'san-marino': 'A',
  'la-canada-flintridge': 'A',
  'manhattan-beach': 'A',
  'santa-monica': 'A',
  'toluca-lake': 'A',
  'newport-beach': 'A',
  'laguna-beach': 'A',
  'villa-park': 'A',
  'westlake-village': 'A',
  // ---- Group B (27) ----
  'hollywood': 'B',
  'sherman-oaks': 'B',
  'studio-city': 'B',
  'encino': 'B',
  'tarzana': 'B',
  'woodland-hills': 'B',
  'westwood': 'B',
  'west-los-angeles': 'B',
  'los-feliz': 'B',
  'pasadena': 'B',
  'arcadia': 'B',
  'glendale': 'B',
  'long-beach': 'B',
  'agoura-hills': 'B',
  'los-angeles': 'B',
  'irvine': 'B',
  'dana-point': 'B',
  'laguna-niguel': 'B',
  'yorba-linda': 'B',
  'huntington-beach': 'B',
  'san-clemente': 'B',
  'anaheim': 'B',
  'thousand-oaks': 'B',
  'ojai': 'B',
  'temecula': 'B',
  'corona': 'B',
  'chino-hills': 'B',
};

// Group pools — the default pill set when a city has no override.
// A leads with the full-luxury bench; B keeps the pool honest for pocket cities
// (Bosch/KitchenAid are what the premium pocket actually runs alongside Sub-Zero).
export const GROUP_BRAND_POOLS: Record<LuxuryGroup, string[]> = {
  A: ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Gaggenau', 'Viking', 'Dacor', 'GE Monogram'],
  B: ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Bosch', 'KitchenAid', 'Dacor', 'GE Monogram'],
};

// Per-city pill overrides — the city's own verified brand mix, sourced from that
// page's existing prose/FAQ (zero-invention: only brands the page already claims).
export const CITY_BRAND_OVERRIDES: Partial<Record<string, string[]>> = {
  'san-marino': ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Gaggenau', 'GE Monogram', 'Viking', 'True Residential', 'Dacor', 'Fisher & Paykel', 'Cove', 'La Cornue'],
  'westlake-village': ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Gaggenau', 'Viking', 'Dacor', 'EuroCave'],
  'villa-park': ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Dacor', 'Viking', 'La Cornue', 'Gaggenau', 'Fisher & Paykel', 'Bertazzoni'],
  // ---- wave 1 full (2026-08-08) — lists sourced from each page's own prose/grid ----
  'beverly-hills': ['Sub-Zero', 'Wolf', 'Viking', 'Thermador', 'Miele', 'Dacor', 'GE Monogram', 'True Residential', 'Bosch', 'Fisher & Paykel', 'Liebherr'],
  'bel-air': ['Sub-Zero', 'Wolf', 'Thermador', 'Gaggenau', 'Miele', 'GE Monogram', 'Viking', 'La Cornue', 'True Residential', 'Dacor', 'Fisher & Paykel', 'Cove'],
  'brentwood': ['Sub-Zero', 'Wolf', 'Viking', 'Thermador', 'Cove', 'Miele', 'GE Monogram', 'Liebherr', 'EuroCave', 'Fisher & Paykel'],
  'pacific-palisades': ['La Cornue', 'Gaggenau', 'Sub-Zero', 'Wolf', 'Miele', 'Thermador', 'Viking', 'GE Monogram'],
  'malibu': ['Sub-Zero', 'Wolf', 'Viking', 'Miele', 'Thermador', 'True Residential'],
  'calabasas': ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Viking', 'GE Monogram', 'True Residential', 'EuroCave'],
  'la-canada-flintridge': ['Sub-Zero', 'Wolf', 'Viking', 'Thermador', 'Miele', 'Dacor', 'Liebherr', 'True Residential'],
  'manhattan-beach': ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Liebherr', 'Marvel', 'Bosch'],
  'santa-monica': ['Sub-Zero', 'Wolf', 'Thermador', 'Bosch'],
  'toluca-lake': ['Sub-Zero', 'Wolf', 'Viking', 'Thermador', 'Miele', 'KitchenAid', 'Bosch', 'GE Profile'],
  'newport-beach': ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Gaggenau', 'Marvel'],
  'laguna-beach': ['Sub-Zero', 'Wolf', 'Thermador', 'Miele', 'Gaggenau'],
};

export function getLuxuryBrands(citySlug: string): string[] {
  const override = CITY_BRAND_OVERRIDES[citySlug];
  if (override) return override;
  const group = LUXURY_CITIES[citySlug];
  return group ? GROUP_BRAND_POOLS[group] : [];
}
