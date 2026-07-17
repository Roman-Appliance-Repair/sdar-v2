# 2026-07-17 — T1 corrections: broad titles, Composition Brands, и ложь True/Middleby по всему сайту

Merge `62de4bca` на main (ветка `fix/brand-pillar-t1-corrections`, коммит `402cb2cd`).
13 файлов. Правит T1-пиллары из `84bdcb22`.

## Коллизия: кто чем владел

Задание пришло как «старая сессия остановлена, отревьюй её черновики». **Черновиков не
было.** Та сессия — это я, и её работа была уже смержена (`84bdcb22`) и жила на проде.
Проверено: все 4 worktree чисты, оба пиллара на origin/main, прод отдаёт реальные
страницы. То есть это не ревью черновиков, а **правка продакшена**. Ни одного файла у
«другой сессии» не отбирали — отбирать было нечего.

## Что было верно в задании и применено

| # | Инструкция | Статус |
|---|---|---|
| 1 | Titles → broad | **Применено. Я был неправ, задание право.** `seo-policies.md:268` задаёт для пилларов `{Brand} Appliance Repair Los Angeles — Same Day`. Мои («La Cornue **Range** Repair…») от конвенции отклонялись. Теперь 49ch / 56ch. |
| 2 | Middleby → Composition Brands 02.02.2026 | **Применено + primary source в лог.** |
| 5 | 301 `la-cornue-stove-repair` → `la-cornue-range-repair` | **Применено** (со слешем, по доказанной механике). |
| 6 | Fix `factual-accuracy.md §1` + ложь на живой странице | **Применено — но страниц оказалось 9, не одна.** |

## Что в задании НЕ подтвердилось — и не опубликовано

**(3) «Château ~100 часов, один мастер» — NOT VERIFIED. Не опубликовано.**

Источники самой La Cornue говорят обратное:
- Официальная страница Château и 29-страничная брошюра Le Château — **ноль вхождений слова
  «hour»**. Единственное «100» = «For over **100 years**…».
- Брошюра: «only **60 employees**… **companions to each range**… **working as a team**».
- lacornueusa: «numbered by the **craftsmen**» — множественное число.

Единственный источник фразы «a **single craftsman**… more than **one hundred hours**» —
**дилерская страница** signaturebachand.com, без атрибуции к производителю. Похоже на
искажение официального «over 100 **years**».

Страница оставляет то, что подтверждено: made to order в Saint-Ouen-l'Aumône, ручная
сборка, **~60 мастеров**. Опубликовать дилерскую цифру = ровно та выдумка, ради недопуска
которой волна и затевалась.

**(4) «убрать премису про конкурента, продающего посудомойку La Cornue»** — убирать было
нечего: слово «dishwasher» на странице встречается только в отрицании («no dishwashers, no
laundry»). Проверено до действий.

## Ложь True/Middleby: не одна страница, а девять — и три разные выдуманные даты

Наши собственные живые страницы утверждали ровно обратное новому пиллару, на который сами
же и ссылались:

| страница | что утверждала |
|---|---|
| `true-residential-refrigerator-repair` | «In 2015 **Middleby** acquired the residential business… Today True Residential is a **Middleby sub-brand**» + «since **2006**» |
| `commercial/refrigeration/brands/index` | «Middleby-owned (**acquired 2017**)» |
| `commercial/refrigeration/brands/true` | «**No, two different companies**» + «Middleby-owned» ×2 |
| `commercial/refrigeration/true-refrigerator-not-cooling` | то же + «acquired 2017» |
| `commercial/refrigeration/{index, reach-in-cooler-not-cooling, commercial-freezer-not-freezing, walk-in-cooler-not-cooling}` | «True Residential (Middleby)» |
| `marvel-refrigerator-repair` | True Residential внутри Middleby-портфеля |

Даты в дикой природе: **2006, 2015, 2017** — все неверные. Истина: True Residential —
резидентная **линия той же** True Manufacturing (семья Trulaske), запуск **2008**. Middleby
не владела никогда. **Прод: 0 страниц с ложным утверждением.**

**Более глубокий слой:** «two different companies» — тоже ложь. И моя первая механическая
замена породила самопротиворечие: «is **not the same company** as True Residential (**the
same company's** home line)». Переписано прозой, а не патчем строк. **Урок: механическая
подстановка в утверждение о фактах ломает смысл — править прозой.**

**2008 подтверждён** официальным таймлайном heritage: «2008 — True Professional Series
officially launches first generation product line **in the California market**». **2006** в
том же таймлайне — это **коммерческое** расширение; вот откуда наша ошибка. Запуск был
региональный, поэтому «launched nationwide in 2008» тоже было бы неточно.

## Composition Brands — primary source

**Middleby 10-K FY2026:** «sell a **51% stake** in its Residential Kitchen Equipment Group
to an affiliate of **26North Partners LP** … valuing the business at **$885 million** …
completed on **February 2, 2026** … owns a **49% non-controlling interest**».
`sec.gov/Archives/edgar/data/769520/000076952026000011/midd-20260103.htm`

Название **«Composition Brands» в SEC-филингах отсутствует** — первичка на ребренд — релиз
26North (`businesswire.com/news/home/20260202412606/en/`), реестр —
`compositionbrands.com/our-brands/`. Это записано в `factual-accuracy.md §1.1`.

## Бэклог — намеренно НЕ свипнут

**141 файл** упоминает Middleby: Viking ×67, AGA ×60, Lynx ×24, U-Line ×16, Marvel ×15,
La Cornue ×11.

⚠️ **Слепой свип теперь доказуемо опасен.** В коммерческом списке 10-K FY2026 остаются
**«Viking Commercial», «U-Line Commercial», «Marvel Scientific»**, плюс TurboChef, Blodgett,
Middleby Marshall. Поиск-замена по строкам «Viking» / «U-Line» / «Marvel» **сломает те
коммерческие упоминания, которые верны**. Отдельная волна, по каждому вхождению глазами.

Аномалия для той волны: **EVO** числится и в коммерческом списке 10-K, и на
compositionbrands.com — источники противоречат, вывода не делаем.

## Проверка

Гейты: forbidden **0**; titles 49/56/59 — все ≤60 и по конвенции; body **2896 / 2893**
(T1 2800-3500); build **1181**.

Прод по байтам (главная `9042d65caa`): la-cornue `a62ee776c1` REAL · true-residential
`8506951234` REAL · true `e9cbcb1113` REAL. Ложное утверждение — **0** на 5 проверенных
страницах. 301: `/brands/la-cornue-stove-repair/` → **301 → /brands/la-cornue-range-repair/**.
IndexNow: **13 URL, 200**.

**Ловушка прода (повтор):** сразу после деплоя `/brands/la-cornue/` отдавал **старый md5 и
старый title**, хотя wait-loop уже матчил новый H1 — часть edge-нод держала stale. Ждал
сходимости до 2 подряд чистых ответов. Проверять по **md5 + title**, не по одному матчу.
