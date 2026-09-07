// src/data/quote-appliances.ts
//
// The appliance and symptom tiles for the quote sheet. Two scopes, keyed by the
// answer to step 1 ("where"): residential = at home, commercial = in a business.
// Symptom tiles are what a dispatcher needs to route the truck and stock the van,
// not a diagnostic tree — the free-text box on the same step covers the rest.
//
// EVERY TILE MAPS TO SOMETHING WE ACTUALLY SERVICE. The residential list is the
// 14 services in SUB_CATALOGS['catalog-residential'] (src/data/service-catalog.ts)
// plus the trash compactor, which lives in src/data/homepage-services.ts and
// src/data/repair-estimates.ts rather than the JSON-LD catalog. The commercial
// list is drawn from catalog-commercial-kitchen, catalog-cold-storage and
// catalog-ice-machines, plus the refrigerated prep table that
// /commercial/refrigerator-repair/ sells by name. Nothing here is invented; see
// APPLIANCE_SOURCES below for the per-tile provenance the gate checks.
//
// QS-1.5 id note: `oven_range` and `walk_in_reach_in` are RETIRED, not renamed.
// Each split into two tiles, and silently repointing an id would make old leads
// mean something they did not mean when they were filed.

export type QuoteScope = 'residential' | 'commercial';

export interface ApplianceType {
  /** Stable id — goes into the payload, never change it once shipped. */
  id: string;
  label: string;
  /** 10–12 symptoms, specific to this type. "Something else" is always last. */
  problems: string[];
}

/** Always the last tile, on every list — appliances and symptoms both. */
const ELSE = 'Something else';

