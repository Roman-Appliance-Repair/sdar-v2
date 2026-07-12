# 2026-07-12 — Luxury Wave L-1 (Sub-Zero + Wolf)

**Merge:** `2f2b1855` on main (branch `feature/luxury-wave-1`, from research commit `ba16138`).
**Build:** 1111 pages, 0 errors. **IndexNow:** batch 200 (4 URLs).

## Strategic insight (from briefs, page-plans/luxury-wave-1/)
Series-level demand ≈ 0 (Ahrefs) → series become H2 sections, not standalone pages.
Demand is brand + symptom: wolf range repair 1300 (KD29), sub-zero refrigerator repair
1100 (KD9), how long do sub zero refrigerators last 200 (KD0, AI overview).

## Tasks
1. UPGRADE `/blog/sub-zero-replacement-vs-repair-decision/` → lifespan flagship.
   1974 → 2598 wd. New title "How Long Does a Sub-Zero Last? Repair vs Replace" (48).
   Answer-first; OEM "at least 20 years" design life (replaced unsourced 25-35);
   NAHB 9-13 mass-market contrast; parts-supersession proof (9 board# → 7041549);
   warranty 2/5/6-12; annual condenser-cleaning explainer; +FAQPage (6 Q). Commit `4bd64fe1`.
2. ENRICH `/brands/wolf-range-repair/` 3822 → 4382. OEM fault codes Err 00/01/0E
   (single-source 09/OC/OPP not published); parts 807141→813398, RTD 815572,
   serial-break rule; +1 FAQ. Commit `3113694a`.
3. NEW `/services/refrigerator-repair/sub-zero-problems-by-series/` 3128 wd. Merged
   500/600 + BI + 700/UC as H2 sections; diagnostic-mode EC codes; reciprocal links
   to sub-zero pillar/combo, flagship blog, not-cooling blog. Commit `8c35bb32`.
4. ENRICH `/brands/wolf-wall-oven-repair/` 3114 → 3630. F-codes F1/F3/F4/RELAY STUCK
   (OEM chart); parts 811452 / 815572 / 807052; E-Series serial rule; +1 FAQ. Commit `afb865ce`.

## Compliance
titles ≤53, FAQPage on all, forbidden 0, aggregateRating 0, cyrillic 0, $89 residential.
Fact guard: Wolf = cooking only, Sub-Zero = refrigeration only. Every number from a brief
or research/reliability-data-sheet.md; field patterns qualitative only.

## Ops note
Harness moved the branch into worktree `sdar-v2-wt1` mid-run (concurrent-process race);
commits survived, Tasks 3-4 completed there. Merge was a no-op on stray status commit
`c3736f19` (identical change already on main). Not fast-forward (proper merge `2f2b1855`).

## Live verify
- /services/refrigerator-repair/sub-zero-problems-by-series/ → 200, "Sub-Zero Refrigerator Problems by Series — Same Day"
- /blog/sub-zero-replacement-vs-repair-decision/ → 200, "How Long Does a Sub-Zero Last? Repair vs Replace", FAQPage live
- /brands/wolf-range-repair/ → 200 · /brands/wolf-wall-oven-repair/ → 200
