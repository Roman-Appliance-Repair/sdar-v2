# SDAR v2 — Project Structure

_Verified against Notion SSOT on 2026-04-16_

```
src/pages/
│
├── index.astro              ← homepage (Luxury Editorial + AI Diagnostic)
├── about.astro              ⚫ to write
├── contact.astro            ⚫ to write
├── book.astro               ⚫ to write
├── 404.astro                ⚫ to write
├── privacy-policy.astro     🔒 Twilio-approved — DO NOT EDIT
├── terms.astro              🔒 Twilio-approved — DO NOT EDIT
│
├── services/                   — 22 home appliance pages
├── commercial/                 — 17 commercial equipment pages
│
├── brands/
│   ├── [residential brands]    — <slug>-appliance-repair.astro (~44)
│   ├── commercial-dishwashers/ — 20 pages ✅ all deployed
│   └── commercial-refrigeration/ — 6 pages (Hoshizaki, Traulsen, etc.)
│
├── credentials/                — 8 pages (CSLB, BBB, EPA, OSHA, etc.)
├── for-business/               — 6 pages (restaurants, hotels, ...)
├── price-list/                 — 36 pages (21 residential + 15 commercial)
├── blog/                       — [slug].astro dynamic (~20 posts planned)
│
├── [city].astro                — ~94 city pages flat at root
└── [county-hub].astro          — 5 county hubs flat at root

src/data/                    ← shared data: branches.ts, cities.ts, services.ts
src/components/              ← Layout, MegaMenu, TrustBar, Footer, AiDiagnostic
src/layouts/                 ← Layout.astro
src/styles/                  ← global.css

functions/api/               ← CF Pages Functions: contact.js, diagnose.js
public/                      ← _headers, robots.txt, favicons
```

## Naming conventions (SEO-clean)

| Type | Pattern | Example |
|---|---|---|
| Service page | `<appliance>-repair.astro` | `refrigerator-repair.astro` |
| Commercial service | `<equipment>-repair.astro` | `walk-in-cooler-repair.astro` |
| Residential brand | `<brand>-appliance-repair.astro` | `wolf-appliance-repair.astro` |
| Commercial DW brand | `<brand>-dishwasher-repair.astro` | `hobart-dishwasher-repair.astro` |
| Commercial refrig. brand | `<brand>-commercial-repair.astro` | `hoshizaki-commercial-repair.astro` |
| Price-list item | `<item>-repair-cost.astro` | `washer-repair-cost.astro` |
| City page | `<city-slug>.astro` | `west-hollywood.astro` |
| County hub | `<county>-county.astro` | `los-angeles-county.astro` |

**Rule:** NO `brand-` prefix on residential brand pages. `brand-wolf-appliance-repair.astro` → `wolf-appliance-repair.astro`. The `/brands/` folder already provides category context; duplicate keywords hurt SEO.

## Pages to NEVER remove (live traffic — 8 files at root)

- `mainstreet-equipment-commercial-ovens-repair.astro`
- `lang-commercial-ovens-repair.astro`
- `bki-commercial-ovens-repair.astro`
- `cma-dishmachines-repair.astro`
- `huebsch-commercial-dryer-repair.astro`
- `lincoln-commercial-ovens-repair.astro`
- `marsal-pizza-ovens-repair.astro`
- `turbochef-commercial-ovens-repair.astro`
