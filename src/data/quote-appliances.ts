// src/data/quote-appliances.ts
//
// The appliance and problem tiles for the quote sheet. Two scopes, keyed by the
// answer to step 1 ("where"): residential = at home, commercial = in a business.
// Problem tiles are the symptoms a dispatcher actually needs to route the truck,
// not a diagnostic tree — free text on the same step covers the rest.

export type QuoteScope = 'residential' | 'commercial';

export interface ApplianceType {
  /** Stable id — goes into the payload, never change it once shipped. */
  id: string;
  label: string;
  problems: string[];
}

const COMMON_TAIL = ['Something else'];

export const RESIDENTIAL_APPLIANCES: ApplianceType[] = [
  {
    id: 'refrigerator',
    label: 'Refrigerator',
    problems: ['Not cooling', 'Freezer warm', 'Leaking water', 'Noisy', 'Ice maker down', ...COMMON_TAIL],
  },
  {
    id: 'washer',
    label: 'Washer',
    problems: ["Won't start", 'Leaking', 'Not draining', 'Not spinning', 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'dryer',
    label: 'Dryer',
    problems: ['Not heating', 'Not tumbling', 'Takes too long', 'Noisy', 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'dishwasher',
    label: 'Dishwasher',
    problems: ['Not draining', 'Leaking', 'Not cleaning', "Won't start", 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'oven_range',
    label: 'Oven / range',
    problems: ['Not heating', 'Burner won’t light', 'Temperature off', 'Door problem', 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'cooktop',
    label: 'Cooktop',
    problems: ['Burner won’t light', 'Element not heating', 'Clicking constantly', 'Cracked surface', ...COMMON_TAIL],
  },
  {
    id: 'microwave',
    label: 'Microwave',
    problems: ['Not heating', "Won't start", 'Sparking', 'Turntable stuck', ...COMMON_TAIL],
  },
  {
    id: 'wine_cooler',
    label: 'Wine cooler',
    problems: ['Not cooling', 'Too cold', 'Noisy', 'Door seal', 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'ice_maker',
    label: 'Ice maker',
    problems: ['No ice', 'Small or hollow cubes', 'Leaking', 'Noisy', ...COMMON_TAIL],
  },
  {
    id: 'other_residential',
    label: 'Something else',
    problems: ["Won't start", 'Leaking', 'Not heating', 'Not cooling', 'Noisy', ...COMMON_TAIL],
  },
];

export const COMMERCIAL_APPLIANCES: ApplianceType[] = [
  {
    id: 'walk_in_reach_in',
    label: 'Walk-in / reach-in',
    problems: ['Not cooling', 'Icing up', 'Leaking', 'Compressor noise', 'Door not sealing', ...COMMON_TAIL],
  },
  {
    id: 'ice_machine',
    label: 'Ice machine',
    problems: ['No ice', 'Low production', 'Leaking', 'Noisy', 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'commercial_oven_range',
    label: 'Commercial oven / range',
    problems: ['Not heating', 'Burner won’t light', 'Temperature off', 'Pilot keeps dropping', 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'commercial_dishwasher',
    label: 'Commercial dishwasher',
    problems: ['Not heating', 'Not draining', 'Leaking', 'Poor wash result', "Won't start", ...COMMON_TAIL],
  },
  {
    id: 'commercial_laundry',
    label: 'Commercial washer / dryer',
    problems: ["Won't start", 'Not heating', 'Not draining', 'Not spinning', 'Error code', ...COMMON_TAIL],
  },
  {
    id: 'other_commercial',
    label: 'Something else',
    problems: ["Won't start", 'Leaking', 'Not heating', 'Not cooling', 'Noisy', ...COMMON_TAIL],
  },
];

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
