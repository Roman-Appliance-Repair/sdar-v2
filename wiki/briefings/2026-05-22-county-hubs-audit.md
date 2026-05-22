# County Hubs Audit — 5 county pages

**Дата:** 2026-05-22
**Ветка:** `main`
**Окно анализа:** 2026-05-08 → 2026-05-22 (14d post-cutover only)
**Read-only audit.** Pre-cutover data not used.

> **Errata (2026-05-22, после первичного коммита):** В первой версии отчёта я ошибочно сообщил, что city pillars являются stubs (на основе wordcount по inline-тексту в `.astro` source). Это **false negative** — city pillars используют `CityLayoutV2` + 14 component'ов с контентом через props. Реальный rendered HTML — **2500-3800 words** на каждой странице (sample of 26 city pillars). City pillar layer **исправен** и пропускает linkjuice к county hubs корректно (по 2 back-link city→county). Соответствующий "critical finding #1" удалён, priority order пересмотрен. См. `scripts/county-audit-2026-05-22/city-pillar-stub-check.csv` за подтверждающими данными.

## ⚠️ Data window: post-cutover 14 days only

DNS cutover 2026-05-06 + новый contentful sdar-v2. Любые сравнения с pre-cutover NOT used (это была другая страница). 14d — короткое окно; sandboxing-фактор остаётся фоновым.

---

## TL;DR

