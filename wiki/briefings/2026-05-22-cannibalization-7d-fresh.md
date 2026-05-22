# Cannibalization audit — fresh 7-day (2026-05-22)

> Read-only. No `src/` edits. Artifacts in `scripts/cannibalization-2026-05-22-fresh/`.

## ⚠️ Data window: 2026-05-15 → 2026-05-22 (7 days, most recent)

- DNS cutover: **2026-05-06**.
- Pulled via `mcp-search-console` against `sc-domain:samedayappliance.repair`.
- Filter: `impressions >= 5` (matches previous audit floor).
- Raw rows: **3,619 (query, page)** pairs → **666** after the imp≥5 filter.
- Sample totals: **8,107 impressions / 5 clicks** over 7 days (CTR ~0.06% — still very low; Google rerolls SERPs daily).
- Previous reference: `briefings/2026-05-22-cannibalization-post-cutover.md` (14d, commit `7dc06e0`).

## TL;DR

| Severity | 7d cases | 7d imp | Previous 14d cases | Previous 14d imp |
|---|---:|---:|---:|---:|
| CRITICAL | **43** | 2,916 | 37 | 7,634 |
| HIGH | **110** | 1,661 | 114 | 3,471 |
| MEDIUM | 22 | 701 | — | — |
| LOW | 339 | 2,829 | — | — |

- **CRITICAL count up slightly** (37 → 43) but **imp volume dropped sharply** (7,634 → 2,916). Two top-2 CRIT (vent hood + exhaust hood pricing, 481 imp combined) are **heuristic false positives** — those were resolved by `1354410` (commercial-hood title fix + 301 vent-hood synonym). After removing them, ~41 real CRITICAL cases / 2,435 imp.
- **~38 of 151 previous actionable cases resolved/vanished/downgraded** (~25% progress in 16 days post-cutover).
- **WeHo hub still #1 problem.** 24 steal cases, 1,238 imp (7d) = **177 imp/day vs 14d 105 imp/day**. Per-day rate slightly worsened — WeHo dominance has NOT receded since Wave 47 + county schema fix.
- **Homepage (`/`) drift** is the #2 problem: 18 steal cases, 346 imp, **dominated by walk-in cooler/freezer queries** that should land on `/commercial/refrigeration/walk-in-*` pages. This corroborates `scripts/homepage-audit-2026-05-22/` H8 finding.
- LG brand pillar absorbing combo queries (lg washer / lg dryer / lg oven repair) — 3 CRIT cases, ~70 imp combined.
- Top **2 CRITICAL false positives** (heuristic bug — `1.2 fix` worked):
  - `commercial vent hood repair cost` (348 imp pos 5.4)
  - `commercial exhaust hood repair cost` (133 imp pos 6.8)
  - Both win on `/price-list/commercial-exhaust-hood-repair-cost/` correctly. The script's `commercial_for_query` matches "vent hood"/"exhaust hood" tokens *before* the price-list check, so intended=service-page. Don't action these.

## State comparison (7d vs previous 14d)

```
RESOLVED       23 cases (was CRIT/HIGH → now MEDIUM/LOW, 206 curr_imp)
VANISHED       12 cases (no impressions in 7d window)
PERSISTS      101 cases (same severity tier)
WORSENED       12 cases (was HIGH, now CRITICAL)
HIGH_NOW        3 cases (was CRITICAL, now HIGH — downgrade)
NEW            37 cases (CRIT/HIGH in 7d, not in 14d top tier)
```

**Improvement signal:** 38 of 151 previous actionable cases moved to a better state (25%). Net cannibal impressions dropped substantially per-day, but structural patterns persist.

**Notable RESOLVED examples:**

| prev_imp | curr_imp | Status | Query |
|---:|---:|---|---|
| 70 | 9 | CRITICAL→LOW | commercial fryer repair |
| 64 | 29 | CRITICAL→MEDIUM | appliance repair santa monica ca |
| 47 | 24 | HIGH→MEDIUM | appliance repair marina del rey ca |
| 43 | 7 | HIGH→LOW | appliance repair west hollywood ca |
| 38 | 5 | HIGH→LOW | thermador repair |
| 33 | 19 | HIGH→MEDIUM | appliance repair san bernardino ca |
| 32 | 5 | HIGH→LOW | walk in wine cellar repair |

## Top 20 actual CRITICAL cases (7d)

