# 2026-09-01 — Заход 1: два компонента-генератора битых ссылок

Ветка: `fix/broken-links-components` (от чистого `main` = `18623c28`).
Аудит-основание: [`2026-09-01-broken-links-audit.md`](2026-09-01-broken-links-audit.md).
Тронуты **только два компонента**. Руками вписанные `href` в страницах не трогались — это заходы 2-4.

**Отступление от CLAUDE.md §9:** работа велась в главной директории `sdar-v2`, а не в worktree,
по явной инструкции Романа («ветка от чистого main»). Параллельных терминалов в сессии не было.

---

## Число страниц: до / после

Билд снят на чистом `dist` (старый `dist` был от 11.08 и содержал накопленный мусор).

| Метрика | ДО правок | ПОСЛЕ правок |
|---|---|---|
| `page(s) built` (Astro) | **1198** | **1198** |
| `index.html` в `dist` | **1767** | **1767** |
| `.html` всего | 1769 | 1769 |
| URL в `sitemap-0.xml` | 1141 | 1141 |
| Ошибок билда | 0 | 0 |

Разница 1767 − 1198 = 569 — это HTML-заглушки редиректов из `astro.config.mjs`, они не «страницы».

Сверх счётчика сверен **сам набор маршрутов**: `diff` списка из 1767 путей до и после — **идентичен**,
ни одного добавленного или потерянного URL.

---

## ПРАВКА A — `src/components/Breadcrumbs.astro`

**Было:** цикл на строках 133-135 клеил промежуточный сегмент крошек и всегда оборачивал его в `<a>`,
не проверяя, есть ли за этим адресом страница. Отсюда `/outdoor/brands/` — 13 ссылок в 404.

**Стало:**

1. Множество существующих маршрутов собирается из того же дерева `src/pages`, из которого Astro
   строит роуты и `@astrojs/sitemap` — через `import.meta.glob('/src/pages/**/*.astro')`.
   Vite резолвит glob на этапе трансформации, так что это просто список ключей, а не импорты.
   Список руками не ведётся. Результат кэшируется на `globalThis` — фронтматтер компонента
   выполняется на каждой из ~1200 страниц, а Set нужно построить один раз за билд.
2. У `Crumb` появилось поле `hasPage`. Для промежуточных сегментов оно = `routeExists(href)`,
   для Home / секции / листа = `true` (их адреса существуют по построению).
3. Рендер: `hasPage === false` → `<span class="breadcrumbs-plain">` вместо `<a>`.
   Порядок, текст и количество сегментов не менялись.
4. CSS: `.breadcrumbs-item .breadcrumbs-plain { color: var(--muted) }` — ровно тот же цвет, что у
   ссылки в покое; подчёркивания у ссылок нет (`text-decoration: none`), так что визуально не отличить.
5. JSON-LD: элемент остаётся на месте с той же `position` и тем же `name`, но **без `item`**.
   `ListItem` с одним `name` валиден (это та же форма, которую Google документирует для последней
   крошки), а `item` на 404 хуже, чем его отсутствие. Позиции остаются сплошными 1..n.

### Масштаб правки — ровно 2 адреса на весь сайт

Прогон по всем 1767 маршрутам билда: промежуточных сегментов 71 различных, из них
**69 существуют** (396 страниц — ссылки сохранились) и **2 не существуют**:

| Промежуточный адрес | Страниц | Статус |
|---|---|---|
| `/outdoor/brands/` | 13 | совпало с Ahrefs 1-в-1 |
| `/commercial/dishwasher-repair/brands/` | 1 | это HTML-заглушка редиректа (`noindex`), компонент на ней не рендерится |

Фактически в вёрстке изменились **13 страниц** — все `/outdoor/brands/*`.

---

## ПРАВКА B — `src/components/cities/v2/ServicesGrid.astro`

**Было:** `toHref()` слепо собирал `/services/{slug}-repair/` из slug карточки города.
Механизм `HREF_ALIAS` (строка 133) заведён ровно под этот баг (`bbq → bbq-grill`), но недостающие
slug-и в него не занесли.

**Стало:**

