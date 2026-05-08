# SITE_ARCHITECTURE.md

**Project:** sdar-v2 (Same Day Appliance Repair)
**Domain:** samedayappliance.repair
**Snapshot:** Post-Wave-33 production-ready state (2026-05-05)
**Build:** 1,009 pages green, Astro SSG → Cloudflare Pages

---

## 1. Executive Summary

sdar-v2 is a static-generated Astro site for an LA-area appliance repair business covering 87 cities × 15 service categories with parametric content, plus brand pages, commercial verticals, blog, and price-list. ~1,009 pages, 572 redirects, single-domain canonical at `samedayappliance.repair`. Authoritative business identity (NAP, license, pricing) lives in `src/data/`; content composition for parametric pages lives in `src/data/city-service-matrix.ts` + `city-service-content.ts`. Operating under voice rules + banned-phrase restrictions documented in `CLAUDE.md` (project root). DNS cutover from legacy WordPress pending.

---

## 2. Tech Stack

**Framework:** Astro 6.1.7 (SSG, `output: 'static'`, `format: 'directory'`, `trailingSlash: 'always'`)
**Hosting:** Cloudflare Pages (auto-deploy on `git push origin main`)
**Node:** ≥22.12.0 (per `package.json` engines)
**Sitemap:** `@astrojs/sitemap` 3.7.2 → `dist/sitemap-index.xml` + `sitemap-0.xml`
**Image:** `sharp` ^0.34.5 (devDependencies, used by `convert-service-photos.mjs` script)
**No CSS framework**: scoped Astro component styles + global `src/styles/`. No Tailwind, no Sass.
**No SSR/hybrid**: pure static generation.
**Prefetch:** `prefetchAll: true`, `defaultStrategy: 'hover'`.

**Scripts (`package.json`):**
- `npm run dev` → `astro dev` (default port 4321)
- `npm run build` → `astro build` (~40s, outputs to `dist/`)
- `npm run preview` → `astro preview`
- `convert-service-photos` → `node scripts/convert-service-photos.mjs`

**No tests, no linter configured.** Compliance enforced via grep audits + per-wave verification.

---

## 3. Repository Structure

```
sdar-v2/
├── CLAUDE.md                  # Project law (voice, NAP, licensing, banned phrases)
├── README.md
├── SITE_ARCHITECTURE.md       # this document
├── astro.config.mjs           # 572 redirects + sitemap config
├── package.json
├── tsconfig.json
├── public/
│   ├── _headers               # Cloudflare HTTP headers (security + cache)
│   ├── _redirects             # 585 lines (Cloudflare Pages alternate redirect format)
│   ├── robots.txt             # allow-all + sitemap link
│   ├── favicon.ico / favicon.svg
│   ├── images/
│   └── maps/
├── src/
│   ├── data/                  # SSOT for content composition (see §4)
│   ├── layouts/               # 4 layouts (see §5)
│   ├── components/            # 16 root + 17 cities/v2 + 12 homepage (see §6)
│   ├── pages/                 # ~830 .astro pages (see §7)
│   └── styles/
├── functions/api/             # Cloudflare Pages Functions (minimal)
├── scripts/                   # cleanup + audit scripts (gitignored where transient)
└── _legacy-archive/           # gitignored, original WordPress imports
```

---

## 4. Data Layer

All site content composition is driven by `src/data/`. These files are the Source of Truth — never hardcode addresses, phones, prices, or city/service slugs in pages.

