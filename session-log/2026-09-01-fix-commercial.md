# 2026-09-01 — Заход 2: коммерческий раздел

Ветка: `fix/broken-links-components` (продолжение захода 1, коммит `3b66d926`).
Аудит-основание: [`2026-09-01-broken-links-audit.md`](2026-09-01-broken-links-audit.md).
Заход 1: [`2026-09-01-fix-components.md`](2026-09-01-fix-components.md).

Тронуто: 7 адресов холодильного/коммерческого оборудования (25 ссылок по Ahrefs, 38 `href` в исходниках)
+ 13 захардкоженных `/services/commercial-repair/` + хвост захода 1.

---

## Шаг 0 — правка хвоста захода 1

Запись `'wall-heater'` удалена из `HREF_ALIAS` в `src/components/cities/v2/ServicesGrid.astro` полностью.
Вместо неё в комментарии зафиксировано, почему алиаса нет и когда его добавлять.
Карточку теперь обрабатывает защита, написанная в заходе 1.

Проверено в `dist/los-angeles/index.html`:

- карточек в сетке **10** — столько же, сколько было;
- «Wall Heater Repair» на месте, с иконкой и подписью «Gas wall heaters throughout older LA homes.
  Common in Koreatown, Mid-City, West Adams.», отрендерена как `<div class="v2-svc-card">`;
- `Learn more →` в этой карточке — **0**;
- `href="/services/" class="v2-svc-card"` — **0**;
- `/services/wall-heater-repair-los-angeles/` в `href` — **0**.

Нелинкованных карточек на весь сайт — ровно **1**, эта.

---

## Шаг 1 — перепроверка всех целей-замен из отчёта аудита

54 строки `ЗАМЕНИТЬ` дают **50 уникальных целей**. Каждая прогнана
`curl -L -w "%{http_code} %{url_effective}"`; цель засчитана, только если код 200 **и**
конечный адрес совпал с запрошенным. Дополнительно каждая годная цель сверена с локальным `dist/`
и с наличием `.astro`-исходника.

**Итог: 44 годны, 6 негодны.**

Первый прогон дал 54 нуля (`curl: (3) Malformed input to a URL function`) — Python записал TSV
с CRLF, и `\r` попадал в конец URL. Не сетевая проблема; повторено после `tr -d '\r'`.

