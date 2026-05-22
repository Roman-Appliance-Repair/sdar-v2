# GMB vs organic traffic channel check — 2026-05-22

> Read-only audit. No `src/` edits. Artifacts in `scripts/gmb-traffic-check-2026-05-22/`.

## ⚠️ Data window: 2026-05-08 → 2026-05-22 (14d post-cutover)

- Source: GA4 property `498305027` (`G-PST1TR9G88`) via `mcp__google-analytics__run_report`.
- Site-wide post-cutover GSC stats (reference): ~35,836 impressions / 49 clicks in 14d.
- Site-wide GA4 events (14d): **13 `click_phone_number`** (9 users), **3 `book_now`** (2 users), 5 `click`.
- Tracking caveat: GMB "Call" button on Maps **bypasses the website** — those calls don't appear in GA4 phone-click events. The on-site phone-click event only fires when a user clicks a `tel:` link on the website itself.

## TL;DR

- Hypothesis "**WeHo / LA / Thousand Oaks cannibalize SERP queries but GMB Maps compensates with leads**" — **NOT supported by on-site GA4 evidence**, but can't be conclusively rejected either: Maps Call clicks are invisible to GA4.
- The 5 city pillars combined (`/west-hollywood/`, `/los-angeles/`, `/thousand-oaks/`, `/pasadena/`, `/irvine/`) drew **80 sessions** in 14 days, **0 on-site phone clicks**, **0 bookings**.
- Homepage `/` drew 120 sessions and accounted for **4 of 13 phone clicks** site-wide.
- Remaining 9 phone clicks happened on **other pages** (services / brand pillars / commercial / etc.) — those receive low-volume traffic but apparently convert at a measurably higher rate than the 5 GMB-candidate city pillars.
- **Direct % is high on every page**, even Pasadena/Irvine where GMB is still pending verification — Direct is dominated by branded search → click (which GA4 attributes to Direct when referrer is stripped), not necessarily by Maps. Cannot reliably split Direct into "GMB" vs "branded" without UTM tagging on the GMB Website URL.
- **Real bottleneck: CTR, not landing-page correctness.** Site-wide conversion: 35,836 imp → 49 clicks → 13 phone clicks + 3 bookings = **0.045% imp→lead** over 14d.

## Per-page breakdown (14d sessions + channel)

