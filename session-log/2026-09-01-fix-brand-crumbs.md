# 2026-09-01 — Заход 3: крошки в /brands/ + Downtown LA + хвосты захода 2

Ветка: `fix/broken-links-components`. Резервная ветка перед началом: `backup/pre-brand-crumbs-2026-09-01`
(указывает на `b5ff3371`, конец захода 2).

Аудит-основание: [`2026-09-01-broken-links-audit.md`](2026-09-01-broken-links-audit.md).
Предыдущие заходы: [`2026-09-01-fix-components.md`](2026-09-01-fix-components.md),
[`2026-09-01-fix-commercial.md`](2026-09-01-fix-commercial.md).

---

## Правило проверки цели — три пункта

Адрес считается настоящей страницей только если выполнены все три:

- **(а)** `curl -L` отдаёт 200;
- **(б)** `url_effective` совпадает с запрошенным адресом;
- **(в)** соответствующий файл в `dist/` не содержит `Redirecting to` / `http-equiv="refresh"`.

Пункт (в) добавлен по итогам захода 2: сайт эмитит редиректы двумя способами, и `meta refresh`-заглушки
из `astro.config.mjs` проходят (а) и (б), потому что отвечают 200 по своему же адресу.

---

## Шаг 3 (сделан первым) — самопроверка покрытия

На число 39 не опирался. Прошёл по всем 1767 страницам `dist`, вытащил каждый `<nav class="crumbs">`
(захардкоженная крошка — отдельная от компонентной `<nav class="breadcrumbs">`), собрал все адреса
из этих крошек и прогнал каждый по трём пунктам.

- страниц с захардкоженной крошкой: **294**
- различных адресов в этих крошках: **92**
- провалили пункт **(в)** (нет файла в `dist`): **41**
- провалили пункты **(а)/(б)** (404 по живому curl): **те же 41**, ни одним больше

Оба метода сошлись на одном и том же списке — расхождений между локальным билдом и продом нет.

**Найдено 41 адрес на 42 страницах, в отчёте было 39.**

### Причина расхождения

Не пропуск при обходе, а разница в классификации. В отчёте аудита 39 строк помечены
«крошка-родитель несуществующего хаба → УДАЛИТЬ ссылку». Ещё две — `/brands/perlick/` и
`/brands/fagor/` — я тогда пометил «СОЗДАТЬ хаб», потому что у Perlick 5 страниц, а у Fagor 2,
и хаб выглядел оправданным. Это те же самые крошки, просто с другой рекомендацией.

Решение этого захода — «хабы НЕ создаём» — обе рекомендации схлопывает в одну, и обе крошки
попадают в общую обработку. 39 + 2 = **41**.

Адресов 41, а крошек 42, потому что `/brands/fagor/` стоит крошкой на двух страницах
(`fagor-commercial-laundry-repair`, `fagor-dishwasher-repair`).

Проверил и обратную сторону: `/brands/aspire-by-hestan/` и `/brands/dcs/` в списке **не появились** —
они и не крошки, это ссылки в тексте карточек моделей. Заход 4.

---

## Шаг 2 — 42 крошки развязаны

Хабы не создавались. Поведение приведено к тому же, что в исправленном заходом 1 `Breadcrumbs.astro`:

```diff
-  <a href="/brands/accurex/">Accurex</a> <span class="crumbs-sep">›</span>
+  <span class="breadcrumbs-plain">Accurex</span> <span class="crumbs-sep">›</span>
```

Все 42 строки оказались одной формы (проверено шаблонной нормализацией: 42 из 42 совпали с
`<a href="{HUB}">{LABEL}</a> <span class="crumbs-sep">›</span>`), поэтому замена точечная — по
конкретному блоку крошки. Никаких regex, нормализующих пробелы, никакой общей уборки.

Порядок, метки и количество сегментов не менялись нигде: было 4 крошки — осталось 4.

**Замечание по вёрстке.** У этих страниц `.crumbs` вообще не имеет своего CSS — ни правила
`.crumbs`, ни `.crumbs-sep` в их `<style>` нет. Ссылки в такой крошке красные из глобального
`a { color: var(--red) }`, а текущий сегмент (`<span aria-current="page">`) — обычный текст.
Развязанный сегмент теперь выглядит как текущий сегмент, а не как ссылка. Это и правильно:
некликабельный элемент не должен притворяться ссылкой. CSS не добавлял — правила `.crumbs`
на этих страницах нет, заводить его значило бы делать ту самую общую уборку.

### JSON-LD

Два адреса из 41 присутствовали ещё и как `"item"` в написанном руками `BreadcrumbList`:

| Файл | Строка | Было | Стало |
|---|---|---|---|
| `src/pages/brands/beko-dishwasher-repair.astro` | 80 | `{ …, "name": "Beko", "item": "…/brands/beko/" }` | `{ …, "name": "Beko" }` |
| `src/pages/brands/perlick-refrigerator-repair.astro` | 100 | `{ …, "name": "Perlick", "item": "…/brands/perlick/" }` | `{ …, "name": "Perlick" }` |

