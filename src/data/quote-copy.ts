// src/data/quote-copy.ts
//
// Single source of truth for every number and every sentence the quote sheet shows.
// Nothing here is duplicated into the sheet sources: QuoteSheet.astro,
// QuoteSheet.client.ts and QuoteFallbackForm.astro import from this file and must
// contain zero hard-coded currency literals. The gate
// scripts/check-quote-sheet.mjs enforces both halves of that rule.
//
// Fee tiers match the wiki source-of-truth and src/data/pricing.ts:
//   residential $89 · commercial $120, both waived when the repair is approved.

/** Residential diagnostic fee, in whole dollars. */
export const DIAGNOSTIC_RES = 89;

/** Commercial diagnostic fee, in whole dollars. */
export const DIAGNOSTIC_COM = 120;

/** Format a whole-dollar amount. Kept as a function so no source file — this one
 *  included — carries a literal dollar-sign-plus-digits string. */
export function money(amount: number): string {
  return String.fromCharCode(36) + amount;
}

/** Display strings for the price step. */
export const DIAGNOSTIC_RES_DISPLAY = money(DIAGNOSTIC_RES);
export const DIAGNOSTIC_COM_DISPLAY = money(DIAGNOSTIC_COM);

/**
 * What the diagnostic fee actually buys. Three plain lines instead of one clause —
 * each one answers a question people ask on the phone before they book.
 * Byte-equality with what ships in dist/book/index.html is a gate, so edit here
 * and nowhere else. The sheet, the fallback form and the Telegram card all read these.
 */
export const DIAGNOSTIC_TERMS = [
  'Credited toward the repair when you hire us for the job.',
  "If our technician can't diagnose the problem, there's no diagnostic fee.",
  'You get a written report: what failed and which parts need replacing.',
] as const;

/** Single-line form, for places with no room for three (the Telegram card). */
export const WAIVED_CLAUSE = DIAGNOSTIC_TERMS[0];

/** Business hours line, shown on the price step and again on the done step. */
export const HOURS_LINE =
  'Available Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7';

/** Copy for the final step. */
export const CALLBACK_COPY = {
  heading: 'Got it.',
  body: "We'll call or text you back.",
  callPrompt: 'Need it sooner? Call the dispatcher directly.',
} as const;

/** Price-step framing. */
export const PRICE_COPY = {
  eyebrow: 'Diagnostic visit',
  heading: 'Diagnostic visit',
  residentialLabel: 'At home',
  commercialLabel: 'In a business',
  note: 'A technician comes out, finds the fault, and gives you a flat written repair price before anything is touched.',
} as const;

/** Scope labels reused by the sheet and the Telegram card. */
export const SCOPE_LABELS = {
  residential: 'at home',
  commercial: 'in a business',
} as const;

/** Step headings, in order. The counter renders as "N / TOTAL_STEPS". */
export const STEP_COPY = [
  { id: 'where', heading: 'Where is the appliance?' },
  { id: 'appliance', heading: 'What needs fixing?' },
  { id: 'problem', heading: "What's it doing?" },
  { id: 'photos', heading: 'Add a photo?' },
  { id: 'price', heading: PRICE_COPY.heading },
  { id: 'contact', heading: 'Where do we come out?' },
] as const;

export const TOTAL_STEPS = STEP_COPY.length;

/**
 * QS-2 prefill copy. When the page already tells us what the visitor is looking at,
 * step 2 asks them to confirm rather than to choose from sixteen tiles. The guess is
 * always visibly a guess — a soft highlight, every other tile still one tap away —
 * because a page is evidence of interest, not a statement of what broke.
 * `{appliance}` is replaced with the tile's own label.
 */
export const PREFILL_COPY = {
  heading: 'Is it your {appliance}?',
  sub: "That's what this page is about — tap anything else if it's not.",
  confirm: "Yes, that's it",
} as const;

/** Address verification, step 6. */
export const ADDRESS_COPY = {
  label: 'Address',
  placeholder: 'Start typing the street address',
  /** The only place the error style is used: the lookup request itself failed. */
  lookupFailed:
    "Address lookup isn't responding — type it in full and we'll confirm by phone.",
  /** Shown when a suggestion resolved to a street but not a specific building. */
  streetOnly: 'Add the house or unit number so the tech finds the door.',
} as const;

/** ZIP field copy. Place Details fills the ZIP from the picked building; the field
 *  stays editable, and a typed ZIP that contradicts Google gets the note below —
 *  a note, not an error. Routing uses Google's, and dispatch sees both. */
export const ZIP_COPY = {
  label: 'ZIP',
  /** Suffix on the field label once Google supplied the value. */
  fromGoogle: 'from Google',
  /** `{zip}` is replaced with the ZIP Google returned. */
  mismatch: "That ZIP doesn't match the address you picked — we'll go with {zip}",
} as const;

/** Out-of-zone ZIP note. A note, never a block — the lead still goes through. */
export const OUT_OF_ZONE_NOTE =
  "That ZIP is outside our usual routes. Send it anyway — we'll call and tell you straight whether we can get a truck to you.";

/** Visit-time tiles on the contact step. */
export const VISIT_TIMES = [
  { id: 'asap', label: 'ASAP', hint: 'Soonest open slot' },
  { id: 'today_tomorrow', label: 'Today or tomorrow', hint: 'We call to confirm the window' },
  { id: 'pick_date', label: 'Pick a date', hint: 'Choose a day below' },
] as const;

/** Photos step. */
export const PHOTOS_COPY = {
  hint: 'A photo of the model plate or the fault helps the tech stock the right part.',
  max: 2,
  skip: 'Skip — no photo',
  /** Mirrors the 5 MB ceiling in functions/api/chat/upload.js. Checked before the
   *  request so a phone photo that is too big fails instantly, not after the upload. */
  maxBytes: 5 * 1024 * 1024,
  tooBig: 'That photo is over 5 MB — send a smaller one, or carry on without it.',
} as const;

/** Error copy. 429 is deliberately worded differently from a genuine failure. */
export const ERROR_COPY = {
  rateLimited:
    "That's a few requests in a row from your connection. Give it a few minutes, or call the dispatcher and we'll book you right now.",
  failed:
    "That didn't go through. So the request isn't lost, please call the dispatcher directly.",
} as const;
