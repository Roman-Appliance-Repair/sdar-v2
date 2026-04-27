// src/data/repair-estimates.ts
//
// Per-issue repair-cost estimate matrix for the homepage Transparent Pricing
// calculator. Keyed 1:1 with `id` values from src/data/homepage-services.ts
// so the calculator dropdown can read units from one source and look up
// estimates from this one.
//
// Source of truth: detail pages at src/pages/services/*.astro and
// src/pages/commercial/*.astro. Issues come from the "What our technicians
// fix most often" h3 cluster on each page; per-issue ranges are sub-bands
// of the detail page's "Standard Repair Range" assigned by issue weight
// (low-end / mid / high-end). Prices are LABOR ESTIMATES — parts are
// included in the page-wide range when shown but the calculator UI must
// still disclose this.
//
// Provenance for sparse units:
//   - residential: pizza-oven, wine-cellar-cooling
//   - commercial:  comm-laundry, pizza-oven-comm, refrigeration-hub
// See `notes` on each affected entry.
//
// Build audit: wiki/audit/homepage-services-deployment-audit-2026-04-27.md

export type ServiceType = 'residential' | 'commercial';

export interface PriceRange {
  min: number;
  max: number;
}

export interface RepairIssue {
  /** Kebab-case slug derived from the label */
  id: string;
  /** Customer-facing symptom phrasing — never a technical part name */
  label: string;
  /** Per-issue sub-range in USD (whole dollars, no cents) */
  priceRange: PriceRange;
}

export interface UnitEstimate {
  /** Matches the `id` field in src/data/homepage-services.ts */
  id: string;
  label: string;
  /** Detail-page URL for the post-estimate "View … Repair Details →" link */
  href: string;
  category: ServiceType;
  issues: RepairIssue[];
  /** Page-wide repair range from the detail page (informational) */
  pageRange?: PriceRange;
  /** True when the source detail page lacked a structured symptom list */
  sparse?: boolean;
  /** Free-form note when the resolution path was non-obvious */
  notes?: string;
}

const r = (min: number, max: number): PriceRange => ({ min, max });

