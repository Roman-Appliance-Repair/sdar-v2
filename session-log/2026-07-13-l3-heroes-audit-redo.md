# L-3 hero AUDIT + REDO (brand-signature regeneration)

**Date:** 2026-07-13
**Branch:** `feature/l3-heroes-v2` → merged to `main` (`aafb002b`), pushed.

Roman reviewed production: Officine Gullo hero broken (alt renders); Gaggenau/AGA/True
"default-looking". Prior "heroes done" reports had counted placed-but-generic/purge-pending
files as heroes. Full proof-based audit, then brand-accurate regeneration.

## PHASE 1 — Audit (proof)

Default homepage hero md5: webp `bdb415c2…`, jpg `52094f72…` (own homepage component,
`/images/hero/v1/`). All 20 L-3 pages render ServiceHero **MODE A** with `<img
src="/images/brands/{slug}/hero.jpg">`. Audit result:

- **Uniqueness was never the problem:** all 20 hero files md5-UNIQUE, **NONE == homepage
  default**. Literal "default homepage hero" renders nowhere.
- **Real problem #1 — Cloudflare cache:** `officine-gullo/hero.webp` served **text/html** on
  the custom domain (stale edge-cache from the deploy window; its `.jpg` served fine). The
  `<picture>` element prefers the webp `<source>` → browser fetched webp → got text/html →
  hero broke → alt text rendered = exactly what Roman saw. Needs **Purge Everything** (the
  dist webp is a valid 1920×823 image). Only officine-gullo (of the 9 new) + thor (no hero,
  MODE-B) served text/html; the other 18 served image/webp.
- **Real problem #2 — generic imagery:** the 9 new heroes were generic luxury AI, and the
  existing brands (gaggenau/aga/etc.) carry prior-photo-wave generic-technician scenes —
  unique files, but not the brand's SIGNATURE design. That's the "default-looking" Roman meant.

**Why prior checks "passed":** ServiceHero MODE A turns on when `existsSync(hero.webp) &&
existsSync(hero.jpg)`. The prior check verified (a) the HTML references the path and (b) the
file exists in dist — it did NOT verify (c) production actually serves it as an image
(officine-gullo webp was purge-pending) or (d) the image is brand-accurate vs a generic
placeholder. Any file at the slug path passes existsSync → the page looks "filled."

## PHASE 2 — Redo with brand-signature prompts (11 regenerated, 0 failed)

Reference-image download was unreliable in this environment (Wikimedia URL guessing 400s;
WebFetch returns markdown not binary), so used the **air-gap precedent: research-informed
detailed design prompts** — each prompt describes the brand's real design language so the
generated appliance resembles it, not a generic box:
- Lacanche colored porcelain-enamel + polished brass trim/rails, cast-iron grates, French
  country kitchen. La Cornue Château domed vaulted oven + brass rivets over enamel, estate
  kitchen. Officine Gullo brushed-riveted steel + solid brass, Florentine. Fulgor modern
  Italian pro-range. FiveStar American commercial-grade stainless. Forno value stainless +
  accent knobs. Elmira 1950s pastel-enamel + chrome retro. Heartland vintage cream/red enamel
  + chrome. True commercial stainless outdoor fridge in a stone patio island. Gaggenau
  minimalist anthracite Vario + combi-steam. AGA cast-iron heat-storage cooker with two round
  chrome-domed hotplate lids, English country kitchen.
- Rules: **NO readable brand/logo/badge/text anywhere** (design language only), NO-PEOPLE
  design showcase, varied premium kitchen per brand, 21:9, ≤3 attempts, persistent fail →
  flag (no default fallback). 6-file adaptive set each, metadata stripped, webp 16–140KB
  (true recompressed 168→140).
- **11/11 generated, 0 failed, 0 flagged.** Regenerated: the 9 new + the 2 Roman-flagged
  existing (gaggenau, aga-stove-repair). Scripts: `gen-l3-heroes-v2.mjs` + `-v2b.mjs`.

**Existing 8 NOT regenerated** (bluestar, american-range-repair, big-chill-refrigerator-repair,
perlick-commercial, u-line, garland, ge-monogram, hestan): they carry prior-photo-wave heroes
(working, unique). Roman flagged only gaggenau/aga individually; regenerating the other 8 =
overwriting another wave's images uninvited → left for a decision (can do on confirmation).

## UNIQUENESS GATE (dist hero.webp md5)

19/19 unique, **none == homepage** (`bdb415c2`), all 11 regenerated **CHANGED** vs pre-regen.
Full hash list in the report / status entry.

## PHASE 3 — merge + deploy

Merged `feature/l3-heroes-v2` → main, pushed. `git ls-remote origin main` →
`aafb002b2cdc11cfd49754dbd2a92d8c9e9dc5ae`. Build 1179, 0 errors.

**⚠ Purge Everything required (Roman):** regenerated images overwrite existing paths, so the
custom domain serves the OLD cached bytes until Purge; pages.dev serves the fresh deploy.
Post-purge, curl all 20 → image/webp with the new sizes. No CF credentials at the terminal.
IndexNow not needed (image-only, URLs unchanged).

**Text-verification caveat:** prompts strongly forbid any readable text; no OCR available here
to programmatically confirm zero text — best-effort by prompt constraint + spot visual review.
