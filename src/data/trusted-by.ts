// src/data/trusted-by.ts
//
// "Trusted by" — commercial clients who gave the owner permission (10.10.2026) to be
// named on the site, plus one REAL completed job per business where we have one.
// Rendered by src/components/TrustedBy.astro (logo strip + case cards).
//
// RULES (owner decisions, 10.10.2026 — do not relax without the owner)
//   - Name + city / neighborhood only. NO street address, phone, email or contact
//     person of the business — anywhere, including alt text.
//   - Logos: only files taken from the business's OWN official website.
//     Venue photos: only the business's own website or Google Maps photos uploaded
//     BY THE OWNER. Never visitor photos, Street View, stock or AI images. When none
//     is available, the card uses our own job photo, or no photo at all.
//     Every file's source URL is recorded in src/data/trusted-by.sources.md.
//   - FRANCHISES — IHOP Lake Elsinore, Ramada by Wyndham Culver City, Krispy Krunchy
//     Chicken: no franchise-brand logo or corporate imagery, ever — text tile only
//     (IHOP: text name + our job photo on its card).
//   - Wave 2 (owner, 10.10.2026): strip tiles only, NO case cards — we have no
//     verified job details for them. Add a card only from a Fixar record.
//   - No invented quotes or testimonials, and NO Review / AggregateRating schema for
//     this block (self-serving reviews).
//   - Card text is only what the Fixar record says (estimate lines, technician notes,
//     tech-group messages). No prices.
//   - `fixarJob` is an internal reference and is NEVER rendered.
//   - `published: false` keeps a card out of every page (kept here so the record and
//     the reason are not lost).

export interface TrustedCase {
  /** Month of the job, YYYY-MM. */
  date: string;
  /** Equipment as printed on the card (brand + model / type). */
  equipment: string;
  /** What was wrong, as reported / recorded. */
  problem: string;
  /** What our technician found and did. */
  work: string;
  outcome: 'repaired';
  /** Our own job photos (site paths), best first. 800×600 webp. */
  photos: { src: string; alt: string }[];
  /**
   * Site paths of the equipment pages this job belongs to (trailing slash). A page
   * renders the card when its own path is in this list.
   */
  relatedServicePaths: string[];
  /** Fixar job number — internal reference only, never rendered. */
  fixarJob: string;
  /** false = not shown anywhere (see `holdReason`). Default true. */
  published?: boolean;
  /** Why an unpublished card is held back (internal, never rendered). */
  holdReason?: string;
}

export interface TrustedBusiness {
  slug: string;
  name: string;
  /** Plain business type, e.g. "Italian restaurant". */
  type: string;
  /** City / neighborhood as printed. No street. */
  area: string;
  /**
   * Strip group: 'food' = restaurants, food & hospitality; 'institution' = healthcare,
   * finance, education, community. Food & hospitality render first.
   */
  group: 'food' | 'institution';
  /** Shown in the compact homepage strip (keep ~10, logos preferred). */
  featured?: boolean;
  /** Logo from the business's own website (site path), webp, 120px tall. */
  logo?: { src: string; width: number; height: number };
  /** Venue photo from the business's own website / owner-uploaded Maps photo. 800×600 webp. */
  venuePhoto?: { src: string; alt: string };
  card?: TrustedCase;
}

const L = '/images/trusted-by/logos/';
const P = '/images/trusted-by/photos/';

