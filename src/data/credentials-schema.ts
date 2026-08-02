// src/data/credentials-schema.ts
//
// Canonical credentials + legal-name SSOT for JSON-LD LocalBusiness schemas.
// Aligned with docs/seo-policies.md §1 (FINAL 2026-05-07) and
// docs/factual-accuracy.md §3.
//
// Apply via mergeCredentials(schema) helper. Idempotent: rerunning is safe.

export const LEGAL_NAME = 'HVAC 777 LLC';

// WeHo pin branch — default identity for geo-neutral schemas (telephone +
// city-level address fallback). Source: branches.ts SSOT, not hardcoded.
import { BRANCHES } from './branches';
const WEHO_BRANCH = BRANCHES.find((b) => b.slug === 'west-hollywood');
const DEFAULT_TELEPHONE = '+1' + (WEHO_BRANCH?.phone ?? '(323) 870-4790').replace(/\D/g, '');
const WEHO_ZIP = WEHO_BRANCH?.address?.zip ?? '90048';

export interface EducationalOccupationalCredential {
  '@type': 'EducationalOccupationalCredential';
  credentialCategory: string;
  recognizedBy: {
    '@type': 'GovernmentOrganization' | 'Organization';
    name: string;
  };
}

/** 4-credential canonical array applied to every LocalBusiness schema site-wide.
 *  Order: BHGS (state license) → EPA 608 (federal cert) → CSLB C-20 (state license)
 *  → BBB Accredited Business (business accreditation, never "A+"). */
export const CANONICAL_CREDENTIALS: EducationalOccupationalCredential[] = [
  {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'BHGS Registration #A49573',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'California Bureau of Household Goods and Services'
    }
  },
  {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'EPA 608 Universal Certification #1346255700410',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'U.S. Environmental Protection Agency'
    }
  },
  {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'CSLB C-20 HVAC',
    recognizedBy: {
      '@type': 'GovernmentOrganization',
      name: 'California Contractors State License Board'
    }
  },
  {
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'BBB Accredited Business',
    recognizedBy: {
      '@type': 'Organization',
      name: 'Better Business Bureau'
    }
  }
];

/** Idempotently injects legalName + hasCredential into a LocalBusiness schema object.
 *  - If legalName already present, it is replaced with canonical LEGAL_NAME.
 *  - If hasCredential already present (singular or array), it is replaced with
 *    canonical CANONICAL_CREDENTIALS array.
 *  - Returns a NEW object (does not mutate input) to avoid side effects when the
 *    same schema reference is reused across calls. Spread copy is shallow but
 *    sufficient — credentials array uses a fresh slice per call. */
const LB_TYPES = new Set(['LocalBusiness', 'HomeAndConstructionBusiness']);

/** City-level addressLocality from the schema's existing `areaServed` City entry,
 *  else the West Hollywood pin city. No `streetAddress` — NAP policy: only
 *  `physical_pin` pages expose the public street address. */
function deriveLocality(schema: Record<string, unknown>): string {
  const a = schema['areaServed'];
  const arr = Array.isArray(a) ? a : (a ? [a] : []);
  for (const x of arr) {
    if (x && typeof x === 'object'
        && (x as Record<string, unknown>)['@type'] === 'City'
        && (x as Record<string, unknown>)['name']) {
      return String((x as Record<string, unknown>)['name']);
    }
  }
  return 'West Hollywood';
}

export function mergeCredentials<T extends Record<string, unknown>>(schema: T): T & {
  legalName: string;
  hasCredential: EducationalOccupationalCredential[];
} {
  const out: Record<string, unknown> = {
    ...schema,
    legalName: LEGAL_NAME,
    hasCredential: [...CANONICAL_CREDENTIALS]
  };
  // Google Rich Results requires `address` on LocalBusiness. Inject a city-level
  // PostalAddress (no streetAddress) when absent. Only for LB/HACB @types, and
  // never overwrites an existing address (pin pages keep their full street address).
  if (LB_TYPES.has(out['@type'] as string) && !out['address']) {
    const locality = deriveLocality(out);
    out['address'] = {
      '@type': 'PostalAddress',
      addressLocality: locality,
      addressRegion: 'CA',
      // ZIP only for the WeHo default identity — city-derived localities have no
      // reliable city→ZIP mapping here and stay ZIP-less (address itself is what
      // Google requires; streetAddress stays pin-page-only either way).
      ...(locality === 'West Hollywood' ? { postalCode: WEHO_ZIP } : {}),
      addressCountry: 'US'
    };
  }
  // Google recommends `telephone` on LocalBusiness. Geo-neutral schemas default
  // to the WeHo pin line; pages that set their own branch phone are untouched.
  if (LB_TYPES.has(out['@type'] as string) && !out['telephone']) {
    out['telephone'] = DEFAULT_TELEPHONE;
  }
  return out as T & {
    legalName: string;
    hasCredential: EducationalOccupationalCredential[];
  };
}
