// src/data/branches.ts
//
// SINGLE SOURCE OF TRUTH for all 7 service locations.
//
// CRITICAL RULE — DO NOT VIOLATE:
//   Only `physical_pin` type renders public street address.
//   `service_area` type MUST NEVER expose street address publicly anywhere
//   (homepage, footer, branch page, schema, hero, anywhere).
//   Violations risk GBP suspension under Google SAB guidelines.
//
// See: wiki/decisions/branch-types-and-public-nap-rules.md

export type LocationType = 'physical_pin' | 'service_area';

export type GBPStatus =
  | 'verified_pin'   // GBP verified with public street address (storefront)
  | 'verified_sab'   // GBP verified as Service Area Business (no public address)
  | 'unverified'     // GBP not yet verified
  | 'pending';       // No GBP yet, no real phone yet

export type PhoneStatus =
  | 'active'   // Real working number
  | 'pending'; // Placeholder 555 — must be replaced before deploy

export interface BranchGeo {
  /** City center latitude — used for SVG map pins and serviceArea.geoMidpoint */
  cityCenterLat: number;
  /** City center longitude — same use */
  cityCenterLng: number;
  /** Service radius in miles for GeoCircle schema */
  serviceRadius: number;
}

export interface BranchAddress {
  street: string;
  city: string;
  state: 'CA';
  zip: string;
  /** Real geo coordinates of the actual address. ONLY used for physical_pin type. */
  lat?: number;
  lng?: number;
}

export interface Branch {
  /** URL slug for /branches/[slug] */
  slug: string;
  /** Display name in UI */
  name: string;
  /** Full descriptive name for schema and titles */
  fullName: string;
  /** EXACT name as registered in Google Business Profile listing.
   *  Used as the `name` field in LocalBusiness JSON-LD schema.
   *  CRITICAL for NAP consistency — must match GBP word-for-word.
   *  For service_area locations without verified GBP yet, use the pattern
   *  'Same Day Appliance Repair {City}' which is reserved for future registration. */
  gbpName: string;
  /** Determines public address visibility. CRITICAL FIELD. */
  type: LocationType;
  /** GBP verification status */
  gbpStatus: GBPStatus;
  /** GBP CID URL for schema hasMap (only if verified) */
  gbpUrl?: string;
  /** Date GBP was verified, ISO format. For schema reference. */
  gbpVerifiedDate?: string;
  /** Aggregate rating from GBP (only for verified GBPs with reviews) */
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  /** Local DID phone for this territory */
  phone: string;
  phoneStatus: PhoneStatus;
  /** Per-branch contact email. Used in schema and contact pages. */
  email: string;
  /** ONLY populate for type === 'physical_pin'. NEVER for service_area. */
  address?: BranchAddress;
  /** Internal-only address (IRS, business records). NEVER rendered publicly. */
  internalAddress?: BranchAddress;
  /** Geo data — used for SVG map pins and serviceArea schema */
  geo: BranchGeo;
  hours: {
    days: string;
    open: string;
    close: string;
  };
  /** County this branch primarily services */
  primaryCounty: 'los-angeles' | 'orange' | 'ventura' | 'san-bernardino' | 'riverside';
  /** All cities served by this branch (city slugs) */
  citiesServed: string[];
  /** Curated 3-4 neighborhood/city names to display on brand pages.
   *  Different from citiesServed (slugs): these are pre-formatted display strings
   *  for "areas served" subline in BrandBranchesGrid cards. Curated to avoid
   *  overlap with adjacent branches (e.g. WeHo doesn't display Beverly Hills
   *  since BH has its own branch). */
  displayAreas: string[];
}

