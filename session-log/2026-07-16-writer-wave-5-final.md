# 2026-07-16 — Writer wave 5 FINAL + Phase 5 sweep: the 87-city rollout is closed

## Final state (origin/main `571b8f00`)

| metric | count | skips |
|---|---|---|
| city pillars | 87 | — |
| photos (`neighborhood.webp`) | **87/87** | none |
| `bgImage` wired | **87/87** | none |
| `CommercialSection` | **86/87** | san-marino |
| `OutdoorSection` | **85/87** | koreatown, malibu |

All three skips are decisions with a reason, not gaps:
- **san-marino** — its `introParagraphs[1]` says verbatim *"San Marino is entirely residential
  — no commercial strips, no apartment buildings, no industrial zones."* That is live indexed
  prose using the absence of commerce as a selling point. A commercial kitchen section
  contradicts the page. Skipped this wave, documented.
- **malibu** — has native outdoor prose (12 BBQ + 10 outdoor-kitchen mentions) and its own
  card. An OutdoorSection would duplicate it. Decided in wave 1 (`040fd4a7`).
- **koreatown** — one BBQ mention on the whole page; dense urban housing with no yards.
  Decided in wave 2 (`852a0dc8`).

## Wave 5 shape

3 wraps (oxnard, santa-ana, westwood — dedicated consts consumed unchanged), 24 commercial
written new, 28 outdoor written new, **0 lifts**. There was no outdoor prose anywhere in the
28 to move.

**No premium outdoor pills on any of the 28.** Not one page in the set names a single outdoor
brand — Lynx/DCS/Twin Eagles/Alfresco/Coyote/Bull have zero occurrences across all 28 files.
Six are priceRange `$$$` with heavy premium evidence, but all of it is indoor estate brands.
Pasadena precedent applied uniformly.

## Two $120 notes carried forward

- **santa-ana** — a prior pass deliberately stripped `$120` from this page in four places and
  left comments saying so. The badge ships anyway: that pass removed the number from the
  intro, the PricingCards deck and the FAQ, which is exactly where factual-accuracy §9 forbids
  it, while the badge sits inside the commercial section, which is exactly where §9 permits it.
  Same discipline, not a reversal.
- **ventura** — `$120` already means "the cheap Viking igniter" four times on that page, which
  is its running argument. The badge is in its own block so §9 holds, but the page now uses
  `$120` for two different things. **Flagged, not fixed** — a copy call for Roman.

## Phase 5 sweep — results

- counts + skip list: above, all reconciled
- forbidden grep, whole dist: aggregateRating **0**, BBB A+ **0**, 6230 Wilshire **0**,
  BHGS Licensed **0**, CA BHGS **0**, cyrillic **0**
- fee-badge sanity across all 87: **0 anomalies**; no page renders `$120` and `$89` inside one
  block (§9's hard rule)
- broken-link scan, 10 random upgraded pages, every href in the new sections resolved against
  the dist URL list and the redirect map: **0 dead, 0 redirect-sources** (182 hrefs)
- deferred catch-up: none outstanding — purge was wave-4-photos only (image merge); wave 4 and
  wave 5 were text-only merges and needed none. IndexNow fired per wave: 28 + 14 + 28, all 200.

## Deploy

`73b8ec3c` → merge `571b8f00`. Cloudflare took **~4 minutes** — no repeat of the stall that hit
the two previous merges today (~30 min on writer wave 4, ~1.5 h on photo wave 3 yesterday).

Prod verified: **28/28** live with both sections; san-marino confirmed on prod to carry its
"no commercial strips" claim **and** zero commercial badge — the contradiction was avoided in
production, not just in source. IndexNow → 28 URLs, 200.

## Lessons

- **A gate that reads a marker, not the text, lies.** Verifying prod with
  `v2-pills__label">Premium outdoor brands` returned a false 0 on beverly-hills, because Astro
  injects `data-astro-cid-…` before the `>`. A working feature nearly got reported as broken.
  Match on rendered text.
- **A transient prod fetch mid-deploy reads as a bug.** The first pass of the 28-page prod check
  reported lake-elsinore and menifee missing their badge; both were fine seconds later. Re-check
  before believing a single fetch during a deploy window.
- **Dupe pressure rises as a template wave grows.** Wave 5 needed 5 rewordings (15 colliding
  8-grams) where wave 4 needed 1 — 28 cities sharing "inland heat" and "coastal salt" as the
  only honest angles will converge unless each is checked against every other and against
  everything already live.
