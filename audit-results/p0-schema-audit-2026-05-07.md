# P0 Schema Audit — 2026-05-07

**Branch:** main · **HEAD:** `f65a0dc` · **Tree:** clean (45 untracked = audit-results + scripts/wave-* per known P3 debt)
**.astro files:** 830 active · 87 .astro.legacy (clutter) · dist/ has 792 files from prior build

> **UPDATE 2026-05-08:** CSLB #1138898 status was incorrectly flagged as retired in this audit. Roman confirmed it is **ACTIVE**. References to "#1138898 retired/stale/OLD" below are historical and superseded — the license is in active use in `src/components/Footer.astro` and in `hasCredential` schema across all 1009 pages. The server-side files `functions/api/contact.js:267` and `functions/api/diagnose.js:55` were already updated in the 2026-05-07 P0 sprint to remove the *outbound-email signature* references, which is unrelated to the license being active.

---

## 1. Schema generation architecture

**Hybrid — NOT centralized.** No single helper file. JSON-LD lives in 3 locations:

| Location | Files | Notes |
|---|---|---|
| **Dedicated schema component** | `src/components/homepage/HomepageSchema.astro` (218 lines) | Single source for HOMEPAGE only — emits 1 ld+json with `@graph` containing Organization + WebSite + WebPage + 8 LocalBusiness (1 physical_pin + 7 service_area) + FAQPage. Reads from `BRANCHES` SSOT, builds dynamically per branch type. **explicit comment** (line 128): `// aggregateRating intentionally omitted per NAP/Rating SSOT Rule 3` |
| **Page-level inline schema** | ~100 files in `src/pages/` (e.g. `west-hollywood.astro`, `contact.astro`, `book.astro`, all city pillars, all brands, all commercial) | Each page builds its own `localBusinessSchema` const inline, passes via `<Fragment slot="head-scripts">` to Layout. **No reuse, no SSOT, copy-paste pattern.** |
| **Layout slots** | `Layout.astro` provides `head-scripts` slot. `CityLayoutV2.astro` accepts optional `localBusinessSchema` prop and renders it | Layout is plumbing only, not generator |

Other schema emitters (Breadcrumb, FAQ): `src/components/Breadcrumbs.astro`, `src/components/cities/v2/FAQAccordion.astro`, `src/layouts/BlogLayout.astro`. These are factored into reusable components. Only **LocalBusiness** is duplicated per-page.

**Implication for P0 write:** changing `legalName`, `address`, `aggregateRating`, or credential strings centrally requires either:
- Editing `src/data/branches.ts` (clean — propagates to HomepageSchema automatically)
- OR a multi-file sweep across page-level inline schemas (city pillars + contact + book + brands)

---

## 2. Live schema state per page (7 sampled URLs)

| Page | streetAddress (8746 Rangely) | telephone | legalName (HVAC 777 LLC) | hasCredential count | aggregateRating | location array | @type |
|---|---|---|---|---|---|---|---|
| `/` (homepage) | ✅ on WeHo branch in @graph | ✅ all 8 branches | ❌ absent | 0 | ❌ omitted (intentional per HomepageSchema:128) | n/a — flat 8 branches in @graph | LocalBusiness + HomeAndConstructionBusiness (dual types) |
| `/west-hollywood/` | ✅ | ✅ (323) 870-4790 | ❌ | 0 (uses `license: "BHGS #A49573"` field instead) | ❌ | n/a | HomeAndConstructionBusiness (single type) |
| `/contact/` | ✅ inside `location[0]` (WeHo) | ✅ all 8 in `location[]` | ✅ on root @id #business | 3 (BHGS, **""** GHOST, EPA) | ❌ | 8 entries | LocalBusiness |
| `/book/` | ❌ (only addressLocality + zip, no streetAddress) | ✅ main only | ✅ | 0 | ❌ | n/a | LocalBusiness |
| `/services/refrigerator-repair/` | ❌ | ✅ MAIN_PHONE | ❌ | 0 | ❌ | n/a | Service (provider = LocalBusiness inline) |
| `/brands/lg/` | ❌ | ✅ MAIN_PHONE | ❌ | 0 | ❌ | n/a | Service (provider = LocalBusiness inline) |
| `/temecula/` | ❌ (city pillar — service_area type) | ✅ Temecula DID | ❌ | 0 | ❌ | n/a | HomeAndConstructionBusiness |

