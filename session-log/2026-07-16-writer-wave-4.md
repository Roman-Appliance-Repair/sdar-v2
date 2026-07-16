# 2026-07-16 — Writer wave 4: 14 cities get commercial + outdoor sections

The 14 cities that received a neighborhood photo in an earlier wave but never received
sections. Four of them are flagships (Beverly Hills, Santa Monica, Pasadena, Newport
Beach) carrying live indexed prose, so the wave-1 rule held: prose moves, it never gets
rewritten.

## Shape (classifier first, as the brief required)

| verdict | cities |
|---|---|
| WRAP-DEDICATED | beverly-hills, santa-monica, pasadena, newport-beach |
| WRAP-EMBEDDED (lift) | anaheim (narrative p[3]), temecula (subSections[4]) |
| WRITE-NEW | the other 8 |

Outdoor: 13 written new + 1 lift (newport-beach, out of `introParagraphs`).

## What the classifier changed about the plan

- **The `$120` grep trap.** Zero of the 14 carried a commercial diagnostic fee — every
  commercial mention resolved to "Call us for commercial pricing." But a naive `$120`
  grep false-positives on 5 pages: 9 hits on anaheim are all in a header comment, and
  rancho-cucamonga/riverside/temecula have `$120-$320`-style *repair ranges* in
  PricingCards. Anchor fee assertions to the full badge string, not to `$120`.
- **Roman's call on the fee:** the badge ships and "Call us for commercial pricing" stays
  untouched. They are different things — that sentence is about repair pricing, the badge
  is the diagnostic fee. No seam note needed.
- **Two cities failed the premium bar on their own evidence** and ship without pills:
  riverside ("Hawarden Hills estates *sometimes* have Sub-Zero and Wolf"; identity is a
  $90 coupling vs an $800 replacement) and los-angeles (explicitly anti-estate register,
  priceRange $$). Same honest-scaling call as hemet in wave 3. torrance and pasadena's
  outdoor likewise.

## Seams

Roman's rule: fix the opener, one standalone sentence, document it.
- **newport-beach** outdoor opened "…see **this effect** even more acutely" — an anaphor
  pointing at the salt-air paragraph above it. Now "…see **salt-air exposure** even more
  acutely."
- **anaheim** commercial opened "**And** the resort area…" — a connector to three
  paragraphs that no longer precede it. One word dropped.
- **temecula** was not a paragraph lift at all but a `subSections[4]` with a title,
  "For Winery & Tasting Room Equipment". CommercialSection takes flat paragraphs, so the
  title had nowhere to live; dropping it would have been deleting rendered text rather
  than moving it, so it became the section headline. The wine-cooler headline it left
  behind is *more* truthful now — everything still under it is residential wine work.
- **anaheim intro left alone deliberately**: `introParagraphs[1]` still closes on "And
  then there's the commercial corridor…". Not liftable (IntroNarrative), and it now reads
  as a foreshadow rather than a handoff. Still true, still scans.

## Trap caught before it shipped

`CommercialSection` does `ICONS[e.icon]` **with no fallback**, and the map has exactly six
keys (snowflake, pizza-oven, fryer, oven, droplet, laundry). A wrong key renders an empty
`<path>` silently — no build error, no visible error, just a blank icon. First draft used
`hood` and `range`. Noted at every equipmentCards const.

## Gates

Build 1179/0 on both parts and on main after merge. **Diff-guard measured against the
PROD render, not the source**: 0 prose sentences dropped on all 14 (the only flagged
drops were the two intentional seams plus sentence-splitter artifacts where a new section
split a heading/grid run-together — every fragment verified still present). Links never
shrink on any page: 378-410 → 397-434. **0 duplicate 8-grams** among authored prose
intra-wave and against the 45 cities of waves 1-3 (riverside's outdoor opener was
reworded when the check caught it sharing a phrase with torrance; the 6 matches that did
appear were pre-existing boilerplate inside wrapped consts, verified present on
origin/main). Forbidden phrases 0, aggregateRating 0, BBB A+ 0, Wilshire 0, BHGS Licensed
0, cyrillic 0. Fee badges exactly one $120 + one $89 per city. 50 distinct hrefs verified
against the dist URL list — 0 dead, 0 redirect sources. Browser-checked 6 across both
parts.

## Deploy

`b290e342` (part 1, 7 files) + `b39916bd` (part 2, 7 files) → merge `85255f1d`.
Counts on origin/main: **commercial 45 → 59, outdoor 43 → 57**, bgImage stays 87/87.

**Cloudflare stalled again.** Same signature as yesterday's `b13b206e`: >10 min with no
new content, and critically **pages.dev is serving the identical stale bytes** (198,346
both) — so this is the build not landing, not an edge-cache problem. Distinguished from
the 404→homepage fallback by md5: torrance `de559be7` ≠ homepage `c6c7c479`, i.e. prod is
serving the real *old* page. Yesterday the next push displaced it; this log commit is that
push.

## Lessons

- **Diff-guard against the rendered page, not the source.** Source-level comparison drowns
  in escaping and template literals; the prod render is what actually has to survive.
- **A dupe checker must exclude the prose you moved.** The first pass flagged 6 duplicate
  8-grams on the wraps — all of it text that was already live and that we had just carried
  across verbatim. Only authored prose belongs in that gate.
- **Silent-fallback components.** `ICONS[e.icon]` with no default is a whole class of bug
  that no gate catches: it builds, it renders, it is just blank.
