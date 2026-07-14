# L-3 hero "render fix" — actually an image-CONTENT fix (11 prior-wave heroes)

**Date:** 2026-07-13 · **Branch:** `feature/l3-hero-render-fix` → main (`6ad5af86`).

Roman (incognito, fresh build): true-residential + perlick still VISUALLY show the 3-techs
default hero. Hypothesis: layout renders hero as CSS background pointing to default.

## STEP 1 — render layer is NOT the bug (proven)
officine-gullo (works), true-residential-refrigerator-repair, perlick-commercial ALL use the
same ServiceHero. Dumped the full `<picture>` construct from each dist HTML — **byte-identical**:
6 `<source srcset>` + `<img src>` all pointing to the page's OWN `/images/brands/{slug}/hero.*`.
**Zero `/images/hero/` default refs, zero `background-image`.** No render difference to fix.

## Root cause — image CONTENT
Metadata tell: prior-wave heroes carry EXIF/ICC (seo/brand-photos wave); my regenerated ones
are sharp-stripped. Check across the 20 L-3 pages: 11 still had EXIF = **prior-wave generic
technician (3-techs) images** — md5-unique (≠ homepage) but visually the "default." Roman was
viewing `true-residential-refrigerator-repair` (indoor) + `perlick-commercial`, both prior-wave.

## STEP 2 — fix (regenerate the 11, render untouched)
Regenerated brand-accurate (`gen-l3-heroes-v3.mjs`): ge-monogram, signature-kitchen-suite,
hestan, cove, american-range-repair, bluestar, garland, big-chill-refrigerator-repair,
perlick-commercial, u-line, true-residential-refrigerator-repair. Brand-signature design
prompts, no readable text, no-people showcase. 11/11 ok, 0 failed. Metadata now stripped on
**all 22** L-3 heroes = all brand-accurate.

## STEP 3 — verify the right layer (dist)
gullo reference construct = `<source ... srcset="/images/brands/officine-gullo-range-repair/
hero.webp">` + own `<img src>`. 22-row check: every page own-webp-in-construct=1, default-ref=0,
content=brand-accurate(stripped). Build 1179, 0 errors.

## STEP 4 — deploy + purge + prod verify
Merged → push (`git ls-remote origin main = 6ad5af860ea2418439d0ccc5d898c727c9e95aa7`). Deploy
polled to Success on pages.dev. **cf-purge.py ran end-to-end → "Purge Everything OK"** (token
saved to secrets/cf-purge-token.txt by Roman; zone id auto-resolved + cached
02dae3755bd98329d858b8a109555b50). Post-purge production (3 samples) — hero src = own file,
image/webp, **md5 prod == local dist** (new brand-accurate live), cf-cache MISS→will HIT:
- true-residential-refrigerator-repair: b4f8ac1a… MATCH
- perlick-commercial: 86ed2ea5… MATCH
- aga-stove-repair: ac432398… MATCH

Lesson: verify the IMAGE BYTES (md5 prod vs dist), not just the `<img src>` string — a unique
src can still point to generic content. cf-purge.py now automates the purge step (methodology §5.1).