**Key finding: `aggregateRating` is intentionally absent everywhere** — matches memory `feedback_nap_rating_policy.md` ("AggregateRating REMOVED everywhere until GMB API") and explicit code comment in HomepageSchema.astro:128. **CLAUDE.md §1 wording is stale** — it says aggregateRating "MUST be on WeHo + LA SAB pillars" but actual policy + active code = removed.

---

## 3. BBB mentions

### "BBB A+" — 28 active files (excluding .legacy + _incoming-zips)

**High blast radius (site-wide visible):**
- `src/layouts/Layout.astro:23` — default `<meta description>` fallback for any page not overriding (used on hundreds of pages)
- `src/components/Footer.astro:131-133` — visible Footer credentials block (`<strong>BBB A+</strong> Accredited Business`) — ALL pages
- `src/components/TrustBar.astro:9` — top bar `'🏆 BBB A+'` — ALL pages

**Schema (JSON-LD):**
- `src/components/homepage/HomepageSchema.astro:180` — WebPage.description on homepage
- `src/data/faq.ts:30` — FAQPage answer ("BBB Accredited with an A+ rating")
- `src/pages/commercial/exhaust-hood-repair/{grease-buildup, fan-not-working}.astro:47` — FAQ schema answers
- `src/pages/brands/greenheck-hood-repair.astro:47`, `vent-master-hood-repair.astro:47` — same FAQ pattern

**Page bodies + meta:**
- `src/pages/index.astro:15` — homepage `<meta description>`
- `src/pages/contact.astro:15` — contact `<meta description>`
- `src/pages/contact.astro:298` — visible body credential list
- `src/pages/credentials/{licensed,insured,oem-parts,osha-certified,epa-certified,background-checked,bbb-accredited,same-day-service}.astro` — multiple visible mentions per file
- `src/pages/price-list/patio-heater-repair-cost.astro:19` — FAQ answer
- `src/pages/commercial/holding-cabinet-repair.astro:74`, `range-repair.astro:74` — `hasCredential` array entries

**Server-side:**
- `functions/api/diagnose.js:55` — system prompt for AI diagnostic (`"BBB A+ accredited, EPA-certified shop"`)
- `functions/api/contact.js:267` — outbound email signature (`"CSLB C-20 #1138898 · BBB A+ · EPA 608"`) — **contains BBB A+ (false claim, must remove); CSLB #1138898 is ACTIVE per 2026-05-08 correction.**

### "BBB Accredited" — 30+ active files

- `src/data/credentials.ts:40` — `title: 'BBB Accredited'` card
- `src/data/faq.ts:30` — same FAQ as BBB A+
- `src/components/cities/v2/TrustBadgesRow.astro:12` — visible badge on all v2 city pages (`'BBB Accredited'` 5th of 5 badges)
- 8+ `src/pages/credentials/*.astro` — heading text, list items, body text
- `scripts/wave-39-phase2d-sweep.py:59` — title template entry (script, not built)

**Note**: BBB Accredited A+ status is REAL and verified — not stale. Question for Roman is whether to keep, soften, or remove.

---

## 4. Stale phrases (definitively wrong post-Wave 35)

### "Licensed C-20" — 4 ACTIVE source files

| File | Line | Context | Blast radius |
|---|---|---|---|
| `src/layouts/Layout.astro` | 23 | `description = 'Same-day appliance repair... Licensed C-20, BBB A+, EPA-certified...'` (default `<meta description>`) | **Site-wide** — any page without explicit description override renders this |
| `src/components/homepage/HomepageSchema.astro` | 180 | WebPage.description in JSON-LD `@graph` | Homepage only |
| `src/pages/contact.astro` | 15 | `const description = '...Licensed C-20 appliance techs...'` | /contact/ |
| `src/components/AiDiagnostic.astro` | 232 | Visible body: `<p>Licensed C-20 technician calls you...</p>` | Orphan component (not currently rendered per current-status.md known debt) |

### "C-20 appliance techs" — 1 file
- `src/pages/contact.astro:15` (same as above)

### Ghost `credentialCategory: ""` — 1 active file
- `src/pages/contact.astro:66` — `{ '@type': 'EducationalOccupationalCredential', credentialCategory: '' }` — empty record between BHGS and EPA entries
- Companion ghost in body at line 296: `<li><strong></strong> HVAC license</li>` (visible UI)

### "C-20 HVAC" — used INTENTIONALLY on commercial HVAC-adjacent pages (8+ files)

