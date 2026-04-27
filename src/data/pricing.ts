// src/data/pricing.ts
//
// Diagnostic fee tiers + transparency content for the homepage Pricing section.
// Replicated from public/preview-homepage.html Section 10 (lines 2628-2672).
//
// Pricing values match Roman's wiki source-of-truth:
// - Residential: $89 (waived with repair)
// - Commercial:  $120 (waived with repair)
// Common Repair Examples are real ranges (verified by Roman), not placeholders.

export type PricingTierId = 'residential' | 'commercial';

export interface PricingTier {
  id: PricingTierId;
  name: string;
  diagnosticFee: number;
  waivedNote: string;
  /** Prose example list with em-dashes and "·" separators — copied verbatim from preview. */
  examples: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'residential',
    name: 'Residential',
    diagnosticFee: 89,
    waivedNote: 'Waived with repair',
    examples:
      'Refrigerator compressor: $450–$850 · Washer pump: $250–$400 · Wolf RTD probe: $180–$280 · Bosch drain hose: $140–$220 · Sub-Zero coil cleaning: $180–$280 · Range igniter: $150–$240 · Dishwasher control board: $280–$440',
  },
  {
    id: 'commercial',
    name: 'Commercial',
    diagnosticFee: 120,
    waivedNote: 'Waived with repair',
    examples:
      'Walk-in cooler compressor: $1,200–$2,500 · Ice machine pump: $400–$700 · Hobart dishwasher heater: $480–$780 · Pizza oven conveyor: $360–$580 · Commercial fryer thermostat: $240–$420 · Vulcan range gas valve: $320–$520',
  },
];

export const PRICING_BULLETS: string[] = [
  'All repairs include OEM parts — no aftermarket or refurbished components',
  '90-day warranty on parts and labor — same issue returns, we come back free',
  'Upfront written quote before work begins — no surprise charges',
  'No distance surcharge within branch territory — what we quote is what you pay',
];

export const PRICING_FOOTNOTE =
  '* Diagnostic of the second unit is free when both are serviced in the same visit';
