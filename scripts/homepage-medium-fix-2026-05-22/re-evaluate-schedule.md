# Homepage MEDIUM Refocus — Re-evaluation Schedule

**Commit:** `c0a8c3d` (2026-05-22)
**Backup branch:** `backup/homepage-medium-fix-2026-05-22` at `ccf44826df7c27421f19367b76643113c848fffe`

## Baseline (pre-fix, 7d: 2026-05-15..05-22)

- Homepage avg position: **41.3**
- 7d impressions: ~580
- 7d clicks: **0**
- Top query position:
  - `same day appliance repair` — 82 imp pos 28.0
  - `same-day appliance repair` — 23 imp pos 11.6
  - `same day appliance repair los angeles` — 1 imp pos 2 (single-impression edge case, indicative)
- Walk-in cooler drift: ~165 imp / 7d (~55% of total page imp)
- Visible body "Los Angeles" mentions: ~16
- Visible body word count: 1244

## Scheduled re-checks

### T+7d (2026-05-29) — Verify Google crawled new version

Method:
```python
mcp__gsc__inspect_url_enhanced(
    site_url="sc-domain:samedayappliance.repair",
    page_url="https://samedayappliance.repair/"
)
```

Check `last_crawled` timestamp >= 2026-05-23. If still showing old crawl, manually submit URL via GSC UI.

### T+14d (2026-06-05) — First CTR/position check

Methods:
```python
# Daily position trend (homepage)
mcp__gsc__get_advanced_search_analytics(
    site_url="sc-domain:samedayappliance.repair",
    start_date="2026-05-23",
    end_date="2026-06-05",
    dimensions="date",
    filter_dimension="page",
    filter_operator="equals",
    filter_expression="https://samedayappliance.repair/",
    row_limit=100
)

# Per-query check for walk-in drift reduction
mcp__gsc__get_advanced_search_analytics(
    site_url="sc-domain:samedayappliance.repair",
    start_date="2026-05-23",
    end_date="2026-06-05",
    dimensions="query",
    filter_dimension="page",
    filter_operator="equals",
    filter_expression="https://samedayappliance.repair/",
    row_limit=200,
    sort_by="impressions"
)
```

### T+21d (2026-06-12) — Main evaluation

Same queries as T+14d. Categorize queries:
- BRANDED (`same day appliance repair`, `same-day appliance repair`)
- GENERIC_LA (`appliance repair los angeles`, `appliance repair near me` + LA)
- WALK_IN_DRIFT (any `walk-in` / `walk in` queries from out-of-LA geo)
- COMMERCIAL_LA (`commercial X repair los angeles`)
- OTHER

Compute deltas vs baseline.

## Success criteria

| Metric | Baseline | Target T+21d | Stretch |
|---|---|---|---|
| Homepage avg position | 41.3 | <30 | <22 |
| Walk-in drift imp share | ~55% | <30% | <15% |
| `same day appliance repair los angeles` impressions | 1 (singular) | >=20 | >=50 |
| Homepage total 14d clicks | 0 | >=5 | >=15 |
| "Los Angeles" body mentions (verified via curl) | 16 | 21 (currently) | n/a |

## What to do based on result

### Winner case (criteria met)
- Document pattern; consider similar refocus for other ambiguously-targeted pages (homepage v2 → city-specific landing v1)
- Apply same playbook to other high-impression / no-click pages
- Push для add neighborhood photos (hero placeholder still says "Technician at work")

### Neutral case (some movement but <target)
- Wait full T+30d (2026-06-22) — Google's re-indexing for homepage is slower than deep pages
- Check `mcp__gsc__inspect_url_enhanced` — if cached snippet still shows old title, force re-crawl via GSC submit

### Failure case (zero movement after T+21d)
- Cannibalization sweep needed at WeHo physical_pin (per cannibalization 7d briefing)
- Consider trimming "Cold Storage" niche from Hero entirely (more aggressive walk-in drift reduction)
- Content depth audit — current 1479 words still below 2,025 competitor avg

## Changes applied (10 surface points, 1 file)

1. Title: `... — 8 Branches` → `... — 8 Branches, 24/7` (added 24/7 numeral)
2. Meta: rewritten LA-first + Licensed BHGS unique trust signal
3. H1: `Expert ... in SoCal` → `Same-Day Appliance Repair in Los Angeles` (40ch)
4. Hero subline: neighborhood-led atmospheric narrative (~29w)
5. NEW intro section (3 paragraphs, ~270 words) — brand tier breakdown + dispatch geography
6. NICHES Cold Storage desc: removed "Walk-in coolers" explicit phrase
7. POPULAR card #2: "Walk-In Cooler Repair" → "Washer & Dryer Repair LA"
8. NEW county anchors block (5 descriptive anchors above chip-rows)
9. Bottom CTA H2: added "in Los Angeles" to direct CTA
10. Bottom CTA paragraph: county names explicit instead of "5 counties"

## Caveats

- 21-day window still short for homepage re-rankings (deeper authority pages can take 30-60d).
- Walk-in cooler "drift" не полностью устранён — `/commercial/refrigeration/` niche all-still linked + "walk-in cooler" 2× в visible HTML (Cold Storage niche text + somewhere else). Aggressive removal blocked per task constraint "сохранить 5 niches structure".
- GMB UTM tags applied separately; their data stream is independent.
- Re-eval should also check whether walk-in drift impressions migrated к `/commercial/refrigeration/walk-in-cooler-repair/` (correct landing) или к `/services/refrigerator-repair/` (wrong landing).
