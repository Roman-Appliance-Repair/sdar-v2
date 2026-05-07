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
| 2 page titles >60 chars | san-gabriel.astro (96), services/washer-repair.astro (86) | P3 — Wave 36 sweep |
| Schema inconsistency: LocalBusiness vs HomeAndConstructionBusiness | Часть city pillars одно, часть другое | P3 — Wave 30 W3, открыто |
| san-clemente.astro = 167 body words | 1 файл | P2 — стейл от T7-dump |
| 87 city pages нуждаются в фото (5 слотов каждая) | ~435 photo slots | P2 — Photo Pipeline wave |
| ~~Rancho Cucamonga + Temecula real DID phones~~ | ~~2 placeholder в branches.ts~~ | ✅ Закрыто 2026-05-06 — реальные DID активны: RC (909) 457-1030, Temecula (951) 577-3877 |
| `audit-output/` directory | untracked, нужно в .gitignore | P3 |
| 12 modified + 76 untracked файлов в wiki repo | wiki backlog 2 недели | P3 — отдельная сессия cleanup |

## Что закрыто недавно

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