export const BRANCHES: Branch[] = [
  // ─────────────────────────────────────────────────
  // 1. WEST HOLLYWOOD — Physical pin (THE ONLY ONE)
  // ─────────────────────────────────────────────────
  {
    slug: 'west-hollywood',
    name: 'West Hollywood',
    fullName: 'Same Day Appliance Repair — West Hollywood',
    gbpName: 'Same Day Appliance Repair',
    type: 'physical_pin',
    gbpStatus: 'verified_pin',
    gbpUrl: 'https://share.google/MZH7ZdnIWHiAp8Zm3',
    gbpVerifiedDate: 'TODO_ROMAN_CONFIRM',
    aggregateRating: { ratingValue: 4.6, reviewCount: 37 },
    phone: '(323) 870-4790',
    phoneStatus: 'active',
    email: 'support@samedayappliance.repair',
    address: {
      street: '8746 Rangely Ave',
      city: 'West Hollywood',
      state: 'CA',
      zip: '90048',
      lat: 34.0894,
      lng: -118.3895,
    },
    geo: {
      cityCenterLat: 34.0900,
      cityCenterLng: -118.3617,
      serviceRadius: 10,
    },
    hours: { days: 'Mon-Sun', open: '08:00', close: '20:00' },
    primaryCounty: 'los-angeles',
    citiesServed: [
      'west-hollywood',
      'hollywood',
      'mid-wilshire',
      'fairfax',
      'hancock-park',
    ],
    displayAreas: ['West Hollywood', 'Hollywood', 'Hancock Park', 'Mid-Wilshire'],
  },

  // ─────────────────────────────────────────────────
  // 8. BEVERLY HILLS — Service Area (unverified GBP)
  // (Numbered "8" historically — added 2026-04-26 evening per Roman.
  //  Placed between WeHo and LA in array since it shares LA County and
  //  is geographically adjacent to WeHo.)
  // ─────────────────────────────────────────────────
  {
    slug: 'beverly-hills',
    name: 'Beverly Hills',
    fullName: 'Same Day Appliance Repair — Beverly Hills',
    gbpName: 'Same Day Appliance Repair Beverly Hills',
    type: 'service_area',
    gbpStatus: 'unverified',
    phone: '(424) 248-1199',
    phoneStatus: 'active',
    email: 'beverlyhills@samedayappliance.repair',
    internalAddress: {
      street: '12142 W Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90077',
    },
    geo: {
      cityCenterLat: 34.0736,
      cityCenterLng: -118.4004,
      serviceRadius: 8,
    },
    hours: { days: 'Mon-Sun', open: '08:00', close: '20:00' },
    primaryCounty: 'los-angeles',
    citiesServed: [
      'beverly-hills',
    ],
    displayAreas: ['Beverly Hills', 'Beverly Glen', 'Trousdale Estates'],
  },

  // ─────────────────────────────────────────────────
  // 2. LOS ANGELES — Service Area Business
  // ─────────────────────────────────────────────────
  {
    slug: 'los-angeles',
    name: 'Los Angeles',
    fullName: 'Same Day Appliance Repair — Los Angeles',
    gbpName: 'Same Day Appliance Repair',
    type: 'service_area',
    gbpStatus: 'verified_sab',
    gbpUrl: 'https://share.google/dBFQdBNMTF9W7og21',
    aggregateRating: { ratingValue: 5.0, reviewCount: 13 },
    phone: '(424) 325-0520',
    phoneStatus: 'active',
    email: 'info@samedayappliance.repair',
    // address: undefined — SAB rule, NO public address
    internalAddress: {
      street: '11352 Elderwood Street',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90049',
    },
    geo: {
      cityCenterLat: 34.0522,
      cityCenterLng: -118.2437,
      serviceRadius: 25,
    },
    hours: { days: 'Mon-Sun', open: '07:00', close: '21:00' },
    primaryCounty: 'los-angeles',
    citiesServed: [
      'los-angeles',
      'brentwood',
      'bel-air',
      'pacific-palisades',
      'santa-monica',
      'westwood',
      'century-city',
      'cheviot-hills',
      'west-los-angeles',
      'beverly-glen',
      'marina-del-rey',
      'playa-del-rey',
      'culver-city',
      'venice',
      'mar-vista',
      'agoura-hills',
      'burbank',
      'calabasas',
      'eagle-rock',
      'el-segundo',
      'encino',
      'glassell-park',
      'long-beach',
      'malibu',
      'manhattan-beach',
      'monrovia',
      'north-hollywood',
      'redondo-beach',
      'sherman-oaks',
      'studio-city',
      'tarzana',
      'toluca-lake',
      'torrance',
      'woodland-hills',
      'koreatown',
    ],
    displayAreas: ['Brentwood', 'Santa Monica', 'Westwood', 'Malibu'],
  },

  // ─────────────────────────────────────────────────
  // 3. PASADENA — Service Area (unverified GBP)
  // ─────────────────────────────────────────────────
  {
    slug: 'pasadena',
    name: 'Pasadena',
    fullName: 'Same Day Appliance Repair — Pasadena',
    gbpName: 'Same Day Appliance Repair Pasadena',
    type: 'service_area',
    gbpStatus: 'unverified',
    phone: '(626) 376-4458',
    phoneStatus: 'active',
    email: 'pasadena@samedayappliance.repair',
    internalAddress: {
      street: '1205 Columbia Pl',
      city: 'Pasadena',
      state: 'CA',
      zip: '91105',
    },
    geo: {
      cityCenterLat: 34.1478,
      cityCenterLng: -118.1445,
      serviceRadius: 20,
    },
    hours: { days: 'Mon-Sun', open: '07:00', close: '21:00' },
    primaryCounty: 'los-angeles',
    citiesServed: [
      'pasadena',
      'la-canada-flintridge',
      'south-pasadena',
      'glendale',
      'arcadia',
      'sierra-madre',
      'los-feliz',
      'alhambra',
      'san-marino',
      'san-gabriel',
      'monterey-park',
      'highland-park',
      'silver-lake',
      'atwater-village',
      'altadena',
      'temple-city',
    ],
    displayAreas: ['Pasadena', 'Arcadia', 'South Pasadena', 'San Marino'],
  },

  // ─────────────────────────────────────────────────
  // 4. THOUSAND OAKS — Service Area Business
  // ─────────────────────────────────────────────────
  {
    slug: 'thousand-oaks',
    name: 'Thousand Oaks',
    fullName: 'Same Day Appliance Repair — Thousand Oaks',
    gbpName: 'Same Day Appliance Repair Thousand Oaks',
    type: 'service_area',
    gbpStatus: 'verified_sab',
    gbpUrl: 'https://share.google/DXrnBNy1purtECJTu',
    aggregateRating: { ratingValue: 5.0, reviewCount: 7 },
    phone: '(424) 208-0228',
    phoneStatus: 'active',
    email: 'thousandoaks@samedayappliance.repair',
    internalAddress: {
      street: '1669 Tiburon Ct',
      city: 'Thousand Oaks',
      state: 'CA',
      zip: '91362',
    },
    geo: {
      cityCenterLat: 34.1706,
      cityCenterLng: -118.8376,
      serviceRadius: 25,
    },
    hours: { days: 'Mon-Sun', open: '07:00', close: '21:00' },
    primaryCounty: 'ventura',
    citiesServed: [
      'thousand-oaks',
      'westlake-village',
      'agoura-hills',
      'camarillo',
      'moorpark',
      'newbury-park',
      'oak-park',
      'ojai',
      'oxnard',
      'simi-valley',
      'ventura',
    ],
    displayAreas: ['Thousand Oaks', 'Westlake Village', 'Newbury Park'],
  },

  // ─────────────────────────────────────────────────
  // 5. IRVINE — Service Area (unverified GBP)
  // ─────────────────────────────────────────────────
  {
    slug: 'irvine',
    name: 'Irvine',
    fullName: 'Same Day Appliance Repair — Irvine',
    gbpName: 'Same Day Appliance Repair Irvine',
    type: 'service_area',
    gbpStatus: 'unverified',
    phone: '(213) 401-9019',
    phoneStatus: 'active',
    email: 'irvine@samedayappliance.repair',
    internalAddress: {
      street: '53 Bellwind',
      city: 'Irvine',
      state: 'CA',
      zip: '92603',
    },
    geo: {
      cityCenterLat: 33.6846,
      cityCenterLng: -117.8265,
      serviceRadius: 25,
    },
    hours: { days: 'Mon-Sun', open: '07:00', close: '21:00' },
    primaryCounty: 'orange',
    citiesServed: [
      'irvine',
      'newport-beach',
      'laguna-beach',
      'huntington-beach',
      'costa-mesa',
      'dana-point',
      'anaheim',
      'fullerton',
      'laguna-niguel',
      'mission-viejo',
      'san-clemente',
      'santa-ana',
      'tustin',
      'villa-park',
      'yorba-linda',
    ],
    displayAreas: ['Irvine', 'Newport Beach', 'Costa Mesa', 'Tustin'],
  },

  // ─────────────────────────────────────────────────
  // 6. RANCHO CUCAMONGA — Service Territory
  // Phone is a temporary placeholder (555 pattern); active on city pages
  // until Roman swaps in the real DID. T13-FIX flipped pending → active so
  // SB county cities show this number rather than fall back to MAIN_PHONE.
  // ─────────────────────────────────────────────────
  {
    slug: 'rancho-cucamonga',
    name: 'Rancho Cucamonga',
    fullName: 'Same Day Appliance Repair — Rancho Cucamonga',
    gbpName: 'Same Day Appliance Repair Rancho Cucamonga',
    type: 'service_area',
    gbpStatus: 'pending',
    phone: '(909) 457-1030',
    phoneStatus: 'active',
    email: 'ranchocucamonga@samedayappliance.repair',
    // No internalAddress — true service territory
    geo: {
      cityCenterLat: 34.1064,
      cityCenterLng: -117.5931,
      serviceRadius: 25,
    },
    hours: { days: 'Mon-Sun', open: '07:00', close: '21:00' },
    primaryCounty: 'san-bernardino',
    citiesServed: [
      'rancho-cucamonga',
      'chino-hills',
      'fontana',
      'loma-linda',
      'ontario',
      'redlands',
      'san-bernardino',
      'upland',
    ],
    displayAreas: ['Rancho Cucamonga', 'Upland', 'Ontario', 'Fontana'],
  },

  // ─────────────────────────────────────────────────
  // 7. TEMECULA — Service Territory
  // Phone is a temporary placeholder (555 pattern); active on city pages
  // until Roman swaps in the real DID. T13-FIX flipped pending → active so
  // Riverside county cities show this number rather than fall back to MAIN_PHONE.
  // ─────────────────────────────────────────────────
  {
    slug: 'temecula',
    name: 'Temecula',
    fullName: 'Same Day Appliance Repair — Temecula',
    gbpName: 'Same Day Appliance Repair Temecula',
    type: 'service_area',
    gbpStatus: 'pending',
    phone: '(951) 577-3877',
    phoneStatus: 'active',
    email: 'temecula@samedayappliance.repair',
    geo: {
      cityCenterLat: 33.4936,
      cityCenterLng: -117.1484,
      serviceRadius: 30,
    },
    hours: { days: 'Mon-Sun', open: '07:00', close: '21:00' },
    primaryCounty: 'riverside',
    citiesServed: [
      'temecula',
      'corona',
      'hemet',
      'lake-elsinore',
      'menifee',
      'moreno-valley',
      'murrieta',
      'riverside',
    ],
    displayAreas: ['Temecula', 'Murrieta', 'Menifee'],
  },
];

