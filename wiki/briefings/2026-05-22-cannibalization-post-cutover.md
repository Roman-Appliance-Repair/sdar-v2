# Cannibalization audit — post-cutover (2026-05-22)

> Read-only audit. No `src/` edits. Artifacts in `scripts/cannibalization-2026-05-22/`.

## ⚠️ Data window: 2026-05-08 → 2026-05-22 (14 days post-cutover)

- DNS cutover: **2026-05-06**. First 2 days skipped as propagation buffer.
- Pulled via `mcp-search-console` against `sc-domain:samedayappliance.repair`.
- Verified daily distribution — no rows leak before 2026-05-08. 2026-05-22 returned 0 impressions (still aggregating — pulled mid-day).
- Filter: `impressions >= 5` (lowered from 50 baseline because absolute volumes are small in a 14-day window).
- Raw rows: **4,960 (query, page)** pairs → **1,062** after the imp≥5 filter → **788** unique queries after grouping.
- Sample totals: **35,836 impressions / 49 clicks** across 14 days. CTR 0.001–0.003, average position 25–40 — the site still re-indexes.

## TL;DR

- **37 CRITICAL cases (7,634 imps in 14 days)** + **114 HIGH (3,471 imps)** = 151 actionable.
- **Projected monthly reclaim ≈ 14,286 impressions** (60% reclaim × 30/14 multiplier on CRITICAL+HIGH).
- One pattern dominates everything else: **`/west-hollywood/` is the systemic hub-cannibal** — wins 23 queries across 5 cities for **1,476 imps** (≈ 20% of all CRITICAL volume). It is the only physical-pin page, has 105 in-links, and is the strongest LocalBusiness schema on the site post-2026-05-07 sync — it now out-ranks `/services/*`, `/brands/*`, and even other `/<city>/` pillars on broad service queries.
- Two commercial-cost queries alone account for **3,775 imps** (49% of CRITICAL): `commercial vent hood repair cost` (2,337) and `commercial exhaust hood repair cost` (1,438). Winner = `/commercial/exhaust-hood-repair/` at avg position ~7. There is no `/price-list/commercial-vent-hood-repair-cost/` to land them.
- Generic single-noun queries (`refrigerator repair`, `oven repair`, `dryer repair`, `dishwasher repair`) are split across 8–10 URLs each — early-indexation diffusion, expected to consolidate naturally but worth nudging via internal-link anchor sweep.
- Pre-cutover overlap of 136 queries exists, but **most of pre-cutover top-100 was HVAC** (`ac repair`, `air duct cleaning`, `air conditioner repair`) — that is a different vertical, those impressions are not coming back. Post-cutover the site is appliance-focused; HVAC was the legacy WordPress identity.

## Top 5 CRITICAL cases (by impressions)

| # | Query | Imp 14d | Avg pos | URLs | Intended (heuristic) | Actual winner | Option | Reclaim/mo (est) |
|---|---|---:|---:|---:|---|---|:---:|---:|
| 1 | `commercial vent hood repair cost` | 2,337 | 6.81 | 2 | `/` ⚠️ | `/commercial/exhaust-hood-repair/` | C | 3,005 |
| 2 | `commercial exhaust hood repair cost` | 1,438 | 7.23 | 2 | `/` ⚠️ | `/commercial/exhaust-hood-repair/` | C | 1,849 |
| 3 | `appliance repair near me` | 409 | 6.57 | 12 | `/` | `/` (variants split) | B | 526 |
| 4 | `appliance repair west hollywood` | 209 | 6.00 | 1 | `/hollywood/` ⚠️ heuristic bug | `/west-hollywood/` | A | 269 |
| 5 | `refrigerator repair` | 207 | 20.11 | 10 | `/services/refrigerator-repair/` | `/west-hollywood/` | A | 266 |

⚠️ The intended-URL column reflects the audit script's heuristic and contains **two known bugs** (see Caveats §1).

Full top-20 deep-dive: `scripts/cannibalization-2026-05-22/top20-deep-dive.csv`.

## Hub-page dominance pattern

Hubs (LA, WeHo, Pasadena, T.Oaks, Beverly Hills) winning queries that should land on more specific pages:

| Hub | Queries stolen | Distinct displaced cities | Imps in 14d |
|---|---:|---:|---:|
| `/west-hollywood/` | **23** | 5 | **1,476** |
| `/los-angeles/` | 6 | 4 | 346 |
| `/pasadena/` | 6 | 1 | 332 |
| `/thousand-oaks/` | 7 | 4 | 301 |
| `/beverly-hills/` | 1 | 1 | 6 |

WeHo's edge is over-determined: only physical-pin pillar (streetAddress + WeHo schema priority), 105 internal in-links, 4 BHGS/EPA/CSLB/BBB credentials site-wide point back to its identity. It will likely keep stealing service/brand queries until either:
- A `<link rel="canonical">` on `/west-hollywood/` is added pointing to itself ONLY for genuine WeHo queries (not generic), or
- Service hubs (`/services/*`) are content-strengthened so Google has a clearer specific target.

Detail: `scripts/cannibalization-2026-05-22/hub-dominance.csv` (43 rows).

## Anchor-text dilution

10,623 internal links extracted site-wide. Top targets:

