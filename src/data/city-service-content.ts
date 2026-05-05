// src/data/city-service-content.ts
// Wave 23 — Per-city + per-service content blocks for parametric city × service pages.
//
// Content composition: page = CITY block (descriptors, neighborhoods, brand-tier, climate)
//                           + SERVICE block (failure patterns, technical depth, EPA requirement)
//                           + intersection (brand pool filtered by city tier × service)
//                           + city-specific FAQ
//
// The parametric template at src/pages/[city]/[service].astro consumes these structures.

export interface CityDescriptor {
  tier: 'ULTRA-PREMIUM' | 'PREMIUM' | 'GENERAL' | 'PREMIUM-OC' | 'MID-TIER-NE' | 'MID-TIER-VENTURA' | 'INLAND-EMPIRE' | 'INLAND-RIVERSIDE';
  neighborhoods: string[];
  climateNote: string;
  waterNote: string;
  homeStock: string;
  serviceContext: string;
  branchSlug: string; // primary branch slug
}

export interface ServiceDescriptor {
  name: string;
  shortName: string;
  failurePatterns: { title: string; detail: string }[];
  brandPoolUltraPremium: string[];
  brandPoolPremium: string[];
  brandPoolGeneral: string[];
  brandPoolInland: string[];
  honestOpinion: string;
  pricingTable: { repair: string; cost: string }[];
  epaCertRequired: boolean;
  serviceTypeSchema: string;
}

