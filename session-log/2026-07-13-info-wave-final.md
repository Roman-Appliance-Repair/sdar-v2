# Info Wave FINAL (W7+W8+W9 combined) — remaining backlog sweep + air-gap flagship

**Date:** 2026-07-13
**Branch:** `feature/info-wave-final` (worktree `sdar-v2-wt1`, off fresh `origin/main` a9c945dc — post-W6)
**Status:** ✅ 12/12 pages written, built, committed. NOT merged, NOT pushed — awaiting merge signal.

---

## What

The final info wave, combining the W7/W8/W9 tail of `research/info-demand-backlog.md`
plus a task-supplied flagship (dishwasher air gap). 12 net-new pages, capped at the
strongest of the remaining runway. Two-phase (verify → WAIT "ок" → write); Roman
approved 12 with one swap (drop generic not-drying, already shipped by W6; add
maytag-not-draining).

Branch was **recreated off fresh origin/main (a9c945dc)** before Phase 2 so the route-check
saw W6 already merged (W6 shipped: lg/bosch/whirlpool dishwasher error-codes, whirlpool
not-cleaning, whirlpool not-drying, generic not-drying).

Ahrefs re-verified (US, 2026-07-13): air gap **6200** + "air gap dishwasher" 2100 confirmed;
all 11 backlog finalists held their volumes.

## The 12 pages

| # | URL | vol | KD | commit | differentiator |
|---|---|--:|--:|---|---|
| 1 | dishwasher-repair/air-gap | 6200 | 0 | `dd22137d` | **FLAGSHIP** — CA plumbing code §807.3 (air gap required; high-loop not a CA substitute; FL marking ≥ sink flood level); "no air gap in LA = not code-compliant"; safe-DIY clear of spitting air gap |
| 2 | dryer-repair/squeaking | 3100 | 0 | `7846f737` | generic; sound-map (rollers/idler/glides/belt/bearing); squeal-vs-grind stop-now escalation |
| 3 | washer-repair/whirlpool-not-draining | 2400 | 0 | `ae5d57a2` | Whirlpool platform; F9E1 long-drain; won't-drain=won't-spin |
| 4 | washer-repair/maytag-not-draining | 1200 | 0 | `557566ff` | honest 10-yr warranty (motor+basket only, NOT pump); Bravos/Maxima |
| 5 | washer-repair/samsung-not-spinning | 2300 | 0 | `5144a9f0` | UR/UB unbalance (#1, often not a fault); 5C/SC drain; dC door |
| 6 | washer-repair/ge-not-spinning | 2000 | **27** | `1529a56c` | GE symptom-diagnosed; lid switch classic + listen-for-click test |
| 7 | microwave-repair/samsung-not-heating | 1600 | 0 | `05698aed` | **bold HV-capacitor safety block** (lethal charge even unplugged; never open) — microwave = gas frame |
| 8 | microwave-repair/lg-not-heating | 1200 | 0 | `523d921a` | pair; same HV block; NeoChef/inverter-board angle |
| 9 | oven-repair/samsung-not-heating | 1200 | 0 | `396c5407` | CPC 140¢ top-value; bake element (#1) + self-clean thermal fuse |
| 10 | oven-repair/whirlpool-not-heating | 1100 | 2 | `9d8d40f8` | gas igniter (glows-but-weak = classic gas no-heat) + electric element |
| 11 | freezer-repair/lg-not-freezing | 1300 | 0 | `b2840988` | linear compressor + 10-yr warranty (reuse W5); defrost/coils/fan |
| 12 | freezer-repair/frigidaire-not-freezing | 1000 | 0 | `bfa8f80c` | control board weak point (reuse W5) + chest manual-defrost / garage false alarms |

Captured ≈ 28,700/mo primary volume + TP tails. Build 1158 (post-W6) → **1170, 0 errors** (+12,
build-gate before every commit).

## Clusters (internal linking)

- **Dishwasher:** air-gap ↔ not-draining / leaking-water / whirlpool-bosch-ge not-draining.
- **Washer:** whirlpool+maytag (drain pair, shared platform) + samsung+ge (spin pair) — all
  cross-link each other + wont-spin/not-draining generics + **W4 code umbrellas** (samsung/
  whirlpool/maytag/ge-error-codes already live) — strong existing-cluster tie-in.
- **Microwave:** samsung ↔ lg + generic not-heating + no-power.
- **Oven:** samsung ↔ whirlpool + oven error-codes + not-heating + temperature-off.
- **Freezer:** lg ↔ frigidaire + generic not-freezing + ice-buildup + their W5 not-cooling
  siblings + fridge-not-cooling-freezer-works.

## Zero-invention

- **Air gap:** CPC/UPC §807.3 verified from up.codes + CA-requirement sources (2+). No invented
  code numbers.
- **Microwave HV safety:** consensus fact (lethal stored capacitor charge) — no fabricated
  brand codes; LG inverter/NeoChef stated correctly.
- **Oven:** gas igniter glow-but-weak / bake element / self-clean thermal fuse — reuse I-3
  oven-codes facts.
- **Washer:** Whirlpool F9E1 + Samsung UR/5C/dC + GE lid switch — reuse W2/W4 verified sets.
  Maytag 10-yr warranty scope (motor+basket only) stated honestly.
- **Freezer:** reuse W5 cooling set (LG linear compressor, Frigidaire control board); freezer
  0°F + USDA 48h/24h figures.

## Humanizer gate (lightweight per Roman)

Run lightweight on all 12 — SDAR standard prose is human-grade; 0 substantive flags. No
AI-cliché/filler to auto-accept, nothing touching facts to auto-reject.

## Compliance (dist, all 12 verified)

aggregateRating **0** · BBB A+ **0** · 6230 Wilshire **0** · BHGS Licensed/CA BHGS **0** ·
Cyrillic **0** · every `$120` = footer chrome only (body `$89`) · FAQPage 5Q on all ·
titles ≤52 chars · microwave HV danger-block present on both · air-gap §807.3 ×14.

## Backlog closed / what remains

**W7/W8/W9 tail is now closed** — the strongest 12 shipped; the rest are below the cut and do
not warrant a wave:
- Freezer tail: samsung 700 (TP3500), whirlpool 600, ge 400.
- Oven tail: lg 200; oven-codes: samsung 200.
- Washer tail: samsung not-draining 1400 (samsung already has a spin page — skipped to avoid
  over-indexing one brand), lg not-spinning 600, kenmore not-draining 800, amana not-draining 400.
- Generic: refrigerator making noise 700 (TP3300 — the strongest leftover; a candidate if a
  future wave is ever warranted, but below this cap).
- Dryer: whirlpool not-spinning 1300, ge not-spinning 200; samsung leaking 300.

**Full brand×symptom info runway (I-1 → W-FINAL) is now effectively complete** at KD≈0. The
only remaining ≥1000 item is refrigerator-making-noise 700/TP3300 (generic), intentionally left.

## Next

- **DO NOT merge/push** (per Roman). Awaiting merge signal.
- On merge: `cd C:\Users\Roman\WebstormProjects\sdar-v2 && git merge feature/info-wave-final
  && git push` → Cloudflare deploy → IndexNow ping 12 URLs → update current-status.
