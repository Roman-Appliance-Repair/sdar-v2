# 2026-07-17 — Brand Pillar Wave T1: La Cornue + True Residential + True disambiguation

Merge `c94c3451` на main (ветка `feat/brand-pillar-wave`, коммит `84bdcb22`, worktree wt1).
10 файлов, +897 строк. 2 новые страницы: `/brands/la-cornue/`, `/brands/true-residential/`.

## Reality check перед стартом

Все 11 пилларов волны были **NOT-STARTED** — проверено тремя способами: нет исходника,
нет коммита на origin/main, на проде **байт-в-байт главная** (287 857 байт, md5 совпадает,
canonical `/`). Ветка `feat/brand-pillar-wave` пустая. Никакого «limbo» — не было написано
ничего.

Сделан T1 (2 из 11). T2/T3 (9 страниц) остаются.

## Главное: ownership-спор закрыт, `docs/factual-accuracy.md §1` НЕВЕРЕН

§1 утверждает: «True Manufacturing | Trulaske family (commercial) | **True Residential
(Middleby) — это другая компания**». Это неправда, и это load-bearing факт целой страницы.

**True Residential — резидентная линия True Manufacturing.** Семья Trulaske, O'Fallon MO,
family-owned с 1945; линия запущена в 2008. Middleby ей никогда не владела.

Доказательства (primary):
- Гарантийные претензии True Residential идут на **«True Residential, 2001 East Terra Lane,
  O'Fallon, MO 63366, TrueResidentialClaims@TrueMfg.com»** — тот же адрес и тот же домен,
  что у True Manufacturing. [true-caliber.com/wp-content/uploads/2020/01/True-Residential-Warranty-05-2024.pdf]
- **10-K Middleby за FY2024** перечисляет 24 резидентных бренда — True среди них **нет**.
  [sec.gov/Archives/edgar/data/769520/000076952025000009/midd-20241228.htm]
- Middleby **владеет U-Line и Marvel** — премиальные undercounter-конкуренты в той же
  категории. Почти наверняка отсюда и пошла путаница в доке.

Наша собственная `/brands/true/` была права всё это время («independent American-made
since 1945»). **Правку дока делать отдельным коммитом** — флагнуто, не пропатчено молча.

## Две ошибки в самом задании, исправлены по источникам

1. **«residential 42/48 columns»** — ложь по терминологии. Колонны True бывают только
   **24/30/36**; **42 и 48 — это side-by-side холодильники**. Любой дилер поймал бы.
2. **Grand Palais 180** — это флагманская **модель 71″ ВНУТРИ серии Château**, не отдельная
   линия. **Flamberge** — настенная газовая **ротисьерка**, не плита.

## Сигнатурные углы (никто в LA-выдаче их не закрывает)

- **У La Cornue НЕТ кодов ошибок вообще.** Мануал CornuFé прямо говорит «no error or fault
  codes are present»; мануал Château G4 организован по симптомам. Ни часов, ни таймера, ни
  Wi-Fi, ни дисплея. Единственный индикатор — красная лампа gas-oven safety device (лампа,
  не код). Мы говорим это прямо вместо выдуманной таблицы — а таблицу неявно обещает каждая
  конкурирующая страница в нише.
- **E1/E2/P2/P3 у True — это COMMERCIAL** (GDM-26, T-49). У резидентных — **software
  version** при включении (66/73/94, это версии, не ошибки) и **LED-вспышки инвертора**.
  Опубликовать E-коды на резидентной странице = совершить ровно ту ошибку, которую страница
  лечит.
- **Château (Франция, ручная сборка) vs CornuFé (Англия, завод AGA Rangemaster, Бирмингем)**
  — раскол, определяющий запчасти и диагностику. Не объясняет никто.
- **La Cornue делает только кухонное.** `la cornue refrigerator repair` — ~20/мес на товар,
  которого не существует. Мы исправляем посылку, а не фармим запрос.

## НЕ заявлено (research вернул NOT VERIFIED)

Срок поставки запчастей в месяцах (конкуренты пишут «6+ months» без источника — мы даём
структурную причину: производства в США нет); «нет отзывных кампаний» (CPSC отдаёт 403
автоматике — отсутствие доказательства ≠ доказательство отсутствия); UL/outdoor-рейтинг
резидентных True; любые «системные дефекты».