export const CITY_DESCRIPTORS: Record<string, CityDescriptor> = {
  'west-hollywood': {
    tier: 'PREMIUM',
    neighborhoods: ['Sunset Strip', 'Norma Triangle', 'West Hollywood West', 'Tri-West', 'Beverly Center area'],
    climateNote: "Mediterranean climate, marine layer reaches the Strip during May-Gray and June-Gloom; warm dry summers stress refrigeration sealed systems.",
    waterNote: "LADWP serves WeHo with moderate to hard water (12-18 grains per gallon TDS). Scaling on dishwashers and washers shows up at year 3-5 without descaling PM.",
    homeStock: "Mid-century apartments, condos, and 1920s-50s Spanish + craftsman bungalows. Premium built-in refrigerators (Sub-Zero, Miele) common in Sunset Strip estates and Norma Triangle.",
    serviceContext: "Premium service expectations. Same-day priority dispatch on the WeHo route from the West Hollywood branch.",
    branchSlug: 'west-hollywood',
  },
  'beverly-hills': {
    tier: 'ULTRA-PREMIUM',
    neighborhoods: ['Beverly Park', 'Trousdale Estates', 'Beverly Hills Flats', 'Beverly Hills Post Office (90210 Holmby)', 'Coldwater Canyon'],
    climateNote: "Mediterranean. Beverly Park and Trousdale at higher elevation see less marine layer than the Flats; summer heat puts more thermal load on refrigerator condensers in Trousdale.",
    waterNote: "Beverly Hills operates its own water utility with relatively soft water (5-10 grains per gallon). Less scaling on dishwashers and washers than LADWP-served neighbors.",
    homeStock: "Pre-war estates, 1960s-80s rebuilds, contemporary trophy properties. Built-in Sub-Zero, Wolf, Miele, Gaggenau, La Cornue installations standard. Service expectations the highest in LA.",
    serviceContext: "Ultra-premium service expectations. Beverly Hills branch dispatches white-glove protocol on every visit — booties on flooring, drop cloths, no-trace work.",
    branchSlug: 'beverly-hills',
  },
  'los-angeles': {
    tier: 'GENERAL',
    neighborhoods: ['Hancock Park', 'Mid-City', 'Silver Lake', 'Los Feliz', 'Echo Park', 'Koreatown', 'Downtown LA', 'Hollywood', 'Brentwood'],
    climateNote: "Mediterranean climate across the basin. Hancock Park and west side see marine layer; eastside and downtown run hotter summer temperatures.",
    waterNote: "LADWP serves most of LA with moderately hard water (12-18 grains per gallon). Scaling on water-heated appliances year 3-5 without descaling PM.",
    homeStock: "Full spectrum: pre-war estates in Hancock Park, mid-century in Silver Lake and Los Feliz, condos and apartments downtown, single-family across the basin. Brand mix correlates to neighborhood.",
    serviceContext: "Same-day dispatch from Wilshire Blvd HQ. We service all 87 neighborhoods + cities across LA County.",
    branchSlug: 'los-angeles',
  },
  'pasadena': {
    tier: 'MID-TIER-NE',
    neighborhoods: ['Old Pasadena', 'South Lake', 'San Marino-adjacent', 'Bungalow Heaven', 'Madison Heights', 'Linda Vista'],
    climateNote: "Hotter and drier than westside LA. Foothill Mediterranean — temperatures run 8-12°F warmer than coastal LA in summer, stressing refrigerator condenser performance.",
    waterNote: "Foothill Municipal Water District plus Pasadena Water and Power; moderately hard water. Scaling on dishwashers and washers similar to LADWP areas.",
    homeStock: "Significant Craftsman + bungalow + Spanish revival inventory; 1910s-1940s construction common with original built-in cabinetry and updated appliances. Sub-Zero retrofits in older built-ins are routine.",
    serviceContext: "Pasadena branch covers Pasadena, Glendale, Alhambra, Arcadia, San Marino, Monrovia, San Gabriel, South Pasadena, Highland Park, Eagle Rock, La Cañada, Atwater Village, Silver Lake, Los Feliz, Temple City.",
    branchSlug: 'pasadena',
  },
  'thousand-oaks': {
    tier: 'MID-TIER-VENTURA',
    neighborhoods: ['Conejo Valley', 'North Ranch', 'Lynn Ranch', 'Sunset Hills', 'Wildwood'],
    climateNote: "Mediterranean climate with cooler winter mornings (40s°F) than basin LA. Less marine layer than coastal LA. Summer afternoons run warm but evenings cool quickly.",
    waterNote: "Calleguas Municipal Water District; moderately hard water similar to LADWP. Scaling patterns on dishwashers and washers comparable.",
    homeStock: "Suburban single-family with 1970s-2000s construction predominant. Mid-tier brands (KitchenAid, Whirlpool, GE, Maytag) common. Premium pockets in North Ranch and Lynn Ranch.",
    serviceContext: "Thousand Oaks branch covers Conejo Valley, Newbury Park, Westlake Village, Oak Park, Moorpark, Camarillo, Oxnard, Ventura, Simi Valley, Ojai.",
    branchSlug: 'thousand-oaks',
  },
  'irvine': {
    tier: 'PREMIUM-OC',
    neighborhoods: ['Quail Hill', 'Turtle Rock', 'Woodbridge', 'Northwood', 'Northpark', 'Cypress Village', 'Stonegate'],
    climateNote: "Coastal Orange County climate; ocean-moderated summers, mild winters, occasional Santa Ana wind events stress outdoor refrigeration.",
    waterNote: "Irvine Ranch Water District; moderately hard water. Hard-water scaling at year 3-5 standard pattern.",
    homeStock: "Newer-construction master-planned communities (1980s-present). Premium tier in newer estate sub-divisions; Samsung, LG, KitchenAid, Whirlpool common, Sub-Zero / Wolf in higher-end Turtle Rock and Quail Hill estates.",
    serviceContext: "Irvine branch covers Irvine, Newport Beach, Newport Coast, Costa Mesa, Tustin, Anaheim, Anaheim Hills, Yorba Linda, Fullerton, Mission Viejo, Laguna Beach, Laguna Niguel, Dana Point, San Clemente, Huntington Beach, Villa Park.",
    branchSlug: 'irvine',
  },
  'rancho-cucamonga': {
    tier: 'INLAND-EMPIRE',
    neighborhoods: ['Alta Loma', 'Etiwanda', 'Terra Vista', 'Victoria Gardens area', 'Haven and Foothill corridor'],
    climateNote: "Hot inland summers (95-105°F July-Sept) put significant thermal stress on refrigerator condensers. We see compressor failures earlier in IE than coastal LA — year 8-10 inland vs year 10-12 coastal on premium tier.",
    waterNote: "Cucamonga Valley Water District; harder water than LADWP. Scaling on dishwashers, washers, ice makers shows up faster — year 2-4 typical.",
    homeStock: "Suburban single-family, 1990s-2010s construction predominant. Mid-tier brands (Whirlpool, GE, Samsung, LG) standard. Premium tier in newer Etiwanda and north Alta Loma.",
    serviceContext: "Rancho Cucamonga branch covers Rancho Cucamonga, Ontario, Upland, Fontana, Chino Hills, Loma Linda, Redlands, San Bernardino.",
    branchSlug: 'rancho-cucamonga',
  },
  'temecula': {
    tier: 'INLAND-RIVERSIDE',
    neighborhoods: ['Wine Country / De Portola Wine Trail', 'Redhawk', 'Vail Ranch', 'Old Town Temecula area', 'Margarita Road corridor'],
    climateNote: "Hot inland summers (95-105°F July-Sept), mild winters. Wine Country slightly cooler at higher elevation than valley floor. Refrigerator condenser stress similar to Rancho Cucamonga.",
    waterNote: "Eastern Municipal Water District + Rancho California Water District; harder water than LADWP. Scaling on dishwashers and washers year 2-4 typical.",
    homeStock: "Suburban single-family, 1990s-2010s construction. Wine Country has custom estates with premium built-in appliances. Mid-tier brands standard in valley tracts.",
    serviceContext: "Temecula branch covers Temecula, Murrieta, Menifee, Lake Elsinore, Hemet, Moreno Valley, Corona, Riverside.",
    branchSlug: 'temecula',
  },
};