1. `HREF_ALIAS` расширен. Значение **без** ведущего слеша — как раньше, slug хаба под `/services/`;
   значение **со** слешем — полный путь, для карточек, чей настоящий хаб лежит вообще не в `/services/`.
2. Добавлена защита: маршрут проверяется тем же способом, что в `Breadcrumbs.astro`
   (`import.meta.glob` по `src/pages`). Если после алиаса страницы всё равно нет — `toHref()` возвращает
   `null`, и карточка рендерится `<div class="v2-svc-card">` без `href` и без «Learn more →».
   Hover-правила переспециализированы на `a.v2-svc-card:hover`, чтобы такая карточка не подпрыгивала
   и не краснела, притворяясь кликабельной.

### Занесённые алиасы

| slug | было (404) | стало | live curl |
|---|---|---|---|
| `commercial-refrigerator` | `/services/commercial-refrigerator-repair/` | `/commercial/refrigerator-repair/` | 200 |
| `outdoor-appliance` | `/services/outdoor-appliance-repair/` | `/outdoor/` | 200 |
| `ice-machine` | `/services/ice-machine-repair/` | `/services/ice-maker-repair/` | 200 |
| `wall-heater` | `/services/wall-heater-repair/` | `/services/` | 200 |
| `commercial` | `/services/commercial-repair/` | `/commercial/` | 200 |

### Две находки по ходу правки B

**1. Битых slug-ов было пять, а не четыре.** Ground truth снят из собранного `dist` по
`href="…" class="v2-svc-card"`: 20 различных адресов, из них 5 битых. Пятый —
`slug: 'commercial'` на `north-hollywood.astro:72` → `/services/commercial-repair/`.
В отчёте аудита он числился в блоке «14 ссылок, захардкожено в `/commercial/*`», потому что
13 из 14 ссылок на этот URL действительно захардкожены в теле страниц `/commercial/`.
Четырнадцатая рождалась в `ServicesGrid`. Она починена здесь; **13 захардкоженных остаются
на заход 2** и по-прежнему видны в `dist`.

**2. Страницы про настенный обогреватель на сайте нет вообще.** Аудит рекомендовал заменить
`/services/wall-heater-repair/` на `/services/wall-heater-repair-los-angeles/` — это **ошибка отчёта**:
тот адрес не страница, а 301 на `/services/` (`astro.config.mjs:807`, `public/_redirects:523`).
Живой curl отдавал 200 уже после редиректа, а `url_effective` для целей-замен я тогда не сверял.
Весь HVAC-раздел вынесен и 301-ится на `/services/` (строки 799-809). Поэтому алиас ведёт туда же,
куда сайт уже сам отправляет этот URL. **Контент-дыра, требует решения Романа:** карточка
«Wall Heater Repair» на пилларе `/los-angeles/` ведёт на общий индекс услуг, потому что вести некуда.

Тем же способом стоит перепроверить остальные «плоские» цели из отчёта аудита
(`/kitchenaid-stove-repair-los-angeles/`, `/sub-zero-freezer-repair-los-angeles/` и т.п.) —
часть из них может оказаться такими же заглушками редиректов. Это заход 2.

---

## Проверки

### 1. Билд

0 ошибок. `1198 page(s) built` — совпадает с зафиксированным ДО. Все счётчики выше совпали,
набор из 1767 маршрутов идентичен базовому (`diff` пустой).

### 2. Греп по `dist` — ни одного вхождения

| URL | `href="…"` | `"item":"…"` в JSON-LD |
|---|---|---|
| `/outdoor/brands/` | **0** | **0** |
| `/services/commercial-refrigerator-repair/` | **0** | **0** |
| `/services/ice-machine-repair/` | **0** | **0** |
| `/services/outdoor-appliance-repair/` | **0** | **0** |
| `/services/wall-heater-repair/` | **0** | **0** |

Бонусом: `/services/commercial-repair/` из `ServicesGrid` — **0** (было 1).
Остаток 13 — захардкоженные `<a>` в `/commercial/*`, вне рамок захода 1.

### 3. Пять страниц, где крошка раньше давала битую ссылку

`/outdoor/brands/bull/`, `/lynx/`, `/dcs/`, `/napoleon/`, `/blaze/` — на всех:

