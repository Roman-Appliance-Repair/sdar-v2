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
import { BRANCHES, toE164 } from './branches';
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

/** CSLB C-20 HVAC #1138898 — INACTIVE since 2026-08-22 (bonds and workers' comp
 *  cancelled). While false, CSLB is left out of every hasCredential array, the
 *  footer, the marine trust bars, the /credentials/licensed/ comparison block and
 *  the legal pages. Flip to true after the license is reactivated (prose sentences
 *  were rewritten separately — see docs/factual-accuracy.md §3). */
export const CSLB_ACTIVE = false;
export const CSLB_LICENSE_NUMBER = '1138898';

const CSLB_CREDENTIAL: EducationalOccupationalCredential = {
  '@type': 'EducationalOccupationalCredential',
  credentialCategory: 'CSLB C-20 HVAC',
  recognizedBy: {
    '@type': 'GovernmentOrganization',
    name: 'California Contractors State License Board'
  }
};

/** Spread into any hand-written hasCredential array: `...CSLB_CREDENTIALS`. */
export const CSLB_CREDENTIALS: EducationalOccupationalCredential[] = CSLB_ACTIVE ? [CSLB_CREDENTIAL] : [];

/** Same switch for pages whose JSON-LD is a hand-written template string:
 *  interpolate `${CSLB_CREDENTIALS_JSON}` right before the BBB entry. */
export const CSLB_CREDENTIALS_JSON: string = CSLB_ACTIVE ? JSON.stringify(CSLB_CREDENTIAL) + ', ' : '';

/** Canonical array applied to every LocalBusiness schema site-wide.
 *  Order: BHGS (state license) → EPA 608 (federal cert) → CSLB C-20 (state license,
 *  only while CSLB_ACTIVE) → BBB Accredited Business (never "A+"). */
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
  ...CSLB_CREDENTIALS,
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
  // to the WeHo pin line; pages that set their own branch phone keep that number —
  // only its formatting is canonicalised (see toE164 below).
  if (LB_TYPES.has(out['@type'] as string) && !out['telephone']) {
    out['telephone'] = DEFAULT_TELEPHONE;
  }
  // NAP: one telephone spelling site-wide. The GBP card returns E.164 with no
  // separators (+13238704790) and so does every Google listing, so that is the
  // canonical form. Digits are never changed — only the punctuation around them.
  if (typeof out['telephone'] === 'string') {
    out['telephone'] = toE164(out['telephone'] as string);
  }
  // Branch entries embedded via `location` carry their own number; canonicalise
  // those too, otherwise county hubs keep emitting the display format.
  if (Array.isArray(out['location'])) {
    out['location'] = (out['location'] as unknown[]).map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const e = entry as Record<string, unknown>;
      if (typeof e['telephone'] !== 'string') return entry;
      return { ...e, telephone: toE164(e['telephone'] as string) };
    });
  }
  return out as T & {
    legalName: string;
    hasCredential: EducationalOccupationalCredential[];
  };
}