export const SERVICE_DESCRIPTORS: Record<string, ServiceDescriptor> = {
  'refrigerator-repair': {
    name: 'Refrigerator Repair',
    shortName: 'refrigerator',
    failurePatterns: [
      { title: 'Sealed-system refrigerant leak (year 6-10).', detail: 'EPA 608 Universal certified work required. Diagnostic with electronic leak detector or UV dye, repair, evacuate to 500 microns, recharge to spec. $585-985.' },
      { title: 'Compressor failure (year 8-12 mid-tier, year 12-18 premium).', detail: '$580-1,200 replacement on standard top-freezer + side-by-side; built-in Sub-Zero / Wolf compressor work runs $1,200-2,400.' },
      { title: 'Defrost system (heater + termination thermostat + timer).', detail: 'Frost buildup on evaporator coils, freezer over-cools, fresh-food side warms. $280-540.' },
      { title: 'Condenser fan motor (year 6-10).', detail: '$340-540. Hot inland climates accelerate fan motor wear.' },
      { title: 'Evaporator fan motor (year 6-10).', detail: '$280-440. Symptom: fresh-food side won\'t cool properly even though freezer is fine.' },
      { title: 'Door gasket compression (year 5-8).', detail: '$180-280 gasket replacement. Heat infiltration causes longer compressor cycles.' },
      { title: 'Ice maker assembly (year 6-9).', detail: '$285-485. Dispenser solenoid year 7-10 ($180-280).' },
      { title: 'Water inlet valve / supply line.', detail: 'Most common ice and water dispenser failure. $245-385.' },
    ],
    brandPoolUltraPremium: ['Sub-Zero', 'Wolf', 'Miele', 'Thermador', 'Gaggenau', 'Viking'],
    brandPoolPremium: ['Sub-Zero', 'Miele', 'Thermador', 'KitchenAid', 'Bosch', 'Viking'],
    brandPoolGeneral: ['Whirlpool', 'GE', 'LG', 'Samsung', 'KitchenAid', 'Frigidaire', 'Bosch', 'Sub-Zero'],
    brandPoolInland: ['Whirlpool', 'GE', 'Samsung', 'LG', 'Frigidaire', 'KitchenAid', 'Maytag'],
    honestOpinion: "If your refrigerator is year 12+ and the compressor just failed on a mid-tier brand (Whirlpool, GE, Samsung, LG), the math usually says replace, not repair. Compressor + labor at $880-1,400 on a $1,400-2,200 unit at end of design life is borderline. Premium built-in (Sub-Zero, Wolf) at year 12+ usually still justifies repair because chassis is built for 18-25 year service.",
    pricingTable: [
      { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
      { repair: 'Door gasket replacement', cost: '$180 to $280' },
      { repair: 'Water inlet valve / supply line', cost: '$245 to $385' },
      { repair: 'Defrost system service', cost: '$280 to $540' },
      { repair: 'Evaporator / condenser fan motor', cost: '$280 to $540' },
      { repair: 'Ice maker assembly replacement', cost: '$285 to $485' },
      { repair: 'Sealed-system refrigerant work (EPA 608)', cost: '$585 to $985' },
      { repair: 'Compressor replacement (mid-tier)', cost: '$580 to $1,200' },
      { repair: 'Compressor replacement (built-in Sub-Zero / Wolf)', cost: '$1,200 to $2,400' },
      { repair: 'Warranty', cost: '90 days parts and labor' },
    ],
    epaCertRequired: true,
    serviceTypeSchema: 'Residential Refrigerator Repair',
  },
  'dryer-repair': {
    name: 'Dryer Repair',
    shortName: 'dryer',
    failurePatterns: [
      { title: 'Heating element burnout (electric, year 6-10).', detail: '$280-440 replacement. Symptom: dryer runs but produces no heat; clothes come out damp.' },
      { title: 'Igniter / flame sensor (gas, year 5-8).', detail: '$180-380 replacement. Igniter glows but does not light gas, or lights briefly then shuts off.' },
      { title: 'Drum bearing or roller wear (year 7-10).', detail: '$280-485 service. Squeaking or grinding noise indicates bearing failure approaching.' },
      { title: 'Vent restriction (lint accumulation).', detail: '$140-220 vent cleaning service. Restricted airflow causes long dry times and overheating shutoff.' },
      { title: 'Thermal fuse (one-shot safety).', detail: '$120-220 replacement. Trips when dryer overheats — usually caused by vent restriction.' },
      { title: 'Drive belt wear (year 7-10).', detail: '$180-280 replacement. Drum stops turning while motor still runs.' },
      { title: 'Door switch (year 6-9).', detail: '$120-220. Dryer won\'t start, control board reads door open even when closed.' },
      { title: 'Lint screen / cabinet airflow.', detail: 'Annual deep cleaning service prevents fire risk and extends component life.' },
    ],
    brandPoolUltraPremium: ['Miele', 'Asko', 'LG SteamFresh', 'Whirlpool', 'KitchenAid'],
    brandPoolPremium: ['LG', 'Samsung', 'Whirlpool', 'Maytag', 'KitchenAid', 'Bosch', 'Miele'],
    brandPoolGeneral: ['Whirlpool', 'Maytag', 'GE', 'LG', 'Samsung', 'Frigidaire', 'Kenmore'],
    brandPoolInland: ['Whirlpool', 'Maytag', 'GE', 'Samsung', 'LG', 'Frigidaire'],
    honestOpinion: "Annual vent cleaning is the single highest-leverage maintenance on dryers. Lint accumulation in the vent is the leading cause of premature thermal fuse trips, heating element burnout, and dryer fires. We charge $140-220 for vent cleaning service; you save money on parts replacement plus reduce fire risk. Some shops won't recommend this because it's lower margin than parts work.",
    pricingTable: [
      { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
      { repair: 'Vent cleaning service', cost: '$140 to $220' },
      { repair: 'Door switch replacement', cost: '$120 to $220' },
      { repair: 'Thermal fuse replacement', cost: '$120 to $220' },
      { repair: 'Igniter / flame sensor (gas)', cost: '$180 to $380' },
      { repair: 'Drive belt replacement', cost: '$180 to $280' },
      { repair: 'Heating element (electric)', cost: '$280 to $440' },
      { repair: 'Drum bearing / roller service', cost: '$280 to $485' },
      { repair: 'Annual maintenance PM', cost: '$140 to $220' },
      { repair: 'Warranty', cost: '90 days parts and labor' },
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Dryer Repair',
  },
  'washer-repair': {
    name: 'Washer Repair',
    shortName: 'washer',
    failurePatterns: [
      { title: 'Drain pump failure (year 5-8).', detail: '$280-440 replacement. Symptom: water won\'t drain at end of cycle, clothes come out soaked.' },
      { title: 'Shock absorber / suspension wear (front-load, year 6-9).', detail: '$340-580 service. Symptom: severe vibration or "walking" during spin cycle.' },
      { title: 'Door lock / boot seal (front-load, year 5-8).', detail: '$180-380 service. Door lock failure prevents start; boot seal failure leaks during fill or wash.' },
      { title: 'Drive motor or belt (year 7-10).', detail: '$280-580 service. Drum won\'t agitate or spin, or motor hums but does not turn.' },
      { title: 'Inlet valve / fill solenoid (year 6-9).', detail: '$245-385. Symptom: washer won\'t fill, or fills slowly, or fills with wrong-temperature water.' },
      { title: 'Control board (year 8-12).', detail: '$385-680 replacement. Error codes flashing, no response to controls, intermittent operation.' },
      { title: 'Drain hose blockage / kink.', detail: '$120-180 service. Can mimic drain pump failure symptoms; we test the cheap diagnosis first.' },
      { title: 'Detergent dispenser / overdose.', detail: 'Excessive sudsing leak. $80-160 dispenser cleaning + customer education.' },
    ],
    brandPoolUltraPremium: ['Miele', 'Asko', 'LG WashTower', 'Whirlpool', 'KitchenAid'],
    brandPoolPremium: ['LG', 'Samsung', 'Whirlpool', 'Maytag', 'Bosch', 'Miele', 'Speed Queen'],
    brandPoolGeneral: ['Whirlpool', 'Maytag', 'GE', 'LG', 'Samsung', 'Speed Queen', 'Frigidaire'],
    brandPoolInland: ['Whirlpool', 'Maytag', 'GE', 'Samsung', 'LG', 'Speed Queen', 'Frigidaire'],
    honestOpinion: "Front-load washer shock absorbers are the most-overlooked maintenance item. Year 6-9 typical wear; symptom is severe vibration during spin. Replacement runs $340-580. Skipping shock absorber service stresses the drum bearings and tub seal, leading to $880-1,400 multi-component repair instead of $400 single-component. Most operations replace shocks reactively after secondary damage; we identify shock wear at routine service before damage compounds.",
    pricingTable: [
      { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
      { repair: 'Drain hose service', cost: '$120 to $180' },
      { repair: 'Door lock / boot seal', cost: '$180 to $380' },
      { repair: 'Inlet valve / fill solenoid', cost: '$245 to $385' },
      { repair: 'Drain pump replacement', cost: '$280 to $440' },
      { repair: 'Drive motor or belt', cost: '$280 to $580' },
      { repair: 'Shock absorber service (front-load)', cost: '$340 to $580' },
      { repair: 'Control board replacement', cost: '$385 to $680' },
      { repair: 'Annual maintenance PM', cost: '$140 to $220' },
      { repair: 'Warranty', cost: '90 days parts and labor' },
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Washer Repair',
  },
  'dishwasher-repair': {
    name: 'Dishwasher Repair',
    shortName: 'dishwasher',
    failurePatterns: [
      { title: 'Drain pump failure (year 5-8).', detail: '$280-440 replacement. Standing water at bottom of tub at end of cycle.' },
      { title: 'Wash arm clog (hard water + food debris, year 2-4).', detail: '$120-220 deep cleaning + descaling service. Dishes come out dirty even though cycle ran.' },
      { title: 'Inlet valve (year 6-9).', detail: '$245-385. Dishwasher won\'t fill, or fills slowly, or leaks during fill.' },
      { title: 'Heating element (year 7-10).', detail: '$280-440. Dishes come out wet, no heat dry, or cycle runs cold and dishes don\'t sanitize.' },
      { title: 'Door spring / hinge (year 6-9).', detail: '$180-280. Door slams shut or won\'t stay open at any angle.' },
      { title: 'Detergent dispenser (year 7-10).', detail: '$180-280. Pod or powder won\'t release, dishes come out dirty.' },
      { title: 'Door latch / interlock (year 6-9).', detail: '$180-280. Dishwasher won\'t start because control reads door open.' },
      { title: 'Hard-water scaling (LADWP / Pasadena / IE areas).', detail: '$120-220 descaling service. Scale buildup damages heating element and wash arm spray jets.' },
    ],
    brandPoolUltraPremium: ['Miele', 'Bosch', 'Asko', 'KitchenAid', 'Thermador', 'Cove (Sub-Zero family)'],
    brandPoolPremium: ['Bosch', 'Miele', 'KitchenAid', 'Thermador', 'LG', 'Samsung'],
    brandPoolGeneral: ['Whirlpool', 'KitchenAid', 'Bosch', 'GE', 'LG', 'Samsung', 'Frigidaire', 'Maytag'],
    brandPoolInland: ['Whirlpool', 'KitchenAid', 'GE', 'Bosch', 'LG', 'Samsung', 'Frigidaire'],
    honestOpinion: "About 30 percent of dishwasher service calls in LA hard-water areas (San Fernando Valley, Pasadena, Inland Empire) resolve at descaling service ($120-220), not parts replacement. Some shops will quote a $385 inlet valve or $280 wash arm assembly on a unit that just needs descaling. We test descaling first because that's the actual issue 30 percent of the time. Annual descaling PM extends heating element life from year 7-10 to year 10-15 in hard-water areas.",
    pricingTable: [
      { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
      { repair: 'Descaling service (hard-water areas)', cost: '$120 to $220' },
      { repair: 'Door spring / hinge service', cost: '$180 to $280' },
      { repair: 'Door latch / detergent dispenser', cost: '$180 to $280' },
      { repair: 'Inlet valve replacement', cost: '$245 to $385' },
      { repair: 'Drain pump replacement', cost: '$280 to $440' },
      { repair: 'Heating element replacement', cost: '$280 to $440' },
      { repair: 'Annual maintenance PM (descaling + spray-arm clean)', cost: '$140 to $220' },
      { repair: 'Warranty', cost: '90 days parts and labor' },
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Dishwasher Repair',
  },
  'oven-repair': {
    name: 'Oven Repair',
    shortName: 'oven',
    failurePatterns: [
      { title: 'Bake igniter (gas, year 5-8).', detail: '$260-440 replacement. Glows orange but never fully ignites, or lights briefly then shuts off.' },
      { title: 'Bake element (electric, year 7-10).', detail: '$280-440 replacement. Visible damage to element coil, or no heat from element when energized.' },
      { title: 'Thermostat drift (year 5-8).', detail: '$260-440 replacement. Oven cooks 25-50°F off setpoint, baking results inconsistent.' },
      { title: 'Door gasket compression (year 5-8).', detail: '$180-280. Heat loss makes oven run longer to maintain temp; door warm to touch during operation.' },
      { title: 'Convection fan motor (year 6-9).', detail: '$385-625 replacement. Convection-equipped models lose airflow circulation.' },
      { title: 'Control board (year 8-12).', detail: '$485-820. Error codes, intermittent operation, mode buttons unresponsive.' },
      { title: 'Door hinge sag (year 6-9).', detail: '$120-220 service. Door doesn\'t close fully, heat loss, latch issues.' },
      { title: 'Self-clean lock mechanism (year 7-10).', detail: '$180-280 replacement. Oven stuck locked after self-clean cycle, or won\'t enter self-clean.' },
    ],
    brandPoolUltraPremium: ['Wolf', 'Miele', 'Sub-Zero (Cove dishwasher partner)', 'Thermador', 'Gaggenau', 'La Cornue', 'Viking'],
    brandPoolPremium: ['Wolf', 'Miele', 'Thermador', 'KitchenAid', 'Bosch', 'Viking'],
    brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'LG', 'Samsung', 'Frigidaire', 'Maytag', 'Wolf (premium pockets)'],
    brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Samsung', 'LG', 'Frigidaire', 'Maytag'],
    honestOpinion: "Most oven calls resolve at the igniter (gas) or bake element (electric) plus a thermostat check. About 65 percent of LA oven service in our experience falls in the $280-440 single-component range. Multi-component failure on year 12+ ovens is the borderline replace-vs-repair call; mid-tier ovens at year 12+ with multiple aging components ($800-1,200 cumulative repair on a $1,200-2,400 retail unit) usually lean replace. Premium tier (Wolf, Miele, Thermador) at year 12+ usually still justifies repair.",
    pricingTable: [
      { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
      { repair: 'Door hinge / gasket service', cost: '$120 to $280' },
      { repair: 'Self-clean lock mechanism', cost: '$180 to $280' },
      { repair: 'Bake igniter (gas)', cost: '$260 to $440' },
      { repair: 'Thermostat replacement', cost: '$260 to $440' },
      { repair: 'Bake element (electric)', cost: '$280 to $440' },
      { repair: 'Convection fan motor', cost: '$385 to $625' },
      { repair: 'Control board replacement', cost: '$485 to $820' },
      { repair: 'Annual calibration PM', cost: '$140 to $220' },
      { repair: 'Warranty', cost: '90 days parts and labor' },
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Oven Repair',
  },
};

// Helper to get the brand pool for a city × service combo based on city tier
export function getBrandPool(cityTier: CityDescriptor['tier'], service: ServiceDescriptor): string[] {
  switch (cityTier) {
    case 'ULTRA-PREMIUM':
      return service.brandPoolUltraPremium;
    case 'PREMIUM':
    case 'PREMIUM-OC':
      return service.brandPoolPremium;
    case 'INLAND-EMPIRE':
    case 'INLAND-RIVERSIDE':
      return service.brandPoolInland;
    case 'GENERAL':
    case 'MID-TIER-NE':
    case 'MID-TIER-VENTURA':
    default:
      return service.brandPoolGeneral;
  }
}