// ─────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────

/** Main HQ phone — TopBar, Hero CTA, Layout default */
export const MAIN_PHONE = '(424) 325-0520';

/** Main HQ phone in tel:-link format (e.g. for `<a href={`tel:${MAIN_PHONE_TEL}`}>`).
 *  Derived from MAIN_PHONE — keep these in lockstep. Used by brand placeholders + any
 *  surface that needs a phone tel: link without re-deriving the format inline. */
export const MAIN_PHONE_TEL = '+1' + MAIN_PHONE.replace(/\D/g, '');

/** Legal entity address — for footer legal line and Organization schema */
export const LEGAL_ADDRESS = {
  entity: 'HVAC 777 LLC',
  street: '6230 Wilshire Blvd Ste A PMB 2267',
  city: 'Los Angeles',
  state: 'CA' as const,
  zip: '90048',
};

/** The single physical pin — for primary LocalBusiness schema */
export const HEADQUARTERS = BRANCHES.find(b => b.type === 'physical_pin')!;

/** All 6 service area locations — for serviceArea-only LocalBusiness schema */
export const SERVICE_AREAS = BRANCHES.filter(b => b.type === 'service_area');

/** Total unique cities across all branches — should match cities.ts count */
export const TOTAL_CITIES_SERVED = new Set(
  BRANCHES.flatMap(b => b.citiesServed)
).size;

