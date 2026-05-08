// src/lib/build-service-catalog.ts
//
// Renders the canonical OfferCatalog JSON-LD graph node from the SSOT in
// src/data/service-catalog.ts. Emitted exactly once on the homepage @graph
// (via HomepageSchema.astro); all other pages reference it by @id —
// `https://samedayappliance.repair/#service-catalog` — without duplicating
// the 48-service payload.
//
// Output structure (per Phase 3 spec):
//   OfferCatalog (root, @id = #service-catalog)
//     itemListElement[]:
//       OfferCatalog (sub, @id = #catalog-{slug})
//         itemListElement[]:
//           Offer (@id = #offer-{slug})
//             itemOffered: Service (@id = #service-{slug})
//             priceSpecification (omitted for HVAC quote-based)
//
// Each Service carries provider (@id ref to Organization) + areaServed (5
// SoCal counties). Pre-computed AREAS_SERVED constant avoids re-allocating
// the 5-county array per service (48× over 48 services would be 240 small
// objects otherwise).

import {
  SERVICE_CATALOG_ID,
  SUB_CATALOGS,
  priceTierToPrice,
  DIAGNOSTIC_DESCRIPTION,
  type SubCatalog,
  type CatalogService
} from '../data/service-catalog';

const SITE_URL = 'https://samedayappliance.repair';
const ORG_REF_ID = `${SITE_URL}/#organization`;

const AREAS_SERVED = [
  { '@type': 'AdministrativeArea', name: 'Los Angeles County' },
  { '@type': 'AdministrativeArea', name: 'Orange County' },
  { '@type': 'AdministrativeArea', name: 'Ventura County' },
  { '@type': 'AdministrativeArea', name: 'San Bernardino County' },
  { '@type': 'AdministrativeArea', name: 'Riverside County' }
];

function buildOffer(service: CatalogService): Record<string, unknown> {
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    '@id': `${SITE_URL}/#offer-${service.id}`,
    itemOffered: {
      '@type': 'Service',
      '@id': `${SITE_URL}/#service-${service.id}`,
      name: service.name,
      description: service.description,
      serviceType: 'Appliance Repair',
      provider: { '@id': ORG_REF_ID },
      areaServed: AREAS_SERVED
    }
  };

  // priceSpecification — only for $89 / $120 tiers. HVAC services are
  // quote-based and intentionally omit the field per Phase 3 spec.
  const price = priceTierToPrice(service.priceTier);
  if (price !== null) {
    offer.priceSpecification = {
      '@type': 'PriceSpecification',
      price,
      priceCurrency: 'USD',
      description: DIAGNOSTIC_DESCRIPTION
    };
  }

  return offer;
}

function buildSubCatalog(sub: SubCatalog): Record<string, unknown> {
  return {
    '@type': 'OfferCatalog',
    '@id': `${SITE_URL}/#${sub.id}`,
    name: sub.name,
    itemListElement: sub.services.map(buildOffer)
  };
}

/** Build the canonical OfferCatalog @graph node. Emit once on the homepage;
 *  reference everywhere else by `{ "@id": SERVICE_CATALOG_ID }`. */
export function buildServiceCatalogSchema(): Record<string, unknown> {
  return {
    '@type': 'OfferCatalog',
    '@id': SERVICE_CATALOG_ID,
    name: 'Same Day Appliance Repair Services',
    itemListElement: SUB_CATALOGS.map(buildSubCatalog)
  };
}

/** Reusable @id reference object for hasOfferCatalog fields on Organization
 *  and LocalBusiness entities. Single canonical anchor avoids payload
 *  duplication across the 8 LocalBusiness entries on the homepage. */
export const SERVICE_CATALOG_REF = { '@id': SERVICE_CATALOG_ID };