These reference C-20 as a valid scope for commercial kitchen ventilation / HVAC work — **conflicts with `docs/factual-accuracy.md` §3** which says "C-20 HVAC — НЕ используется на этом сайте":

- `src/pages/commercial/exhaust-hood-repair/{grease-buildup, fan-not-working, fire-suppression-issues, make-up-air-system-repair}.astro`
- `src/pages/commercial/kettle-repair.astro:354`
- `src/pages/brands/greenheck-hood-repair.astro` (visible body + schema, 8 occurrences)
- `src/pages/brands/vent-master-hood-repair.astro` (similar)
- `src/pages/price-list/patio-heater-repair-cost.astro` (3 occurrences)

**Roman decision needed:** delete C-20 references from these (align to docs) OR update docs to permit C-20 on HVAC-adjacent commercial.

### CSLB #1138898 reference in server-side outbound email — 1 file
- `functions/api/contact.js:267` — outbound email signature references CSLB C-20 HVAC #1138898 (the **active** license, per 2026-05-08 correction). Original audit incorrectly flagged this as a retired-number reference; the license is active. Review still warranted because the same line carried "BBB A+" (false claim, separately removed).

---

## 5. branches.ts current state

**Sample entry (West Hollywood — physical_pin):**
```js
{
  slug: 'west-hollywood',
  name: 'West Hollywood',
  fullName: 'Same Day Appliance Repair — West Hollywood',
  gbpName: 'Same Day Appliance Repair',
  type: 'physical_pin',
  gbpStatus: 'verified_pin',
  gbpUrl: 'https://share.google/MZH7ZdnIWHiAp8Zm3',
  gbpVerifiedDate: 'TODO_ROMAN_CONFIRM',
  aggregateRating: { ratingValue: 4.6, reviewCount: 37 },     // ← dormant
  phone: '(323) 870-4790',
  phoneStatus: 'active',
  email: 'support@samedayappliance.repair',
  address: {
    street: '8746 Rangely Ave', city: 'West Hollywood',
    state: 'CA', zip: '90048',
    lat: 34.0894, lng: -118.3895
  },
  geo: { cityCenterLat: 34.09, cityCenterLng: -118.3617, serviceRadius: 10 },
  hours: { days: 'Mon-Sun', open: '08:00', close: '20:00' },
  primaryCounty: 'los-angeles',
  citiesServed: ['west-hollywood', 'hollywood', 'mid-wilshire', 'fairfax', 'hancock-park'],
  displayAreas: ['West Hollywood', 'Hollywood', 'Hancock Park', 'Mid-Wilshire']
}
```

**Fields per branch (8 total):**
- All have: slug, name, fullName, gbpName, type, gbpStatus, phone, phoneStatus, email, geo, hours, primaryCounty, citiesServed, displayAreas
- Optional: gbpUrl (5 of 8 have it), gbpVerifiedDate (only WeHo, value=`TODO_ROMAN_CONFIRM`), aggregateRating (3 of 8: WeHo 4.6/37, LA 5.0/13, ThousandOaks 5.0/7), address (only WeHo physical_pin), internalAddress (3 SAB branches: Pasadena, ThousandOaks, Irvine — internal only, never rendered)

