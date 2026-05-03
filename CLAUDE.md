# CLAUDE.md — SDAR Quality Bar
**Auto-loaded by Claude Code on every session start.**
**Last updated:** 2026-04-30
**Project:** Same Day Appliance Repair (samedayappliance.repair)

> Этот файл — закон проекта. CLAUDE.md > Roadmap > Methodology > Background docs.
> Если документы конфликтуют — этот файл выигрывает.

---

## 1. WHO WE ARE

**Legal:** HVAC 777 LLC dba Same Day Appliance Repair
**CSLB:** #1138898 (general appliance repair)
**EPA 608:** Certified (refrigerant work — residential and commercial)
**BBB:** A+ Accredited
**Domain:** samedayappliance.repair (DNS cutover pending)
**Owner:** Roman Abysov
**NAP:** 6230 Wilshire Blvd Ste A PMB 2267, Los Angeles CA 90048
**Hours:** Mon–Sat 8:00 AM–8:00 PM. Sunday closed. **Phones answered 24/7.**

---

## 2. THE EIGHT BRANCHES

**Source of truth:** `src/data/branches.ts` — never trust other docs for phones.

| Branch | County | Phone |
|---|---|---|
| Los Angeles (Main) | LA County | (424) 325-0520 |
| West Hollywood | LA County | (323) 870-4790 |
| Beverly Hills | LA County | (424) 248-1199 |
| Pasadena | LA County | (626) 376-4458 |
| Thousand Oaks | Ventura County | (424) 208-0228 |
| Irvine | Orange County | (213) 401-9019 |
| Rancho Cucamonga | San Bernardino County | (909) 457-1030 |
| Temecula | Riverside County | (951) 577-3877 |

When writing pages, pull phones via `MAIN_PHONE` import or `branches.ts` SSOT — never hardcode.

---

## 3. PRICING — NEVER MIX

| Tier | Diagnostic | Waived with Repair |
|---|---|---|
| Residential | $89 | Yes |
| Commercial | $120 | Yes |
| Outdoor (Lynx, Kalamazoo, Fire Magic, etc.) | $120 quote-based | Yes |

**Rules:**
- Residential page → $89. Always. Never mix.
- Commercial page → $120. Always. Never mix.
- Outdoor pages → $120, but premium brands (Kalamazoo, Hestan, Wolf outdoor) often quote-based for parts-heavy jobs.
- After-hours surcharge: not standard policy yet — don't claim it.
- Warranty: 90-day parts and labor on every repair, no exceptions.

---

## 4. BANNED PHRASES

Never use. These are AI-generated marketing tells.

**Generic AI fillers:**
- "In conclusion", "Furthermore", "Moreover", "Additionally", "In summary", "It's worth noting"
- "Comprehensive solutions", "tailored services", "cutting-edge technology", "state-of-the-art"
- "When it comes to [X]…", "Whether you're a [X] or…", "Look no further than…"
- "Did you know that…", "In today's fast-paced world…"
- "Our team of dedicated professionals…"
- "We pride ourselves on…", "Trust us to…"
- "Your one-stop shop for…"
- "Specialists in…", "Specializing in…" (when self-describing)

**Em-dashes** — use sparingly. Never as a tic. If you find more than 2 per page, rewrite.

**Service-industry tells:**
- "Top-notch service"
- "Unbeatable prices"
- "Customer satisfaction is our priority"
- "We go above and beyond"
- "Quality you can trust"
- "Fast, friendly, reliable" (the holy trinity of meaningless)

**False urgency:**
- "Don't wait — call now!" (use plain "Call us")
- "Limited time offer"
- "Act fast"

---

## 5. VOICE — PRACTITIONER, NOT MARKETER

Write as if a lead technician is talking to a customer who just called with a problem. Not as a marketer writing brochure copy.

**First person plural always:** "our techs", "we", "our guys". Never "I". Never corporate-abstract third person ("Same Day Appliance Repair offers…").

### Examples

✓ "Nine times out of ten on a Lynx Professional E-series with no spark, it's the 9V battery in the battery tray (OEM 80489). $5 part, 5 minutes. Don't let anyone sell you a new ignition system."

✗ "Our experienced technicians are highly trained to diagnose Lynx grill ignition issues with precision and care."

---