| Цель-замена | Код | Конечный адрес | Вердикт | Чем заменить |
|---|---|---|---|---|
| `/areas/downtown-los-angeles/` | 200 | `/los-angeles/` | **НЕГОДНА** | `/los-angeles/` (страницы DTLA не существует) |
| `/brands/amana-range-repair/` | 200 | `/brands/amana-range-repair/` | годна | — |
| `/brands/big-chill-refrigerator-repair/` | 200 | `/brands/big-chill-refrigerator-repair/` | годна | — |
| `/brands/capital-bbq-grill-repair/` | 200 | `/brands/capital-bbq-grill-repair/` | годна | — |
| `/brands/dacor/` | 200 | `/brands/dacor/` | годна | — |
| `/brands/dcs-grill-repair/` | 200 | `/outdoor/brands/dcs/` | **НЕГОДНА** | `/outdoor/brands/dcs/` |
| `/brands/electrolux/` | 200 | `/brands/electrolux/` | годна | — |
| `/brands/fisher-paykel-stove-repair/` | 200 | `/brands/fisher-paykel-stove-repair/` | годна | — |
| `/brands/ge-cafe-wall-oven-repair/` | 200 | `/brands/ge-cafe-wall-oven-repair/` | годна | — |
| `/brands/ge-cafe/` | 200 | `/brands/ge-cafe/` | годна | — |
| `/brands/ge-monogram-wall-oven-repair/` | 200 | `/brands/ge-monogram-wall-oven-repair/` | годна | — |
| `/brands/ge-monogram/` | 200 | `/brands/ge-monogram/` | годна | — |
| `/brands/ge-profile-wall-oven-repair/` | 200 | `/brands/ge-profile-wall-oven-repair/` | годна | — |
| `/brands/ge-profile/` | 200 | `/brands/ge-profile/` | годна | — |
| `/brands/hestan/` | 200 | `/brands/hestan/` | годна | — |
| `/brands/hobart-dishwasher-repair/` | 200 | `/brands/hobart-dishwasher-repair/` | годна | — |
| `/brands/kitchenaid/` | 200 | `/brands/kitchenaid/` | годна | — |
| `/brands/lg-refrigerator-repair/` | 200 | `/brands/lg-refrigerator-repair/` | годна | — |
| `/brands/lincoln-pizza-oven-repair/` | 200 | `/brands/lincoln-pizza-oven-repair/` | годна | — |
| `/brands/signature-kitchen-suite-wall-oven-repair/` | 200 | `/brands/signature-kitchen-suite-wall-oven-repair/` | годна | — |
| `/brands/signature-kitchen-suite/` | 200 | `/brands/signature-kitchen-suite/` | годна | — |
| `/brands/smeg/` | 200 | `/brands/smeg/` | годна | — |
| `/brands/true-residential/` | 200 | `/brands/true-residential/` | годна | — |
| `/brands/true/` | 200 | `/brands/true/` | годна | — |
| `/brands/weber-grill-repair/` | 200 | `/brands/weber-grill-repair/` | годна | — |
| `/brands/wolf/` | 200 | `/brands/wolf/` | годна | — |
| `/commercial/` | 200 | `/commercial/` | годна | — |
| `/commercial/refrigeration/brands/beverage-air/` | 200 | `/commercial/refrigeration/brands/beverage-air/` | годна | — |
| `/commercial/refrigeration/brands/delfield/` | 200 | `/commercial/refrigeration/brands/delfield/` | годна | — |
| `/commercial/refrigeration/brands/hoshizaki/` | 200 | `/commercial/refrigeration/brands/hoshizaki/` | годна | — |
| `/commercial/refrigeration/brands/perlick/` | 200 | `/commercial/refrigeration/brands/perlick/` | годна | — |
| `/commercial/refrigeration/brands/traulsen/` | 200 | `/commercial/refrigeration/brands/traulsen/` | годна | — |
| `/commercial/refrigeration/brands/true/` | 200 | `/commercial/refrigeration/brands/true/` | годна | — |
| `/commercial/refrigerator-repair/` | 200 | `/commercial/refrigerator-repair/` | годна | — |
| `/kitchenaid-stove-repair-los-angeles/` | 200 | `/brands/kitchenaid-oven-repair/` | **НЕГОДНА** | `/brands/kitchenaid-oven-repair/` |
| `/los-angeles/` | 200 | `/los-angeles/` | годна | — |
| `/outdoor/` | 200 | `/outdoor/` | годна | — |
| `/outdoor/brands/bull/` | 200 | `/outdoor/brands/bull/` | годна | — |
| `/outdoor/brands/coyote/` | 200 | `/outdoor/brands/coyote/` | годна | — |
| `/outdoor/brands/napoleon/` | 200 | `/outdoor/brands/napoleon/` | годна | — |
| `/price-list/commercial-laundry-repair-cost/` | 200 | `/price-list/commercial-laundry-repair-cost/` | годна | — |
| `/services/dryer-vent-repair/` | 200 | `/services/dryer-vent-repair/` | годна | — |
| `/services/ice-maker-repair/` | 200 | `/services/ice-maker-repair/` | годна | — |
| `/services/refrigerator-repair/ice-maker-issues/` | 200 | `/services/refrigerator-repair/ice-maker-issues/` | годна | — |
| `/services/stackable-washer-dryer-repair/` | 200 | `/services/stackable-washer-dryer-repair/` | годна | — |
| `/services/wall-heater-repair-los-angeles/` | 200 | `/services/` | **НЕГОДНА** | страницы нет — снять ссылку (сделано в заходе 2, шаг 0) |
| `/services/wall-oven-repair/` | 200 | `/services/wall-oven-repair/` | годна | — |
| `/services/washer-repair/` | 200 | `/services/washer-repair/` | годна | — |
| `/services/wine-cooler-repair/` | 200 | `/services/wine-cooler-repair/` | годна | — |
| `/sub-zero-freezer-repair-los-angeles/` | 200 | `/sub-zero-freezer-repair-los-angeles/` | **НЕГОДНА** | `/brands/sub-zero-refrigerator-repair/` |

