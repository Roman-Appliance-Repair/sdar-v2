// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.join(__dirname, 'src', 'pages');

// Git lastmod map: POSIX-relative path → ISO commit date.
// Source priority:
//   1. scripts/git-mtime-map.json — pre-built snapshot committed to repo;
//      always present on Cloudflare Pages (shallow clone) builds.
//   2. live `git log` invocation — used locally when JSON is missing/empty.
// fs.statSync mtime and today's date are tertiary fallbacks per-URL.
let _gitMtimeMap = null;
function getGitMtimeMap() {
  if (_gitMtimeMap) return _gitMtimeMap;
  _gitMtimeMap = new Map();

  const jsonPath = path.join(__dirname, 'scripts', 'git-mtime-map.json');
  try {
    if (fs.existsSync(jsonPath)) {
      const obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      for (const [k, v] of Object.entries(obj)) _gitMtimeMap.set(k, v);
      if (_gitMtimeMap.size > 0) {
        console.log(`[sitemap] git lastmod map: ${_gitMtimeMap.size} files (from scripts/git-mtime-map.json)`);
        return _gitMtimeMap;
      }
    }
  } catch (e) {
    console.warn('[sitemap] failed to read git-mtime-map.json:', e.message);
  }

  try {
    const out = execSync('git log --name-only --pretty=format:__SDAR_DATE__%cI', {
      encoding: 'utf8',
      maxBuffer: 200 * 1024 * 1024,
      cwd: __dirname,
    });
    let currentDate = null;
    for (const line of out.split('\n')) {
      if (line.startsWith('__SDAR_DATE__')) {
        currentDate = line.slice('__SDAR_DATE__'.length);
      } else if (line && currentDate && !_gitMtimeMap.has(line)) {
        _gitMtimeMap.set(line, currentDate);
      }
    }
    console.log(`[sitemap] git lastmod map: ${_gitMtimeMap.size} files (from live git log)`);
  } catch (e) {
    console.warn('[sitemap] git lastmod unavailable, using fs.statSync fallback');
  }
  return _gitMtimeMap;
}

function findFileForUrl(urlPath) {
  const trimmed = urlPath.replace(/^\/+|\/+$/g, '');
  if (trimmed === '') return path.join(PAGES_DIR, 'index.astro');

  const direct = path.join(PAGES_DIR, trimmed + '.astro');
  if (fs.existsSync(direct)) return direct;

  const indexed = path.join(PAGES_DIR, trimmed, 'index.astro');
  if (fs.existsSync(indexed)) return indexed;

  // Walk parametric routes
  const segments = trimmed.split('/');
  for (let i = segments.length; i >= 1; i--) {
    const fixedParts = segments.slice(0, i - 1);
    const dirPath = fixedParts.length ? path.join(PAGES_DIR, ...fixedParts) : PAGES_DIR;
    if (!fs.existsSync(dirPath)) continue;

    let entries;
    try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { continue; }

    if (i === segments.length) {
      const paramFile = entries.find(e => e.isFile() && /^\[.+\]\.astro$/.test(e.name));
      if (paramFile) return path.join(dirPath, paramFile.name);
    }

    const paramDir = entries.find(e => e.isDirectory() && /^\[.+\]$/.test(e.name));
    if (paramDir) {
      const remaining = segments.slice(i);
      const subDirPath = path.join(dirPath, paramDir.name);
      const c1 = path.join(subDirPath, remaining.join('/') + '.astro');
      if (fs.existsSync(c1)) return c1;
      const c2 = path.join(subDirPath, ...remaining, 'index.astro');
      if (fs.existsSync(c2)) return c2;
      if (remaining.length === 1) {
        try {
          const subEntries = fs.readdirSync(subDirPath, { withFileTypes: true });
          const subParam = subEntries.find(e => e.isFile() && /^\[.+\]\.astro$/.test(e.name));
          if (subParam) return path.join(subDirPath, subParam.name);
        } catch {}
      }
    }
  }
  return null;
}

