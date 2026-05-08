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
    branchSlug: 'west-hollywood'
  },
  'beverly-hills': {
    tier: 'ULTRA-PREMIUM',
    neighborhoods: ['Beverly Park', 'Trousdale Estates', 'Beverly Hills Flats', 'Beverly Hills Post Office (90210 Holmby)', 'Coldwater Canyon'],
    climateNote: "Mediterranean. Beverly Park and Trousdale at higher elevation see less marine layer than the Flats; summer heat puts more thermal load on refrigerator condensers in Trousdale.",
    waterNote: "Beverly Hills operates its own water utility with relatively soft water (5-10 grains per gallon). Less scaling on dishwashers and washers than LADWP-served neighbors.",
    homeStock: "Pre-war estates, 1960s-80s rebuilds, contemporary trophy properties. Built-in Sub-Zero, Wolf, Miele, Gaggenau, La Cornue installations standard. Service expectations the highest in LA.",
    serviceContext: "Ultra-premium service expectations. Beverly Hills branch dispatches white-glove protocol on every visit — booties on flooring, drop cloths, no-trace work.",
    branchSlug: 'beverly-hills'
  },
  'los-angeles': {
    tier: 'GENERAL',
    neighborhoods: ['Hancock Park', 'Mid-City', 'Silver Lake', 'Los Feliz', 'Echo Park', 'Koreatown', 'Downtown LA', 'Hollywood', 'Brentwood'],
    climateNote: "Mediterranean climate across the basin. Hancock Park and west side see marine layer; eastside and downtown run hotter summer temperatures.",
    waterNote: "LADWP serves most of LA with moderately hard water (12-18 grains per gallon). Scaling on water-heated appliances year 3-5 without descaling PM.",
    homeStock: "Full spectrum: pre-war estates in Hancock Park, mid-century in Silver Lake and Los Feliz, condos and apartments downtown, single-family across the basin. Brand mix correlates to neighborhood.",
    serviceContext: "Same-day dispatch from Wilshire Blvd HQ. We service all 87 neighborhoods + cities across LA County.",
    branchSlug: 'los-angeles'
  },
  'pasadena': {
    tier: 'MID-TIER-NE',
    neighborhoods: ['Old Pasadena', 'South Lake', 'San Marino-adjacent', 'Bungalow Heaven', 'Madison Heights', 'Linda Vista'],
    climateNote: "Hotter and drier than westside LA. Foothill Mediterranean — temperatures run 8-12°F warmer than coastal LA in summer, stressing refrigerator condenser performance.",
    waterNote: "Foothill Municipal Water District plus Pasadena Water and Power; moderately hard water. Scaling on dishwashers and washers similar to LADWP areas.",
    homeStock: "Significant Craftsman + bungalow + Spanish revival inventory; 1910s-1940s construction common with original built-in cabinetry and updated appliances. Sub-Zero retrofits in older built-ins are routine.",
    serviceContext: "Pasadena branch covers Pasadena, Glendale, Alhambra, Arcadia, San Marino, Monrovia, San Gabriel, South Pasadena, Highland Park, Eagle Rock, La Cañada, Atwater Village, Silver Lake, Los Feliz, Temple City.",
    branchSlug: 'pasadena'
  },
  'thousand-oaks': {
    tier: 'MID-TIER-VENTURA',
    neighborhoods: ['Conejo Valley', 'North Ranch', 'Lynn Ranch', 'Sunset Hills', 'Wildwood'],
    climateNote: "Mediterranean climate with cooler winter mornings (40s°F) than basin LA. Less marine layer than coastal LA. Summer afternoons run warm but evenings cool quickly.",
    waterNote: "Calleguas Municipal Water District; moderately hard water similar to LADWP. Scaling patterns on dishwashers and washers comparable.",
    homeStock: "Suburban single-family with 1970s-2000s construction predominant. Mid-tier brands (KitchenAid, Whirlpool, GE, Maytag) common. Premium pockets in North Ranch and Lynn Ranch.",
    serviceContext: "Thousand Oaks branch covers Conejo Valley, Newbury Park, Westlake Village, Oak Park, Moorpark, Camarillo, Oxnard, Ventura, Simi Valley, Ojai.",
    branchSlug: 'thousand-oaks'
  },
  'irvine': {
    tier: 'PREMIUM-OC',
    neighborhoods: ['Quail Hill', 'Turtle Rock', 'Woodbridge', 'Northwood', 'Northpark', 'Cypress Village', 'Stonegate'],
    climateNote: "Coastal Orange County climate; ocean-moderated summers, mild winters, occasional Santa Ana wind events stress outdoor refrigeration.",
    waterNote: "Irvine Ranch Water District; moderately hard water. Hard-water scaling at year 3-5 standard pattern.",
    homeStock: "Newer-construction master-planned communities (1980s-present). Premium tier in newer estate sub-divisions; Samsung, LG, KitchenAid, Whirlpool common, Sub-Zero / Wolf in higher-end Turtle Rock and Quail Hill estates.",
    serviceContext: "Irvine branch covers Irvine, Newport Beach, Newport Coast, Costa Mesa, Tustin, Anaheim, Anaheim Hills, Yorba Linda, Fullerton, Mission Viejo, Laguna Beach, Laguna Niguel, Dana Point, San Clemente, Huntington Beach, Villa Park.",
    branchSlug: 'irvine'
  },
  'rancho-cucamonga': {
    tier: 'INLAND-EMPIRE',
    neighborhoods: ['Alta Loma', 'Etiwanda', 'Terra Vista', 'Victoria Gardens area', 'Haven and Foothill corridor'],
    climateNote: "Hot inland summers (95-105°F July-Sept) put significant thermal stress on refrigerator condensers. We see compressor failures earlier in IE than coastal LA — year 8-10 inland vs year 10-12 coastal on premium tier.",
    waterNote: "Cucamonga Valley Water District; harder water than LADWP. Scaling on dishwashers, washers, ice makers shows up faster — year 2-4 typical.",
    homeStock: "Suburban single-family, 1990s-2010s construction predominant. Mid-tier brands (Whirlpool, GE, Samsung, LG) standard. Premium tier in newer Etiwanda and north Alta Loma.",
    serviceContext: "Rancho Cucamonga branch covers Rancho Cucamonga, Ontario, Upland, Fontana, Chino Hills, Loma Linda, Redlands, San Bernardino.",
    branchSlug: 'rancho-cucamonga'
  },
  'temecula': {
    tier: 'INLAND-RIVERSIDE',
    neighborhoods: ['Wine Country / De Portola Wine Trail', 'Redhawk', 'Vail Ranch', 'Old Town Temecula area', 'Margarita Road corridor'],
    climateNote: "Hot inland summers (95-105°F July-Sept), mild winters. Wine Country slightly cooler at higher elevation than valley floor. Refrigerator condenser stress similar to Rancho Cucamonga.",
    waterNote: "Eastern Municipal Water District + Rancho California Water District; harder water than LADWP. Scaling on dishwashers and washers year 2-4 typical.",
    homeStock: "Suburban single-family, 1990s-2010s construction. Wine Country has custom estates with premium built-in appliances. Mid-tier brands standard in valley tracts.",
    serviceContext: "Riverside branch covers Riverside, Corona, Moreno Valley, Norco, Eastvale, Temecula, Murrieta, Menifee, Lake Elsinore, Hemet.",
    branchSlug: 'riverside'
  },
  // ====================================================================
  // Wave 24b — Top 5 non-hub priority cities (15,516 imp/mo GSC top + others)
  // ====================================================================
  'burbank': {
    tier: 'GENERAL',
    neighborhoods: ['Toluca Lake (Burbank-adjacent)', 'Magnolia Park', 'Rancho Equestrian District', 'Burbank Hills', 'Media District'],
    climateNote: "Mediterranean San Fernando Valley climate; runs 5-10°F warmer than westside LA in summer. Refrigerator condenser stress moderate. Less marine layer than coastal LA.",
    waterNote: "Burbank Water and Power; moderately hard water similar to LADWP (12-18 grains per gallon). Scaling on dishwashers and washers at year 3-5 without descaling PM.",
    homeStock: "Mix: 1920s-1940s craftsman + Spanish revival in older neighborhoods (Magnolia Park, Toluca Lake-adjacent), 1970s-2000s tract single-family in Burbank Hills, condos near Media District. Brand mix correlates to neighborhood.",
    serviceContext: "Dispatched from our Los Angeles branch (Wilshire HQ). Burbank's Hollywood-adjacent industry plus residential mix produces high service-call volume — 15,516 imp/mo GSC top priority for our SoCal coverage.",
    branchSlug: 'los-angeles'
  },
  'glendale': {
    tier: 'GENERAL',
    neighborhoods: ['Adams Hill', 'Rossmoyne', 'Verdugo Woodlands', 'Glendale Galleria area', 'Brand Park area', 'Northwest Glendale'],
    climateNote: "Foothill Mediterranean climate; warmer summers than westside LA, cool winter mornings, occasional Santa Ana wind events. Refrigerator condenser stress moderate.",
    waterNote: "Glendale Water and Power; moderately hard water (12-18 grains per gallon). Scaling on dishwashers, washers, ice makers year 3-5 typical without PM.",
    homeStock: "Significant Spanish revival + Mediterranean inventory in Rossmoyne and Adams Hill; mid-century in Northwest Glendale; 1970s-2000s tracts in Verdugo Woodlands. Strong Armenian-American demographic with premium-mid appliance preferences.",
    serviceContext: "Dispatched from our Pasadena branch. Glendale's $85K+ median household income drives premium-mid brand mix; we see Bosch, KitchenAid, GE Profile alongside Whirlpool standard tier.",
    branchSlug: 'pasadena'
  },
  'santa-monica': {
    tier: 'PREMIUM',
    neighborhoods: ['North of Montana', 'Sunset Park', 'Ocean Park', 'Wilshire Montana', 'Mid-City Santa Monica', 'Pier-area condos'],
    climateNote: "Coastal climate, persistent marine layer, salt-air exposure. Refrigerator condenser coil cleaning critical year 2-3 — coastal salt air corrodes coil fins faster than inland. Lower summer temperature than basin LA.",
    waterNote: "Santa Monica city water; moderately hard. Hard-water descaling on dishwashers and washers year 3-5 standard.",
    homeStock: "Pre-war Spanish + craftsman in North of Montana and Wilshire Montana; mid-century in Sunset Park; condos near pier and downtown. Premium tier (Sub-Zero, Wolf, Miele) prevalent in North of Montana estates.",
    serviceContext: "Dispatched from our Los Angeles branch. Santa Monica coastal salt-air angle: refrigerator coil cleaning is high-leverage maintenance for beach-area homes; we see condenser fan motor wear at year 6-8 vs year 8-10 inland.",
    branchSlug: 'los-angeles'
  },
  'long-beach': {
    tier: 'GENERAL',
    neighborhoods: ['Belmont Shore', 'Naples Island', 'Bixby Knolls', 'California Heights', 'Downtown Long Beach', 'East Side Long Beach'],
    climateNote: "Coastal South Bay climate, ocean-moderated summers, mild winters. Marine layer common spring + summer. Salt-air corrosion factor on refrigerator coils similar to Santa Monica but less pronounced inland of the harbor.",
    waterNote: "Long Beach Water Department; moderately hard water. Scaling patterns comparable to LADWP areas.",
    homeStock: "Spanish + craftsman in Belmont Shore, Bixby Knolls, California Heights; mid-century + 1970s tracts in East Side; condos in Downtown. Mid-tier brand mix predominant; premium pockets in Naples Island canal homes.",
    serviceContext: "Dispatched from our Los Angeles branch. Long Beach is our southernmost LA County coverage from the Wilshire HQ; same-day service across the city from Belmont Shore to Bixby Knolls.",
    branchSlug: 'los-angeles'
  },
  'anaheim': {
    tier: 'PREMIUM-OC',
    neighborhoods: ['Anaheim Hills', 'Platinum Triangle', 'Colony Historic District', 'West Anaheim', 'Disney area', 'East Anaheim'],
    climateNote: "Inland Orange County climate; warm dry summers (90-95°F July-Sept), mild winters. Refrigerator condenser stress moderate, less than IE inland but more than coastal OC.",
    waterNote: "Anaheim Public Utilities; moderately hard water. Scaling on dishwashers and washers year 3-5 standard.",
    homeStock: "Anaheim Hills has 1980s-2000s premium master-planned tracts (Sub-Zero, Wolf in custom estate pockets). Colony Historic District has 1920s-1940s Spanish + craftsman. Western and central Anaheim mix mid-century + 1960s-70s tracts. Mid-tier brand mix predominant.",
    serviceContext: "Dispatched from our Irvine branch. Anaheim's family-suburban demographic plus Disney-area service-economy households produce high service-call volume; we cover the full city from Anaheim Hills to West Anaheim same-day.",
    branchSlug: 'irvine'
  },
  // Wave 27b — final non-hub addition (200/200 master plan target)
  'hollywood': {
    tier: 'PREMIUM',
    neighborhoods: ['Hollywood Hills above-Sunset', 'Outpost Estates', 'Whitley Heights', 'Hollywood proper', 'Franklin Village', 'Beachwood Canyon', 'Larchmont Village (Hollywood-adjacent)'],
    climateNote: "Mediterranean basin climate. Hollywood Hills above-Sunset sits at elevation, less marine layer, warmer summer afternoons stress refrigerator condensers more than the basin floor. Hollywood proper runs basin-typical with marine layer May-June.",
    waterNote: "LADWP serves Hollywood with moderately hard water (12-18 grains per gallon). Hard-water descaling on dishwashers and washers year 3-5 standard; ice maker filter service annual.",
    homeStock: "Two-tier mix. Hollywood Hills above-Sunset is ultra-premium territory: Outpost Estates, Whitley Heights, Beachwood Canyon — Sub-Zero, Wolf, Miele, Thermador, La Cornue installations standard in custom kitchens, often integrated with Sub-Zero Designer columns and matched Wolf rangetops. Hollywood proper is mid-premium entertainment-industry mix: Bosch, KitchenAid, GE Profile, Samsung premium are common alongside the tier-mixed condo and apartment inventory.",
    serviceContext: "Dispatched from our West Hollywood branch (323) 870-4790. Hollywood is distinct from West Hollywood — different city boundaries, different incorporation, common confusion among new residents. We service both with the same WeHo branch infrastructure; same-day priority dispatch across the Hollywood Hills above-Sunset estate corridor and the Hollywood proper apartment-and-condo density.",
    branchSlug: 'west-hollywood'
  }
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
      { title: 'Water inlet valve / supply line.', detail: 'Most common ice and water dispenser failure. $245-385.' }
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
      { repair: 'Warranty', cost: '90 days parts and labor' }
    ],
    epaCertRequired: true,
    serviceTypeSchema: 'Residential Refrigerator Repair'
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
      { title: 'Lint screen / cabinet airflow.', detail: 'Annual deep cleaning service prevents fire risk and extends component life.' }
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
      { repair: 'Warranty', cost: '90 days parts and labor' }
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Dryer Repair'
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
      { title: 'Detergent dispenser / overdose.', detail: 'Excessive sudsing leak. $80-160 dispenser cleaning + customer education.' }
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
      { repair: 'Warranty', cost: '90 days parts and labor' }
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Washer Repair'
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
      { title: 'Hard-water scaling (LADWP / Pasadena / IE areas).', detail: '$120-220 descaling service. Scale buildup damages heating element and wash arm spray jets.' }
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
      { repair: 'Warranty', cost: '90 days parts and labor' }
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Dishwasher Repair'
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
      { title: 'Self-clean lock mechanism (year 7-10).', detail: '$180-280 replacement. Oven stuck locked after self-clean cycle, or won\'t enter self-clean.' }
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
      { repair: 'Warranty', cost: '90 days parts and labor' }
    ],
    epaCertRequired: false,
    serviceTypeSchema: 'Residential Oven Repair'
  }
};