export const RESIDENTIAL_APPLIANCES: ApplianceType[] = [
  {
    id: 'refrigerator',
    label: 'Refrigerator',
    problems: [
      'Not cooling',
      'Freezer OK, fridge warm',
      'Too cold / freezing food',
      'Ice buildup',
      'Water on the floor',
      'Ice maker not working',
      'Noisy',
      "Door seal / won't close",
      'Light out',
      "Won't turn on",
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'freezer',
    label: 'Freezer',
    problems: [
      'Not freezing',
      'Too cold / over-freezing',
      'Ice buildup on the walls',
      'Frost on the food',
      'Water on the floor',
      'Running constantly',
      'Noisy',
      "Door seal / won't close",
      "Won't turn on",
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'washer',
    label: 'Washer',
    problems: [
      'Not spinning',
      'Not draining',
      'Leaking',
      "Won't start",
      'Noisy',
      'Shaking / walking',
      'Door locked shut',
      'Not filling',
      'Smells',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'dryer',
    label: 'Dryer',
    problems: [
      'Not heating',
      'Takes too long',
      'Not tumbling',
      "Won't start",
      'Noisy / squealing',
      'Shuts off mid-cycle',
      'Burning smell',
      'No airflow / vent blocked',
      "Door won't latch",
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'washer_dryer_combo',
    label: 'Washer-dryer combo',
    problems: [
      "Won't start",
      'Not draining',
      'Not spinning',
      'Not drying',
      'Cycle never finishes',
      'Leaking',
      'Noisy',
      'Door locked shut',
      'Smells',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'dishwasher',
    label: 'Dishwasher',
    problems: [
      'Not draining',
      'Not cleaning',
      'Leaking',
      "Won't start",
      'Not drying',
      "Won't fill",
      "Door latch / won't close",
      'Noisy',
      'Smells',
      'Soap dispenser stuck',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'oven',
    label: 'Oven / wall oven',
    problems: [
      'Not heating',
      "Won't reach temperature",
      'Temperature is off',
      'Broiler not working',
      "Won't turn on",
      "Door won't close",
      'Self-clean stuck / locked',
      'Light out',
      'Burning smell',
      'Noisy fan',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'range_stove',
    label: 'Range / stove',
    problems: [
      'Oven not heating',
      "Burner won't light",
      'Clicking constantly',
      'Gas smell',
      'Uneven flame',
      'Element not heating',
      'Controls not responding',
      'Oven temperature off',
      "Door won't close",
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'cooktop',
    label: 'Cooktop',
    problems: [
      "Burner won't light",
      'Clicking constantly',
      'Element not heating',
      'Uneven flame',
      'Cracked glass surface',
      "Induction won't detect pans",
      'Controls not responding',
      "Won't turn off",
      'Sparking',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'range_hood',
    label: 'Range hood',
    problems: [
      'Fan not running',
      'Weak suction',
      'Very noisy',
      'Lights out',
      'Controls not responding',
      'Rattling / vibration',
      "Won't turn off",
      'Grease buildup',
      'Smell blowing back in',
      ELSE,
    ],
  },
  {
    id: 'microwave',
    label: 'Microwave',
    problems: [
      'Not heating',
      "Won't start",
      'Sparking inside',
      'Turntable not turning',
      'Very noisy',
      "Door won't close",
      'Keypad not responding',
      'Runs with the door open',
      'Light out',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'wine_cooler',
    label: 'Wine cooler',
    problems: [
      'Not cooling',
      'Too cold / freezing bottles',
      'One zone not cooling',
      'Running constantly',
      'Noisy',
      'Condensation inside',
      "Door seal / won't close",
      'Light out',
      "Won't turn on",
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'ice_maker',
    label: 'Ice maker',
    problems: [
      'No ice at all',
      'Low production',
      'Small or hollow cubes',
      'Ice tastes or smells off',
      'Leaking water',
      'Ice jammed in the bin',
      'Not dispensing',
      'Freezing up',
      'Noisy',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'garbage_disposal',
    label: 'Garbage disposal',
    problems: [
      'Hums but nothing turns',
      "Won't turn on",
      'Jammed',
      'Leaking under the sink',
      'Very noisy / grinding',
      'Drains slowly',
      'Smells',
      'Keeps tripping the reset',
      'Splash guard damaged',
      ELSE,
    ],
  },
  {
    id: 'trash_compactor',
    label: 'Trash compactor',
    problems: [
      "Won't compact",
      "Won't turn on",
      "Drawer stuck / won't open",
      "Ram won't come back up",
      'Very noisy',
      'Leaking / smells',
      'Key or switch not working',
      'Bag tears every time',
      'Motor runs, nothing moves',
      ELSE,
    ],
  },
  {
    id: 'other_residential',
    label: ELSE,
    problems: [
      'Not cooling',
      'Not heating',
      'Leaking',
      "Won't turn on",
      "Won't start",
      'Noisy',
      'Smells',
      'Sparking or burning smell',
      'Stops mid-cycle',
      'Error code',
      ELSE,
    ],
  },
];

export const COMMERCIAL_APPLIANCES: ApplianceType[] = [
  {
    id: 'walk_in',
    label: 'Walk-in cooler / freezer',
    problems: [
      'Not holding temperature',
      'Too cold / freezing product',
      'Icing up on the coil',
      'Compressor short-cycling',
      "Compressor won't start",
      'Water on the floor',
      "Door won't seal",
      'Door stuck / latch broken',
      'Fan not running',
      'Defrost not working',
      'Alarm or error code',
      ELSE,
    ],
  },
  {
    id: 'reach_in',
    label: 'Reach-in fridge / freezer',
    problems: [
      'Not holding temperature',
      'Too cold / freezing product',
      'Icing up',
      'Running constantly',
      'Compressor noise',
      'Water pooling inside',
      "Door gasket won't seal",
      "Door won't close",
      'Fan not running',
      'Alarm or error code',
      ELSE,
    ],
  },
  {
    id: 'ice_machine',
    label: 'Ice machine',
    problems: [
      'No ice',
      'Low production',
      'Cubes small or hollow',
      'Ice tastes or smells off',
      'Leaking',
      'Not filling with water',
      'Freezing up / bridging',
      'Dispenser stuck',
      'Noisy',
      'Slime — needs cleaning',
      'Error or service light',
      ELSE,
    ],
  },
  {
    id: 'commercial_oven_range',
    label: 'Commercial oven / range',
    problems: [
      'Not heating',
      "Won't reach temperature",
      'Uneven bake',
      "Burner won't light",
      'Pilot keeps going out',
      'Gas smell',
      'Convection fan not running',
      "Door won't close",
      'Controls not responding',
      'Thermostat off',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'fryer',
    label: 'Fryer',
    problems: [
      'Not heating',
      "Won't reach temperature",
      'Overheating / high-limit trip',
      'Pilot keeps going out',
      'Oil leaking',
      'Thermostat off',
      "Won't drain / valve stuck",
      'Filtration not working',
      "Burner won't light",
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'griddle',
    label: 'Griddle / flat top',
    problems: [
      'Not heating',
      'One zone not heating',
      'Uneven temperature',
      'Overheating',
      "Burner won't light",
      'Pilot keeps going out',
      'Thermostat not responding',
      'Grease drain blocked',
      'Surface warped or pitted',
      ELSE,
    ],
  },
  {
    id: 'commercial_dishwasher',
    label: 'Commercial dishwasher',
    problems: [
      'Not heating',
      'Not draining',
      'Poor wash result',
      'Not filling',
      'Leaking',
      "Won't start",
      'Stuck mid-cycle',
      'Low rinse temperature',
      'Detergent not dosing',
      'Door or curtain problem',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'commercial_laundry',
    label: 'Commercial washer / dryer',
    problems: [
      "Won't start",
      'Not draining',
      'Not spinning',
      'Not heating',
      "Won't fill",
      'Leaking',
      'Shakes / walks',
      'Stops mid-cycle',
      'Coin or card reader down',
      'Error code',
      ELSE,
    ],
  },
  {
    id: 'prep_table',
    label: 'Prep table',
    problems: [
      'Not holding temperature',
      'Rail pans too warm',
      'Icing up',
      'Water pooling inside',
      'Running constantly',
      "Compressor won't start",
      "Lid or drawer won't seal",
      'Drawer stuck',
      'Fan not running',
      'Alarm or error code',
      ELSE,
    ],
  },
  {
    id: 'display_case',
    label: 'Display case',
    problems: [
      'Not holding temperature',
      'Product freezing',
      'Glass fogging up',
      'Icing up on the coil',
      'Water pooling / leaking',
      'Lights out',
      "Door or slider won't close",
      'Fan not running',
      'Compressor noise',
      'Alarm or error code',
      ELSE,
    ],
  },
  {
    id: 'other_commercial',
    label: ELSE,
    problems: [
      'Not cooling',
      'Not heating',
      'Leaking',
      "Won't turn on",
      "Won't start",
      'Noisy',
      'Compressor problem',
      'Stops mid-cycle',
      'Smells or smoke',
      'Error code',
      ELSE,
    ],
  },
];

/**
 * Provenance, one entry per tile id: which catalog service (or which other
 * on-site source) makes the tile a thing we actually repair. Kept next to the
 * tiles so a new tile without a source is obvious at review time, and read by
 * scripts/check-quote-sheet.mjs, which fails if any tile lacks an entry.
 */
export const APPLIANCE_SOURCES: Record<string, string[]> = {
  refrigerator: ['refrigerator-repair'],
  freezer: ['freezer-repair'],
  washer: ['washing-machine-repair'],
  dryer: ['dryer-repair'],
  washer_dryer_combo: ['washer-dryer-combo-repair'],
  dishwasher: ['dishwasher-repair'],
  oven: ['oven-repair', 'wall-oven-repair'],
  range_stove: ['stove-cooktop-repair'],
  cooktop: ['stove-cooktop-repair'],
  range_hood: ['range-hood-repair'],
  microwave: ['microwave-repair'],
  wine_cooler: ['wine-cooler-repair'],
  ice_maker: ['ice-maker-repair'],
  garbage_disposal: ['garbage-disposal-repair'],
  // Not in the JSON-LD catalog; sold on the homepage services grid and priced in
  // repair-estimates.ts at /services/trash-compactor-repair/.
  trash_compactor: ['homepage-services:trash-compactor'],
  other_residential: ['catalog-residential'],

  walk_in: ['walk-in-cooler-repair', 'walk-in-freezer-repair'],
  reach_in: ['commercial-refrigerator-repair', 'commercial-freezer-repair'],
  ice_machine: ['commercial-ice-machine-repair', 'ice-dispenser-repair', 'ice-bin-repair'],
  commercial_oven_range: ['commercial-oven-repair', 'commercial-stove-repair'],
  fryer: ['commercial-fryer-repair'],
  griddle: ['commercial-griddle-repair'],
  commercial_dishwasher: ['commercial-dishwasher-repair'],
  // services.ts commercial scope: laundry-repair / washer-repair / dryer-repair.
  commercial_laundry: ['services:laundry-repair'],
  // Sold by name on /commercial/refrigerator-repair/ ("Refrigerated Prep Tables").
  prep_table: ['commercial-refrigerator-repair'],
  display_case: ['showcase-refrigerator-repair'],
  other_commercial: ['catalog-commercial-kitchen'],
};

export const APPLIANCES_BY_SCOPE: Record<QuoteScope, ApplianceType[]> = {
  residential: RESIDENTIAL_APPLIANCES,
  commercial: COMMERCIAL_APPLIANCES,
};

/** Everything the client island needs, in one serialisable object. */
export function buildQuoteData() {
  return {
    residential: RESIDENTIAL_APPLIANCES.map((a) => ({ id: a.id, label: a.label, problems: a.problems })),
    commercial: COMMERCIAL_APPLIANCES.map((a) => ({ id: a.id, label: a.label, problems: a.problems })),
  };
}
