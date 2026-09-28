// src/data/memberships.ts
//
// Association memberships SSOT — rendered by <MembershipBadges /> and emitted as
// Organization.memberOf in the homepage JSON-LD graph.
//
// Wording rule: the relationship is always "Member". Never "Accredited",
// "Certified", "Approved" or "Verified" — these are memberships, not credentials.
//
// No official logos yet: `logo` is left undefined and the badge renders as text.
// When an association provides its member logo, drop the file into
// /public/badges/ and set `logo` (plus logoWidth/logoHeight) — nothing else changes.

export interface Membership {
  /** Short code used in compact spots (ticker, trust bars). */
  abbr: string;
  /** Full legal name of the association, exactly as the association writes it. */
  name: string;
  url: string;
  logo?: string;
  logoWidth?: number;
  logoHeight?: number;
}

export const MEMBERSHIPS: Membership[] = [
  {
    abbr: 'UASA',
    name: 'United Appliance Servicers Association',
    url: 'https://www.unitedservicers.com/'
  },
  {
    abbr: 'Rancho Cucamonga Chamber',
    name: 'Rancho Cucamonga Chamber of Commerce',
    url: 'https://www.ranchochamber.org/'
  }
];

/** Visible badge text: "Member · United Appliance Servicers Association (UASA)". */
export function membershipLabel(m: Membership): string {
  return m.abbr === 'UASA' ? `${m.name} (${m.abbr})` : m.name;
}

/** JSON-LD value for Organization.memberOf. */
export const MEMBER_OF_SCHEMA = MEMBERSHIPS.map((m) => ({
  '@type': 'Organization',
  name: m.name,
  ...(m.abbr === 'UASA' ? { alternateName: m.abbr } : {}),
  url: m.url
}));
