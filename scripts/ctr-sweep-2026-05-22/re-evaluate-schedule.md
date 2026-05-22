# CTR Sweep — Re-evaluation Schedule

**Commit:** `0ac30ce` (2026-05-22)
**Re-check date:** **2026-06-05** (T+14d from sweep) or **2026-06-22** (T+30d, more stable)

## URLs to re-evaluate (6)

| # | URL | Target queries | Pre-sweep imp/7d | Pre-sweep pos | Pre-sweep clicks |
|---|---|---|---:|---:|---:|
| 1 | `/price-list/fireplace-repair-cost/` | fireplace repair cost; gas fireplace repair cost | 37 | 18.9 / 16.6 | 0 |
| 2 | `/price-list/wine-cooler-repair-cost/` | wine fridge repair cost; wine cooler repair cost | 31 | 10.9 / 8.6 | 0 |
| 3 | `/brands/capital-bbq-grill-repair/` | capital barbecue repair; capital grill repair | 25 | 12.8 / 11.5 | 0 |
| 4 | `/price-list/commercial-slushie-machine-repair-cost/` | commercial slushie machine repair | 19 | 14.6 | 0 |
| 5 | `/services/wine-cellar-repair/` | cellarpro repair los angeles | 18 | 10.9 | 0 |
| 6 | `/price-list/wine-cellar-repair-cost/` | wine cellar cooling unit repair los angeles | 13 | 10.9 | 0 |

**Total baseline:** 143 imp / 7d / 0 clicks (CTR 0.00%).

## Re-check methodology

Run via `mcp__gsc__get_advanced_search_analytics` with filter per-URL:

```python
# For each URL above:
mcp__gsc__get_advanced_search_analytics(
    site_url="sc-domain:samedayappliance.repair",
    start_date="2026-05-23",   # day after sweep
    end_date="2026-06-05",     # T+14d
    dimensions="query",
    filter_dimension="page",
    filter_operator="equals",
    filter_expression=URL,
    row_limit=100,
    sort_by="impressions"
)
```

Then compute:
- New CTR per URL
- Clicks delta
- Position delta (positions can move both directions independent of title)

## Success criteria

- **Winner:** CTR > 1% on any of 6 URLs OR total clicks >= 3 across all 6
- **Neutral:** Some movement (positive or negative) but < 1% CTR
- **Failure:** Zero clicks and zero movement = structural issue (authority, SERP features); title changes alone insufficient

## What to do based on result

### Winner case
- Apply same playbook to next batch of CTR candidates
- Document successful title patterns in `docs/seo-policies.md` §5
- Push for more aggressive title rewrites on pos 5-15 candidates with weak SERP-snippets

### Neutral case
- Wait another 14d (2026-06-22) — Google may not have re-crawled all 6
- Verify GSC `inspect_url_enhanced` shows updated cached snippet on each URL
- If snippets still old after 14d → titles haven't been picked up; force re-crawl via GSC submit-URL

### Failure case
- Move to structural fixes:
  - Content depth (1500-1800w content on price-list pages)
  - Internal anchor sweep (descriptive anchors → these URLs)
  - Off-site backlinks (especially for `cellarpro repair los angeles` brand query — need CellarPro mention in 3rd-party listing)
- Title rewrite is NOT the root cause

## Reproducible script

```bash
# Quick re-check (save as scripts/ctr-sweep-2026-05-22/recheck.py)
# Replays the 6-URL GSC pull for 2026-05-23..2026-06-05 window
# Compares against pre-sweep baseline in this file
```

## Caveats

- 14d post-cutover-style data still volatile — Google's re-indexing is ongoing per cannibalization-7d audit (commit ee09600).
- Total site CTR 0.045% — these 6 are noise-level individually. Need aggregate signal across the batch.
- `wine-cooler-repair-cost` title encodes `&amp;` in HTML; Google decodes to `&` in SERP — counts as 51 chars visible, not 53.
