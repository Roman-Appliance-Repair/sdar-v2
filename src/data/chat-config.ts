// src/data/chat-config.ts
//
// SSOT for live-dispatcher chat widget (Telegram-backed).
// Used by:
//   src/components/ChatWidget.astro          (build-time imports HIDDEN_PATHS/MAX_LEN/etc.)
//   functions/api/chat/*.js                  CANNOT import this file (Pages Functions
//                                            cannot resolve src/ .ts). Logic for
//                                            isWorkingHours() / getBranchFromPath()
//                                            is duplicated inline in those handlers.

import { BRANCHES } from './branches';

export const CHAT_CONFIG = {
  /** Dispatcher working hours (LA time, 24h format). Outside this window
   *  the widget surfaces an after-hours message via /api/chat/quick-reply. */
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

  /** Widget poll interval for dispatcher replies (ms). */
  POLL_INTERVAL_MS: 3000,

  /** Max single-message length (chars). */
  MAX_MESSAGE_LENGTH: 2000,

  /** Photo upload caps. */
  MAX_PHOTO_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,

  /** Pricing for canned quick replies. */
  PRICING: {
    residential: '$89',
    commercial: '$120'
  }
};

/** Resolve URL path → branch slug. Used to attach a branch context
 *  to a chat session so the dispatcher knows which territory routes to.
 *  Returns the canonical branches.ts slug (e.g. 'west-hollywood', not 'weho'). */
export function getBranchFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'west-hollywood';

  const firstSegment = segments[0];

  for (const branch of BRANCHES) {
    if (branch.citiesServed?.includes(firstSegment)) {
      return branch.slug;
    }
    if (branch.slug === firstSegment) {
      return branch.slug;
    }
  }

  return 'west-hollywood';
}

/** Working-hours check (server-side mirror lives inline in quick-reply.js). */
export function isWorkingHours(date: Date = new Date()): boolean {
  const laTime = new Date(date.toLocaleString('en-US', { timeZone: CHAT_CONFIG.WORKING_HOURS.timezone }));
  const hour = laTime.getHours();
  return hour >= CHAT_CONFIG.WORKING_HOURS.start && hour < CHAT_CONFIG.WORKING_HOURS.end;
}