/** Get the branch that primarily services a given city */
export function getBranchForCity(citySlug: string): Branch | undefined {
  return BRANCHES.find(b => b.citiesServed.includes(citySlug));
}

/** Check if a phone number is a placeholder 555 fake */
export function isPlaceholderPhone(phone: string): boolean {
  return /\(\d{3}\)\s?555-\d{4}/.test(phone);
}

/** Convert miles to meters for schema GeoCircle (which expects meters) */
export function milesToMeters(miles: number): number {
  return Math.round(miles * 1609.344);
}

/** Cities in citiesServed that don't yet have .astro pages.
 *  These are tracked but NOT shown as clickable links on the homepage.
 *  When .astro pages are created, remove from this set. */
export const CITIES_WITHOUT_PAGES = new Set<string>([
  // WeHo
  'mid-wilshire', 'fairfax', 'hancock-park',
  // LA
  'century-city', 'cheviot-hills', 'beverly-glen',
  'playa-del-rey', 'venice', 'mar-vista',
  // Pasadena
  'sierra-madre', 'altadena',
]);

/** Returns citiesServed for a branch, but ONLY those with .astro pages on disk.
 *  Use this when generating clickable city lists on homepage / branch pages. */
export function getServeableCitiesForBranch(branch: Branch): string[] {
  return branch.citiesServed.filter(slug => !CITIES_WITHOUT_PAGES.has(slug));
}

/** Total cities with actual .astro pages — use for "{N} cities" displays */
export const TOTAL_CITIES_WITH_PAGES =
  Array.from(new Set(BRANCHES.flatMap(b => b.citiesServed)))
       .filter(slug => !CITIES_WITHOUT_PAGES.has(slug))
       .length;
