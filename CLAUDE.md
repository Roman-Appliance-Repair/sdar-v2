# SDAR — Same Day Appliance Repair

> **Точка входа в любой новый чат или сессию Claude Code.**
> Прочти этот файл первым. Он компактный — детали подгружай через @-ссылки внизу под конкретную задачу.

**Последняя синхронизация:** 2026-05-07 (после P0 schema sync для LSA trust restoration)

---

## 1. Бизнес — быстрый контекст

- **Домен:** samedayappliance.repair
- **Юр. лицо:** HVAC 777 LLC dba Same Day Appliance Repair (в visible UI только в footer copyright line; в JSON-LD `legalName` во всех LocalBusiness schemas site-wide через `src/data/credentials-schema.ts` → `mergeCredentials()` helper)
- **Зоны:** 5 каунти SoCal — LA, Orange, Ventura, San Bernardino, Riverside
- **Часы:** Пн–Сб 8:00–20:00, Вс закрыто. Звонки принимаются 24/7
- **Цены:** $89 residential / $120 commercial (waived с repair). НИКОГДА не смешивать на одной странице
- **NAP (физический пин):** 8746 Rangely Ave, West Hollywood, CA 90048 — единственный public streetAddress на сайте, эмитится в schema на 4 pin pages: `/`, `/west-hollywood/`, `/contact/` (в WeHo entry), `/book/`
- **Aggregate Rating:** не используется нигде (ни в JSON-LD, ни в visible UI). Google берёт rating напрямую из GMB. См. @docs/factual-accuracy.md §6
- **Технари в текстах:** Mikhail V., Artur S., David K.

### Лицензии (4 credentials site-wide — FINAL 2026-05-07)
| Credential | Применение |
|---|---|
| BHGS Registration #A49573 | Site-wide (schema + visible footer) — главная appliance registration |
| EPA 608 Universal #1346255700410 | Site-wide — federal refrigerant cert |
| CSLB C-20 HVAC | Site-wide — нужен для NAP/LSA match |
| BBB Accredited Business | Site-wide — БЕЗ буквы рейтинга (real BBB grade = A, не A+; «BBB A+» — false claim) |

SSOT: `src/data/credentials-schema.ts` экспортирует `CANONICAL_CREDENTIALS` array (4 entries c `recognizedBy`) + `LEGAL_NAME` + `mergeCredentials(schema)` helper. Применяется в HomepageSchema + 89 city pillars + contact + book + credentials/licensed (Phase 2b-1, commit `39042c7`). Phase 2b-2 deferred — 580 schemaJsons sub-pages через AST-aware modifier.

CSLB C-38 (Refrigeration) более не используется (отменено в FINAL 2026-05-07 policy). CSLB #1138898 — retired, нигде не упоминать.

---

## 2. Стек и инфраструктура

