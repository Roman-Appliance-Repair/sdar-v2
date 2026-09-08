// src/data/quote-context.ts
//
// QS-2: what the quote sheet can infer about a visitor from the page they opened
// it on. Derived from the URL and nothing else — no props to thread through 830
// page files, no per-page opt-in, and nothing that can drift out of sync with the
// page it describes.
//
// The rule that shapes every table below: A SLUG WE HAVE NOT MAPPED RESOLVES TO
// NULL. It is never guessed at, and never "close enough". A wrong prefill is worse
// than no prefill — the visitor either silently accepts a wrong appliance (and
// dispatch stocks the wrong van) or has to undo our guess before they can answer.
// Unmapped slugs are listed in the report, not quietly absorbed.
//
// Path classification follows MegaMenu.astro's approach (see its `_path` /
// `_brandSlug` block): read Astro.url.pathname, match against the same data files.
//
// Brand pages read their category suffix too (Roman, 2026-09-07):
// /brands/lg-washer-repair/ opens on the washer with an "LG" chip. That is 413
// pages, and it takes site-wide appliance coverage from roughly a third to nearly
// two thirds — the suffix is right there in the address and guessing nothing from
// it was leaving the largest page group blank.

import { CITIES } from './cities';
import { BRAND_PILLAR_MAP } from './brand-pillar-map';
import { COMMERCIAL_BRAND_SLUGS } from './commercial-brand-slugs';

export type QuoteScope = 'residential' | 'commercial';

export type PageType =
  | 'home'
  | 'city'
  | 'city_service'
  | 'service_hub'
  | 'service_sub'
  | 'brand'
  | 'commercial_hub'
  | 'commercial_sub'
  | 'commercial_brand'
  | 'outdoor'
  | 'county'
  | 'areas'
  | 'blog'
  | 'credentials'
  | 'price_list'
  | 'for_business'
  | 'book'
  | 'contact'
  | 'legal'
  | 'other';

export interface QuoteContext {
  /** Which price tier and which crew — decides whether step 1 can be skipped. */
  scope: QuoteScope | null;
  /** An appliance id from src/data/quote-appliances.ts, or null. */
  appliance: string | null;
  /** A /brands/{slug}/ pillar slug, or null. */
  brand: string | null;
  pageType: PageType;
}

const EMPTY: QuoteContext = { scope: null, appliance: null, brand: null, pageType: 'other' };

/**
 * Residential service slug -> appliance id.
 *
 * Keys cover both the plain slug and the `-los-angeles` legacy variant, because
 * both shapes exist under /services/. Sub-services live one level deeper and
 * inherit their parent hub's appliance (see getQuoteContext).
 */
const RESIDENTIAL_SERVICE_APPLIANCE: Record<string, string> = {
  'refrigerator-repair': 'refrigerator',
  'built-in-refrigerator-repair': 'refrigerator',
  'outdoor-refrigerator-repair': 'refrigerator',
  'freezer-repair': 'freezer',
  'washer-repair': 'washer',
  'washing-machine-repair': 'washer',
  'dryer-repair': 'dryer',
  // A blocked vent is the single most common reason a dryer stops drying — the
  // page is about the dryer, not about ductwork as its own appliance.
  'dryer-vent-repair': 'dryer',
  'stackable-washer-dryer-repair': 'washer_dryer_combo',
  'dishwasher-repair': 'dishwasher',
  'oven-repair': 'oven',
  'wall-oven-repair': 'oven',
  'range-repair': 'range_stove',
  'stove-repair': 'range_stove',
  'cooktop-repair': 'cooktop',
  'induction-cooktop-repair': 'cooktop',
  'range-hood-repair': 'range_hood',
  'microwave-repair': 'microwave',
  'wine-cooler-repair': 'wine_cooler',
  'ice-maker-repair': 'ice_maker',
  'garbage-disposal-repair': 'garbage_disposal',
  'trash-compactor-repair': 'trash_compactor',
};

/** Commercial slug -> appliance id. Keys are used under /commercial/ and for the
 *  `commercial-…-los-angeles` service hubs, which are the same equipment. */
