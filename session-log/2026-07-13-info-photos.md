# 2026-07-13 — Info-layer photo layer (project COMPLETE)

**Merge:** `ac16d5c5` (feature/info-photos → main, fast-forward, 431 files).

## What shipped
- **71 hero images** for all net-new service/outdoor info pages (I-1…FINAL).
- Gemini `gemini-2.5-flash-image`, 21:9 1920×840 ServiceHero MODE A full-bleed,
  6-variant responsive set (hero/960/640 × webp+jpg), exif stripped.
- Rules baked + documented (docs/photo-pipeline.md §8.1): composition (subject
  right half, left ~40% clean under text card), exactly-one-person / no-interaction,
  brand-neutral, no readable brand/logo/model-plate.

## Process
- Phase A: manifest wiki `research/info-photo-manifest.md` (74 rows, templates).
- Pilot: 6 + 2 images; Roman review → 3 fixes (composition rule, air-gap precise-
  geometry attempt-2 = correct fitting, single-person microwave regen v3).
- Full run: 5 batch commits (dishwasher 14 / dryer 11 / refrigerator 17 / washer 9 /
  freezer+ice-maker+microwave+oven+outdoor 12). Build 0 err + commit per batch.
- Verification: per-batch spot-glance of person-scenes for phantom-people; all clean.

## Deferred / notes
- 2 blog Sub-Zero pages: BlogLayout has no photo-hero slot (separate task).
- hoshizaki: already uses shared commercial/ice-machines cluster hero.
- Scene index for review: dist/photo-review.html (localhost).

## Deploy status
- Origin sdar-v2.pages.dev: all new heroes serve image/webp — build correct.
- Custom domain samedayappliance.repair: serves stale text/html fallback for the
  NEW image paths until **Cloudflare Purge Everything** (no CF creds on terminal).
  ACTION FOR ROMAN: Cloudflare dashboard → Caching → Configuration → Purge Everything
  (or API purge with token). Re-verify image/webp on the custom domain after.
- IndexNow NOT pinged (image-only change, no new/modified URLs).

**Info-layer project (content I-1…FINAL + photos) — CLOSED.**