function getLastmodForUrl(itemUrl) {
  try {
    const urlPath = new URL(itemUrl).pathname;
    const filePath = findFileForUrl(urlPath);
    if (!filePath) return new Date().toISOString();

    const relPath = path.relative(__dirname, filePath).replace(/\\/g, '/');
    const gitDate = getGitMtimeMap().get(relPath);
    if (gitDate) return gitDate;

    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

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
  integrations: [
    react(),
    sitemap({
      serialize(item) {
        item.lastmod = getLastmodForUrl(item.url);
        return item;
      },
    }),
  ],
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
    // C17 BBQ Grill — F&P outdoor grill is sold as DCS (single product line under
    // F&P umbrella; "Fisher & Paykel BBQ" is not a separate product). Updated
    // 2026-05-04 to bypass the /brands/dcs-grill-repair/ → /outdoor/brands/dcs/
    // Wave 6c chain — direct to canonical target.
    '/brands/fisher-paykel-bbq-grill-repair/': '/outdoor/brands/dcs/',
    // Cluster 08 Residential Microwave — service-hub rename (11th project-wide;
    // ~4,000+ imp aggregate — LARGEST residential-track single-URL equity item.
    // 0 brand-level 301s for C08 per Gap #80 exhaustive probe 2026-04-21: 0% brand-URL
    // hit rate on 15 URLs; low-ticket-price-appliance economic pattern.)
    '/services/microwave-repair-los-angeles/': '/services/microwave-repair/',

    // ====================================================================
    // Wave 6c — Outdoor brand tree consolidation (9 brands: 8 grill + 1 smoker)
    // Legacy /brands/{brand}-grill-repair/ → canonical /outdoor/brands/{brand}/
    // Source files deleted; Astro emits redirect HTML at legacy slot.
    // Traeger activated 2026-05-04 after Wave 6a smoker pillar landed;
    // canonical lives at /outdoor/smoker-repair/brands/traeger/ (not /outdoor/brands/)
    // because Traeger is a pellet smoker, not a grill.
    // ====================================================================
    '/brands/alfresco-grill-repair/': '/outdoor/brands/alfresco/',
    '/brands/dcs-grill-repair/': '/outdoor/brands/dcs/',
    '/brands/fire-magic-grill-repair/': '/outdoor/brands/fire-magic/',
    '/brands/hestan-outdoor-grill-repair/': '/outdoor/brands/hestan/',
    '/brands/kalamazoo-grill-repair/': '/outdoor/brands/kalamazoo/',
    '/brands/lynx-grill-repair/': '/outdoor/brands/lynx/',
    '/brands/twin-eagles-grill-repair/': '/outdoor/brands/twin-eagles/',
    '/brands/wolf-outdoor-grill-repair/': '/outdoor/brands/wolf/',
    '/brands/traeger-grill-repair/': '/outdoor/smoker-repair/brands/traeger/',

    // ====================================================================
    // Wave 16 — Fagor washing machine activated 2026-05-04
    // 17 imp/mo legacy. Temp redirect to washer-repair pillar pending
    // Cluster 10 Commercial Laundry brand pages deployed Wave 20.
    // Fagor washing-machine redirect resolved: now points to dedicated Fagor
    // Industrial brand page (Onnera Group, distinct corporate entity from
    // residential Fagor Electrodomésticos consumer brand).
    // ====================================================================
    '/fagor-washing-machine-repair/': '/commercial/washer-repair/brands/fagor-industrial/',

    // NOTE: Deferred items (NOT added this commit):
    // - /beko-dishwasher-repair/ + /smeg-dishwasher-repair/ → residential track
    //   (T1/T2 residential analyst owns these at cutover)
    // - C10 Commercial Laundry (13 items) + C11 Commercial Exhaust Hoods redirects
    //   pending C10 + C11 writer deployment
    // - Residential-track 301s (C04 Oven, C05 Wall Oven, C06 Dishwasher, C07 Stove)
    //   managed by T1/T2 residential writer
    // - Delete-only legacy pages (Sterling-Pro, Adler, JLA, Blakeslee, Washtech,
    //   Comenda, Classeq, Wexiödisk) — not 301 candidates; verify existence + delete
    //   at cutover per C05 manifest "delete-only legacy pages" section

    // ====================================================================
    // Wave 32 — Migration Redirects (Ahrefs 416 + GSC 153 high-traffic URLs)
    // 507 entries (546 total - 39 dedup'd against pre-existing more-specific targets).
    // Source files attached 2026-05-05; missing-target substitutions in commit msg.
    // ====================================================================

    // === Wave 32 :: A_brand_prefix_appliance_repair | Brand-prefix legacy URLs (existing 301s on old site) (15) ===
    '/brand-amana-appliance-repair/': '/brands/amana-refrigerator-repair/',
    '/brand-asko-appliance-repair/': '/brands/asko-dishwasher-repair/',
    '/brand-dacor-appliance-repair/': '/brands/dacor-oven-repair/',
    '/brand-fisher-paykel-appliance-repair/': '/brands/fisher-paykel-refrigerator-repair/',
    '/brand-gaggenau-appliance-repair/': '/brands/gaggenau-oven-repair/',
    '/brand-haier-appliance-repair/': '/brands/haier-refrigerator-repair/',
    '/brand-hotpoint-appliance-repair/': '/services/refrigerator-repair/',
    '/brand-jannair-appliance-repair/': '/brands/jennair-refrigerator-repair/',
    '/brand-kitchenaid-appliance-repair/': '/brands/kitchenaid-refrigerator-repair/',
    '/brand-magic-chef-appliance-repair/': '/services/refrigerator-repair/',
    '/brand-miele-appliance-repair/': '/brands/miele-refrigerator-repair/',
    '/brand-roper-appliance-repair/': '/services/washer-repair/',
    '/brand-speed-queen-appliance-repair/': '/brands/speed-queen-washer-dryer-repair/',

    // === Wave 32 :: B_brands_no_category | /brands/{brand}/ category-less URLs ===
    // Wave 40b removed: sub-zero, thermador, miele, viking (intra-brand 301s).
    // Wave 40c removed: amana, bosch, dacor, frigidaire, ge, haier, jennair,
    //   kitchenaid, lg, maytag, samsung, whirlpool (same intra-brand pattern,
    //   2044-5928 word pillars wrongly hidden). Pillars + category pages now
    //   coexist; cross-link via internal href, never via 301.
    // Surviving rules below are off-brand routings (we don't pillar these brands)
    // or deprecated-URL cleanup — intentional, do not remove.
    '/brands/blomberg/': '/services/refrigerator-repair/',
    '/brands/commercial-and-household/': '/brands/',
    '/brands/hotpoint/': '/services/refrigerator-repair/',
    '/brands/magic-chef/': '/services/refrigerator-repair/',
    '/brands/roper/': '/services/washer-repair/',
    // Wave 43 Batch 1 — slug-asymmetry fix: pillar renamed to match
    // combo prefix (ge-cafe-*-repair, ge-profile-*-repair).
    '/brands/cafe/': '/brands/ge-cafe/',
    '/brands/profile/': '/brands/ge-profile/',

    // === Wave 32 :: C_brands_repair_suffix | /brands/{brand}-repair/ legacy variants (7) ===
    '/brands/electrolux-repair/': '/brands/electrolux-refrigerator-repair/',
    '/brands/frigidaire-repair/': '/brands/frigidaire-refrigerator-repair/',
    '/brands/ge-repair/': '/brands/ge-refrigerator-repair/',
    '/brands/kenmore-repair/': '/brands/kenmore/',
    '/brands/samsung-repair/': '/brands/samsung-refrigerator-repair/',
    '/brands/whirlpool-repair/': '/brands/whirlpool-refrigerator-repair/',

    // === Wave 32 :: D_flat_LA_brand_appliance | /{brand}-{appliance}-repair-los-angeles/ flat WordPress (38) ===
    '/amana-freezer-repair-los-angeles/': '/brands/amana-refrigerator-repair/',
    '/amana-stove-repair-los-angeles/': '/brands/amana-range-repair/',
    '/amana-washer-repair-los-angeles/': '/brands/amana-laundry-repair/',
    '/balancing-freezer-repair-los-angeles/': '/services/freezer-repair/',
    '/blomberg-washer-repair-los-angeles/': '/services/washer-repair/',
    '/bosch-stove-repair-los-angeles/': '/brands/bosch-range-repair/',
    '/bosch-washer-repair-los-angeles/': '/brands/bosch-washer-repair/',
    '/dacor-freezer-repair-los-angeles/': '/brands/dacor-refrigerator-repair/',
    '/danby-freezer-repair-los-angeles/': '/services/freezer-repair/',
    '/electrolux-freezer-repair-los-angeles/': '/brands/electrolux-refrigerator-repair/',
    '/electrolux-stove-repair-los-angeles/': '/brands/electrolux-oven-repair/',
    '/electrolux-washer-repair-los-angeles/': '/brands/electrolux-washer-repair/',
    '/fisher-and-paykel-washer-repair-los-angeles/': '/brands/fisher-paykel-washer-repair/',
    '/fisher-paykel-freezer-repair-los-angeles/': '/brands/fisher-paykel-refrigerator-repair/',
    '/frigidaire-freezer-repair-los-angeles/': '/brands/frigidaire-freezer-repair/',
    '/frigidaire-stove-repair-los-angeles/': '/brands/frigidaire-range-repair/',
    '/frigidaire-washer-repair-los-angeles/': '/brands/frigidaire-washer-repair/',
    '/galanz-freezer-repair-los-angeles/': '/services/freezer-repair/',
    '/ge-freezer-repair-los-angeles/': '/brands/ge-refrigerator-repair/',
    '/ge-stove-repair-los-angeles/': '/brands/ge-stove-repair/',
    '/ge-washer-repair-los-angeles/': '/brands/ge-washer-repair/',
    '/haier-stove-repair-los-angeles/': '/brands/haier-oven-repair/',
    '/jenn-air-stove-repair-los-angeles/': '/brands/jennair-stove-repair/',
    '/kenmore-freezer-repair-los-angeles/': '/brands/kenmore/',
    '/kenmore-stove-repair-los-angeles/': '/brands/kenmore-oven-repair/',
    '/kenmore-washer-repair-los-angeles/': '/brands/kenmore/',
    '/kitchenaid-stove-repair-los-angeles/': '/brands/kitchenaid-oven-repair/',
    '/lg-freezer-repair-los-angeles/': '/brands/lg-freezer-repair/',
    '/lg-washer-repair-los-angeles/': '/brands/lg-washer-repair/',
    '/magic-chef-freezer-repair-los-angeles/': '/services/freezer-repair/',
    '/maytag-freezer-repair-los-angeles/': '/brands/maytag-refrigerator-repair/',
    '/maytag-washer-repair-los-angeles/': '/brands/maytag-washer-repair/',
    '/miele-washer-repair-los-angeles/': '/brands/miele-washer-repair/',
    '/monogram-freezer-repair-los-angeles/': '/brands/ge-monogram-refrigerator-repair/',
    '/whirlpool-washer-repair-los-angeles/': '/brands/whirlpool-washer-repair/',

    // === Wave 32 :: E_areas | /areas/{city}/ legacy area pattern (30) ===
    '/areas/alhambra/': '/alhambra/',
    '/areas/appliance-repair-anaheim/': '/anaheim/',
    '/areas/beverly-hills/': '/beverly-hills/',
    '/areas/brentwood/': '/brentwood/',
    '/areas/burbank/': '/burbank/',
    '/areas/culver-city/': '/culver-city/',
    '/areas/downtown-los-angeles/': '/los-angeles/',
    '/areas/east-hollywood/': '/hollywood/',
    '/areas/glassell-park/': '/glassell-park/',
    '/areas/glendale/': '/glendale/',
    '/areas/glessell-park/': '/glassell-park/',
    '/areas/hollywood-hills/': '/hollywood/',
    '/areas/hollywood/': '/hollywood/',
    '/areas/ladera-heights/': '/culver-city/',
    '/areas/los-angeles-and-surrounding-areas/': '/los-angeles/',
    '/areas/los-angeles/': '/los-angeles/',
    '/areas/los-feliz/': '/los-feliz/',
    '/areas/malibu/': '/malibu/',
    '/areas/marina-del-rey/': '/marina-del-rey/',
    '/areas/monterey-park/': '/monterey-park/',
    '/areas/north-hollywood/': '/north-hollywood/',
    '/areas/pacific-palisades/': '/pacific-palisades/',
    '/areas/pasadena/': '/pasadena/',
    '/areas/playa-del-rey/': '/marina-del-rey/',
    '/areas/san-marino/': '/san-marino/',
    '/areas/santa-monica/': '/santa-monica/',
    '/areas/silver-lake/': '/silver-lake/',
    '/areas/south-pasadena/': '/south-pasadena/',
    '/areas/thousand-oaks/': '/thousand-oaks/',
    '/areas/west-hollywood/': '/west-hollywood/',

    // === Wave 32 :: F_city_x_service_404_fallbacks | City × service Ahrefs 404 fallbacks (299) ===
    '/alhambra/cooktop-repair/': '/alhambra/',
    '/alhambra/dishwasher-repair/': '/alhambra/',
    '/alhambra/dryer-repair/': '/alhambra/',
    '/alhambra/freezer-repair/': '/alhambra/',
    '/alhambra/oven-repair/': '/alhambra/',
    '/alhambra/refrigerator-repair/': '/alhambra/',
    '/alhambra/washer-repair/': '/alhambra/',
    '/alhambra/wine-cooler-repair/': '/alhambra/',
    '/arcadia/cooktop-repair/': '/arcadia/',
    '/arcadia/dishwasher-repair/': '/arcadia/',
    '/arcadia/dryer-repair/': '/arcadia/',
    '/arcadia/freezer-repair/': '/arcadia/',
    '/arcadia/oven-repair/': '/arcadia/',
    '/arcadia/refrigerator-repair/': '/arcadia/',
    '/arcadia/washer-repair/': '/arcadia/',
    '/arcadia/wine-cooler-repair/': '/arcadia/',
    '/atwater-village/cooktop-repair/': '/atwater-village/',
    '/atwater-village/dishwasher-repair/': '/atwater-village/',
    '/atwater-village/dryer-repair/': '/atwater-village/',
    '/atwater-village/freezer-repair/': '/atwater-village/',
    '/atwater-village/oven-repair/': '/atwater-village/',
    '/atwater-village/refrigerator-repair/': '/atwater-village/',
    '/atwater-village/washer-repair/': '/atwater-village/',
    '/atwater-village/wine-cooler-repair/': '/atwater-village/',
    '/bel-air/cooktop-repair/': '/bel-air/',
    '/bel-air/dishwasher-repair/': '/bel-air/',
    '/bel-air/freezer-repair/': '/bel-air/',
    '/bel-air/ice-machine-repair/': '/bel-air/',
    '/bel-air/oven-repair/': '/bel-air/',
    '/bel-air/refrigerator-repair/': '/bel-air/',
    '/bel-air/washer-repair/': '/bel-air/',
    '/bel-air/wine-cellar-repair/': '/bel-air/',
    '/beverly-hills/ice-machine-repair/': '/beverly-hills/',
    '/brentwood/cooktop-repair/': '/brentwood/',
    '/brentwood/dishwasher-repair/': '/brentwood/',
    '/brentwood/freezer-repair/': '/brentwood/',
    '/brentwood/ice-maker-repair/': '/brentwood/',
    '/brentwood/oven-repair/': '/brentwood/',
    '/brentwood/refrigerator-repair/': '/brentwood/',
    '/brentwood/washer-repair/': '/brentwood/',
    '/brentwood/wine-cooler-repair/': '/brentwood/',
    '/calabasas/cooktop-repair/': '/calabasas/',
    '/calabasas/dishwasher-repair/': '/calabasas/',
    '/calabasas/dryer-repair/': '/calabasas/',
    '/calabasas/outdoor-appliance-repair/': '/calabasas/',
    '/calabasas/oven-repair/': '/calabasas/',
    '/calabasas/refrigerator-repair/': '/calabasas/',
    '/calabasas/washer-repair/': '/calabasas/',
    '/calabasas/wine-cellar-repair/': '/calabasas/',
    // Wave 40b removed /commercial/dryer-repair/ redirect — the .astro source
    // is a 5378-word content page. The redirect was over-aggressive Wave 32
    // catch-all. Page now lives at its natural URL.
    '/costa-mesa/cooktop-repair/': '/costa-mesa/',
    '/costa-mesa/dishwasher-repair/': '/costa-mesa/',
    '/costa-mesa/dryer-repair/': '/costa-mesa/',
    '/costa-mesa/freezer-repair/': '/costa-mesa/',
    '/costa-mesa/oven-repair/': '/costa-mesa/',
    '/costa-mesa/refrigerator-repair/': '/costa-mesa/',
    '/costa-mesa/washer-repair/': '/costa-mesa/',
    '/costa-mesa/wine-cooler-repair/': '/costa-mesa/',
    '/culver-city/cooktop-repair/': '/culver-city/',
    '/culver-city/dishwasher-repair/': '/culver-city/',
    '/culver-city/dryer-repair/': '/culver-city/',
    '/culver-city/freezer-repair/': '/culver-city/',
    '/culver-city/oven-repair/': '/culver-city/',
    '/culver-city/refrigerator-repair/': '/culver-city/',
    '/culver-city/washer-repair/': '/culver-city/',
    '/culver-city/wine-cooler-repair/': '/culver-city/',
    '/eagle-rock/cooktop-repair/': '/eagle-rock/',
    '/eagle-rock/dishwasher-repair/': '/eagle-rock/',
    '/eagle-rock/dryer-repair/': '/eagle-rock/',
    '/eagle-rock/freezer-repair/': '/eagle-rock/',
    '/eagle-rock/oven-repair/': '/eagle-rock/',
    '/eagle-rock/refrigerator-repair/': '/eagle-rock/',
    '/eagle-rock/washer-repair/': '/eagle-rock/',
    '/eagle-rock/wine-cooler-repair/': '/eagle-rock/',
    '/el-segundo/cooktop-repair/': '/el-segundo/',
    '/el-segundo/dishwasher-repair/': '/el-segundo/',
    '/el-segundo/dryer-repair/': '/el-segundo/',
    '/el-segundo/freezer-repair/': '/el-segundo/',
    '/el-segundo/oven-repair/': '/el-segundo/',
    '/el-segundo/refrigerator-repair/': '/el-segundo/',
    '/el-segundo/washer-repair/': '/el-segundo/',
    '/el-segundo/wine-cooler-repair/': '/el-segundo/',
    '/encino/cooktop-repair/': '/encino/',
    '/encino/dishwasher-repair/': '/encino/',
    '/encino/dryer-repair/': '/encino/',
    '/encino/freezer-repair/': '/encino/',
    '/encino/oven-repair/': '/encino/',
    '/encino/refrigerator-repair/': '/encino/',
    '/encino/washer-repair/': '/encino/',
    '/encino/wine-cellar-repair/': '/encino/',
    '/glassell-park/cooktop-repair/': '/glassell-park/',
    '/glassell-park/dishwasher-repair/': '/glassell-park/',
    '/glassell-park/dryer-repair/': '/glassell-park/',
    '/glassell-park/freezer-repair/': '/glassell-park/',
    '/glassell-park/oven-repair/': '/glassell-park/',
    '/glassell-park/refrigerator-repair/': '/glassell-park/',
    '/glassell-park/washer-repair/': '/glassell-park/',
    '/glassell-park/wine-cooler-repair/': '/glassell-park/',
    '/highland-park/cooktop-repair/': '/highland-park/',
    '/highland-park/dishwasher-repair/': '/highland-park/',
    '/highland-park/dryer-repair/': '/highland-park/',
    '/highland-park/freezer-repair/': '/highland-park/',
    '/highland-park/oven-repair/': '/highland-park/',
    '/highland-park/refrigerator-repair/': '/highland-park/',
    '/highland-park/washer-repair/': '/highland-park/',
    '/highland-park/wine-cooler-repair/': '/highland-park/',
    '/hollywood/cooktop-repair/': '/hollywood/',
    '/hollywood/range-hood-repair/': '/hollywood/',
    '/hollywood/wine-cooler-repair/': '/hollywood/',
    '/huntington-beach/dishwasher-repair/': '/huntington-beach/',
    '/huntington-beach/dryer-repair/': '/huntington-beach/',
    '/huntington-beach/freezer-repair/': '/huntington-beach/',
    '/huntington-beach/ice-machine-repair/': '/huntington-beach/',
    '/huntington-beach/outdoor-appliance-repair/': '/huntington-beach/',
    '/huntington-beach/oven-repair/': '/huntington-beach/',
    '/huntington-beach/refrigerator-repair/': '/huntington-beach/',
    '/huntington-beach/washer-repair/': '/huntington-beach/',
    '/koreatown/cooktop-repair/': '/koreatown/',
    '/koreatown/dishwasher-repair/': '/koreatown/',
    '/koreatown/dryer-repair/': '/koreatown/',
    '/koreatown/freezer-repair/': '/koreatown/',
    '/koreatown/oven-repair/': '/koreatown/',
    '/koreatown/refrigerator-repair/': '/koreatown/',
    '/koreatown/washer-repair/': '/koreatown/',
    '/la-canada-flintridge/cooktop-repair/': '/la-canada-flintridge/',
    '/la-canada-flintridge/dishwasher-repair/': '/la-canada-flintridge/',
    '/la-canada-flintridge/dryer-repair/': '/la-canada-flintridge/',
    '/la-canada-flintridge/freezer-repair/': '/la-canada-flintridge/',
    '/la-canada-flintridge/oven-repair/': '/la-canada-flintridge/',
    '/la-canada-flintridge/refrigerator-repair/': '/la-canada-flintridge/',
    '/la-canada-flintridge/washer-repair/': '/la-canada-flintridge/',
    '/la-canada-flintridge/wine-cooler-repair/': '/la-canada-flintridge/',
    '/laguna-beach/cooktop-repair/': '/laguna-beach/',
    '/laguna-beach/dishwasher-repair/': '/laguna-beach/',
    '/laguna-beach/ice-machine-repair/': '/laguna-beach/',
    '/laguna-beach/outdoor-appliance-repair/': '/laguna-beach/',
    '/laguna-beach/oven-repair/': '/laguna-beach/',
    '/laguna-beach/refrigerator-repair/': '/laguna-beach/',
    '/laguna-beach/washer-repair/': '/laguna-beach/',
    '/laguna-beach/wine-cellar-repair/': '/laguna-beach/',
    '/los-angeles/wine-cellar-repair/': '/los-angeles/',
    '/los-feliz/cooktop-repair/': '/los-feliz/',
    '/los-feliz/dishwasher-repair/': '/los-feliz/',
    '/los-feliz/dryer-repair/': '/los-feliz/',
    '/los-feliz/freezer-repair/': '/los-feliz/',
    '/los-feliz/ice-maker-repair/': '/los-feliz/',
    '/los-feliz/oven-repair/': '/los-feliz/',
    '/los-feliz/refrigerator-repair/': '/los-feliz/',
    '/los-feliz/washer-repair/': '/los-feliz/',
    '/malibu/bbq-repair/': '/malibu/',
    '/malibu/cooktop-repair/': '/malibu/',
    '/malibu/dishwasher-repair/': '/malibu/',
    '/malibu/freezer-repair/': '/malibu/',
    '/malibu/oven-repair/': '/malibu/',
    '/malibu/refrigerator-repair/': '/malibu/',
    '/malibu/washer-repair/': '/malibu/',
    '/malibu/wine-cooler-repair/': '/malibu/',
    '/manhattan-beach/cooktop-repair/': '/manhattan-beach/',
    '/manhattan-beach/dishwasher-repair/': '/manhattan-beach/',
    '/manhattan-beach/dryer-repair/': '/manhattan-beach/',
    '/manhattan-beach/freezer-repair/': '/manhattan-beach/',
    '/manhattan-beach/oven-repair/': '/manhattan-beach/',
    '/manhattan-beach/refrigerator-repair/': '/manhattan-beach/',
    '/manhattan-beach/washer-repair/': '/manhattan-beach/',
    '/manhattan-beach/wine-cooler-repair/': '/manhattan-beach/',
    '/marina-del-rey/dishwasher-repair/': '/marina-del-rey/',
    '/marina-del-rey/dryer-repair/': '/marina-del-rey/',
    '/marina-del-rey/freezer-repair/': '/marina-del-rey/',
    '/marina-del-rey/oven-repair/': '/marina-del-rey/',
    '/marina-del-rey/refrigerator-repair/': '/marina-del-rey/',
    '/marina-del-rey/washer-repair/': '/marina-del-rey/',
    '/marina-del-rey/wine-cooler-repair/': '/marina-del-rey/',
    '/monrovia/cooktop-repair/': '/monrovia/',
    '/monrovia/dishwasher-repair/': '/monrovia/',
    '/monrovia/dryer-repair/': '/monrovia/',
    '/monrovia/freezer-repair/': '/monrovia/',
    '/monrovia/oven-repair/': '/monrovia/',
    '/monrovia/refrigerator-repair/': '/monrovia/',
    '/monrovia/washer-repair/': '/monrovia/',
    '/monrovia/wine-cooler-repair/': '/monrovia/',
    '/newport-beach/cooktop-repair/': '/newport-beach/',
    '/newport-beach/dishwasher-repair/': '/newport-beach/',
    '/newport-beach/ice-machine-repair/': '/newport-beach/',
    '/newport-beach/outdoor-appliance-repair/': '/newport-beach/',
    '/newport-beach/oven-repair/': '/newport-beach/',
    '/newport-beach/refrigerator-repair/': '/newport-beach/',
    '/newport-beach/washer-repair/': '/newport-beach/',
    '/newport-beach/wine-cellar-repair/': '/newport-beach/',
    '/north-hollywood/cooktop-repair/': '/north-hollywood/',
    '/north-hollywood/dishwasher-repair/': '/north-hollywood/',
    '/north-hollywood/dryer-repair/': '/north-hollywood/',
    '/north-hollywood/freezer-repair/': '/north-hollywood/',
    '/north-hollywood/oven-repair/': '/north-hollywood/',
    '/north-hollywood/refrigerator-repair/': '/north-hollywood/',
    '/north-hollywood/washer-repair/': '/north-hollywood/',
    '/pacific-palisades/cooktop-repair/': '/pacific-palisades/',
    '/pacific-palisades/dishwasher-repair/': '/pacific-palisades/',
    '/pacific-palisades/freezer-repair/': '/pacific-palisades/',
    '/pacific-palisades/oven-repair/': '/pacific-palisades/',
    '/pacific-palisades/refrigerator-repair/': '/pacific-palisades/',
    '/pacific-palisades/washer-repair/': '/pacific-palisades/',
    '/pacific-palisades/wine-cooler-repair/': '/pacific-palisades/',
    '/redondo-beach/cooktop-repair/': '/redondo-beach/',
    '/redondo-beach/dishwasher-repair/': '/redondo-beach/',
    '/redondo-beach/dryer-repair/': '/redondo-beach/',
    '/redondo-beach/freezer-repair/': '/redondo-beach/',
    '/redondo-beach/oven-repair/': '/redondo-beach/',
    '/redondo-beach/refrigerator-repair/': '/redondo-beach/',
    '/redondo-beach/washer-repair/': '/redondo-beach/',
    '/redondo-beach/wine-cooler-repair/': '/redondo-beach/',
    '/san-gabriel/cooktop-repair/': '/san-gabriel/',
    '/san-gabriel/dishwasher-repair/': '/san-gabriel/',
    '/san-gabriel/dryer-repair/': '/san-gabriel/',
    '/san-gabriel/freezer-repair/': '/san-gabriel/',
    '/san-gabriel/oven-repair/': '/san-gabriel/',
    '/san-gabriel/refrigerator-repair/': '/san-gabriel/',
    '/san-gabriel/washer-repair/': '/san-gabriel/',
    '/san-gabriel/wine-cooler-repair/': '/san-gabriel/',
    '/san-marino/cooktop-repair/': '/san-marino/',
    '/san-marino/dishwasher-repair/': '/san-marino/',
    '/san-marino/freezer-repair/': '/san-marino/',
    '/san-marino/ice-machine-repair/': '/san-marino/',
    '/san-marino/oven-repair/': '/san-marino/',
    '/san-marino/refrigerator-repair/': '/san-marino/',
    '/san-marino/washer-repair/': '/san-marino/',
    '/san-marino/wine-cellar-repair/': '/san-marino/',
    '/sherman-oaks/cooktop-repair/': '/sherman-oaks/',
    '/sherman-oaks/dishwasher-repair/': '/sherman-oaks/',
    '/sherman-oaks/dryer-repair/': '/sherman-oaks/',
    '/sherman-oaks/freezer-repair/': '/sherman-oaks/',
    '/sherman-oaks/oven-repair/': '/sherman-oaks/',
    '/sherman-oaks/refrigerator-repair/': '/sherman-oaks/',
    '/sherman-oaks/washer-repair/': '/sherman-oaks/',
    '/sherman-oaks/wine-cellar-repair/': '/sherman-oaks/',
    '/silver-lake/cooktop-repair/': '/silver-lake/',
    '/silver-lake/dishwasher-repair/': '/silver-lake/',
    '/silver-lake/dryer-repair/': '/silver-lake/',
    '/silver-lake/freezer-repair/': '/silver-lake/',
    '/silver-lake/oven-repair/': '/silver-lake/',
    '/silver-lake/refrigerator-repair/': '/silver-lake/',
    '/silver-lake/washer-repair/': '/silver-lake/',
    '/silver-lake/wine-cooler-repair/': '/silver-lake/',
    '/south-pasadena/cooktop-repair/': '/south-pasadena/',
    '/south-pasadena/dishwasher-repair/': '/south-pasadena/',
    '/south-pasadena/dryer-repair/': '/south-pasadena/',
    '/south-pasadena/freezer-repair/': '/south-pasadena/',
    '/south-pasadena/oven-repair/': '/south-pasadena/',
    '/south-pasadena/refrigerator-repair/': '/south-pasadena/',
    '/south-pasadena/washer-repair/': '/south-pasadena/',
    '/south-pasadena/wine-cooler-repair/': '/south-pasadena/',
    '/studio-city/cooktop-repair/': '/studio-city/',
    '/studio-city/dishwasher-repair/': '/studio-city/',
    '/studio-city/dryer-repair/': '/studio-city/',
    '/studio-city/freezer-repair/': '/studio-city/',
    '/studio-city/oven-repair/': '/studio-city/',
    '/studio-city/refrigerator-repair/': '/studio-city/',
    '/studio-city/washer-repair/': '/studio-city/',
    '/studio-city/wine-cellar-repair/': '/studio-city/',
    '/tarzana/cooktop-repair/': '/tarzana/',
    '/tarzana/dishwasher-repair/': '/tarzana/',
    '/tarzana/dryer-repair/': '/tarzana/',
    '/tarzana/freezer-repair/': '/tarzana/',
    '/tarzana/oven-repair/': '/tarzana/',
    '/tarzana/refrigerator-repair/': '/tarzana/',
    '/tarzana/washer-repair/': '/tarzana/',
    '/tarzana/wine-cooler-repair/': '/tarzana/',
    '/temple-city/cooktop-repair/': '/temple-city/',
    '/temple-city/dishwasher-repair/': '/temple-city/',
    '/temple-city/dryer-repair/': '/temple-city/',
    '/temple-city/freezer-repair/': '/temple-city/',
    '/temple-city/oven-repair/': '/temple-city/',
    '/temple-city/refrigerator-repair/': '/temple-city/',
    '/temple-city/washer-repair/': '/temple-city/',
    '/temple-city/wine-cooler-repair/': '/temple-city/',
    '/thousand-oaks/wine-cellar-repair/': '/thousand-oaks/',
    '/westlake-village/cooktop-repair/': '/westlake-village/',
    '/westlake-village/dishwasher-repair/': '/westlake-village/',
    '/westlake-village/dryer-repair/': '/westlake-village/',
    '/westlake-village/freezer-repair/': '/westlake-village/',
    '/westlake-village/oven-repair/': '/westlake-village/',
    '/westlake-village/refrigerator-repair/': '/westlake-village/',
    '/westlake-village/washer-repair/': '/westlake-village/',
    '/westlake-village/wine-cellar-repair/': '/westlake-village/',
    '/westwood/cooktop-repair/': '/westwood/',
    '/westwood/dishwasher-repair/': '/westwood/',
    '/westwood/dryer-repair/': '/westwood/',
    '/westwood/freezer-repair/': '/westwood/',
    '/westwood/oven-repair/': '/westwood/',
    '/westwood/refrigerator-repair/': '/westwood/',
    '/westwood/washer-repair/': '/westwood/',
    '/westwood/wine-cooler-repair/': '/westwood/',
    '/woodland-hills/cooktop-repair/': '/woodland-hills/',
    '/woodland-hills/dishwasher-repair/': '/woodland-hills/',
    '/woodland-hills/dryer-repair/': '/woodland-hills/',
    '/woodland-hills/freezer-repair/': '/woodland-hills/',
    '/woodland-hills/oven-repair/': '/woodland-hills/',
    '/woodland-hills/refrigerator-repair/': '/woodland-hills/',
    '/woodland-hills/washer-repair/': '/woodland-hills/',
    '/woodland-hills/wine-cooler-repair/': '/woodland-hills/',

    // === Wave 32 :: G_pricing | /pricing/ → /price-list/ (1) ===
    '/pricing/': '/price-list/',

    // === Wave 32 :: H_services_LA_suffix | /services/{X}-los-angeles/ legacy services (GSC: high impressions) (36) ===
    '/services/air-conditioner-repair-los-angeles/': '/services/',
    '/services/commercial-dishwasher-repair-los-angeles/': '/commercial/dishwasher-repair/',
    '/services/commercial-dryer-repair-los-angeles/': '/commercial/washer-repair/',
    '/services/commercial-freezer-repair-los-angeles/': '/commercial/refrigeration/',
    '/services/commercial-ice-machine-repair-los-angeles/': '/commercial/ice-machines/',
    '/services/commercial-laundry-machine-repair-los-angeles/': '/commercial/washer-repair/',
    '/services/commercial-refrigerator-repair-los-angeles/': '/commercial/refrigeration/',
    '/services/commercial-showcase-refrigerator-repair-los-angeles/': '/commercial/refrigeration/',
    '/services/commercial-slushie-machine-repair-los-angeles/': '/commercial/ice-machines/',
    '/services/commercial-walk-in-cooler-repair-los-angeles/': '/commercial/refrigeration/walk-in-cooler-repair/',
    '/services/commercial-walk-in-freezer-repair-los-angeles/': '/commercial/refrigeration/walk-in-freezer-repair/',
    '/services/commercial-washing-machine-repair-los-angeles/': '/commercial/washer-repair/',
    '/services/cooktop-repair-los-angeles/': '/services/cooktop-repair/',
    '/services/dishwasher-repair-los-angeles/': '/services/dishwasher-repair/',
    '/services/dryer-repair-los-angeles/': '/services/dryer-repair/',
    '/services/fireplace-repair-los-angeles/': '/services/',
    '/services/freezer-repair-los-angeles/': '/services/freezer-repair/',
    '/services/furnace-repair-los-angeles/': '/services/',
    '/services/heat-pump-repair-los-angeles/': '/services/',
    '/services/hvac-repair-los-angeles/': '/services/',
    '/services/induction-cooktop-repair-los-angeles/': '/services/cooktop-repair/',
    '/services/oven-repair-los-angeles/': '/services/oven-repair/',
    '/services/range-repair-los-angeles/': '/services/range-repair/',
    '/services/refrigerator-repair-los-angeles/': '/services/refrigerator-repair/',
    '/services/stove-repair-los-angeles/': '/services/stove-repair/',
    '/services/wall-heater-repair-los-angeles/': '/services/',
    '/services/washing-machine-repair-los-angeles/': '/services/washer-repair/',
    '/services/water-heater-repair-los-angeles/': '/services/',

    // === Wave 32 :: I_brands_nested_old_wp | /brands/{brand}/{brand}-{cat}-repair/ nested WordPress (GSC) (17) ===
    '/brands/bertazzoni/bertazzoni-refrigerator-repair/': '/brands/bertazzoni-refrigerator-repair/',
    '/brands/bosch/bosch-dryer-repair/': '/brands/bosch-dryer-repair/',
    '/brands/bosch/bosch-refrigerator-repair/': '/brands/bosch-refrigerator-repair/',
    '/brands/fisher-paykel/fisher-paykel-dryer-repair/': '/brands/fisher-paykel-washer-repair/',
    '/brands/frigidaire/frigidaire-refrigerator-repair/': '/brands/frigidaire-refrigerator-repair/',
    '/brands/gaggenau/gaggenau-refrigerator-repair/': '/brands/gaggenau-oven-repair/',
    '/brands/ge-monogram/monogram-refrigerator-repair/': '/brands/ge-monogram-refrigerator-repair/',
    '/brands/jennair/jennair-refrigerator-repair/': '/brands/jennair-refrigerator-repair/',
    '/brands/kenmore/kenmore-refrigerator-repair/': '/brands/kenmore/',
    '/brands/kitchenaid/kitchenaid-refrigerator-repair/': '/brands/kitchenaid-refrigerator-repair/',
    '/brands/maytag/maytag-refrigerator-repair/': '/brands/maytag-refrigerator-repair/',
    '/brands/miele/miele-refrigerator-repair/': '/brands/miele-refrigerator-repair/',
    '/brands/samsung/samsung-refrigerator-repair/': '/brands/samsung-refrigerator-repair/',
    '/brands/speed-queen/speed-queen-dryer-repair/': '/brands/speed-queen-washer-dryer-repair/',
    '/brands/sub-zero/sub-zero-refrigerator-repair/': '/brands/sub-zero-refrigerator-repair/',
    '/brands/whirlpool/whirlpool-refrigerator-repair/': '/brands/whirlpool-refrigerator-repair/',

    // === Wave 32 :: K_top_level_legacy_brand_repair | /{brand}-{cat}-repair/ top-level WordPress (GSC: 53 brands!) (53) ===
    '/arctic-air-refrigeration-repair/': '/commercial/refrigeration/',
    '/avantco-ice-machine-repair/': '/commercial/ice-machines/',
    '/beko-dishwasher-repair/': '/commercial/dishwasher-repair/',
    '/classeq-dishwasher-repair/': '/commercial/dishwasher-repair/',
    '/coldline-refrigeration-repair/': '/commercial/refrigeration/',
    '/comenda-dishwasher-repair/': '/commercial/dishwasher-repair/',
    '/continental-commercial-dryer-repair/': '/commercial/washer-repair/',
    '/doyon-commercial-ovens-repair/': '/commercial/oven-repair/',
    '/everest-refrigeration-repair/': '/commercial/refrigeration/',
    '/felix-storch-refrigeration-repair/': '/commercial/refrigeration/',
    '/frigoglass-refrigeration-repair/': '/commercial/refrigeration/',
    '/hoshizaki-refrigeration-repair/': '/commercial/refrigeration/',
    '/huebsch-commercial-dryer-repair/': '/commercial/washer-repair/',
    '/jla-dishwasher-repair/': '/commercial/dishwasher-repair/',
    '/marsal-pizza-ovens-repair/': '/commercial/pizza-oven-repair/',
    '/maxx-cold-refrigeration-repair/': '/commercial/refrigeration/',
    '/maytag-commercial-dryer-repair/': '/commercial/washer-repair/',
    '/migali-refrigeration-repair/': '/commercial/refrigeration/',
    '/milnor-commercial-dryer-repair/': '/commercial/washer-repair/',
    '/milnor-washing-machine-repair/': '/commercial/washer-repair/',
    '/randell-refrigeration-repair/': '/commercial/refrigeration/',
    '/summit-appliance-refrigeration-repair/': '/commercial/refrigeration/',
    '/taylor-soft-serve-machines-repair/': '/commercial/ice-machines/',
    '/turbo-air-refrigeration-repair/': '/commercial/refrigeration/',
    '/unimac-commercial-dryer-repair/': '/commercial/washer-repair/',
    '/wascomat-commercial-dryer-repair/': '/commercial/washer-repair/',
    '/wascomat-washing-machine-repair/': '/commercial/washer-repair/',
    '/washtech-dishwasher-repair/': '/commercial/dishwasher-repair/',
    '/whirlpool-commercial-dryer-repair/': '/commercial/washer-repair/',

    // === Wave 32 :: L_credentials_old_slug | /credentials/{X}-appliance-repair/ → /credentials/{X}/ (6) ===
    '/credentials/background-checked-appliance-repair/': '/credentials/background-checked/',
    '/credentials/bbb-accredited-appliance-repair/': '/credentials/bbb-accredited/',
    '/credentials/epa-certified-appliance-repair/': '/credentials/epa-certified/',
    '/credentials/insured-appliance-repair/': '/credentials/insured/',
    '/credentials/licensed-appliance-repair/': '/credentials/licensed/',
    '/credentials/osha-certified-appliance-repair/': '/credentials/osha-certified/',

    // === Wave 32 :: M_blog_old | /blog/best-dishwashing-machines-2024/ legacy blog post (1) ===
    '/blog/best-dishwashing-machines-2024/': '/blog/',

    // === Wave 32 :: N_hvac | /hvac/{X}/ HVAC moved out (1) ===
    '/hvac/air-duct-cleaning/': '/services/',

    // === Wave 32 :: O_price_list_dryer_subs | /price-list/dryer-{part}-replacement-cost/ → /price-list/dryer-repair-cost/ (8) ===
    '/price-list/dryer-heating-element-replacement-cost/': '/price-list/dryer-repair-cost/',
    '/price-list/dryer-idler-pulley-replacement-cost/': '/price-list/dryer-repair-cost/',
    '/price-list/dryer-igniter-replacement-cost/': '/price-list/dryer-repair-cost/',
    '/price-list/dryer-motor-replacement-cost/': '/price-list/dryer-repair-cost/',
    '/price-list/dryer-roller-replacement-cost/': '/price-list/dryer-repair-cost/',
    '/price-list/dryer-thermal-fuse-replacement-cost/': '/price-list/dryer-repair-cost/',
    '/price-list/dryer-vent-installation-cost/': '/price-list/dryer-vent-repair-cost/',
    '/price-list/lg-dryer-repair-cost/': '/price-list/dryer-repair-cost/',

    // === Wave 32 :: P_misc | /reviews-page/, /schedule/, /directories/ (3) ===
    '/directories/': '/',
    '/reviews-page/': '/',
    '/schedule/': '/book/',

    // === Wave 32 :: Z_other | Z_other (3) ===
    '/koreatown/commercial-refrigeration/': '/koreatown/',
    '/marina-del-rey/commercial/': '/marina-del-rey/',
    '/north-hollywood/commercial/': '/north-hollywood/',
  },
});