export const TRUSTED_BUSINESSES: TrustedBusiness[] = [
  {
    slug: 'la-bettola-di-terroni',
    group: 'food',
    featured: true,
    name: 'La Bettola di Terroni',
    type: 'Italian restaurant',
    area: 'Larchmont Village, Los Angeles',
    logo: { src: `${L}la-bettola-di-terroni.webp`, width: 189, height: 120 },
    venuePhoto: { src: `${P}la-bettola-di-terroni-window.webp`, alt: 'La Bettola di Terroni window lettering in Larchmont Village' },
    card: {
      date: '2026-08',
      equipment: 'Icetro IM-0550 ice machine',
      problem: 'The commercial ice machine had stopped working.',
      work: 'Our technician cleaned the condenser coil and replaced the water level sensor.',
      outcome: 'repaired',
      photos: [],
      relatedServicePaths: ['/commercial/ice-machines/'],
      fixarJob: '100670'
    }
  },
  {
    slug: 'paradise-buffet',
    group: 'food',
    featured: true,
    name: 'Paradise Buffet',
    type: 'Buffet restaurant',
    area: 'Bell & Montebello',
    logo: { src: `${L}paradise-buffet.webp`, width: 301, height: 120 },
    card: {
      date: '2026-09',
      equipment: 'Rational combi oven',
      problem: 'The Rational combi oven in the Bell kitchen needed repair.',
      work: 'Our technician replaced the pump control board and installed a cooling-air inlet filter.',
      outcome: 'repaired',
      photos: [],
      relatedServicePaths: ['/brands/rational/', '/commercial/oven-repair/combi-oven-repair/'],
      fixarJob: '100989'
    }
  },
  {
    slug: 'fiora-pizzeria',
    group: 'food',
    featured: true,
    name: 'Fiora Pizzeria',
    type: 'Pizzeria',
    area: 'Redlands',
    logo: { src: `${L}fiora-pizzeria.webp`, width: 237, height: 120 },
    card: {
      date: '2026-09',
      equipment: 'Mecnosud IM44AD ice machine',
      problem: 'The ice machine had stopped working.',
      work: 'Our technician traced the fault to the wire harness and repaired it on site — no parts needed.',
      outcome: 'repaired',
      photos: [{ src: `${P}fiora-pizzeria-mecnosud-ice-machine-plate.webp`, alt: 'Mecnosud IM44AD ice machine data plate, photographed by our technician' }],
      relatedServicePaths: ['/commercial/ice-machines/'],
      fixarJob: '101144'
    }
  },
  {
    slug: 'trumans-bakery',
    group: 'food',
    featured: true,
    name: "Truman's Bakery",
    type: 'Gluten-free bakery',
    area: 'Beverly Grove, Los Angeles',
    logo: { src: `${L}trumans-bakery.webp`, width: 220, height: 120 },
    card: {
      date: '2026-09',
      equipment: 'Blodgett BDO-100-G-ES gas convection oven',
      problem: 'The oven would sometimes stop heating.',
      work: "Our technician repaired the oven's start and gas ignition system, finishing on a return visit once the ordered part arrived.",
      outcome: 'repaired',
      photos: [],
      relatedServicePaths: ['/brands/blodgett-oven-repair/', '/commercial/oven-repair/convection-oven-repair/'],
      fixarJob: '101250'
    }
  },
  {
    slug: 'milios-pizza',
    group: 'food',
    featured: true,
    name: "Milio's Pizza",
    type: 'Pizzeria',
    area: 'Downtown Santa Barbara',
    logo: { src: `${L}milios-pizza.webp`, width: 272, height: 120 },
    card: {
      date: '2026-10',
      equipment: 'Bakers Pride deck pizza oven',
      problem: 'The pilot light would not stay lit, so the deck oven could not run.',
      work: 'Our technician replaced the pilot generator assembly and the thermocouple; the burners lit and held a steady flame, and the oven was back in service the same day.',
      outcome: 'repaired',
      photos: [
        { src: `${P}milios-pizza-bakers-pride-oven.webp`, alt: 'Bakers Pride deck pizza oven with the control panel open during the repair' },
        { src: `${P}milios-pizza-pilot-after.webp`, alt: 'Burner flame inside the Bakers Pride deck oven after the pilot assembly was replaced' }
      ],
      relatedServicePaths: ['/brands/bakers-pride-pizza-oven-repair/', '/commercial/pizza-oven-repair/', '/commercial/pizza-oven-repair/deck-pizza-oven-repair/'],
      fixarJob: '101392'
    }
  },
  {
    // FRANCHISE — no IHOP logo or corporate imagery, ever.
    slug: 'ihop-lake-elsinore',
    group: 'food',
    name: 'IHOP — Lake Elsinore',
    type: 'Restaurant (franchise)',
    area: 'Lake Elsinore',
    card: {
      date: '2026-10',
      equipment: 'Walk-in freezer',
      problem: 'The walk-in freezer was not working.',
      work: 'Our technician found the start device on the condensing unit broken and replaced the start device assembly.',
      outcome: 'repaired',
      photos: [],
      relatedServicePaths: ['/commercial/refrigeration/walk-in-freezer-repair/'],
      fixarJob: '101401',
    }
  },
  {
    slug: 'made-by-meg-catering',
    group: 'food',
    name: 'Made by Meg Catering',
    type: 'Catering company',
    area: 'Torrance',
    logo: { src: `${L}made-by-meg-catering.webp`, width: 159, height: 120 }
  },
  {
    slug: 'zendejas-mexican-grill',
    group: 'food',
    name: 'Zendejas Mexican Grill',
    type: 'Mexican restaurant',
    area: 'Rancho Cucamonga',
    logo: { src: `${L}zendejas-mexican-grill.webp`, width: 266, height: 86 }
  },
  // ── Wave 2 (owner permission 10.10.2026) — strip only, no cards ──
  {
    slug: 'poki-house',
    name: 'Poki House',
    type: 'Poke restaurant',
    area: 'Los Angeles',
    group: 'food'
  },
  {
    slug: 'blairs',
    name: "Blair's",
    type: 'Restaurant',
    area: 'Silver Lake, Los Angeles',
    group: 'food'
  },
  {
    slug: 'yamuna-delights',
    name: 'Yamuna Delights',
    type: 'Restaurant',
    area: 'Rosemead',
    group: 'food'
  },
  {
    slug: 'boba-boba',
    name: 'Boba Boba',
    type: 'Boba & dessert café',
    area: 'Saugus, Santa Clarita',
    group: 'food'
  },
  {
    slug: 'el-ruisenor-de-mexico',
    name: 'El Ruiseñor de Mexico',
    type: 'Mexican restaurant',
    area: 'Huntington Park',
    group: 'food'
  },
  {
    slug: 'hibachi-papi',
    name: 'Hibachi Papi',
    type: 'Hibachi restaurant',
    area: 'Westwood, Los Angeles',
    group: 'food',
    featured: true,
    logo: { src: `${L}hibachi-papi.webp`, width: 78, height: 120 }
  },
  {
    slug: 'rose-bakery',
    name: 'Rose Bakery',
    type: 'Bakery',
    area: 'Los Angeles',
    group: 'food'
  },
  {
    slug: 'pankina-grill',
    name: 'Pankina Grill',
    type: 'Mediterranean & Middle Eastern restaurant',
    area: 'Tarzana, Los Angeles',
    group: 'food',
    logo: { src: `${L}pankina-grill.webp`, width: 118, height: 120 }
  },
  {
    slug: 'valley-hunt-club',
    name: 'The Valley Hunt Club',
    type: 'Private club',
    area: 'Pasadena',
    group: 'food'
  },
  {
    slug: 'hollywood-vip-hotel',
    name: 'Hollywood VIP Hotel',
    type: 'Hotel',
    area: 'Hollywood',
    group: 'food',
    featured: true,
    logo: { src: `${L}hollywood-vip-hotel.webp`, width: 264, height: 80 }
  },
  {
    // FRANCHISE — no Ramada / Wyndham logo or imagery, ever.
    slug: 'ramada-culver-city',
    name: 'Ramada by Wyndham Culver City',
    type: 'Hotel (franchise)',
    area: 'Culver City',
    group: 'food'
  },
  {
    // FRANCHISE — no Krispy Krunchy logo or imagery, ever.
    slug: 'krispy-krunchy-chicken-la',
    name: 'Krispy Krunchy Chicken',
    type: 'Restaurant (franchise)',
    area: 'Los Angeles',
    group: 'food'
  },
  {
    slug: 'coast-plaza-hospital',
    name: 'Coast Plaza Hospital',
    type: 'Hospital',
    area: 'Norwalk',
    group: 'institution',
    featured: true,
    logo: { src: `${L}coast-plaza-hospital.webp`, width: 482, height: 120 }
  },
  {
    slug: '1st-century-bank',
    name: '1st Century Bank',
    type: 'Bank',
    area: 'Century City, Los Angeles',
    group: 'institution'
  },
  {
    slug: 'blind-childrens-center',
    name: "Blind Children's Center",
    type: 'Nonprofit',
    area: 'Los Angeles',
    group: 'institution',
    featured: true,
    logo: { src: `${L}blind-childrens-center.webp`, width: 275, height: 120 }
  },
  {
    slug: 'boys-girls-club-santa-ana',
    name: 'Boys & Girls Club',
    type: 'Youth nonprofit',
    area: 'Santa Ana',
    group: 'institution'
  },
  {
    slug: 'westwood-presbyterian-church',
    name: 'Westwood Presbyterian Church',
    type: 'Church',
    area: 'Westwood, Los Angeles',
    group: 'institution',
    featured: true,
    logo: { src: `${L}westwood-presbyterian-church.webp`, width: 497, height: 120 }
  }
];

/** Strip order: food & hospitality first, then institutions (stable within a group). */
export function stripBusinesses(): TrustedBusiness[] {
  return [
    ...TRUSTED_BUSINESSES.filter((b) => b.group === 'food'),
    ...TRUSTED_BUSINESSES.filter((b) => b.group === 'institution')
  ];
}

/** Compact homepage selection (`featured`), same order as the strip. */
export function featuredBusinesses(): TrustedBusiness[] {
  return stripBusinesses().filter((b) => b.featured);
}

/** Cards that may be shown, newest first. */
export function publishedCases(): (TrustedBusiness & { card: TrustedCase })[] {
  return TRUSTED_BUSINESSES
    .filter((b): b is TrustedBusiness & { card: TrustedCase } => !!b.card && b.card.published !== false)
    .sort((a, b) => b.card.date.localeCompare(a.card.date));
}

/** Published cards whose relatedServicePaths include `path` (normalised to a trailing slash). */
export function casesForPath(path: string): (TrustedBusiness & { card: TrustedCase })[] {
  const p = path.endsWith('/') ? path : `${path}/`;
  return publishedCases().filter((b) => b.card.relatedServicePaths.includes(p));
}