| # | Query | URLs | Imp | Pos | Winner | Heuristic intended | Note |
|---|---|---:|---:|---:|---|---|---|
| 1 | `commercial vent hood repair cost` | 2 | 348 | 5.4 | `/price-list/commercial-exhaust-hood-repair-cost/` | `/commercial/exhaust-hood-repair/` | **FALSE POSITIVE** — Google's choice is correct; heuristic bug |
| 2 | `appliance repair near me` | 11 | 277 | 6.2 | `/west-hollywood/` | `/` | WeHo absorbs root-intent query |
| 3 | `appliance repair west hollywood` | 1 | 174 | 4.8 | `/west-hollywood/` | `/hollywood/` | **FALSE POSITIVE** — substring bug (heuristic matches `hollywood` first); WeHo IS correct |
| 4 | `bosch appliance repair` | 2 | 166 | 1.0 | `/west-hollywood/` | `/brands/bosch/` | Real cannibalization |
| 5 | `lg repair west hollywood` | 1 | 142 | 1.0 | `/west-hollywood/` | `/brands/lg/` | Ambiguous — geo + brand; WeHo plausible |
| 6 | `commercial exhaust hood repair cost` | 2 | 133 | 6.8 | `/price-list/commercial-exhaust-hood-repair-cost/` | `/commercial/exhaust-hood-repair/` | **FALSE POSITIVE** — same as #1 |
| 7 | `walk-in freezer repair near me` | 1 | 123 | 40.9 | `/` | `/services/refrigerator-repair/` | Real — homepage drift (heuristic should suggest `/commercial/refrigeration/walk-in-freezer-repair/`) |
| 8 | `same day appliance repair topanga` | 9 | 108 | 58.7 | `/los-angeles/` | `/` | Long-tail brand-named query |
| 9 | `dryer repair` | 7 | 93 | 14.3 | `/west-hollywood/` | `/services/dryer-repair/` | Real |
| 10 | `refrigerator repair near me` | 5 | 88 | 3.6 | `/west-hollywood/` | `/services/refrigerator-repair/` | Real |
| 11 | `oven repair` | 6 | 68 | 13.5 | `/pasadena/` | `/services/oven-repair/` | Real |
| 12 | `refrigerator repair` | 6 | 66 | 18.0 | `/west-hollywood/` | `/services/refrigerator-repair/` | Real |
| 13 | `steam oven repair` | 2 | 58 | 23.6 | `/services/wall-oven-repair/` | `/services/oven-repair/` | Plausibly correct (steam oven = wall-oven category) |
| 14 | `dishwasher repair` | 6 | 55 | 21.9 | `/pasadena/` | `/services/dishwasher-repair/` | Real |
| 15 | `washing machine repair` | 2 | 54 | 1.0 | `/west-hollywood/` | `/services/washer-repair/` | Real |
| 16 | `lg washer repair` | 1 | 46 | 76.7 | `/brands/lg/` | `/brands/lg-washer-repair-washer-repair/` | Real but combo URL slug malformed (`-repair-washer-repair`) |
| 17 | `electric wall heater repair` | 1 | 45 | 44.5 | `/services/wall-heater-repair-los-angeles/` | `/` | Service-specific intent — winner page is the right kind |
| 18 | `emergency ammonia refrigeration repair california` | 3 | 45 | 58.3 | `/commercial/refrigeration/` | `/` | Niche commercial; hub is reasonable |
| 19 | `appliance repair oak park ca` | 2 | 44 | 8.6 | `/thousand-oaks/` | `/oak-park/` | Real if `/oak-park/` city pillar exists |
| 20 | `24 hour industrial refrigeration service california` | 2 | 41 | 64.4 | `/commercial/refrigeration/` | `/` | Niche — hub is OK |

**Heuristic-bug filter (3 false positives):** items 1, 3, 6.

**Real top CRITICAL after filter:** items 2, 4, 7, 8, 9, 10, 11, 12, 14, 15.

## WeHo dominance check — still #1

```
                          7d_wins  7d_steals  steal_imp
/west-hollywood/           24       24         1,238
/pasadena/                 33       18           352
/los-angeles/              10        9           238
/thousand-oaks/            13        7           128
/beverly-hills/             4        2            19
/                          20       18           346
```

- WeHo: 1,238 imp / 7d = **177 imp/day**. Previous: 1,476 imp / 14d = 105 imp/day → **+69% per-day rate**.
- That doesn't mean WeHo got MORE aggressive — it means Google is still re-balancing. Some of the queries that used to land on `/services/*` now land on `/west-hollywood/` while authority redistributes. But the structural cause remains: WeHo is the only `physical_pin`, has the strongest schema (post-2026-05-07 P0 sync), and 105 internal in-links.

**Top 8 WeHo steals (real, excluding heuristic FPs):**

