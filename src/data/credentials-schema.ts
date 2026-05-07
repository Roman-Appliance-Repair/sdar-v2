// src/data/credentials-schema.ts
//
// Canonical credentials + legal-name SSOT for JSON-LD LocalBusiness schemas.
// Aligned with docs/seo-policies.md §1 (FINAL 2026-05-07) and
// docs/factual-accuracy.md §3.
//
// Apply via mergeCredentials(schema) helper. Idempotent: rerunning is safe.

export const LEGAL_NAME = 'HVAC 777 LLC';

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
export function mergeCredentials<T extends Record<string, unknown>>(schema: T): T & {
  legalName: string;
  hasCredential: EducationalOccupationalCredential[];
} {
  return {
    ...schema,
    legalName: LEGAL_NAME,
    hasCredential: [...CANONICAL_CREDENTIALS]
  };
}
