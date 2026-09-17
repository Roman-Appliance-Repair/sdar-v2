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
  // San Diego branch — Wave 1 North County Coastal + La Jolla (2026-08-07).
  // Wave 2 (2026-09-17). Every ZIP below was checked one by one against the USPS
  // city-by-ZIP lookup (tools.usps.com), cross-checked with GeoNames. Exact ZIPs,
  // not the 921 prefix: the block also holds ZIPs USPS does not recognise.
  '92037': 'san-diego',
  '92008': 'san-diego', '92009': 'san-diego', '92010': 'san-diego', '92011': 'san-diego',
  '92014': 'san-diego', '92067': 'san-diego', '92091': 'san-diego',
  '92024': 'san-diego', '92075': 'san-diego', '92007': 'san-diego',
  // City of San Diego (USPS default city San Diego or San Ysidro, the city's own
  // border neighbourhood).
  '92101': 'san-diego', '92102': 'san-diego', '92103': 'san-diego', '92104': 'san-diego', '92105': 'san-diego',
  '92106': 'san-diego', '92107': 'san-diego', '92108': 'san-diego', '92109': 'san-diego', '92110': 'san-diego',
  '92111': 'san-diego', '92112': 'san-diego', '92113': 'san-diego', '92114': 'san-diego', '92115': 'san-diego',
  '92116': 'san-diego', '92117': 'san-diego', '92119': 'san-diego', '92120': 'san-diego', '92121': 'san-diego',
  '92122': 'san-diego', '92123': 'san-diego', '92124': 'san-diego', '92126': 'san-diego', '92127': 'san-diego',
  '92128': 'san-diego', '92129': 'san-diego', '92130': 'san-diego', '92131': 'san-diego', '92132': 'san-diego',
  '92134': 'san-diego', '92135': 'san-diego', '92136': 'san-diego', '92137': 'san-diego', '92138': 'san-diego',
  '92139': 'san-diego', '92140': 'san-diego', '92142': 'san-diego', '92143': 'san-diego', '92145': 'san-diego',
  '92147': 'san-diego', '92149': 'san-diego', '92150': 'san-diego', '92152': 'san-diego', '92153': 'san-diego',
  '92154': 'san-diego', '92155': 'san-diego', '92158': 'san-diego', '92159': 'san-diego', '92160': 'san-diego',
  '92161': 'san-diego', '92163': 'san-diego', '92165': 'san-diego', '92166': 'san-diego', '92167': 'san-diego',
  '92168': 'san-diego', '92169': 'san-diego', '92170': 'san-diego', '92171': 'san-diego', '92172': 'san-diego',
  '92173': 'san-diego', '92174': 'san-diego', '92175': 'san-diego', '92176': 'san-diego', '92177': 'san-diego',
  '92179': 'san-diego', '92182': 'san-diego', '92186': 'san-diego', '92187': 'san-diego', '92191': 'san-diego',
  '92192': 'san-diego', '92193': 'san-diego', '92195': 'san-diego', '92196': 'san-diego', '92197': 'san-diego',
  '92198': 'san-diego', '92199': 'san-diego',
  // Coronado (both ZIPs: USPS default city Coronado). Added
  // 2026-09-17: /marine/san-diego/ names Coronado among the places we work.
  '92118': 'san-diego', '92178': 'san-diego',
  // Oceanside, north of Carlsbad (2026-09-17). USPS: 92054/92056/92057/92058 are
  // Oceanside, record type STANDARD. 92055 is left out: USPS default city Camp
  // Pendleton (Marine Corps base), record type PO BOX.
  '92054': 'san-diego', '92056': 'san-diego', '92057': 'san-diego', '92058': 'san-diego',
  // Nearby South Bay / East County cities, 15-25 min from central San Diego.
  // Back country (Alpine, Jamul, Campo, Boulevard, Jacumba) stays unmapped on purpose.
  // Chula Vista
  '91909': 'san-diego', '91910': 'san-diego', '91911': 'san-diego', '91912': 'san-diego', '91913': 'san-diego',
  '91914': 'san-diego', '91915': 'san-diego', '91921': 'san-diego',
  // National City
  '91950': 'san-diego', '91951': 'san-diego',
  // Imperial Beach
  '91932': 'san-diego', '91933': 'san-diego',
  // Bonita
  '91902': 'san-diego', '91908': 'san-diego',
  // La Mesa
  '91941': 'san-diego', '91942': 'san-diego', '91943': 'san-diego', '91944': 'san-diego',
  // Lemon Grove
  '91945': 'san-diego', '91946': 'san-diego',
  // Spring Valley
  '91976': 'san-diego', '91977': 'san-diego', '91978': 'san-diego', '91979': 'san-diego',
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
