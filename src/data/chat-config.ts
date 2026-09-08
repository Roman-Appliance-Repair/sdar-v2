// src/data/chat-config.ts
//
// SSOT for live-dispatcher chat widget (Telegram-backed).
// Used by:
//   src/components/ChatWidget.astro          (build-time: screens, branch phone, poll cadence)
//   functions/api/chat/*.js                  CANNOT import this file (Pages Functions
//                                            cannot resolve src/ .ts) — the handlers
//                                            share functions/api/chat/_shared.js instead.

import { BRANCHES } from './branches';

export const CHAT_CONFIG = {
  /** Dispatcher working hours (LA time, 24h format). These are DISPATCH hours
   *  — when someone is on the other end of the chat — not the crew's service
   *  hours in business-hours.ts, which are a different and narrower window. */
  WORKING_HOURS: {
    start: 6,
    end: 22,
    timezone: 'America/Los_Angeles' as const
  },

  /** Pages where the widget should NOT render. */
  HIDDEN_PATHS: [
    '/book/',
    '/contact/',
    '/privacy-policy/',
    '/terms/'
  ] as const,

  /** KV session TTL — 7 days. */
  SESSION_TTL_SECONDS: 7 * 24 * 60 * 60,

  /** Poll cadence for dispatcher replies. Fast while the conversation is warm;
   *  after IDLE_AFTER_MS without a single new message we back off, so a tab left
   *  open all afternoon does not hammer the function 1200 times an hour. */
  POLL_INTERVAL_MS: 3000,
  POLL_IDLE_INTERVAL_MS: 15000,
  POLL_IDLE_AFTER_MS: 5 * 60 * 1000,

  /** Max single-message length (chars). */
  MAX_MESSAGE_LENGTH: 2000,

  /** Name screen: shortest name we accept. */
  MIN_NAME_LENGTH: 2,

  /** Photo upload caps. */
  MAX_PHOTO_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,

};

/** The one hours line the widget prints, built from WORKING_HOURS so the claim
 *  cannot drift away from the config it is supposed to describe. */
export const DISPATCH_HOURS_LINE = (() => {
  const h = (n: number) => (n % 12 === 0 ? 12 : n % 12) + (n < 12 ? 'am' : 'pm');
  return `Mon–Sat ${h(CHAT_CONFIG.WORKING_HOURS.start)}–${h(CHAT_CONFIG.WORKING_HOURS.end)}`;
})();

/** Branch the widget attributes a page to: full city name + local DID.
 *  The city name is rendered verbatim in the widget and in the Telegram card,
 *  so it must stay the full form ('West Hollywood', never 'WeHo'). */
export interface ChatBranch {
  slug: string;
  /** Full city name, Title Case. */
  city: string;
  /** Display form, e.g. '(323) 870-4790'. */
  phone: string;
  /** Dial form for tel: hrefs, e.g. '+13238704790'. */
  phoneHref: string;
}

/** West Hollywood is the fallback for every path we cannot attribute
 *  (brand pages, blog, /about, ...) — it is the physical pin. */
const FALLBACK_SLUG = 'west-hollywood';

function toHref(phone: string): string {
  const digits = String(phone).replace(/\D/g, '');
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}

/** Resolve URL path → branch (full city name + phone). Used at build time by
 *  ChatWidget.astro so every page ships its own branch phone with no runtime lookup.
 *  Returns the canonical branches.ts entry (e.g. 'west-hollywood', not 'weho'). */
export function getChatBranch(pathname: string): ChatBranch {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  let branch = BRANCHES.find((b) => b.slug === FALLBACK_SLUG)!;

  if (firstSegment) {
    const match = BRANCHES.find(
      (b) => b.slug === firstSegment || b.citiesServed?.includes(firstSegment)
    );
    // A branch whose DID is still a 555 placeholder must never be advertised —
    // fall through to West Hollywood instead of printing a dead number.
    if (match && match.phoneStatus === 'active') branch = match;
  }

  return {
    slug: branch.slug,
    city: branch.displayCity,
    phone: branch.phone,
    phoneHref: toHref(branch.phone)
  };
}

/** Back-compat: some callers only need the slug. */
export function getBranchFromPath(pathname: string): string {
  return getChatBranch(pathname).slug;
}