| Page | Total sessions | Direct | Organic | Other | Phone clicks | Bookings | Avg session dur |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` (homepage) | **120** | 91 (76%) | 23 (19%) | 6 | **4** | 0 (not page-attributable) | 38s |
| `/west-hollywood/` (GMB active) | **33** | 16 (48%) | 15 (45%) | 2 | **0** | 0 | 60s |
| `/los-angeles/` (GMB active SAB) | **29** | 12 (41%) | 15 (52%) | 2 | **0** | 0 | 187s |
| `/thousand-oaks/` (GMB active SAB) | **11** | 4 (36%) | 7 (64%) | 0 | **0** | 0 | 116s |
| `/pasadena/` (GMB pending) | **5** | 2 (40%) | 1 (20%) | 2 | **0** | 0 | 12s |
| `/irvine/` (GMB pending) | **2** | 1 (50%) | 1 (50%) | 0 | **0** | 0 | 2s |

**Notes:**
- `/west-hollywood/` Organic sessions have **avg duration only 18s** with engagement rate 0.67 — many short-but-engaged sessions. Likely mobile users scrolling briefly and bouncing or tapping back. (See raw `ga4-per-page.csv`.)
- `/los-angeles/` Organic sessions have **247s avg duration** with 0.87 engagement — the most engaged channel on any monitored page. Despite this, 0 phone clicks tracked.
- `/los-angeles/` Direct sessions: 132s avg, 10 of 12 are new users — consistent with branded search or GMB Website-button traffic (new users + Direct + decent duration).
- Pasadena/Irvine have very thin data (5 and 2 sessions); not statistically meaningful.

## GMB-active vs GMB-inactive comparison

GMB-active group (WeHo + LA + T-Oaks):
- Sessions: 73
- Direct: 32 (44%)
- Organic: 37 (51%)
- Phone clicks: **0**
- Bookings: **0**

GMB-pending group (Pasadena + Irvine):
- Sessions: 7
- Direct: 3 (43%)
- Organic: 2 (29%)
- Phone clicks: **0**
- Bookings: **0**

**Verdict:** GMB-active pages do NOT show meaningfully higher Direct % (44% vs 43%) — the supposed "Maps → Direct" tail is invisible OR overwhelmed by branded-search Direct on Pasadena/Irvine too. **The "GMB compensates" hypothesis can't be confirmed from this dataset.**

## GSC vs GA4 reconciliation (organic search only)

| Page | GA4 organic sessions (14d) | Notes |
|---|---:|---|
| `/` | 23 | Numbers are consistent with sub-tens of GSC clicks |
| `/west-hollywood/` | 15 | Heavily concentrated SERP impressions for branded + service queries |
| `/los-angeles/` | 15 | High-duration sessions imply quality intent |
| `/thousand-oaks/` | 7 | Aligns with Ventura county hub's strong query reception |
| `/pasadena/`, `/irvine/` | 1 each | Not statistically meaningful |

Site-wide GSC: 49 clicks / 14d. GA4 organic sessions on these 6 pages alone: **62** — comparable order of magnitude (GA4 also captures users who landed elsewhere and navigated to these pages, so slight inflation expected).

## Direct vs Maps detection — limitations

GA4 typically attributes GMB Website-button clicks to one of:
- `(direct) / (none)` — most common (referrer stripped by Google Maps)
- `google / organic` — rare (only if Google passes referrer)
- `gmb_local / referral` — only if UTM-tagged at GMB profile level

Since **no UTM parameters were configured on the GMB Website URLs**, all Maps→site traffic blends into Direct. Without UTM, we cannot separate:
- Branded search Direct (user types "same day appliance repair", clicks our page)
- GMB Maps "Website" button Direct
- Bookmarked/typed-in Direct

**Recommendation (for future):** Add UTMs like `?utm_source=gmb&utm_medium=organic&utm_campaign=weho` to GMB Website URLs to split this cleanly. That would unlock proper Maps-attribution in GA4.

## What CAN we say from the data

1. **5 GMB-tracked city pillars have 0 on-site lead events in 14d.** That's the hard data point.
2. **Homepage has 4 phone clicks / 120 sessions = 3.3% conversion.** Most of those are likely from Direct (which is 76% of homepage traffic), but page-level event attribution doesn't tell us which channel.
3. **9 phone clicks happen on OTHER pages** site-wide (not in our 6-page audit). Could be brand pillars, service hubs, sub-services — those convert at SOME rate, while the 5 city pillars don't appear to.
4. **GMB calls happen entirely off-site.** They can be measured in the GBP "Calls from Maps" report in Google Business Profile dashboard — NOT in GA4. We don't have access to that from this audit.

## Verdict — каннибализация в SERP = real lead loss?

**Verdict: unknown / probably immaterial at current scale.**

The cannibalization briefing's 1,238 imp/7d that `/west-hollywood/` "steals" from `/services/*` and `/brands/*` pages would translate, at industry-average CTR (1-2% at pos 6), to **12-25 extra clicks/7d** on the displaced pages — which would then go through the same low-conversion funnel.

If our site-wide imp→lead rate is 0.045%, those 12-25 displaced clicks would yield approximately **0-1 additional leads per 7 days**, even with perfect re-routing.

**The cannibalization fix has near-zero direct lead impact in the short term.** It MIGHT matter long-term as Google consolidates rankings and authority builds, but the immediate ROI is dominated by CTR improvements (title/meta optimization, structured-data Offer markup, ratings) — not which page wins which query.

Meanwhile, the **GMB Maps Call channel is completely unmeasured.** Roman should check `business.google.com → Insights → Phone calls` for each verified GMB profile to see actual call volume per location. That dataset would tell us whether WeHo cannibalization is mid-traffic OR if it's actually a Maps-driven business and SERP doesn't matter much.

## Recommendation для Task 1.3

### Pivot away from WeHo over-mentions fix (was Option A)

**Reasoning:**
- Cannibalization briefing (commit `ee09600`) recommended WeHo over-mentions fix as highest-volume target (1,238 imp/7d → projected reclaim 1,160 imp/month).
- But that volume converts at ~0.045% in current state — projected additional leads ~0-1/week even if reclaim succeeds.
- WeHo physical_pin schema priority is the **structural cause** (P0 LSA trust restoration, 2026-05-07). Touching it risks regressing LSA trust score for marginal SEO gain.

### New Task 1.3 candidates (in priority order)

| Option | Effort | Direct lead impact | Risk |
|---|---|---|---|
| **Add UTM tagging to all 5 GMB Website URLs** | Low (~15 min owner action, NO code) | Unlocks Maps-attribution forever | Zero — pure analytics improvement |
| **CTR sweep: pos 5-15 pages with weak titles** | Medium | High — same impression base, higher click-through | Low if validated per-page like commit `1354410` |
| **Check GBP Insights phone-call totals (off-GA4)** | Low (~30 min owner-side) | Unblocks question "are Maps calls compensating?" | Zero — read-only |
| **Verify Pasadena/Irvine GMB pending status** | Low | Unblocks 2 more locations | Zero |
| ~~WeHo over-mentions fix~~ | Medium | ~0-1 leads/week | LSA trust risk |

### Concrete next step (recommended)

**Task 1.3a — Owner action (Roman):**
1. Open each verified GMB profile (WeHo, LA, T-Oaks).
2. Replace Website URL with UTM-tagged variant:
   - WeHo: `https://samedayappliance.repair/west-hollywood/?utm_source=gmb&utm_medium=organic&utm_campaign=weho`
   - LA: `https://samedayappliance.repair/los-angeles/?utm_source=gmb&utm_medium=organic&utm_campaign=la`
   - T-Oaks: `https://samedayappliance.repair/thousand-oaks/?utm_source=gmb&utm_medium=organic&utm_campaign=tho`
3. From `business.google.com → Insights → Phone calls`, record the past 14d call count for each profile.

**After 14d of UTM-tagged data**, re-run this audit. Then we'll know:
- True Maps-driven session volume per page
- Whether GMB callers are converting via Website OR straight-from-Maps
- Whether WeHo cannibalization matters

**Task 1.3b — Site work (alternative or parallel):**
- CTR-focused sweep on top-20 GSC queries at pos 5-15 with poor SERP-snippet keywords. Same pattern as commit `1354410` (commercial-hood title rewrite). Site-wide effort: 2-4 hours total for ~20 page edits.

## Files

```
scripts/gmb-traffic-check-2026-05-22/
├── ga4-per-page.csv         ← page × channel sessions / engagement / duration
├── ga4-source-medium.csv    ← page × source-medium (granular)
└── ga4-events.csv           ← event totals site-wide + per-page
```

## Caveats

- **GMB Maps calls are NOT measurable from GA4** — need to query GBP Insights directly. This audit has a fundamental data gap on the question it set out to answer.
- **Direct attribution is ambiguous** without UTM tagging — branded search and Maps-Website clicks both land in `(direct) / (none)`.
- **14 days is small** — total site events = 16. Statistical power for per-page conversion analysis is near-zero. Interpret directionally.
- **Phone-click event coverage**: the event IS firing site-wide (13 events, 4 on `/`, 9 elsewhere), so the absence on the 5 city pillars is real and not a tracking gap. Possible explanations: (1) lazy GTM didn't load before user clicked tel: link, (2) Maps users called via GMB without visiting the site, (3) user pool on those pages was disproportionately information-seeking, not lead-intent.
- **No `book_now` event traced to a specific page** in the per-page query — bookings happen on `/book/` but the event isn't attributed to the page-path of the converting visitor's landing page.
