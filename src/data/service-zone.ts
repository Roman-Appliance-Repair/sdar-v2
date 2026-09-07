// src/data/service-zone.ts
//
// ZIP → branch routing. Lifted verbatim out of the inline script in
// src/pages/book.astro (QS-1) so the booking page, the quote sheet and any future
// caller share one table instead of three copies.
//
// branches.ts carries no ZIP coverage, so this exact-ZIP override map plus the
// 3-digit prefix map is the routing table. Behaviour is unchanged from the
// book.astro original: an unrecognised ZIP still resolves to the LA branch for
// dispatch purposes — use isInServiceZone() when you need to know whether the ZIP
// actually matched something.
//
// NOTE: functions/api/contact.js keeps its own SDAR_BRANCH_PHONES copy. That
// server-side duplicate is deliberately untouched in this wave.

export const MAIN_BRANCH_SLUG = 'los-angeles';

/** Exact-ZIP overrides for branch boundaries. */
export const ZIP_EXACT: Record<string, string> = {
  // West Hollywood pin territory
  '90048': 'west-hollywood', '90046': 'west-hollywood', '90069': 'west-hollywood',
  '90038': 'west-hollywood', '90028': 'west-hollywood',
  // Beverly Hills
  '90209': 'beverly-hills', '90210': 'beverly-hills', '90211': 'beverly-hills',
  '90212': 'beverly-hills', '90213': 'beverly-hills',
  // Thousand Oaks / Conejo Valley zips that live in the 913xx block
  '91319': 'thousand-oaks', '91320': 'thousand-oaks', '91358': 'thousand-oaks',
  '91359': 'thousand-oaks', '91360': 'thousand-oaks', '91361': 'thousand-oaks',
  '91362': 'thousand-oaks', '91377': 'thousand-oaks', '91301': 'thousand-oaks',
  // San Diego branch — Wave 1 North County Coastal + La Jolla ONLY (2026-08-07).
  // City-of-SD prefixes 919xx/921xx stay UNMAPPED on purpose until Wave 2 pages exist.
  '92037': 'san-diego',
  '92008': 'san-diego', '92009': 'san-diego', '92010': 'san-diego', '92011': 'san-diego',
  '92014': 'san-diego', '92067': 'san-diego', '92091': 'san-diego',
  '92024': 'san-diego', '92075': 'san-diego', '92007': 'san-diego',
  // Santa Barbara branch — South Coast corridor (2026-08-06). 930xx/931xx prefixes
  // stay thousand-oaks (Ventura county); these exact SB-county ZIPs override:
  // Carpinteria, Summerland, Santa Barbara city (incl. 93108 Montecito,
  // 93110 Hope Ranch), Goleta.
  '93013': 'santa-barbara', '93067': 'santa-barbara',
  '93101': 'santa-barbara', '93102': 'santa-barbara', '93103': 'santa-barbara',
  '93104': 'santa-barbara', '93105': 'santa-barbara', '93106': 'santa-barbara',
  '93107': 'santa-barbara', '93108': 'santa-barbara', '93109': 'santa-barbara',
  '93110': 'santa-barbara', '93111': 'santa-barbara', '93117': 'santa-barbara',
};

/** 3-digit ZIP prefix → branch slug. */
export const ZIP_PREFIX3: Record<string, string> = {
  // LA basin / South Bay / Westside / Long Beach
  '900': 'los-angeles', '901': 'los-angeles', '902': 'los-angeles', '903': 'los-angeles',
  '904': 'los-angeles', '905': 'los-angeles', '906': 'los-angeles', '907': 'los-angeles',
  '908': 'los-angeles',
  // San Gabriel Valley / Pasadena / Glendale
  '910': 'pasadena', '911': 'pasadena', '912': 'pasadena', '918': 'pasadena',
  // San Fernando Valley / Burbank
  '913': 'los-angeles', '914': 'los-angeles', '915': 'los-angeles',
  // Inland Empire (San Bernardino county)
  '917': 'rancho-cucamonga', '923': 'rancho-cucamonga', '924': 'rancho-cucamonga',
  // Riverside county
  '922': 'riverside', '925': 'riverside',
  // Orange county
  '926': 'irvine', '927': 'irvine', '928': 'irvine',
  // Ventura county
  '930': 'thousand-oaks', '931': 'thousand-oaks',
};

/** Strip to at most 5 leading digits. */
export function normalizeZip(zip: string): string {
  return String(zip || '').replace(/\D/g, '').slice(0, 5);
}

/**
 * ZIP → branch slug. Falls back to the LA branch, matching the original
 * book.astro behaviour, so dispatch always has somewhere to land.
 */
export function zipToBranch(zip: string): string {
  const z = normalizeZip(zip);
  if (z.length < 5) return MAIN_BRANCH_SLUG;
  if (ZIP_EXACT[z]) return ZIP_EXACT[z];
  return ZIP_PREFIX3[z.slice(0, 3)] || MAIN_BRANCH_SLUG;
}

/**
 * True only when the ZIP actually matched a table entry. A false here drives the
 * grey out-of-zone note in the quote sheet — it never blocks submission.
 */
export function isInServiceZone(zip: string): boolean {
  const z = normalizeZip(zip);
  if (z.length < 5) return false;
  return Boolean(ZIP_EXACT[z] || ZIP_PREFIX3[z.slice(0, 3)]);
}
