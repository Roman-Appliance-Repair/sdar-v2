// src/data/service-catalog.ts
//
// SSOT for the site-wide JSON-LD OfferCatalog. Six sub-catalogs covering
// 48 distinct services across residential / commercial-kitchen / cold-storage /
// ice-machines / outdoor / hvac. Consumed by src/lib/build-service-catalog.ts
// which renders the @graph node anchored at SERVICE_CATALOG_ID.
//
// Voice: factual technical scope per service. One sentence (~80-180 chars).
// Specific failure modes / parts mentioned. No marketing phrases per
// docs/voice-and-style.md §2 (no "certified technicians", "peace of mind",
// "top-of-the-line", etc.).
//
// Pricing tiers (per CLAUDE.md §1):
//   - $89  residential  (waived with repair)
//   - $120 commercial   (waived with repair)
//   - null              quote-based (HVAC); no priceSpecification emitted
//
// HVAC scope note: CSLB C-20 HVAC license #1138898 is active and used in
// the four HVAC service descriptions that explicitly reference it. EPA 608
// Universal #1346255700410 referenced in refrigerant-handling services.

export const SERVICE_CATALOG_ID = 'https://samedayappliance.repair/#service-catalog';

export type PriceTier = '$89' | '$120' | 'quote';

export interface CatalogService {
  /** Kebab-case service slug; powers Offer @id and Service @id anchors. */
  id: string;
  /** Human-readable service name for schema `name`. */
  name: string;
  /** Single-sentence factual technical scope; specific parts/failure modes. */
  description: string;
  /** Pricing tier — `$89`/`$120`/`quote`. Drives priceSpecification emission. */
  priceTier: PriceTier;
}

export interface SubCatalog {
  /** Sub-catalog slug; powers OfferCatalog @id anchor (e.g. `catalog-residential`). */
  id: string;
  /** Human-readable sub-catalog name for schema `name`. */
  name: string;
  /** Services contained in this sub-catalog. */
  services: CatalogService[];
}

