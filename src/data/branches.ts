// src/data/branches.ts
// SDAR — samedayappliance.repair
// Single source of truth: 5 branches with full NAP data
// Used by: CTA.astro, Footer.astro, [city].astro, Schema LocalBusiness
// Last updated: April 2026

import type { BranchSlug, County } from './cities';

export interface Branch {
  slug: BranchSlug;
  name: string;             // Display name — "West Hollywood"
  fullName: string;         // Full business name for Schema
  phone: string;            // NAP phone — must match GMB exactly
  phoneRaw: string;         // For href="tel:..." links
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    full: string;           // One-line full address
  };
  hours: {
    weekdays: string;       // "Monday–Friday"
    weekdayHours: string;   // "7:00 AM – 9:00 PM"
    saturday: string;
    saturdayHours: string;
    sunday: string;
    sundayHours: string;
    schema: string;         // OpeningHoursSpecification format
  };
  gmb: {
    status: 'active' | 'pending';
    profileUrl?: string;    // Full Google Business Profile URL
    placeId?: string;       // Google Place ID for Maps embed
  };
  counties: County[];       // Counties this branch serves
  zones: string[];          // Key neighborhoods/cities for display
  mapEmbedUrl?: string;     // Google My Maps embed URL
}

export const branches: Branch[] = [

  // =========================================================================
  // WEST HOLLYWOOD — Hub for WeHo, Beverly Hills, Hollywood area
  // GMB: ✅ Active
  // =========================================================================
  {
    slug: 'west-hollywood',
    name: 'West Hollywood',
    fullName: 'Same Day Appliance Repair — West Hollywood',
    phone: '(323) 870-4790',
    phoneRaw: '+13238704790',
    email: 'support@samedayappliance.repair',
    address: {
      street: '8730 Santa Monica Blvd',
      city: 'West Hollywood',
      state: 'CA',
      zip: '90069',
      full: '8730 Santa Monica Blvd, West Hollywood, CA 90069',
    },
    hours: {
      weekdays: 'Monday–Friday',
      weekdayHours: '7:00 AM – 9:00 PM',
      saturday: 'Saturday',
      saturdayHours: '8:00 AM – 7:00 PM',
      sunday: 'Sunday',
      sundayHours: '9:00 AM – 5:00 PM',
      schema: 'Mo-Fr 07:00-21:00, Sa 08:00-19:00, Su 09:00-17:00',
    },
    gmb: {
      status: 'active',
    },
    counties: ['los-angeles'],
    zones: [
      'West Hollywood',
      'Beverly Hills',
      'Hollywood',
      'Hollywood Hills',
      'Bel Air',
      'Silver Lake',
      'Los Feliz',
      'East Hollywood',
    ],
  },

  // =========================================================================
  // LOS ANGELES — Hub for Santa Monica, Brentwood, Culver City, Westside
  // GMB: ✅ Active
  // =========================================================================
  {
    slug: 'los-angeles',
    name: 'Los Angeles',
    fullName: 'Same Day Appliance Repair — Los Angeles',
    phone: '(424) 325-0520',
    phoneRaw: '+14243250520',
    email: 'info@samedayappliance.repair',
    address: {
      street: '11500 W Olympic Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90064',
      full: '11500 W Olympic Blvd, Los Angeles, CA 90064',
    },
    hours: {
      weekdays: 'Monday–Friday',
      weekdayHours: '7:00 AM – 9:00 PM',
      saturday: 'Saturday',
      saturdayHours: '8:00 AM – 7:00 PM',
      sunday: 'Sunday',
      sundayHours: '9:00 AM – 5:00 PM',
      schema: 'Mo-Fr 07:00-21:00, Sa 08:00-19:00, Su 09:00-17:00',
    },
    gmb: {
      status: 'active',
    },
    counties: ['los-angeles', 'san-bernardino', 'riverside'],
    zones: [
      'Santa Monica',
      'Brentwood',
      'Pacific Palisades',
      'Malibu',
      'Culver City',
      'Marina del Rey',
      'Playa del Rey',
      'Manhattan Beach',
      'Westwood',
      'Downtown Los Angeles',
      'Ladera Heights',
    ],
  },

  // =========================================================================
  // PASADENA — Hub for Pasadena, Burbank, Glendale, East LA
  // GMB: 🔄 Pending approval
  // =========================================================================
  {
    slug: 'pasadena',
    name: 'Pasadena',
    fullName: 'Same Day Appliance Repair — Pasadena',
    phone: '(626) 376-4458',
    phoneRaw: '+16263764458',
    email: 'pasadena@samedayappliance.repair',
    address: {
      street: '55 S Lake Ave',
      city: 'Pasadena',
      state: 'CA',
      zip: '91101',
      full: '55 S Lake Ave, Pasadena, CA 91101',
    },
    hours: {
      weekdays: 'Monday–Friday',
      weekdayHours: '7:00 AM – 9:00 PM',
      saturday: 'Saturday',
      saturdayHours: '8:00 AM – 7:00 PM',
      sunday: 'Sunday',
      sundayHours: '9:00 AM – 5:00 PM',
      schema: 'Mo-Fr 07:00-21:00, Sa 08:00-19:00, Su 09:00-17:00',
    },
    gmb: {
      status: 'pending',
    },
    counties: ['los-angeles'],
    zones: [
      'Pasadena',
      'Burbank',
      'Glendale',
      'Arcadia',
      'San Marino',
      'La Cañada Flintridge',
      'North Hollywood',
      'South Pasadena',
      'Monterey Park',
      'Alhambra',
      'Glassell Park',
    ],
  },

  // =========================================================================
  // THOUSAND OAKS — Hub for Ventura County + Calabasas area
  // GMB: ✅ Active
  // =========================================================================
  {
    slug: 'thousand-oaks',
    name: 'Thousand Oaks',
    fullName: 'Same Day Appliance Repair — Thousand Oaks',
    phone: '(424) 208-0228',
    phoneRaw: '+14242080228',
    email: 'thousandoaks@samedayappliance.repair',
    address: {
      street: '100 W Hillcrest Dr',
      city: 'Thousand Oaks',
      state: 'CA',
      zip: '91360',
      full: '100 W Hillcrest Dr, Thousand Oaks, CA 91360',
    },
    hours: {
      weekdays: 'Monday–Friday',
      weekdayHours: '7:00 AM – 9:00 PM',
      saturday: 'Saturday',
      saturdayHours: '8:00 AM – 7:00 PM',
      sunday: 'Sunday',
      sundayHours: '9:00 AM – 5:00 PM',
      schema: 'Mo-Fr 07:00-21:00, Sa 08:00-19:00, Su 09:00-17:00',
    },
    gmb: {
      status: 'active',
    },
    counties: ['ventura', 'los-angeles'],
    zones: [
      'Thousand Oaks',
      'Westlake Village',
      'Agoura Hills',
      'Calabasas',
      'Hidden Hills',
      'Moorpark',
      'Camarillo',
      'Simi Valley',
      'Newbury Park',
      'Oak Park',
      'Oxnard',
      'Ventura',
    ],
  },

  // =========================================================================
  // IRVINE — Hub for Orange County + temp coverage for Riverside County
  // GMB: 🔄 Pending approval
  // =========================================================================
  {
    slug: 'irvine',
    name: 'Irvine',
    fullName: 'Same Day Appliance Repair — Irvine',
    phone: '(213) 401-9019',
    phoneRaw: '+12134019019',
    email: 'irvine@samedayappliance.repair',
    address: {
      street: '2600 Michelson Dr',
      city: 'Irvine',
      state: 'CA',
      zip: '92612',
      full: '2600 Michelson Dr, Irvine, CA 92612',
    },
    hours: {
      weekdays: 'Monday–Friday',
      weekdayHours: '7:00 AM – 9:00 PM',
      saturday: 'Saturday',
      saturdayHours: '8:00 AM – 7:00 PM',
      sunday: 'Sunday',
      sundayHours: '9:00 AM – 5:00 PM',
      schema: 'Mo-Fr 07:00-21:00, Sa 08:00-19:00, Su 09:00-17:00',
    },
    gmb: {
      status: 'pending',
    },
    counties: ['orange', 'riverside'],
    zones: [
      'Irvine',
      'Newport Beach',
      'Laguna Beach',
      'Huntington Beach',
      'Costa Mesa',
      'Dana Point',
      'Laguna Niguel',
      'Mission Viejo',
      'Anaheim',
      'Yorba Linda',
      'Fullerton',
      'Temecula',
      'Murrieta',
    ],
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Get a branch by slug */
export function getBranchBySlug(slug: BranchSlug): Branch | undefined {
  return branches.find((b) => b.slug === slug);
}

/** Get all active GMB branches */
export function getActiveBranches(): Branch[] {
  return branches.filter((b) => b.gmb.status === 'active');
}

/** Get branches that serve a given county */
export function getBranchesByCounty(county: County): Branch[] {
  return branches.filter((b) => b.counties.includes(county));
}
