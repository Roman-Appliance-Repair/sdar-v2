// src/data/recent-repairs.ts
//
// REAL completed jobs — the only "recent repairs" any city hub may show (city stage 2,
// 2026-10-08). Source: Fixar CRM, completed visits 12.07.2026 – 08.10.2026, read job by
// job (estimate lines, technician diagnostic notes, internal notes; Russian notes
// translated). Replaces 391 hand-written, undated "recent repair" cards that lived
// inside 99 city pages and could not be traced to any job.
//
// RULES
//   - Every entry is one Fixar job (`fixarJob`, internal reference — NEVER rendered).
//   - `area` is the job's REAL city, or its LA neighborhood. No street, no customer
//     name, no business name, no phone. A job is filed under the hub of its own city /
//     neighborhood only; a city with no job of its own shows its neighbours' jobs under
//     a "nearby" heading (src/lib/recent-repairs.ts), each labelled with its real place.
//   - `finding` is only what the record says the technician found. When the record
//     names only the work (an estimate line), `finding` is '' and nothing is inferred.
//   - outcome: 'repaired' — the repair was done; 'part-ordered' — diagnosed, part on
//     order; 'diagnosed' — diagnosed, no repair carried out (the record says why).
//   - Left out on purpose: jobs whose record has no detail, jobs where the customer
//     reported the same fault again after the repair, disputed jobs, recall visits.
//   - No prices.

export interface RecentRepair {
  /** Month of the visit, YYYY-MM. */
  date: string;
  /** Appliance type as a customer would say it. */
  appliance: string;
  brand?: string;
  model?: string;
  /** What was wrong, as reported. */
  symptom: string;
  /** What the technician found ('' when the record does not say). */
  finding: string;
  /** What was done. */
  work: string;
  outcome: 'repaired' | 'part-ordered' | 'diagnosed';
  /** Real city or LA neighborhood, as printed on the card. */
  area: string;
  commercial?: boolean;
  /** Fixar job number — internal reference only, never rendered. */
  fixarJob: string;
}

