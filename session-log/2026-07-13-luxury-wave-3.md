# Luxury Wave L-3 EXPANDED — premium-brand sweep

**Date:** 2026-07-13
**Branch:** `feature/luxury-wave-3` (worktree `sdar-v2-wt2`, off `origin/main` c3c784c2)
**Status:** ✅ 9 net-new brand pages written, built, committed. NOT merged, NOT pushed.

---

## Headline: verify-first collapsed the enrich half of the wave

Roman approved "18 new + 2 enrich (Perlick, U-Line)". **Phase-1 word counts were wrong** —
the counter stripped the `---` frontmatter where brand pages keep their `faqs` array (huge
prose), undercounting FAQ-heavy pages by 2-3×. Re-measured by **dist-rendered** word count,
every "enrich" target and every "thin pillar" is **already deep and beats the Zaricci
(luxuryappliance.repair) bar**:

| Page | Phase-1 (wrong) | True (dist) | Verdict |
|---|---:|---:|---|
| aga-stove-repair | 994 | 3445 | already deep — enrich skipped |
| american-range-repair | 1240 | 3456 | already deep — enrich skipped |
| big-chill-refrigerator-repair | 1536 | 4248 | already deep — enrich skipped |
| perlick-commercial | 2078 | 3999 | already deep — enrich skipped |
| u-line | 2630 | 4936 | already deep — enrich skipped |
| dacor / jennair / thor | 1242/1509/1355 | 3173/2868/3074 | not thin |
| Gaggenau/Monogram/SKS/Hestan/Cove/BlueStar/Garland | (covered) | all >2000 | already deep — left as-is |

So the real gap = only the brands with **no page at all**. Enriching already-deep pages
would be low-value churn risking damage to good pages (methodology §3). L-3 therefore ships
**9 net-new pages, 0 enrich** (same verify-first collapse as L-1/L-2/C-1).

## The 9 net-new pages

| # | URL | commit | angle |
|---|---|---|---|
| 1 | `lacanche-range-repair` | `583c88d3` | All-analog serviceability (no board to source); Art Culinaire NA parts (LA showroom); wear-item framing, no invented defect |
| 2 | `la-cornue-range-repair` | `0f516e6c` | **Château vs CornuFé wedge** (bespoke France special-order parts vs conventional easier); no La Cornue fridge; owner-neutral |
| 3 | `officine-gullo-range-repair` | `8c34e4bb` | Prestige/Bel Air calling-card; HONEST factory-direct (explicitly NOT authorized); Florence bespoke parts; failure pattern omitted (none sourced) |
| 4 | `fulgor-milano-repair` | `4235c623` | NEW umbrella pillar over 5 existing combos; Maple Distributing US parts; electronic-control; honest oven-temp-accuracy pattern (2+ sourced) |
| 5 | `fivestar-range-repair` | `825c7df5` | Brown Stove Works TN since 1935, last independent US range maker; active factory = parts, no orphan risk |
| 6 | `forno-range-repair` | `e55b0b95` | Forno Appliances ≠ Forno Bravo; made-in-China budget honest; sourced failures; budget repair-vs-replace |
| 7 | `elmira-stove-works-repair` | `34710d22` | Northstar retro gas/electric + fridges; active Canadian factory parts; wood cookstoves NOT emphasized (SCAQMD) |
| 8 | `heartland-appliance-repair` | `b23ee4d1` | **ORPHAN** (mfg ceased Oct 2019); honest parts-reality (AGA Marvel legacy + third-party, degrading); repair-if-sourceable-else-replace |
| 9 | `true-residential-outdoor-refrigerator-repair` | `8b8279cd` | UL-rated outdoor line; commercial-grade forced-air; residential/commercial disambiguation; **American-made/independent framing** (see SSOT flag) |

Build 1170 → **1179, 0 errors** (build-gate before every commit).

## Zero-invention discipline (this tier invents facts — held the line)

- **No failure pattern published without 2+ sources.** Only AGA (already-live page), Fulgor
  (oven-temp, 2+ sourced), and Forno (ignition/bake/simmer/knobs, 2+ sourced) carry named
  patterns. Lacanche, La Cornue, Officine Gullo, Elmira, Heartland, True Outdoor = framed on
  wear items / parts-reality only, no invented defect.
- **Parts-import story = the content** for French/Italian brands (Art Culinaire, La Cornue
  USA/Coast, Officine Gullo Florence-direct, Maple Distributing).
- **Owner-neutral / stale-ownership avoided:** La Cornue/AGA Middleby→26North (Dec 2025) not
  stated; True framed American-made/independent (correct), not Middleby.
- **Honest negatives shipped:** Officine Gullo "not an authorized servicer"; Forno made-in-China;
  Heartland orphan / part-may-be-unobtainable; Forno/Heartland budget-and-orphan replace math.

## ⚠ SSOT doc-fix flag (business-fact, Roman's call)

`docs/factual-accuracy.md §1` says **"True Manufacturing = Trulaske (commercial) | True
Residential (Middleby) — другая компания."** Research (True/Caliber heritage, BBQGuys,
Reviewed) + **our own existing `true.astro`** (which already says "independent American-made
since 1945") show this is **wrong**: True Residential is the home division of True
Manufacturing (Trulaske, O'Fallon MO); Middleby's residential refrigeration is U-Line/Marvel.
The new True-outdoor page uses the correct (American-made/independent) framing to match the
site. **Recommend fixing the factual-accuracy.md line** in a separate docs commit — not done
here (business-fact change = Roman sign-off). No page states Middleby.

## Skipped, honestly

- **Caliber** — SKIP: now "True Caliber" (Feb 2025) but SERP is dominated by Caliber Collision
  / Caliber Auto Glass (auto), zero branded repair demand. Not built.
- **AGA / American Range / Big Chill / Perlick / U-Line enrich** — already deep (see table).
- **Covered-7 (Gaggenau/Monogram/SKS/Hestan/Cove/BlueStar/Garland)** — already >2000 dist,
  left as-is.

## Compliance (dist, all 9)

aggregateRating 0 · BBB A+ 0 · 6230 Wilshire 0 · BHGS Licensed/CA BHGS 0 · Cyrillic 0 ·
every `$120` = footer chrome (body `$89`) · FAQPage on all · titles ≤45 · no forbidden
voice phrases · wave46 org schema (creds+hours+location) on all · geo-neutral titles/H1 with
BH/Bel Air/Malibu/Newport woven into prose.

## Hero images — PENDING (flagged, not blocked)

Gemini key present (`secrets/gemini-key.txt`), but the info-photos hero generation ran as a
manifest+batch pipeline (21:9 1920×840, 6-file adaptive set, single-person/composition
rules), not a one-shot brand-hero tool. Per task rule ("if generation fails 2x → flag pending,
don't block"), heroes are **PENDING as a follow-up photo batch**. All 9 pages render correctly
without them — ServiceHero MODE A auto-detects `public/images/brands/{slug}/hero.*` via
`existsSync` at build, so heroes drop in later with zero page edits.

## Next

- **DO NOT merge/push** (per Roman). Awaiting merge signal.
- On merge: `cd C:\Users\Roman\WebstormProjects\sdar-v2 && git merge feature/luxury-wave-3
  && git push` → Cloudflare → IndexNow 9 URLs → update current-status.
- Separate: docs/factual-accuracy.md True-ownership fix (Roman sign-off); hero photo batch.