```html
<li class="breadcrumbs-item"><a href="/">Home</a><span class="breadcrumbs-sep" aria-hidden="true">›</span></li>
<li class="breadcrumbs-item"><a href="/outdoor/">Outdoor</a><span class="breadcrumbs-sep" aria-hidden="true">›</span></li>
<li class="breadcrumbs-item"><span class="breadcrumbs-plain">Brands</span><span class="breadcrumbs-sep" aria-hidden="true">›</span></li>
<li class="breadcrumbs-item"><span aria-current="page">Bull</span></li>
```

Сегмент `Brands` на месте текстом, 4 крошки как было, разделители целы, вёрстка не поехала.

JSON-LD на `/outdoor/brands/bull/`:

```json
{"@type":"ListItem","position":2,"name":"Outdoor","item":"https://samedayappliance.repair/outdoor/"},
{"@type":"ListItem","position":3,"name":"Brands"},
{"@type":"ListItem","position":4,"name":"Bull","item":"https://samedayappliance.repair/outdoor/brands/bull/"}
```

Разобраны **все 2121 `BreadcrumbList`** в `dist`: JSON парсится везде, позиции сплошные 1..n везде,
`name` есть у каждого элемента, структурных проблем **0**. Без `item` — 13 наших крошек `Brands`
плюс 26 листовых элементов в схемах, написанных руками в самих страницах (были такими и до правки).

Site-wide охват изменения: `class="breadcrumbs-plain"` встречается **13 раз на 13 страницах** — ровно
`/outdoor/brands/*`. Карточек без ссылки в `ServicesGrid` — **0** (защита не сработала нигде).

### 4. Промежуточный маршрут СУЩЕСТВУЕТ — ссылка осталась ссылкой (6 страниц)

| Страница | Крошки |
|---|---|
| `/commercial/refrigeration/brands/traulsen/` | `/` · `/commercial/` · `/commercial/refrigeration/` · `/commercial/refrigeration/brands/` |
| `/commercial/washer-repair/brands/unimac/` | `/` · `/commercial/` · `/commercial/washer-repair/` · `/commercial/washer-repair/brands/` |
| `/commercial/ice-machines/brands/follett/` | `/` · `/commercial/` · `/commercial/ice-machines/` · `/commercial/ice-machines/brands/` |
| `/commercial/holding-cabinet-repair/brands/hatco/` | `/` · `/commercial/` · `/commercial/holding-cabinet-repair/` · `/commercial/holding-cabinet-repair/brands/` |
| `/outdoor/smoker-repair/brands/traeger/` | `/` · `/outdoor/` · `/outdoor/smoker-repair/` · `/outdoor/smoker-repair/brands/` |
| `/services/refrigerator-repair/not-cooling/` | `/` · `/services/` · `/services/refrigerator-repair/` |

Все промежуточные сегменты — по-прежнему `<a href>`.

Карточки `ServicesGrid` на затронутых пилларах после правки:

| Страница | Новый адрес карточки |
|---|---|
| `/anaheim/`, `/hollywood/`, `/koreatown/`, `/los-angeles/`, `/marina-del-rey/` | `/commercial/refrigerator-repair/` |
| `/huntington-beach/`, `/laguna-beach/`, `/newport-beach/` | `/outdoor/` + `/services/ice-maker-repair/` |
| `/north-hollywood/` | `/commercial/` |
| `/los-angeles/` (wall heater) | `/services/` |

---

## Git

Закоммичено локально, **не запушено**. `git add` по явным путям, без `-A`.

Изменены:
- `src/components/Breadcrumbs.astro`
- `src/components/cities/v2/ServicesGrid.astro`
- `session-log/2026-09-01-fix-components.md`

## Хвосты на заходы 2-4

1. 13 захардкоженных `<a href="/services/commercial-repair/">` в `/commercial/*` — заход 2.
2. Перепроверить `url_effective` у «плоских» целей-замен из отчёта аудита: часть может быть
   заглушками редиректов, как `wall-heater-repair-los-angeles`.
3. Контент-решение Романа: заводить ли страницу про настенные обогреватели, или убрать карточку
   с пиллара `/los-angeles/`.