export const REPAIR_ESTIMATES: Record<string, UnitEstimate> = {
  // ──────────────── RESIDENTIAL (25) ────────────────

  'bbq-grill': {
    id: 'bbq-grill',
    label: 'BBQ Grill Repair',
    href: '/services/bbq-grill-repair/',
    category: 'residential',
    pageRange: r(120, 400),
    issues: [
      { id: 'burner-wont-ignite',                label: "Burner Won't Ignite",         priceRange: r(120, 250) },
      { id: 'uneven-heat-hot-and-cold-spots',    label: 'Uneven Heat / Hot and Cold Spots', priceRange: r(180, 330) },
      { id: 'weak-flame-low-heat-output',        label: 'Weak Flame / Low Heat Output', priceRange: r(180, 330) },
      { id: 'excessive-flare-ups',               label: 'Excessive Flare-Ups',          priceRange: r(120, 250) },
      { id: 'pellet-grill-not-heating',          label: 'Pellet Grill Not Heating',     priceRange: r(230, 400) },
    ],
  },

  'built-in-fridge': {
    id: 'built-in-fridge',
    label: 'Built In Refrigerator',
    href: '/services/built-in-refrigerator-repair/',
    category: 'residential',
    pageRange: r(200, 400),
    notes: "pageRange uses the Sensor/Valve/Fan tier; control-board ($350–$650) and compressor ($600–$1,200+) tiers exist on the detail page as upgrades.",
    issues: [
      { id: 'not-cooling-warm-temperatures',     label: 'Not Cooling / Warm Temperatures', priceRange: r(280, 400) },
      { id: 'error-codes-on-display',            label: 'Error Codes on Display',          priceRange: r(200, 290) },
      { id: 'ice-maker-not-producing',           label: 'Ice Maker Not Producing',         priceRange: r(200, 290) },
      { id: 'compressor-noise-vibration',        label: 'Compressor Noise / Vibration',    priceRange: r(280, 400) },
      { id: 'door-seal-gasket-failure',          label: 'Door Seal / Gasket Failure',      priceRange: r(200, 290) },
    ],
  },

  'cooktop': {
    id: 'cooktop',
    label: 'Cooktop Repair',
    href: '/services/cooktop-repair/',
    category: 'residential',
    pageRange: r(120, 320),
    issues: [
      { id: 'gas-burner-wont-light',             label: "Gas Burner Won't Light",          priceRange: r(120, 210) },
      { id: 'constant-clicking-gas',             label: 'Constant Clicking (Gas)',         priceRange: r(120, 210) },
      { id: 'electric-burner-not-heating',       label: 'Electric Burner Not Heating',     priceRange: r(200, 320) },
      { id: 'cracked-glass-cooktop',             label: 'Cracked Glass Cooktop',           priceRange: r(200, 320) },
      { id: 'control-panel-touch-panel-dead',    label: 'Control Panel / Touch Panel Dead', priceRange: r(200, 320) },
    ],
  },

  'dishwasher': {
    id: 'dishwasher',
    label: 'Dishwasher Repair',
    href: '/services/dishwasher-repair/',
    category: 'residential',
    pageRange: r(120, 280),
    issues: [
      { id: 'standing-water-after-the-cycle',    label: 'Standing Water After the Cycle',  priceRange: r(150, 240) },
      { id: 'wont-start-door-wont-latch',        label: "Won't Start / Door Won't Latch",  priceRange: r(120, 190) },
      { id: 'dishes-come-out-dirty',             label: 'Dishes Come Out Dirty',           priceRange: r(150, 240) },
      { id: 'dishwasher-leaking',                label: 'Dishwasher Leaking',              priceRange: r(150, 240) },
      { id: 'error-codes',                       label: 'Error Codes',                     priceRange: r(180, 280) },
    ],
  },

  'dryer': {
    id: 'dryer',
    label: 'Dryer Repair',
    href: '/services/dryer-repair/',
    category: 'residential',
    pageRange: r(120, 300),
    issues: [
      { id: 'no-heat-electric',                  label: 'No Heat (Electric)',              priceRange: r(190, 300) },
      { id: 'no-heat-gas',                       label: 'No Heat (Gas)',                   priceRange: r(190, 300) },
      { id: 'wont-start',                        label: "Won't Start",                     priceRange: r(120, 200) },
      { id: 'drum-not-turning',                  label: 'Drum Not Turning',                priceRange: r(160, 260) },
      { id: 'squealing-or-grinding-noise',       label: 'Squealing or Grinding Noise',     priceRange: r(160, 260) },
    ],
  },

  'dryer-vent': {
    id: 'dryer-vent',
    label: 'Dryer Vent Repair',
    href: '/services/dryer-vent-repair/',
    category: 'residential',
    pageRange: r(150, 450),
    issues: [
      { id: 'extended-drying-times',             label: 'Extended Drying Times',           priceRange: r(210, 380) },
      { id: 'dryer-running-hot',                 label: 'Dryer Running Hot',               priceRange: r(270, 450) },
      { id: 'visible-damage-to-transition-duct', label: 'Visible Damage to Transition Duct', priceRange: r(150, 290) },
      { id: 'visible-lint-at-back-of-dryer',     label: 'Visible Lint at Back of Dryer',   priceRange: r(150, 290) },
      { id: 'booster-fan-failure',               label: 'Booster Fan Failure',             priceRange: r(270, 450) },
    ],
  },

  'fireplace': {
    id: 'fireplace',
    label: 'Fireplace Repair',
    href: '/services/fireplace-repair/',
    category: 'residential',
    pageRange: r(120, 380),
    issues: [
      { id: 'pilot-wont-stay-lit',               label: "Pilot Won't Stay Lit",            priceRange: r(120, 240) },
      { id: 'remote-control-not-working',        label: 'Remote Control Not Working',      priceRange: r(120, 240) },
      { id: 'blower-fan-not-working-or-noisy',   label: 'Blower Fan Not Working or Noisy', priceRange: r(170, 320) },
      { id: 'no-flame-at-all-wont-light',        label: "No Flame at All / Won't Light",   priceRange: r(220, 380) },
      { id: 'electric-fireplace-not-heating',    label: 'Electric Fireplace Not Heating',  priceRange: r(220, 380) },
    ],
  },

  'freezer': {
    id: 'freezer',
    label: 'Freezer Repair',
    href: '/services/freezer-repair/',
    category: 'residential',
    pageRange: r(130, 350),
    issues: [
      { id: 'freezer-not-cold-enough',           label: 'Freezer Not Cold Enough',         priceRange: r(220, 350) },
      { id: 'excessive-frost-ice-buildup',       label: 'Excessive Frost / Ice Buildup',   priceRange: r(170, 300) },
      { id: 'defrost-system-failure',            label: 'Defrost System Failure',          priceRange: r(170, 300) },
      { id: 'evaporator-fan-failure',            label: 'Evaporator Fan Failure',          priceRange: r(130, 230) },
      { id: 'compressor-issues',                 label: 'Compressor Issues',               priceRange: r(220, 350) },
    ],
  },

  'disposal': {
    id: 'disposal',
    label: 'Garbage Disposal',
    href: '/services/garbage-disposal-repair/',
    category: 'residential',
    pageRange: r(120, 280),
    issues: [
      { id: 'humming-but-not-spinning',          label: 'Humming But Not Spinning',        priceRange: r(120, 190) },
      { id: 'leaking-under-the-sink',            label: 'Leaking Under the Sink',          priceRange: r(150, 240) },
      { id: 'not-turning-on-at-all',             label: 'Not Turning On at All',           priceRange: r(180, 280) },
      { id: 'slow-grinding-or-weak-performance', label: 'Slow Grinding or Weak Performance', priceRange: r(150, 240) },
      { id: 'loud-grinding-or-rattling-noise',   label: 'Loud Grinding or Rattling Noise', priceRange: r(150, 240) },
    ],
  },

  'ice-maker': {
    id: 'ice-maker',
    label: 'Ice Maker Repair',
    href: '/services/ice-maker-repair/',
    category: 'residential',
    pageRange: r(120, 280),
    issues: [
      { id: 'no-ice-at-all',                          label: 'No Ice at All',                       priceRange: r(180, 280) },
      { id: 'produces-little-ice-slow-production',    label: 'Produces Little Ice / Slow Production', priceRange: r(150, 240) },
      { id: 'cloudy-small-or-misshapen-ice',          label: 'Cloudy, Small, or Misshapen Ice',     priceRange: r(120, 190) },
      { id: 'ice-maker-leaking',                      label: 'Ice Maker Leaking',                   priceRange: r(120, 190) },
      { id: 'ice-maker-frozen-iced-over',             label: 'Ice Maker Frozen / Iced Over',        priceRange: r(150, 240) },
    ],
  },

  'induction': {
    id: 'induction',
    label: 'Induction Cooktop',
    href: '/services/induction-cooktop-repair/',
    category: 'residential',
    pageRange: r(180, 420),
    issues: [
      { id: 'one-zone-dead-igbt-inverter-module',     label: 'One Zone Dead (IGBT / Inverter Module)', priceRange: r(280, 420) },
      { id: 'cooktop-shuts-off-during-cooking',       label: 'Cooktop Shuts Off During Cooking',    priceRange: r(230, 360) },
      { id: 'f-code-on-display',                      label: 'F-Code on Display',                   priceRange: r(180, 290) },
      { id: 'control-board-failure',                  label: 'Control Board Failure',               priceRange: r(280, 420) },
      { id: 'touch-controls-unresponsive',            label: 'Touch Controls Unresponsive',         priceRange: r(180, 290) },
    ],
  },

  'laundry': {
    id: 'laundry',
    label: 'Laundry Repair',
    href: '/services/laundry-repair/',
    category: 'residential',
    pageRange: r(140, 380),
    notes: 'Hub page covering washer + dryer + stackable. pageRange uses the washer-tier card; dryer card is $120–$340; premium-brand spans run $180–$560+.',
    issues: [
      { id: 'washer-not-spinning',     label: 'Washer Not Spinning',  priceRange: r(190, 320) },
      { id: 'washer-not-draining',     label: 'Washer Not Draining',  priceRange: r(140, 250) },
      { id: 'dryer-not-heating',       label: 'Dryer Not Heating',    priceRange: r(240, 380) },
      { id: 'dryer-takes-too-long',    label: 'Dryer Takes Too Long', priceRange: r(190, 320) },
      { id: 'washer-leaking',          label: 'Washer Leaking',       priceRange: r(190, 320) },
    ],
  },

  'microwave': {
    id: 'microwave',
    label: 'Microwave Repair',
    href: '/services/microwave-repair/',
    category: 'residential',
    pageRange: r(100, 250),
    issues: [
      { id: 'microwave-runs-but-no-heat',  label: 'Microwave Runs But No Heat', priceRange: r(160, 250) },
      { id: 'sparking-or-arcing-inside',   label: 'Sparking or Arcing Inside',  priceRange: r(130, 210) },
      { id: 'wont-turn-on',                label: "Won't Turn On",              priceRange: r(160, 250) },
      { id: 'door-wont-open-or-latch',     label: "Door Won't Open or Latch",   priceRange: r(100, 170) },
      { id: 'turntable-not-spinning',      label: 'Turntable Not Spinning',     priceRange: r(100, 170) },
    ],
  },

  'oven': {
    id: 'oven',
    label: 'Oven Repair',
    href: '/services/oven-repair/',
    category: 'residential',
    pageRange: r(150, 350),
    issues: [
      { id: 'oven-wont-heat',              label: "Oven Won't Heat",            priceRange: r(230, 350) },
      { id: 'temperature-inaccurate',      label: 'Temperature Inaccurate',     priceRange: r(150, 240) },
      { id: 'bakes-unevenly-hot-spots',    label: 'Bakes Unevenly / Hot Spots', priceRange: r(190, 300) },
      { id: 'broiler-not-working',         label: 'Broiler Not Working',        priceRange: r(150, 240) },
      { id: 'control-board-error-codes',   label: 'Control Board / Error Codes', priceRange: r(230, 350) },
    ],
  },

  'pizza-oven': {
    id: 'pizza-oven',
    label: 'Pizza Oven Repair',
    href: '/services/pizza-oven-repair/',
    category: 'residential',
    pageRange: r(150, 350),
    sparse: true,
    notes: 'Brand/type hub page — no customer-symptom h3 cluster. Issues derived from FAQ guidance and brand cards (igniter, burner, control-board common failure modes).',
    issues: [
      { id: 'wont-light-no-ignition',      label: "Won't Light / No Ignition",  priceRange: r(150, 240) },
      { id: 'uneven-deck-temperature',     label: 'Uneven Deck Temperature',    priceRange: r(190, 300) },
      { id: 'burner-assembly-failure',     label: 'Burner Assembly Failure',    priceRange: r(230, 350) },
      { id: 'control-board-failure',       label: 'Control Board Failure',      priceRange: r(230, 350) },
    ],
  },

  'range-hood': {
    id: 'range-hood',
    label: 'Range Hood Repair',
    href: '/services/range-hood-repair/',
    category: 'residential',
    pageRange: r(100, 280),
    issues: [
      { id: 'fan-not-working-no-suction', label: 'Fan Not Working / No Suction', priceRange: r(170, 280) },
      { id: 'loud-rattling-or-vibration', label: 'Loud Rattling or Vibration',   priceRange: r(140, 240) },
      { id: 'grinding-or-squealing-noise', label: 'Grinding or Squealing Noise', priceRange: r(140, 240) },
      { id: 'lights-not-working',         label: 'Lights Not Working',           priceRange: r(100, 180) },
      { id: 'hood-completely-dead',       label: 'Hood Completely Dead',         priceRange: r(170, 280) },
    ],
  },

  'refrigerator': {
    id: 'refrigerator',
    label: 'Refrigerator Repair',
    href: '/services/refrigerator-repair/',
    category: 'residential',
    pageRange: r(150, 400),
    issues: [
      { id: 'refrigerator-not-cooling', label: 'Refrigerator Not Cooling', priceRange: r(250, 400) },
      { id: 'ice-maker-not-working',    label: 'Ice Maker Not Working',    priceRange: r(200, 340) },
      { id: 'noisy-refrigerator',       label: 'Noisy Refrigerator',       priceRange: r(200, 340) },
      { id: 'water-leaking-or-pooling', label: 'Water Leaking or Pooling', priceRange: r(150, 260) },
      { id: 'compressor-failure',       label: 'Compressor Failure',       priceRange: r(250, 400) },
    ],
  },

  'stackable': {
    id: 'stackable',
    label: 'Stackable Washer/Dryer',
    href: '/services/stackable-washer-dryer-repair/',
    category: 'residential',
    pageRange: r(130, 320),
    issues: [
      { id: 'washer-not-spinning',  label: 'Washer Not Spinning', priceRange: r(170, 270) },
      { id: 'washer-not-draining',  label: 'Washer Not Draining', priceRange: r(130, 220) },
      { id: 'door-latch-failure',   label: 'Door Latch Failure',  priceRange: r(130, 220) },
      { id: 'dryer-not-heating',    label: 'Dryer Not Heating',   priceRange: r(210, 320) },
      { id: 'washer-leaking',       label: 'Washer Leaking',      priceRange: r(170, 270) },
    ],
  },

  'stove': {
    id: 'stove',
    label: 'Stove Repair',
    href: '/services/stove-repair/',
    category: 'residential',
    pageRange: r(150, 420),
    issues: [
      { id: 'one-gas-burner-wont-light',          label: "One Gas Burner Won't Light",          priceRange: r(150, 270) },
      { id: 'all-gas-burners-dead-at-once',       label: 'All Gas Burners Dead at Once',        priceRange: r(260, 420) },
      { id: 'one-electric-burner-not-heating',    label: 'One Electric Burner Not Heating',     priceRange: r(150, 270) },
      { id: 'range-not-heating-to-temperature',   label: 'Range Not Heating to Temperature',    priceRange: r(260, 420) },
      { id: 'control-knobs-display-not-responding', label: 'Control Knobs / Display Not Responding', priceRange: r(260, 420) },
    ],
  },

  'trash-compactor': {
    id: 'trash-compactor',
    label: 'Trash Compactor',
    href: '/services/trash-compactor-repair/',
    category: 'residential',
    pageRange: r(120, 240),
    issues: [
      { id: 'wont-start-at-all',              label: "Won't Start at All",            priceRange: r(170, 240) },
      { id: 'ram-stuck-mid-cycle',            label: 'Ram Stuck Mid-Cycle',           priceRange: r(140, 210) },
      { id: 'loud-grinding-or-crunching',     label: 'Loud Grinding or Crunching',    priceRange: r(140, 210) },
      { id: 'runs-but-doesnt-compact-well',   label: "Runs But Doesn't Compact Well", priceRange: r(140, 210) },
      { id: 'drawer-wont-open-latch-issues',  label: "Drawer Won't Open / Latch Issues", priceRange: r(120, 170) },
    ],
  },

  'wall-oven': {
    id: 'wall-oven',
    label: 'Wall Oven Repair',
    href: '/services/wall-oven-repair/',
    category: 'residential',
    pageRange: r(150, 380),
    issues: [
      { id: 'oven-wont-heat',            label: "Oven Won't Heat",            priceRange: r(240, 380) },
      { id: 'temperature-inaccurate',    label: 'Temperature Inaccurate',     priceRange: r(150, 250) },
      { id: 'bakes-unevenly',            label: 'Bakes Unevenly',             priceRange: r(200, 320) },
      { id: 'self-clean-door-locked',    label: 'Self-Clean Door Locked',     priceRange: r(150, 250) },
      { id: 'control-board-error-codes', label: 'Control Board / Error Codes', priceRange: r(240, 380) },
    ],
  },

  'washer': {
    id: 'washer',
    label: 'Washer Repair',
    href: '/services/washer-repair/',
    category: 'residential',
    pageRange: r(130, 350),
    issues: [
      { id: 'washer-not-draining',     label: 'Washer Not Draining',     priceRange: r(130, 230) },
      { id: 'wont-spin-or-agitate',    label: "Won't Spin or Agitate",   priceRange: r(170, 300) },
      { id: 'water-leaking',           label: 'Water Leaking',           priceRange: r(170, 300) },
      { id: 'door-lock-latch-failure', label: 'Door Lock / Latch Failure', priceRange: r(130, 230) },
      { id: 'control-board-issues',    label: 'Control Board Issues',    priceRange: r(220, 350) },
    ],
  },

  'wine-cellar-cooling': {
    id: 'wine-cellar-cooling',
    label: 'Wine Cellar Cooling',
    href: '/services/wine-cellar-cooling-repair/',
    category: 'residential',
    pageRange: r(200, 650),
    sparse: true,
    notes: 'Placeholder page (FAQ-only). No symptom h3 cluster and no Standard Repair Range. Issues derived from FAQ-implied symptoms; pageRange aligned to wine-cellar-repair self-contained tier.',
    issues: [
      { id: 'temperature-drift',        label: 'Temperature Drift',         priceRange: r(200, 400) },
      { id: 'refrigerant-charge-issue', label: 'Refrigerant Charge Issue',  priceRange: r(380, 650) },
      { id: 'condenser-fouling',        label: 'Condenser Fouling',         priceRange: r(200, 400) },
      { id: 'compressor-not-running',   label: 'Compressor Not Running',    priceRange: r(380, 650) },
    ],
  },

  'wine-cellar': {
    id: 'wine-cellar',
    label: 'Wine Cellar Repair',
    href: '/services/wine-cellar-repair/',
    category: 'residential',
    pageRange: r(250, 650),
    notes: 'pageRange uses self-contained tier; split/ducted runs $450–$1,400 and compressor $900–$2,500+.',
    issues: [
      { id: 'temperature-drifting-upward', label: 'Temperature Drifting Upward', priceRange: r(410, 650) },
      { id: 'humidity-dropping-below-50',  label: 'Humidity Dropping Below 50%', priceRange: r(330, 550) },
      { id: 'humidity-climbing-above-75',  label: 'Humidity Climbing Above 75%', priceRange: r(330, 550) },
      { id: 'compressor-short-cycling',    label: 'Compressor Short-Cycling',    priceRange: r(410, 650) },
      { id: 'evaporator-fan-failure',      label: 'Evaporator Fan Failure',      priceRange: r(250, 430) },
    ],
  },

  'wine-cooler': {
    id: 'wine-cooler',
    label: 'Wine Cooler Repair',
    href: '/services/wine-cooler-repair/',
    category: 'residential',
    pageRange: r(120, 320),
    issues: [
      { id: 'not-cooling-compressor-units',     label: 'Not Cooling (Compressor Units)',    priceRange: r(200, 320) },
      { id: 'not-cooling-thermoelectric-units', label: 'Not Cooling (Thermoelectric Units)', priceRange: r(200, 320) },
      { id: 'uneven-cooling-between-zones',     label: 'Uneven Cooling Between Zones',      priceRange: r(160, 270) },
      { id: 'temperature-fluctuation',          label: 'Temperature Fluctuation',           priceRange: r(160, 270) },
      { id: 'door-seal-deterioration',          label: 'Door Seal Deterioration',           priceRange: r(120, 210) },
    ],
  },

  // ──────────────── COMMERCIAL (18) ────────────────

  'bar-fridge': {
    id: 'bar-fridge',
    label: 'Bar Refrigerator',
    href: '/commercial/bar-refrigerator-repair/',
    category: 'commercial',
    pageRange: r(150, 500),
    issues: [
      { id: 'not-cooling-too-warm',                label: 'Not Cooling / Too Warm',              priceRange: r(290, 500) },
      { id: 'temperature-inconsistent-or-drifting', label: 'Temperature Inconsistent or Drifting', priceRange: r(220, 410) },
      { id: 'ice-forming-inside-the-unit',         label: 'Ice Forming Inside the Unit',         priceRange: r(220, 410) },
      { id: 'noisy-operation',                     label: 'Noisy Operation',                     priceRange: r(220, 410) },
      { id: 'kegerator-not-holding-temperature',   label: 'Kegerator Not Holding Temperature',   priceRange: r(290, 500) },
    ],
  },

  'comm-dishwasher': {
    id: 'comm-dishwasher',
    label: 'Dishwasher Repair',
    href: '/commercial/dishwasher-repair/',
    category: 'commercial',
    pageRange: r(180, 500),
    issues: [
      { id: 'not-cleaning-properly-food-residue',  label: 'Not Cleaning Properly / Food Residue', priceRange: r(240, 420) },
      { id: 'not-reaching-sanitizing-temperature', label: 'Not Reaching Sanitizing Temperature', priceRange: r(310, 500) },
      { id: 'not-draining',                        label: 'Not Draining',                        priceRange: r(180, 320) },
      { id: 'leaking',                             label: 'Leaking',                             priceRange: r(240, 420) },
      { id: 'chemical-dispenser-failure',          label: 'Chemical Dispenser Failure',          priceRange: r(180, 320) },
    ],
  },

  'comm-dryer': {
    id: 'comm-dryer',
    label: 'Dryer Repair',
    href: '/commercial/dryer-repair/',
    category: 'commercial',
    pageRange: r(150, 450),
    issues: [
      { id: 'not-heating-no-heat',                label: 'Not Heating / No Heat',                 priceRange: r(270, 450) },
      { id: 'slow-drying-takes-multiple-cycles',  label: 'Slow Drying / Takes Multiple Cycles',   priceRange: r(210, 380) },
      { id: 'overheating-burning-smell',          label: 'Overheating / Burning Smell',           priceRange: r(150, 290) },
      { id: 'drum-not-turning',                   label: 'Drum Not Turning',                      priceRange: r(210, 380) },
      { id: 'wont-start',                         label: "Won't Start",                           priceRange: r(150, 290) },
    ],
  },

  'exhaust-hood': {
    id: 'exhaust-hood',
    label: 'Exhaust Hood Repair',
    href: '/commercial/exhaust-hood-repair/',
    category: 'commercial',
    pageRange: r(150, 650),
    notes: 'pageRange spans the page price-card tiers ($150–$280 light, $200–$450 mid, $280–$650 motor/blower).',
    issues: [
      { id: 'fan-motor-not-running-no-airflow', label: 'Fan Motor Not Running / No Airflow', priceRange: r(350, 650) },
      { id: 'weak-airflow-reduced-capture',     label: 'Weak Airflow / Reduced Capture',     priceRange: r(250, 530) },
      { id: 'excessive-noise-vibration',        label: 'Excessive Noise / Vibration',        priceRange: r(250, 530) },
      { id: 'hood-running-constantly-wont-turn-off', label: "Hood Running Constantly / Won't Turn Off", priceRange: r(150, 380) },
      { id: 'grease-dripping-leaking',          label: 'Grease Dripping / Leaking',          priceRange: r(150, 380) },
    ],
  },

  'comm-freezer': {
    id: 'comm-freezer',
    label: 'Freezer Repair',
    href: '/commercial/freezer-repair/',
    category: 'commercial',
    pageRange: r(180, 550),
    issues: [
      { id: 'not-holding-0f-temperature-rising', label: 'Not Holding 0°F / Temperature Rising', priceRange: r(330, 550) },
      { id: 'compressor-running-constantly',     label: 'Compressor Running Constantly',       priceRange: r(330, 550) },
      { id: 'ice-buildup-on-evaporator',         label: 'Ice Buildup on Evaporator',           priceRange: r(250, 460) },
      { id: 'door-gasket-failure',               label: 'Door Gasket Failure',                 priceRange: r(180, 350) },
      { id: 'not-starting-dead-unit',            label: 'Not Starting / Dead Unit',            priceRange: r(330, 550) },
    ],
  },

  'fryer': {
    id: 'fryer',
    label: 'Fryer Repair',
    href: '/commercial/fryer-repair/',
    category: 'commercial',
    pageRange: r(150, 500),
    issues: [
      { id: 'not-heating-not-reaching-temperature',         label: 'Not Heating / Not Reaching Temperature',     priceRange: r(290, 500) },
      { id: 'temperature-not-holding-cycling-off-early',    label: 'Temperature Not Holding / Cycling Off Early', priceRange: r(220, 410) },
      { id: 'pilot-light-wont-stay-lit',                    label: "Pilot Light Won't Stay Lit",                 priceRange: r(150, 310) },
      { id: 'drain-valve-not-working',                      label: 'Drain Valve Not Working',                    priceRange: r(150, 310) },
      { id: 'recovery-time-too-slow',                       label: 'Recovery Time Too Slow',                     priceRange: r(220, 410) },
    ],
  },

  'ice-machine': {
    id: 'ice-machine',
    label: 'Ice Machine Repair',
    href: '/commercial/ice-machine-repair/',
    category: 'commercial',
    pageRange: r(180, 500),
    issues: [
      { id: 'not-making-ice-at-all',           label: 'Not Making Ice At All',           priceRange: r(310, 500) },
      { id: 'slow-ice-production-low-output',  label: 'Slow Ice Production / Low Output', priceRange: r(240, 420) },
      { id: 'harvest-cycle-failure',           label: 'Harvest Cycle Failure',           priceRange: r(240, 420) },
      { id: 'dirty-cloudy-or-off-tasting-ice', label: 'Dirty, Cloudy, or Off-Tasting Ice', priceRange: r(180, 320) },
      { id: 'machine-overheating-shutting-down', label: 'Machine Overheating / Shutting Down', priceRange: r(310, 500) },
    ],
  },

  'comm-laundry': {
    id: 'comm-laundry',
    label: 'Laundry Repair',
    href: '/commercial/laundry-repair/',
    category: 'commercial',
    pageRange: r(180, 500),
    sparse: true,
    notes: 'Hub page covering commercial washer + dryer; no symptom h3 cluster of its own. Issues derived as a representative cross-section; pageRange aligned to commercial-washer tier.',
    issues: [
      { id: 'washer-not-draining',         label: 'Washer Not Draining',         priceRange: r(180, 320) },
      { id: 'dryer-not-heating',           label: 'Dryer Not Heating',           priceRange: r(310, 500) },
      { id: 'machine-wont-start',          label: "Machine Won't Start",         priceRange: r(180, 320) },
      { id: 'excessive-vibration-or-noise', label: 'Excessive Vibration or Noise', priceRange: r(240, 420) },
    ],
  },

  'comm-oven': {
    id: 'comm-oven',
    label: 'Oven Repair',
    href: '/commercial/oven-repair/',
    category: 'commercial',
    pageRange: r(180, 550),
    issues: [
      { id: 'not-heating-wont-reach-temperature',        label: "Not Heating / Won't Reach Temperature",       priceRange: r(330, 550) },
      { id: 'uneven-cooking-hot-spots',                  label: 'Uneven Cooking / Hot Spots',                  priceRange: r(250, 460) },
      { id: 'pilot-light-wont-stay-lit',                 label: "Pilot Light Won't Stay Lit",                  priceRange: r(180, 350) },
      { id: 'temperature-fluctuation-inconsistent-heat', label: 'Temperature Fluctuation / Inconsistent Heat', priceRange: r(250, 460) },
      { id: 'control-board-fault',                       label: 'Control Board Fault',                         priceRange: r(330, 550) },
    ],
  },

  'pizza-oven-comm': {
    id: 'pizza-oven-comm',
    label: 'Pizza Oven Repair',
    href: '/commercial/pizza-oven-repair/',
    category: 'commercial',
    pageRange: r(350, 750),
    sparse: true,
    notes: 'Brand-card hub page; no symptom h3 cluster and no Standard Repair Range card. pageRange taken from inline copy: "Most pizza oven calls land $350–$750 parts-and-labor."',
    issues: [
      { id: 'wont-light-no-ignition',     label: "Won't Light / No Ignition",  priceRange: r(350, 530) },
      { id: 'uneven-deck-temperature',    label: 'Uneven Deck Temperature',    priceRange: r(430, 650) },
      { id: 'conveyor-belt-stopped-moving', label: 'Conveyor Belt Stopped Moving', priceRange: r(430, 650) },
      { id: 'control-board-failure',      label: 'Control Board Failure',      priceRange: r(510, 750) },
    ],
  },

  'refrigeration-hub': {
    id: 'refrigeration-hub',
    label: 'Refrigeration Hub',
    href: '/commercial/refrigeration-hub/',
    category: 'commercial',
    pageRange: r(250, 900),
    sparse: true,
    notes: 'Broad-category commercial-refrigeration hub page. No per-issue list and no Standard Repair Range. Issues abstract underlying refrigeration symptoms; pageRange derived ($250–$900 spans equipment classes from reach-ins through walk-ins).',
    issues: [
      { id: 'not-holding-temperature',       label: 'Not Holding Temperature',       priceRange: r(510, 900) },
      { id: 'excessive-frost-ice-buildup',   label: 'Excessive Frost / Ice Buildup', priceRange: r(380, 740) },
      { id: 'compressor-running-constantly', label: 'Compressor Running Constantly', priceRange: r(510, 900) },
      { id: 'unusual-noise',                 label: 'Unusual Noise',                 priceRange: r(380, 740) },
    ],
  },

  'comm-fridge': {
    id: 'comm-fridge',
    label: 'Refrigerator Repair',
    href: '/commercial/refrigerator-repair/',
    category: 'commercial',
    pageRange: r(180, 550),
    issues: [
      { id: 'not-cooling-temperature-drift',     label: 'Not Cooling / Temperature Drift',  priceRange: r(330, 550) },
      { id: 'temperature-fluctuation',           label: 'Temperature Fluctuation',          priceRange: r(250, 460) },
      { id: 'frost-ice-buildup-on-evaporator',   label: 'Frost / Ice Buildup on Evaporator', priceRange: r(250, 460) },
      { id: 'evaporator-condenser-fan-failure',  label: 'Evaporator & Condenser Fan Failure', priceRange: r(180, 350) },
      { id: 'compressor-failure',                label: 'Compressor Failure',               priceRange: r(330, 550) },
    ],
  },

  'showcase-fridge': {
    id: 'showcase-fridge',
    label: 'Showcase Refrigerator',
    href: '/commercial/showcase-refrigerator-repair/',
    category: 'commercial',
    pageRange: r(150, 550),
    issues: [
      { id: 'foggy-sweating-glass',         label: 'Foggy / Sweating Glass',          priceRange: r(150, 330) },
      { id: 'temperature-not-holding',      label: 'Temperature Not Holding',         priceRange: r(310, 550) },
      { id: 'lighting-failure-flickering',  label: 'Lighting Failure / Flickering',   priceRange: r(150, 330) },
      { id: 'door-gasket-failure',          label: 'Door Gasket Failure',             priceRange: r(150, 330) },
      { id: 'uneven-temperatures-hot-spots', label: 'Uneven Temperatures / Hot Spots', priceRange: r(230, 450) },
    ],
  },

  'slushie': {
    id: 'slushie',
    label: 'Slushie Machine',
    href: '/commercial/slushie-machine-repair/',
    category: 'commercial',
    pageRange: r(150, 500),
    issues: [
      { id: 'product-too-frozen-frozen-solid',     label: 'Product Too Frozen / Frozen Solid',    priceRange: r(220, 410) },
      { id: 'product-not-cold-enough-too-liquid',  label: 'Product Not Cold Enough / Too Liquid', priceRange: r(290, 500) },
      { id: 'wont-dispense-slow-flow',             label: "Won't Dispense / Slow Flow",           priceRange: r(150, 310) },
      { id: 'machine-not-running',                 label: 'Machine Not Running',                  priceRange: r(290, 500) },
      { id: 'leaking-product-dripping',            label: 'Leaking / Product Dripping',           priceRange: r(220, 410) },
    ],
  },

  'comm-stove': {
    id: 'comm-stove',
    label: 'Stove Repair',
    href: '/commercial/stove-repair/',
    category: 'commercial',
    pageRange: r(150, 500),
    issues: [
      { id: 'burner-wont-light',                 label: "Burner Won't Light",                 priceRange: r(150, 310) },
      { id: 'weak-or-yellow-flame',              label: 'Weak or Yellow Flame',               priceRange: r(220, 410) },
      { id: 'pilot-light-wont-stay-lit',         label: "Pilot Light Won't Stay Lit",         priceRange: r(150, 310) },
      { id: 'burner-ignites-then-goes-out',      label: 'Burner Ignites Then Goes Out',       priceRange: r(220, 410) },
      { id: 'uneven-heat-one-section-not-working', label: 'Uneven Heat / One Section Not Working', priceRange: r(290, 500) },
    ],
  },

  'walk-in-cooler': {
    id: 'walk-in-cooler',
    label: 'Walk-In Cooler',
    href: '/commercial/walk-in-cooler-repair/',
    category: 'commercial',
    pageRange: r(200, 600),
    issues: [
      { id: 'not-holding-temperature',       label: 'Not Holding Temperature',         priceRange: r(360, 600) },
      { id: 'excessive-ice-frost-buildup',   label: 'Excessive Ice / Frost Buildup',   priceRange: r(280, 500) },
      { id: 'compressor-running-constantly', label: 'Compressor Running Constantly',   priceRange: r(360, 600) },
      { id: 'water-on-the-floor-inside',     label: 'Water on the Floor Inside',       priceRange: r(200, 380) },
      { id: 'door-wont-seal-frozen-shut',    label: "Door Won't Seal / Frozen Shut",   priceRange: r(200, 380) },
    ],
  },

  'walk-in-freezer': {
    id: 'walk-in-freezer',
    label: 'Walk-In Freezer',
    href: '/commercial/walk-in-freezer-repair/',
    category: 'commercial',
    pageRange: r(250, 700),
    issues: [
      { id: 'temperature-rising-above-0f',                 label: 'Temperature Rising Above 0°F',                 priceRange: r(430, 700) },
      { id: 'floor-ice-buildup',                           label: 'Floor Ice Buildup',                            priceRange: r(340, 590) },
      { id: 'evaporator-coils-completely-frozen-over',     label: 'Evaporator Coils Completely Frozen Over',      priceRange: r(340, 590) },
      { id: 'door-wont-open-frozen-shut',                  label: "Door Won't Open / Frozen Shut",                priceRange: r(250, 450) },
      { id: 'compressor-running-constantly',               label: 'Compressor Running Constantly',                priceRange: r(430, 700) },
    ],
  },

  'comm-washer': {
    id: 'comm-washer',
    label: 'Washer Repair',
    href: '/commercial/washer-repair/',
    category: 'commercial',
    pageRange: r(180, 500),
    issues: [
      { id: 'not-draining-water-pooling',  label: 'Not Draining / Water Pooling', priceRange: r(180, 320) },
      { id: 'not-spinning-weak-spin',      label: 'Not Spinning / Weak Spin',     priceRange: r(240, 420) },
      { id: 'water-leaking',               label: 'Water Leaking',                priceRange: r(240, 420) },
      { id: 'wont-start-dead-machine',     label: "Won't Start / Dead Machine",   priceRange: r(310, 500) },
      { id: 'excessive-noise-vibration',   label: 'Excessive Noise / Vibration',  priceRange: r(240, 420) },
    ],
  },
};

/** Unit ids per category, alphabetical by display label. */
export const UNITS_BY_CATEGORY: Record<ServiceType, string[]> = {
  residential: [
    'bbq-grill',
    'built-in-fridge',
    'cooktop',
    'dishwasher',
    'dryer',
    'dryer-vent',
    'fireplace',
    'freezer',
    'disposal',
    'ice-maker',
    'induction',
    'laundry',
    'microwave',
    'oven',
    'pizza-oven',
    'range-hood',
    'refrigerator',
    'stackable',
    'stove',
    'trash-compactor',
    'wall-oven',
    'washer',
    'wine-cellar-cooling',
    'wine-cellar',
    'wine-cooler',
  ],
  commercial: [
    'bar-fridge',
    'comm-dishwasher',
    'comm-dryer',
    'exhaust-hood',
    'comm-freezer',
    'fryer',
    'ice-machine',
    'comm-laundry',
    'comm-oven',
    'pizza-oven-comm',
    'refrigeration-hub',
    'comm-fridge',
    'showcase-fridge',
    'slushie',
    'comm-stove',
    'walk-in-cooler',
    'walk-in-freezer',
    'comm-washer',
  ],
};
