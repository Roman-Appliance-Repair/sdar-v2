# 2026-08-08 — Hero branch cards redesign + abbreviation purge

**Ветка:** `feat/hero-branch-cards` → merge в main `187ddb5f`. Бэкап: `backup/pre-abbrev-sweep-2026-08-08`.

## PART 1 — Abbreviation purge (правило Романа, FINAL)

Свип 866 файлов, ~2 620 замен (`scripts/abbrev-sweep-2026-08-08.py` + фразовые допроходы):

- `SoCal` → `Southern California` (2 140 вхождений; `SoCalGas` — имя газовой компании, не тронуто)
- `WeHo` → `West Hollywood` (275)
- `SGV` → `San Gabriel Valley` (`SGVMWD` — имя water district, не тронуто)
- `IE` → `Inland Empire` — только региональные употребления; **IE = код ошибки LG (inlet error)** на error-code страницах не тронут (66 вхождений в dist — это коды приборов)
- `BH` → `Beverly Hills` (74)
- `SB` → `San Bernardino` по контексту; **Delfield SB = salad bar серия**, не тронута
- `SD` — в visible-тексте только продуктовые серии (Sub-Zero SD, Marsal SD, Panasonic NN-SD, Whirlpool SD-код) — ничего не заменялось
- Протухший 5-каунти список `across LA, OC, Ventura, SB, Riverside` (~40 meta descriptions) → `across 7 Southern California counties`
- Каунти-список `LA, Orange, Ventura` → `Los Angeles, Orange, Ventura` (372 вхождения, 314 файлов — Footer, MegaMenu, интро главной, схемы)
- Тикер TrustBar: `10 BRANCHES · 7 COUNTIES · SOUTHERN CALIFORNIA` (был SOCAL); чип credentials/same-day-service → `7 Counties Across Southern California`
- Главная: убран `Washer & Dryer Repair LA` → без LA; протухшие «8 Branches» / «8 SoCal branches» → `{BRANCHES.length}` + Southern California; bottom-CTA дополнен Santa Barbara + San Diego

**Не тронуто намеренно:**
- 5 клиентских цитат-отзывов с WeHo/SGV (цитаты неприкосновенны, voice-and-style §2.1)
- `LA` (10 733) и `OC` (1 193) в титулах Wave 39 (шаблон «Repair LA — Same Day» под лимит 60) и прозе — конфликт с title-политикой, ждёт решения Романа (см. отчёт)
- 121 meta description стали >160 симв. после расширения — по инструкции «report, not abbreviate»: список `audit-output/abbrev-overflow-final.txt` (+91 были над лимитом ещё до свипа)

**Dist-проверка (rendered text, 1768 HTML):** 0 городских аббревиатур. Остатки = только продуктовые коды.

## PART 2 — HeroBranchBand

Новый `src/components/HeroBranchBand.astro` — лента 2×5 карточек филиалов внизу hero:
- главная (`index.astro`, заменил hp-branch-chips) + все 99 city pillars через `cities/v2/HeroSection.astro`
- порядок: филиал страницы первым (montecito → Santa Barbara, la-jolla → San Diego, pasadena → Pasadena — проверено в dist и на проде)
- стиль: полупрозрачные frosted-карточки сохранены; нижний scrim rgba(8,8,8,0.94)
- **Контраст (посчитан, worst case = белый пиксель фото под скримом):** телефон `#FF5A4E` = 4.70:1, город `#D4AF37` (brand gold) = 6.88:1, hover белый на `#C8102E` = 5.88:1 — всё проходит WCAG AA 4.5:1. Брендовый красный `#C8102E` как текст = 2.46:1 (fail) — поэтому светлый красный.
- hover/tap: фон брендовый красный, текст белый; вся карточка = tel-ссылка, min-height 48px
- мобайл: primary-карточка + кнопка «All 10 branches ▾» (все 10 карточек в SSR-HTML; сворачивание только JS'ом — no-JS и краулеры видят всё)

## Deploy

Build 1197 страниц, 0 ошибок. Push `187ddb5f`, Pages deploy ~225 c, `cf-purge.py` → Purge Everything OK. Прод проверен: 4 страницы отдают ленту (10 карточек, верный первый филиал), тикер live. Байтовая сверка prod vs dist: идентично кроме CF-инъекций (Turnstile key env + beacon). Визуально проверено в Chrome: 1440 (лента, hover, тикер одной строкой) и 412 (collapsed-карточка + тоггл; через iframe-обёртку на dist — окно Chrome развёрнуто и не ресайзится инструментом).

## Хвосты
- 121 meta descriptions >160 после полных имён — ждут реворда (список в audit-output/abbrev-overflow-final.txt)
- LA/OC покет (титулы Wave 39 + проза) — решение Романа