const COMMERCIAL_SERVICE_APPLIANCE: Record<string, string> = {
  'dishwasher-repair': 'commercial_dishwasher',
  'dryer-repair': 'commercial_laundry',
  'washer-repair': 'commercial_laundry',
  'laundry-repair': 'commercial_laundry',
  'fryer-repair': 'fryer',
  'griddle-repair': 'griddle',
  'oven-repair': 'commercial_oven_range',
  // A deck or conveyor pizza oven is a commercial oven — same tile, same crew.
  'pizza-oven-repair': 'commercial_oven_range',
  'range-repair': 'commercial_oven_range',
  'stove-repair': 'commercial_oven_range',
  'ice-machines': 'ice_machine',
  'ice-machine-repair': 'ice_machine',
  'refrigerator-repair': 'reach_in',
  'freezer-repair': 'reach_in',
  'showcase-refrigerator-repair': 'display_case',
  'walk-in-cooler-repair': 'walk_in',
  'walk-in-freezer-repair': 'walk_in',
  // Brand slugs say it plainly: kolpak-walk-in-repair, nor-lake-walk-in-repair.
  // No /commercial/ route uses this key, so it only ever fires on a brand page.
  'walk-in-repair': 'walk_in',
};

/** /commercial/refrigeration/{slug}/ and /commercial/ice-machines/{slug}/ — the
 *  two subtrees where the appliance is named by the CHILD, not the parent hub. */
const COMMERCIAL_SUBTREE_APPLIANCE: Record<string, string> = {
  // refrigeration/
  'walk-in-cooler-repair': 'walk_in',
  'walk-in-freezer-repair': 'walk_in',
  'walk-in-door-repair': 'walk_in',
  'walk-in-cooler-not-cooling': 'walk_in',
  'walk-in-freezer-troubleshooting': 'walk_in',
  'reach-in-cooler-repair': 'reach_in',
  'reach-in-freezer-repair': 'reach_in',
  'reach-in-cooler-not-cooling': 'reach_in',
  'undercounter-refrigerator-repair': 'reach_in',
  'display-case-repair': 'display_case',
  'prep-table-repair': 'prep_table',
};

/** City × service combo slug -> appliance. The combo slugs are their own
 *  vocabulary (src/data/services.ts), not the /services/ hub slugs. */
const COMBO_APPLIANCE: Record<string, string> = {
  'refrigerator-repair': 'refrigerator',
  'freezer-repair': 'freezer',
  'washer-repair': 'washer',
  'dryer-repair': 'dryer',
  'dishwasher-repair': 'dishwasher',
  'oven-repair': 'oven',
  'wall-oven-repair': 'oven',
  'range-repair': 'range_stove',
  'stove-repair': 'range_stove',
  'cooktop-repair': 'cooktop',
  'range-hood-repair': 'range_hood',
  'microwave-repair': 'microwave',
  'wine-cooler-repair': 'wine_cooler',
  'ice-maker-repair': 'ice_maker',
  'garbage-disposal-repair': 'garbage_disposal',
  'ice-machine-repair': 'ice_machine',
};

/** Combo slugs that are commercial scope regardless of whether we can name the
 *  equipment. Everything else under a city is residential. */
const COMMERCIAL_COMBO_SLUGS = new Set(['commercial', 'commercial-refrigeration', 'ice-machine-repair']);

/**
 * /services/ hubs that are HVAC, not appliance repair. They resolve to NOTHING on
 * purpose: the sheet's step 1 commits to a residential or commercial diagnostic
 * fee, and neither tier is this equipment's price (service-catalog.ts prices HVAC
 * as `quote`). Showing step 1 unanswered is the correct behaviour here.
 */
const HVAC_SERVICE_SLUGS = new Set([
  'air-conditioner-repair-los-angeles',
  'furnace-repair-los-angeles',
  'heat-pump-repair-los-angeles',
  'hvac-repair-los-angeles',
  'wall-heater-repair-los-angeles',
  'water-heater-repair-los-angeles',
]);