### Разбор шести негодных

| Цель из отчёта | Что на самом деле |
|---|---|
| `/areas/downtown-los-angeles/` | 301 → `/los-angeles/`. Страницы Downtown LA не существует ни в корне, ни в `/areas/`. Это самая дорогая ошибка отчёта: **23 ссылки** (`/downtown-la/` 17 + `/downtown/` 6) я рекомендовал вести на редирект. Настоящая цель — `/los-angeles/`. |
| `/brands/dcs-grill-repair/` | 301 → `/outdoor/brands/dcs/`. Настоящая цель — `/outdoor/brands/dcs/` (2 ссылки). |
| `/kitchenaid-stove-repair-los-angeles/` | 301 → `/brands/kitchenaid-oven-repair/`. Плоского KitchenAid-адреса нет. |
| `/services/wall-heater-repair-los-angeles/` | 301 → `/services/`. Страницы про настенный обогреватель нет вообще (весь HVAC вынесен, `astro.config.mjs:799-809`). Закрыто в шаге 0 — ссылка снята. |
| `/sub-zero-freezer-repair-los-angeles/` | **Живой curl этот случай не ловит.** Отдаёт HTTP 200 по запрошенному адресу, потому что это `meta refresh`-заглушка, а не HTTP-редирект — `curl -L` за ней не идёт. Поймано только сверкой с `dist` (`<title>Redirecting to: …`). Настоящая цель — `/brands/sub-zero-refrigerator-repair/` (`astro.config.mjs:206`). |

Из 44 годных целей заглушкой оказалась ровно одна (Sub-Zero); у остальных 43 есть `.astro`-исходник
и настоящая страница в `dist`. Правки по негодным целям (кроме wall-heater) относятся к брендовому
разделу — заходы 3-4.

**Вывод для следующих заходов:** `%{http_code}` недостаточно, и `%{url_effective}` тоже недостаточно.
Сайт эмитит редиректы двумя разными способами: HTTP-301 через `public/_redirects` (ловится
`url_effective`) и `meta refresh`-заглушку из `astro.config.mjs` (отдаёт 200 по своему же адресу).
Ловит только сверка с `dist` на `Redirecting to:`.

---

## Шаг 2 — группа commercial-refrigeration (7 адресов)

Схемы `/brands/commercial-refrigeration/{brand}-commercial-repair/` в проекте нет — ни файла,
ни маршрута. Настоящие страницы лежат по `/commercial/refrigeration/brands/{brand}/`; у всех
семи брендов целевая страница **есть**, ни одного бренда без цели не оказалось.

| Битый адрес | Цель | `href` заменено | Ссылок по Ahrefs |
|---|---|---|---|
| `/brands/commercial-refrigeration/beverage-air-commercial-repair/` | `/commercial/refrigeration/brands/beverage-air/` | 16 | 10 |
| `/brands/commercial-refrigeration/traulsen-commercial-repair/` | `/commercial/refrigeration/brands/traulsen/` | 9 | 6 |
| `/brands/commercial-refrigeration/perlick-commercial-repair/` | `/commercial/refrigeration/brands/perlick/` | 4 | 3 |
| `/brands/commercial-refrigeration/true-refrigeration-commercial-repair/` | `/commercial/refrigeration/brands/true/` | 4 | 1 |
| `/brands/commercial-refrigeration/delfield-commercial-repair/` | `/commercial/refrigeration/brands/delfield/` | 2 | 2 |
| `/brands/commercial-refrigeration/hoshizaki-commercial-repair/` | `/commercial/refrigeration/brands/hoshizaki/` | 2 | 2 |
| `/brands/commercial-dishwashers/hobart/` | `/brands/hobart-dishwasher-repair/` | 1 | 1 |
| **Итого** | | **38** | **25** |