| File | Records | Purpose |
|---|---|---|
| `branches.ts` | 8 active + 2 pending | 8 branch entities with `slug`, `fullName`, `phone`, `email`, `geo.cityCenterLat/Lng`, `streetAddress` (only WeHo physical_pin populated). Exports `BRANCHES`, `MAIN_PHONE`. |
| `cities.ts` | 87 | `{ slug, name, county, primaryBranch }`. Maps city → dispatching branch. |
| `services.ts` | ~30 | Service slugs + display labels. |
| `counties.ts` | 5 | LA, Orange, Ventura, San Bernardino, Riverside. |
| `county-boundaries.ts` | 5 GeoJSON | Used by `CountyMap.astro` Leaflet integration. |
| `city-service-matrix.ts` | 200 combos | Hubs (8) × 15 services + non-hub (5) × 15 services + Hollywood × 5 Tier 1. Drives `[city]/[service].astro` parametric template. |
| `city-service-content.ts` | 14 city descriptors + 15 service descriptors | Per-city + per-service blocks: `tier`, `neighborhoods`, `climateNote`, `waterNote`, `homeStock`, `serviceContext`. Service: `failurePatterns`, `brandPool*`, `pricingTable`. |
| `business-hours.ts` | 1 schema | `OPENING_HOURS_SCHEMA` for JSON-LD. Mon-Sat 8-8, Sun closed. Phones 24/7. |
| `credentials.ts` | License records | BHGS #A49573, EPA 608 #1346255700410, BBB A+. |
| `faq.ts` | Shared FAQs | Reusable Q&A library. |
| `homepage-services.ts` | Homepage cards | Service grid for index. |
| `pricing.ts` | Diagnostic tiers | $89 res / $120 commercial / $120 outdoor. |
| `repair-estimates.ts` | Cost matrix | Drives `/price-list/` cost calculator pages. |
| `testimonials.ts` | Reviews | NOT used in JSON-LD (aggregateRating REMOVED post-Wave 31). |

**Constants enforced via grep audits across pages:**
- `BHGS #A49573` (license)
- `EPA 608 Universal certified (#1346255700410)`
- `$89 residential` / `$120 commercial` / `$120 outdoor`
- `90-day warranty`

---

## 5. Layouts

| File | Purpose | Used by |
|---|---|---|
| `Layout.astro` | Base wrapper. `head-scripts` slot for JSON-LD injection, MegaMenu navbar, Footer. Required props: `title`, `description`. Optional: `canonical`. | All service pillars, brand pages, commercial pages. |
| `BaseLayout.astro` | Older base wrapper retained for legacy pages. | Some `/services/` legacy pages, `/credentials/`. |
| `CityLayoutV2.astro` | City pillar wrapper with v2 design system. Composes 14 cities/v2 components in fixed sequence. | All 87 city pillars (`{city}.astro`). |
| `BlogLayout.astro` | Blog article wrapper. Auto-injects `BlogPosting` + `BreadcrumbList` schemas, related-articles block, CTA footer. Required: `title`, `description`, `slug`, `publishedDate`. Optional: `author`, `readingTime`, `category`. | All 20 blog articles. |

**Schema injection pattern:** Pages emit JSON-LD via `<Fragment slot="head-scripts">` with `<script type="application/ld+json" set:html={JSON.stringify(...)} />`. Layout passes the fragment into `<head>` via the named slot.

---

## 6. Components

### Navigation + Chrome
- `MegaMenu.astro` — top navbar with services/commercial/outdoor mega-dropdowns
- `Footer.astro` — global footer with NAP, hours, social, legal links
- `Breadcrumbs.astro` — shared breadcrumb trail for service/brand pages
- `BranchesBlock.astro` — 8-branch grid with phones (used on hubs)

### Hero blocks
- `ServiceHero.astro` — residential service pillars + outdoor pillars (BHGS/EPA badge row)
- `CommercialHero.astro` — commercial pillars (commercial-tier framing, $120 dx)

### Trust + CTAs
- `TrustBar.astro` — license badges + BBB + warranty (used on hubs)
- `CTA.astro` — generic call-to-action block (phone + book online buttons)

### Cards + Grids
- `BrandHubPlaceholder.astro` / `BrandDetailPlaceholder.astro` — brand pages scaffolding
- `BrandBranchesGrid.astro` — 8-branch grid for brand pages
- `CountyMap.astro` — Leaflet-based interactive 5-county service-area map (uses `county-boundaries.ts`)
- `AiDiagnostic.astro` — homepage AI tool (uses Cloudflare Pages function)
- `container.astro` — layout primitive

