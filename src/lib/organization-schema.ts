// src/lib/organization-schema.ts
//
// The site-wide company entity, @id https://samedayappliance.repair/#organization.
// Built from SSOT data only (branches.ts, business-hours.ts) — nothing here is typed
// by hand except the brand name and the logo file.
//
// Where it is emitted IN FULL (one node per page, never twice):
//   - homepage @graph (HomepageSchema.astro), which adds credentials, memberships,
//     contactPoint and the service catalog on top;
//   - /gift-certificates/ (seller of the three Offers).
// Everywhere else the entity is only REFERENCED by @id (Article.publisher,
// parentOrganization on branch nodes, Service.provider) — see ORG_REF / ORG_PUBLISHER.
//
// NAP policy (seo-policies §1): no streetAddress and no geo — HQ is a service-area
// business since 2026-09-23, so the address is West Hollywood + ZIP only.

import { BRANCHES, HEADQUARTERS, toE164 } from '../data/branches';
import { OPENING_HOURS_SCHEMA } from '../data/business-hours';

export const SITE_URL = 'https://samedayappliance.repair';
export const ORG_ID = `${SITE_URL}/#organization`;
export const ORG_NAME = 'Same Day Appliance Repair';

/** public/logo.webp — real pixel size of the file (checked 2026-11-16). */
export const ORG_LOGO = {
  '@type': 'ImageObject',
  url: `${SITE_URL}/logo.webp`,
  width: 400,
  height: 178
} as const;

/** Bare reference, for parentOrganization / provider / seller. */
export const ORG_REF = { '@id': ORG_ID } as const;

/** Publisher block for Article / BlogPosting: @id plus the two fields Google reads. */
export const ORG_PUBLISHER = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: ORG_NAME,
  url: `${SITE_URL}/`,
  logo: ORG_LOGO
} as const;

function countyName(slug: string): string {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' County';
}

/** The seven served counties, in branches.ts order. */
export const SERVED_COUNTIES = [...new Set(BRANCHES.map((b) => b.primaryCounty))].map(countyName);

/** Org-level sameAs: profiles of the company itself (HQ branch carries the GBP link). */
const ORG_SAME_AS = (HEADQUARTERS.sameAs ?? []).filter((u) => !u.includes('google.com/maps'));

/**
 * Full company node. HomeAndConstructionBusiness (a LocalBusiness, hence an
 * Organization) — so openingHoursSpecification / address / priceRange are valid on it.
 */
export function buildOrganizationNode(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    '@type': 'HomeAndConstructionBusiness',
    '@id': ORG_ID,
    name: ORG_NAME,
    url: `${SITE_URL}/`,
    logo: ORG_LOGO,
    image: `${SITE_URL}/images/cities/${HEADQUARTERS.slug}/hero.jpg`,
    telephone: toE164(HEADQUARTERS.phone),
    email: HEADQUARTERS.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: HEADQUARTERS.address!.city,
      addressRegion: HEADQUARTERS.address!.state,
      postalCode: HEADQUARTERS.address!.zip,
      addressCountry: 'US'
    },
    areaServed: SERVED_COUNTIES.map((name) => ({ '@type': 'AdministrativeArea', name })),
    openingHoursSpecification: OPENING_HOURS_SCHEMA,
    priceRange: '$$',
    ...(ORG_SAME_AS.length ? { sameAs: ORG_SAME_AS } : {}),
    ...extra
  };
}