`href` больше, чем ссылок у Ahrefs, потому что Ahrefs считает пары «страница → цель», а на
`beverage-air.astro`, `true.astro`, `vulcan.astro` и др. ссылка на один и тот же адрес стоит
по 2-5 раз в разных секциях.

Одна из ссылок (`true-residential-refrigerator-repair.astro:17`) записана одинарными кавычками
внутри строки FAQ-ответа — обработана отдельным шаблоном, иначе бы потерялась.

---

## Шаг 3 — /services/commercial-repair/ (13 захардкоженных)

Заменено на `/commercial/` — 13 `href` в 13 файлах (`/commercial/*` + `price-list/`).
Четырнадцатая ссылка на этот адрес рождалась в `ServicesGrid` и закрыта в заходе 1.

**Дополнительно найдено:** `src/pages/commercial/index.astro:29` держал в JSON-LD
`"url": "https://samedayappliance.repair/services/commercial-repair/"` — то есть страница
`/commercial/` в своей же схеме `LocalBusiness` объявляла себя несуществующим адресом.
Это не `href` и не попало бы в отчёт Ahrefs, но проверка 2 требует чистоты и внутри JSON-LD.
Исправлено на `https://samedayappliance.repair/commercial/`.

Всего заменён **51 `href`** в **36 файлах** плюс 1 поле `url` в схеме.

---

## Анкорный текст не тронут — машинная проверка

По требованию правился только `href`. Проверено программно, а не на глаз: для каждого из 38
файлов диффа взят `git show HEAD:<файл>`, в обеих версиях значения `href="…"` / `href='…'` и поле
`"url": "https://samedayappliance.repair…"` заменены на плейсхолдер, строки нормализованы по
переводам строк и сравнены.

**Расходится ровно 1 файл — `src/components/cities/v2/ServicesGrid.astro`**, где по заданию
менялась карта алиасов и комментарий к ней. Остальные **37 файлов совпадают побайтово**:
ни одной правки текста, разметки или порядка слов.

---

## Что осталось текстом и требует решения Романа

Три места, где старый несуществующий адрес остался **видимым текстом**, а не ссылкой.
По правилу «анкорный текст не трогай» я их не менял.

1. **`src/pages/brands/perlick-draft-beer-system-repair.astro:231`** — анкорный текст сам является
   URL: `href` теперь ведёт на `/commercial/refrigeration/brands/perlick/`, а читатель видит
   `/brands/commercial-refrigeration/perlick-commercial-repair/`. То есть на странице напечатан
   адрес, который отдаёт 404, если его скопировать в адресную строку, и он спорит с собственной
   ссылкой. **Рекомендую заменить видимый текст на новый адрес** — одна строка.
2. **`src/pages/brands/thermador.astro`** (два места, дошло из прошлых волн, не моя правка) —
   в FAQ-ответе и в теле напечатан `/services/wall-heater-repair-los-angeles/` как текст. `href`
   там уже корректный (`/services/`), но видимый адрес 301-ится и вводит в заблуждение.
3. **Устаревшие комментарии разработчика** — `beverage-air.astro:6`, `true.astro:5`,
   `perlick-draft-beer-system-repair.astro:6`: «Wraps existing combo at
   /brands/commercial-refrigeration/…». Комбо-страниц по этим адресам никогда не было.
   На вывод не влияет, но вводит в заблуждение следующего, кто откроет файл.

**Брендов без целевой страницы в этом заходе не оказалось** — все 7 адресов получили настоящую
цель. Блок оставлен пустым намеренно.

---

## Проверки

### 1. Билд

`1198 page(s) built`, **0 ошибок**. Счётчики совпадают с базовыми: `index.html` 1767, `.html` 1769,
sitemap 1141. `diff` списка из 1767 маршрутов до и после — **пустой**, набор не изменился.

