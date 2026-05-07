// src/data/homepage-services.ts
//
// Catalog of homepage Services-section items (Residential + Commercial).
// Replicated from public/preview-homepage.html SERVICE_CATALOG (lines 2891-2940).
//
// Kept separate from src/data/services.ts (which has a different schema —
// slug/tier/priceFrom/commonIssues — and is consumed by [city].astro and other
// service-page templates). This file is consumed only by the homepage Services
// component.
//
// `id` matches the preview's data-service value (used as the menu-item key in
// the homepage Services component). `urlSlug` is an optional override for cases
// where the id doesn't match the actual page slug under src/pages/services/ or
// src/pages/commercial/ — used by the build-time URL resolver in
// src/components/homepage/Services.astro.

export type HomepageServiceCategory = 'residential' | 'commercial';

export interface HomepageService {
  id: string;
  name: string;
  desc: string;
  photoCaption: string;
  category: HomepageServiceCategory;
  /** Override for URL resolution when id doesn't match the actual page slug. */
  urlSlug?: string;
}

export const RESIDENTIAL_SERVICES: HomepageService[] = [
  { id: 'bbq-grill',            name: 'BBQ Grill Repair',        desc: 'Same day service · Wolf, Hestan, Lynx, Fire Magic, DCS, Twin Eagles, Alfresco. Burner, igniter, gas valve, rotisserie motor.', photoCaption: 'Photo · Wolf Outdoor Grill', category: 'residential' },
  { id: 'built-in-fridge',      name: 'Built In Refrigerator',   desc: 'Same day service · Sub-Zero, Thermador, Miele, Viking. Compressor, coil cleaning, door gasket, built-in ice-maker.', photoCaption: 'Photo · Sub-Zero 648PRO Built-In', category: 'residential', urlSlug: 'built-in-refrigerator-repair' },
  { id: 'cooktop',              name: 'Cooktop Repair',          desc: 'Same day service · Wolf, Thermador, Miele, Bosch, KitchenAid. Gas + electric + induction. Burner, igniter, element, touch panel.', photoCaption: 'Photo · Wolf Induction Cooktop', category: 'residential' },
  { id: 'dishwasher',           name: 'Dishwasher Repair',       desc: 'Same day service · Bosch, Miele, KitchenAid, Thermador. Pump, spray arm, leak detection, control board.', photoCaption: 'Photo · Miele Built-In Dishwasher', category: 'residential' },
  { id: 'dryer',                name: 'Dryer Repair',            desc: 'Same day service · Gas + electric · Whirlpool, Samsung, LG, Maytag. Element, igniter, vent, drum belt, thermostat.', photoCaption: 'Photo · Whirlpool Gas Dryer', category: 'residential' },
  { id: 'dryer-vent',           name: 'Dryer Vent Repair',       desc: 'Same day service · Lint removal, vent reroute, booster fan, code compliance. Preventative cleaning for fire safety.', photoCaption: 'Photo · Dryer Vent Cleaning', category: 'residential' },
  { id: 'fireplace',            name: 'Fireplace Repair',        desc: 'Same day service · Gas insert, electric, pellet · Thermocouple, pilot assembly, control module, blower fan.', photoCaption: 'Photo · Gas Fireplace Insert', category: 'residential' },
  { id: 'freezer',              name: 'Freezer Repair',          desc: 'Same day service · Sub-Zero, Viking, Whirlpool, GE · Chest + upright. Compressor, defrost timer, evaporator coil.', photoCaption: 'Photo · Sub-Zero Freezer Drawer', category: 'residential' },
  { id: 'disposal',             name: 'Garbage Disposal',        desc: 'Same day service · Insinkerator, Waste King, Moen. Motor, jams, leaks, reset switch, mounting assembly.', photoCaption: 'Photo · Insinkerator Evolution Series', category: 'residential', urlSlug: 'garbage-disposal-repair' },
  { id: 'ice-maker',            name: 'Ice Maker Repair',        desc: 'Same day service · Sub-Zero, Scotsman, U-Line · Built-in + standalone. Auger, water valve, harvest motor.', photoCaption: 'Photo · Sub-Zero Built-In Ice Maker', category: 'residential' },
  { id: 'induction',            name: 'Induction Cooktop',       desc: 'Same day service · Wolf, Miele, Thermador, Bosch · Coil, inverter board, touch panel, cooling fan.', photoCaption: 'Photo · Miele Induction Cooktop', category: 'residential', urlSlug: 'induction-cooktop-repair' },
  { id: 'laundry',              name: 'Laundry Repair',          desc: 'Same day service · Residential washer + dryer pairs · LG, Samsung, Bosch, Miele. Full-stack diagnostics.', photoCaption: 'Photo · LG Laundry Pair', category: 'residential' },
  { id: 'microwave',            name: 'Microwave Repair',        desc: 'Same day service · OTR, built-in, drawer · Sharp, Panasonic, Wolf, Miele. Magnetron, HV cap, control panel.', photoCaption: 'Photo · Wolf Microwave Drawer', category: 'residential' },
  { id: 'oven',                 name: 'Oven Repair',             desc: 'Same day service · Free-standing, slide-in, pro-style · Wolf, Viking, Thermador. Element, sensor, control board.', photoCaption: 'Photo · Wolf Range Oven', category: 'residential' },
  { id: 'pizza-oven',           name: 'Pizza Oven Repair',       desc: 'Same day service · Residential outdoor · Ooni, Alfa, Chicago Brick Oven, Forno Bravo. Burner, dome, deck stone.', photoCaption: 'Photo · Alfa Wood-Fired Pizza Oven', category: 'residential' },
  { id: 'range-hood',           name: 'Range Hood Repair',       desc: 'Same day service · Wolf, Zephyr, Broan, Best, Dacor · Fan motor, lights, damper, charcoal filter.', photoCaption: 'Photo · Wolf Island Range Hood', category: 'residential' },
  { id: 'refrigerator',         name: 'Refrigerator Repair',     desc: 'Same day service · 85% fixed first visit · Sub-Zero, Viking, Thermador, Samsung, LG. Compressor, sensor, ice-maker.', photoCaption: 'Photo · Sub-Zero Built-In Refrigerator', category: 'residential' },
  { id: 'stackable',            name: 'Stackable Washer/Dryer',  desc: 'Same day service · LG, Samsung, GE · Compact stacked units. Bearing, pump, belt, vent, control board.', photoCaption: 'Photo · LG Stackable Washer/Dryer', category: 'residential', urlSlug: 'stackable-washer-dryer-repair' },
  { id: 'stove',                name: 'Stove Repair',            desc: 'Same day service · Gas + electric + dual-fuel · Wolf, Thermador, Viking, Bosch. Igniter, valve, oven sensor.', photoCaption: 'Photo · Wolf Dual-Fuel Range', category: 'residential' },
  { id: 'trash-compactor',      name: 'Trash Compactor',         desc: 'Same day service · Whirlpool, KitchenAid, Broan · Drive motor, ram assembly, belt, directional switch.', photoCaption: 'Photo · KitchenAid Trash Compactor', category: 'residential' },
  { id: 'wall-oven',            name: 'Wall Oven Repair',        desc: 'Same day service · Single, double, combi · Wolf, Miele, Thermador, Dacor. Element, sensor, control board, convection fan.', photoCaption: 'Photo · Wolf Double Wall Oven', category: 'residential' },
  { id: 'washer',               name: 'Washer Repair',           desc: 'Same day service · Front-load & top-load · LG, Samsung, Whirlpool, Maytag, Bosch. Bearing, pump, valve, control board.', photoCaption: 'Photo · LG Front-Load Washer', category: 'residential' },
  { id: 'wine-cellar-cooling',  name: 'Wine Cellar Cooling',     desc: 'Same day service · Ducted, ductless, self-contained · CellarPro, WhisperKOOL, Wine Guardian. Compressor, condenser, refrigerant.', photoCaption: 'Photo · CellarPro Split Cooling Unit', category: 'residential' },
  { id: 'wine-cellar',          name: 'Wine Cellar Repair',      desc: 'Same day service · Built-in cellars · Temperature + humidity control, condensation, glass-door seal, LED lighting.', photoCaption: 'Photo · Custom-Built Wine Cellar', category: 'residential' },
  { id: 'wine-cooler',          name: 'Wine Cooler Repair',      desc: 'Same day service · Sub-Zero, Miele, Liebherr, Thermador · Compressor, thermostat, evaporator fan, dual-zone controls.', photoCaption: 'Photo · Sub-Zero Dual-Zone Wine Cooler', category: 'residential' }
];

