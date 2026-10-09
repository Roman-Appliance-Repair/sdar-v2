// src/lib/recent-repairs.ts
//
// Which REAL completed jobs (src/data/recent-repairs.ts) a city hub shows.
// City stage 2, 2026-10-08.
//
//   1. The city's own jobs, newest first, at most RECENT_OWN_MAX.
//   2. No job on record for the city → up to RECENT_NEARBY_MAX jobs from the nearest
//      cities that have a page (src/lib/nearby.ts — same distance rule, never beyond
//      its 40-mile radius), one per city first, under a "nearby" heading, each card
//      labelled with the job's real city / neighborhood.
//   3. Nothing within reach → the block is not rendered at all.
// A job is never presented as coming from the page's own city unless it does.

import { RECENT_REPAIRS, type RecentRepair } from '../data/recent-repairs';
import { CITIES } from '../data/cities';
import { getNearbyCities } from './nearby';

export const RECENT_OWN_MAX = 4;
export const RECENT_NEARBY_MAX = 3;

export type RepairMode = 'own' | 'nearby' | 'none';

export interface PlacedRepair extends RecentRepair {
  /** Slug of the city hub this job belongs to (its real city). */
  citySlug: string;
}

const byDateDesc = (a: RecentRepair, b: RecentRepair) => b.date.localeCompare(a.date);

function jobsOf(slug: string): PlacedRepair[] {
  return [...(RECENT_REPAIRS[slug] ?? [])].sort(byDateDesc).map((r) => ({ ...r, citySlug: slug }));
}

export function repairsForCity(slug: string): { mode: RepairMode; repairs: PlacedRepair[] } {
  if (!CITIES.some((c) => c.slug === slug)) throw new Error(`[recent-repairs] unknown city slug "${slug}"`);
  const own = jobsOf(slug);
  if (own.length) return { mode: 'own', repairs: own.slice(0, RECENT_OWN_MAX) };

  // Every page-city inside the nearby radius, nearest first (same ranking as the pills).
  const near = getNearbyCities(slug, CITIES.length).map((c) => jobsOf(c.slug)).filter((j) => j.length);
  const picked: PlacedRepair[] = [];
  // Round-robin: the newest job of each nearest city, then the second ones, and so on.
  for (let round = 0; picked.length < RECENT_NEARBY_MAX; round++) {
    let added = false;
    for (const jobs of near) {
      if (picked.length >= RECENT_NEARBY_MAX) break;
      if (jobs[round]) { picked.push(jobs[round]); added = true; }
    }
    if (!added) break;
  }
  return { mode: picked.length ? 'nearby' : 'none', repairs: picked };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

/** "2026-09" → "September 2026". */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) throw new Error(`[recent-repairs] bad date "${ym}" (want YYYY-MM)`);
  return `${MONTHS[m - 1]} ${y}`;
}
