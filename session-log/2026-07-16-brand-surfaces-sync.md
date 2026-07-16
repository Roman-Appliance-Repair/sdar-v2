# 2026-07-16 — Brand surfaces sync: MegaMenu + /brands/ hub reachability

Merge `1dc2c060` on main (branch `fix/brand-surfaces-sync`, commit `b3684fbb`).
Two files: `src/components/MegaMenu.astro`, `src/pages/brands/index.astro`.

## Where the work was found

The branch already existed and was **complete** — `b3684fbb`, pushed, local == origin.
All 8 spec items were done; only the merge had never happened. Nothing was rebuilt.

- Main had moved 3 commits (`ac185059`, `98e3718e`, `e3139184` — ServicesGrid v2),
  touching only `ServicesGrid.astro` + a session log. **Zero overlap** with the two
  brand files, so the merge was conflict-free and no re-verification against a
  changed MegaMenu structure was needed.
- The premise that "dark luxe merged" into main is **not the case** — no such commit
  exists in main's history. Main was 3 commits ahead, not "a lot".
- No uncommitted brand-sync work in any of the 4 worktrees. `wt1` had been switched
  back to `feat/services-grid-v2`, which is why its MegaMenu.astro looked unmodified.

## What the change does

The nav lists brand pillars; the hub lists brands by appliance. They had drifted:
a brand was often reachable only through a category combo, and 19 pillars with real
pages had no nav entry at all — pages we had already written carried no brand-level
link from either surface.

| surface | before | after |
|---|---|---|
| MegaMenu total | 58 | **76** |
| — Residential Premium | 13 | 18 (+Gaggenau, GE Monogram, Bertazzoni, BlueStar, Hestan) |
| — Residential Mass | 9 | 17 (+GE Café, GE Profile, Electrolux, Asko, Speed Queen, Haier, Kenmore, Panasonic) |
| — Specialty | 10 | 12 (+Zephyr, Broan; retitled "Specialty, Wine & Ventilation") |
| — Outdoor | 7 | 10 (+Blaze, Bull, Coyote, Napoleon; −Hestan) |
| hub pillar cards | 48 | 50 (+Smeg, +U-Line) |
| hub "Residential Brand Pillars" | — | **new section, 51 tags** |
| hub dead tags | 5 | **0** |

**8 pages gained links they never had on the hub**: Thor + ZLINE (Ranges/Value),
EuroCave/Le Cache/Vinotemp + Danby/Summit/Wine Enthusiast (Wine Coolers). Of these,
only **Thor, ZLINE and Le Cache were true orphans** (no inbound link anywhere); the
5 wine brands were already in the nav.

**Counters** — the convention was first derived and validated (X = live, Y = total,
`∞` = open-ended; commercial sections count brands only, excluding category chips).
17 of 25 untouched sections matched exactly, which confirmed the model. 7 fixed:
Dishwashers 28/28→27/27, Washers & Dryers 25/25→24/24, Ranges 37/37→39/39,
Ice Makers 13/13→11/11, Specialty Categories 4/∞→3/∞, plus two that were **already
wrong before this change**: Wine Coolers 9/8→15/15, Frozen Beverage 1/5→1/1.
Toggles: `20 brands · 55 pages` → `51 brands · 313 pages`; `13 brands · 11 categories`
→ `11 categories · 70 pages`.

## Two spec deviations, both evidence-backed

**Magic Chef is NOT in the nav** (15 residential pillars added, not the 16–17 the spec
listed). `/brands/magic-chef/` serves a **434-byte noindex redirect stub** to
`/services/refrigerator-repair/` (`astro.config.mjs`) — the `.astro` file exists but the
URL is 301'd. A nav entry would point at a redirect. The hub card keeps its href
override for the same reason, now commented so it does not get "fixed" later.
**Lesson: a `.astro` file existing does not mean the URL serves a page** — every href
in this change was verified against `dist` by title, not by file existence.

**CaptiveAire was a false positive** in the earlier audit's "invisible pages" list.
It was already linked from both nav and hub (`brands/index.astro:890`, `CaptiveAire Hub`).
The audit regex required `slug`/`label` to be adjacent, but the **96 commercial rows**
order keys `slug, href, label` — so the whole commercial format was skipped silently.
So it was 8 invisible pages, not 9. CaptiveAire is untouched.

## Hestan split-target

Hestan leaves the Outdoor column and sits in Residential Premium → `/brands/hestan/`,
matching how Viking and Wolf already resolve. **This is the only existing nav link
removed.** `/outdoor/brands/hestan/` drops from **1180 inbound → 12** (it was in the
global nav). Not orphaned: still reached from the hub's Outdoor & BBQ tier, city pages,
sibling grill pages, and the indoor pillar.

## Verification

- Build **1179 pages, 0 errors** (post-merge on main).
- `/brands/` full link scan: **622 internal links, 0 broken, 0 redirect stubs**,
  0 disabled tags (was 5).
- All 29 new targets confirmed by `dist` title.
- Diff-guard: **0 links removed from the hub**; site-wide exactly 1 removal
  (`/outdoor/brands/hestan/`, intentional).
- Prod (`samedayappliance.repair`) after edge convergence (~5 min, sampled until 3
  consecutive hits — early samples were mixed mid-propagation): all 15 nav pillars +
  4 outdoor present, magic-chef absent, hub shows Thor/ZLINE/Smeg/U-Line + the new
  pillar section, 5 dead tags gone, both toggles correct.
- IndexNow: **30 URLs, HTTP 200** (hub + 3 orphans + 5 wine + 15 nav pillars +
  4 outdoor + 2 cards). Text-only merge → no Cloudflare purge needed (methodology §5.1).
  Note: **IndexNow does not reach Google** (Bing/Yandex/Naver/Seznam only) — if Google
  re-crawl matters here, that needs GSC.

## Open item (flagged, not fixed)

The Brands panel now needs **1029px of viewport height** (tallest column = 18 rows).
Fits a 1080px viewport with ~51px to spare — the spec's target — but **overflows a
900px-tall laptop by ~128px**, which it did not before. Rebalancing cannot fix it
without breaking the tier columns: 47 residential pillars over 3 columns needs ≥16
rows, and 900px allows 14. Not papered over with an internal scrollbar (explicitly
disallowed). Options if it matters: accept, add a 4th residential column, or drop
brands from the nav. Panel height is content-driven (no `vh`/`max-height` on the
desktop panel), so the 1080 figure is derived from measured geometry — the window was
maximized and the resize API could not change the viewport to observe it directly.
