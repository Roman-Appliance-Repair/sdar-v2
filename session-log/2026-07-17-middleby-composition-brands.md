# 2026-07-17 — Middleby → Composition Brands: волна правок прозой (не свип)

Merge `e1c62165` на main. Два коммита-батча: `223ecaf4` (Viking family, 18 файлов),
`06ebdec5` (AGA / Marvel / U-Line / La Cornue, 18 файлов). Итого **27 файлов**.
Классификация на диске **до** правок: `wiki/audits/middleby-classification-2026-07-17.md`
(вики `e928559`).

## Факт

**02.02.2026** 26North Partners купила **51%** Residential Kitchen Equipment Group у
Middleby ($885 млн); Middleby осталось **49% non-controlling**; бизнес переименован в
**Composition Brands**.

**Primary:** Middleby 10-K FY2026 —
`sec.gov/Archives/edgar/data/769520/000076952026000011/midd-20260103.htm`.
Название «Composition Brands» **в SEC нет** — первичка на ребренд: релиз 26North
`businesswire.com/news/home/20260202412606/en/`; реестр `compositionbrands.com/our-brands/`.

## Классификация (шаг 1, до единой правки)

Просканировано `src/**/*.{astro,ts}`: **139 файлов**, **994 предложения** с «Middleby».

| класс | предложений | действие |
|---|---:|---|
| STAYED (коммерческие бренды Middleby) | 429 | **не трогали** |
| NO-BRAND | 366 | не трогали |
| DEPARTED-MENTION (без утверждения владения) | 139 | читали, правили точечно |
| DEPARTED-FIX | 60 | правили (7 уже были корректны) |

**AMBIGUOUS (EVO) — пусто.** Расхождение источников по EVO реально (10-K commercial list ↔
compositionbrands.com), но **footprint на сайте нулевой**: единственный «EVO» у нас —
модель посудомоек Fagor **«EVO Concept+ HRS»**, к бренду отношения не имеющая. Роману
решать нечего.

## Почему слепой свип был бы катастрофой — теперь доказано

В коммерческом списке 10-K FY2026 **остаются** «**Viking Commercial**», «**U-Line
Commercial**», «**Marvel Scientific**» + TurboChef, Blodgett, Middleby Marshall, Bakers
Pride, Pitco… Поиск-замена по строкам «Viking» / «U-Line» / «Marvel» **сломала бы верные
коммерческие вхождения**.

Сайт уже правильно различал: «Viking Residential ≠ Viking Commercial (separate Middleby
commercial division)» — **не тронуто**.

**Проверено после правок:** Blodgett — 13 упоминаний Middleby, TurboChef — 17, Middleby
Marshall — 5, Bakers Pride — 3, commercial True — 2. Все на месте, Composition Brands там
×0.

## Что правили, а что нет

**Правили:** только утверждения владения в настоящем времени — «Viking **is** Middleby
Residential», «Viking (Middleby-owned)», «Middleby sibling», «Middleby **owns** Viking, La
Cornue, AGA», «Marvel is part of the Middleby Corporation».

**НЕ правили — намеренно:**
- **Историю.** «Middleby bought Viking in January 2013» — по-прежнему верно, осталось; к
  нему добавлен февраль 2026.
- **Parts-channel формулировки** («Middleby Greenwood MS parts», «parts route through
  Middleby's US distribution network»). Это операционка, не владение, и **источника на то,
  как канал брендирован после сделки, у меня нет**. Выдумать его = ровно тот грех, ради
  устранения которого волна и делалась. Флагнуто.
- **Отрицания**, которые и так верны («BlueStar has **not** been acquired by Middleby») —
  правился только скобочный кусок, называвший Middleby родителем Viking.

## Две ошибки в датах — найдены и исправлены по источнику

- `la-cornue-range-hood-repair`: «acquired by Middleby **in 2017**» — **неверно**. La Cornue
  пришла с покупкой AGA Rangemaster Group, закрытой **в сентябре 2015**
  (businesswire 20150929005733).
- `marvel.astro`: «Middleby acquired Marvel **in 2016**» — **неверно**, та же причина.
  При этом `marvel-refrigerator-repair` уже писал правильный сентябрь 2015 — сайт
  противоречил сам себе.

## Флагнуто, НЕ исправлено

**Viking: две разные даты начала Middleby на нашем же сайте** — «**2002**» (×4:
viking-range-hood-repair, viking-stove-repair, viking-wall-oven-repair) против «**January
2013**» (×7). 2013 почти наверняка верно, но в этом проходе я его не верифицировал, поэтому
там, где стояло 2002, предложение переписано **в обход года**, а не с подстановкой другого.
Нужна отдельная проверка.

## Урок: классификатор — не гейт, гейт — это dist

Предложенческий классификатор дал 60 DEPARTED-FIX. **Скан собранного dist нашёл ещё 10
страниц**, которые он пропустил, — другие формулировки: «Viking is owned by Middleby
Corporation (NASDAQ: MIDD)», `<h2>Middleby family, Viking + La Cornue + AGA</h2>`,
«Virtuoso 7 Series · Middleby», «AGA Middleby family outdoor + undercounter specialty».
Классификатор — точка входа; **правду говорит рендер**.

Оставшиеся 2 хита скана — ложные срабатывания сплиттера (наш собственный текст в прошедшем
времени на true-residential + список related-ссылок на wolf-wall-oven), проверены чтением.

## Гейты и прод

- forbidden §2 — **0** на всех 27 тронутых файлах.
- **diff-guard: 0 ссылок добавлено/удалено** — каждый `href` встречается одинаково на `+` и
  `-` строках (правился только анкор-текст, не адреса).
- 0 устаревших утверждений владения в тронутых исходниках.
- Build **1181**.
- **Прод по байтам** (главная `9042d65caa`), 5 сэмплов — все REAL, «Composition Brands»
  присутствует, устаревших утверждений **0**: viking-stove-repair `4f6dc3b5b3` ·
  marvel `0f03b8e471` · aga-stove-repair `8a7e46d95f` · la-cornue-range-hood-repair
  `827ad5a681` · viking-wall-oven-repair `b6d8d1517b`.

**Ловушка прода (снова):** сразу после деплоя `marvel` и `aga-stove-repair` отдавали
«Composition Brands ×0», хотя их соседи уже показывали правку — часть edge-нод держала
stale. Ждал сходимости, потом перепроверял. Не верить первому ответу.

## Дальше

По стоячему плану: **T2** (aga, heartland, perlick-residential), затем **T3**. Правок меню
не делаем — Premium упёрся в 19 строк из 19 (1072px из бюджета 1080), решение по 4-й
колонке или hub-only за Романом.
