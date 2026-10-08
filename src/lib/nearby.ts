// src/lib/nearby.ts
//
// Real nearest neighbours for the city hubs (city stage 1, 2026-10-08).
// Replaces the hand-written `nearbyCities` arrays that used to live on each of the
// 99 city pages: those lists were written by feel, several pointed 50+ miles away
// and some skipped the actual next-door city.
//
// RULE (owner, 2026-10-08):
//   - 6–8 nearest cities that HAVE a page (every slug in CITIES has one);
//   - prefer the same county — implemented as a small distance penalty for crossing
//     a county line, so a same-county city wins a near-tie but a much closer
//     cross-county neighbour (Agoura Hills ↔ Westlake Village) still shows;
//   - never link a city more than 40 miles away, unless fewer than 4 cities exist
//     within 40 miles — then the nearest ones beyond 40 fill the list up to 4.
// Distances are straight-line between centroids (src/data/city-geo.ts).

import { CITIES, type City } from '../data/cities';
import { CITY_GEO, milesBetween, type LatLng } from '../data/city-geo';

export const NEARBY_MAX = 8;
export const NEARBY_RADIUS_MILES = 40;
export const NEARBY_MIN_BEFORE_STRETCH = 4;
/** Miles added to a cross-county candidate when ranking (preference, not a wall). */
const CROSS_COUNTY_PENALTY_MILES = 3;

/** Display names where the slug-derived Title Case in cities.ts is not how the place
 *  is written. Used by the nearby pills and the "Where we work" block. */
const DISPLAY_NAME: Record<string, string> = {
  'marina-del-rey': 'Marina del Rey',
  'la-canada-flintridge': 'La Cañada Flintridge'
};

export function cityDisplayName(city: Pick<City, 'slug' | 'name'>): string {
  return DISPLAY_NAME[city.slug] ?? city.name;
}

export function geoOf(slug: string): LatLng {
  const g = CITY_GEO[slug];
  if (!g) throw new Error(`[nearby] no coordinates for city slug "${slug}" — add it to src/data/city-geo.ts`);
  return g;
}

export interface NearbyCity { slug: string; name: string; miles: number }

export function getNearbyCities(slug: string, max = NEARBY_MAX): NearbyCity[] {
  const self = CITIES.find((c) => c.slug === slug);
  if (!self) throw new Error(`[nearby] unknown city slug "${slug}"`);
  const here = geoOf(slug);

  const ranked = CITIES
    .filter((c) => c.slug !== slug)
    .map((c) => {
      const miles = milesBetween(here, geoOf(c.slug));
      const score = miles + (c.county === self.county ? 0 : CROSS_COUNTY_PENALTY_MILES);
      return { slug: c.slug, name: cityDisplayName(c), miles, score };
    });

  const within = ranked.filter((c) => c.miles <= NEARBY_RADIUS_MILES).sort((a, b) => a.score - b.score);
  let picked = within.slice(0, max);
  if (picked.length < NEARBY_MIN_BEFORE_STRETCH) {
    const beyond = ranked.filter((c) => c.miles > NEARBY_RADIUS_MILES).sort((a, b) => a.miles - b.miles);
    picked = [...picked, ...beyond.slice(0, NEARBY_MIN_BEFORE_STRETCH - picked.length)];
  }
  return picked.map(({ slug: s, name, miles }) => ({ slug: s, name, miles: Math.round(miles * 10) / 10 }));
}