✓ "If your Sub-Zero is 18 years old and the compressor just went, that's a $3,500 repair on a unit worth $4,000 used. We'll tell you straight — replace, don't repair."

✗ "Our certified Sub-Zero specialists provide expert diagnosis and offer comprehensive repair solutions."

---

✓ "Patio heater won't light: 80% of the time it's the thermocouple. The flame proves the gas is flowing. The thermocouple is what tells the valve to stay open. $35 part, 20 minutes."

✗ "Patio heater not igniting? Our skilled team can troubleshoot and resolve a wide range of issues to get your outdoor space comfortable again."

---

### Required on every service/product/landing page

- ≥3 specific equipment models with **full part numbers** (not just brands)
- ≥2 price ranges in concrete dollars (not "affordable")
- ≥2 time estimates in concrete minutes/hours
- ≥3 region-specific or audience-specific references (Beverly Hills, Malibu, restaurant on Sunset, etc.)
- ≥1 honest opinion that contradicts the industry default (replace-vs-repair, brand X is overrated, etc.)
- ≥1 composite real-world example with numbers (city, model, age, problem, cost)
- License number in body AND footer
- Contact CTA (phone + book online)
- ≥3 internal links to other SDAR pages
- FAQ section: 5–7 questions with FAQPage Schema
- Schema.org JSON-LD: appropriate type minimum (Service, LocalBusiness, FAQPage)
- Honest scope positioning where relevant (see Part 7)

### Paragraph rhythm

- Mix paragraph lengths: 1-sentence punches next to 4–5 sentence explanations
- Avoid symmetry — not every section has the same paragraph count
- Lists: sometimes 4 items, sometimes 7. Never always 3, never always 5 (AI tell)
- Numbers specific: $247 not "around $250"; "63%" not "more than half"

---

## 6. HONEST OPINIONS — THE DIFFERENTIATOR

The biggest reason our pages will rank top-3 against DR 0–22 competitors. Generic AI content doesn't produce these. Real practitioner content does.

Templates:

- **Replace vs repair honesty:** "If your [unit] is [N]+ years old and the [major component] just failed, that's a replace conversation, not a repair conversation. Don't let anyone tell you otherwise."

- **Brand callout:** "[Brand X] is going to win on [specific dimension]. It's not going to win on [other dimension]. We see this in the field every week."

- **Industry default contradiction:** "The internet will tell you [common claim]. Our techs have replaced [specific part] on [N] of these in the last year. The real cause is usually [actual root cause]."

- **Pricing transparency:** "[Common repair] runs $[X]–$[Y] including the part. If anyone quotes you $[3X+], get a second opinion."

These opinions are unique to real practitioners. Generic AI doesn't produce them. This is what makes content rank in 2026.

---

## 7. HONEST SCOPE POSITIONING

On every service/product page, where applicable:

1. **Specify what we actually do** (matched to license, expertise, brand catalog)
2. **Specify what we don't do** with explicit redirect to specialist trade
3. **Frame as professional standard, not weakness** — "we know our boundaries"

### SDAR scope examples

**Commercial Refrigeration:**
- ✓ "We do reach-in coolers, walk-in coolers and freezers, prep tables, display cases, and wine cellars. EPA 608 certified for refrigerant work."
- ✓ "We don't do supermarket multiplexed rack systems with remote condensers — those need a specialty refrigeration contractor with C-38 license. We refer those out."
- ✓ "We don't do ammonia or CO2 industrial refrigeration. Different trade entirely."

**Outdoor:**
- ✓ "We service Lynx, Fire Magic, Twin Eagles, DCS, Alfresco, Kalamazoo, Viking outdoor, Wolf outdoor, Hestan, Napoleon."
- ✓ "We don't do wood-burning fireplace masonry. SCAQMD restrictions on wood burning in SoCal mean most of these are being converted to gas anyway — we do the gas conversion."
- ✓ "We don't do new outdoor kitchen construction. We service what's already installed. For new builds, we work with several outdoor kitchen contractors and can refer."

**Ice Machines:**
- ✓ "We service Hoshizaki, Scotsman, Manitowoc, Ice-O-Matic, Follett, Kold-Draft. Cube, flake, nugget, and dispenser models."
- ✓ "We don't do water filtration installation as a standalone service — but every ice machine repair includes a water-quality check, and we'll tell you if your filtration is the actual problem."

