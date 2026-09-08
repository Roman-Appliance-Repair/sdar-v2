// src/data/aid-to-quote-map.ts
//
// AID-2. The bridge between the AI diagnostic's vocabulary and the quote sheet's.
//
// The two features were written years and one rewrite apart and name the same
// objects differently: the diagnostic says "Wall Oven", the sheet says
// "Oven / wall oven"; the diagnostic says "Makes loud noise", the sheet's dryer tile
// says "Noisy / squealing". When someone finishes a diagnosis and taps Book Online,
// re-asking them everything they just answered is the fastest way to lose them — so
// this file translates, once, in one place.
//
//   THE SAME DOCTRINE AS quote-context.ts: A LABEL WE HAVE NOT MAPPED RESOLVES TO
//   NOTHING. It is never guessed at and never "close enough".
//
// "Nothing" is not a failure. An unmapped appliance means the sheet opens on the
// appliance step with the tiles in front of them — exactly as it does for anyone
// arriving from a page we know nothing about. An unmapped symptom is not thrown
// away either: it goes into the free-text detail, so dispatch still reads the
// visitor's own words even when no tile matches them.
//
// Deliberately unmapped, and why (each one is a real ambiguity, not an oversight):
//   · "Oven / Range"            — the sheet has TWO tiles, `oven` and `range_stove`.
//                                 One diagnostic label cannot choose between them.
//   · "Commercial Refrigerator" — reach-in, bar fridge, prep table and display case
//   · "Commercial Freezer"        are four separate tiles; the label names none of them.
//   · "Undercounter Refrigerator" — could be a bar fridge or an undercounter reach-in.
//   · "Ice Dispenser" / "Ice Storage Bin" — the sheet's `ice_machine` tile is the
//                                 machine, not its bin; the symptom lists differ.
//   · "Gas Grill" / "Pellet Grill" / "Patio Heater" / "Gas Fireplace" / "Pizza Oven"
//                               — outdoor equipment the residential tile set has no
//                                 tile for at all. `grill_charbroiler` is the
//                                 COMMERCIAL charbroiler and would put a homeowner
//                                 on the $120 tier.
//
// Everything here is data. The resolver at the bottom is the only logic, and it
// reads the sheet's own tile tables rather than repeating them.

import { APPLIANCES_BY_SCOPE } from './quote-appliances';

export type QuoteScope = 'residential' | 'commercial';

/**
 * Diagnostic category -> which price tier the sheet should open on.
 * Outdoor is residential: `/outdoor/` is $89 universally (factual-accuracy §9).
 */
export const CATEGORY_TO_SCOPE: Readonly<Record<string, QuoteScope>> = {
  home: 'residential',
  restaurant: 'commercial',
  cold: 'commercial',
  ice: 'commercial',
  outdoor: 'residential',
};

/**
 * Diagnostic appliance label -> quote appliance id. Only pairs that name the same
 * object. Two labels may share one id (a walk-in cooler and a walk-in freezer are
 * both the sheet's `walk_in` tile) — that is not a guess, it is one tile.
 */
export const APPLIANCE_TO_QUOTE_ID: Readonly<Record<string, string>> = {
  // ── home ────────────────────────────────────────────────────────────────────
  Refrigerator: 'refrigerator',
  Freezer: 'freezer',
  Dishwasher: 'dishwasher',
  Washer: 'washer',
  Dryer: 'dryer',
  Cooktop: 'cooktop',
  Microwave: 'microwave',
  'Wine Cooler / Cellar': 'wine_cooler',
  'Range Hood': 'range_hood',
  'Wall Oven': 'oven',
  // ── restaurant ──────────────────────────────────────────────────────────────
  'Commercial Oven': 'commercial_oven_range',
  'Commercial Range': 'commercial_oven_range',
  'Commercial Fryer': 'fryer',
  'Commercial Dishwasher': 'commercial_dishwasher',
  'Commercial Steamer': 'steamer',
  'Commercial Mixer': 'mixer',
  // ── cold storage ────────────────────────────────────────────────────────────
  'Walk-in Cooler': 'walk_in',
  'Walk-in Freezer': 'walk_in',
  'Reach-in Refrigerator': 'reach_in',
  'Reach-in Freezer': 'reach_in',
  'Display Case': 'display_case',
  'Prep Table': 'prep_table',
  // ── ice ─────────────────────────────────────────────────────────────────────
  'Ice Machine (Cuber)': 'ice_machine',
  'Ice Machine (Flaker)': 'ice_machine',
  'Ice Machine (Nugget)': 'ice_machine',
  // ── outdoor ─────────────────────────────────────────────────────────────────
  // A refrigerator outdoors is still the Refrigerator tile, and an outdoor ice maker
  // is still the residential Ice maker tile — same object, same symptom list.
  'Outdoor Refrigerator': 'refrigerator',
  'Outdoor Ice Maker': 'ice_maker',
};

/**
 * The diagnostic labels this file deliberately does not translate. Listed by name so
 * the coverage report can print them and nobody has to diff two tables to find them.
 * See the header for the reason against each group.
 */
export const UNMAPPED_APPLIANCES: readonly string[] = [
  'Oven / Range',
  'Commercial Refrigerator',
  'Commercial Freezer',
  'Undercounter Refrigerator',
  'Ice Dispenser',
  'Ice Storage Bin',
  'Gas Grill',
  'Pellet Grill',
  'Patio Heater',
  'Gas Fireplace',
  'Pizza Oven',
];

/**
 * Symptom translation, keyed by quote appliance id then by the diagnostic's own
 * wording. Only entries where both phrases name the same fault; the value is always
 * a string that exists verbatim in that tile's `problems` list, which the gate checks.
 *
 * A diagnostic symptom absent from here and absent from the tile's own list is NOT
 * dropped — the resolver puts it in `detail`. That is why generic phrases
 * ("Not working", "Other", "Making unusual noise" against a tile whose only noise
 * entry is specific) are left out on purpose: turning them into a tile would be
 * inventing an answer the visitor never gave.
 */
