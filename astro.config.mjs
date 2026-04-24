// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://samedayappliance.repair',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  redirects: {
    // ====================================================================
    // Pre-existing redirects (preserved from original config)
    // ====================================================================
    '/brand-thermador-appliance-repair/': '/brands/thermador/',
    '/brands/thermador-wall-oven-repair/': '/brands/thermador-oven-repair/',
    '/brand-subzero-appliance-repair/': '/brands/sub-zero/',
    '/sub-zero-freezer-repair-los-angeles/': '/brands/sub-zero-refrigerator-repair/',
    '/miele-stove-repair-los-angeles/': '/brands/miele/',

    // Viking cluster — канонизация URL structure + kill matrix cannibalization
    '/brands/viking-repair/': '/brands/viking/',
    '/brands/viking/viking-refrigerator-repair/': '/brands/viking-refrigerator-repair/',
    '/brands/viking/viking-range-repair/': '/brands/viking-range-repair/',
    '/brands/viking/viking-bbq-grill-repair/': '/brands/viking-bbq-grill-repair/',
    '/brands/viking/viking-oven-repair/': '/brands/viking-oven-repair/',
    '/brands/viking/viking-cooktop-repair/': '/brands/viking-cooktop-repair/',

    // ====================================================================
    // Commercial cluster 301s — legacy WordPress → sdar-v2 migration
    // Source: wiki/decisions/legacy-migration-301-manifest.md
    // All targets verified deployed on origin/main 2026-04-21
    // ====================================================================

    // Cluster 02 Commercial Refrigeration (1)
    '/aht-cooling-systems-refrigeration-repair/': '/brands/aht-cooling-systems-refrigeration-repair/',

    // Cluster 05 Commercial Dishwashers (7 — Fagor washing-machine deferred to C10;
    // Beko + SMEG residential-track managed by T1/T2)
    '/jackson-dishwasher-repair/': '/brands/jackson-dishwasher-repair/',
    '/fagor-dishwasher-repair/': '/brands/fagor-dishwasher-repair/',
    '/cma-dishmachines-repair/': '/brands/cma-dishmachines-repair/',
    '/winterhalter-dishwasher-repair/': '/brands/winterhalter-dishwasher-repair/',
    '/champion-dishwasher-repair/': '/brands/champion-dishwasher-repair/',
    '/meiko-dishwasher-repair/': '/brands/meiko-dishwasher-repair/',
    '/hobart-dishwasher-repair/': '/brands/hobart-dishwasher-repair/',

    // Cluster 06 Commercial Fryer (1 — service-hub rename)
    '/services/commercial-fryer-machine-repair-los-angeles/': '/commercial/fryer-repair/',

    // Cluster 07 Commercial Ovens — own targets (12)
    '/mainstreet-equipment-commercial-ovens-repair/': '/brands/mainstreet-equipment-oven-repair/',
    '/turbochef-commercial-ovens-repair/': '/brands/turbochef-rapid-cook-oven-repair/',
    '/lang-commercial-ovens-repair/': '/brands/lang-oven-repair/',
    '/montague-commercial-ovens-repair/': '/brands/montague-oven-repair/',
    '/bki-commercial-ovens-repair/': '/brands/bki-rotisserie-repair/',
    '/imperial-commercial-ovens-repair/': '/brands/imperial-oven-repair/',
    '/blodgett-commercial-ovens-repair/': '/brands/blodgett-oven-repair/',
    '/rational-commercial-ovens-repair/': '/brands/rational-combi-oven-repair/',
    '/kratos-commercial-ovens-repair/': '/brands/kratos-oven-repair/',
    '/vulcan-commercial-ovens-repair/': '/brands/vulcan-oven-repair/',
    '/southbend-commercial-ovens-repair/': '/brands/southbend-oven-repair/',
    '/alto-shaam-commercial-ovens-repair/': '/brands/alto-shaam-oven-repair/',

    // Cluster 07 cross-cluster routing — C07 legacy URL → other-cluster target
    // per Gap #81 tree-primary-product rule (Lincoln → C09, Garland → C08, Bakers Pride → C09)
    '/lincoln-commercial-ovens-repair/': '/brands/lincoln-pizza-oven-repair/',
    '/garland-commercial-ovens-repair/': '/brands/garland-range-repair/',
    '/bakers-pride-commercial-ovens-repair/': '/brands/bakers-pride-pizza-oven-repair/',

    // Cluster 07 mention-only + skip legacy pages → service hub (4)
    '/equipex-commercial-ovens-repair/': '/commercial/oven-repair/',
    '/merrychef-commercial-ovens-repair/': '/commercial/oven-repair/',
    '/fwe-commercial-ovens-repair/': '/commercial/oven-repair/',
    '/peerless-commercial-ovens-repair/': '/commercial/pizza-oven-repair/',

    // Cluster 07 service-hub rename (1)
    '/services/commercial-oven-repair-los-angeles/': '/commercial/oven-repair/',

    // Cluster 08 Commercial Stove/Range (1 — service-hub rename;
    // Garland brand 301 already covered in C07 section above per cross-cluster inheritance)
    '/services/commercial-stove-repair-los-angeles/': '/commercial/stove-repair/',

    // Cluster 09 Commercial Pizza Ovens (1 own — Middleby Marshall NEW legacy
    // discovered via Gap #80 GSC cross-check; pattern -conveyor-ovens-repair is
    // distinct from C07's -commercial-ovens-repair pattern, which DDG site-crawl
    // missed. Lincoln + Bakers Pride + Peerless already covered in C07 section above.)
    '/middleby-marshall-conveyor-ovens-repair/': '/brands/middleby-marshall-pizza-oven-repair/',

    // Cluster 03 Commercial Ice Machines (1 — Scotsman mislocation fix from
    // legacy WP Service 1 Dishwasher category. Scotsman has no dishwasher line;
    // legacy URL was a wrong-category mislocation. Activated with C03 writer
    // deployment per wiki/decisions/legacy-migration-301-manifest.md.
    // Target verified deployed: /brands/scotsman-ice-machine-repair/.)
    '/scotsman-dishwasher-repair/': '/brands/scotsman-ice-machine-repair/',

    // ====================================================================
    // Residential cluster 301s — Cluster 07 Stove Tier 1 legacy equity
    // Source: wiki/page-plans/residential/07-stove.md §3.7 Legacy Preservation
    // Legacy URLs probed 2026-04-21; all verified live at origin domain.
    // ====================================================================

    // Cluster 07 Residential Stove Tier 1 (5 — Wolf from prior Tier 1 partial 09d3bbb + 4 mass-market this commit)
    '/wolf-stove-repair-los-angeles/': '/brands/wolf-stove-repair/',
    '/lg-stove-repair-los-angeles/': '/brands/lg-stove-repair/',
    '/samsung-stove-repair-los-angeles/': '/brands/samsung-stove-repair/',
    '/whirlpool-stove-repair-los-angeles/': '/brands/whirlpool-stove-repair/',
    '/maytag-stove-repair-los-angeles/': '/brands/maytag-stove-repair/',
    // Cluster 17 Residential BBQ Grill (1 — service-hub rename)
    '/services/bbq-grill-repair-los-angeles/': '/services/bbq-grill-repair/',
    // Cluster 18 Residential Range Hood (1 — service-hub rename)
    '/services/range-hood-repair-los-angeles/': '/services/range-hood-repair/',
    // Cluster 15 Residential Wine Cooler + Wine Cellar (2 — DUAL service-hub rename
    // pattern, first instance project-wide; 8th + 9th service-hub-rename 301s)
    '/services/wine-cooler-repair-los-angeles/': '/services/wine-cooler-repair/',
    '/services/wine-cellar-repair-los-angeles/': '/services/wine-cellar-repair/',
    // Cluster 04 Residential Oven — Fisher & Paykel legacy equity (10th project-wide)
    // Legacy WP samedayappliance.repair/fisher-paykel-oven-repair/ ranks #3 DuckDuckGo
    // on "fisher paykel oven repair los angeles" — preserve ranking at sdar-v2 launch.
    '/fisher-paykel-oven-repair/': '/brands/fisher-paykel-oven-repair/',
    // Cluster 08 Residential Microwave — service-hub rename (11th project-wide;
    // ~4,000+ imp aggregate — LARGEST residential-track single-URL equity item.
    // 0 brand-level 301s for C08 per Gap #80 exhaustive probe 2026-04-21: 0% brand-URL
    // hit rate on 15 URLs; low-ticket-price-appliance economic pattern.)
    '/services/microwave-repair-los-angeles/': '/services/microwave-repair/',

    // NOTE: Deferred items (NOT added this commit):
    // - /fagor-washing-machine-repair/ → target TBD
    //   (C10 Commercial Laundry deferral per C05 Decision 15; activate with C10 writer)
    // - /beko-dishwasher-repair/ + /smeg-dishwasher-repair/ → residential track
    //   (T1/T2 residential analyst owns these at cutover)
    // - C10 Commercial Laundry (13 items) + C11 Commercial Exhaust Hoods redirects
    //   pending C10 + C11 writer deployment
    // - Residential-track 301s (C04 Oven, C05 Wall Oven, C06 Dishwasher, C07 Stove)
    //   managed by T1/T2 residential writer
    // - Delete-only legacy pages (Sterling-Pro, Adler, JLA, Blakeslee, Washtech,
    //   Comenda, Classeq, Wexiödisk) — not 301 candidates; verify existence + delete
    //   at cutover per C05 manifest "delete-only legacy pages" section
  },
});