export const COMMERCIAL_SERVICES: HomepageService[] = [
  { id: 'bar-fridge',           name: 'Bar Refrigerator',        desc: 'Commercial certified · Perlick, True, Krowne, Beverage-Air · Back-bar, keg box, bottle cooler. Compressor, gasket, thermostat.', photoCaption: 'Photo · Perlick Back-Bar Refrigerator', category: 'commercial', urlSlug: 'bar-refrigerator-repair' },
  { id: 'comm-dishwasher',      name: 'Dishwasher Repair',       desc: 'Commercial certified · Hobart, Champion, Jackson, CMA. Pump, booster heater, chemical feed, rinse arm.', photoCaption: 'Photo · Hobart Conveyor Dishwasher', category: 'commercial' },
  { id: 'comm-dryer',           name: 'Dryer Repair',            desc: 'Commercial certified · Speed Queen, Huebsch, Dexter · On-premise + coin-op. Motor, belt, igniter, thermostat.', photoCaption: 'Photo · Speed Queen Commercial Dryer', category: 'commercial' },
  { id: 'exhaust-hood',         name: 'Exhaust Hood Repair',     desc: 'Commercial certified · Captive-Aire, Greenheck, Accurex · Fan motor, belt, make-up air, fire-suppression integration.', photoCaption: 'Photo · Captive-Aire Exhaust Hood', category: 'commercial' },
  { id: 'comm-freezer',         name: 'Freezer Repair',          desc: 'Commercial certified · True, Traulsen, Beverage-Air · Reach-in + undercounter. Compressor, evaporator, defrost cycle.', photoCaption: 'Photo · True Reach-In Freezer', category: 'commercial' },
  { id: 'fryer',                name: 'Fryer Repair',            desc: 'Commercial certified · Pitco, Frymaster, Henny Penny, Vulcan · Burner, thermostat, high-limit, filter system.', photoCaption: 'Photo · Frymaster Gas Fryer', category: 'commercial' },
  { id: 'ice-machine',          name: 'Ice Machine Repair',      desc: 'Commercial certified · Hoshizaki, Manitowoc, Scotsman, Follett · Water pump, float sensor, scale removal, condenser.', photoCaption: 'Photo · Hoshizaki Modular Ice Machine', category: 'commercial' },
  { id: 'comm-laundry',         name: 'Laundry Repair',          desc: 'Commercial certified · Speed Queen, Dexter, Wascomat, Continental Girbau · Coin-op + on-premise. Full-stack diagnostics.', photoCaption: 'Photo · Speed Queen Commercial Laundromat', category: 'commercial' },
  { id: 'comm-oven',            name: 'Oven Repair',             desc: 'Commercial certified · Convection, combi, deck · Vulcan, Blodgett, Rational, Moffat. Element, fan motor, control board.', photoCaption: 'Photo · Rational Combi-Oven', category: 'commercial' },
  { id: 'pizza-oven-comm',      name: 'Pizza Oven Repair',       desc: 'Commercial certified · Lincoln, Bakers Pride, Middleby Marshall, Blodgett · Conveyor belt, deck stones, gas valve.', photoCaption: 'Photo · Lincoln Impinger Conveyor Oven', category: 'commercial', urlSlug: 'pizza-oven-repair' },
  { id: 'refrigeration-hub',    name: 'Refrigeration Hub',       desc: 'Commercial certified · Split systems, compressor racks, glycol loops · Copeland, Tecumseh, Bitzer. Charge, EEV, TXV.', photoCaption: 'Photo · Commercial Condensing Unit Rack', category: 'commercial' },
  { id: 'comm-fridge',          name: 'Refrigerator Repair',     desc: 'Commercial certified · True, Beverage-Air, Continental, Traulsen · Coil, evaporator fan, gasket, thermostat.', photoCaption: 'Photo · True Reach-In Refrigerator', category: 'commercial', urlSlug: 'refrigerator-repair' },
  { id: 'showcase-fridge',      name: 'Showcase Refrigerator',   desc: 'Commercial certified · Federal, True, Structural Concepts · Deli, bakery, floral, meat display. LED, defrost, humidity control.', photoCaption: 'Photo · Federal Deli Showcase Case', category: 'commercial', urlSlug: 'showcase-refrigerator-repair' },
  { id: 'slushie',              name: 'Slushie Machine',         desc: 'Commercial certified · Taylor, Donper, GrindMaster, SPM · Auger, scraper blade, gas charge, drink-cycle board.', photoCaption: 'Photo · Taylor Slushie Machine', category: 'commercial', urlSlug: 'slushie-machine-repair' },
  { id: 'comm-stove',           name: 'Stove Repair',            desc: 'Commercial certified · Vulcan, Garland, Wolf commercial · 6-burner, 8-burner, salamander. Gas valve, pilot, oven safety.', photoCaption: 'Photo · Vulcan Commercial Range', category: 'commercial' },
  { id: 'walk-in-cooler',       name: 'Walk-In Cooler',          desc: 'Commercial certified · 24/7 emergency · True, Kolpak, Nor-Lake, Master-Bilt. Compressor, evaporator, defrost timer, door seal.', photoCaption: 'Photo · True Walk-In Cooler Box', category: 'commercial' },
  { id: 'walk-in-freezer',      name: 'Walk-In Freezer',         desc: 'Commercial certified · Refrigeration system, defrost cycle, controller, pressure switch · Kolpak, Master-Bilt, Nor-Lake.', photoCaption: 'Photo · Master-Bilt Walk-In Freezer', category: 'commercial' },
  { id: 'comm-washer',          name: 'Washer Repair',           desc: 'Commercial certified · Speed Queen, Dexter, Wascomat, Continental Girbau · Bearing, motor, drain valve, control board.', photoCaption: 'Photo · Dexter Commercial Washer', category: 'commercial' }
];
