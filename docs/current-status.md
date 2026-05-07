# Current Status

> **Живой файл — обновляется ПОСЛЕ КАЖДОЙ значимой сессии.**
> Это не справка, это рабочий журнал. Если тут что-то устарело — claude был ленивым.

**Последняя синхронизация:** 2026-05-06

---

## Протокол обновления (читать перед редактированием)

**Когда обновлять:**
- ✅ После любого `git push origin main` (новая страница, sweep, redirect, schema change)
- ✅ После завершения cluster phase
- ✅ После закрытия задачи из «Известные долги»
- ✅ После запуска нового tool/integration
- ✅ После решения о новом направлении работ
- ❌ НЕ обновлять для одиночного typo fix или draft work in progress

**Что обновлять (4 раздела):**
1. **«Что сейчас в работе»** — добавить новый item ИЛИ переместить в «Что закрыто» когда завершено
2. **«Известные долги»** — вычеркнуть закрытое (`~~strikethrough~~`), добавить новое
3. **«Что закрыто недавно»** — prepend новую запись с датой (формат: `**YYYY-MM-DD:** что сделано (commit_hash если есть)`)
4. **«Метрики»** — обновлять только если делали свежий audit/measurement

**Как обновлять:**
1. Edit `docs/current-status.md`
2. Update "Последняя синхронизация" дату наверху
3. Commit: `git commit -m "status: <раздел> <что изменилось>"` (отдельный коммит, не смешивать с feature commits)
4. Не нужно ждать одобрения Roman для status updates — это housekeeping

**Если изменились бизнес-факты** (лицензии, цены, NAP) — обновлять `docs/factual-accuracy.md`, не сюда.
**Если изменились правила голоса/SEO/дизайна** — соответствующий `docs/*.md`, не сюда.

---

## Что сейчас в работе

- **Photo wave подготовка** — стратегия наполнения фото обсуждена 2026-05-06 (5 art-list шаблонов + 3 техника по филиалам). Реализация ещё не начата
- **CLAUDE.md + docs/ структура** — деплоится 2026-05-06

## Известные долги (P2-P3)

| Долг | Масштаб | Приоритет |
|---|---|---|
| 25 stub страниц (<200 body words) | 25 файлов | P2 — отдельный writer batch |
| 6 orphan компонентов в `src/components/` | AiDiagnostic, Diagnostics, Credentials, BrandHubPlaceholder, BrandDetailPlaceholder, SectionDivider | P3 — после grep verification (HomepageFooter удалён 2026-05-06 в Wave 35) |
| ~56 page titles >60 chars | city pillars 39, misc 17 (brands/ + commercial/ + services/ + outdoor/ закрыты Wave 39 Phase 2A+2B+2C) | P2 — Wave 39 Phase 2D manual rewrite (audit-output/wave-39-phase2-candidates.txt) |
| Schema inconsistency: LocalBusiness vs HomeAndConstructionBusiness | Часть city pillars одно, часть другое | P3 — Wave 30 W3, открыто |
| san-clemente.astro = 167 body words | 1 файл | P2 — стейл от T7-dump |
| 87 city pages нуждаются в фото (5 слотов каждая) | ~435 photo slots | P2 — Photo Pipeline wave |
| ~~Rancho Cucamonga + Temecula real DID phones~~ | ~~2 placeholder в branches.ts~~ | ✅ Закрыто 2026-05-06 — реальные DID активны: RC (909) 457-1030, Temecula (951) 577-3877 |
| `audit-output/` directory | untracked, нужно в .gitignore | P3 |
| 12 modified + 76 untracked файлов в wiki repo | wiki backlog 2 недели | P3 — отдельная сессия cleanup |

## Что закрыто недавно