/** Pillar slugs, longest first — /brands/lg-washer-repair/ must resolve to `lg`
 *  and /brands/ge-monogram-refrigerator-repair/ to `ge-monogram`, not `ge`. */
const PILLAR_SLUGS: string[] = [...new Set(Object.values(BRAND_PILLAR_MAP))].sort(
  (a, b) => b.length - a.length
);

const CITY_SLUGS = new Set(CITIES.map((c) => c.slug));

/** Strip the `-los-angeles` tail some /services/ hubs carry, so one table serves both. */
function baseServiceSlug(slug: string): string {
  return slug.replace(/-los-angeles$/, '');
}

/**
 * Category suffixes, longest first, so `lg-stackable-washer-dryer-repair` matches
 * the combo and not the bare `-dryer-repair` inside it, and
 * `sub-zero-built-in-refrigerator-repair` matches the built-in, not the plain fridge.
 */
const RES_SUFFIXES = Object.keys(RESIDENTIAL_SERVICE_APPLIANCE).sort((a, b) => b.length - a.length);
const COM_SUFFIXES = Object.keys(COMMERCIAL_SERVICE_APPLIANCE).sort((a, b) => b.length - a.length);

/**
 * A residential brand slug ending in `-pizza-oven-repair` is an OUTDOOR pizza oven
 * (`/brands/wolf-pizza-oven-repair/`), and the tiles carry no such thing — the plain
 * `oven` tile means the one in the kitchen. Under a commercial brand the same suffix
 * IS a commercial oven, so the exclusion is residential-only.
 */
const RES_SUFFIX_BLOCKLIST = new Set(['pizza-oven-repair']);

/**
 * The appliance a /brands/ slug names, if any. `lg-washer-repair` is a washer whether
 * or not `lg` happens to have a pillar entry, so this reads the tail of the slug and
 * never depends on the brand being resolvable.
 */
function applianceFromBrandSlug(slug: string, scope: QuoteScope): string | null {
  const commercial = scope === 'commercial';
  const table = commercial ? COMMERCIAL_SERVICE_APPLIANCE : RESIDENTIAL_SERVICE_APPLIANCE;
  for (const key of commercial ? COM_SUFFIXES : RES_SUFFIXES) {
    if (!commercial && RES_SUFFIX_BLOCKLIST.has(key)) continue;
    if (slug === key || slug.endsWith('-' + key)) return table[key];
  }
  return null;
}

function brandFromSlug(slug: string): string | null {
  for (const pillar of PILLAR_SLUGS) {
    if (slug === pillar || slug.startsWith(pillar + '-')) return pillar;
  }
  return null;
}

/**
 * The whole of QS-2's page awareness. Pure function of the pathname — same input,
 * same answer, on the server at build time and in a gate script.
 */
