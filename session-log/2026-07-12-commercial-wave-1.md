# 2026-07-12 — Commercial Info Wave C-1 (Hoshizaki beep-codes enrich)

**Merge:** `1db5b985` on main (branch `feature/commercial-info-wave-1`, worktree wt1).
**Title-fix:** `43a1896d`. **Build:** 1116 pages, 0 errors. **IndexNow:** 200 (7 URLs, combined with I-3).

## Verify-first collapsed the wave 6 -> 1
Premise "commercial cluster = ZERO info sub-pages" was WRONG — my 2026-07-11 inventory
bucketed 185 commercial pages without sub-page breakdown. commercial/ice-machines/ is
already heavily built (error-codes generic + hoshizaki + manitowoc; troubleshooting x3;
not-making-ice x5; cleaning/cube/flake/nugget/water-leaking/dispenser). commercial/
refrigeration/ too (walk-in cooler/freezer not-cooling + troubleshooting + freezer-not-freezing).

Of 6 candidates: hoshizaki/manitowoc error-codes + not-making-ice + walk-in-cooler-not-cooling
ALREADY EXIST. Scotsman-error-codes NOT built (cannibalizes robust scotsman-troubleshooting,
3640 tok, already reads AutoAlert codes). Walk-in ice-buildup NOT built (0 demand).

## The one action: ENRICH hoshizaki-error-codes (~3560 -> 4546 wd)
New section "Why is my Hoshizaki beeping? Count the beeps" captures
"hoshizaki ice machine beeping" 800/mo (KD0, AI overview) — was 0 coverage site-wide.
- Beep-count 1-9 verified vs OEM (FD-1001 manual "7/8/9-Beep Alarm" headings) + Parts Town.
- Platform split: beep-alarm (US KM/flaker) vs EverCheck LCD E-1..E-6. Existing EverCheck
  prose preserved; change is additive.
- Operator-safe checks (breaker 6/7, bin-full 9, water/condenser/filter 1/2/3).
- FDA angle: ice = food under FDA Food Code, "clean to sight and touch" 4-601.11 (verified).
- +2 FAQ. Title -> "Hoshizaki Beeping & Error Codes LA — Same Day".

## Not touched
manitowoc-error-codes — audit showed Safety 1/2 <-> E01/E02 linkage + platform split already
present, so left alone per instruction. CSLB C-38 existing referral pattern unchanged (never
claimed as our credential).

## Compliance
title 51 (source 45), FAQPage present, forbidden 0, aggregateRating 0, BBB A+ 0, cyrillic 0,
$120 commercial (14x; the single $89 is inherited footer chrome). Zero-invention: all beep
codes OEM/authorized, FDA claim verified.

## Live verify
- /commercial/ice-machines/hoshizaki-error-codes/ -> 200, beeping in title + H2 + description