- **Site framework:** Astro SSG → Cloudflare Pages
- **Preview:** sdar-v2.pages.dev
- **Production:** samedayappliance.repair (DNS cutover выполнен 2026-05-06)
- **Repo:** github.com/Roman-Appliance-Repair/sdar-v2 (ветка `main`)
- **Local:** `C:\Users\Roman\WebstormProjects\sdar-v2\`
- **Wiki repo (методология, handoffs, cluster plans):** github.com/Roman-Appliance-Repair/sdar-v2-wiki (ветка `master`, private)
- **Wiki local:** `C:\Users\Roman\projects\sdar-v2-wiki\sdar-v2-wiki\`

---

## 3. Состояние сайта (по аудиту 2026-05-06)

- **1009 source pages** (1581 HTML в dist с учётом 572 redirect emissions)
- **89 cities**, **416 brand pages**, **31 service** (15 commercial-flagged), **5 county hubs**, **908 city × service** combos, **49 sub-services** (failure modes), **50 outdoor**, **157 commercial**
- **0 ошибок билда** · **0 P1 violations** в SEO sample · build time ~45s
- **830 .astro файлов** в `src/pages/`, из них **25 stubs** (<200 body words)
- **43 компонента** в `src/components/`, из них **7 orphan** (кандидаты на удаление)
- Полная аналитическая инфраструктура запущена 2026-05-06: GTM + GA4 + GSC + Bing + IndexNow + Clarity + Cloudflare Web Analytics

@docs/current-status.md

---

## 4. Источники истины — приоритет сверху вниз

1. **`src/data/*.ts`** в sdar-v2 — техническая правда (branches, cities, services, content)
2. **`wiki/page-plans/METHODOLOGY.md`** v1.3.1 — методология кластерной работы
3. **Notion writing standard** — `343788eea1d581f9b8f5d4cadd7a54e2`
4. **Notion tracker** — `343788eea1d58113aab9fafd42075964` (обновляется после каждой страницы)
5. Этот **CLAUDE.md** + `docs/`
6. **Project Knowledge** в claude.ai — зеркало этого файла

При конфликте: верхний пункт побеждает. Не доверять старым `.docx`/`.md` без даты — данные могут быть устаревшими (старые лицензии CSLB #1138898, "WordPress legacy", 76 cities — всё это устарело).

### Data layer — что где

| Файл `src/data/` | Содержит |
|---|---|
| `branches.ts` | 8 филиалов: slug, name, phone, address, county, cities[] |
| `cities.ts` | 89 городов: flat slug→branch→county lookup (без tier) |
| `city-service-content.ts` | `CITY_DESCRIPTORS` — tier города (8 значений), brand pool, climate notes |
| `services.ts` | 31 услуга: slug, name, commercial flag, **service tier** (tier1/2/3 — приоритет контента) |
| `city-service-matrix.ts` | Какие city × service комбинации генерятся (hubs × 15, non-hub × 5) |
| `counties.ts` + `county-boundaries.ts` | 5 county hubs + Leaflet polygon data |
| `pricing.ts` + `repair-estimates.ts` | Pricing tiers (residential/commercial) |
| `business-hours.ts` | Часы работы |
| `credentials.ts` | Лицензии и сертификации |
| `faq.ts` | FAQ контент |
| `homepage-services.ts` | Что на главной |
| `testimonials.ts` | Отзывы |

### Две независимых tier-системы — не путать!
- **`CityDescriptor.tier`** в `city-service-content.ts` → социально-экономический + гео-кластер: `ULTRA-PREMIUM | PREMIUM | GENERAL | PREMIUM-OC | MID-TIER-NE | MID-TIER-VENTURA | INLAND-EMPIRE | INLAND-RIVERSIDE`. Управляет brand pool на city × service страницах.
- **`Service.tier`** в `services.ts` → приоритет контента: `tier1 | tier2 | tier3`. Управляет какие city × service страницы генерятся (hubs × 15 vs non-hub × 5).

---

## 5. Правила всегда применяемые

@docs/voice-and-style.md
@docs/factual-accuracy.md
@docs/seo-policies.md

Кратко (без подгрузки):
- Голос: «our techs», «we», «our guys» — никогда «I», никогда корпоративно
- Видимый UI: никаких `aggregateRating`, `4.6 / 37 reviews`, `BBB A+`, `HVAC 777 LLC` (кроме footer copyright), `streetAddress` (кроме WeHo pin pages)
- BBB: только «BBB Accredited» / «BBB Accredited Business», никогда «BBB A+» (false claim — real grade = A)
- Cred labeling: «BHGS #A49573», «EPA 608 Universal», «CSLB C-20 HVAC». Никогда: «BHGS Licensed», «CSLB License #A49573», «CA BHGS», «CSLB #1138898» (retired)
- Цены: $89 ИЛИ $120 на одной странице, не оба
- Wood-burning fireplaces исключены (SCAQMD restrictions) — only gas
- Wolf не делает residential refrigerators / dishwashers; Sub-Zero не делает dishwashers; KitchenAid и JennAir не продают washers/dryers в США

---

## 6. Под задачу — подгружай нужное

| Задача | Что подгружать |
|---|---|
| Писать city / brand / service страницу | @docs/methodology.md + @docs/voice-and-style.md |
| Cluster work (residential/commercial) | @docs/methodology.md + wiki: `page-plans/cluster-XX/index.md` |
| Дизайн, UI, новый шаблон | @docs/design-system.md |
| Фото, AI-генерация, photo pipeline | @docs/photo-pipeline.md |
| GA4/GTM/GSC/Clarity настройки и отладка | @docs/analytics-stack.md |
| GMB решения, новые локации | @docs/gmb-strategy.md |
| Schema, JSON-LD, NAP audit | @docs/seo-policies.md |
| Терминалы T1–T6 оркестрация | @docs/terminal-orchestration.md |
| Resume after pause / понять «как мы сюда пришли» | session-log/*.md (последние 3-5 записей) |

Wiki не подгружается через `@-syntax` (отдельный репо) — путь: `C:\Users\Roman\projects\sdar-v2-wiki\sdar-v2-wiki\`. Главное там: `wiki/page-plans/METHODOLOGY.md` (v1.3.1).

---

## 7. Коммуникация с Roman

- Roman не программист — без жаргона (revert/refactor/hybrid/batch — объяснять простыми словами)
- Решения: одна чёткая рекомендация, не опросники с вариантами
- Не использовать `ask_user_input_v0` polls
- Russian для оркестрации, English для кода и коммитов
- Не предлагать «паузу» или «остановиться» — Roman сам решает
- Не регенерировать промпты после подтверждения «запустил» — acknowledge и ждать output
- Roman ценит результат и качество, не процесс

---

## 8. Обновление knowledge base — обязанность каждого терминала

**Важно: knowledge base ОБНОВЛЯЕТСЯ автоматически после работы, не только Roman'ом.**

| Файл | Когда обновлять | Кто |
|---|---|---|
| **`session-log/<today>.md`** | После каждого `git push` или важного решения. Append-only | Терминал, сразу |
| **`docs/current-status.md`** | После закрытия задачи / completion стадии | Терминал, в том же commit |
| **`docs/factual-accuracy.md`** | При изменении бизнес-фактов (лицензии, цены, NAP, brand ownership) | Терминал по согласованию с Roman |
| **`docs/methodology.md`** + другие domain docs | При изменении правил или процесса | Orchestrator chat обсуждает с Roman, потом T1 commit |
| **`CLAUDE.md` (этот)** | Только при изменении структуры разделов или ссылок | Редкие изменения, после обсуждения |
| **`memory_user_edits`** | При новых business facts которые нужны кросс-проектно | Orchestrator |

**Стандартный pattern для commit message:**
- `status: <что изменилось>` — для current-status.md
- `log: <дата> <короткое описание>` — для session-log
- `docs(<area>): <изменение>` — для doc files
- `claude-md: <раздел>` — для CLAUDE.md

**Не смешивать** обновление status/log с feature commits — отдельные коммиты, чтобы git blame был полезен.

### Auto-pattern для writer terminals

После `git push origin main` нового контента — автоматически:
```bash
# 1. Append session log entry
echo "..." >> docs/../session-log/$(date +%Y-%m-%d).md
git add session-log/
git commit -m "log: $(date +%Y-%m-%d) <описание>"

# 2. Update current-status if applicable
# (e.g. moved item from "Что в работе" to "Что закрыто")

git push origin main
```

См. `session-log/README.md` для формата записей.