- **2026-05-06: Wave 39 Phase 2C — Title rewrite for services + outdoor pages.** Template-driven sweep across 127 .astro files (77 services + 50 outdoor). Classifier dispatches 8 page types: service_hub (27) + service_subservice failmode (49) + outdoor_hub (6) + outdoor_subservice (11) + outdoor_brand_pillar (8) + outdoor_brand_sub (13) + outdoor_city (9) + outdoor_misc maintenance (2) + main_hub-skipped (2). Templates: service hub = `{Service} Repair Los Angeles — Same Day`, service sub = `{Service} {Problem} Repair LA — Same Day`, outdoor hub = `{Equipment} Repair Los Angeles — Same Day`, outdoor city = `{Equipment} Repair {City} — Same Day` (no LA — city geo), outdoor brand pillar = `{Brand} Outdoor Grill Repair Los Angeles — Same Day`. Fallback (>60): drop "Los Angeles" → "LA". Curated dictionaries: 28 SERVICE + 50 PROBLEM + 12 OUTDOOR_EQUIPMENT + 24 OUTDOOR_BRAND + 89 CITY entries. **118 swept, 7 preserved (custom ≤60), 2 skipped (main hubs).** Build 1026 PASS. Dist length distribution: services/ 96+14+2+1, outdoor/ 36+13+0+1. **0 real content pages >60** — 4 over-60 are out of scope (2 main hubs intentionally + 2 Astro redirect HTMLs with noindex). Backup: `backup/title-phase2c-2026-05-06`.
- **2026-05-06: Wave 39 Phase 2B — Title rewrite for commercial pages.** Template-driven sweep across all 157 `src/pages/commercial/*.astro`. Classifier разбивает на 6 типов: service_hub (22) / brand (42) / sub_service_variant (25, например combi-oven, glass-washer) / sub_service_failmode (54, например not-heating, leaking-water) / sub_service_vertical (4, OPL/Industrial/Coin/Stack) / refrigeration_sub (8, walk-in-cooler etc.) / service_hub_special (1, soft-serve). Templates: hub = `Commercial {Equipment} Repair Los Angeles — Same Day`, brand = `{Brand} {Equipment} Repair Los Angeles — Same Day`, failmode = `Commercial {Equipment} {Problem} LA — Same Day`, variant = `Commercial {Variant} Repair Los Angeles — Same Day`. Fallback (>60): drop "Los Angeles" → "LA"; для failmodes ещё drop "Commercial" prefix. Curated dictionaries: 50 equipment, 42 brand, 80 sub-service entries. **154 swept, 2 preserved (custom ≤60), 1 skipped (commercial/index main hub).** Build 1026 PASS. Dist length distribution: ≤50=69, 51-60=87, 61-70=1, >70=0. The 1 over-60 is `exhaust-hood-repair` — preserved custom title with `&` → `&amp;` HTML-entity inflation. Backup: `backup/title-phase2b-2026-05-06`.
- **2026-05-06: Wave 39 Phase 2A — Title rewrite for brand pages.** Template-driven sweep across all 367 `src/pages/brands/*.astro` (35 pillars + 330 brand × category combos + 1 hub-skipped + 1 stand-alone). Templates: pillar = `{Brand} Appliance Repair Los Angeles — Same Day`, combo = `{Brand} {Category} Repair Los Angeles — Same Day`, fallback (>60) replaces "Los Angeles" → "LA". Brand display map = 167 entries (35 derived from pillar titles + 132 manual overrides for irregular casing: Sub-Zero, JennAir, GE Monogram, KitchenAid, BlueStar, ZLINE, Fisher & Paykel, MagiKitch'n, etc.). Category dictionary = 60 entries. **344 files swept, 23 preserved as custom (≤60 + ≠template).** Skip rule = preserve handwritten titles already ≤60 chars. Bug iteration: first regex didn't handle escaped quotes (`\"` for inch marks), broke fulgor-milano-wall-oven-repair build with doubled `""`; fixed via `(?:[^"\\\n]|\\.)+` pattern. Build 1026 pages PASS. Dist length distribution: ≤50 chars = 282, 51-60 = 130, 61-70 = 3, >70 = 1. The 4 over-60 are HTML-entity inflation artifacts (`&` → `&amp;` adds 4 chars in dist; Google decodes entities so source-side ≤60 still holds for SERP) + brands/index.html hub (out of scope). Backup: `backup/title-phase2a-2026-05-06`.
- **2026-05-06: Wave 40c — Restored remaining 12 brand pillars.** Same architectural pattern as Wave 40b: 12 brand pillars (2044-5928 words each) wrongly hidden behind 301s to their own category-suffixed variants. Removed: amana, bosch, dacor, frigidaire, ge, haier, jennair, kitchenaid, lg, maytag, samsung, whirlpool. **Magic-chef preserved** — its 301 routes off-brand searches to `/services/refrigerator-repair/` (intentional, we don't pillar Magic Chef). 12 redirect rules deleted from astro.config.mjs + 12 from public/_redirects. Cross-link blocks added to all 12 restored pillars (auto-skip URLs that themselves still 301; idempotent for pillars touched in Wave 40b). Insertion-point heuristic extended to handle 3 CTA section patterns (`<h2>Ready to schedule`, `<section class="bottom-cta">`, `<section id="book">`). Build 1014 → **1026 pages**. Dist leakage: 14 → **2** (intentional magic-chef + 1 unrelated thermador-wall-oven-repair from brands/index.astro data — separate redirect rule, not pillar pattern). Backup: `backup/links-sweep-2026-05-06`.
- **2026-05-06: Wave 40b — Restored 5 pillars (removed improper redirects).** 6 redirect rules deleted from `astro.config.mjs` + `public/_redirects`: `/commercial/dryer-repair/` (5378-word page wrongly hidden) + `/brands/sub-zero/` (2844 words), `/brands/thermador/` (2650), `/brands/miele/` (3273), `/brands/viking/` (3023). Each was a 301 to its own category-suffixed variant — but pillar и category page have разные SEO targets (broad brand intent vs targeted combo). Pillar restoration: build went from 1009 → 1014 pages. Cross-link audit found ~3-5 categories per pillar already linked; added "All [Brand] services we cover" block at bottom of each pillar with full grep-derived category list (5 sub-zero / 11 thermador / 12 miele / 13 viking — auto-filtered to skip URLs that themselves still 301). Dist leakage: **22 → 14** stale hrefs (all 14 from same architectural pattern at 9 OTHER brand pillars `amana/bosch/dacor/frigidaire/ge/haier/jennair/kitchenaid/lg/magic-chef/maytag/samsung/whirlpool` — full content pages 2044-5928 words also wrongly hidden behind 301s; not in spec scope, flagged for Roman). Backup: `backup/links-sweep-2026-05-06`. **Note:** Wolf had no `/brands/wolf/` redirect rule — nothing to remove.
- **2026-05-06: Wave 40 — Internal links to redirects sweep.** Ahrefs P1 flag: 84 indexable pages had internal links pointing to redirected URLs (wasted crawl budget — Google fetches X then 301-follows to Y). Built unified redirect map: `astro.config.mjs` (572 rules) + `public/_redirects` (538 rules) → 1099 unique source URLs after chain resolution + dedup. Audit found 508 stale link occurrences across 263 files. Sweep replaced href/href:/url:/url:/path:/to:/canonical contexts with final URLs (preserving `https://samedayappliance.repair/` prefix for full-URL forms like canonical). Two filter additions for auto-glob link sources: MegaMenu now excludes `/commercial/dryer-repair/` (redirected source-file pollution); city × service template's siblings array now filters to combos that exist in `CITY_SERVICE_MATRIX` (Wave 32 catch-all sent missing combos to city pillar). Build 1009 PASS. Dist leakage check: 1280 → **22 stale links** (98.3% reduction). Remaining 22 are architectural (Astro emits redirect HTML using direct target not chain-final; brands/index.astro template-literal hrefs from data slug — both out of pure-sweep scope). Backup: `backup/links-sweep-2026-05-06`.
- **2026-05-06: Wave 39 Phase 1 — Title sweep (phone + brand-tail strip).** Mechanical strip из `<title>`/`title:`/`const title=` контекстов: phone template literals (`${branch.phone}`, `${displayPhone}`) + brand-tail (`" | Same Day Appliance Repair"` хвост) + cleanup orphan separators. **151 файл changed (140 первый прогон + 11 после bugfix: case-insensitive `phone` и single-quote `const title='...'`)**. Strip stats: 85 phone (2 displayPhone literal + 83 template), 66 brand-tail. ai-diagnostic.astro — direct edit (Layout title prop pattern). Body / hero / schema / meta description НЕ трогали — только title. Phase 2 audit: titles ≤60 = 131 (было ~100), titles >60 = 667 (было 798). Build 1009 pages PASS. Backup: `backup/title-sweep-2026-05-06`.
- **2026-05-06: Wave 38 — Ahrefs P1 fixes.** Canonical→redirect loop на 11 outdoor URL фиксил (canonical указывал на legacy URL который 301'ил обратно — все теперь self-canonical /outdoor/X/). 13 orphan pages переключены в hub'ы: 4 outdoor refrigerator brand pages (services/outdoor-refrigerator-repair), 3 short wine-cellar brand pillars + 3 их -wine-cellar-repair counterparts (services/wine-cellar-cooling-repair), commercial wine-cellar-cooling-repair (commercial/refrigeration hub + cross-link), Kalamazoo (outdoor/grill-repair + outdoor/kitchen-repair brand grids), /ai-diagnostic/ (Footer Company section → 1009 incoming links).
- **2026-05-06: Wave 36 hours sweep** — visible UI + schema OpeningHoursSpecification унифицированы по всему сайту до canonical SSOT (`Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7`). 39 visible-UI files + 278 schema files + 2 FAQ-answer fixes (north-hollywood, tarzana — Sunday-availability claims contradicting SSOT). `OPENING_HOURS_SCHEMA` теперь включает Sunday closed (00:00-00:00) per Google's pattern. /contact/ переписан на `OPENING_HOURS_SCHEMA` import (был динамический string-form openingHours per-branch, который генерировал Mon-Sun 7am-9pm для 6 веток). Verification: 1009/1009 dist pages canonical visible, 0 stale patterns. Backup: `backup/hours-sweep-2026-05-06`.
- **2026-05-06: NAP sweep (Wave 35)** — old PMB address (6230 Wilshire / PMB 2267) удалён из footer + 87 JSON-LD блоков. CSLB C-20 удалён со всех 41 страницы (это appliance site, не HVAC). BHGS Registration labeling унифицирован: «BHGS Licensed» (168 файлов) + «CA BHGS» (87 файлов) + «License #A49573» (13 файлов) → «BHGS #A49573» / «BHGS Registration #A49573». Footer переписан на BRANCHES SSOT (no hardcoded NAP). `LEGAL_ADDRESS` const → `LEGAL_ENTITY` (только название без адреса). `internalAddress` удалены из LA + BH branches. Single public address site-wide = 8746 Rangely Ave (WeHo physical_pin only). Orphan HomepageFooter.astro удалён.
- **2026-05-06:** CLAUDE.md + 10 docs/*.md структура задеплоена в sdar-v2 root
- **2026-05-06:** Total site audit (1009 pages, 0 P1, 25 stubs identified, tier system documented)
- **2026-05-06:** Analytics stack full deployment (GTM `GTM-M43LT47K` + GA4 `G-PST1TR9G88` + Clarity `wn15edpjlc` + IndexNow + Cloudflare WA)
- **2026-05-06:** DNS cutover production samedayappliance.repair → sdar-v2.pages.dev
- **2026-05-06:** Wiki repo создан и запушен на GitHub (Roman-Appliance-Repair/sdar-v2-wiki, private, 24 commits history, `6f5bcb6` archive commit)
- **2026-05-06:** Project Knowledge cleanup — удалены 11 устаревших файлов, 4 заархивированы в wiki под `archive/project-knowledge-2026-05/`
- **2026-05-04:** Кластеры 1–5 завершены (Outdoor + Commercial Refrigeration + Ice Machines + Refrigerator + Cooking; Cluster 5 = 29 page operations)
- **Pre-cutover (2026-04):** Zero NAP/Rating Policy SSOT violations confirmed

## На горизонте (большие задачи, не текущий sprint)

- **Cluster 6 Residential** — Phase A compliance sweep (em-dash + EPA + BHGS), Phase B sub-services под pillars (failure modes), Range-repair новый pillar
- **Photo wave (W1-W7)** — 219 фото в первых 4 волнах
- **GMB expansion** — Glendale, Long Beach (приоритет 1), Chino Hills, Temecula (волна 3)
- **Voice search optimization** — FAQPage + Speakable schema, NAP consistency audit
- **Stub cleanup batch** — 25 stubs одной writer-сессией

## Метрики (baseline 2026-05-06)

После DNS cutover GSC ещё не начал индексировать новый сайт — baseline уточним через 2 недели.

**Pre-cutover (legacy WordPress site, was at samedayappliance.repair):**
- Health Score (Ahrefs): 93/100
- Кликов в месяц: ~97
- Показов в месяц: ~63K
- CTR: 0.15%
- Средняя позиция: 23.5

**Post-cutover (sdar-v2):** TBD после 2 недель индексации.

**Build state (2026-05-06):**
- 1009 source pages, 1581 HTML files in dist
- 89 cities, 416 brand pages, 31 services, 5 county hubs, 908 city × service combos
- 830 .astro files in src/pages/
- 43 components, 4 layouts
- Build time ~45s, 0 errors, 0 warnings