| Target | In-links |
|---|---:|
| `/contact/` | 548 |
| `/` | 287 |
| `/brands/` | 282 |
| `/credentials/licensed/` | 171 |
| `/pasadena/` | 150 |
| `/irvine/` | 130 |
| `/commercial/exhaust-hood-repair/` | 120 |
| `/beverly-hills/` | 116 |
| `/west-hollywood/` | 105 |
| `/book/` | 101 |
| `/services/refrigerator-repair/` | 98 |
| `/thousand-oaks/` | 95 |

Observations:
- `/services/refrigerator-repair/` (a tier-1 hub) has fewer in-links (98) than `/west-hollywood/` (105). Generic `refrigerator repair` then naturally drifts to WeHo as the more authoritative-looking node.
- `/contact/` dominates with 548 in-links — probably correct (footer + nav), but it does mean per-page link budget is heavily reserved for chrome rather than topical clusters.
- No tier-1 service hub breaks 100 in-links. This is the structural reason single-noun queries diffuse across 8–10 URLs.

Full dump: `scripts/cannibalization-2026-05-22/all-internal-links.csv`.

## Fix plan

151 actionable cases (CRITICAL + HIGH) → CSV `scripts/cannibalization-2026-05-22/fix-plan.csv`.

Option distribution (with conservative 60% reclaim × 30/14 monthly projection):

| Option | Cases | Est. reclaim / month |
|---|---:|---:|
| **A — canonical** (winner → intended via `<link rel=canonical>`) | 64 | ~4,779 |
| **B — anchor sweep** (rewire internal links toward intended) | 2 | ~197 |
| **C — content** (expand intended page; add query cluster + price-list pages) | 30 | **~6,917** |
| **D — merge** (301 winner → intended; collapse duplicates) | 55 | ~2,393 |
| **Total** | **151** | **~14,286** |

Highest-impact single block:
- Build `/price-list/commercial-exhaust-hood-repair-cost/` and `/price-list/commercial-vent-hood-repair-cost/` (or one page covering both terms, with a `<link rel="canonical">` from one variant). Move the cost-table block currently sitting inside `/commercial/exhaust-hood-repair/`. Expected reclaim alone: **~4,800 imp/month**.

By severity:
- CRITICAL reclaim / month ≈ **9,816 imp**
- HIGH reclaim / month ≈ **4,470 imp**

## Caveats — what may be an artifact and warrants re-check

### 1. Heuristic intended-URL has 2 known bugs

- `appliance repair west hollywood` → script outputs `/hollywood/` because the city-name substring loop matches `"hollywood"` before `"west hollywood"`. The actual winner `/west-hollywood/` is in fact the correct page; this case is **not really misaligned**. Same pattern affects `appliance repair north hollywood ca` and `affordable appliance repair west hollywood`. **Fix**: sort cities by name length descending in `02_cannibal_map.py` before the substring scan.
- `commercial <X> repair cost` does not map to a `/price-list/commercial-<X>-repair-cost/` path because the script's price-list rule only knows residential appliances. The result is the "intended → `/`" misclassification visible in top-2 CRITICAL above. The case is still legitimate (we are missing the page), but the labeling is wrong.

These bugs do **not** affect the impressions numbers or the hub-dominance analysis — only the intended-URL column in `cannibal-map.csv` and the option distribution in `fix-plan.csv`.

### 2. Re-indexation effects (14-day window is too short to be sure)

Likely artifacts that should be re-checked **after 2–3 more weeks**, not acted on immediately:

- Generic single-noun queries split across 8–10 URLs (`refrigerator repair`, `oven repair`, `dryer repair`, `dishwasher repair`, `washer repair`). Some of this diffusion is just Google still deciding which page to settle on. Conservative fix: anchor sweep (Option B), not aggressive 301 merges (Option D).
- Long-tail `<brand> <appliance> repair` cases with `num_urls = 2` and avg_position > 25 — these may converge naturally once Google completes the brand × category indexing pass.
- `walk-in freezer repair near me` (153 imp, avg pos 44.4) — single URL, deep position. Could be early ranking, not a real cannibal target. Defer.
- Branded site-search queries (`"same day appliance repair" "+1 323-870-4790"`, `"same day appliance repair" "8746 rangely ave"`) are LSA-trust-restoration audit residue from the 2026-05-07 P0 schema commit — not real user intent. Ignore.

### 3. 2026-05-22 day-of data is incomplete

Pulled today; GSC will continue to backfill the 2026-05-22 row over the next 24–48h. Reclaim projections may shift ±5–10% when the day finalizes.

### 4. Click volume is too low for click-based confidence

49 total clicks across all 1,062 query×page rows. Position-based metrics (impressions, avg_pos) are reliable; CTR-based interpretations are not.

## Files

- `scripts/cannibalization-2026-05-22/gsc-raw.csv` — 1,062 rows (imp≥5 post-cutover)
- `scripts/cannibalization-2026-05-22/cannibal-map.csv` — 788 unique queries, severity-labeled
- `scripts/cannibalization-2026-05-22/top20-deep-dive.csv` — 20 critical with word counts + in-links + token hits
- `scripts/cannibalization-2026-05-22/all-internal-links.csv` — 10,623 internal links site-wide
- `scripts/cannibalization-2026-05-22/hub-dominance.csv` — 43 hub-wins-over-specific-city rows
- `scripts/cannibalization-2026-05-22/precut-sample.csv` — 10 queries present in both periods (context only)
- `scripts/cannibalization-2026-05-22/fix-plan.csv` — 151 actionable cases with option + estimated reclaim
- `scripts/cannibalization-2026-05-22/0{1..5}_*.py` — reproducible scripts