// ====================================================================
// Wave 24a — Tier 2 services
// ====================================================================

SERVICE_DESCRIPTORS['stove-repair'] = {
  name: 'Stove Repair',
  shortName: 'stove',
  failurePatterns: [
    { title: 'Surface burner igniter (gas, year 5-8).', detail: 'Spark module fails or igniter electrode wears. Click-click-click but no flame, or one burner won\'t light while others fire fine. $220-380 replacement.' },
    { title: 'Burner head carbon clog (year 2-4 hard-cooking households).', detail: 'Spillover during cooking carbonizes burner port openings. $120-200 cleaning service often resolves without parts.' },
    { title: 'Surface element coil burnout (electric, year 7-10).', detail: 'Visible damage to coil; no heat from element when energized. $180-280 element + plug-and-socket replacement.' },
    { title: 'Glass-ceramic radiant element (smoothtop, year 8-12).', detail: 'Element under glass burns out; glass intact. $340-540 replacement under-glass element.' },
    { title: 'Oven thermostat drift (year 5-8).', detail: 'Stove range section integrated with oven below; oven temp drifts off setpoint, stove top still works. $260-440 thermostat replacement.' },
    { title: 'Bake igniter (gas range oven, year 5-8).', detail: '$260-440 replacement. Glows orange but does not fully ignite.' },
    { title: 'Control board (year 8-12).', detail: 'Touch controls unresponsive, error codes flashing. $385-680 replacement.' },
    { title: 'Self-clean lock mechanism (year 7-10).', detail: 'Stuck locked or won\'t enter self-clean. $180-280.' }
  ],
  brandPoolUltraPremium: ['Wolf', 'La Cornue', 'Viking', 'Thermador', 'Miele', 'Lacanche', 'BlueStar'],
  brandPoolPremium: ['Wolf', 'Thermador', 'Viking', 'KitchenAid', 'Bosch', 'BlueStar'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'LG', 'Samsung', 'Frigidaire', 'Maytag', 'Wolf'],
  brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Samsung', 'LG', 'Frigidaire', 'Maytag'],
  honestOpinion: "Most stove calls resolve at the surface burner igniter or oven thermostat — about 65 percent of LA stove service in our experience falls in the $220-440 single-component range. Premium tier (Wolf, Thermador, Viking, La Cornue) at year 12+ usually still justifies repair because chassis is built for 18-25 year service. Mid-tier free-standing ranges at year 12+ with multiple aging components typically lean replace.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Burner head deep cleaning service', cost: '$120 to $200' },
    { repair: 'Self-clean lock mechanism', cost: '$180 to $280' },
    { repair: 'Surface burner igniter (gas)', cost: '$220 to $380' },
    { repair: 'Surface coil element (electric)', cost: '$180 to $280' },
    { repair: 'Bake igniter (gas oven)', cost: '$260 to $440' },
    { repair: 'Thermostat replacement', cost: '$260 to $440' },
    { repair: 'Glass-ceramic radiant element (smoothtop)', cost: '$340 to $540' },
    { repair: 'Control board replacement', cost: '$385 to $680' },
    { repair: 'Annual calibration PM', cost: '$140 to $220' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: false,
  serviceTypeSchema: 'Residential Stove Repair'
};

SERVICE_DESCRIPTORS['cooktop-repair'] = {
  name: 'Cooktop Repair',
  shortName: 'cooktop',
  failurePatterns: [
    { title: 'Induction coil failure (induction cooktops, year 6-9).', detail: 'One zone won\'t heat or shows error code. Vessel-compatibility test first (induction requires ferromagnetic cookware). $480-820 coil replacement if real failure.' },
    { title: 'Surface burner igniter (gas cooktops, year 5-8).', detail: 'Click but no spark, or spark but no flame. $220-380 replacement.' },
    { title: 'Glass-ceramic surface crack (smoothtop, impact damage).', detail: 'Cracked surface is safety hazard, replacement required. $580-980 glass surface replacement.' },
    { title: 'Radiant element under glass (smoothtop, year 8-12).', detail: '$340-540 element replacement.' },
    { title: 'Touch control board (induction + smoothtop, year 7-10).', detail: 'Controls unresponsive, error codes. $480-820 replacement.' },
    { title: 'Power module (induction, year 8-11).', detail: '$580-880 replacement.' },
    { title: 'Burner cap / port carbon clog (gas).', detail: '$120-200 cleaning service often resolves without parts.' },
    { title: 'Cooktop downdraft motor (Jenn-Air, Wolf downdraft).', detail: '$485-820 motor replacement.' }
  ],
  brandPoolUltraPremium: ['Wolf', 'Miele', 'Thermador', 'Gaggenau', 'Viking', 'BlueStar'],
  brandPoolPremium: ['Wolf', 'Bosch', 'Thermador', 'KitchenAid', 'Jenn-Air', 'Miele'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'Bosch', 'Frigidaire', 'Samsung', 'LG', 'Wolf'],
  brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Samsung', 'LG', 'Frigidaire'],
  honestOpinion: "About 25 percent of induction cooktop \"won't heat\" calls resolve at vessel verification — operator using non-induction-compatible cookware. Five-second magnet test before quoting parts. For glass-ceramic surface cracks, replacement is the only option (safety hazard); $580-980 surface replacement on premium models often pencils as repair vs $2,400-4,800 full cooktop replacement on year 8+ units.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Burner cap / port cleaning', cost: '$120 to $200' },
    { repair: 'Surface burner igniter (gas)', cost: '$220 to $380' },
    { repair: 'Radiant element (smoothtop)', cost: '$340 to $540' },
    { repair: 'Induction coil replacement', cost: '$480 to $820' },
    { repair: 'Touch control board', cost: '$480 to $820' },
    { repair: 'Glass-ceramic surface replacement', cost: '$580 to $980' },
    { repair: 'Induction power module', cost: '$580 to $880' },
    { repair: 'Downdraft motor (Jenn-Air, Wolf)', cost: '$485 to $820' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: false,
  serviceTypeSchema: 'Residential Cooktop Repair'
};

SERVICE_DESCRIPTORS['range-hood-repair'] = {
  name: 'Range Hood Repair',
  shortName: 'range hood',
  failurePatterns: [
    { title: 'Fan motor burnout (year 7-10).', detail: 'Hood runs but no airflow, or motor humming without spinning. $385-625 motor replacement.' },
    { title: 'Light bulb / LED panel (year 4-8).', detail: 'Halogen or LED bulb burnout. $80-180 service.' },
    { title: 'Filter saturation / replacement.', detail: 'Mesh aluminum filters: cleaning service. Charcoal recirculating filters: replacement every 3-6 months. $40-120 PM service.' },
    { title: 'Speed control switch (year 6-9).', detail: 'Speed selector unresponsive or stuck. $180-280 replacement.' },
    { title: 'Make-up air integration issues (newer construction).', detail: 'Hood over 400 CFM requires make-up air per CA Title 24. Diagnostic + plumber/HVAC referral.' },
    { title: 'Ductless conversion (older homes, no exterior vent).', detail: 'Charcoal filter conversion service. $180-380.' },
    { title: 'Damper / backdraft mechanism (year 6-9).', detail: '$220-380. Backdraft prevents outdoor air intrusion.' },
    { title: 'Control board (year 8-11).', detail: '$385-580 replacement.' }
  ],
  brandPoolUltraPremium: ['Wolf', 'Vent-A-Hood', 'Miele', 'Best', 'Faber', 'Zephyr Power'],
  brandPoolPremium: ['Wolf', 'Vent-A-Hood', 'Best', 'Zephyr', 'Bosch', 'Faber'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'Broan', 'Frigidaire', 'LG', 'Samsung', 'Vent-A-Hood'],
  brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Broan', 'Samsung', 'LG'],
  honestOpinion: "Filter maintenance is the highest-ROI range-hood action. Charcoal filter replacement every 3-6 months on ductless installs, mesh filter cleaning monthly. Skipping filter PM strains the motor — we see motor burnout at year 4-6 on neglected units vs year 9-11 with regular filter service. The filter cost ($40-80) over the appliance lifetime is a fraction of motor replacement ($385-625).",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Filter cleaning / replacement (PM)', cost: '$40 to $120' },
    { repair: 'Light bulb / LED panel', cost: '$80 to $180' },
    { repair: 'Speed control switch', cost: '$180 to $280' },
    { repair: 'Ductless conversion (filter retrofit)', cost: '$180 to $380' },
    { repair: 'Damper / backdraft mechanism', cost: '$220 to $380' },
    { repair: 'Control board replacement', cost: '$385 to $580' },
    { repair: 'Fan motor replacement', cost: '$385 to $625' },
    { repair: 'Annual maintenance PM', cost: '$140 to $220' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: false,
  serviceTypeSchema: 'Residential Range Hood Repair'
};

SERVICE_DESCRIPTORS['microwave-repair'] = {
  name: 'Microwave Repair',
  shortName: 'microwave',
  failurePatterns: [
    { title: 'Magnetron tube failure (year 6-9).', detail: 'Microwave runs but doesn\'t heat food. Magnetron is the most expensive single component. $260-440 on countertop, $385-580 on built-in.' },
    { title: 'Door switch / interlock (year 5-8).', detail: 'Microwave won\'t start because control reads door open. Three switches in series typically; $120-220 replacement.' },
    { title: 'High-voltage capacitor / diode (year 7-10).', detail: 'Cyclic burnout from age. $180-340 service.' },
    { title: 'Turntable motor (year 7-10).', detail: 'Plate doesn\'t rotate, food cooks unevenly. $120-220 motor replacement.' },
    { title: 'Control board / touchpad (year 7-10).', detail: 'Buttons unresponsive, displays error or random behavior. $280-540 replacement.' },
    { title: 'Drawer microwave mechanism (Sharp, Wolf, year 6-9).', detail: 'Drawer won\'t open or close smoothly. $385-680 service.' },
    { title: 'Trim kit issues (built-in, year 5+).', detail: 'Loose or visibly damaged trim kit. $180-340 service.' },
    { title: 'Vent / exhaust fan (over-the-range models).', detail: 'Hood functionality fails. $220-380 service.' }
  ],
  brandPoolUltraPremium: ['Wolf', 'Sharp drawer', 'Miele', 'Thermador', 'Gaggenau'],
  brandPoolPremium: ['Wolf', 'Sharp drawer', 'KitchenAid', 'Bosch', 'Miele', 'Panasonic'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'LG', 'Samsung', 'Panasonic', 'Frigidaire'],
  brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Samsung', 'LG', 'Panasonic', 'Frigidaire'],
  honestOpinion: "Year 8+ countertop microwave with magnetron failure is usually replace, not repair — magnetron $260-440 on a $180-380 retail unit doesn\'t pencil. Built-in microwaves and drawer microwaves (Sharp, Wolf) at $1,200-2,800 retail justify repair through year 12+. Disposing of mid-life countertop magnetrons is e-waste; we tell you straight at quoting time.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Door switch / interlock', cost: '$120 to $220' },
    { repair: 'Turntable motor', cost: '$120 to $220' },
    { repair: 'High-voltage capacitor / diode', cost: '$180 to $340' },
    { repair: 'Trim kit service (built-in)', cost: '$180 to $340' },
    { repair: 'Vent / exhaust fan (OTR)', cost: '$220 to $380' },
    { repair: 'Magnetron (countertop)', cost: '$260 to $440' },
    { repair: 'Control board / touchpad', cost: '$280 to $540' },
    { repair: 'Magnetron (built-in)', cost: '$385 to $580' },
    { repair: 'Drawer microwave mechanism (Sharp, Wolf)', cost: '$385 to $680' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: false,
  serviceTypeSchema: 'Residential Microwave Repair'
};

SERVICE_DESCRIPTORS['wall-oven-repair'] = {
  name: 'Wall Oven Repair',
  shortName: 'wall oven',
  failurePatterns: [
    { title: 'Bake igniter (gas wall oven, year 5-8).', detail: '$280-440 replacement. Glows but does not fully ignite, or lights briefly then shuts off.' },
    { title: 'Bake element (electric wall oven, year 7-10).', detail: '$320-485 replacement. Visible damage or no heat when energized.' },
    { title: 'Thermostat drift (year 5-8).', detail: '$285-440 replacement. Calibrated reference thermometer test confirms drift.' },
    { title: 'Convection fan motor (year 6-9).', detail: '$385-625 replacement on convection-equipped models.' },
    { title: 'Door gasket compression (year 5-8).', detail: '$220-340 replacement. Heat loss makes oven run longer to maintain temp.' },
    { title: 'Control board (year 8-12).', detail: '$580-980. Premium tier electronic controls more expensive.' },
    { title: 'Self-clean lock mechanism (year 7-10).', detail: '$220-380 replacement. Common Wolf, Miele, Thermador failure pattern.' },
    { title: 'Door hinge sag (year 6-9).', detail: '$180-280 service. Heavy wall-oven door hinges wear faster than free-standing.' }
  ],
  brandPoolUltraPremium: ['Wolf', 'Miele', 'Thermador', 'Gaggenau', 'Sub-Zero (Cove)', 'La Cornue', 'Viking'],
  brandPoolPremium: ['Wolf', 'Miele', 'Thermador', 'KitchenAid', 'Bosch', 'Viking', 'Jenn-Air'],
  brandPoolGeneral: ['Whirlpool', 'KitchenAid', 'GE', 'Wolf', 'Bosch', 'LG', 'Samsung', 'Frigidaire'],
  brandPoolInland: ['Whirlpool', 'KitchenAid', 'GE', 'LG', 'Samsung', 'Frigidaire'],
  honestOpinion: "Wall ovens are premium-tier appliances; replacement requires cabinet modification + electrical/gas disconnect work that doubles the install cost. Repair-vs-replace math is different from free-standing: a $580-980 control board on a $4,500-8,000 Wolf or Thermador wall oven at year 10 is a sound investment vs a $6,000+ replacement-plus-installation cost. Most wall-oven service in LA is repair, not replace, through year 18-22 on premium tier.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Door hinge service', cost: '$180 to $280' },
    { repair: 'Door gasket replacement', cost: '$220 to $340' },
    { repair: 'Self-clean lock mechanism', cost: '$220 to $380' },
    { repair: 'Bake igniter (gas)', cost: '$280 to $440' },
    { repair: 'Thermostat replacement', cost: '$285 to $440' },
    { repair: 'Bake element (electric)', cost: '$320 to $485' },
    { repair: 'Convection fan motor', cost: '$385 to $625' },
    { repair: 'Control board (premium tier)', cost: '$580 to $980' },
    { repair: 'Annual calibration PM', cost: '$160 to $240' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: false,
  serviceTypeSchema: 'Residential Wall Oven Repair'
};

// ====================================================================
// Wave 25a — Tier 3 services
// ====================================================================

SERVICE_DESCRIPTORS['freezer-repair'] = {
  name: 'Freezer Repair',
  shortName: 'freezer',
  failurePatterns: [
    { title: 'Sealed-system refrigerant leak (year 6-10).', detail: 'EPA 608 Universal certified work required. Diagnose with electronic detector or UV dye, repair, evacuate to 500 microns, recharge to spec. $585-985.' },
    { title: 'Compressor failure (year 8-12 mid-tier, year 12-18 premium).', detail: '$580-1,200 standalone freezer; built-in Sub-Zero column $1,200-2,400.' },
    { title: 'Evaporator fan motor (year 6-10).', detail: '$280-440. Symptom: warm freezer, frost on coils, fan not spinning.' },
    { title: 'Defrost system (heater + termination thermostat + timer).', detail: 'Frost buildup, freezer temp climbs over time. $280-540.' },
    { title: 'Door gasket compression (year 5-8).', detail: '$180-280. Heat infiltration, longer compressor cycles.' },
    { title: 'Thermostat / control board (year 8-12).', detail: '$280-540 thermostat, $480-820 board on premium tier.' },
    { title: 'Door alarm / temp alarm sensor (year 7-10).', detail: '$180-280 sensor replacement on premium chest freezers and Sub-Zero columns.' },
    { title: 'Drain line frozen / clogged.', detail: '$120-220 service. Common on French door freezer drawers.' }
  ],
  brandPoolUltraPremium: ['Sub-Zero', 'Miele', 'Liebherr', 'Thermador', 'Viking'],
  brandPoolPremium: ['Sub-Zero', 'Miele', 'Liebherr', 'KitchenAid', 'Bosch', 'Frigidaire Professional'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'Frigidaire', 'LG', 'Samsung', 'Maytag', 'Sub-Zero', 'KitchenAid'],
  brandPoolInland: ['Whirlpool', 'GE', 'Frigidaire', 'Samsung', 'LG', 'Maytag'],
  honestOpinion: "Year 12+ standalone chest or upright freezer with compressor failure on mid-tier (Whirlpool, GE, Frigidaire) is usually replace, not repair. $880-1,400 compressor on a $400-800 chest freezer at end of design life doesn't pencil. Built-in Sub-Zero columns at year 12+ usually justify repair because chassis is built for 18-25 year service and the install cost makes replacement prohibitive.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Drain line cleaning service', cost: '$120 to $220' },
    { repair: 'Door gasket replacement', cost: '$180 to $280' },
    { repair: 'Door alarm / temp sensor', cost: '$180 to $280' },
    { repair: 'Defrost system service', cost: '$280 to $540' },
    { repair: 'Evaporator fan motor', cost: '$280 to $440' },
    { repair: 'Thermostat replacement', cost: '$280 to $540' },
    { repair: 'Sealed-system refrigerant work (EPA 608)', cost: '$585 to $985' },
    { repair: 'Compressor (mid-tier standalone)', cost: '$580 to $1,200' },
    { repair: 'Compressor (built-in Sub-Zero column)', cost: '$1,200 to $2,400' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: true,
  serviceTypeSchema: 'Residential Freezer Repair'
};

SERVICE_DESCRIPTORS['ice-maker-repair'] = {
  name: 'Ice Maker Repair',
  shortName: 'ice maker',
  failurePatterns: [
    { title: 'Water filter clogged (year 1-2 LA hard water).', detail: '$40-80 cartridge replacement. Single most common ice-maker complaint cause; LADWP hardness saturates filters faster than manufacturer schedules predict.' },
    { title: 'Mineral scale on evaporator / fill tube (LA hard water year 2-4).', detail: '$120-260 descaling service. Cloudy small cubes, no production, scale buildup visible on metal surfaces.' },
    { title: 'Water inlet valve failure (year 6-9).', detail: '$245-385. No water entering ice maker even with supply on; valve solenoid burned out or scale-clogged.' },
    { title: 'Ice maker module / motor (year 7-10).', detail: '$285-485. Module won\'t cycle, gear strip or motor burnout.' },
    { title: 'Standalone undercounter (Sub-Zero, Scotsman, U-Line) compressor.', detail: 'EPA 608 Universal work. $785-1,485 compressor replacement.' },
    { title: 'Door / drawer ice maker dispenser solenoid (year 7-10).', detail: '$180-280. Dispenser arm doesn\'t engage, ice doesn\'t drop.' },
    { title: 'Auger motor (Scotsman / standalone, year 8-11).', detail: '$385-580 replacement.' },
    { title: 'Ice jam clearing.', detail: '$120-180 service. Bin overfill, dispenser chute jam.' }
  ],
  brandPoolUltraPremium: ['Sub-Zero', 'Scotsman', 'U-Line', 'Marvel', 'Viking', 'Miele'],
  brandPoolPremium: ['Sub-Zero', 'U-Line', 'Marvel', 'Scotsman', 'KitchenAid', 'GE Monogram'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'LG', 'Samsung', 'Sub-Zero', 'Frigidaire', 'Maytag'],
  brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Samsung', 'LG', 'Frigidaire'],
  honestOpinion: "About 35 percent of LA ice maker calls resolve at filter replacement plus descaling — no parts work needed. LA hard water (300-400 mg/L TDS) saturates filters and deposits scale on evaporator surfaces faster than manufacturer maintenance schedules assume. We test filter and descale before quoting parts; the diagnostic visit ($89) catches root cause for many operators who thought they had a major component failure.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Water filter replacement', cost: '$40 to $80 + filter' },
    { repair: 'Ice jam clearing', cost: '$120 to $180' },
    { repair: 'Descaling service (LA hard water)', cost: '$120 to $260' },
    { repair: 'Door / drawer dispenser solenoid', cost: '$180 to $280' },
    { repair: 'Water inlet valve replacement', cost: '$245 to $385' },
    { repair: 'Ice maker module / motor', cost: '$285 to $485' },
    { repair: 'Auger motor (Scotsman / standalone)', cost: '$385 to $580' },
    { repair: 'Compressor (standalone undercounter, EPA 608)', cost: '$785 to $1,485' },
    { repair: 'Annual descaling PM', cost: '$120 to $220' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: true,
  serviceTypeSchema: 'Residential Ice Maker Repair'
};

SERVICE_DESCRIPTORS['wine-cooler-repair'] = {
  name: 'Wine Cooler Repair',
  shortName: 'wine cooler',
  failurePatterns: [
    { title: 'Sealed-system refrigerant leak (year 6-10).', detail: 'EPA 608 Universal work. Wine coolers use small refrigerant charges; precise diagnosis required. $585-985.' },
    { title: 'Compressor failure (year 8-12 mid-tier, year 12-18 premium).', detail: 'Sub-Zero / U-Line / Marvel built-in $1,200-2,400; standalone mid-tier $580-1,200.' },
    { title: 'Thermoelectric cooler (TEC, mid-tier units, year 5-8).', detail: '$385-580 module replacement. Some entry-level wine coolers use Peltier coolers instead of compressors.' },
    { title: 'Door gasket compression / dual-zone seal (year 5-8).', detail: '$180-340. Heat infiltration causes temp drift especially in dual-zone units.' },
    { title: 'Evaporator fan motor (year 6-10).', detail: '$280-440. Internal air circulation fails, temperature stratification develops.' },
    { title: 'Temp control board (year 8-12).', detail: '$485-820 on premium dual-zone (Sub-Zero, U-Line). Touch controls unresponsive.' },
    { title: 'Glass door / hinge wear (year 8-12).', detail: '$220-380. Heavy-duty hinges support tempered-glass doors; weight stresses hardware.' },
    { title: 'LED interior lighting (year 5-8).', detail: '$120-220 LED panel replacement on premium tier.' }
  ],
  brandPoolUltraPremium: ['Sub-Zero', 'U-Line', 'Marvel', 'Miele', 'Liebherr', 'Thermador', 'True Residential'],
  brandPoolPremium: ['Sub-Zero', 'U-Line', 'Marvel', 'KitchenAid', 'GE Monogram', 'Bosch'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'LG', 'Frigidaire', 'Sub-Zero', 'NewAir', 'EdgeStar'],
  brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Frigidaire', 'NewAir', 'EdgeStar'],
  honestOpinion: "Wine coolers split into two architectures with very different repair economics. Compressor-based (Sub-Zero, U-Line, Marvel, premium standalone) at year 8-12 with single-component failure usually justifies repair through year 15-18. Thermoelectric (TEC / Peltier) units in entry-tier coolers at year 5-7 with module failure often pencil as replace because the $385-580 TEC module on a $400-700 retail unit is borderline. We diagnose architecture first, then quote.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'LED interior lighting', cost: '$120 to $220' },
    { repair: 'Door gasket replacement', cost: '$180 to $340' },
    { repair: 'Glass door hinge service', cost: '$220 to $380' },
    { repair: 'Evaporator fan motor', cost: '$280 to $440' },
    { repair: 'Thermoelectric cooler module (TEC)', cost: '$385 to $580' },
    { repair: 'Temp control board (premium)', cost: '$485 to $820' },
    { repair: 'Sealed-system refrigerant work (EPA 608)', cost: '$585 to $985' },
    { repair: 'Compressor (standalone mid-tier)', cost: '$580 to $1,200' },
    { repair: 'Compressor (Sub-Zero / U-Line / Marvel built-in)', cost: '$1,200 to $2,400' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: true,
  serviceTypeSchema: 'Residential Wine Cooler Repair'
};

SERVICE_DESCRIPTORS['garbage-disposal-repair'] = {
  name: 'Garbage Disposal Repair',
  shortName: 'garbage disposal',
  failurePatterns: [
    { title: 'Jam / reset button trip.', detail: 'About 30 percent of disposal calls resolve at manual jam clearing + reset, no parts. $89-180 service.' },
    { title: 'Motor seizure (year 6-9).', detail: '$280-440 unit replacement (motor housing is sealed; replace as unit). $89 diagnostic credited.' },
    { title: 'Drain line clog (separate from disposal).', detail: 'Plumbing trap clog confused with disposal failure. $180-280 plumbing service or referral.' },
    { title: 'Sink flange leak (year 5-8).', detail: '$180-280 reseal. Plumber\'s putty or rubber gasket dries out over time, water leaks under sink.' },
    { title: 'Switch failure (year 7-10).', detail: '$120-220. Wall switch or air-switch sensor stops engaging disposal.' },
    { title: 'Continuous-feed vs batch-feed differences.', detail: 'Continuous-feed (most common) uses wall switch; batch-feed (some KitchenAid) uses lid sensor. Different failure patterns.' },
    { title: 'Discharge tube corrosion (year 8-12).', detail: '$120-220 replacement. Mounting flange seal compromised.' },
    { title: 'Hard-water scaling on internal grinding components.', detail: 'Year 4-6 LA hard water typical onset. Reduces grinding efficiency. Limited internal cleaning options; usually leads to unit replacement at year 8+.' }
  ],
  brandPoolUltraPremium: ['InSinkErator Evolution', 'Waste King Legend', 'Moen Host'],
  brandPoolPremium: ['InSinkErator Evolution', 'KitchenAid', 'Waste King', 'Moen'],
  brandPoolGeneral: ['InSinkErator', 'Waste King', 'KitchenAid', 'GE', 'Whirlpool', 'Moen'],
  brandPoolInland: ['InSinkErator', 'Waste King', 'KitchenAid', 'GE'],
  honestOpinion: "Garbage disposals are the cheapest residential appliance to replace ($180-380 retail mid-tier, $400-700 premium InSinkErator Evolution). Repair-vs-replace math is simple: any single-component failure costing more than $200-280 in repair on a year 7+ disposal usually leans replace. Where we add value: distinguishing disposal failures from plumbing failures (drain line clog, sink flange leak), which sometimes get billed as disposal calls but are different trade scope.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Manual jam clearing + reset (~30 percent of calls)', cost: '$89 to $180' },
    { repair: 'Switch replacement', cost: '$120 to $220' },
    { repair: 'Discharge tube replacement', cost: '$120 to $220' },
    { repair: 'Sink flange reseal', cost: '$180 to $280' },
    { repair: 'Drain line plumbing service', cost: '$180 to $280' },
    { repair: 'Disposal unit replacement (mid-tier)', cost: '$280 to $440' },
    { repair: 'Disposal unit replacement (premium InSinkErator Evolution)', cost: '$440 to $680' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: false,
  serviceTypeSchema: 'Residential Garbage Disposal Repair'
};

SERVICE_DESCRIPTORS['range-repair'] = {
  name: 'Range Repair',
  shortName: 'range',
  failurePatterns: [
    { title: 'Surface burner igniter (gas, year 5-8).', detail: '$220-380 spark module or igniter replacement. Click but no flame on one or more burners.' },
    { title: 'Burner head carbon clog (year 2-4 hard-cooking households).', detail: '$120-200 cleaning service often resolves without parts.' },
    { title: 'Surface element coil burnout (electric, year 7-10).', detail: '$180-280 element replacement.' },
    { title: 'Bake igniter (gas oven, year 5-8).', detail: '$260-440 replacement. Glows but does not fully ignite.' },
    { title: 'Bake element (electric oven, year 7-10).', detail: '$280-440 replacement.' },
    { title: 'Oven thermostat drift (year 5-8).', detail: '$260-440 replacement. Cooks 25-50°F off setpoint.' },
    { title: 'Convection fan motor (year 6-9).', detail: '$385-625 on convection-equipped models.' },
    { title: 'Dual-fuel range — distinct service.', detail: 'Combines gas range top + electric oven; diagnostic spans both gas and electric subsystems. $280-540 typical.' },
    { title: 'Self-clean lock mechanism (year 7-10).', detail: '$180-280 replacement.' },
    { title: 'Control board (year 8-12).', detail: '$485-820. Touch controls unresponsive, error codes flashing.' }
  ],
  brandPoolUltraPremium: ['Wolf', 'La Cornue', 'Bertazzoni', 'Viking', 'Thermador', 'Miele', 'BlueStar', 'Lacanche'],
  brandPoolPremium: ['Wolf', 'Thermador', 'Bertazzoni', 'Viking', 'KitchenAid', 'GE Cafe', 'BlueStar'],
  brandPoolGeneral: ['Whirlpool', 'GE', 'KitchenAid', 'LG', 'Samsung', 'Frigidaire', 'Maytag', 'Wolf'],
  brandPoolInland: ['Whirlpool', 'GE', 'KitchenAid', 'Samsung', 'LG', 'Frigidaire', 'Maytag'],
  honestOpinion: "Range and stove are often confused — a stove typically refers to the cooking surface only, while a range is the integrated cooking surface plus oven below. Premium tier (Wolf, Thermador, La Cornue, Bertazzoni, Viking) at year 12+ usually justifies repair because chassis is built for 18-25 year service and replacement requires kitchen modification. Mid-tier free-standing ranges at year 12+ with multiple aging components typically lean replace; a $1,200-2,400 retail GE Cafe with $800-1,200 cumulative repair at end of design life is borderline.",
  pricingTable: [
    { repair: 'Diagnostic ($89, applied toward repair)', cost: '$89' },
    { repair: 'Burner head cleaning service', cost: '$120 to $200' },
    { repair: 'Self-clean lock mechanism', cost: '$180 to $280' },
    { repair: 'Surface burner igniter (gas)', cost: '$220 to $380' },
    { repair: 'Surface coil element (electric)', cost: '$180 to $280' },
    { repair: 'Bake igniter (gas)', cost: '$260 to $440' },
    { repair: 'Bake element (electric)', cost: '$280 to $440' },
    { repair: 'Thermostat replacement', cost: '$260 to $440' },
    { repair: 'Convection fan motor', cost: '$385 to $625' },
    { repair: 'Control board replacement', cost: '$485 to $820' },
    { repair: 'Annual calibration PM', cost: '$140 to $220' },
    { repair: 'Warranty', cost: '90 days parts and labor' }
  ],
  epaCertRequired: false,
  serviceTypeSchema: 'Residential Range Repair'
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