### City v2 Components (`src/components/cities/v2/`)
Used exclusively by `CityLayoutV2.astro` for city pillars in fixed composition order:
1. `HeroSection.astro`
2. `TrustBadgesRow.astro`
3. `IntroNarrative.astro`
4. `ServicesGrid.astro`
5. `CustomNarrative.astro`
6. `ServiceArea.astro`
7. `RecentRepairs.astro`
8. `WhyCallsUsBack.astro`
9. `ReviewsBlock.astro`
10. `PricingCards.astro`
11. `LuxurySpecialists.astro` (premium tiers only)
12. `PropertyManagers.astro` (high-volume cities only)
13. `NeighborhoodPhoto.astro` (decorative)
14. `BookingCard.astro`
15. `FAQAccordion.astro`
16. `AlsoServingNearby.astro`
17. `FinalCTA.astro`

### Homepage Components (`src/components/homepage/`)
- `Hero.astro`, `Services.astro`, `Pricing.astro`, `ServiceArea.astro`, `CountyMap.astro`, `Reviews.astro`, `Credentials.astro`, `FAQ.astro`, `Diagnostics.astro`, `SectionDivider.astro`, `HomepageFooter.astro`, `HomepageSchema.astro`

---

## 7. Page Categories + URL Structure

Total Astro source: ~830 files (excluding `.legacy` backups). Build emits ~1,009 static pages (parametric `[city]/[service].astro` materializes 200 combos at build time).

| Category | URL pattern | Page count | Generation | Sample |
|---|---|---|---|---|
| Homepage | `/` | 1 | static (`src/pages/index.astro`) | — |
| City pillars | `/{city}/` | 87 | static, one file per city | `src/pages/west-hollywood.astro` |
| City × Service combos | `/{city}/{service}/` | 200 | parametric (`[city]/[service].astro` + matrix) | `/west-hollywood/refrigerator-repair/` |
| Service pillars | `/services/{service}-repair/` | ~25 | static | `src/pages/services/refrigerator-repair.astro` |
| Service sub-services | `/services/{service}-repair/{problem}/` | ~50 | static | `src/pages/services/microwave-repair/not-heating.astro` |
| Outdoor pillars | `/outdoor/{category}/` | ~6 | static | `src/pages/outdoor/grill-repair.astro` |
| Outdoor sub-services | `/outdoor/{category}/{problem}/` | ~25 | static | `src/pages/outdoor/fireplace-repair/wont-stay-lit.astro` |
| Outdoor brand pages | `/outdoor/{category}/brands/{brand}/` | ~15 | static | `src/pages/outdoor/smoker-repair/brands/traeger.astro` |
| Commercial hubs | `/commercial/`, `/commercial/refrigeration/`, `/commercial/ice-machines/` | 3 | static | `src/pages/commercial/refrigeration/index.astro` |
| Commercial pillars | `/commercial/{category}-repair/` | ~25 | static | `src/pages/commercial/fryer-repair.astro` |
| Commercial failure-mode subs | `/commercial/{category}-repair/{problem}/` | ~30 | static | `src/pages/commercial/refrigeration/not-cooling.astro` |
| Commercial format-axis subs | `/commercial/{category}-repair/{format}-repair/` | ~10 | static | `src/pages/commercial/fryer-repair/pressure-fryer-repair.astro` |
| Commercial brand pages | `/commercial/{category}-repair/brands/{brand}/` | ~15 | static | `src/pages/commercial/refrigeration/brands/true.astro` |
| Brand pages (residential) | `/brands/{brand-cat}-repair/` | 368 | static | `src/pages/brands/sub-zero-refrigerator-repair.astro` |
| Price list | `/price-list/{slug}-cost/` | 41 | static | `src/pages/price-list/refrigerator-repair-cost.astro` |
| Blog | `/blog/{slug}/` + `/blog/` index | 20 articles + index | static | `src/pages/blog/sub-zero-refrigerator-not-cooling-5-checks.astro` |
| Credentials | `/credentials/{slug}/` | 9 | static | `src/pages/credentials/licensed.astro` |
| For-business | `/for-business/{vertical}/` | 7 | static | `src/pages/for-business/restaurants.astro` |
| Legal / utility | `/book/`, `/contact/`, `/privacy-policy/`, `/terms/`, `/ai-diagnostic/` | 5 | static | `src/pages/contact.astro` |
| Areas index | `/areas/` | 1 | static | `src/pages/areas/index.astro` |

