# SDAR-v2 — Project Guide for Claude

## What this project is

- **SDAR-v2** = Same Day Appliance Repair, v2 rebuild.
- **Tech:** Astro `^6.1.7` + Cloudflare Pages (server logic in `functions/api/` as Pages Functions).
- **Goal:** SEO-focused multi-location appliance repair site covering Los Angeles, Orange, Ventura, San Bernardino, and Riverside counties.
- **Status:** in development. Not yet on the production domain (`samedayappliance.repair`).

## Knowledge base — READ FIRST

A structured SEO/architecture wiki lives at `C:\Users\Roman\projects\sdar-v2-wiki\sdar-v2-wiki`. **At the start of every session, read these two files first:**

1. `C:\Users\Roman\projects\sdar-v2-wiki\sdar-v2-wiki\index.md` — wiki entry point and section map.
2. `C:\Users\Roman\projects\sdar-v2-wiki\sdar-v2-wiki\CLAUDE.md` — rules for navigating and extending the wiki.

Then drill into the relevant subfolder `index.md` based on the task. Key sections:

- `wiki/architecture/` — how the project is built (Astro config, folder layout, URL structure).
- `wiki/page-templates/` — how each page type is structured (brand hub, brand+appliance, city, service, price-list, …).
- `wiki/seo-patterns/` — H1, meta, schema, and internal-linking conventions.
- `wiki/decisions/sdar-v2-current-status.md` — current state, known issues, migration backlog.
- `wiki/redirects/` — current redirect map and the outstanding 301 backlog.
- `wiki/lessons/` — mistakes and fixes from past sessions.

## Critical known issues — do not forget

Pulled from `wiki/decisions/sdar-v2-current-status.md`. Surface these proactively when relevant:

1. **`/contact/` and `/book/` pages do not exist**, but every brand-page CTA links to them. All those CTAs currently 404.
2. **No sitemap is generated.** `public/robots.txt` references `https://samedayappliance.repair/sitemap-index.xml`, but `@astrojs/sitemap` is not installed and no sitemap file exists in `public/`.
3. **[RESOLVED 2026-04-26]** ~~NAP inconsistency for the West Hollywood branch.~~ See "Known Issue #3: WeHo NAP discrepancy [RESOLVED]" detail block below.
4. **`STRUCTURE.md` is out of date on the brand layer.** It describes ~44 `<brand>-appliance-repair.astro` files and a `commercial-dishwashers/` folder. Reality: ~26 brand hubs at `<brand>.astro` + ~78 combo pages at `<brand>-<appliance>-repair.astro`, and `commercial-dishwashers/` no longer exists.
5. **Two schema-injection patterns coexist.** Newer pages use the `<Fragment slot="head-scripts">` slot in `Layout.astro`. Older pages (e.g. `west-hollywood.astro`, `services/refrigerator-repair.astro`) inline `<script type="application/ld+json">` directly in the body. Tech debt — pick one when refactoring.

## Known Issue #3: WeHo NAP discrepancy [RESOLVED]

**Status:** RESOLVED on 2026-04-26 (commit `5e5e6f4`)
**Resolution:** branches.ts now uses `8746 Rangely Ave, West Hollywood CA 90048` matching the verified GBP listing. Old placeholder `8730 Santa Monica Blvd, 90069` has been removed. The Astro page src/pages/west-hollywood.astro schema was already correct and now matches branches.ts.

**Reference:** wiki/decisions/branch-types-and-public-nap-rules.md

## Writing knowledge back to the wiki

When something durable comes up, capture it in the wiki:

- **Decision with rationale** → `wiki/decisions/`
- **Bug fix or non-obvious finding** → `wiki/lessons/`
- **New page template or content convention** → `wiki/page-templates/` or `wiki/seo-patterns/`

Then:

- Update the relevant subfolder `index.md` with a one-line link to the new page.
- Update the root `index.md` if the new page is important enough to surface from the top.
- Use Obsidian-style `[[double-bracket]]` links for cross-references.

## Project-specific working rules

- Astro components live in `src/components/`, pages in `src/pages/`, layouts in `src/layouts/`.
- Content collections would live in `src/content/` (not currently used — pages are plain `.astro` with content hardcoded).
- **Before creating a new brand or area page**, check the canonical template in `wiki/page-templates/`.
- **Before adding schema markup**, check `wiki/seo-patterns/schema-markup.md`.
- **Skip these folders when scanning the project:** `node_modules/`, `dist/`, `.astro/`, `_incoming-zips/`, `_legacy-archive/`, and any `.jennair.bak-*` / `*.bak` / `*.bak-v1` files.

## Tone and voice (for any content generated)

- **Technician + company voice** — "our techs", "we", "our guys". Never generic corporate.
- **Humanize:** field observations, real model numbers, year patterns, honest repair-vs-replace guidance.
- The full writing standard is in Notion (linked from the wiki). Fetch it when writing customer-facing page content.
