// src/data/commercial-cross-link-map.ts
// Wave 61b Sprint 2 Batch D (2026-05-27): map residential service slugs to
// their nearest commercial hub for cross-linking from /[city]/[service]/
// parametric template's Related section.
//
// 13 of 15 residential services have a natural commercial counterpart.
// microwave-repair + garbage-disposal-repair → null (no commercial hub exists).
//
// Pricing-discipline note: every linkText explicitly flags "Commercial" scope
// so the residential $89 vs commercial $120 fork is clear at click-time, per
// docs/factual-accuracy.md §9 (never mix on a single page).

export type CommercialCrossLink = {
  url: string;
  linkText: string;
};

export const COMMERCIAL_CROSS_LINK_MAP: Record<string, CommercialCrossLink | null> = {
  'refrigerator-repair':     { url: '/commercial/refrigeration/',                            linkText: 'Commercial refrigeration repair' },
  'freezer-repair':          { url: '/commercial/refrigeration/walk-in-freezer-repair/',     linkText: 'Commercial walk-in freezer repair' },
  'ice-maker-repair':        { url: '/commercial/ice-machines/',                             linkText: 'Commercial ice machine repair' },
  'wine-cooler-repair':      { url: '/commercial/refrigeration/wine-cellar-cooling-repair/', linkText: 'Commercial wine cellar cooling repair' },
  'oven-repair':             { url: '/commercial/oven-repair/',                              linkText: 'Commercial oven repair' },
  'wall-oven-repair':        { url: '/commercial/oven-repair/',                              linkText: 'Commercial oven repair' },
  'stove-repair':            { url: '/commercial/stove-repair/',                             linkText: 'Commercial stove repair' },
  'range-repair':            { url: '/commercial/range-repair/',                             linkText: 'Commercial range repair' },
  'cooktop-repair':          { url: '/commercial/range-repair/',                             linkText: 'Commercial range repair' },
  'range-hood-repair':       { url: '/commercial/exhaust-hood-repair/',                      linkText: 'Commercial exhaust hood repair' },
  'dishwasher-repair':       { url: '/commercial/dishwasher-repair/',                        linkText: 'Commercial dishwasher repair (OPL / conveyor)' },
  'washer-repair':           { url: '/commercial/washer-repair/',                            linkText: 'Commercial laundry — washer repair' },
  'dryer-repair':            { url: '/commercial/dryer-repair/',                             linkText: 'Commercial laundry — dryer repair' },
  'microwave-repair':        null,
  'garbage-disposal-repair': null,
};

export function getCommercialCrossLink(serviceSlug: string): CommercialCrossLink | null {
  return COMMERCIAL_CROSS_LINK_MAP[serviceSlug] ?? null;
}