/** Keyed by the city hub slug the job belongs to. */
export const RECENT_REPAIRS: Record<string, RecentRepair[]> = {
  // ── Los Angeles County ─────────────────────────────────────────────
  'arcadia': [
    { date: '2026-09', appliance: 'Gas range', brand: 'Mainstreet', model: '541E60N', commercial: true, area: 'Arcadia', fixarJob: '101213',
      symptom: 'The pilot would not light, so the oven could not start.',
      finding: 'The gas safety system had a fault and the thermocouple needed replacing.',
      work: 'The thermocouple was replaced and the gas safety system repaired on a return visit, once the part arrived.',
      outcome: 'repaired' }
  ],
  'beverly-hills': [
    { date: '2026-10', appliance: 'Refrigerator', brand: 'GE', model: 'GFE28GYNCFS', area: 'Beverly Hills', fixarJob: '101319',
      symptom: 'No water was coming out of the dispenser.',
      finding: 'The technician traced it to the water supply system and the water filter.',
      work: 'Parts were ordered and an installation visit scheduled.',
      outcome: 'part-ordered' },
    { date: '2026-10', appliance: 'Dryer', brand: 'Kenmore', area: 'Beverly Hills', fixarJob: '101291',
      symptom: 'The dryer was not drying clothes properly.',
      finding: 'The technician found a fault in the heating system and recommended maintenance and a vent cleaning.',
      work: 'A repair estimate was given; the repair had not been approved at the time of writing.',
      outcome: 'diagnosed' },
    { date: '2026-08', appliance: 'Dishwasher', brand: 'Hobart', commercial: true, area: 'Beverly Hills', fixarJob: '100661',
      symptom: 'The dishwasher was pushing steam into the building instead of exhausting it outside.',
      finding: 'The technician found a condensate leak and an exhaust that was not set up correctly.',
      work: 'Diagnosed on the first visit, with maintenance recommended.',
      outcome: 'diagnosed' },
    { date: '2026-08', appliance: 'Refrigerator', brand: 'Sub-Zero', area: 'Beverly Hills', fixarJob: '100516',
      symptom: 'The Sub-Zero was not cooling.',
      finding: 'The cooling fan had failed.',
      work: 'The fan was replaced and the refrigerator was cooling again.',
      outcome: 'repaired' }
  ],
  'brentwood': [
    { date: '2026-09', appliance: 'Refrigerator', brand: 'Kenmore', model: '795.79993.510', area: 'Brentwood', fixarJob: '101103',
      symptom: 'The refrigerator was not cooling.',
      finding: 'The technician diagnosed a sealed-system problem.',
      work: 'Diagnostic visit only; no repair was carried out.',
      outcome: 'diagnosed' }
  ],
  'highland-park': [
    { date: '2026-08', appliance: 'Washer', brand: 'Maytag', model: 'LSG7800AAW', area: 'Highland Park', fixarJob: '100726',
      symptom: 'The washer was leaking from the bottom.',
      finding: 'The technician found the transmission had failed.',
      work: 'Diagnostic visit only; no repair was carried out.',
      outcome: 'diagnosed' }
  ],
  'hollywood': [
    { date: '2026-10', appliance: 'Refrigerator', brand: 'Viking', model: 'DDBB363RGG', area: 'Hollywood Hills', fixarJob: '101293',
      symptom: 'The freezer-temperature alarm was going off once a day.',
      finding: 'The technician found faults in the defrost system and the evaporator fan.',
      work: 'The evaporator fan and the defrost bimetal thermostat were replaced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Stackable washer/dryer', brand: 'GE', model: 'GUD24GSSM1WW', area: 'Hollywood Hills', fixarJob: '101099',
      symptom: 'The washer was not draining.',
      finding: 'The problem was in the drain system.',
      work: 'The drain system was repaired on site, the same visit.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Dryer', brand: 'Kenmore', area: 'Hollywood Hills', fixarJob: '100697',
      symptom: 'An older dryer started giving off smoke on the high heat setting.',
      finding: '',
      work: 'The technician performed a full dryer maintenance service.',
      outcome: 'repaired' }
  ],
  'long-beach': [
    { date: '2026-09', appliance: 'Washer', area: 'Long Beach', fixarJob: '101195',
      symptom: 'The washer was leaking water.',
      finding: '',
      work: 'The dispenser assembly was replaced.',
      outcome: 'repaired' }
  ],
  'los-angeles': [
    { date: '2026-10', appliance: 'Oven', brand: 'Hestan', commercial: true, area: 'Fairfax District, Los Angeles', fixarJob: '101302',
      symptom: 'The oven had trouble igniting.',
      finding: '',
      work: 'The technician serviced the ignition system: checked the wiring and contacts, cleaned the burner, spark igniter and flame sensor, and tested it.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Convection oven', brand: 'Blodgett', model: 'BDO-100-G-ES', commercial: true, area: 'Beverly Grove, Los Angeles', fixarJob: '101250',
      symptom: 'The oven would sometimes stop heating.',
      finding: '',
      work: 'The oven start system and the gas ignition system were repaired.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Refrigerator', brand: 'GE', model: 'TBX18SABORWW', area: 'Mid-City, Los Angeles', fixarJob: '101013',
      symptom: 'The refrigerator was leaking a lot of water.',
      finding: 'The technician diagnosed a problem in the sealed system.',
      work: 'Diagnostic visit only; no repair was carried out.',
      outcome: 'diagnosed' },
    { date: '2026-08', appliance: 'Ice machine', brand: 'Icetro', model: 'IM-0550-AC-22', commercial: true, area: 'Larchmont, Los Angeles', fixarJob: '100670',
      symptom: 'The ice machine had stopped making ice.',
      finding: 'The compressor was overheating behind a very dirty condenser coil, and the machine showed error 16, a water-level sensor fault.',
      work: 'The condenser coil was cleaned, the machine serviced and the water-level sensor replaced.',
      outcome: 'repaired' }
  ],
  'los-feliz': [
    { date: '2026-08', appliance: 'Refrigerator', area: 'Los Feliz', fixarJob: '100578',
      symptom: 'The refrigerator was leaking from the water line.',
      finding: 'The water supply line was damaged and leaking.',
      work: 'The damaged section of the line was repaired and a new connector installed.',
      outcome: 'repaired' }
  ],
  'malibu': [
    { date: '2026-09', appliance: 'Washer', brand: 'Samsung', model: 'WA50B5100AW', area: 'Malibu', fixarJob: '100974',
      symptom: 'A 2023 top-load washer was blinking a 9S8 error.',
      finding: 'The technician found a main control board problem.',
      work: 'A board replacement was quoted; no repair was carried out on this visit.',
      outcome: 'diagnosed' }
  ],
  'manhattan-beach': [
    { date: '2026-09', appliance: 'Salamander broiler', brand: 'Lang', commercial: true, area: 'Manhattan Beach', fixarJob: '101035',
      symptom: 'The salamander broiler needed repair.',
      finding: 'The quartz heating system had failed and its high-temperature connections were damaged.',
      work: 'All three quartz elements and the damaged connections were replaced, the wiring and contactors checked, and the heat tested.',
      outcome: 'repaired' }
  ],
  'norwalk': [
    { date: '2026-09', appliance: 'Gas oven', brand: 'Frigidaire', model: 'FGB24T3ABA', area: 'Norwalk', fixarJob: '101003',
      symptom: 'The oven would not turn on.',
      finding: '',
      work: 'The ignition system was repaired on site, the same visit.',
      outcome: 'repaired' }
  ],
  'pico-rivera': [
    { date: '2026-09', appliance: 'Refrigerator', brand: 'Samsung', model: 'RF28T5001SR', area: 'Pico Rivera', fixarJob: '100894',
      symptom: 'A four-year-old French-door refrigerator was not getting cold, top or bottom.',
      finding: 'The technician found the compressor was not working.',
      work: 'A compressor replacement was quoted; the customer took time to decide, so no repair was carried out on this visit.',
      outcome: 'diagnosed' }
  ],
  'santa-clarita': [
    { date: '2026-10', appliance: 'Refrigerator', area: 'Valencia, Santa Clarita', fixarJob: '101322',
      symptom: 'The refrigerator was cold but not cooling the way it should.',
      finding: '',
      work: 'The technician defrosted the evaporator coil, replaced the evaporator fan and cleaned the drain.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Washer', brand: 'Whirlpool', model: 'WTW4800XQ1', area: 'Canyon Country, Santa Clarita', fixarJob: '100645',
      symptom: 'Water gushed out from the bottom while the washer was filling.',
      finding: '',
      work: 'The spring was repaired and the drum reinstalled.',
      outcome: 'repaired' }
  ],
  'santa-monica': [
    { date: '2026-09', appliance: 'Patio heater', area: 'Santa Monica', fixarJob: '101226',
      symptom: 'Two ceiling-recessed infrared patio heaters on a balcony needed new heating elements.',
      finding: '',
      work: 'Both heaters were serviced with the customer-supplied replacement parts.',
      outcome: 'repaired' }
  ],
  'silver-lake': [
    { date: '2026-08', appliance: 'Refrigerator', brand: 'Electrolux', model: 'FFHT1817LS8', area: 'Silver Lake', fixarJob: '100833',
      symptom: 'The refrigerator was leaking water.',
      finding: 'The technician found a defrost system fault and a clogged drain line.',
      work: 'The defrost timer was replaced and the drain line cleaned.',
      outcome: 'repaired' }
  ],
  'south-pasadena': [
    { date: '2026-08', appliance: 'Ice maker', brand: 'KitchenAid', area: 'South Pasadena', fixarJob: '100688',
      symptom: 'A two-year-old undercounter ice maker had stopped making ice.',
      finding: 'The technician found the ice maker transformer and the circulation pump both needed replacing.',
      work: 'Diagnostic visit only; no repair was carried out.',
      outcome: 'diagnosed' }
  ],
  'west-hollywood': [
    { date: '2026-09', appliance: 'Refrigerator', commercial: true, area: 'West Hollywood', fixarJob: '100870',
      symptom: 'A café refrigerator was not working correctly.',
      finding: 'The condenser fan was bad and the condenser coil needed repair.',
      work: 'The condenser fan and coil were repaired.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer', brand: 'Kenmore', area: 'West Hollywood', fixarJob: '100842',
      symptom: 'The washer door was not sealing properly.',
      finding: 'The door lock assembly was defective.',
      work: 'The door lock assembly was replaced when the part arrived the next day; the technician came back for a leaking door seal.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Refrigerator', brand: 'GE', model: 'PYE23KSDDSS', area: 'West Hollywood', fixarJob: '100840',
      symptom: 'The refrigerator section was reading far too warm.',
      finding: 'On the visit the technician measured 40°F in the fridge and 2°F in the freezer — both normal — and found no errors.',
      work: 'A condenser coil and compressor compartment cleaning was recommended.',
      outcome: 'diagnosed' }
  ],
  'westwood': [
    { date: '2026-10', appliance: 'Dishwasher', commercial: true, area: 'Westwood', fixarJob: '101366',
      symptom: 'The dishwasher needed repair.',
      finding: 'The technician found it needed a maintenance service.',
      work: 'The dishwasher was serviced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer', brand: 'Wascomat', model: 'W3250N16', commercial: true, area: 'Westwood', fixarJob: '100836',
      symptom: 'The washer was not draining.',
      finding: '',
      work: 'The door lock was replaced with a special-order OEM part on a second visit.',
      outcome: 'repaired' }
  ],
  'whittier': [
    { date: '2026-10', appliance: 'Refrigerator', brand: 'Whirlpool', model: 'WSF26C3EXW01', area: 'Whittier', fixarJob: '101339',
      symptom: 'A hissing noise, and water coming out behind the refrigerator.',
      finding: 'The water supply hose was cracked.',
      work: 'The hose was repaired with a 1/4-inch fitting.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer', brand: 'Samsung', model: 'WF45R6300AW', area: 'Whittier', fixarJob: '101191',
      symptom: 'The washer was not draining.',
      finding: '',
      work: 'The drain pump was replaced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Refrigerator', brand: 'Frigidaire', model: 'FRSS26L3AFD', area: 'Whittier', fixarJob: '101097',
      symptom: 'The freezer fan was not running.',
      finding: 'The evaporator fan motor had failed.',
      work: 'The motor was ordered and replaced on a second visit.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Range', brand: 'Samsung', model: 'NX60A6511SS', area: 'Whittier', fixarJob: '101040',
      symptom: 'The oven never turned on.',
      finding: '',
      work: 'The ignition system was repaired on site, the same visit.',
      outcome: 'repaired' }
  ],

  // ── Orange County ──────────────────────────────────────────────────
  'anaheim': [
    { date: '2026-09', appliance: 'Refrigerator', brand: 'Haier', area: 'Anaheim', fixarJob: '101065',
      symptom: 'Neither the freezer nor the fridge section was cooling.',
      finding: '',
      work: 'The technician serviced the refrigerator and cleaned the condenser.',
      outcome: 'repaired' }
  ],
  'costa-mesa': [
    { date: '2026-09', appliance: 'Mixer', brand: 'Hobart', model: 'A200', commercial: true, area: 'Costa Mesa', fixarJob: '101179',
      symptom: 'The mixer was noisy, especially on start-up.',
      finding: 'The technician found the gear-shifting system needed to be rebuilt.',
      work: 'Diagnostic visit only; a rebuild was quoted.',
      outcome: 'diagnosed' }
  ],
  'cypress': [
    { date: '2026-10', appliance: 'Dryer', brand: 'Whirlpool', model: 'LER4634EQ2', area: 'Cypress', fixarJob: '101290',
      symptom: 'The dryer worked but rattled.',
      finding: 'The technician found a worn roller kit, tension pulley and drum sliders.',
      work: 'A repair estimate for the worn parts was prepared.',
      outcome: 'diagnosed' },
    { date: '2026-09', appliance: 'Trash compactor', brand: 'GE Monogram', model: 'ZCG3500DSS', area: 'Cypress', fixarJob: '101193',
      symptom: 'The compactor\'s switch had stopped working.',
      finding: 'The key switch had failed, and the original part is discontinued.',
      work: 'The technician identified a compatible switch from another model; no repair was carried out on this visit.',
      outcome: 'diagnosed' },
    { date: '2026-09', appliance: 'Ice machine', brand: 'Manitowoc', model: 'UD0190A-161B', commercial: true, area: 'Cypress', fixarJob: '101048',
      symptom: 'One of two ice machines on a work site had stopped producing ice.',
      finding: 'The water-level sensor was broken and the machine was full of dirt and debris.',
      work: 'The water-level sensing system was repaired and the machine fully cleaned.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Ice machine', brand: 'Vevor', model: 'T38-1318.V1S', commercial: true, area: 'Cypress', fixarJob: '101036',
      symptom: 'The second machine on the same site was not producing ice either.',
      finding: 'Its circulation pump was broken, with the same heavy dirt build-up.',
      work: 'The circulation pump was replaced and the machine cleaned and serviced.',
      outcome: 'repaired' }
  ],
  'fullerton': [
    { date: '2026-09', appliance: 'Wine cellar cooling unit', brand: 'WhisperKool', area: 'Fullerton', fixarJob: '101057',
      symptom: 'Water was leaking from the bottom of the unit.',
      finding: '',
      work: 'The technician performed a maintenance service on the cooling unit.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Walk-in freezer', commercial: true, area: 'Fullerton', fixarJob: '100821',
      symptom: 'The freezer had stopped working — the condensing unit would not start and hold temperature.',
      finding: 'The compressor itself was fine; its starting circuit was defective, with deteriorated wiring and connections.',
      work: 'The starting components were replaced with OEM parts, the circuit rewired, and pressures and pull-down verified.',
      outcome: 'repaired' }
  ],
  'garden-grove': [
    { date: '2026-08', appliance: 'Freezer', brand: 'Traulsen', model: 'G31310', commercial: true, area: 'Garden Grove', fixarJob: '100772',
      symptom: 'The freezer was not getting cold enough.',
      finding: 'The defrost system was broken.',
      work: 'The defrost timer assembly was replaced.',
      outcome: 'repaired' }
  ],
  'irvine': [
    { date: '2026-08', appliance: 'Washer', brand: 'Kenmore', area: 'Irvine', fixarJob: '100601',
      symptom: 'The washer was not draining.',
      finding: 'The drain pump had failed.',
      work: 'The drain pump was replaced.',
      outcome: 'repaired' }
  ],
  'laguna-niguel': [
    { date: '2026-09', appliance: 'Reach-in refrigerator', brand: 'Everest', model: 'ESR3', commercial: true, area: 'Laguna Niguel', fixarJob: '100903',
      symptom: 'One door section had frozen over while the other worked normally.',
      finding: 'The defrost system had failed and two evaporator fan blades were broken.',
      work: 'The defrost thermostat assembly and both fan blades were replaced.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Ice machine', brand: 'Manitowoc', commercial: true, area: 'Laguna Niguel', fixarJob: '100561',
      symptom: 'The ice machine was not making ice.',
      finding: 'The harvest sensor had failed.',
      work: 'The harvest sensor was replaced and the machine serviced.',
      outcome: 'repaired' }
  ],
  'newport-beach': [
    { date: '2026-08', appliance: 'Convection oven', brand: 'Blodgett', commercial: true, area: 'Newport Beach', fixarJob: '100608',
      symptom: 'The gas convection oven was not working.',
      finding: 'The technician found a defective blower motor.',
      work: 'An OEM blower motor assembly and capacitor were quoted.',
      outcome: 'diagnosed' }
  ],
  'santa-ana': [
    { date: '2026-10', appliance: 'Refrigerator', brand: 'Frigidaire', area: 'Santa Ana', fixarJob: '101358',
      symptom: 'The refrigerator was leaking.',
      finding: '',
      work: 'The water valve was replaced and the unit serviced; the leak stopped.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Dryer', brand: 'Kenmore', model: '110.73932102', area: 'Santa Ana', fixarJob: '101147',
      symptom: 'The dryer was not heating and not blowing air.',
      finding: '',
      work: 'The belt was replaced, the safety system repaired and the dryer deep-cleaned.',
      outcome: 'repaired' }
  ],

  // ── San Bernardino County ──────────────────────────────────────────
  'fontana': [
    { date: '2026-08', appliance: 'Refrigerator', brand: 'LG', area: 'Fontana', fixarJob: '100784',
      symptom: 'The refrigerator was not cooling.',
      finding: '',
      work: 'The condenser fan motor was replaced.',
      outcome: 'repaired' }
  ],
  'ontario': [
    { date: '2026-10', appliance: 'Dryer and washer', brand: 'Whirlpool', model: 'WGD8000DW1', area: 'Ontario', fixarJob: '101383',
      symptom: 'The dryer was squeaking and the washer kept going out of balance.',
      finding: '',
      work: 'The dryer got a new idler pulley arm assembly and a maintenance service; the washer suspension rods were restored.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Dryer', brand: 'Whirlpool', model: 'WGD92HEFC0', area: 'Ontario', fixarJob: '101051',
      symptom: 'The drum was not spinning.',
      finding: '',
      work: 'The idler pulley arm, drum belt and motor pulley were replaced and the dryer serviced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Planetary mixer', brand: 'Vollrath', model: 'MIX1010', commercial: true, area: 'Ontario', fixarJob: '100899',
      symptom: 'The mixer ran but was not mixing.',
      finding: 'The planetary shaft was worn and the gearcase lubricant had degraded and carbonized.',
      work: 'The planetary shaft assembly was replaced and the gearcase cleaned and repacked with food-grade grease.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer', brand: 'GE', model: 'HTW240ASK6WS', area: 'Ontario', fixarJob: '100999',
      symptom: 'The top-loader would not fill with water, even after the owner had replaced the inlet valve and lid-lock sensor.',
      finding: 'The technician found the shifter was broken.',
      work: 'A shifter replacement was quoted; no repair was carried out on this visit.',
      outcome: 'diagnosed' }
  ],
  'rancho-cucamonga': [
    { date: '2026-09', appliance: 'Dryer', brand: 'Maytag', model: 'MEDB755DW3', area: 'Rancho Cucamonga', fixarJob: '101196',
      symptom: 'The dryer had stopped working; the owner suspected the drum support wheels.',
      finding: '',
      work: 'A drum roller and pulley were replaced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Gas griddle', brand: 'Jade', commercial: true, area: 'Rancho Cucamonga', fixarJob: '101219',
      symptom: 'Only the center pilot on a 36-inch griddle would stay lit.',
      finding: 'Two of the three pilot burners had failed, the gas regulators were out of adjustment and there was heavy grease and carbon build-up.',
      work: 'Repair options were quoted.',
      outcome: 'diagnosed' },
    { date: '2026-08', appliance: 'Washer', brand: 'Samsung', model: 'WF220ANW/XAA', area: 'Rancho Cucamonga', fixarJob: '100522',
      symptom: 'The washer stopped draining mid-load, even after the owners drained and cleaned it.',
      finding: 'The pump had failed.',
      work: 'The pump was replaced.',
      outcome: 'repaired' }
  ],
  'redlands': [
    { date: '2026-09', appliance: 'Ice maker', brand: 'Mecnosud', model: 'IM44AD', commercial: true, area: 'Redlands', fixarJob: '101144',
      symptom: 'The ice maker had stopped working.',
      finding: 'A wire harness was broken.',
      work: 'The harness was repaired — no parts needed.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Microwave', brand: 'KitchenAid', area: 'Redlands', fixarJob: '100971',
      symptom: 'The microwave door would not open.',
      finding: '',
      work: 'The door latch bracket was replaced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Mixer', brand: 'Avantco', commercial: true, area: 'Redlands', fixarJob: '101111',
      symptom: 'One of two commercial mixers had stopped working.',
      finding: 'The technician found the inverter board was broken.',
      work: 'Diagnostic visit only; no repair was carried out.',
      outcome: 'diagnosed' },
    { date: '2026-09', appliance: 'Refrigerator', brand: 'Samsung', model: 'RF27T5241SR', area: 'Redlands', fixarJob: '101118',
      symptom: 'The refrigerator was not cooling.',
      finding: 'The technician found the compressor was locked.',
      work: 'Diagnostic visit only; no repair was carried out.',
      outcome: 'diagnosed' }
  ],
  'rialto': [
    { date: '2026-09', appliance: 'Refrigerator', brand: 'Kenmore', area: 'Rialto', fixarJob: '100774',
      symptom: 'The refrigerator was not cooling.',
      finding: '',
      work: 'The control board was replaced on a parts-installation visit.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Dryer', brand: 'LG', model: 'DLG7301WE', area: 'Rialto', fixarJob: '100837',
      symptom: 'The drum was not turning.',
      finding: 'The cycling thermostat was broken and one drum roller had seized.',
      work: 'The thermostat and the drum roller were replaced and the dryer serviced.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Dryer', brand: 'GE', area: 'Rialto', fixarJob: '100801',
      symptom: 'The dryer was making noise.',
      finding: '',
      work: 'The technician performed a dryer maintenance service.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Washer', brand: 'Maytag', area: 'Rialto', fixarJob: '100741',
      symptom: 'The washer would not spin.',
      finding: 'The technician found the drive motor needed replacing.',
      work: 'A new or a used motor was quoted; the customer decided not to repair for now.',
      outcome: 'diagnosed' }
  ],
  'san-bernardino': [
    { date: '2026-09', appliance: 'Dryer', brand: 'Samsung', model: 'DV45K6500GWA', area: 'San Bernardino', fixarJob: '100877',
      symptom: 'The dryer was not heating.',
      finding: '',
      work: 'The main control board was replaced and the dryer serviced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer', brand: 'Samsung', model: 'WF45K6500AV', area: 'San Bernardino', fixarJob: '100947',
      symptom: 'The washer shut off and stopped working.',
      finding: 'The AddWash door lock was faulty.',
      work: 'The door lock was replaced on a follow-up visit.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer', brand: 'Kenmore', area: 'San Bernardino', fixarJob: '101181',
      symptom: 'The washer made a loud noise on the spin cycle.',
      finding: 'The parts it needed would have cost more than a new machine.',
      work: 'The technician advised against the repair.',
      outcome: 'diagnosed' }
  ],
  'upland': [
    { date: '2026-09', appliance: 'Freezer', brand: 'Electrolux', model: 'FPRU19F8RFB', area: 'Upland', fixarJob: '100873',
      symptom: 'The upright freezer was not cooling properly.',
      finding: 'The technician found the defrost thermostat and heater had failed.',
      work: 'The defrost thermostat and the heater were replaced.',
      outcome: 'repaired' }
  ],

  // ── Riverside County ───────────────────────────────────────────────
  'corona': [
    { date: '2026-10', appliance: 'Refrigerator', brand: 'GE', model: 'GSE25HSHEHSS', area: 'Corona', fixarJob: '101336',
      symptom: 'The refrigerator needed repair.',
      finding: 'The evaporator fan was broken.',
      work: 'The evaporator fan assembly was replaced.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Dishwasher', brand: 'Whirlpool', model: 'WDT730PAHZ0', area: 'Corona', fixarJob: '101145',
      symptom: 'A noise was coming from the motor.',
      finding: 'The technician found the pump had failed.',
      work: 'The pump was replaced and the drain line cleaned on a return visit, once the part arrived.',
      outcome: 'repaired' }
  ],
  'lake-elsinore': [
    { date: '2026-09', appliance: 'Washer', brand: 'Samsung', model: 'WF45K6500AV', area: 'Lake Elsinore', fixarJob: '100860',
      symptom: 'The washer was showing a DC3 error.',
      finding: 'The AddWash door lock was broken.',
      work: 'The door lock was replaced on a follow-up visit.',
      outcome: 'repaired' }
  ],
  'loma-linda': [
    { date: '2026-09', appliance: 'Washer', brand: 'GE', model: 'GFW650SPN0SN', area: 'Loma Linda', fixarJob: '100954',
      symptom: 'There was a leak underneath the washer.',
      finding: 'The detergent in use was producing far too much foam.',
      work: 'No parts were needed — the fix was a change of detergent.',
      outcome: 'diagnosed' }
  ],
  'moreno-valley': [
    { date: '2026-09', appliance: 'Refrigerator', brand: 'GE', model: 'GSL25JFXL', area: 'Moreno Valley', fixarJob: '100985',
      symptom: 'The side-by-side freezer was not cooling.',
      finding: 'The technician traced it to the inverter board.',
      work: 'A board replacement was quoted; no repair was carried out on this visit.',
      outcome: 'diagnosed' }
  ],
  'murrieta': [
    { date: '2026-09', appliance: 'Gas range', brand: 'GE', model: 'JGBP30BEA1WH', area: 'Murrieta', fixarJob: '101086',
      symptom: 'The oven was not heating.',
      finding: 'The bake igniter was broken.',
      work: 'The igniter was ordered and replaced on a return visit.',
      outcome: 'repaired' }
  ],
  'riverside': [
    { date: '2026-09', appliance: 'Built-in refrigerator', brand: 'Forte', area: 'Riverside', fixarJob: '100994',
      symptom: 'The fridge section stopped cooling while the freezer stayed cold; the fan was barely moving.',
      finding: 'The main control board was broken.',
      work: 'The board replacement was approved and the part ordered from the manufacturer.',
      outcome: 'part-ordered' },
    { date: '2026-08', appliance: 'Dryer', brand: 'Samsung', area: 'Riverside', fixarJob: '100557',
      symptom: 'The dryer was making noise.',
      finding: 'The high-limit thermostat had failed.',
      work: 'The thermostat was replaced and the dryer serviced.',
      outcome: 'repaired' }
  ],
  'temecula': [
    { date: '2026-09', appliance: 'Washer-extractor', brand: 'Girbau', commercial: true, area: 'Temecula', fixarJob: '101120',
      symptom: 'The washer stopped working.',
      finding: 'The door lock was broken.',
      work: 'The door lock system was repaired on a return visit, once the part arrived.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer-extractor', brand: 'Girbau', commercial: true, area: 'Temecula', fixarJob: '100792',
      symptom: 'The machine faulted during the rinse and only resumed after an operator acknowledged it.',
      finding: 'The inlet water fill valve was broken.',
      work: 'The fill valve assembly was replaced with an OEM part, the inlet strainer cleaned and a full test cycle run.',
      outcome: 'repaired' }
  ],

  // ── Ventura County ─────────────────────────────────────────────────
  'moorpark': [
    { date: '2026-08', appliance: 'Refrigerator', brand: 'Frigidaire', model: 'FGHT2331PFCA', area: 'Moorpark', fixarJob: '100798',
      symptom: 'The ice maker was not making ice.',
      finding: 'The freezer was running above 20°F — too warm to make ice.',
      work: 'The refrigerator was serviced; the ice maker itself only needs replacing if the problem returns.',
      outcome: 'repaired' }
  ],
  'simi-valley': [
    { date: '2026-09', appliance: 'Dryer', brand: 'GE', model: 'GTD38GASW0WS', area: 'Simi Valley', fixarJob: '101121',
      symptom: 'The dryer was not heating.',
      finding: '',
      work: 'The technician diagnosed and repaired it on site, the same visit.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Refrigerator', brand: 'LG', area: 'Simi Valley', fixarJob: '100958',
      symptom: 'The refrigerator was not cooling.',
      finding: 'The technician diagnosed a failed compressor.',
      work: 'A compressor replacement was quoted; no repair was carried out on this visit.',
      outcome: 'diagnosed' }
  ],
  'thousand-oaks': [
    { date: '2026-09', appliance: 'Washer', brand: 'LG', area: 'Thousand Oaks', fixarJob: '101205',
      symptom: 'The washer was noisy on spin and left water inside.',
      finding: 'The technician tested it and found no fault.',
      work: 'No repair was needed.',
      outcome: 'diagnosed' },
    { date: '2026-09', appliance: 'Gas dryer', brand: 'Maytag', model: 'MDG5500AWW', area: 'Thousand Oaks', fixarJob: '101007',
      symptom: 'The dryer was not heating, even after the owner cleared a packed vent.',
      finding: 'The igniter was defective, so the burner was not lighting.',
      work: 'The igniter was replaced on site.',
      outcome: 'repaired' }
  ],

  // ── Santa Barbara County ───────────────────────────────────────────
  'santa-barbara': [
    { date: '2026-09', appliance: 'Range', brand: 'Wolf', area: 'Santa Barbara', fixarJob: '100795',
      symptom: 'The pilots on an older Wolf range would not light after the gas had been turned off and back on.',
      finding: 'The oven thermocouple and the four open-top pilot burners needed replacing; parts were hard to source for a unit that age.',
      work: 'The thermocouple and all four pilot burners were replaced, with new pilot gas tubing.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Griddle', brand: 'Garland', commercial: true, area: 'Santa Barbara', fixarJob: '101133',
      symptom: 'The flat-top was not working; the owner had the parts and needed them installed.',
      finding: 'The thermostat control and the thermocouple needed replacing.',
      work: 'Both were replaced and the flat-top was working again.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Washer', brand: 'Blomberg', area: 'Santa Barbara', fixarJob: '100965',
      symptom: 'The door would not open after the cycle.',
      finding: 'The door handle part had failed.',
      work: 'A new handle was ordered and installed.',
      outcome: 'repaired' },
    { date: '2026-09', appliance: 'Food warmer', brand: 'Avantco', commercial: true, area: 'Santa Barbara', fixarJob: '100946',
      symptom: 'The warmer stopped working after it smoked and smelled burnt.',
      finding: 'An electrical overload had damaged the power wiring, terminal block and connectors.',
      work: 'The power cord, ceramic terminal block and wire connectors were replaced and the unit tested.',
      outcome: 'repaired' },
    { date: '2026-08', appliance: 'Oven', brand: 'Miele', area: 'Upper East, Santa Barbara', fixarJob: '100586',
      symptom: 'The rubber door seal was coming loose.',
      finding: '',
      work: 'A Miele door seal was ordered and replaced.',
      outcome: 'repaired' }
  ]
};
