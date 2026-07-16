# 2026-07-16 — ServicesGrid v2: SVG icon set replaces emoji (all 87 city pillars)

Merge `98e3718e` (branch `feat/services-grid-v2`, commit `ac185059`). Visual only — no
content change, no IndexNow.

## Blast radius

`src/components/cities/v2/ServicesGrid.astro` is imported by **87 files — every city pillar
and nothing else**. The brief called this a 2-page pilot; because the component is shared,
it lands on all 87 at once. Verified in dist: **87 of 1749 pages changed**, 0 elsewhere.

## Two places the brief and the tree disagreed

**20 icons, not 12.** The brief listed the 12 core services. The tree uses **20 distinct
slugs**: the 12 plus `commercial-refrigerator` (5 pages), `range-hood` (5),
`outdoor-appliance` (3), `ice-machine` (3), `bbq` (2), `wine-cellar` (2), `wall-heater` (1),
`commercial` (1). Shipping 12 would have left those 8 rendering **nothing, silently** — the
same bug class as CommercialSection's `ICONS[e.icon]` with no fallback. All 20 are drawn,
plus an explicit `UNKNOWN_ICON` wrench so an unmapped slug can never be a blank card.
west-hollywood proved the point immediately: it carries `range-hood`.

**"12-card block" is wrong too** — 80 of the 87 pages carry **8** cards, 6 carry 12, 1 carries 10.

## Keyed on slug, not emoji

The emoji were never consistent: refrigerator is `❄️` on some pillars, `🧊` on others, `🔧`
on one; cooktop is `♨️`/`⚡`/`🍳`/`🔆`. Keying on the emoji would have inherited that. `slug`
is stable and is already what the card links on, so `iconKey()` and `toHref()` share one
normaliser and the icon can never drift from the link. The `icon` prop stays in the
interface (marked deprecated) so no page had to be touched — 1 file changed, not 88.

## Three icons failed at the size they ship

Drawn, they looked fine at 3x. Rasterised at a **true 24px and upscaled x8** — the same
trick used on the neighbourhood photos — three broke:

| icon | what broke at 24px | fix |
|---|---|---|
| dryer | airflow waves in the drum collapsed to a blob; only the silhouette separated it from washer | tumble-dry mark: drum + three dots |
| freezer | barbed 6-arm snowflake is mush inside ~10px of drawable area | bare 3-axis snowflake |
| wall-heater | vertical bars read as wine-cellar's rack | horizontal fins (what a wall heater actually has) |

All 21 (20 + fallback) verified distinct at size, including every pair that wanted to
collide: washer/dryer, oven/stove, refrigerator/commercial-refrigerator/freezer,
ice-maker/ice-machine, wine-cooler/wine-cellar/wall-heater, cooktop/stove.

## Treatment

Section: flat `--v2-gray` → warm `#faf8f5 → #ffffff` gradient. Not a photo — this block sits
next to photo-backed sections on every pillar and two images would fight. Cards: white,
radius 14px, `0 1px 3px rgba(0,0,0,.06)`, hover `0 6px 16px rgba(0,0,0,.10)` +
`translateY(-2px)`. Icon stays red on hover; only the title moves to red, so one thing
changes colour rather than two. Grid columns and breakpoints untouched.

`prefers-reduced-motion`: **verified, not assumed.** `global.css` zeroes `transition-duration`
under the reduce query, so the 2px offset applies instantly with no animation. The card
already had transform + transition before this change — no regression.

## Gates

Build 1179/0. Diff-guard against the **live production render** of both pilot pages: link
sets byte-identical (407→407, 430→430); every text delta is an emoji being removed —
**non-emoji text deltas 0**. CSSOM: icons are `<svg>` at exactly 24×24 in `rgb(200,16,46)`,
0 empty paths, unique paths per page (12/12 monterey-park, 8/8 west-hollywood), icon absent
from every hover rule. Contrast on card: title **19.80**, hovered red title **5.88**, icon
**5.88** — all over the 4.5 AA floor.

## Deploy

pages.dev live ~160 s, prod ~20 s after — **no stall**, unlike the two merges earlier today
(~30 min on writer wave 4) and yesterday's photo wave 3 (~1.5 h).

Prod `/monterey-park/`: **svg 12, emoji divs 0, emoji chars 0 across 12 cards, 12 unique
paths of 12, gradient live, radius 14px, fallback used 0**. Spot-checked west-hollywood,
beverly-hills, san-marino — 8 svg each, 0 emoji, gradient live.

## Flagged, not fixed

The brief expected **"mobile 2-col intact"**. The grid is 4 columns, **2 at ≤1024**, and
**1 at ≤480** — two columns is the *tablet* breakpoint; the component has never rendered 2
columns on a phone. Left exactly as-is per "keep columns/breakpoints as-is". If 2-col on
mobile is actually wanted, that is a real change to `@media (max-width: 480px)` and a
separate decision.

## Lesson

**Judge an icon at the size it ships, not at the size you drew it.** A 3x preview flatters
everything; rasterising to 24px and blowing that up shows the pixels the user actually gets.
Three of twenty were wrong, and none of them looked wrong until then. Same lesson as the
pizza-oven-vs-droplet pair, and the same method that caught the pseudo-lettering in the
wave-4 photos.
