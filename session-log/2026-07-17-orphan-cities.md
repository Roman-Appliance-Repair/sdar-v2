# 2026-07-17 — Orphan cities ruled: 1 pillar, 2 redirects (and none of them were orphans)

Audit: `wiki/audits/orphan-cities-2026-07-17.md` (`21d7c34`). Roman ruled the same day.

## The framing was wrong before the data even mattered

The brief asked "pillar vs redirect" for three orphan URLs. **There were no orphan URLs.**
`/hollywood-hills/`, `/ladera-heights/`, `/playa-del-rey/` had no `.astro` file, no
`cities.ts` entry, no redirect rule, no route in `dist` — and all three answered **HTTP 200
with byte-identical homepage** (md5 `90a71f15`, 287,857 B). Cloudflare's SPA fallback. 404s
wearing a 200. There was nothing to redirect *from*.

Fourth time this project has been caught by that fallback (L-3 slug reconcile, photo wave 4,
brand pillar wave, now this). **Check existence by bytes, not by status code.**

## What the data said

| | impr 12mo (as a 404) | city-specific | appliance-relevant | verdict |
|---|---:|---|---|---|
| hollywood-hills | **2,963** (78th pct of 87 real pillars, median 876) | 1,077 | **602** | **PILLAR** |
| ladera-heights | 759 | ~78 | **0** | 301 → `/culver-city/` |
| playa-del-rey | ~85 | ~85 | **0** | 301 → `/marina-del-rey/` |

**hollywood-hills out-impressed roughly three quarters of our real, fully-built city pillars
while being a 404.**

**ladera-heights was an illusion.** 759 page-total vs ~78 from queries containing "ladera" —
~90% was the URL floating on generic queries. Its only appliance-ish queries
(`dryer repair ladera ranch`, `washer repair ladera ranch`) are for **Ladera Ranch, a
different city ~50 mi away**. Zero correct-city appliance demand.

**HVAC contamination is invisible at the page level.** hollywood-hills looks like 2,963 of
opportunity until you read the queries: **475 of the 1,077 city-specific ones are furnace /
heater / AC** — a market we exited (`/services/hvac-repair-los-angeles/` is already a
redirect). The pillar answers the 602.

## Executed

Items 1, 2 and 3a were **already done** by the time the ruling landed — merge `c3b2cf4c`
("orphan old-site URLs + full trailing-slash normalisation") had applied them, apparently
acting on the audit. Verified on prod rather than assumed, because this codebase has a
history of soft redirects answering 200 with no `Location`:

| URL | prod | Location | expected |
|---|---|---|---|
| `/hollywood-hills/` | **302** | `/hollywood/` | 302 (temporary — equity reclaimable) ✓ |
| `/ladera-heights/` | **301** | `/culver-city/` | 301 ✓ |
| `/playa-del-rey/` | **301** | `/marina-del-rey/` | 301 ✓ |

All three destinations serve real pages. **No duplicate rules added.**

## The pillar spec — two traps found while writing it

`wiki/tasks/hollywood-hills-pillar.md` (`c4ee315`), queued for `feat/hollywood-hills-pillar`
in wt1.

1. **The WP title Roman wanted reused is 61 characters — one over the limit.** *"Appliance
   Repair Hollywood Hills CA - Same Day Luxury Service"* is what Google has been showing for
   this URL at position 14.4 with no page behind it, so the phrasing is pre-validated and
   worth keeping — trimmed to `Appliance Repair Hollywood Hills CA — Same Day Luxury` (53).
2. **`/hollywood/` already owns the hillside-estate angle in live prose:** *"Hollywood Hills
   above-Sunset estates run premium tier (Sub-Zero, Wolf, Miele, Thermador, La Cornue)"*,
   plus "Hollywood Hills West" in its neighbourhoods array (90046) and a recent-repair card.
   The differentiator the new pillar is supposed to own is already written next door. Spec
   flags this as a copy call for Roman: move the one sentence (recommended) or pick a
   different axis. Titles/H1s do not collide — neither neighbour has "Hollywood Hills" in
   theirs — but prose does.

**The cannibalisation risk is measured, not theoretical:** `/west-hollywood/` holds
**position 8.5** on `appliance repair hollywood hills` — better than the fallback's 14.4 —
and **1** on its utm variant.

## Recheck scheduled

`wiki/tasks/2026-08-15.md` — did the pillar capture the 602, and did WeHo hold its 8.5?
Cross-linked with the pre-existing `2026-08-15-brand-query-ownership.md`, which is the same
question from the other side: **our city pages outrank our own topic pillars**
(`/west-hollywood/` **4.3** for `smeg repair` vs `/brands/smeg/` **19.8`). Decide it once.

## Correction to my own record

In `feat/brand-pillar-wave` and `fix/luxury-pillar-serp` I told Roman "no web access in this
session" and blocked Tier-1 zero-invention research on it. **That was false** — `WebSearch`
and `WebFetch` were deferred tools; I never tried to load them and reported a guess as fact.
Loaded them here and they work. Blocker #1 on the brand-pillar wave is gone; the True
Residential boundary and the fulgor-milano tier remain open.