| County | State | Wordcount (county hub) | GSC impr | GSC clk | Avg pos | Comp top-5? |
|---|---|---|---|---|---|---|
| **LA County** | STRONG content / cannibalized | 1462 | 52 | 0 | 60.5 | absent (homepage at #5 instead) |
| **Orange County** | MEDIUM | 1145 | 43 | 0 | 55.7 | absent |
| **Ventura County** | MEDIUM (best PMF) | 1133 | 135 | 0 | 69.0 | absent |
| **San Bernardino County** | MEDIUM | 1174 | 55 | 0 | 41.8 | absent |
| **Riverside County** | MEDIUM | 1130 | 213 | 0 | 64.5 | absent |

- **0 из 5 county hubs в топ-5 DDG SERP** для county-targeted query.
- **0 clicks** на всех 5 county hubs за 14 дней.
- **Все 5 индексированы**, HTTP 200, TTFB 230-310ms, no technical blockers.
- **City pillar layer SOLID** (sample of 26 pillars: 2500-3800w rendered, 2 county back-links each). NOT a bottleneck.
- **None — STRONG целиком**: LA County content качественный (1462w, 7 FAQ), но cannibalized homepage'ем.
- **None — WEAK или BROKEN**.

### Top 3 critical findings (corrected)

1. **LA County hub cannibalized homepage'ем.** На DDG для "appliance repair los angeles county" на месте hub'а появляется наша **homepage at #5**. LA County hub отсутствует в топ-5. Two competing pages on the same intent — Google выбирает homepage.
2. **Schema gap: `location` array (8 filiali) MISSING на всех 5 county hubs** per `docs/seo-policies.md`. (Остальные schema-требования OK: hasCredential 4 ✅, openingHoursSpec 2 ✅, legalName HVAC 777 LLC ✅, NO aggregateRating ✅, NO streetAddress ✅, FAQPage ✅.)
3. **0 brand-links** на county hubs (0 ссылок на `/brands/*`) — несмотря на упоминание 17-18 брендов в тексте каждого hub'а. Brand-связи не передают link equity.

### Recommended priority order

1. **P0** — Add `location` schema array (8 filiali) на 5 hubs. Lift-cost: ~1-2h. (Reuse `HomepageSchema.astro` LocationArray block.)
2. **P0** — Resolve LA County hub cannibalization (explicit keyword-rich anchors from homepage; verify Google's canonical choice).
3. **P1** — Add inline brand-links на county hubs (~6-10 anchors × 5 hubs).
4. **P2** — FAQ expand 3→7 на Orange/Ventura/SB/Riverside (matching LA pattern).
5. **P2** — Hero photos на 5 county hubs.
6. **P2** — GMB-first для Riverside / San Bernardino (low-competition SERPs, Maps pack доминирует).

### Effort estimate to bring all 5 к STRONG

| Item | Effort |
|---|---|
| Schema `location` array на 5 hubs | 1-2h |
| LA County cannibalization resolve | 1-2h |
| Add brand-links к county hubs (10 brands × 5 hubs) | 2-3h |
| FAQ expansion 4 hubs (3→7) | 4-6h |
| Photo coverage (1 hero/county) | 2-3h |
| GMB optimization (Riverside/SB) | external — outside content scope |

**Total content effort: ~10-16 hours.**

> Изначальный отчёт оценивал ~24-32h из-за неверного включения city pillar rewrites. После поправки — pillar rewrites не нужны; финальная оценка 10-16h.

---

## Per-county detailed analysis

### LA County hub — `/los-angeles-county/`

**Anatomy:**
- Title (57ch): `Appliance Repair Los Angeles County CA | Same Day Service`
- H1: `Appliance Repair Across Los Angeles County`
- H2 count: 10 (luxury/Westside angle, Coastal+inland climate context, Commercial section, Pricing, FAQ)
- Wordcount body: **1462** ← largest of 5
- FAQ Qs: **7** ← richest of 5
- In-county cities mentioned: 26 unique / 144 total mentions (Los Angeles 20, Beverly Hills 11, Malibu 9, Santa Monica 8, Koreatown 8, Burbank 7, Pasadena 6, Brentwood 6, ...)
- Brands: 18 unique (Sub-Zero 11, Wolf 10, Samsung 5, Thermador 5, Miele 5, LG 4, Bosch 4, Viking 4)
- Services: 11 unique
- Links: 42 total, 36 internal, 26 city-links, **0 brand-links**, 8 service-links, 3 unique tel (WeHo + LA + Pasadena branches)
- Schema: HomeAndConstructionBusiness + AdministrativeArea + 2 openingHours + 4 hasCredential + FAQPage + 7 Q/A. legalName "HVAC 777 LLC" ✅
- Imgs: 0 (only CountyMap SVG component)

**GSC performance (14d):**
- Queries: 23, Impressions: 52, Clicks: 0, Avg position: 60.5
- Top queries: "same day appliance repair topanga" 15 impr pos 70, "appliance repair downtown los angeles" 9 impr pos 62, "appliance repair los angeles ca" 4 impr pos 81.
- **No "appliance repair los angeles county" query at all** в GSC.

**Competitor gap:**
DDG SERP для "appliance repair los angeles county" — **наша homepage появляется на #5, LA County hub отсутствует**. Cannibalization: Google выбирает homepage между двумя нашими страницами с pos 26 vs pos 60.

**State verdict: STRONG (content) / WEAK (performance).** Content качественный, но cannibalization homepage'ем убивает rankings.

**Action plan:**
1. Resolve cannibalization: explicit "Los Angeles County" anchor → `/los-angeles-county/` из homepage (сейчас единственный link через "Service areas — by county" block — проверить, что anchor keyword-rich, не generic "Los Angeles County" badge без keyword sentence).
2. Add `location` array (8 filiali) to schema.
3. Add inline brand-links (Sub-Zero, Wolf, Thermador, Samsung, LG, Bosch).
4. Add 1 hero photo + 2-3 in-page photos with descriptive alt.

**Effort:** 3-4 hours.

---

### Orange County hub — `/orange-county/`

**Anatomy:**
- Title (52ch): `Appliance Repair Orange County CA | Same Day Service`
- H1: `Appliance Repair Across Orange County`
- H2 count: 11; Wordcount: 1145; FAQ Qs: 3
- Cities: 11 unique / 88 mentions (Orange 31, Irvine 10, Newport Beach 10, Anaheim 8, Laguna Beach 7, Yorba Linda 6, Huntington Beach 4, Fullerton 4)
- Brands: 17 (Sub-Zero 8, Wolf 7, Miele 7, Thermador 5, LG 4, Maytag 4)
- Links: 31 total, 28 internal, 14 city-links, 6 service-links, 0 brand-links, 1 unique tel (Irvine)
- Imgs: 0

**GSC (14d):**
- 14 queries, 43 impressions, 0 clicks, avg pos 55.7
- Top: "appliance repair orange county" 12 impr pos 68, **"same day appliance repair orange county" 9 impr pos 11** ← close to top-10, "appliance repair orange county ca" 5 impr pos 64.

**Competitor gap:**
Top-5 для "appliance repair orange county": myappliancecrew.com (phone in title), Yelp, caesarsapplianceservice.com, Angi, dnvappliance.com. Наш hub отсутствует.

**State verdict: MEDIUM.** Solid content, real intent matching. Brand-link gap + FAQ thin.

**Action plan:**
1. FAQ expand 3→7.
2. Brand-links inline (Sub-Zero, Wolf, Miele).
3. Add hero photo.
4. Add `location` schema.

**Effort:** 3 hours.

---

### Ventura County hub — `/ventura-county/`

**Anatomy:**
- Title (53ch): `Appliance Repair Ventura County CA | Same Day Service`
- H1: `Appliance Repair Across Ventura County`
- H2 count: 11; Wordcount: 1133; FAQ Qs: 3
- Cities: 9 unique / 87 mentions (Ventura 39, Thousand Oaks 14, Westlake Village 10, Camarillo 8, Simi Valley 6, Oxnard 3, Newbury Park 3, Moorpark 2)
- Brands: 17 (Wolf 10, Sub-Zero 7, Samsung 5, Thermador 5, Miele 4)
- Services: 11
- Links: 26 total, 23 internal, 12 city-links, 6 service-links, 0 brand-links, 1 unique tel (Thousand Oaks)
- Imgs: 0

**GSC (14d) — BEST product-market fit signal:**
- 20 queries, **135 impressions**, 0 clicks, avg pos 69.0
- Top: "appliance repair ventura ca" **29 impr pos 69**, "appliance repair ventura" 16 impr pos 73, "appliance repair ventura county" **14 impr pos 66**, "dryer repair ventura" 14 impr pos 67, "refrigerator repair ventura ca" 13 impr pos 63, "small appliance repair ventura ca" 13 impr pos 66.
- **Multiple legit county/city target queries.** Position 60-75 — нужно подтянуть в 20-30 для кликов.

**Competitor gap:**
Top-5 для "appliance repair ventura county": Yelp, vappliancerepair.com (exact match!), Sears, Angi, Stringer (Yelp listing). **SERP пробиваемый — меньше high-authority конкурентов чем в LA.**

**State verdict: MEDIUM with HIGH potential.** Best GSC impression volume per content unit. Если подтянуть позицию с 69 → 25, **высокая вероятность first clicks**.

**Action plan:**
1. FAQ expand 3→7 (Ventura-specific: distance, dispatch from Thousand Oaks, climate).
2. Brand-links inline.
3. Add hero photo.
4. **Backlinks** — local Ventura listings (Ventura Chamber, local biz directories).
5. Add `location` schema.

**Effort:** 3-4 hours + backlinks (separate).

---

### San Bernardino County hub — `/san-bernardino-county/`

**Anatomy:**
- Title (52ch): `Appliance Repair San Bernardino County CA | Same Day`
- H1: `Appliance Repair Across San Bernardino County`
- H2 count: 11; Wordcount: 1174; FAQ Qs: 3
- Cities: 8 unique / 76 mentions (San Bernardino 32, Rancho Cucamonga 11, Chino Hills 7, Chino 7, Redlands 6, Upland 5, Ontario 4, Fontana 4)
- Brands: 17 (LG 5, Samsung 5, Wolf 5, Bosch 4, Sub-Zero 4)
- Services: 8
- Links: 25 total, 22 internal, 10 city-links, 6 service-links, 0 brand-links, 1 unique tel (Rancho Cucamonga)
- Imgs: 0

**GSC (14d):**
- 19 queries, 55 impressions, 0 clicks, avg pos 41.8 ← **best avg position of 5**
- Top: "appliance repair san bernardino ca" **17 impr pos 51**, "ice maker repair near me" 6 impr pos 17, "oven repair san bernardino ca" 5 impr pos 53, "washer repair san bernardino" 4 impr pos 47.

**Competitor gap:**
Top-5: Yelp, sanbernardinoappliance.com (EMD), sb-appliance-repair.com (EMD), Thumbtack, ars.repair. **Два EMD-конкурента + directories.** Конкурентность средняя.

**State verdict: MEDIUM.** Best avg position. SERP не слишком насыщен. **GMB-first** — для Inland Empire GMB rankings часто выше organic в SERP.

**Action plan:**
1. FAQ expand 3→7 (Inland Empire heat focus).
2. Brand-links.
3. Hero photo.
4. **GMB optimization** для филиала Rancho Cucamonga — приоритет выше content полировки.
5. Add `location` schema.

**Effort:** 3 hours content + GMB (separate owner action).

---

### Riverside County hub — `/riverside-county/`

**Anatomy:**
- Title (55ch): `Appliance Repair Riverside County CA | Same Day Service`
- H1: `Appliance Repair Across Riverside County`
- H2 count: 11; Wordcount: 1130; FAQ Qs: 3
- Cities: 8 unique / 85 mentions (Riverside 34, Temecula 16, Murrieta 10, Corona 10, Menifee 4, Moreno Valley 4, Hemet 4, Lake Elsinore 3)
- Brands: 17 (Sub-Zero 8, Wolf 7, Samsung 6, Thermador 5, LG 4)
- Services: 8
- Links: 25 total, 22 internal, 11 city-links, 6 service-links, 0 brand-links, 1 unique tel (Riverside)
- Imgs: 0

**GSC (14d) — HIGHEST impressions, WORST positions:**
- **61 queries** (most of 5), **213 impressions** (most), 0 clicks, avg pos 64.5
- Top: "same day appliance repair" 47 impr pos 58, "refrigeration repair near me" **23 impr pos 86** (page 9 SERP), "appliance repair inland empire" 14 impr pos 75, "dryer repair near me" 13 impr pos 72, "appliance repair in riverside" 8 impr pos 65, "refrigerator repair near me" 6 impr pos 33.

**Pattern:** Riverside county catches geographic-modifier queries от Inland Empire users — "near me" queries с подразумеваемым Riverside geo. Many impressions но positions на pages 7-9 = no traffic.

**Competitor gap:**
Top-5: ars.repair (1!), Canyon Crest, Sears, ASAP Riverside, appliancesrepairriverside.com. **Один high-authority конкурент + 4 small EMD/local.** SERP пробиваемый.

**State verdict: MEDIUM with HIGHEST impression volume.** Quick wins возможны если двинуть pos 70→30.

**Action plan:**
1. FAQ expand 3→7 (Riverside vs Temecula vs Corona dispatch distinctions).
2. Brand-links inline.
3. Hero photo.
4. **Riverside-specific GMB** для филиала Riverside.
5. Add `location` schema.

**Effort:** 3-4 hours content + GMB (separate).

---

## Linkjuice flow diagram (corrected)

```
                    [HOMEPAGE /]
                          │
                          │ 5 county anchors in "Service areas — by county" block
                          ▼
       ┌──────────┬──────────┬──────────┬──────────┬─────────┐
       │          │          │          │          │         │
  /la-cty/   /oc-cty/   /vc-cty/   /sb-cty/   /rc-cty/       │
   (55 ↑)    (37 ↑)     (35 ↑)     (35 ↑)     (35 ↑)         │
       │          │          │          │          │         │
       │ (in-county city-links: 10-26 each)              ┌──┘
       ▼          ▼          ▼          ▼          ▼     │ /commercial/* (10+ pages)
   [City Pillars: SOLID — 2500-3800w each]               │ ← significant in-link source
       │          │          │          │          │
       │ (2 back-links each → own county hub)            │
       └──────────┴──────────┴──────────┴──────────┘ ────┘
```

**Цикл county↔city работает.** City pillars не stubs — это полноценные pages с 2500-3800w (sample of 26 verified). Back-link city→county существует (2 per pillar в живом HTML).

**Incoming sources per county:**
- LA County (55 in-links): dominant from `/brands/*-walk-in-repair`, `/brands/*-refrigeration`, `/commercial/*` + breadcrumbs.
- Orange/Ventura/SB/Riverside (35-37 in-links): dominant from `/commercial/*` (10 pages × 4-5 county refs) + homepage + breadcrumbs + 2 city-pillar back-links per relevant city.

**Dominant anchor texts:** "Los Angeles County" / "Orange County" / etc. — descriptive and target-keyword aligned ✅.

**Footer (Layout.astro):** county hubs NOT linked в footer (только в homepage main body). Adding footer-level links — opportunity, не blocker.

---

## Cross-county strategy

### Common gaps across all 5 hubs

1. **0 brand-links** на всех 5 hubs. Все упоминают 17-18 брендов inline — но 0 ссылок на `/brands/*` pages. Fix-cost: low (5 hubs × 6-10 inline anchors).
2. **0 hero photos**. Только CountyMap SVG. Per docs/photo-pipeline.md — county hubs должны иметь real photos.
3. **Schema `location` array (8 filiali) MISSING** на всех 5 hubs per policy. Fix-cost: low (вынести из HomepageSchema.astro компонент LocationArray и импортировать в каждый hub).
4. **FAQ count: 3 на 4 hubs vs 7 на LA County.** Templated, можно расширить с similar structure.

### Connection to homepage strategy

Согласно homepage audit (`scripts/homepage-audit-2026-05-22/`) — homepage сейчас:
- pos 41 average
- H1 говорит "SoCal" вместо "Los Angeles"
- catches много walk-in cooler/freezer impressions из других штатов (drift)

**Стратегическое выравнивание:**
- **Homepage → "Los Angeles + SoCal regional brand"** (target: "same day appliance repair" + "appliance repair los angeles" head-terms).
- **LA County hub → "appliance repair los angeles county" + neighborhood-level coverage**.
- **OC / VC / SB / RC hubs → каждый свой county-level head-term + city pillars.**

Сейчас homepage и LA County hub **конкурируют** на близких intents. Чёткое размежевание + explicit internal anchors разведёт их.

**Какие county hubs готовы принять linkjuice от LA-focused homepage:**
- ✅ **LA County** — content качественный, готов принимать. Resolve cannibalization first.
- ✅ **Orange County** — content adequate (1145w), нужны brand-links + FAQ expand.
- ✅ **Ventura County** — best PMF в GSC, ready to grow с GMB/backlinks.
- ⚠️ **San Bernardino / Riverside** — content adequate, но **GMB-first более efficient** (low-competition SERPs).

### Где GMB profile быстрее даст результат чем content

| County | GMB priority | Reasoning |
|---|---|---|
| Riverside | **HIGH** | SERP пробиваемый, 1 high-authority + small competitors. GMB филиала Riverside быстро войдёт в Maps pack. |
| San Bernardino | **HIGH** | Inland Empire — Maps pack доминирует organic для "appliance repair near me". GMB филиала Rancho Cucamonga быстрее ROI. |
| Ventura | MEDIUM | SERP с Yelp + Sears + Angi + EMD конкурент. Content + GMB параллельно. |
| Orange | MEDIUM | SERP насыщен (myappliancecrew, Yelp, Caesars, Angi, D&V). Content first, GMB параллельно. |
| LA | LOW-MEDIUM | Hyper-competitive. Content authority гораздо важнее GMB. |

---

## Priority order (что усиливать первым)

### Phase 1 — Quick wins (1 week, ~5-7 hours)
1. **Add `location` schema array (8 filiali)** на все 5 county hubs.
2. **Add inline brand-links** (Sub-Zero, Wolf, Thermador, Samsung, LG, Bosch, Miele) на все 5 hubs.
3. **Resolve LA County hub cannibalization** — verify/improve homepage internal anchors to LA County hub.

### Phase 2 — Content polish (1-2 weeks, ~8-12 hours)
4. **FAQ expand 3→7** на Orange / Ventura / SB / Riverside (matching LA pattern).
5. **Add hero photo** на каждый county hub.
6. **Add `/services/*` inline anchors** в Services block (сейчас только 6-8 service-links).
7. **Add county hubs to Layout.astro footer.**

### Phase 3 — Off-site (parallel, owner action)
8. **GMB optimization** для филиалов Riverside и Rancho Cucamonga (P0 GMB-first counties).
9. **Local backlinks** — Ventura County (best PMF, лучшая отдача от backlink campaign).

> Phase "City pillar rewrites" из первой версии **удалена** — pillars не stubs.

---

## Schema integrity verification (per docs/seo-policies.md)

| Policy requirement | LA | OC | VC | SB | RC |
|---|---|---|---|---|---|
| HomeAndConstructionBusiness | ✅ | ✅ | ✅ | ✅ | ✅ |
| AdministrativeArea | ✅ | ✅ | ✅ | ✅ | ✅ |
| openingHoursSpecification (2 entries) | ✅ | ✅ | ✅ | ✅ | ✅ |
| hasCredential (4 entries) | ✅ | ✅ | ✅ | ✅ | ✅ |
| legalName "HVAC 777 LLC" | ✅ | ✅ | ✅ | ✅ | ✅ |
| FAQPage + Q/A | ✅ (7Q) | ✅ (3Q) | ✅ (3Q) | ✅ (3Q) | ✅ (3Q) |
| **location array (8 filiali)** | **❌** | **❌** | **❌** | **❌** | **❌** |
| NO aggregateRating | ✅ | ✅ | ✅ | ✅ | ✅ |
| NO streetAddress (geo-neutral) | ✅ | ✅ | ✅ | ✅ | ✅ |

**Single schema gap: `location` array missing** (policy violation).

---

## Live HTTP verification

All 5 county hubs: HTTP 200, 138-148 KB, TTFB 232-306ms. No 5xx errors, no redirects. Health: OK.

---

## City pillar sanity check (sample of 26)

Sample fetched: anaheim, atwater-village, bel-air, beverly-hills, burbank, camarillo, corona, dana-point, eagle-rock, el-segundo, fontana, fullerton, glassell-park, glendale, hemet, irvine, los-angeles, pasadena, rancho-cucamonga, riverside, santa-monica, temecula, thousand-oaks, ventura, west-hollywood, + 1 more.

**Range:** 2536w (los-angeles) — 3775w (temecula). **Mean: ~2940w.**

**All 26 sample pillars:**
- ✅ have 1 H1
- ✅ have 11-15 H2 sections
- ✅ have 2 back-links to their county hub in live HTML
- ✅ render via `CityLayoutV2` + 14 component'ов

**Conclusion:** city pillar layer не bottleneck. Linkjuice city→county пропускается.

> Источниковый `.astro` wordcount (148w-172w-0w) — false negative, потому что контент идёт через props в components, не inline. Это была ошибка в первой версии audit.

---

## Files

```
scripts/county-audit-2026-05-22/
├── per-hub-anatomy.csv               ← 5 hubs structural data
├── per-hub-anatomy.json              ← full JSON anatomy
├── gsc-summary.csv                   ← 5-row summary
├── gsc-per-hub.csv                   ← all queries per hub (full)
├── live-checks.csv                   ← HTTP/size/TTFB
├── incoming-links.csv                ← in-link count + source patterns
├── competitor-per-county.csv         ← DDG SERP top-5 per county query
├── schema-check.csv                  ← policy compliance matrix
├── city-pillar-stub-check.csv        ← REAL rendered wordcounts (26 sample, all OK)
├── parse.py                          ← anatomy extractor (note: inline-only — see correction)
├── city-live/*.html                  ← 26 live city pillar snapshots
└── live/                             ← 5 live county hub snapshots
```

---

## Caveats

- **DuckDuckGo SERP ≠ Google SERP** — used as proxy because google.com blocks WebFetch. Major players overlap reliably.
- **GSC 14-day window — короткое**. Re-audit через 30 дней покажет, появятся ли clicks при росте authority.
- **City pillar sample of 26** (16 strategic + 10 random) из 89 total pillars в src/pages. Full sweep не сделан, но при random sample minimum = 2536w shows the pattern is consistent.
- **GSC impressions/positions volatile** в 14d окне. Numbers indicative, не финальные.
