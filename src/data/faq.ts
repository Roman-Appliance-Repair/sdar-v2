// src/data/faq.ts
// Homepage FAQ data — single source of truth for both:
//   - FAQ.astro (visible accordion)
//   - HomepageSchema.astro (FAQPage JSON-LD entity)

export interface FAQItem {
  question: string;
  answer: string;
}

export const HOMEPAGE_FAQ: FAQItem[] = [
  {
    question: 'How quickly can you repair my appliance?',
    answer:
      'We offer same-day service across all 5 Southern California counties when you call before 2 PM. Most repairs are completed in a single visit — our technicians stock 200+ OEM parts on every truck.',
  },
  {
    question: "What's your diagnostic fee?",
    answer:
      'Residential diagnostics are $89, commercial are $120. Both fees are waived if you proceed with the repair. Diagnostic of the second unit in the same visit is free.',
  },
  {
    question: 'Do you provide a warranty on repairs?',
    answer:
      'Yes — every repair comes with a 90-day warranty on parts and labor. If the same issue returns within 90 days, we come back at no charge.',
  },
  {
    question: 'Are you licensed and insured?',
    answer:
      "Yes. We're licensed by the California Bureau of Household Goods and Services (BHGS #A49573), fully insured, and BBB Accredited with an A+ rating. Our technicians carry EPA 608 Universal certification (#1346255700410) for refrigerant work.",
  },
  {
    question: 'Which appliance brands do you service?',
    answer:
      'We service all major residential brands including Sub-Zero, Wolf, Viking, Thermador, Miele, Bosch, KitchenAid, GE, Whirlpool, LG, Samsung, and more. We also handle commercial restaurant equipment from Vulcan, Hobart, True, Traulsen, and other professional brands.',
  },
  {
    question: 'Do you service my area?',
    answer:
      'We cover Los Angeles, Orange, Ventura, San Bernardino, and Riverside counties — 87+ cities total. Our headquarters is in West Hollywood with service territories across all 5 counties for fast same-day dispatch.',
  },
  {
    question: 'How do you handle pricing?',
    answer:
      'No flat-rate book pricing. After diagnostics, you receive a written estimate before any work begins. The diagnostic fee is credited toward the repair if you proceed. No surprise charges, no distance surcharges within branch territories.',
  },
  {
    question: 'Do you only use OEM parts?',
    answer:
      'Yes. All repairs include OEM (Original Equipment Manufacturer) parts — no aftermarket or refurbished components. This protects your warranty and ensures longer-lasting repairs.',
  },
  {
    question: 'Can you repair high-end and luxury appliances?',
    answer:
      'Absolutely. We specialize in luxury brands like Sub-Zero, Wolf, Viking, Thermador, La Cornue, BlueStar, and Gaggenau. Our technicians are factory-trained for these brands and stock specialty parts.',
  },
  {
    question: 'How do I schedule a repair?',
    answer:
      'Call (424) 325-0520 — phones are answered 24/7. You can also book online through our booking form or use our AI diagnostic tool to get a likely-cause estimate before scheduling.',
  },
];