**Parametric template:** `src/pages/[city]/[service].astro` uses `getStaticPaths()` to read `CITY_SERVICE_MATRIX` and emit one static page per combo. Content composed from `CITY_DESCRIPTORS[city]` + `SERVICE_DESCRIPTORS[service]` + intersection rules (brand pool by tier).

**Master plan target reached:** 200/200 city × service combos (8 hubs × 15 + 5 non-hub × 15 + Hollywood × 5).

---

## 8. Schema / SEO Patterns

JSON-LD injected per page type via `head-scripts` slot. Standard schemas by category:

| Page type | Schemas |
|---|---|
| Homepage | `Organization`, `WebSite`, `ContactPoint`, `PostalAddress`, `GeoCoordinates`, `OpeningHoursSpecification` |
| Service pillar | `Service`, `LocalBusiness`, `FAQPage`, `BreadcrumbList` |
| City × Service | `Service`, `LocalBusiness`, `FAQPage`, `BreadcrumbList` |
| City pillar | `HomeAndConstructionBusiness` (with `geo` + `streetAddress` only on WeHo physical_pin), `Place`, `BreadcrumbList` |
| Brand page | `Brand` (with `parentOrganization`), `Service`, `FAQPage`, `BreadcrumbList` |
| Commercial pillar | `LocalBusiness` (with `address` PostalAddress), `Service`, `FAQPage`, `BreadcrumbList` |
| Blog article | `BlogPosting`, `BreadcrumbList` (auto-injected by `BlogLayout.astro`) |
| Outdoor pillar | `LocalBusiness`, `Service`, `FAQPage`, `BreadcrumbList` |

**Removed in Wave 31 cleanup:** `aggregateRating` removed sitewide. Recurring re-injection blocked via grep audits.

**Canonical pattern:** `https://samedayappliance.repair/{path}/` with trailing slash.
**Sitemap:** `dist/sitemap-index.xml` → `sitemap-0.xml` (auto-generated by `@astrojs/sitemap`).
**Robots:** allow-all, sitemap link.
**Open Graph / Twitter Card:** default site title + description from `Layout.astro`.

---

## 9. NAP / Business Data SSOT

Per `CLAUDE.md` §1 + `wiki/decisions/nap-rating-policy-ssot.md`:

**Legal entity:** HVAC 777 LLC dba Same Day Appliance Repair
- Mentioned ONLY on 4 legal pages: `/book/`, `/contact/`, `/privacy-policy/`, `/terms/`
- NOT in JSON-LD anywhere (wave 29 cleanup)

**Mailing address (PostalAddress in schema):**
- 6230 Wilshire Blvd Ste A PMB 2267, Los Angeles CA 90048
- Used in commercial hub schemas + homepage

**Physical pin (geo + streetAddress in schema):**
- 8746 Rangely Ave, West Hollywood CA 90048
- ONLY on `/west-hollywood/` page schema (per NAP policy SSOT)
- Other 86 city pillars use branch geo only (no streetAddress)