## Фабрикации нет

**Ни одной выдуманной записи о ремонте.** Все остальные пиллары несут датированные кейсы с
моделями и районами; истории обслуживания по этим двум брендам у нас нет, и выдумать её =
сфабриковать сервисную запись. Вместо этого — механика отказов. Это осознанное отклонение
от house style, зафиксировано в шапке обоих файлов.

## true.astro — ретайтл

`"True Refrigeration Repair | Southern California | Same Day"` → **`"True Commercial
Refrigeration Repair Los Angeles — Same Day"`** (59 симв.). Это **снятие отклонения**, а не
новый паттерн: старый заголовок не следовал конвенции `{Thing} Repair {Geo} — Same Day`. H1
приведён следом. Заодно закрывает residential/commercial дизамбигуацию.

## Обвязка

- **MegaMenu:** La Cornue → Residential Premium (19 строк); True Residential → **Specialty,
  Wine & Ventilation**. Раскол намеренный: True Residential — рефрижерация/вино без единого
  cooking-прибора, И Premium упёрся в потолок — **19 строк = 1072px из бюджета 1080**
  (замерено в браузере, запас 8px). 20 строк = переполнение на 36px.
- **Hub:** +2 карточки в LUXURY (15→17), +2 pillar-тега (51→53).
- **Combo parent-links: 6/6.** Три true-residential-комбо раньше вели хлебной крошкой на
  **`/brands/true/` — КОММЕРЧЕСКИЙ пиллар**. Это и был дефект дизамбигуации живьём на проде.

## Гейты

| гейт | результат |
|---|---|
| forbidden phrases (voice-and-style §2, канонические 12) | **0** |
| titles ≤60, конвенция | 45 / 59 / 59 — все ок |
| body words (T1 target 2800-3500) | **2859** / **2834** |
| rendered body (bluestar = 3852 для сравнения) | 4203 / 4143 |
| 8-word dupes vs друг друга + 5 legacy пилларов | сведено к общей template-мебели (FAQ/CTA-заголовки, есть на всех пилларах) |
| build | **1181 = 1179 + ровно 2** |
| menu overflow @1080 | 1072px, запас 8px (браузер) |

**Урок про гейты (повтор урока forbidden-phrase аудита):** мой собственный GATE 5 выдал 3
FAIL — и все три оказались артефактами наивного regex: «E1/E2» ловилось на фразе «E1/E2
**belong to True commercial**», «Middleby owns True» — на «**not** owned by Middleby»,
«Grand Palais line» — на процитированной ошибке, которую страница исправляет. Грепать →
читать контекст → только потом судить.

## Найдено попутно (pre-existing, не наше, флагнуто)

1. **`/brands/true-residential-beer-dispenser-repair/`** линкуется с
   `true-residential-refrigerator-repair`, но **не существует** — битая ссылка сегодня.
2. **Каждая brand-combo страница эмитит ДВА BreadcrumbList** — один генерит
   `Breadcrumbs.astro` из URL, второй лежит в `schema`-графе страницы, и **на большинстве
   страниц они противоречат друг другу** (проверено на нетронутых bluestar-range-hood и
   gaggenau-oven — «agree: False»). Site-wide, предшествует этой работе, нужен отдельный
   проход. Мои правки JSON-LD-крошек **откачены**, чтобы страница не расходилась с
   общим компонентом.

## Прод

`/brands/la-cornue/` `0012591ed7` · `/brands/true-residential/` `df41a21b44` ·
`/brands/true/` `e9cbcb1113` — все три **REAL PAGE** (md5 ≠ главная `9042d65caa`),
заголовки верные. IndexNow: **10 URL, HTTP 200**.

## Осталось

T2 (aga, heartland, perlick-residential) и T3 (lacanche, officine-gullo, elmira, big-chill,
fivestar, forno) — 9 страниц. **Блокер меню:** Premium держит 19 строк из 19 возможных;
оставшиеся 9 (в основном плиты) туда не влезут — нужно решение: 4-я residential-колонка
(правка CSS `is-cols-6`→7) либо не тащить zero-demand T3-бренды в нав вообще (hub-секция
«Residential Brand Pillars» и так даёт каждому пиллару brand-level ссылку).