### 2. Греп по dist — и в href, и в JSON-LD

| Адрес | `href="…"` | Любое вхождение |
|---|---|---|
| `/brands/commercial-refrigeration/beverage-air-commercial-repair/` | 0 | 0 |
| `/brands/commercial-refrigeration/delfield-commercial-repair/` | 0 | 0 |
| `/brands/commercial-refrigeration/hoshizaki-commercial-repair/` | 0 | 0 |
| `/brands/commercial-refrigeration/perlick-commercial-repair/` | 0 | **1** |
| `/brands/commercial-refrigeration/traulsen-commercial-repair/` | 0 | 0 |
| `/brands/commercial-refrigeration/true-refrigeration-commercial-repair/` | 0 | 0 |
| `/brands/commercial-dishwashers/hobart/` | 0 | 0 |
| `/services/commercial-repair/` | 0 | 0 |
| `/services/wall-heater-repair-los-angeles/` | 0 | **3** |

Ссылок и полей схемы — ноль везде. Остаточные вхождения — не ссылки:

- perlick, 1 — видимый анкорный текст, пункт 1 блока выше;
- wall-heater, 3 — два на `/brands/thermador/` (пункт 2 блока выше) и одно в теле самой
  HTML-заглушки редиректа `dist/services/wall-heater-repair-los-angeles/index.html`
  («Redirecting from …»), которую эмитит Astro и убрать нельзя.

### 3. Пять страниц с правками ссылок в тексте

`brands/true.astro`, `brands/hobart.astro`, `brands/perlick-draft-beer-system-repair.astro`,
`brands/true-residential-refrigerator-repair.astro`, `commercial/dishwasher-repair.astro` —
предложения читаются как раньше, ничего не съехало и не задвоилось. Примеры из диффа:

```diff
-  Full combo-level detail on each product family lives on the <a href="/brands/commercial-refrigeration/true-refrigeration-commercial-repair/">commercial refrigeration combo page</a>.
+  Full combo-level detail on each product family lives on the <a href="/commercial/refrigeration/brands/true/">commercial refrigeration combo page</a>.

-  <li><a href="/brands/commercial-refrigeration/traulsen-commercial-repair/" class="brand-inline-link"><strong>Traulsen commercial refrigeration</strong></a> — ITW Food Equipment Group sibling brand;
+  <li><a href="/commercial/refrigeration/brands/traulsen/" class="brand-inline-link"><strong>Traulsen commercial refrigeration</strong></a> — ITW Food Equipment Group sibling brand;

-  <a href="/services/commercial-repair/">All Commercial Services</a>
+  <a href="/commercial/">All Commercial Services</a>
```

Формально это подтверждено машинной сверкой выше (37 из 38 файлов идентичны вне значений `href`).

### 4. Живой curl новых целевых адресов

Все восемь — 200 и конечный адрес совпадает с запрошенным, редиректа нет:

`/commercial/refrigeration/brands/beverage-air/` · `/delfield/` · `/hoshizaki/` · `/perlick/` ·
`/traulsen/` · `/true/` · `/brands/hobart-dishwasher-repair/` · `/commercial/`

---

## Git

`git add` по явным путям (38 изменённых `.astro` + лог), без `-A`. Коммит локально, **не запушен**.

## Хвосты на заходы 3-4

1. Брендовый раздел: 49 коротких хабов + 23 длинных адреса.
2. Учесть исправленные цели: `/downtown-la/` и `/downtown/` (23 ссылки) → `/los-angeles/`,
   `/brands/dcs/` и `/brands/dcs-outdoor-grill-repair/` → `/outdoor/brands/dcs/`,
   `/brands/kitchenaid-stove-repair/` → `/brands/kitchenaid-oven-repair/`,
   `/brands/sub-zero-freezer-repair/` → `/brands/sub-zero-refrigerator-repair/`.
3. Решение Романа по трём местам с видимым устаревшим URL (блок выше).
