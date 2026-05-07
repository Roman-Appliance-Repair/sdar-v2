// src/data/business-hours.ts
//
// SINGLE SOURCE OF TRUTH for business hours displayed on city pages,
// service pages, brand pages, commercial pages, and homepage.
//
// Per T11-FIX contract rule (active 2026-04-28 evening):
//   Display string everywhere: "Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7"
//   No other variations on any page or component.
//
// Schema JSON-LD openingHoursSpecification — derived from `schedule`.

export const BUSINESS_HOURS = {
  /** Display string used on visible UI — BookingCard, PropertyManagers, FinalCTA, etc. */
  display: 'Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7',
  /** Compact display when "Phone answered 24/7" line is conveyed elsewhere. */
  displayShort: 'Mon–Sat 8am–8pm · Sun closed',
  /** Per-day schedule — used to generate openingHoursSpecification in JSON-LD. */
  schedule: {
    monday: { opens: '08:00', closes: '20:00' },
    tuesday: { opens: '08:00', closes: '20:00' },
    wednesday: { opens: '08:00', closes: '20:00' },
    thursday: { opens: '08:00', closes: '20:00' },
    friday: { opens: '08:00', closes: '20:00' },
    saturday: { opens: '08:00', closes: '20:00' },
    sunday: 'closed' as const
  },
  /** True — phone calls answered 24/7 even when in-person service hours are closed. */
  phoneAnswered24x7: true
} as const;

/** openingHoursSpecification block for LocalBusiness JSON-LD.
 *  Sunday closed is encoded as opens=closes=00:00 per Google's documented pattern. */
export const OPENING_HOURS_SCHEMA = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '20:00'
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Sunday',
    opens: '00:00',
    closes: '00:00'
  }
];
