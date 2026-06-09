// src/lib/build-location-array.ts
//
// Wave 65 (2026-05-27) — Geo-neutral location array builder.
//
// Returns the 8-branch LocalBusiness entries to embed via `location:` field
// in geo-neutral commercial/brand-combo/service-hub LocalBusiness schemas.
// This is the canonical pattern per docs/seo-policies.md §3 for any
// non-pin page that doesn't anchor to a single city.
//
// SSOT inputs:
//   - src/data/branches.ts (per-branch slug/phone/email/county/displayCity)
//   - src/data/business-hours.ts (canonical Mon-Sat 08:00-20:00 + Sun closed)
//   - src/data/credentials-schema.ts (4-credential array per FINAL 2026-05-07)
//
// Important: this is the GEO-NEUTRAL variant — no streetAddress, no GeoCircle,
// no OfferCatalog refs. Brand-combo, service-hub, commercial, outdoor pages
// use this. Homepage / contact / book / privacy / terms / WeHo pin pages use
// the richer per-branch graph entries from HomepageSchema.astro.

import { BRANCHES, type Branch } from '../data/branches';
import { OPENING_HOURS_SCHEMA } from '../data/business-hours';
import { CANONICAL_CREDENTIALS, LEGAL_NAME } from '../data/credentials-schema';

function phoneE164(phone: string): string {
  return '+1' + phone.replace(/\D/g, '');
}

function buildBranchLocation(branch: Branch): Record<string, unknown> {
  return {
    '@type': 'LocalBusiness',
    name: branch.gbpName,
    legalName: LEGAL_NAME,
    telephone: phoneE164(branch.phone),
    email: branch.email,
    priceRange: '$$',
    // City-level address (no streetAddress) so each location-array entry satisfies
    // Google's required `address` field while honoring the SAB no-public-street rule.
    address: {
      '@type': 'PostalAddress',
      addressLocality: branch.displayCity,
      addressRegion: 'CA',
      addressCountry: 'US'
    },
    openingHoursSpecification: OPENING_HOURS_SCHEMA,
    areaServed: {
      '@type': 'City',
      name: branch.displayCity
    },
    hasCredential: [...CANONICAL_CREDENTIALS]
  };
}

export const BRANCH_LOCATIONS_GEO_NEUTRAL: Array<Record<string, unknown>> = BRANCHES.map(buildBranchLocation);