export const SYMPTOM_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  refrigerator: {
    'Leaking water': 'Water on the floor',
    Leaking: 'Water on the floor',
    'Makes loud noise': 'Noisy',
    'Loud noise': 'Noisy',
    'Freezing food': 'Too cold / freezing food',
    'Door not sealing': "Door seal / won't close",
    'Door seal damaged': "Door seal / won't close",
  },
  freezer: {
    'Frost buildup': 'Ice buildup on the walls',
    'Leaking water': 'Water on the floor',
    'Makes loud noise': 'Noisy',
  },
  dishwasher: {
    'Not cleaning dishes': 'Not cleaning',
    "Door won't latch": "Door latch / won't close",
  },
  washer: {
    'Loud banging': 'Noisy',
    "Won't fill with water": 'Not filling',
  },
  dryer: {
    'Makes loud noise': 'Noisy / squealing',
    "Drum won't spin": 'Not tumbling',
  },
  cooktop: {
    "Burner won't ignite": "Burner won't light",
    'Burner stays on': "Won't turn off",
  },
  microwave: {
    'Turntable not spinning': 'Turntable not turning',
    'Loud noise': 'Very noisy',
  },
  wine_cooler: {
    'Loud noise': 'Noisy',
    'Compressor running constantly': 'Running constantly',
  },
  range_hood: {
    'Loud noise': 'Very noisy',
    'Lights not working': 'Lights out',
    'Motor not running': 'Fan not running',
  },
  oven: {
    'Self-clean not working': 'Self-clean stuck / locked',
  },
  walk_in: {
    'Not maintaining temperature': 'Not holding temperature',
    'Ice buildup': 'Icing up on the coil',
    'Door seal damaged': "Door won't seal",
  },
  ice_machine: {
    'Not making ice': 'No ice',
    'Small or hollow ice': 'Cubes small or hollow',
    'Leaking water': 'Leaking',
    'Error code': 'Error or service light',
    'Making noise': 'Noisy',
    'Ice tastes bad': 'Ice tastes or smells off',
  },
  ice_maker: {
    Leaking: 'Leaking water',
    'Error code on display': 'Error code',
    'Making unusual noise': 'Noisy',
  },
  fryer: {
    Leaking: 'Oil leaking',
    'Error code on display': 'Error code',
  },
  mixer: {
    Leaking: 'Leaking oil',
    'Error code on display': 'Error code',
  },
  display_case: {
    Leaking: 'Water pooling / leaking',
    'Error code on display': 'Alarm or error code',
  },
  commercial_oven_range: {
    'Error code on display': 'Error code',
  },
  commercial_dishwasher: {
    'Error code on display': 'Error code',
  },
  steamer: {
    'Error code on display': 'Error code',
  },
  reach_in: {
    'Error code on display': 'Alarm or error code',
  },
  prep_table: {
    'Error code on display': 'Alarm or error code',
  },
};

/** Every tile the sheet knows, flattened to id -> problems, for the resolver. */
function problemsFor(applianceId: string): readonly string[] {
  for (const list of Object.values(APPLIANCES_BY_SCOPE)) {
    const hit = list.find((a) => a.id === applianceId);
    if (hit) return hit.problems;
  }
  return [];
}

export interface DiagnosticAnswers {
  category?: string | null;
  appliance?: string | null;
  symptom?: string | null;
  /** Whatever they typed into the diagnostic's own free-text field, if anything. */
  detail?: string | null;
}

export interface QuoteSeed {
  where: QuoteScope | null;
  appliance: string | null;
  problems: string[];
  /** Free text for the sheet's problem box: the visitor's detail, plus the symptom
   *  when no tile carries those words. Never invented, only carried across. */
  detail: string;
}

/**
 * Translate a finished diagnosis into what the quote sheet can safely pre-fill.
 *
 * Order matters: the scope comes from the category (a restaurant is a restaurant
 * whatever broke), the appliance only from an explicitly mapped label, and the
 * symptom only when the tile itself carries those words — either verbatim or through
 * the alias table above. Anything else lands in `detail` as prose.
 */
export function mapDiagnosticToQuote(answers: DiagnosticAnswers): QuoteSeed {
  const category = String(answers.category || '').trim();
  const applianceLabel = String(answers.appliance || '').trim();
  const symptom = String(answers.symptom || '').trim();
  const typed = String(answers.detail || '').trim();

  const where = CATEGORY_TO_SCOPE[category] || null;
  const appliance = APPLIANCE_TO_QUOTE_ID[applianceLabel] || null;

  let problems: string[] = [];
  let unmatchedSymptom = symptom;

  if (appliance && symptom) {
    const tile = problemsFor(appliance);
    const verbatim = tile.find((p) => p.toLowerCase() === symptom.toLowerCase());
    const aliased = (SYMPTOM_ALIASES[appliance] || {})[symptom];
    const resolved = verbatim || (aliased && tile.includes(aliased) ? aliased : '');
    if (resolved) {
      problems = [resolved];
      unmatchedSymptom = '';
    }
  }

  // The symptom survives even when no tile matches it — as words, where dispatch
  // reads them. The appliance label goes with it when the appliance itself is
  // unmapped, otherwise the note reads as a symptom with nothing attached.
  const carried = [
    unmatchedSymptom && !appliance && applianceLabel
      ? `${applianceLabel} — ${unmatchedSymptom}`
      : unmatchedSymptom,
    typed,
  ]
    .filter(Boolean)
    .join('. ');

  return { where, appliance, problems, detail: carried };
}