export const SUB_CATALOGS: SubCatalog[] = [
  // ─────────────────────────────────────────────────
  // 1. Home Appliances Residential — 14 services, $89 diagnostic
  // ─────────────────────────────────────────────────
  {
    id: 'catalog-residential',
    name: 'Home Appliances Residential',
    services: [
      { id: 'refrigerator-repair',         name: 'Refrigerator Repair',         description: 'Compressor, evaporator fan, defrost system, ice maker, and water dispenser repair on built-in and freestanding units.', priceTier: '$89' },
      { id: 'freezer-repair',              name: 'Freezer Repair',              description: 'Compressor, defrost timer, evaporator coil, door gasket, and thermostat repair on standalone and column freezers.', priceTier: '$89' },
      { id: 'dishwasher-repair',           name: 'Dishwasher Repair',           description: 'Drain pump, control board, water inlet valve, door seal, and spray arm repair on built-in and integrated units.', priceTier: '$89' },
      { id: 'washing-machine-repair',      name: 'Washing Machine Repair',      description: 'Drain pump, drive motor, control board, door lock, and bearing repair on front-load and top-load washers.', priceTier: '$89' },
      { id: 'dryer-repair',                name: 'Dryer Repair',                description: 'Heating element, thermal fuse, drum belt, blower wheel, and control board repair on gas and electric dryers.', priceTier: '$89' },
      { id: 'washer-dryer-combo-repair',   name: 'Washer/Dryer Combo Repair',   description: 'Combined wash/dry cycle diagnosis, ventless condenser, control board, and drum motor repair on stacked and combo units.', priceTier: '$89' },
      { id: 'oven-repair',                 name: 'Oven Repair',                 description: 'Bake element, broil element, control board, igniter, door hinge, and temperature sensor repair on gas and electric ovens.', priceTier: '$89' },
      { id: 'stove-cooktop-repair',        name: 'Stove & Cooktop Repair',      description: 'Surface element, igniter, switch, infinite control, and gas valve repair on radiant, induction, and gas cooktops.', priceTier: '$89' },
      { id: 'wall-oven-repair',            name: 'Wall Oven Repair',            description: 'Bake element, control board, door latch, fan motor, and temperature sensor repair on single and double wall ovens.', priceTier: '$89' },
      { id: 'microwave-repair',            name: 'Microwave Repair',            description: 'Magnetron, high-voltage diode, capacitor, door switch, and turntable motor repair on built-in and over-the-range units.', priceTier: '$89' },
      { id: 'range-hood-repair',           name: 'Range Hood Repair',           description: 'Blower motor, fan switch, light socket, control board, and damper repair on under-cabinet and island range hoods.', priceTier: '$89' },
      { id: 'garbage-disposal-repair',     name: 'Garbage Disposal Repair',     description: 'Motor reset, jam clearing, mounting flange leak, and replacement on continuous-feed and batch-feed disposals.', priceTier: '$89' },
      { id: 'ice-maker-repair',            name: 'Ice Maker Repair',            description: 'Water inlet valve, ice mold, ejector motor, optical sensor, and water line repair on built-in and standalone ice makers.', priceTier: '$89' },
      { id: 'wine-cooler-repair',          name: 'Wine Cooler Repair',          description: 'Compressor, fan motor, thermostat, door seal, and dual-zone temperature calibration on built-in and freestanding wine refrigerators.', priceTier: '$89' }
    ]
  },

  // ─────────────────────────────────────────────────
  // 2. Restaurant Kitchen Commercial — 11 services, $120 diagnostic
  // ─────────────────────────────────────────────────
  {
    id: 'catalog-commercial-kitchen',
    name: 'Restaurant Kitchen Commercial',
    services: [
      { id: 'commercial-dishwasher-repair',       name: 'Commercial Dishwasher Repair',         description: 'Wash pump, rinse arm, booster heater, control board, and door switch repair on undercounter, door-type, and conveyor units.', priceTier: '$120' },
      { id: 'commercial-oven-repair',             name: 'Commercial Oven Repair',               description: 'Igniter, control board, gas valve, thermostat, and convection fan repair on combi, deck, and convection ovens.', priceTier: '$120' },
      { id: 'commercial-stove-repair',            name: 'Commercial Stove Repair',              description: 'Burner valve, pilot, oven thermostat, igniter, and griddle plate repair on six-burner, ten-burner, and salamander ranges.', priceTier: '$120' },
      { id: 'commercial-fryer-repair',            name: 'Commercial Fryer Repair',              description: 'Heating element, thermostat, gas valve, hi-limit safety, and basket lift repair on open-pot, tube-fired, and pressure fryers.', priceTier: '$120' },
      { id: 'commercial-griddle-repair',          name: 'Commercial Griddle Repair',            description: 'Burner, thermostat, igniter, gas valve, and surface plate leveling on chrome and steel griddles, gas and electric.', priceTier: '$120' },
      { id: 'commercial-grill-repair',            name: 'Commercial Grill/Charbroiler Repair',  description: 'Burner, igniter, control valve, radiant, and grate repair on charbroilers, grooved griddles, and salamander broilers.', priceTier: '$120' },
      { id: 'commercial-range-hood-repair',       name: 'Commercial Range Hood Repair',         description: 'Blower motor, fan belt, fire-suppression integration, and make-up air balance on Type I and Type II hoods.', priceTier: '$120' },
      { id: 'commercial-mixer-repair',            name: 'Commercial Mixer Repair',              description: 'Drive gear, motor brushes, attachment hub, bowl lift, and timer repair on planetary mixers and dough mixers.', priceTier: '$120' },
      { id: 'commercial-steamer-repair',          name: 'Commercial Steamer Repair',            description: 'Heating element, water inlet valve, steam generator, descaling, and door seal repair on convection and pressure steamers.', priceTier: '$120' },
      { id: 'commercial-holding-cabinet-repair',  name: 'Commercial Holding Cabinet Repair',    description: 'Heating element, humidity control, fan motor, thermostat, and door gasket repair on holding and proofing cabinets.', priceTier: '$120' },
      { id: 'commercial-proofer-repair',          name: 'Commercial Proofer Repair',            description: 'Humidity injection, heating element, thermostat, fan motor, and steam generator repair on dough proofers.', priceTier: '$120' }
    ]
  },

  // ─────────────────────────────────────────────────
  // 3. Cold Storage Commercial Refrigeration — 7 services, $120 diagnostic
  // ─────────────────────────────────────────────────
  {
    id: 'catalog-cold-storage',
    name: 'Cold Storage Commercial Refrigeration',
    services: [
      { id: 'walk-in-cooler-repair',          name: 'Walk-in Cooler Repair',                description: 'Compressor, condenser, evaporator coil, defrost system, and thermostat repair for restaurant and grocery walk-ins. EPA 608 certified.', priceTier: '$120' },
      { id: 'walk-in-freezer-repair',         name: 'Walk-in Freezer Repair',               description: 'Compressor, defrost timer, evaporator fan, door heater, and thermostat repair on low-temp walk-in freezers. EPA 608 certified.', priceTier: '$120' },
      { id: 'commercial-refrigerator-repair', name: 'Commercial Refrigerator Repair',       description: 'Compressor, condenser fan, evaporator, thermostat, and door gasket repair on reach-in and undercounter commercial refrigerators.', priceTier: '$120' },
      { id: 'commercial-freezer-repair',      name: 'Commercial Freezer Repair',            description: 'Compressor, defrost system, evaporator, fan motor, and door seal repair on reach-in and chest commercial freezers.', priceTier: '$120' },
      { id: 'showcase-refrigerator-repair',   name: 'Showcase/Display Refrigerator Repair', description: 'Compressor, condenser, fan motor, thermostat, and lighting repair on glass-door display and grab-and-go cases.', priceTier: '$120' },
      { id: 'bar-refrigerator-repair',        name: 'Bar Refrigerator Repair',              description: 'Compressor, condenser, thermostat, fan motor, and gasket repair on back-bar coolers, beer dispensers, and undercounter bar units.', priceTier: '$120' },
      { id: 'wine-cellar-cooling-repair',     name: 'Wine Cellar Cooling Repair',           description: 'Compressor, fan motor, thermostat, condenser coil, and humidity control on residential and commercial wine cellar systems.', priceTier: '$120' }
    ]
  },

  // ─────────────────────────────────────────────────
  // 4. Ice Machines Commercial — 5 services, $120 diagnostic
  // ─────────────────────────────────────────────────
  {
    id: 'catalog-ice-machines',
    name: 'Ice Machines Commercial',
    services: [
      { id: 'commercial-ice-machine-repair',  name: 'Commercial Ice Machine Repair',          description: 'Compressor, water pump, evaporator plate, thermostat, and harvest cycle repair on cube, flake, and nugget ice machines.', priceTier: '$120' },
      { id: 'commercial-ice-maker-repair',    name: 'Commercial Ice Maker Repair',            description: 'Water inlet, condenser, evaporator, harvest probe, and bin thermostat repair on undercounter and modular ice makers.', priceTier: '$120' },
      { id: 'slushie-machine-repair',         name: 'Slushie/Frozen Beverage Machine Repair', description: 'Compressor, auger motor, gear box, drive coupler, and thermostat repair on frozen-beverage and slushie dispensers.', priceTier: '$120' },
      { id: 'ice-dispenser-repair',           name: 'Ice Dispenser Repair',                   description: 'Auger motor, water valve, dispenser actuator, ice chute, and control board repair on countertop and floor-standing ice dispensers.', priceTier: '$120' },
      { id: 'ice-bin-repair',                 name: 'Ice Bin Repair',                         description: 'Liner crack, drain line, level sensor, and gasket repair on commercial ice storage bins and combination bin/dispenser units.', priceTier: '$120' }
    ]
  },

  // ─────────────────────────────────────────────────
  // 5. Outdoor Living — 6 services, $89 diagnostic
  // ─────────────────────────────────────────────────
  {
    id: 'catalog-outdoor',
    name: 'Outdoor Living',
    services: [
      { id: 'bbq-grill-repair',           name: 'Outdoor BBQ Grill Repair',     description: 'Burner, igniter, gas valve, rotisserie motor, and ignition module repair on premium built-in and freestanding grills.', priceTier: '$89' },
      { id: 'outdoor-kitchen-repair',     name: 'Outdoor Kitchen Repair',       description: 'Built-in grill, side burner, refrigerator, and warming drawer repair on integrated outdoor kitchen installations.', priceTier: '$89' },
      { id: 'outdoor-refrigerator-repair', name: 'Outdoor Refrigerator Repair', description: 'Compressor, condenser, fan motor, thermostat, and door gasket repair on outdoor-rated UL-listed refrigerators.', priceTier: '$89' },
      { id: 'patio-heater-repair',        name: 'Patio Heater Repair',          description: 'Pilot light, thermocouple, gas valve, igniter, and tilt safety repair on free-standing, mounted, and tabletop heaters.', priceTier: '$89' },
      { id: 'outdoor-pizza-oven-repair',  name: 'Outdoor Pizza Oven Repair',    description: 'Burner, igniter, gas line, thermostat, and stone replacement on gas, wood, and dual-fuel outdoor pizza ovens.', priceTier: '$89' },
      { id: 'fireplace-repair',           name: 'Fireplace Repair',             description: 'Pilot, thermocouple, gas valve, blower fan, and remote control repair on gas fireplaces and electric fireplaces; gas-only per SCAQMD.', priceTier: '$89' }
    ]
  },

  // ─────────────────────────────────────────────────
  // 6. HVAC — 5 services, quote-based (no priceSpecification)
  // ─────────────────────────────────────────────────
  {
    id: 'catalog-hvac',
    name: 'HVAC',
    services: [
      { id: 'central-ac-repair',             name: 'Central AC Repair',             description: 'Compressor, condenser, evaporator coil, refrigerant, and electrical repair on residential and light commercial systems. CSLB C-20 licensed, EPA 608 certified.', priceTier: 'quote' },
      { id: 'furnace-repair',                name: 'Furnace Repair',                description: 'Igniter, flame sensor, gas valve, blower motor, and heat exchanger inspection on gas and electric furnaces. CSLB C-20 licensed.', priceTier: 'quote' },
      { id: 'heat-pump-repair',              name: 'Heat Pump Repair',              description: 'Reversing valve, compressor, defrost board, expansion valve, and refrigerant repair on split-system and packaged heat pumps. CSLB C-20 + EPA 608.', priceTier: 'quote' },
      { id: 'ductless-mini-split-repair',    name: 'Ductless Mini-Split Repair',    description: 'Indoor unit, outdoor unit, refrigerant line, control board, and condensate pump repair on single and multi-zone ductless systems.', priceTier: 'quote' },
      { id: 'hvac-system-maintenance',       name: 'HVAC System Maintenance',       description: 'Coil cleaning, refrigerant check, capacitor test, blower service, and filter replacement on residential and light commercial HVAC.', priceTier: 'quote' }
    ]
  }
];

/** Total service count across all sub-catalogs — used in tests / docs. */
export const TOTAL_SERVICES = SUB_CATALOGS.reduce((sum, c) => sum + c.services.length, 0);

/** Map priceTier → numeric price string for PriceSpecification.price. Returns
 *  null for `quote` (HVAC, no priceSpecification emitted). */
export function priceTierToPrice(tier: PriceTier): string | null {
  if (tier === '$89') return '89.00';
  if (tier === '$120') return '120.00';
  return null;
}

/** Human-readable description for the priceSpecification — both tiers waived
 *  with repair (per docs/factual-accuracy.md §9). */
export const DIAGNOSTIC_DESCRIPTION = 'Diagnostic fee, waived with repair';