export function getQuoteContext(pathname: string): QuoteContext {
  const parts = String(pathname || '/')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean);

  if (parts.length === 0) return { ...EMPTY, pageType: 'home' };

  const [a, b, c, d] = parts;

  // ── /commercial/… ─────────────────────────────────────────────────────────
  if (a === 'commercial') {
    if (!b) return { scope: 'commercial', appliance: null, brand: null, pageType: 'commercial_hub' };

    // /commercial/{equipment}/brands/{brand}/
    if (c === 'brands' && d) {
      return {
        scope: 'commercial',
        appliance: COMMERCIAL_SERVICE_APPLIANCE[b] ?? null,
        brand: brandFromSlug(d),
        pageType: 'commercial_brand',
      };
    }

    if (!c) {
      return {
        scope: 'commercial',
        appliance: COMMERCIAL_SERVICE_APPLIANCE[b] ?? null,
        brand: null,
        pageType: 'commercial_hub',
      };
    }

    // /commercial/refrigeration/{x}/ and /commercial/ice-machines/{x}/ name the
    // equipment in the child; everything else inherits the hub.
    const child = COMMERCIAL_SUBTREE_APPLIANCE[c] ?? null;
    const inherited = COMMERCIAL_SERVICE_APPLIANCE[b] ?? null;
    return {
      scope: 'commercial',
      appliance: child ?? inherited,
      brand: null,
      pageType: 'commercial_sub',
    };
  }

  // ── /services/… ───────────────────────────────────────────────────────────
  if (a === 'services') {
    if (!b) return { ...EMPTY, pageType: 'service_hub' };
    const type: PageType = c ? 'service_sub' : 'service_hub';

    if (HVAC_SERVICE_SLUGS.has(b)) return { ...EMPTY, pageType: type };

    // `commercial-…-los-angeles` hubs are commercial equipment filed under /services/.
    if (b.startsWith('commercial-')) {
      const inner = baseServiceSlug(b).replace(/^commercial-/, '');
      return {
        scope: 'commercial',
        appliance:
          COMMERCIAL_SERVICE_APPLIANCE[inner] ??
          // `commercial-fryer-machine-repair`, `commercial-laundry-machine-repair`
          COMMERCIAL_SERVICE_APPLIANCE[inner.replace('-machine-repair', '-repair')] ??
          null,
        brand: null,
        pageType: type,
      };
    }

    const appliance = RESIDENTIAL_SERVICE_APPLIANCE[baseServiceSlug(b)] ?? null;
    return { scope: 'residential', appliance, brand: null, pageType: type };
  }

  // ── /outdoor/… — residential fee tier (factual-accuracy §9 puts all of
  //    /outdoor/ on the residential diagnostic). The tiles carry no grill, patio
  //    heater or smoker, so the appliance stays null. ───────────────────────────
  if (a === 'outdoor') {
    // /outdoor/brands/{brand}/ and /outdoor/{equipment}/brands/{brand}/
    const brandSlug = b === 'brands' ? c : c === 'brands' ? d : null;
    return {
      scope: 'residential',
      appliance: null,
      brand: brandSlug ? brandFromSlug(brandSlug) : null,
      pageType: 'outdoor',
    };
  }

  // ── /brands/… ─────────────────────────────────────────────────────────────
  //    Scope follows the fee the page itself prints: the commercial allowlist is
  //    the same one MegaMenu uses for the header promo, everything else is the
  //    residential tier. The category suffix names the appliance where there is
  //    one — a pillar like /brands/lg/ has none, and resolves to the brand alone.
  if (a === 'brands') {
    if (!b) return { ...EMPTY, pageType: 'brand' };
    const scope: QuoteScope = COMMERCIAL_BRAND_SLUGS.has(b) ? 'commercial' : 'residential';
    return {
      scope,
      appliance: applianceFromBrandSlug(b, scope),
      brand: brandFromSlug(b),
      pageType: 'brand',
    };
  }

  // ── fixed pages ───────────────────────────────────────────────────────────
  if (a === 'book') return { ...EMPTY, pageType: 'book' };
  if (a === 'contact') return { ...EMPTY, pageType: 'contact' };
  if (a === 'blog') return { ...EMPTY, pageType: 'blog' };
  if (a === 'areas') return { ...EMPTY, pageType: 'areas' };
  if (a === 'credentials') return { ...EMPTY, pageType: 'credentials' };
  if (a === 'price-list') return { ...EMPTY, pageType: 'price_list' };
  if (a === 'for-business') return { ...EMPTY, pageType: 'for_business' };
  if (a === 'privacy-policy' || a === 'terms') return { ...EMPTY, pageType: 'legal' };
  if (/-county$/.test(a)) return { ...EMPTY, pageType: 'county' };

  // ── /{city}/ and /{city}/{service}/ ───────────────────────────────────────
  if (CITY_SLUGS.has(a)) {
    // A city pillar sells every appliance and both scopes — nothing to prefill.
    if (!b) return { ...EMPTY, pageType: 'city' };
    return {
      scope: COMMERCIAL_COMBO_SLUGS.has(b) ? 'commercial' : 'residential',
      appliance: COMBO_APPLIANCE[b] ?? null,
      brand: null,
      pageType: 'city_service',
    };
  }

  return { ...EMPTY, pageType: 'other' };
}
