# Luxury Wave L-3 tail (v2) — heroes + interlinking weld

**Date:** 2026-07-13
**Branch:** `feature/l3-tail-v2` → merged to `main` (`c40589f0`), pushed.
**Note:** worktree exception approved (single terminal, no parallel work); worked directly on
a branch in the main dir, returned to main to merge.

Redo of the L-3 tail — the prior session reported this done but produced no commits/files
anywhere (verified across all 3 worktrees + origin ls-remote). Treated as never done.

## PART 1 — Heroes (9/9 generated, 0 failed)

Generated + placed hero images for the 9 net-new L-3 brand pages via Gemini 2.5-flash-image
(`scripts/gen-l3-heroes.mjs`, gen + sharp place in one script). Per-slug 6-file adaptive set
`public/images/brands/{slug}/` — hero + hero-960 + hero-640, webp+jpg, 1920 wide 21:9,
metadata stripped. Rules applied:
- **Ultra-premium NO-PEOPLE closeups:** lacanche, la-cornue, officine-gullo (brass/enamel/
  steel range detail in an estate kitchen).
- **One-technician subject-right:** fulgor (board), fivestar (sealed burners), forno (igniter),
  elmira (retro range), heartland (retro range), true-outdoor (patio undercounter fridge).
- No readable brands/text; LEFT ~40% clean; single person where people appear.

hero.webp 30–76KB each (under the 80–150KB guideline = efficient/good LCP). ServiceHero MODE A
auto-picks via `existsSync` — verified rendered in dist HTML + 6 files copied to dist per slug.
Commit `32a9eac4`.

## PART 2 — Interlinking weld (orphans eliminated)

**Inbound before → after (dist, proof):**

| page | before | after |
|---|---:|---:|
| lacanche-range-repair | 2 | 4 |
| la-cornue-range-repair | 2 | 4 |
| officine-gullo-range-repair | 2 | 4 |
| fulgor-milano-repair | 0 | 6 |
| fivestar-range-repair | 0 | 3 |
| forno-range-repair | 0 | 3 |
| elmira-stove-works-repair | 1 | 3 |
| heartland-appliance-repair | 0 | 3 |
| true-residential-outdoor-refrigerator-repair | 1 | 4 |

Welds (commit `c40589f0`):
1. **brands hub** — added 9 curated `residentialCards` (new "LUXURY IMPORTS, PRO-STYLE, RETRO &
   OUTDOOR" group), matching existing card format. +1 hub inbound each.
2. **Tier cross-links both directions** via existing siblings' `related-links`:
   aga-stove-repair → lacanche/la-cornue/officine-gullo (ultra-premium); american-range-repair
   → fivestar/forno (pro-style); big-chill-refrigerator-repair → elmira/heartland (retro);
   sub-zero-outdoor-refrigerator-repair → true-outdoor.
3. **Fixed 5 pre-existing BROKEN links (bonus):** all 5 Fulgor combos linked bare
   `/brands/fulgor-milano/` — a 404 (no dist file, no redirect rule). Repointed every one to the
   new `/brands/fulgor-milano-repair/` umbrella → dead-link fix + fulgor umbrella +5 inbound.
4. **Intra-cluster mutual:** fivestar↔forno, elmira→heartland.
5. **Service hub:** `services/outdoor-refrigerator-repair` brand-list → true-outdoor.
6. **beverly-hills SKIPPED — honest:** the page has zero existing prose mentions of any of the
   9 new brands, and the task forbids new paragraphs, so there was no valid link point. The 9
   pages reach 3–6 diverse inbound without it.

Every new href verified against the dist file list — **0 404, 0 redirect.** Build 1179, 0 errors.

## Deploy / merge

Merged `feature/l3-tail-v2` → main (fast-forward), pushed. `git ls-remote origin main` →
`c40589f0eaf8fb8bedf7a8f14edc8615d352179c refs/heads/main`.

**⚠ This merge ships images** (54 hero files) — the custom domain needs a **Cloudflare "Purge
Everything"** for the new image paths (per the info-photos lesson: pre-purge it serves a stale
text/html fallback for new image URLs). No CF credentials at the terminal → Roman runs the purge.
Pages render correctly regardless; only the image bytes need the purge on the custom domain.

## Verify (dist + production)

- brands hub HTML contains `/brands/lacanche-range-repair/` (card renders) ✓
- lacanche HTML contains `/brands/la-cornue-range-repair/` (cross-link renders) ✓
- 9/9 hero.webp referenced in page HTML + copied to dist ✓
- Production spot-checks + IndexNow: see report / status entry.