| imp | pos | sev | intended | query |
|---:|---:|---|---|---|
| 277 | 6.2 | CRITICAL | `/` | appliance repair near me |
| 166 | 1.0 | CRITICAL | `/brands/bosch/` | bosch appliance repair |
| 142 | 1.0 | CRITICAL | `/brands/lg/` | lg repair west hollywood (ambiguous) |
| 93 | 14.3 | CRITICAL | `/services/dryer-repair/` | dryer repair |
| 88 | 3.6 | CRITICAL | `/services/refrigerator-repair/` | refrigerator repair near me |
| 66 | 18.0 | CRITICAL | `/services/refrigerator-repair/` | refrigerator repair |
| 54 | 1.0 | CRITICAL | `/services/washer-repair/` | washing machine repair |
| ~50 | mixed | HIGH | `/brands/lg/`, `/services/*` | scattered combos |

Total WeHo over-mention impact: **~900 imp/7d on generic service/brand queries that should land on `/services/X/` or `/brands/X/` pages.**

## Homepage (`/`) cannibalization check — #2 problem area

```
/ wins (when winner=='/'):  20 cases
Of those misaligned:        18 cases / 346 imp
```

**ALL 18 homepage steals are walk-in cooler/freezer queries:**

| imp | pos | intended | query |
|---:|---:|---|---|
| 123 | 40.9 | `/commercial/refrigeration/walk-in-freezer-repair/` | walk-in freezer repair near me |
| 39 | 43.8 | `/commercial/refrigeration/walk-in-refrigerator-repair/` | walk in refrigerator repair |
| 27 | 60.0 | `/commercial/walk-in-cooler-repair/` | walk-in cooler repair near me |
| 27 | 38.9 | `/commercial/refrigeration/walk-in-refrigerator-repair/` | walk-in refrigerator repair |
| 19 | 51.2 | (same) | walk in freezer repair near me |
| 16 | 38.0 | (same) | walk in freezer repair |
| 15 | 30.6 | `/commercial/walk-in-cooler-repair/` | walk in cooler repair near me |
| 13 | 24.2 | (same) | walk in cooler repair |
| + 10 more | … | … | walk-in variants |

This is the homepage drift H8 from the homepage audit. Position 24-60 = no clicks, but homepage is absorbing the impressions. Fix path:
1. Reduce homepage's "Cold Storage" niche prominence (currently 1 of 5 equal niches).
2. Strengthen `/commercial/refrigeration/walk-in-*-repair/` pages with deeper content + internal anchors.

## New discoveries (37 NEW CRITICAL/HIGH cases, 463 imp total)

Mostly long-tail, small impressions (max 19 imp each). Notable:

| imp | sev | winner | intended | query |
|---:|---|---|---|---|
| 19 | HIGH | `/brands/capital-bbq-grill-repair/` | `/outdoor/grill-repair/` | capital grill repair |
| 17 | HIGH | `/commercial/laundry-repair/` | `/` | commercial laundry equipment repair |
| 16 | HIGH | `/murrieta/` | `/` | ac repair service in french valley *(HVAC vertical leak)* |
| 16 | HIGH | `/commercial/food-processor-repair/` | `/` | commercial food processor repair |
| 15 | HIGH | `/thousand-oaks/` | `/services/oven-repair/` | oven repair near me |
| 14 | HIGH | `/commercial/refrigeration/` | `/` | 24/7 industrial refrigeration service california |
| 14 | HIGH | `/beverly-hills/` | `/` | appliance repair beverly |
| 14 | HIGH | `/brands/lg/` | `/brands/lg-dryer-repair-dryer-repair/` | lg dryer repair *(malformed combo slug)* |
| 14 | HIGH | `/brands/lg/` | `/brands/lg-oven-repair-oven-repair/` | lg oven repair *(malformed combo slug)* |
| 14 | HIGH | `/glendale/` | `/glendale/refrigerator-repair/` | refrigerator repair in glendale ca |

**Patterns in NEW:**
- LG brand pillar still absorbs combo queries (3+ cases, ~50 imp total). Combo slugs `lg-X-repair-X-repair/` appear malformed in heuristic — actual canonical may differ.
- `/murrieta/` city pillar picking up "ac repair french valley" — HVAC vertical query, not our scope; Google's choice OK.
- Several "appliance repair [city]" winners are city pillars instead of homepage — that's actually CORRECT routing, heuristic is too homepage-biased.

## WORSENED cases (HIGH → CRITICAL since 14d)

12 cases, 387 imp. Mostly stable scale (prev_imp ≈ curr_imp), promoted to CRITICAL because of the ratio < 0.5 threshold on a single-URL win.

| prev_imp | curr_imp | winner | query |
|---:|---:|---|---|
| 46 | 46 | `/brands/lg/` | lg washer repair |
| 48 | 45 | `/commercial/refrigeration/` | emergency ammonia refrigeration repair california |
| 40 | 41 | `/commercial/refrigeration/` | 24 hour industrial refrigeration service california |
| 45 | 33 | `/commercial/pizza-oven-repair/` | commercial pizza oven repair |
| 36 | 33 | `/brands/lg/` | lg dishwasher repair |