**8 active branch phones (`branches.ts`):**
| Branch | Phone |
|---|---|
| West Hollywood (HQ) | (323) 870-4790 |
| Beverly Hills | (424) 248-1199 |
| Los Angeles | (424) 325-0520 ← `MAIN_PHONE` |
| Pasadena | (626) 376-4458 |
| Thousand Oaks | (424) 208-0228 |
| Irvine | (213) 401-9019 |
| Rancho Cucamonga | (909) 457-1030 |
| Temecula | (951) 577-3877 |

**License signals (every service page):**
- BHGS #A49573 (Bureau of Household Goods and Services — appliance repair license)
- EPA 608 Universal certified (#1346255700410) — refrigerant work
- BBB A+ accredited
- CSLB C-38 Refrigeration only on commercial/refrigeration/ pages (correct scope)
- **CSLB C-20 HVAC #1138898** — active license. Used in `src/components/Footer.astro` (visible credentials bar) and `hasCredential` schema across all 1009 pages. (Earlier docs incorrectly described this as legacy/retired; corrected 2026-05-08.)

**Diagnostic pricing tiers (per `CLAUDE.md` §3):**
| Tier | Diagnostic | Waived |
|---|---|---|
| Residential | $89 | yes with repair |
| Commercial | $120 | yes |
| Outdoor (grills, patio heaters, etc.) | $120 | yes (sometimes quote-based on premium brands) |

**90-day warranty** on every repair (parts + labor).

**Hours (`business-hours.ts`):**
- Mon-Fri 7am-9pm
- Sat 8am-7pm
- Sun 9am-5pm
- Phones 24/7

---

## 10. Redirects Inventory

**Total active redirects: 572 in `astro.config.mjs` + 585 lines in `public/_redirects`.**

`astro.config.mjs` redirects are processed at build time (Astro generates HTML stubs). `public/_redirects` is Cloudflare Pages format (alternate routing for some patterns).

Categorized inventory:

| Category | Approx count | Source wave |
|---|---|---|
| Pre-existing brand-prefix legacy | ~25 | Pre-Wave-1 (Viking, Thermador, Sub-Zero canonicalization) |
| Commercial cluster legacy WP | ~33 | Wave 1-3 (Cluster 02-08 manifest) |
| Residential cluster legacy WP | ~31 | Wave 4-10 (C04-C18 stove/wall-oven/etc.) |
| Wave 6c outdoor brand consolidation | ~10 | Wave 6c (Lynx, Fire Magic, etc. → /outdoor/brands/) |
| 5-niche restructure | ~15 | Wave 23-25 (city × service routing) |
| Areas pattern | ~50 | Wave 32 (legacy `/areas/{city}/`) |
| Flat LA pattern | ~80 | Wave 32 (legacy `{service}-{city}-los-angeles/`) |
| City × service 404 fallbacks | ~120 | Wave 32 (city → city pillar fallback) |
| Top-level commercial brands | ~50 | Wave 32 (legacy `/{brand}-commercial-repair/`) |
| Credentials slug update | ~10 | Wave 31 |
| Price-list deep-slug consolidation | ~30 | Wave 32 (sub-cost-pages → category cost page) |
| Misc (`/reviews-page/`, `/schedule/`, `/directories/`) | ~20 | Wave 32 |

---

## 11. Content Methodology

**Voice (`CLAUDE.md` §5):**
- First-person plural always: "we", "our techs", "our guys" (never "I", never "Same Day Appliance Repair offers...")
- Practitioner not marketer: lead technician talking to a customer
- Specific over generic: model numbers, part numbers, dollar ranges, year-patterns
- Honest opinions that contradict industry default (replace-vs-repair, brand X is overrated, etc.)
- LA-specific context (BH, Bel Air, Malibu, Calabasas, etc.)

**Banned phrases (`CLAUDE.md` §4 + Wave 26c additions):**
- AI fillers: "in conclusion", "furthermore", "moreover", "additionally", "in summary", "it's worth noting"
- Marketing tells: "comprehensive solutions", "tailored services", "cutting-edge", "state-of-the-art", "look no further", "one-stop shop"
- Service-industry: "top-notch", "unbeatable", "customer satisfaction is our priority", "fast, friendly, reliable"
- Wave 26c specific: "no surprises", "comprehensive(ly)", "tailored", "hassle-free", "guaranteed satisfaction"
- False urgency: "Don't wait — call now!", "limited time offer", "act fast"

**Em-dash budget:** ≤2 per visible body. Auto-fail above 2 in audits.

**Title length:** 60-90 chars typical (acceptable SEO range).
**Description length target:** 130-155 chars (per Wave 33 audit).

**Required on every service page (`CLAUDE.md` §5):**
- ≥3 specific equipment models with full part numbers
- ≥2 price ranges in concrete dollars
- ≥2 time estimates (minutes/hours)
- ≥3 region-specific references
- ≥1 honest opinion contradicting industry default
- ≥1 composite real-world example with numbers
- License number in body AND footer
- Contact CTA (phone + book online)
- ≥3 internal links to other SDAR pages
- FAQ section (5-7 questions with FAQPage schema)
- Schema.org JSON-LD (4 entities standard)

**Cluster discipline:** close one cluster fully before starting next. Per-cluster section order documented in `CLAUDE.md` §10.

---

## 12. Build + Deployment

**Local development:**
```bash
npm install
npm run dev          # http://localhost:4321
```

**Production build:**
```bash
npm run build        # → dist/
                     # ~1,009 pages, ~40-45s on standard hardware
                     # Generates sitemap-index.xml + sitemap-0.xml
```

**Deployment:**
- `git push origin main` → Cloudflare Pages auto-deploy
- Preview: `sdar-v2.pages.dev`
- Production (post-cutover): `samedayappliance.repair`
- DNS cutover from legacy WordPress pending

**Cloudflare Pages config:**
- `public/_headers` — security headers + cache control (`/_astro/*` immutable 1yr)
- `public/_redirects` — 585 lines, Cloudflare-format redirects (complement to Astro config)
- `functions/api/` — minimal Pages Functions (AI diagnostic endpoint)
- No `wrangler.toml` (Pages-managed)

**Environment:**
- Node 22.12+
- `.dev.vars.example` template for local env vars (Cloudflare Pages Functions)

---

## 13. Maintenance Patterns

### A. Change phone for branch X
```ts
// File: src/data/branches.ts
// Field: branches[X].phone
// Rebuild: yes (used across many pages via MAIN_PHONE import or branch lookup)
```

### B. Add new city pillar
1. Add entry to `src/data/cities.ts` (slug + name + county + primaryBranch)
2. Create `src/pages/{city-slug}.astro` — copy from `west-hollywood.astro` template, adjust content
3. Optionally add city × service combos to `src/data/city-service-matrix.ts`
4. Add city descriptor to `src/data/city-service-content.ts` if you added matrix combos
5. Update internal links in geographically nearby city pages (`AlsoServingNearby` block)

### C. Add new brand page
1. Create `src/pages/brands/{brand-slug}-{cat}-repair.astro`
2. Use existing brand template (e.g. copy `sub-zero-refrigerator-repair.astro`)
3. Add JSON-LD with `Brand` schema + `parentOrganization` (verify factually correct per `CLAUDE.md` §8 brand traps)
4. Cross-link from sibling brand pages (related-brands list)

### D. Update pricing
**Diagnostic tier change affects ALL pages.** Search-replace across codebase. See `CLAUDE.md` §3 for tier rules. Verify with grep audit:
```bash
grep -rln "\\\$89\|\\\$120" src/pages/ src/components/ | wc -l
```

### E. Remove a banned phrase
```bash
grep -rln "{phrase}" src/pages/
# Apply Edit per file with appropriate substitute per §11 voice rules
# Verify: re-grep should return 0
```

### F. Add new service pillar
1. Add to `src/data/services.ts` (slug + label)
2. Create `src/pages/services/{service}-repair.astro` from existing pillar template
3. Decide tier (1/2/3) for hub coverage; add to matrix if Tier 1
4. If matrix-eligible: add `SERVICE_DESCRIPTORS['{service}-repair'] = {...}` to `city-service-content.ts`
5. Update relevant internal link blocks (homepage services grid, MegaMenu, footer)

### G. Add new commercial brand page
1. Create `src/pages/commercial/{category}-repair/brands/{brand}.astro`
2. Use existing commercial brand template (e.g. `commercial/refrigeration/brands/true.astro`)
3. Verify factual: parent org per `CLAUDE.md` §8 (Welbilt vs ITW vs Ali Group, etc.)
4. Cross-link from category pillar's brands section

### H. Add city × service combo for an existing non-hub city
Just extend `NON_HUB_PRIORITY_CITIES.flatMap(...)` in matrix file, or add a new service-tier line. Parametric template auto-emits the new combo at next build.

### I. Update redirect strategy
- New URL → existing path mapping: add to `astro.config.mjs` `redirects` object
- Bulk patterns / regex-style: use `public/_redirects` (Cloudflare Pages format)
- Always verify target exists at next build

### J. Compliance audit (em-dashes, banned phrases, BHGS, EPA)
```bash
# Em-dashes per page (visible body only, after stripping comments + style):
for f in src/pages/{path}/*.astro; do
  body=$(awk '/^---$/{c++; next} c>=2' "$f" | sed '/<style>/,/<\/style>/d' | sed 's/<!--[^>]*-->//g')
  echo "$(basename $f): EM=$(echo "$body" | grep -c '—')"
done

# BHGS presence:
grep -L "BHGS\|A49573" src/pages/{path}/*.astro

# Banned phrases:
grep -rilE "comprehensive|cutting-edge|hassle-free|no surprises" src/pages/
```

---

## 14. Appendix: File Locations Quick Reference

| What | Where |
|---|---|
| Branch phones | `src/data/branches.ts` |
| City list (87) | `src/data/cities.ts` |
| Service slugs | `src/data/services.ts` |
| City × service combos | `src/data/city-service-matrix.ts` |
| Per-city + per-service content blocks | `src/data/city-service-content.ts` |
| Pricing tiers | `src/data/pricing.ts` |
| Hours schema | `src/data/business-hours.ts` |
| Voice rules + banned phrases | `CLAUDE.md` (project root) |
| NAP / rating policy SSOT | `wiki/decisions/nap-rating-policy-ssot.md` |
| 301 manifest | `wiki/decisions/legacy-migration-301-manifest.md` |
| Astro config + redirects | `astro.config.mjs` |
| Cloudflare headers | `public/_headers` |
| Cloudflare redirects (alt format) | `public/_redirects` |
| Robots | `public/robots.txt` |
| City pillar template | `src/pages/west-hollywood.astro` (reference) |
| Service pillar template | `src/pages/services/refrigerator-repair.astro` (reference) |
| Commercial pillar template | `src/pages/commercial/refrigeration/index.astro` (reference) |
| Brand page template | `src/pages/brands/sub-zero-refrigerator-repair.astro` (reference) |
| Blog article template | `src/pages/blog/la-hard-water-killing-dishwasher.astro` (reference) |
| Parametric city × service template | `src/pages/[city]/[service].astro` |
| City layout v2 | `src/layouts/CityLayoutV2.astro` |
| Blog layout | `src/layouts/BlogLayout.astro` |
| Default layout | `src/layouts/Layout.astro` |
| County map (Leaflet) | `src/components/CountyMap.astro` |
| Footer | `src/components/Footer.astro` |
| MegaMenu | `src/components/MegaMenu.astro` |

---

**End of SITE_ARCHITECTURE.md.**
Maintenance: regenerate this document after any major architectural change. Treat as a living reference, not a one-time snapshot.