---

## 8. BRAND FACTUAL TRAPS

Common mistakes. Get these wrong and the page reads as fake.

### Residential

- **True Manufacturing** ≠ **True Residential**. True Manufacturing is commercial (Trulaske family, independent). True Residential is Middleby-owned, premium home brand.
- **Wolf** does NOT make residential refrigerators or dishwashers. Sub-Zero (same parent company) does refrigerators. Cove (also same parent) does dishwashers.
- **Sub-Zero** is not in dishwashers.
- **Bosch** DOES make freestanding ranges for the US market — gas, dual-fuel, slide-in induction. (Old docs may say otherwise — they're wrong.)
- **GE Appliances** (Monogram/Profile/Café) — Haier-owned since 2016.
- **KitchenAid and JennAir** do NOT sell washers/dryers in the US market. Don't write washer pages for these brands.
- **Fulgor Milano** US distribution = Fulgor USA LLC + Maple Distributing. Not "Fulgor Americas".

### Commercial Refrigeration

- **Perlick** — independent Wisconsin family business since 1917. Not Ali Group.
- **AHT Cooling Systems** — Daikin-owned since 2017. Not Ali Group.
- **Beverage-Air** — Ali Group since ~2005.
- **Hussmann** — Panasonic-owned.
- **Traulsen** — ITW Food Equipment.
- **Delfield** — Welbilt.

### Outdoor

- **Lynx Grills** — independent (Compton, CA). Not to be confused with Lynch.
- **Fire Magic** — RH Peterson Co. brand (City of Industry, CA). Made in USA.
- **Twin Eagles** — now part of Dometic Group (Camarillo, CA production). Brand schema parentOrganization should reference Dometic.
- **DCS (Dynamic Cooking Systems)** — Fisher & Paykel since 2004 → Haier group since 2012.
- **Kalamazoo Outdoor Gourmet** — ultra-premium, Kalamazoo MI. Hybrid grills $15K+.
- **Alfresco** — BBQG Inc. brand. Not Alfresco Heating (different company).
- **Viking outdoor** — Middleby brand, separate product line from Viking residential.
- **Wood-burning fireplaces** — SCAQMD Rule 445 restricts new wood-burning installations in most of SoCal. Most retrofits are gas conversion.

---

## 9. WHAT WE DON'T SHOW IN VISIBLE UI

- **AggregateRating (4.6/37 Google reviews)** — only in JSON-LD schema. Never in hero, trust bar, FAQ, or any visible block.
- **Phone in top notification bar** — replaced by "Request Callback" button (planned). Phone stays in Hero block.
- **Phone in main menu (right side)** — phone already in Hero, don't duplicate.
- **HVAC content** — moved to ventahvac.com. Footer-only mention.

---

## 10. TYPICAL SECTION ORDER FOR SERVICE PAGES

This is the proven sequence. Customize per page but don't reinvent.

```
Hero (black bg)
  → Trust Bar (red bg)
  → Branches Bar (dark bg, 8 phones)  [homepage only]
  → Intro / Field Observations (white)
  → Common Problems We See (gray)
  → Brands We Service (white)
  → Real Repair Stories (gray) — composite examples
  → Honest Scope (white) — what we do, what we don't
  → Pricing Transparency (gray)
  → Why Customers Call Back (white)
  → FAQ (gray)
  → Bottom CTA (red)
  → Footer (handled by Layout)
```

---

## 11. INTERNAL LINKING RULES

Every new service/product page MUST link to:

1. **Hub page above it** (e.g., `/outdoor/grill-repair/` links to `/outdoor/`)
2. **Sibling pages** (2–4 related services in the same hub)
3. **Brand pages** (3–5 brands serviced for that category)
4. **At least one city or county page** (LA County, Beverly Hills, etc.)
5. **Price list page** (if applicable)

Anchor text must be natural sentence-flow, not stuffed keywords.
✓ "We see this most often on Lynx and Fire Magic units in Beverly Hills"
✗ "best Lynx grill repair Beverly Hills" as anchor

---

## 12. SCHEMA REQUIREMENTS

Every service page needs:

1. **LocalBusiness** (with NAP, AggregateRating, openingHours)
2. **Service** (with serviceType, areaServed, provider, offers with priceRange)
3. **FAQPage** (5–7 questions matching the FAQ section)
4. **BreadcrumbList**

Brand pages additionally:

5. **Brand** schema with logo and parent organization

City pages additionally:

6. **GeoCoordinates** with lat/long

Get these from `src/data/schema-helpers.ts` if exists, or follow patterns in existing live pages.

---

## 13. CLUSTER DISCIPLINE

We close one cluster fully before starting the next. No spreading domain authority across half-finished clusters.

**Order within a cluster:**
1. Pillar / hub page first (1500–4000 words, link magnet, E-E-A-T anchor)
2. Sub-service pages (1500–2200 words each)
3. Brand pages (1200–1800 words each)
4. City × service combo pages (1000–1500 words each)
5. Blog/long-tail pages last

---

## 14. WORD COUNT TARGETS

| Page type | Target |
|---|---|
| Hub / pillar | 1,800–4,000 |
| Service sub-page | 1,500–2,200 |
| Brand page | 1,200–1,800 |
| City × service combo | 1,000–1,500 |
| Price list page | 800–1,200 |
| Blog post | 1,200–2,000 |

Don't pad. If the topic doesn't justify the word count, write less. Don't write more.

---

## 15. RESEARCH STANDARDS

Always web_search for:
- Current part prices (frequent fluctuation)
- Equipment specifications and model numbers
- SCAQMD rule changes (wood burning, refrigerant)
- EPA refrigerant transitions (R-22 → R-410A → R-454B)
- Brand ownership changes (acquisitions happen)

Avoid relying on:
- Competitor blog posts (often outdated)
- Aggregator sites (Angi, HomeAdvisor)
- Manufacturer marketing copy (always positive, not honest)

Cite official sources where it matters: EPA, SCAQMD, manufacturer service manuals, AHRI.

---

## 16. PARENT-READ-BEFORE-CHILD

Before writing any sub-page for an existing parent (e.g., `/outdoor/grill-repair/` after `/outdoor/` is live):

1. Read parent fully via project files or web_fetch
2. Note dispatch policy, pricing, warranty language, voice patterns
3. Match parent OR explicitly plan reconciliation — don't silently diverge
4. If conflict found, STOP and report — don't pick one silently

This rule prevents inconsistencies that cost 30+ minutes to fix post-deploy.

---

## 17. COMPETITIVE CONTEXT

We are entering a SERP space dominated by competitors with DR 0–26. Our DR is 48. With proper content quality applied via this CLAUDE.md, top-3 rankings are achievable in 2–8 weeks per page in low-KD categories.

Main LA-area competitors:
- larefrigeration.com (DR 22)
- expertcommercialappliancerepair.com (DR 0)
- lafixit.com (DR 26)
- progrill.com (DR 19, BBQ-only)
- Mr. Appliance (DR 66, generic franchise)
- nextechna.com (DR 54, HVAC-adjacent)

None match our breadth × depth × authority combination. The opening exists. Quality content closes it.

---

## 18. WORKFLOW DISCIPLINE

- **Never fetch** `samedayappliance.repair` or `sdar-v2.pages.dev` during competitor research — these are our own sites
- **After git push:** verify with `git log origin/main -1` (not just local commit)
- **Cloudflare HTTP 200 fallback** makes homepage unreliable for existence checks — cross-reference page title + git ls-tree
- **Hub Chip Sync:** writer commits deploying new combo pages must include tag `[HUB-SYNC-TRIGGER: {section}]`
- **Session continuity:** before terminal shutdown, write pause file to `wiki/handoff/terminal-TX-pause-YYYY-MM-DD-evening.md`

---

## 19. WHEN UNSURE

If anything in a content batch contradicts this file — **stop, report to chat, ask**. Don't silently guess.

Common cases where you should stop:
- Page topic doesn't fit the 5-niche architecture
- Pricing doesn't match $89/$120 split
- Brand factual trap (Wolf refrigerator, KitchenAid washer, etc.)
- Existing parent uses different framing than this file
- Competitor name appears that you can't verify
- Refrigerant or regulatory claim that needs current verification

Better to ask once than fix 30 pages later.

---

**End of CLAUDE.md.**
This file lives in the repo root and is auto-loaded by Claude Code at the start of every session.
Quarterly re-verification required: brand ownership, refrigerant rules, SCAQMD, branch phones.
