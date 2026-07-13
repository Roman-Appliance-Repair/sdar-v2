# Luxury Wave L-2 — Viking + Thermador + Miele (enrich)

**Date:** 2026-07-12 · **Worktree:** `sdar-v2-wt2` · **Branch:** `feature/luxury-wave-2`
(off `origin/main` @ `cb18806d`) — **NOT merged/pushed** (Roman merges after review).
**Wiki:** briefs `page-plans/luxury-wave-2/` (commit `472298b`) + data-sheet warranty
corrections (commit `a9b27e0`), both local on wiki `master`.

## Reshaping finding: demand even thinner than L-1 → enrich wave, and verify-first collapsed it further
Ahrefs (US): brand-level problem/lifespan queries near-zero. Only notable:
`viking range repair` 900 ($450 CPC), `miele dishwasher not draining` 350 — both
already robust existing combos. **Lifespan queries = 0 → no flagship** (unlike Sub-Zero).
Recommended 6 ENRICH targets; audit-first then showed **half were already complete**.

## What shipped (4 enriched) vs skipped (2 already complete)
| Page | Action | commit |
|---|---|---|
| `/brands/viking-range-repair/` | ENRICH — honest Middleby parts framing (legacy EOC boards NLA / board-rebuild) + code-honesty line + FAQ | `ec347653` |
| `/brands/viking-refrigerator-repair/` | ENRICH — same Middleby parts-reality section (legacy control boards NLA) | `bcd462e1` |
| `/brands/thermador-oven-repair/` | ENRICH — older-model F-codes (F2/F3/F4/F9/Fd) vs modern E-codes + honest "circulating E01-E20 tables not confirmed" line | `1d4dd4aa` |
| `/brands/miele-washer-repair/` | ENRICH — 20-yr claim caveat (compliance) + F34/F35 door-lock code | `3fa41bd6` |
| `/brands/miele-dishwasher-repair/` | SKIP — already has full F-code table (F11-F607), F11 drain + non-return valve + not-draining FAQ | — |
| `/brands/thermador-dishwasher-repair/` | SKIP — already has E15/E22 + thorough drain coverage (filter 80% → hose → pump) | — |

## Key operational finding — a redirect masqueraded as a thin page
The brief targeted `thermador-wall-oven-repair` as "thin 2325w." That word count was the
**redirect-source** `.astro`: `/brands/thermador-wall-oven-repair/` is a **301 → `/brands/
thermador-oven-repair/`** (astro.config.mjs:196; dist stub = 450 bytes). A first enrich to
the stub was **built but dead** (content never renders); caught it on dist-verify (450 bytes,
"rendered words: 8"), `git reset --hard` the dead commit, and **retargeted the enrich to the
LIVE `thermador-oven-repair`** (174 KB). Lesson: verify dist file size, not just `.astro`
word count, before enriching a brand slot — two brand slugs (this + magic-chef) are redirect
overrides.

## Zero-invention / compliance
- Numbers from `research/reliability-data-sheet.md` (SSOT). **Data sheet updated first**
  (`a9b27e0`): Miele US warranty 1-yr → **2-yr** parts&labor; Thermador electronics/racks
  parts-only yrs 2-5 → **3-5** — both verified 2026-07-12 vs OEM. Pages use only confirmed terms.
- **Miele 20-yr claim**: published strictly as "tested to the equivalent of ~20 years /
  ~5,000 cycles, NOT a durability guarantee" (data-sheet Layer F) — fixed miele-washer which
  had asserted it without the caveat.
- **Not published** (per fact-gate): specific Viking discontinued part#, canonical Viking
  code table (version-dependent), fabricated Thermador fridge E01-E20 tables (called out
  honestly on-page), Miele dishwasher F14 (conflicted).
- **Honest-framing centerpiece delivered**: Viking/Middleby parts reality — consumables
  available, legacy pre-2013 control boards NLA (board-rebuild the practical path).

## Flag for Roman (pre-existing, not touched)
`miele-dishwasher-repair` has an internal inconsistency: the decoder table says `F24 =
heater relay error` (matches our OEM research) but the answer-first lead says "F24 fill
faults." Not L-2 scope and a correction to another writer's prose — flagged for a decision.

## Compliance (dist, 4 enriched pages)
Build **1116**, 0 errors. Titles 32-46 (≤60). aggregateRating 0, BBB A+ 0, Cyrillic 0,
$89 residential. All 4 are large live pages (174-182 KB).

## Next (post-review)
- Roman merges `feature/luxury-wave-2` → main (from main dir), deploys.
- After merge+deploy signal: IndexNow ping the 4 enriched URLs + update `docs/current-status.md`.
- Wiki: push `page-plans/luxury-wave-2/` + the data-sheet correction when wiki backlog is flushed.