LG brand pillar dominance pattern + commercial refrigeration hub overruns. Real but secondary.

## Priority recommendation для Task 1.3

### Option A: WeHo over-mentions fix (Recommended)

- **Volume:** ~900 imp/7d → ~3,860 imp/month real cannibalized
- **Effort:** Medium. Sweep visible-text "West Hollywood" + WeHo schema priority across non-WeHo pages where these brand/service phrases appear. Move generic "appliance repair near me" implicit anchor away from WeHo logo on universally-linked pages (Layout.astro footer / nav).
- **Risk:** Low. WeHo physical_pin schema must stay; visible UI/anchor adjustments are reversible.
- **ROI estimate:** If we reclaim 30% of WeHo over-mentioned imp to correct pages (services/brands), ~1,160 imp/month re-routed at higher CTR potential.

### Option B: Homepage `/` walk-in drift fix

- **Volume:** ~250 imp/7d (walk-in cluster) → ~1,070 imp/month
- **Effort:** Medium-High. Trim homepage's "Cold Storage" niche prominence + strengthen `/commercial/refrigeration/walk-in-*-repair/` pages. Touches homepage architecture (5-niche design decision).
- **Risk:** Medium — homepage changes affect everything.
- **ROI estimate:** Smaller volume than WeHo; but cleaner separation: homepage targets brand+SoCal, commercial-refrig hub targets walk-in queries.

### Option C: LG brand pillar drift (combo cannibalization)

- **Volume:** ~140 imp/7d (LG washer/dryer/oven/dishwasher → brand pillar instead of combo pages) → ~600 imp/month
- **Effort:** Low. Add explicit anchors from `/brands/lg/` to combo sub-pages with target-keyword anchor text. Possible combo-page slug verification (heuristic flagged malformed `lg-X-repair-X-repair` slugs — need to confirm actual paths).
- **Risk:** Low. Internal anchor edits only.
- **ROI estimate:** Smaller volume but cleanest fix.

### Option D: Skip cannibalization, pivot to other Sprint 1 work

- After Wave 47 + 2 fix-commits + county schema + commercial-hood title, 25% of previous actionable resolved. The structural patterns persist but Google's re-indexing is still ongoing (5 clicks total in 7 days — extremely low CTR everywhere suggests SERP-snippet/CTR is the bigger issue than landing-page-correctness).
- **Recommendation against D** unless WeHo + homepage are believed too risky to touch in current sprint.

### My recommendation: **Option A (WeHo over-mentions fix)** — biggest impression volume, biggest gap-vs-structural-cause alignment, medium effort. Combine with **Option C (LG combo anchors)** as a small companion fix (~30 min extra work).

Don't action top 2 CRITICAL (vent/exhaust hood cost) — those are heuristic false positives, already correctly canonicalized.

## Files

```
scripts/cannibalization-2026-05-22-fresh/
├── analyze.py           ← reproducible analyzer
├── gsc-raw-7d.csv       ← 666 query×URL pairs, imp≥5
├── cannibal-map-7d.csv  ← 514 unique queries, severity-classified
└── diff-vs-14d.csv      ← state-transition table vs previous audit
```

## Caveats

- **Heuristic intended-URL has 2 known bug categories:**
  1. **Substring city match.** `slug_for_city` iterates city slugs and matches first substring. For "west hollywood" — `/hollywood/` is matched before `/west-hollywood/` because of dict iteration order. Affects `appliance repair west hollywood`-like queries (3+ cases in top 20).
  2. **Service-or-price routing for commercial hood.** Queries with "vent hood"/"exhaust hood" + "cost" — heuristic returns `/commercial/exhaust-hood-repair/` (service page) before the price-list rule fires. After `1354410` fix, Google correctly canonicalized these to `/price-list/commercial-exhaust-hood-repair-cost/`. Don't action.

- **Walk-in heuristic gap.** "walk-in refrigerator" lands on `/services/refrigerator-repair/` per heuristic, not `/commercial/refrigeration/walk-in-refrigerator-repair/`. Heuristic doesn't know about the deep commercial/refrigeration tree.

- **5 clicks in 7 days at 8,107 impressions = 0.06% CTR site-wide.** This is the bigger problem than landing-page mismatch. Address CTR via SERP-snippet quality (titles, structured data Offer / aggregateRating debate, descriptions) AFTER cannibalization fixes — both improvements compound.

- **Click data is too sparse to use for ranking decisions.** Position-only stats; not yet a clear winner-takes-all signal.

- **Re-audit through 30 dynamic days (~2026-06-22)** — should show whether Option A/C fixes consolidate or whether Google's re-indexing continues to churn.
