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
import { getQuoteContext, type PageType } from './quote-context';

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
  /** The brand chip they picked in the diagnostic's step 3, if any. */
  brand?: string | null;
}

export interface QuoteSeed {
  where: QuoteScope | null;
  appliance: string | null;
  problems: string[];
  /** Free text for the sheet's problem box: the visitor's detail, plus the symptom
   *  when no tile carries those words. Never invented, only carried across. */
  detail: string;
  /** AID-3. The brand as the sheet spells it: a /brands/ pillar slug where the
   *  diagnostic's label has one, and the label itself for the chip. The sheet
   *  never ASKS for a brand — it is a note for dispatch — so this only ever
   *  fills a blank; the sheet's own page context still fills it when the
   *  diagnosis carried none. */
  brandSlug: string | null;
  brandLabel: string | null;
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
  const brandLabel = String(answers.brand || '').trim();

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

  // "Other" is a real chip in the diagnostic and names no brand at all, so it is
  // dropped rather than printed to dispatch as if it were one.
  const brand = brandLabel && brandLabel !== 'Other' ? brandLabel : '';

  return {
    where,
    appliance,
    problems,
    detail: carried,
    brandSlug: brand ? brandSlugFor(brand) : null,
    brandLabel: brand || null,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// AID-3. The other direction: what the PAGE already knows, handed to the
// diagnostic so the visitor is not asked for it again.
//
// AID-2 translated a finished diagnosis into a quote seed. This half translates
// a URL into the diagnostic's own first two answers, using quote-context.ts as
// the reader — one page-classification table for the whole site, not two.
//
//   THE SAME DOCTRINE, THIRD TIME: A PAIR WE CANNOT NAME RESOLVES TO NOTHING.
//
// It matters more here than anywhere, because a prefill is an answer put into the
// visitor's mouth. The rule this file follows is the one the task set: the prefill
// may only set state the visitor could have set themselves, and it must be the
// state they WOULD have set. So the category — which the URL always knows, because
// /commercial/ice-machines/ is an ice machine whatever kind of one — is filled
// whenever the quote tile implies exactly one diagnostic category. The appliance is
// filled only where ONE diagnostic label is the answer.
//
// Where the reverse is many-to-one it stays blank and the visitor picks. Listed
// with reasons, because "no appliance" on a page that obviously has one reads like
// an oversight until you see why:
//   · commercial_oven_range — the diagnostic has "Commercial Oven" AND "Commercial
//                             Range"; /commercial/oven-repair/ and /range-repair/
//                             both land on this one tile, so the tile cannot say
//                             which of the two labels the page meant.
//   · walk_in                — "Walk-in Cooler" and "Walk-in Freezer" are two.
//   · reach_in               — "Reach-in Refrigerator" / "Reach-in Freezer".
//   · ice_machine            — Cuber, Flaker and Nugget are three machines.
//   The CATEGORY is still filled in all four cases: cold storage is cold storage.
//
// And the ones with no diagnostic entry at all, so not even a category — see
// UNMAPPED_QUOTE_IDS below, which the gate holds to the same completeness rule as
// UNMAPPED_APPLIANCES: every tile is either translated or named as untranslatable.


/** The page types AID-3 puts a card on. Everything else — the city pillar, the
 *  homepage (which has its own), blog, legal, /book/, /contact/, /price-list/,
 *  /credentials/ — gets nothing. Named here so the card, the sheet mount and the
 *  gate all read one list rather than three copies of it. */
export const AID_CARD_PAGE_TYPES: ReadonlySet<PageType> = new Set<PageType>([
  'service_hub',
  'service_sub',
  'city_service',
  'commercial_hub',
  'commercial_sub',
  'commercial_brand',
  'brand',
  'outdoor',
]);

export type DiagnosticCategory = 'home' | 'restaurant' | 'cold' | 'ice' | 'outdoor';

export interface ReverseEntry {
  /** The diagnostic's step-1 answer. Certain whenever the tile is known. */
  category: DiagnosticCategory;
  /** The diagnostic's step-2 answer, verbatim from APPLIANCES_BY_CATEGORY, or
   *  null where one tile answers to several labels. */
  appliance: string | null;
  /** The noun for the card's heading. A plain noun phrase, never a slashed pair:
   *  the tile labels are written for a grid of choices ("Oven / wall oven"), and a
   *  grid label dropped into a sentence reads as a typo. Null wherever `appliance`
   *  is null, so the heading falls back to the neutral question. */
  noun: string | null;
}

/**
 * Quote appliance id -> what the diagnostic would call it.
 *
 * Every `appliance` here is a label that exists in the island's own
 * APPLIANCES_BY_CATEGORY under the stated `category` — the gate checks both against
 * the island source, so this table cannot drift away from the steps it pre-answers.
 */
export const QUOTE_ID_TO_DIAGNOSTIC: Readonly<Record<string, ReverseEntry>> = {
  // ── home ────────────────────────────────────────────────────────────────────
  refrigerator: { category: 'home', appliance: 'Refrigerator', noun: 'Refrigerator' },
  freezer: { category: 'home', appliance: 'Freezer', noun: 'Freezer' },
  washer: { category: 'home', appliance: 'Washer', noun: 'Washer' },
  dryer: { category: 'home', appliance: 'Dryer', noun: 'Dryer' },
  dishwasher: { category: 'home', appliance: 'Dishwasher', noun: 'Dishwasher' },
  cooktop: { category: 'home', appliance: 'Cooktop', noun: 'Cooktop' },
  microwave: { category: 'home', appliance: 'Microwave', noun: 'Microwave' },
  range_hood: { category: 'home', appliance: 'Range Hood', noun: 'Range hood' },
  wine_cooler: { category: 'home', appliance: 'Wine Cooler / Cellar', noun: 'Wine cooler' },
  // Both of the sheet's kitchen-cooking tiles answer to the diagnostic's single
  // "Oven / Range" entry. The collapse is in the diagnostic's own vocabulary, not a
  // guess of ours, and the heading noun keeps the page's own word for it.
  oven: { category: 'home', appliance: 'Oven / Range', noun: 'Oven' },
  range_stove: { category: 'home', appliance: 'Oven / Range', noun: 'Range' },

  // ── restaurant ──────────────────────────────────────────────────────────────
  commercial_dishwasher: {
    category: 'restaurant',
    appliance: 'Commercial Dishwasher',
    noun: 'Dishwasher',
  },
  fryer: { category: 'restaurant', appliance: 'Commercial Fryer', noun: 'Fryer' },
  steamer: { category: 'restaurant', appliance: 'Commercial Steamer', noun: 'Steamer' },
  mixer: { category: 'restaurant', appliance: 'Commercial Mixer', noun: 'Mixer' },
  commercial_oven_range: { category: 'restaurant', appliance: null, noun: null },

  // ── cold storage ────────────────────────────────────────────────────────────
  display_case: { category: 'cold', appliance: 'Display Case', noun: 'Display case' },
  prep_table: { category: 'cold', appliance: 'Prep Table', noun: 'Prep table' },
  walk_in: { category: 'cold', appliance: null, noun: null },
  reach_in: { category: 'cold', appliance: null, noun: null },

  // ── ice ─────────────────────────────────────────────────────────────────────
  ice_machine: { category: 'ice', appliance: null, noun: null },
};

/**
 * Quote appliance ids with no diagnostic counterpart at all — not even a category,
 * so these pages open the diagnostic exactly as the homepage does. Listed by name
 * so the coverage report prints them instead of anyone diffing two tables. Same
 * purpose as UNMAPPED_APPLIANCES above, other direction.
 *
 * `ice_maker` is the one worth reading twice: the diagnostic's only ice maker is
 * "Outdoor Ice Maker", under Outdoor Living. A kitchen ice maker is not outdoor
 * equipment, and putting a /services/ice-maker-repair/ visitor into the
 * grills-and-fire-pits category would be a wrong answer, not a partial one.
 */
export const UNMAPPED_QUOTE_IDS: readonly string[] = [
  'washer_dryer_combo',
  'ice_maker',
  'garbage_disposal',
  'trash_compactor',
  'other_residential',
  'commercial_laundry',
  'griddle',
  'grill_charbroiler',
  'holding_cabinet',
  'proofer',
  'kettle',
  'food_processor',
  'slicer',
  'commercial_range_hood',
  'bar_fridge',
  'other_commercial',
];

/**
 * /brands/{slug}/ pillar slug -> the diagnostic's own spelling of that brand.
 *
 * Only slugs whose brand appears VERBATIM in the island's BRANDS_BY_APPLIANCE
 * lists; the gate checks every value against that source. A brand the diagnostic
 * has never heard of is dropped rather than typed into a chip row that has no such
 * chip — and the island drops it a second time at runtime if the appliance it ends
 * up on does not list it, which is the "else nothing" the task asked for.
 *
 * Deliberately absent, and why:
 *   · true — /brands/true.astro is the commercial True Refrigeration and
 *     /brands/true-residential-…/ is the residential line; both resolve to the
 *     pillar `true`. The diagnostic spells them differently ("True Refrigeration"
 *     vs "True Residential"), so the slug cannot choose between them.
 *   · eurocave, ge-cafe, ilve, kenmore, marvel, vinotemp — real pillars whose
 *     brands the diagnostic's chip rows do not carry. Nothing to select.
 */
export const BRAND_SLUG_TO_DIAGNOSTIC: Readonly<Record<string, string>> = {
  asko: 'Asko',
  bertazzoni: 'Bertazzoni',
  'beverage-air': 'Beverage-Air',
  bluestar: 'BlueStar',
  bosch: 'Bosch',
  broan: 'Broan',
  cellarpro: 'CellarPro',
  cove: 'Cove',
  dacor: 'Dacor',
  electrolux: 'Electrolux',
  'fisher-paykel': 'Fisher & Paykel',
  frigidaire: 'Frigidaire',
  gaggenau: 'Gaggenau',
  ge: 'GE',
  'ge-monogram': 'GE Monogram',
  hestan: 'Hestan',
  hoshizaki: 'Hoshizaki',
  jennair: 'JennAir',
  kitchenaid: 'KitchenAid',
  lg: 'LG',
  liebherr: 'Liebherr',
  manitowoc: 'Manitowoc',
  maytag: 'Maytag',
  miele: 'Miele',
  panasonic: 'Panasonic',
  samsung: 'Samsung',
  'speed-queen': 'Speed Queen',
  'sub-zero': 'Sub-Zero',
  thermador: 'Thermador',
  traulsen: 'Traulsen',
  'u-line': 'U-Line',
  viking: 'Viking',
  vulcan: 'Vulcan',
  whirlpool: 'Whirlpool',
  whisperkool: 'WhisperKool',
  wolf: 'Wolf',
  zephyr: 'Zephyr',
};

export interface DiagnosticPrefill {
  /** Whether this page type carries a card at all. */
  carded: boolean;
  pageType: PageType;
  category: DiagnosticCategory | null;
  /** Diagnostic appliance label, or null. */
  appliance: string | null;
  /** Diagnostic brand label, or null. */
  brand: string | null;
  /** The quote tile behind `appliance` — for the coverage report, nothing else. */
  quoteApplianceId: string | null;
  /** True when anything at all was pre-answered. */
  prefilled: boolean;
}

/**
 * Everything the card on `pathname` can hand the island, from the URL alone.
 *
 * Pure, like getQuoteContext: same address, same answer, at build time and inside a
 * gate script. It never reads a prop, so a page cannot describe itself wrongly.
 */
export function getDiagnosticPrefill(pathname: string): DiagnosticPrefill {
  const ctx = getQuoteContext(pathname);
  const carded = AID_CARD_PAGE_TYPES.has(ctx.pageType);

  const entry = ctx.appliance ? QUOTE_ID_TO_DIAGNOSTIC[ctx.appliance] : undefined;

  // /outdoor/ is the one category the tiles cannot express — the sheet has no grill,
  // patio heater or fire pit, so quote-context leaves its appliance null on purpose.
  // The diagnostic DOES have an Outdoor Living category and the address says so
  // outright, so here the category comes from the page tree rather than from a tile.
  const category: DiagnosticCategory | null =
    ctx.pageType === 'outdoor' ? 'outdoor' : entry ? entry.category : null;

  const appliance = ctx.pageType === 'outdoor' ? null : entry?.appliance ?? null;
  const brand = ctx.brand ? BRAND_SLUG_TO_DIAGNOSTIC[ctx.brand] ?? null : null;

  return {
    carded,
    pageType: ctx.pageType,
    category,
    appliance,
    brand,
    quoteApplianceId: ctx.appliance,
    prefilled: Boolean(category || appliance || brand),
  };
}

/**
 * The card's heading, from the same prefill. Three shapes and no fourth:
 *   brand + appliance -> "LG washer acting up?"
 *   appliance         -> "Washer acting up?"
 *   neither           -> "Not sure what's wrong?"
 *
 * The brand form lowercases the noun because it sits mid-sentence there; the bare
 * form keeps it capitalised because it starts the sentence. Nothing is invented —
 * every word comes from one of the two tables above.
 */
export function diagnosticHeading(pathname: string): string {
  const ctx = getQuoteContext(pathname);
  const entry = ctx.appliance ? QUOTE_ID_TO_DIAGNOSTIC[ctx.appliance] : undefined;
  const noun = ctx.pageType === 'outdoor' ? null : entry?.noun ?? null;
  if (!noun) return "Not sure what's wrong?";
  const brand = ctx.brand ? BRAND_SLUG_TO_DIAGNOSTIC[ctx.brand] ?? null : null;
  return brand ? `${brand} ${noun.toLowerCase()} acting up?` : `${noun} acting up?`;
}

/**
 * The diagnostic's brand label -> a /brands/ pillar slug, when one names it.
 *
 * The inverse of BRAND_SLUG_TO_DIAGNOSTIC, built from that table rather than typed
 * out a second time — a hand-kept inverse is a hand-kept drift. Labels with no
 * pillar ("Scotsman", "Pitco", "Wolf Commercial") return null and travel as a label
 * only, which is all the sheet's brand chip actually renders.
 */
const DIAGNOSTIC_TO_BRAND_SLUG: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(BRAND_SLUG_TO_DIAGNOSTIC).map(([slug, label]) => [label, slug])
);

export function brandSlugFor(label: string): string | null {
  return DIAGNOSTIC_TO_BRAND_SLUG[label] ?? null;
}

/** The placeholder on a page that could tell us nothing. AID-2's line, unchanged. */
export const NEUTRAL_PLACEHOLDER = "My dryer runs but doesn't heat…";

/**
 * The card's input placeholder, following the page the same way the heading does.
 *
 *   brand + appliance -> "My LG washer: not spinning…"
 *   appliance         -> "My mixer: won't start…"
 *   neither           -> "My dryer runs but doesn't heat…"
 *
 * Both halves are real strings, not written for this feature: the symptom is
 * `problems[0]` of that tile in quote-appliances.ts — the first thing the quote
 * sheet itself offers for this appliance — and the appliance word is the tile's
 * own, lowercased mid-sentence. Nothing is composed, so a placeholder can never
 * suggest a fault we do not actually list for that machine.
 *
 * ONE deliberate substitution, and it is the same one the heading makes: where the
 * tile label is a slashed pair written for a grid of choices — `Oven / wall oven`,
 * `Range / stove`, `Steamer / combi` — the placeholder uses the entry's `noun`
 * instead (`Oven`, `Range`, `Steamer`). "My oven / wall oven: not heating…" reads
 * as a typo inside an input, and the noun is the same object under a name that fits
 * a sentence, not a different claim. The gate holds it to that: no placeholder may
 * contain a slash, and the symptom half must appear verbatim in the tile.
 */
export function diagnosticPlaceholder(pathname: string): string {
  const ctx = getQuoteContext(pathname);
  const entry = ctx.appliance ? QUOTE_ID_TO_DIAGNOSTIC[ctx.appliance] : undefined;
  const noun = ctx.pageType === 'outdoor' ? null : entry?.noun ?? null;
  if (!noun || !ctx.appliance) return NEUTRAL_PLACEHOLDER;

  const symptom = problemsFor(ctx.appliance)[0];
  if (!symptom) return NEUTRAL_PLACEHOLDER;

  const brand = ctx.brand ? BRAND_SLUG_TO_DIAGNOSTIC[ctx.brand] ?? null : null;
  const thing = brand ? `${brand} ${noun.toLowerCase()}` : noun.toLowerCase();
  return `My ${thing}: ${symptom.toLowerCase()}…`;
}