**Mismatches with target:**
- `hours.days` says `Mon-Sun` for ALL 8 branches but canonical SSOT (BUSINESS_HOURS) says `Mon-Sat 8am-8pm + Sun closed`. The `hours` field is rarely consumed (HomepageSchema uses `OPENING_HOURS_SCHEMA` directly, not branch.hours) — likely vestigial after Wave 36 hours sweep. Worth cleaning up but not P0.
- `internalAddress` exists for Pasadena/ThousandOaks/Irvine but not for RC/Temecula (which note "true service territory" — no real office). Type allows it; not a problem.
- No `credentials` field — credentials are global (BHGS, EPA), not per-branch.
- WeHo `gbpVerifiedDate: 'TODO_ROMAN_CONFIRM'` — placeholder Roman never filled in.
- LA branch has `aggregateRating: { ratingValue: 5.0, reviewCount: 13 }` — but real GMB rating per CLAUDE.md is 4.6/37 (which is on WeHo's GMB). Need Roman to confirm if 5.0/13 is real.

---

## 6. AggregateRating residual

**Active source files (BUILT):** 0 actual JSON-LD emissions of `AggregateRating`/`aggregateRating` schema entity.

What grep found in src/:
- `src/data/branches.ts` — interface definition + 3 dormant data entries (WeHo/LA/ThousandOaks) — **no consumer reads them**; HomepageSchema explicitly skips with comment
- `src/components/homepage/HomepageSchema.astro:128` — comment `// aggregateRating intentionally omitted`
- `src/components/cities/v2/ReviewsBlock.astro:2` — comment `Per-review stars OK (NOT aggregateRating)` — visible per-card stars `★★★★★` but NOT aggregate (per spec, OK)
- ~60 occurrences in `src/pages/*.astro.legacy` files — not built, just file clutter

**Visible star displays in v2:**
- `src/components/cities/v2/ReviewsBlock.astro:22` — `'★'.repeat(t.stars ?? 5)` per individual testimonial — **policy-OK** (per-review, not aggregate)

**Conclusion:** `aggregateRating` is fully removed from emitted output. The dormant data in `branches.ts` is harmless (no consumer) but adds confusion. CLAUDE.md §1 needs update to match reality.

---

## 7. Visible credential blocks

### `src/components/Footer.astro` (lines 121-138, ALL pages)
```html
<div class="footer-credentials">
  <div class="cred-item"><strong>BHGS</strong><span>Registration #A49573</span></div>
  <div class="cred-item"><strong>EPA 608 Universal</strong><span>#1346255700410</span></div>
  <div class="cred-item"><strong>BBB A+</strong><span>Accredited Business</span></div>
  <div class="cred-item"><strong>Insured</strong><span>$1M General Liability</span></div>
</div>
```

### `src/components/TrustBar.astro` (lines 4-11, top of all pages)
```js
const credentials = [
  '⚡ SAME DAY · 7 DAYS/WEEK',
  '🔧 85% FIXED FIRST VISIT',
  '⭐ VERIFIED 5-STAR SERVICE',
  '📜 LICENSED & INSURED · BHGS #A49573',
  '🏆 BBB A+',
  '🏢 8 BRANCHES · LA · OC · VENTURA · SB · RIVERSIDE'
];
```

### `src/components/cities/v2/TrustBadgesRow.astro` (lines 7-13, all 87 v2 city pages below Hero)
```js
const defaultBadges = [
  { emoji: '⚡', label: 'Same-Day Service' },
  { emoji: '🛡️', label: '90-Day Warranty' },
  { emoji: '🔧', label: 'OEM Parts' },
  { emoji: '✅', label: 'Licensed & Insured' },
  { emoji: '🏅', label: 'BBB Accredited' }
];
```

### `src/pages/contact.astro:294-301` (visible body)
```html
<ul class="cred-list">
  <li><strong>BHGS</strong> Registration #A49573 (appliance repair)</li>
  <li><strong></strong> HVAC license</li>                                <!-- ← GHOST -->
  <li><strong>EPA 608 Universal</strong> #1346255700410 (refrigerant)</li>
  <li><strong>BBB A+</strong> Accredited Business</li>
  <li><strong>Fully insured</strong> — general liability + workers' comp</li>
</ul>
```

### `Credentials.astro` (orphan per current-status.md) — was supposed to render `src/data/credentials.ts` 8-card grid, but component file doesn't exist in `src/components/` flat list (Glob confirmed). The data file is dormant.

### `BrandBadgesRow.astro` — does NOT exist (Glob: no match).

---

## 8. Meta descriptions per sampled URL

| URL | Full description | "C-20"? | "BBB A+"? |
|---|---|---|---|
| `/` | Same-day appliance repair across 5 SoCal counties. Residential, commercial kitchen, cold storage, outdoor. BHGS #A49573, BBB A+, EPA 608. | ❌ | ✅ |
| `/west-hollywood/` | Same-day appliance repair in West Hollywood, CA. Refrigerator, washer, dryer, oven. Sub-Zero + Thermador specialists. 90-day warranty. (323) 870-4790. | ❌ | ❌ |
| `/contact/` | Call, email, or message our 5 Southern California branches. **Licensed C-20 appliance techs**, same-day visits, $89 diagnostic waived with repair. Answered 24/7. | ✅ STALE | ❌ |
| `/book/` | Book a same-day appliance repair visit online or by phone. $89 dx waived, OEM parts, 90-day labor warranty. 5 branches across SoCal. | ❌ | ❌ |
| `/services/refrigerator-repair/` | Refrigerator repair across LA, OC, Ventura. Sub-Zero, KitchenAid, LG, Samsung, GE, Viking. Same-day. $89 diagnostic waived. BHGS #A49573. | ❌ | ❌ |

**Plus:** any page that does NOT pass an explicit `description` prop to Layout falls back to `Layout.astro:23` default which contains BOTH "Licensed C-20" AND "BBB A+". Need a grep across `src/pages/` to count pages without `<Layout description=...>` — likely small (most pages override) but worth verifying before sweep.

---

## 9. Pages count

- `.astro` active: **830**
- `.astro.legacy`: **87** (clutter from T7→T8 migration; not built)
- dist/ files (last build): **792**

---

## 10. Recommended write strategy

### Single-edit-fixable (3 surgical edits cover most of the bleeding):

**Edit A — `src/layouts/Layout.astro:23`** — change default description.
Removes "Licensed C-20" from EVERY page that doesn't override description (probably dozens). Highest-leverage single edit.

**Edit B — `src/components/homepage/HomepageSchema.astro:180`** — change WebPage.description string.
Removes "Licensed C-20" from homepage JSON-LD.

**Edit C — `src/pages/contact.astro` lines 15, 66, 296** — three changes in one file:
- Line 15: rewrite `description` (remove "Licensed C-20 appliance techs")
- Line 66: delete the empty `{ credentialCategory: '' }` ghost from hasCredential array
- Line 296: remove or rewrite `<li><strong></strong> HVAC license</li>` ghost in visible body

### Multi-file but contained:

**Edit D — `src/pages/index.astro:15`** — homepage `<meta description>` already does NOT contain C-20 (says "BHGS #A49573, BBB A+, EPA 608"). No-op unless Roman wants BBB removed.

**Edit E — `src/components/AiDiagnostic.astro:232`** — orphan component. Either fix the string or just delete the component (it's flagged as orphan in current-status.md known-debt list anyway).

**Edit F (server) — `functions/api/contact.js:267` + `diagnose.js:55`** — outbound email signature + AI prompt. The original audit flagged `CSLB C-20 #1138898` as retired; per 2026-05-08 correction it is **active**. The actual issue on these lines was the "BBB A+" false-claim string, which was the substantive update. Both files are in `functions/`, deploy via Cloudflare Pages Functions.

### Decisions Roman needs to make BEFORE writing:

1. **BBB A+ — keep, soften, or remove?** It's REAL credential but appears in 28+ active files. If keep → no edits. If remove site-wide → BIG sweep (Footer + TrustBar + TrustBadgesRow + Layout default + 8 credentials/ pages + FAQ + server + commercial pages).
2. **C-20 HVAC scope on commercial HVAC-adjacent pages** — keep (legitimate scope reference) or remove (align to docs/factual-accuracy.md §3)? Affects 8+ commercial/HVAC files including 2 brand pillars (Greenheck, Vent Master) where it's a meaningful legitimacy signal.
3. **`branches.ts` aggregateRating data** — delete dormant data (clean) or keep for future GMB API use (per memory note)?
4. **CLAUDE.md §1 alignment** — update wording from "MUST be on WeHo + LA SAB pillars" to match active policy "REMOVED until GMB API"?
5. **Hollywood pillar streetAddress** — currently NOT in /hollywood/ schema, but per CLAUDE.md §1 should be (maps to WeHo branch). Add or accept current state?
6. **Book page streetAddress** — currently NOT in /book/ schema. Add (per CLAUDE.md §1) or accept?

### Estimated P0 write commit blast radius (minimum, no BBB sweep, no C-20 HVAC removal):

- **3 files** for hard-stale C-20 + ghost credentialCategory (Layout, HomepageSchema, contact)
- **1 optional file** for AiDiagnostic (orphan — better to delete than fix)
- **2 optional files** for server-side BBB A+ false-claim string (functions/api/*.js); CSLB #1138898 on the same lines is active and not in scope for removal

Total **3-6 files** for the strict "remove what's broken" P0. No build risk, no SEO risk, all character-level edits.

If Roman approves BBB removal sweep → +25 files. If C-20 HVAC alignment → +8 files. If branches.ts cleanup → +1 file. If CLAUDE.md update → +1 file. **Maximum total: ~40 files** — still safe single-commit territory.

---

## Files saved
- `audit-results/p0-schema-audit-2026-05-07.md` (this file)
- `audit-results/schema-live-2026-05-07.txt` (1396 lines — full ld+json from 7 live URLs)