`position` и `name` сохранены, позиции остались сплошными.

---

## Шаг 1 — Downtown LA (23 ссылки)

`/areas/downtown-los-angeles/` проверен по трём пунктам: 200, но `url_effective` = `/los-angeles/`.
Это 301, а не страница; отдельной страницы Downtown LA на сайте нет.

Цель `/los-angeles/` проверена по трём пунктам: **(а)** 200, **(б)** конечный адрес совпал,
**(в)** `dist/los-angeles/index.html` — настоящая страница, не заглушка.

Заменено **23 `href`** в **23 файлах**: `/downtown-la/` — 17, `/downtown/` — 6. Совпадает с Ahrefs
1-в-1. Ссылок на сам редирект `/areas/downtown-los-angeles/` в исходниках не оказалось ни одной.

Анкорный текст не тронут — «Downtown LA», «Downtown LA service area», «DTLA + Arts District»
остались как были:

```diff
-      <li><a href="/downtown-la/">Downtown LA service area</a> · <a href="/east-los-angeles/">East LA service area</a></li>
+      <li><a href="/los-angeles/">Downtown LA service area</a> · <a href="/east-los-angeles/">East LA service area</a></li>
```

`/east-los-angeles/` в той же строке — по-прежнему 404 (4 ссылки), это заход 4.

---

## Шаг 0 — хвосты захода 2

| Место | Было напечатано | Стало |
|---|---|---|
| `perlick-draft-beer-system-repair.astro:231` (анкорный текст = адрес) | `/brands/commercial-refrigeration/perlick-commercial-repair/` | `/commercial/refrigeration/brands/perlick/` — теперь совпадает с собственным `href` |
| `thermador.astro:79` (текст FAQ-ответа) | `/services/bbq-grill-repair-los-angeles/` и `/services/wall-heater-repair-los-angeles/` | `/services/bbq-grill-repair/` и `/services/` |
| `thermador.astro:268` (два анкорных текста) | те же два адреса | те же две замены — теперь совпадают со своими `href` |

**Оба напечатанных адреса на Thermador были стухшими, не только про обогреватель.**
`/services/bbq-grill-repair-los-angeles/` тоже провалил пункт (в) — это `meta refresh`-заглушка;
её `href` уже вёл на `/services/bbq-grill-repair/`, а напечатанный текст остался старым.
Правил оба, потому что это один и тот же дефект в одном и том же предложении.

Итого 5 напечатанных адресов (1 у Perlick + 4 у Thermador).

**Комментарий разработчика.** Поправлен один — `perlick-draft-beer-system-repair.astro:6`
(«Companion to /brands/commercial-refrigeration/perlick-commercial-repair/» → реальный адрес).
Два оставшихся, в `beverage-air.astro:6` и `true.astro:5`, **не тронуты намеренно**: в заходе 3
эти файлы не правились, а отдельного прохода по репозиторию делать было запрещено.

---

## Сводка правок

| Что | Сколько |
|---|---|
| Крошек развязано (ссылка → текст) | 42 |
| `item` убрано из `BreadcrumbList` | 2 |
| `href` переведено на `/los-angeles/` | 23 |
| Напечатанных адресов исправлено | 5 |
| Комментарий разработчика | 1 |
| **Файлов затронуто** | **59** |

---

## Проверки

### 1. Билд

`1198 page(s) built`, **0 ошибок**. `index.html` 1767, `.html` 1769, sitemap 1141 — всё совпадает
с базовыми значениями. `diff` списка из 1767 маршрутов до и после — **пустой**.

### 2. Греп по dist — в `href` и в `"item"`

41 адрес хабов: суммарно **`href` = 2**, **`item` = 0**.

Эти две оставшиеся ссылки — **не крошки**, а проза на `perlick-refrigerator-repair.astro`:

```
:373   Perlick hub: <a href="/brands/perlick/">Perlick brand hub</a>.
:415   <li><a href="/brands/perlick/">Perlick brand hub →</a></li>
```

По отчёту аудита это позиции блока «ссылка в тексте, не крошка» — заход 4, где решается судьба
десяти таких прозаических «brand hub»-ссылок разом. Половинчато чинить здесь не стал: убрать
ссылку из фразы «Perlick hub: Perlick brand hub.» без правки текста нельзя, а текст в этом заходе
трогать не положено. **Крошек с битым адресом не осталось ни одной.**

| Адрес | `href` | `"item"` | Любое вхождение |
|---|---|---|---|
| `/downtown-la/` | 0 | 0 | 0 |
| `/downtown/` | 0 | 0 | 0 |
| `/areas/downtown-los-angeles/` | 0 | 0 | 1 |
| `/services/bbq-grill-repair-los-angeles/` | 0 | 0 | 1 |
| `/services/wall-heater-repair-los-angeles/` | 0 | 0 | 1 |
| `/brands/commercial-refrigeration/perlick-commercial-repair/` | 0 | 0 | 0 |

