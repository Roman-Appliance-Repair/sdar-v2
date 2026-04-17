// src/data/services.ts
// SDAR — samedayappliance.repair
// Single source of truth: 30 services (15 residential + 15 commercial)
// Used by: [city].astro, [city]/[service].astro, CTA.astro, nav menus
// Last updated: April 2026

export type ServiceTier = 'tier1' | 'tier2' | 'tier3';

export interface Service {
  slug: string;           // URL slug — /services/[slug]/ or /commercial/[slug]/
  name: string;           // Short display name — "Refrigerator Repair"
  nameFull: string;       // Full name for H1/title — "Refrigerator Repair in [City]"
  commercial: boolean;    // false = /services/, true = /commercial/
  tier: ServiceTier;      // Content priority
  icon: string;           // Emoji icon for cards/nav
  priceFrom: number;      // Starting price for schema & display (USD)
  diagnosticFee: number;  // Diagnostic fee (waived if repair done)
  description: string;    // One-line description for meta/cards
  commonIssues: string[]; // For FAQ schema + content
}

export const services: Service[] = [

  // =========================================================================
  // RESIDENTIAL SERVICES — /services/[slug]/
  // =========================================================================

  // --- Tier 1 (highest search volume) ---
  {
    slug: 'refrigerator-repair',
    name: 'Refrigerator Repair',
    nameFull: 'Refrigerator Repair',
    commercial: false,
    tier: 'tier1',
    icon: '🧊',
    priceFrom: 149,
    diagnosticFee: 89,
    description: 'Same-day refrigerator repair for all brands. Not cooling, leaking, making noise — we fix it.',
    commonIssues: [
      'Refrigerator not cooling',
      'Refrigerator leaking water',
      'Refrigerator making noise',
      'Ice maker not working',
      'Refrigerator compressor failure',
      'Door seal not sealing',
    ],
  },
  {
    slug: 'washer-repair',
    name: 'Washer Repair',
    nameFull: 'Washing Machine Repair',
    commercial: false,
    tier: 'tier1',
    icon: '🫧',
    priceFrom: 129,
    diagnosticFee: 89,
    description: 'Same-day washer repair — not spinning, not draining, leaking. All brands, front & top load.',
    commonIssues: [
      'Washer not spinning',
      'Washer not draining',
      'Washer leaking water',
      'Washer making loud noise',
      'Washer door not opening',
      'Washer not starting',
    ],
  },
  {
    slug: 'dryer-repair',
    name: 'Dryer Repair',
    nameFull: 'Dryer Repair',
    commercial: false,
    tier: 'tier1',
    icon: '♨️',
    priceFrom: 129,
    diagnosticFee: 89,
    description: 'Same-day dryer repair — not heating, not spinning, taking too long. Gas & electric.',
    commonIssues: [
      'Dryer not heating',
      'Dryer not spinning',
      'Dryer taking too long to dry',
      'Dryer making noise',
      'Dryer stops mid-cycle',
      'Gas dryer not igniting',
    ],
  },
  {
    slug: 'oven-repair',
    name: 'Oven Repair',
    nameFull: 'Oven Repair',
    commercial: false,
    tier: 'tier1',
    icon: '🔥',
    priceFrom: 149,
    diagnosticFee: 89,
    description: 'Same-day oven repair — not heating, uneven temperature, igniter issues. Gas & electric.',
    commonIssues: [
      'Oven not heating',
      'Oven temperature inaccurate',
      'Oven igniter not working',
      'Oven door not closing',
      'Oven not self-cleaning',
      'Control panel not responding',
    ],
  },
  {
    slug: 'dishwasher-repair',
    name: 'Dishwasher Repair',
    nameFull: 'Dishwasher Repair',
    commercial: false,
    tier: 'tier1',
    icon: '🍽️',
    priceFrom: 129,
    diagnosticFee: 89,
    description: 'Same-day dishwasher repair — not cleaning, not draining, leaking. All brands.',
    commonIssues: [
      'Dishwasher not cleaning dishes',
      'Dishwasher not draining',
      'Dishwasher leaking',
      'Dishwasher not starting',
      'Dishwasher making noise',
      'Dishwasher leaving residue',
    ],
  },

  // --- Tier 2 ---
  {
    slug: 'freezer-repair',
    name: 'Freezer Repair',
    nameFull: 'Freezer Repair',
    commercial: false,
    tier: 'tier2',
    icon: '❄️',
    priceFrom: 149,
    diagnosticFee: 89,
    description: 'Same-day freezer repair — not freezing, frost buildup, noisy. Chest & upright.',
    commonIssues: [
      'Freezer not freezing',
      'Freezer frost buildup',
      'Freezer making noise',
      'Freezer door seal broken',
      'Freezer temperature fluctuating',
    ],
  },
  {
    slug: 'stove-repair',
    name: 'Stove Repair',
    nameFull: 'Stove Repair',
    commercial: false,
    tier: 'tier2',
    icon: '🍳',
    priceFrom: 129,
    diagnosticFee: 89,
    description: 'Same-day stove repair — burner not working, igniter issues, gas or electric.',
    commonIssues: [
      'Burner not working',
      'Igniter clicking continuously',
      'Gas burner not lighting',
      'Electric coil not heating',
      'Control knob broken',
    ],
  },
  {
    slug: 'wine-cooler-repair',
    name: 'Wine Cooler Repair',
    nameFull: 'Wine Cooler Repair',
    commercial: false,
    tier: 'tier2',
    icon: '🍷',
    priceFrom: 149,
    diagnosticFee: 89,
    description: 'Same-day wine cooler repair — not cooling, too warm, compressor issues. Sub-Zero, EuroCave, Vinotemp.',
    commonIssues: [
      'Wine cooler not cooling',
      'Wine cooler temperature too warm',
      'Wine cooler compressor not working',
      'Wine cooler making noise',
      'Wine cooler door seal broken',
    ],
  },
  {
    slug: 'cooktop-repair',
    name: 'Cooktop Repair',
    nameFull: 'Cooktop Repair',
    commercial: false,
    tier: 'tier2',
    icon: '🔆',
    priceFrom: 149,
    diagnosticFee: 89,
    description: 'Same-day cooktop repair — gas, electric, induction. Burner not working, sparking.',
    commonIssues: [
      'Cooktop burner not working',
      'Cooktop sparking',
      'Cooktop not heating evenly',
      'Glass cooktop cracked',
      'Control panel not responding',
    ],
  },
  {
    slug: 'microwave-repair',
    name: 'Microwave Repair',
    nameFull: 'Microwave Repair',
    commercial: false,
    tier: 'tier2',
    icon: '📡',
    priceFrom: 99,
    diagnosticFee: 89,
    description: 'Same-day microwave repair — not heating, turntable not spinning, sparking. Built-in & countertop.',
    commonIssues: [
      'Microwave not heating',
      'Microwave sparking inside',
      'Turntable not spinning',
      'Microwave display not working',
      'Microwave door not closing',
    ],
  },

  // --- Tier 3 ---
  {
    slug: 'range-hood-repair',
    name: 'Range Hood Repair',
    nameFull: 'Range Hood Repair',
    commercial: false,
    tier: 'tier3',
    icon: '💨',
    priceFrom: 119,
    diagnosticFee: 89,
    description: 'Same-day range hood repair — fan not working, lights out, motor issues.',
    commonIssues: [
      'Range hood fan not working',
      'Range hood lights not working',
      'Range hood making noise',
      'Range hood motor failure',
    ],
  },
  {
    slug: 'fireplace-repair',
    name: 'Fireplace Repair',
    nameFull: 'Fireplace Repair',
    commercial: false,
    tier: 'tier3',
    icon: '🔥',
    priceFrom: 179,
    diagnosticFee: 89,
    description: 'Same-day gas fireplace repair — not igniting, pilot light out, thermostat issues.',
    commonIssues: [
      'Gas fireplace not igniting',
      'Pilot light keeps going out',
      'Fireplace thermostat not working',
      'Fireplace remote not responding',
    ],
  },
  {
    slug: 'bbq-grill-repair',
    name: 'BBQ Grill Repair',
    nameFull: 'BBQ Grill Repair',
    commercial: false,
    tier: 'tier3',
    icon: '🥩',
    priceFrom: 129,
    diagnosticFee: 89,
    description: 'Same-day BBQ grill repair — igniter not working, burner issues, gas leaks. Built-in & freestanding.',
    commonIssues: [
      'BBQ igniter not working',
      'Burner not lighting',
      'Uneven heat distribution',
      'Gas leak suspected',
    ],
  },
  {
    slug: 'wine-cellar-repair',
    name: 'Wine Cellar Repair',
    nameFull: 'Wine Cellar Repair',
    commercial: false,
    tier: 'tier3',
    icon: '🍾',
    priceFrom: 199,
    diagnosticFee: 89,
    description: 'Same-day wine cellar cooling unit repair — temperature control, humidity issues.',
    commonIssues: [
      'Wine cellar not cooling',
      'Humidity control not working',
      'Cooling unit making noise',
      'Temperature fluctuating',
    ],
  },
  {
    slug: 'induction-cooktop-repair',
    name: 'Induction Cooktop Repair',
    nameFull: 'Induction Cooktop Repair',
    commercial: false,
    tier: 'tier3',
    icon: '⚡',
    priceFrom: 149,
    diagnosticFee: 89,
    description: 'Same-day induction cooktop repair — not heating, error codes, burner zones not working.',
    commonIssues: [
      'Induction cooktop not detecting cookware',
      'Induction zone not heating',
      'Error code on display',
      'Control panel not responding',
    ],
  },

  // =========================================================================
  // COMMERCIAL SERVICES — /commercial/[slug]/
  // =========================================================================

  // --- Tier 1 (highest commercial demand) ---
  {
    slug: 'refrigerator-repair',
    name: 'Commercial Refrigerator Repair',
    nameFull: 'Commercial Refrigerator Repair',
    commercial: true,
    tier: 'tier1',
    icon: '🧊',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day commercial refrigerator repair for restaurants, hotels, and businesses. All brands.',
    commonIssues: [
      'Commercial fridge not cooling',
      'Temperature not holding',
      'Compressor failure',
      'Door gasket broken',
      'Evaporator fan not working',
    ],
  },
  {
    slug: 'walk-in-cooler-repair',
    name: 'Walk-In Cooler Repair',
    nameFull: 'Walk-In Cooler Repair',
    commercial: true,
    tier: 'tier1',
    icon: '🏪',
    priceFrom: 299,
    diagnosticFee: 120,
    description: 'Emergency walk-in cooler repair — same day. Restaurants, grocery, hospitality. All brands.',
    commonIssues: [
      'Walk-in cooler not cooling',
      'Temperature too warm',
      'Compressor not working',
      'Evaporator coil iced over',
      'Door not sealing',
      'Walk-in cooler leaking',
    ],
  },
  {
    slug: 'walk-in-freezer-repair',
    name: 'Walk-In Freezer Repair',
    nameFull: 'Walk-In Freezer Repair',
    commercial: true,
    tier: 'tier1',
    icon: '🧊',
    priceFrom: 299,
    diagnosticFee: 120,
    description: 'Emergency walk-in freezer repair — same day. Prevent food loss. All commercial brands.',
    commonIssues: [
      'Walk-in freezer not freezing',
      'Temperature fluctuating',
      'Frost buildup on coils',
      'Compressor failure',
      'Door heater not working',
    ],
  },
  {
    slug: 'ice-machine-repair',
    name: 'Ice Machine Repair',
    nameFull: 'Commercial Ice Machine Repair',
    commercial: true,
    tier: 'tier1',
    icon: '🧊',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day commercial ice machine repair — not making ice, leaking, dirty ice. Hoshizaki, Manitowoc, Scotsman.',
    commonIssues: [
      'Ice machine not making ice',
      'Ice machine making too little ice',
      'Ice machine leaking water',
      'Ice machine making cloudy ice',
      'Ice machine not harvesting',
    ],
  },

  // --- Tier 2 ---
  {
    slug: 'freezer-repair',
    name: 'Commercial Freezer Repair',
    nameFull: 'Commercial Freezer Repair',
    commercial: true,
    tier: 'tier2',
    icon: '❄️',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day commercial freezer repair for restaurants and food service businesses.',
    commonIssues: [
      'Commercial freezer not freezing',
      'Temperature too warm',
      'Frost buildup',
      'Compressor not working',
    ],
  },
  {
    slug: 'oven-repair',
    name: 'Commercial Oven Repair',
    nameFull: 'Commercial Oven Repair',
    commercial: true,
    tier: 'tier2',
    icon: '🔥',
    priceFrom: 229,
    diagnosticFee: 120,
    description: 'Same-day commercial oven repair — convection, deck, combi ovens. All restaurant brands.',
    commonIssues: [
      'Commercial oven not heating',
      'Temperature inaccurate',
      'Igniter not working',
      'Convection fan not working',
      'Control board failure',
    ],
  },
  {
    slug: 'dishwasher-repair',
    name: 'Commercial Dishwasher Repair',
    nameFull: 'Commercial Dishwasher Repair',
    commercial: true,
    tier: 'tier2',
    icon: '🍽️',
    priceFrom: 229,
    diagnosticFee: 120,
    description: 'Same-day commercial dishwasher repair — not cleaning, not draining, low water pressure.',
    commonIssues: [
      'Commercial dishwasher not cleaning',
      'Not reaching sanitize temperature',
      'Not draining',
      'Low water pressure',
      'Door latch broken',
    ],
  },
  {
    slug: 'laundry-repair',
    name: 'Commercial Laundry Repair',
    nameFull: 'Commercial Laundry Repair',
    commercial: true,
    tier: 'tier2',
    icon: '🫧',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day commercial washer and dryer repair for laundromats, hotels, and multi-family.',
    commonIssues: [
      'Commercial washer not spinning',
      'Commercial dryer not heating',
      'Coin mechanism not working',
      'Control board failure',
    ],
  },

  // --- Tier 3 ---
  {
    slug: 'washer-repair',
    name: 'Commercial Washer Repair',
    nameFull: 'Commercial Washer Repair',
    commercial: true,
    tier: 'tier3',
    icon: '🫧',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day commercial washing machine repair. Front load, top load, stack units.',
    commonIssues: [
      'Commercial washer not spinning',
      'Not draining',
      'Leaking',
      'Not starting',
    ],
  },
  {
    slug: 'dryer-repair',
    name: 'Commercial Dryer Repair',
    nameFull: 'Commercial Dryer Repair',
    commercial: true,
    tier: 'tier3',
    icon: '♨️',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day commercial dryer repair. Stack units, gas & electric. Hotels, laundromats.',
    commonIssues: [
      'Commercial dryer not heating',
      'Not spinning',
      'Taking too long',
      'Making noise',
    ],
  },
  {
    slug: 'stove-repair',
    name: 'Commercial Stove Repair',
    nameFull: 'Commercial Stove Repair',
    commercial: true,
    tier: 'tier3',
    icon: '🍳',
    priceFrom: 229,
    diagnosticFee: 120,
    description: 'Same-day commercial stove and range repair for restaurants. Gas burners, pilots, valves.',
    commonIssues: [
      'Burner not lighting',
      'Pilot light out',
      'Gas valve failure',
      'Burner flame too low',
    ],
  },
  {
    slug: 'slushie-machine-repair',
    name: 'Slushie Machine Repair',
    nameFull: 'Slushie Machine Repair',
    commercial: true,
    tier: 'tier3',
    icon: '🧃',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day slushie machine repair — not freezing, leaking, auger issues. Bunn, Cornelius, Vitamix.',
    commonIssues: [
      'Slushie machine not freezing',
      'Auger not turning',
      'Machine leaking',
      'Product too watery',
    ],
  },
  {
    slug: 'showcase-refrigerator-repair',
    name: 'Showcase Refrigerator Repair',
    nameFull: 'Showcase Refrigerator Repair',
    commercial: true,
    tier: 'tier3',
    icon: '🏪',
    priceFrom: 249,
    diagnosticFee: 120,
    description: 'Same-day showcase and display refrigerator repair — glass door units, reach-in coolers.',
    commonIssues: [
      'Showcase fridge not cooling',
      'Glass door fogging up',
      'Lighting not working',
      'Door heater failure',
    ],
  },
  {
    slug: 'bar-refrigerator-repair',
    name: 'Bar Refrigerator Repair',
    nameFull: 'Bar Refrigerator Repair',
    commercial: true,
    tier: 'tier3',
    icon: '🍺',
    priceFrom: 199,
    diagnosticFee: 120,
    description: 'Same-day bar refrigerator and kegerator repair — not cooling, draft system issues.',
    commonIssues: [
      'Bar fridge not cooling',
      'Kegerator not maintaining temperature',
      'CO2 system issues',
      'Door gasket broken',
    ],
  },
  {
    slug: 'fryer-repair',
    name: 'Commercial Fryer Repair',
    nameFull: 'Commercial Fryer Repair',
    commercial: true,
    tier: 'tier3',
    icon: '🍟',
    priceFrom: 229,
    diagnosticFee: 120,
    description: 'Same-day commercial fryer repair — not heating, thermostat issues, gas or electric.',
    commonIssues: [
      'Fryer not heating to temperature',
      'Thermostat not working',
      'Gas valve failure',
      'Heating element burned out',
    ],
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Get all residential services */
export function getResidentialServices(): Service[] {
  return services.filter((s) => !s.commercial);
}

/** Get all commercial services */
export function getCommercialServices(): Service[] {
  return services.filter((s) => s.commercial);
}

/** Get a service by slug and type */
export function getServiceBySlug(slug: string, commercial: boolean): Service | undefined {
  return services.find((s) => s.slug === slug && s.commercial === commercial);
}

/** Get Tier 1 services (residential only — for city×service pages) */
export function getTier1ResidentialServices(): Service[] {
  return services.filter((s) => !s.commercial && s.tier === 'tier1');
}

/** Get all static paths for /services/[service].astro */
export function getResidentialServicePaths() {
  return getResidentialServices().map((s) => ({ params: { service: s.slug } }));
}

/** Get all static paths for /commercial/[service].astro */
export function getCommercialServicePaths() {
  return getCommercialServices().map((s) => ({ params: { service: s.slug } }));
}
