// src/data/press.ts
//
// "As featured in" — articles in which Roman Abysov / Same Day Appliance Repair is
// actually named. Rendered by src/components/AsFeatured.astro.
//
// RULES (owner, 19.10.2026)
//   - Only articles that are LIVE and name us. Verify the page before adding.
//   - Outlet name as text (wordmark), never the outlet's logo file: we have no
//     permission to use their trademarks as images.
//   - `role` is copied from how the article credits us — do not upgrade it.
//   - No quotes from the article here (their copyright) — the link carries the reader.
//   - No Review / AggregateRating schema for this block.

export interface PressMention {
  outlet: string;
  title: string;
  url: string;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  /** How the article credits us, verbatim. */
  role: string;
}

export const PRESS: PressMention[] = [
  {
    outlet: 'Martha Stewart',
    title: 'Can You Wash Knives in Dishwashers?',
    url: 'https://www.marthastewart.com/can-you-wash-knives-in-dishwasher-12171753',
    date: '2026-10-17',
    role: 'Roman Abysov, owner of Same Day Appliance Repair in Los Angeles'
  }
];

/** Newest first. */
export function pressMentions(): PressMention[] {
  return [...PRESS].sort((a, b) => b.date.localeCompare(a.date));
}