Три остаточных вхождения — каждое внутри собственной HTML-заглушки редиректа
(«Redirecting from `…`»), которую эмитит Astro. Ссылками из контента они не являются.

### 3. Все `BreadcrumbList` в dist

Разобрано **2121** схем на 1197 страницах:

- JSON парсится везде;
- `position` сплошные `1..n` везде;
- `name` есть у каждого элемента, `@type` = `ListItem` везде;
- **структурных ошибок: 0**.

Без `item`: 13 крошек `Brands` (заход 1), новые `Beko` и `Perlick` (этот заход) и 26 листовых
элементов в схемах, написанных руками в самих страницах, — они были такими и до правок.

### 4. Машинная проверка анкорного текста

Для каждого из 59 файлов диффа взят `git show HEAD:<файл>`; в обеих ревизиях нормализованы
переводы строк, замаскированы значения `href`, снят удалённый `"item"` и обе формы крошки
(`<a href="…">МЕТКА</a>` и `<span class="breadcrumbs-plain">МЕТКА</span>`) сведены к `CRUMB[МЕТКА]` —
последнее как раз доказывает, что **метка крошки не изменилась**, изменился только тип элемента.

**Расходятся ровно 2 файла**, оба — заявленные правки напечатанного текста из шага 0:

- `src/pages/brands/perlick-draft-beer-system-repair.astro` (адрес в анкорном тексте + комментарий);
- `src/pages/brands/thermador.astro` (два напечатанных адреса в двух местах).

Остальные **57 файлов** вне значений `href` и вне формы крошки совпадают побайтово.

### 5. Пять с хабом и пять без

**Хаб существует — ссылка осталась ссылкой** (5 из 251 такой страницы):

| Страница | Средний сегмент |
|---|---|
| `/brands/hobart-dishwasher-repair/` | `<a href="/brands/hobart/">Hobart</a>` |
| `/brands/vulcan-oven-repair/` | `<a href="/brands/vulcan/">Vulcan</a>` |
| `/brands/frymaster-fryer-repair/` | `<a href="/brands/frymaster/">Frymaster</a>` |
| `/brands/garland-range-repair/` | `<a href="/brands/garland/">Garland</a>` |
| `/brands/champion-dishwasher-repair/` | `<a href="/brands/champion/">Champion</a>` |

**Хаба нет — сегмент текстом, вёрстка цела** (5 из 42):

| Страница | Крошка целиком |
|---|---|
| `/brands/accurex-hood-repair/` | Home › Brands › `<span class="breadcrumbs-plain">Accurex</span>` › Hood Repair |
| `/brands/kolpak-walk-in-repair/` | Home › Brands › `Kolpak` › Walk-In Repair |
| `/brands/beko-dishwasher-repair/` | Home › Brands › `Beko` › Dishwasher Repair |
| `/brands/perlick-outdoor-refrigerator-repair/` | Home › Brands › `Perlick` › Outdoor Refrigerator Repair |
| `/brands/us-cooler-walk-in-repair/` | Home › Brands › `U.S. Cooler` › Walk-In Repair |

Во всех четыре сегмента, три разделителя `›`, `aria-current="page"` на листе — как было.

`class="breadcrumbs-plain"` в разметке site-wide: **55** на 55 страницах = 13 из захода 1
(`/outdoor/brands/*`) + 42 новых. Лишних срабатываний нет.

---

## Git

`git add` явными путями (59 `.astro` + лог), без `-A`. Коммит локально, **не запушен**.
Резервная ветка `backup/pre-brand-crumbs-2026-09-01` оставлена.

## Хвосты на заход 4

1. **Прозаические «brand hub»-ссылки** — 10 адресов, включая оставшиеся 2 на `/brands/perlick/`:
   `big-chill`, `bull`, `capital`, `coyote`, `napoleon`, `weber`, `aspire-by-hestan`, `dcs`,
   `perlick`, `fagor`. Требуют правки текста, а не только `href`.
2. **23 длинных адреса** `/brands/{brand}-{appliance}-repair/` — с учётом исправленных целей:
   `/brands/dcs/` и `/brands/dcs-outdoor-grill-repair/` → `/outdoor/brands/dcs/`,
   `/brands/kitchenaid-stove-repair/` → `/brands/kitchenaid-oven-repair/`,
   `/brands/sub-zero-freezer-repair/` → `/brands/sub-zero-refrigerator-repair/`.
3. `/east-los-angeles/` (4), `/hancock-park/` (1), `/san-pedro/` (1) — страниц нет.
4. Два устаревших комментария в `beverage-air.astro:6` и `true.astro:5`.
5. Контент-решение по настенным обогревателям (из захода 1) — открыто.
