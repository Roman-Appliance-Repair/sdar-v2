// src/lib/reviews.ts
//
// Which real Housecall Pro reviews (src/data/reviews-hcp.ts) a page shows.
// City stage 1, 2026-10-08.
//
//   1. The city's own customers (`page === slug`), newest first.
//   2. Reviews from a nearby city that has no page of its own and whose nearest hub
//      is this one (`hostPage === slug`) — shown after the own ones, labelled with
//      their real city.
//   3. No own review → the hosted ones (if any), topped up to 3 with the nearest
//      customers (straight-line from the city centroid, never further than
//      NEARBY_REVIEW_MILES, one per customer name), under a "nearby" heading.
//      Nothing within reach → the block is not rendered at all.
// A review is never presented as coming from the page's own city unless it does.

import { HCP_REVIEWS, type HcpReview } from '../data/reviews-hcp';
import type { CountySlug } from '../data/cities';
import { milesBetween } from '../data/city-geo';
import { geoOf } from './nearby';

export const NEARBY_REVIEW_MILES = 40;
export const NEARBY_REVIEW_COUNT = 3;

export type ReviewMode = 'own' | 'mixed' | 'nearby' | 'none';

const byDateDesc = (a: HcpReview, b: HcpReview) => b.date.localeCompare(a.date);

export function reviewsForCity(slug: string): { mode: ReviewMode; reviews: HcpReview[] } {
  const own = HCP_REVIEWS.filter((r) => r.page === slug).sort(byDateDesc);
  const hosted = HCP_REVIEWS.filter((r) => r.page === null && r.hostPage === slug).sort(byDateDesc);
  if (own.length) {
    return { mode: hosted.length ? 'mixed' : 'own', reviews: [...own, ...hosted] };
  }
  // No review of its own: the customers whose city has no page and lands here first,
  // then the nearest other customers until there are NEARBY_REVIEW_COUNT. One review
  // per customer name — two quotes from the same person read as padding.
  const picked: HcpReview[] = [...hosted];
  const names = new Set(picked.map((r) => r.name));
  const here = geoOf(slug);
  const nearest = HCP_REVIEWS
    .filter((r) => !picked.includes(r))
    .map((r) => ({ r, miles: milesBetween(here, { lat: r.lat, lng: r.lng }) }))
    .filter((x) => x.miles <= NEARBY_REVIEW_MILES)
    .sort((a, b) => a.miles - b.miles || b.r.text.length - a.r.text.length);
  for (const { r } of nearest) {
    if (picked.length >= NEARBY_REVIEW_COUNT) break;
    if (names.has(r.name)) continue;
    names.add(r.name);
    picked.push(r);
  }
  return { mode: picked.length ? 'nearby' : 'none', reviews: picked };
}

/** County hubs show the reviews of the county's customers whose own city has no page. */
export function reviewsForCounty(county: CountySlug): HcpReview[] {
  return HCP_REVIEWS.filter((r) => r.county === county && r.page === null).sort(byDateDesc);
}
