# Аудит битых внутренних ссылок — samedayappliance.repair, 2026-09-01

Только факты. Ничего в коде не менялось, коммитов нет.

Исходные данные: [`2026-09-01-404-input.md`](2026-09-01-404-input.md) — выгрузка Ahrefs от 01-09-2026, 102 URL / 185 внутренних ссылок.

## Методика

1. **Живая проверка (шаг 2).** Каждый из 102 URL проверен `curl -4 -s -o /dev/null -w "%{http_code} %{content_type}" -L`.
   Результат: **102 из 102 → HTTP 404**, ни одного 200, ни одного редиректа (`url_effective` совпадает с запрошенным).
   Подмены главной страницей **нет**: все 102 ответа — один и тот же честный 404-шаблон
   (`<title>Page Not Found — Same Day Appliance Repair</title>`, 126 968 байт, `text/html; charset=utf-8`),
   он же `src/pages/404.astro` (добавлен коммитом `cac10439`). Колонка «200-подмена» в отчёте поэтому пуста для всех строк.
   Контроль работоспособности curl: `/`, `/brands/`, `/services/`, `/los-angeles/`, `/commercial/` → 200.

2. **Универсум существующих маршрутов (шаг 3).** 1141 URL из живого `sitemap-index.xml` → `sitemap-0.xml`
   плюс 1767 маршрутов из локального билда `dist/` (билд от 11.08; sitemap — его подмножество, новых страниц с тех пор не появилось).
   Итоговый список — 1767 маршрутов. **Каждый предложенный URL-замены дополнительно проверен живым curl и отдаёт 200** (58 проверок, все 200).

3. **Поиск источника (шаг 4).** Точный grep по `src/` на `"URL"` / `'URL'` в кавычках (исключая `*.legacy`).
   97 из 102 URL нашлись как прямые `href`. Оставшиеся 5 генерируются шаблонами — найдены сверкой с собранным `dist/`
   (число HTML-файлов, содержащих `href="URL"`, совпало с числом ссылок у Ahrefs 1-в-1: 13, 5, 3, 3, 1).

## Два генератора битых ссылок (то, что чинится одной правкой)

| Генератор | Файл | Битых URL | Ссылок |
|---|---|---|---|
| Автогенерация промежуточного сегмента крошек, без проверки существования | `src/components/Breadcrumbs.astro:133-135` | `/outdoor/brands/` | 13 |
| `toHref()` слепо клеит `/services/{slug}-repair/` из slug карточки города | `src/components/cities/v2/ServicesGrid.astro:135-138` | 4 URL | 12 |

`ServicesGrid` уже содержит механизм `HREF_ALIAS` (строка 133) — он был заведён ровно под этот баг для `bbq → bbq-grill`.
Четыре оставшихся slug-а (`commercial-refrigerator`, `ice-machine`, `outdoor-appliance`, `wall-heater`) в алиасы не занесли.

Остальные 97 URL — ручные ссылки в конкретных страницах, общего компонента у них нет.

## Таблица

Колонка «404 подтверждён»: `да` = живой 404 подтверждён curl 01-09-2026. Значений `нет` и `200-подмена` нет ни у одной строки.

| URL | 404 подтверждён | ссылок | файл:строка источника | действие | примечание |
|---|---|---|---|---|---|
| `/brands/accurex/` | да | 1 | `src/pages/brands/accurex-hood-repair.astro:87` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/adc/` | да | 1 | `src/pages/brands/adc-commercial-dryer-repair.astro:86` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/aht-cooling-systems/` | да | 1 | `src/pages/brands/aht-cooling-systems-refrigeration-repair.astro:204` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/alto-shaam/` | да | 1 | `src/pages/brands/alto-shaam-oven-repair.astro:80` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/amana-stove-repair/` | да | 1 | `src/pages/brands/magic-chef-stove-repair.astro:171`, `src/pages/brands/magic-chef-stove-repair.astro:191` | ЗАМЕНИТЬ на /brands/amana-range-repair/ | страницы stove у Amana нет, range — тот же продукт |
| `/brands/aspire-by-hestan/` | да | 1 | `src/pages/brands/hestan-wall-oven-repair.astro:102` | ЗАМЕНИТЬ на /brands/hestan/ | отдельной страницы Aspire нет вообще |
| `/brands/avantco/` | да | 1 | `src/pages/brands/avantco-ice-machine-repair.astro:144` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/bakers-pride/` | да | 1 | `src/pages/brands/bakers-pride-pizza-oven-repair.astro:81` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/beko/` | да | 1 | `src/pages/brands/beko-dishwasher-repair.astro:137` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/big-chill/` | да | 1 | `src/pages/brands/big-chill-refrigerator-repair.astro:366`, `src/pages/brands/big-chill-refrigerator-repair.astro:407` | ЗАМЕНИТЬ на /brands/big-chill-refrigerator-repair/ | ссылка в тексте («brand hub»), не крошка |
| `/brands/bki/` | да | 1 | `src/pages/brands/bki-rotisserie-repair.astro:81` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/blodgett/` | да | 1 | `src/pages/brands/blodgett-oven-repair.astro:112` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/bull/` | да | 1 | `src/pages/brands/bull-grill-repair.astro:129` | ЗАМЕНИТЬ на /outdoor/brands/bull/ | ссылка в тексте («brand hub»), не крошка |
| `/brands/bunn/` | да | 1 | `src/pages/brands/bunn-slushie-machine-repair.astro:89` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/capital/` | да | 1 | `src/pages/brands/capital-bbq-grill-repair.astro:129` | ЗАМЕНИТЬ на /brands/capital-bbq-grill-repair/ | ссылка в тексте («brand hub»), не крошка |
| `/brands/commercial-dishwashers/hobart/` | да | 1 | `src/pages/price-list/commercial-dishwasher-repair-cost.astro:275` | ЗАМЕНИТЬ на /brands/hobart-dishwasher-repair/ | схемы /brands/commercial-dishwashers/* не существует |
| `/brands/commercial-refrigeration/beverage-air-commercial-repair/` | да | 10 | `src/pages/brands/aht-cooling-systems-refrigeration-repair.astro:451`, `src/pages/brands/beverage-air.astro:249`, `src/pages/brands/beverage-air.astro:338` +7 ещё | ЗАМЕНИТЬ на /commercial/refrigeration/brands/beverage-air/ |  |
| `/brands/commercial-refrigeration/delfield-commercial-repair/` | да | 2 | `src/pages/brands/champion-dishwasher-repair.astro:362`, `src/pages/brands/manitowoc-ice-machine-repair.astro:628` | ЗАМЕНИТЬ на /commercial/refrigeration/brands/delfield/ |  |
| `/brands/commercial-refrigeration/hoshizaki-commercial-repair/` | да | 2 | `src/pages/brands/hoshizaki-ice-machine-repair.astro:554`, `src/pages/brands/jackson-dishwasher-repair.astro:370` | ЗАМЕНИТЬ на /commercial/refrigeration/brands/hoshizaki/ |  |
| `/brands/commercial-refrigeration/perlick-commercial-repair/` | да | 3 | `src/pages/brands/kold-draft-ice-machine-repair.astro:376`, `src/pages/brands/perlick-draft-beer-system-repair.astro:231`, `src/pages/brands/perlick-draft-beer-system-repair.astro:473` +1 ещё | ЗАМЕНИТЬ на /commercial/refrigeration/brands/perlick/ |  |
| `/brands/commercial-refrigeration/traulsen-commercial-repair/` | да | 6 | `src/pages/brands/hobart-dishwasher-repair.astro:264`, `src/pages/brands/hobart-dishwasher-repair.astro:347`, `src/pages/brands/hobart.astro:193` +6 ещё | ЗАМЕНИТЬ на /commercial/refrigeration/brands/traulsen/ |  |
| `/brands/commercial-refrigeration/true-refrigeration-commercial-repair/` | да | 1 | `src/pages/brands/true-residential-refrigerator-repair.astro:17`, `src/pages/brands/true.astro:251`, `src/pages/brands/true.astro:356` +1 ещё | ЗАМЕНИТЬ на /commercial/refrigeration/brands/true/ |  |
| `/brands/coyote/` | да | 1 | `src/pages/brands/coyote-grill-repair.astro:129` | ЗАМЕНИТЬ на /outdoor/brands/coyote/ | ссылка в тексте («brand hub»), не крошка |
| `/brands/dacor-range-repair/` | да | 3 | `src/pages/brands/dacor-microwave-repair.astro:131`, `src/pages/brands/dacor-range-hood-repair.astro:133`, `src/pages/brands/samsung-range-repair.astro:29` +1 ещё | ЗАМЕНИТЬ на /brands/dacor/ | range/stove-страницы у Dacor нет, хаб существует |
| `/brands/dcs-outdoor-grill-repair/` | да | 1 | `src/pages/brands/fisher-paykel-oven-repair.astro:17` | ЗАМЕНИТЬ на /brands/dcs-grill-repair/ |  |
| `/brands/dcs/` | да | 1 | `src/pages/brands/fisher-paykel-wall-oven-repair.astro:106` | ЗАМЕНИТЬ на /brands/dcs-grill-repair/ | хаба /brands/dcs/ не существует |
| `/brands/dexter/` | да | 1 | `src/pages/brands/dexter-commercial-laundry-repair.astro:88` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/electrolux-range-repair/` | да | 3 | `src/pages/brands/electrolux-dryer-repair.astro:133`, `src/pages/brands/electrolux-washer-repair.astro:133`, `src/pages/brands/frigidaire-microwave-repair.astro:21` +1 ещё | ЗАМЕНИТЬ на /brands/electrolux/ | range-страницы нет, есть oven/wall-oven и хаб |
| `/brands/fagor/` | да | 2 | `src/pages/brands/fagor-commercial-laundry-repair.astro:88`, `src/pages/brands/fagor-dishwasher-repair.astro:142` | СОЗДАТЬ страницу /brands/fagor/ (хаб) | 2 страницы Fagor; альтернатива — УДАЛИТЬ крамб |
| `/brands/fisher-paykel-range-repair/` | да | 1 | `src/pages/brands/fisher-paykel-oven-repair.astro:41` | ЗАМЕНИТЬ на /brands/fisher-paykel-stove-repair/ |  |
| `/brands/follett/` | да | 1 | `src/pages/brands/follett-ice-machine-repair.astro:144` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/forno-bravo/` | да | 1 | `src/pages/brands/forno-bravo-pizza-oven-repair.astro:81` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/gaylord/` | да | 1 | `src/pages/brands/gaylord-hood-repair.astro:87` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/ge-cafe-microwave-repair/` | да | 1 | `src/pages/brands/ge-microwave-repair.astro:131` | ЗАМЕНИТЬ на /brands/ge-cafe/ | microwave-страницы в тире Cafe нет |
| `/brands/ge-cafe-oven-repair/` | да | 1 | `src/pages/brands/ge-oven-repair.astro:17`, `src/pages/brands/ge-oven-repair.astro:143`, `src/pages/brands/ge-oven-repair.astro:212` +1 ещё | ЗАМЕНИТЬ на /brands/ge-cafe-wall-oven-repair/ |  |
| `/brands/ge-monogram-microwave-repair/` | да | 1 | `src/pages/brands/ge-microwave-repair.astro:131` | ЗАМЕНИТЬ на /brands/ge-monogram/ | microwave-страницы в тире Monogram нет |
| `/brands/ge-monogram-oven-repair/` | да | 1 | `src/pages/brands/ge-oven-repair.astro:17`, `src/pages/brands/ge-oven-repair.astro:144`, `src/pages/brands/ge-oven-repair.astro:212` +1 ещё | ЗАМЕНИТЬ на /brands/ge-monogram-wall-oven-repair/ |  |
| `/brands/ge-profile-microwave-repair/` | да | 1 | `src/pages/brands/ge-microwave-repair.astro:131` | ЗАМЕНИТЬ на /brands/ge-profile/ | microwave-страницы в тире Profile нет |
| `/brands/ge-profile-oven-repair/` | да | 1 | `src/pages/brands/ge-oven-repair.astro:17`, `src/pages/brands/ge-oven-repair.astro:142`, `src/pages/brands/ge-oven-repair.astro:212` +1 ещё | ЗАМЕНИТЬ на /brands/ge-profile-wall-oven-repair/ |  |
| `/brands/greenheck/` | да | 1 | `src/pages/brands/greenheck-hood-repair.astro:155` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/halton/` | да | 1 | `src/pages/brands/halton-hood-repair.astro:109` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/heatcraft/` | да | 1 | `src/pages/brands/heatcraft-condensing-unit-repair.astro:149` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/henny-penny/` | да | 1 | `src/pages/brands/henny-penny-fryer-repair.astro:143` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/huebsch/` | да | 1 | `src/pages/brands/huebsch-commercial-laundry-repair.astro:87` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/kitchenaid-range-repair/` | да | 2 | `src/pages/brands/kitchenaid-oven-repair.astro:33`, `src/pages/brands/kitchenaid-oven-repair.astro:165`, `src/pages/brands/kitchenaid-oven-repair.astro:225` +1 ещё | ЗАМЕНИТЬ на /brands/kitchenaid/ | range-страницы нет; одна из ссылок стоит на самой kitchenaid-oven-repair |
| `/brands/kitchenaid-stove-repair/` | да | 1 | `src/pages/brands/jennair-stove-repair.astro:192`, `src/pages/brands/jennair-stove-repair.astro:211` | ЗАМЕНИТЬ на /kitchenaid-stove-repair-los-angeles/ | живая flat-страница, в /brands/ такой нет |
| `/brands/kitchenaid-washer-repair/` | да | 2 | `src/pages/services/washer-repair/error-codes.astro:231`, `src/pages/services/washer-repair/whirlpool-error-codes.astro:218` | УДАЛИТЬ ссылку | у KitchenAid нет страницы стиральной машины; альтернатива — /brands/kitchenaid/ |
| `/brands/kold-draft/` | да | 1 | `src/pages/brands/kold-draft-ice-machine-repair.astro:140` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/kolpak/` | да | 1 | `src/pages/brands/kolpak-walk-in-repair.astro:150` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/kratos/` | да | 1 | `src/pages/brands/kratos-oven-repair.astro:80` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/lincoln-foodservice-repair/` | да | 1 | `src/pages/commercial/refrigeration/brands/delfield.astro:409` | ЗАМЕНИТЬ на /brands/lincoln-pizza-oven-repair/ |  |
| `/brands/lincoln/` | да | 1 | `src/pages/brands/lincoln-pizza-oven-repair.astro:81` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/mainstreet-equipment/` | да | 1 | `src/pages/brands/mainstreet-equipment-oven-repair.astro:137` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/master-bilt/` | да | 1 | `src/pages/brands/master-bilt-walk-in-repair.astro:150` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/meiko/` | да | 1 | `src/pages/brands/meiko-dishwasher-repair.astro:138` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/middleby-marshall/` | да | 1 | `src/pages/brands/middleby-marshall-pizza-oven-repair.astro:84` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/milnor/` | да | 1 | `src/pages/brands/milnor-commercial-laundry-repair.astro:87` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/montague/` | да | 1 | `src/pages/brands/montague-oven-repair.astro:80` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/napoleon/` | да | 1 | `src/pages/brands/napoleon-grill-repair.astro:132` | ЗАМЕНИТЬ на /outdoor/brands/napoleon/ | ссылка в тексте («brand hub»), не крошка |
| `/brands/nor-lake/` | да | 1 | `src/pages/brands/nor-lake-walk-in-repair.astro:150` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/perlick/` | да | 2 | `src/pages/brands/perlick-outdoor-refrigerator-repair.astro:175`, `src/pages/brands/perlick-refrigerator-repair.astro:373`, `src/pages/brands/perlick-refrigerator-repair.astro:415` | СОЗДАТЬ страницу /brands/perlick/ (хаб) | у Perlick 5 страниц; альтернатива — ЗАМЕНИТЬ на /brands/perlick-residential/ |
| `/brands/signature-kitchen-suite-ice-maker-repair/` | да | 1 | `src/pages/brands/lg-ice-maker-repair.astro:149` | ЗАМЕНИТЬ на /brands/signature-kitchen-suite/ | ice-maker-страницы SKS нет |
| `/brands/signature-kitchen-suite-oven-repair/` | да | 1 | `src/pages/brands/lg-oven-repair.astro:41`, `src/pages/brands/lg-oven-repair.astro:209`, `src/pages/brands/lg-oven-repair.astro:232` | ЗАМЕНИТЬ на /brands/signature-kitchen-suite-wall-oven-repair/ |  |
| `/brands/signature-kitchen-suite-sous-vide-oven-repair/` | да | 1 | `src/pages/brands/signature-kitchen-suite-wall-oven-repair.astro:101` | ЗАМЕНИТЬ на /brands/signature-kitchen-suite/ | текст обещает dedicated page, которой нет |
| `/brands/smeg-repair/` | да | 1 | `src/pages/brands/smeg-stove-repair.astro:200` | ЗАМЕНИТЬ на /brands/smeg/ |  |
| `/brands/southbend/` | да | 1 | `src/pages/brands/southbend-oven-repair.astro:79` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/streivor/` | да | 1 | `src/pages/brands/streivor-hood-repair.astro:87` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/sub-zero-freezer-repair/` | да | 1 | `src/pages/brands/sub-zero-built-in-refrigerator-repair.astro:45`, `src/pages/brands/sub-zero-built-in-refrigerator-repair.astro:145`, `src/pages/brands/sub-zero-built-in-refrigerator-repair.astro:180` +1 ещё | ЗАМЕНИТЬ на /sub-zero-freezer-repair-los-angeles/ | живая flat-страница |
| `/brands/true-refrigerator-repair/` | да | 1 | `src/pages/brands/follett-ice-machine-repair.astro:425` | ЗАМЕНИТЬ на /brands/true/ |  |
| `/brands/true-residential-beer-dispenser-repair/` | да | 1 | `src/pages/brands/true-residential-refrigerator-repair.astro:306`, `src/pages/brands/true-residential-refrigerator-repair.astro:415` | ЗАМЕНИТЬ на /brands/true-residential/ | страницы beer dispenser нет |
| `/brands/turbochef/` | да | 1 | `src/pages/brands/turbochef-rapid-cook-oven-repair.astro:117` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/unimac/` | да | 1 | `src/pages/brands/unimac-commercial-laundry-repair.astro:86` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/us-cooler/` | да | 1 | `src/pages/brands/us-cooler-walk-in-repair.astro:150` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/vent-master/` | да | 1 | `src/pages/brands/vent-master-hood-repair.astro:154` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/wascomat/` | да | 1 | `src/pages/brands/wascomat-commercial-laundry-repair.astro:87` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/weber/` | да | 1 | `src/pages/brands/weber-grill-repair.astro:132` | ЗАМЕНИТЬ на /brands/weber-grill-repair/ | ссылка в тексте («brand hub»), не крошка |
| `/brands/winterhalter/` | да | 1 | `src/pages/brands/winterhalter-dishwasher-repair.astro:142` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/brands/wolf-repair/` | да | 1 | `src/pages/brands/sub-zero-built-in-refrigerator-repair.astro:37`, `src/pages/brands/sub-zero-built-in-refrigerator-repair.astro:145`, `src/pages/brands/sub-zero-built-in-refrigerator-repair.astro:202` | ЗАМЕНИТЬ на /brands/wolf/ |  |
| `/brands/wood-stone/` | да | 1 | `src/pages/brands/wood-stone-pizza-oven-repair.astro:81` | УДАЛИТЬ ссылку | крошка-родитель несуществующего хаба (альтернатива — СОЗДАТЬ хаб) |
| `/credentials/oem-parts-appliance-repair/` | да | 1 | `src/pages/credentials/oem-parts.astro:423` | УДАЛИТЬ ссылку | карточка стоит на самой /credentials/oem-parts/; замена дала бы self-link |
| `/credentials/same-day-appliance-repair-service/` | да | 1 | `src/pages/credentials/same-day-service.astro:378` | УДАЛИТЬ ссылку | карточка стоит на самой /credentials/same-day-service/; замена дала бы self-link |
| `/downtown-la/` | да | 17 | `src/pages/brands/alto-shaam-oven-repair.astro:132`, `src/pages/brands/american-range-repair.astro:126`, `src/pages/brands/forno-bravo-pizza-oven-repair.astro:151` +7 ещё | ЗАМЕНИТЬ на /areas/downtown-los-angeles/ |  |
| `/downtown/` | да | 6 | `src/pages/brands/beko-dishwasher-repair.astro:353`, `src/pages/brands/fisher-paykel-dishwasher-repair.astro:172`, `src/pages/brands/haier-refrigerator-repair.astro:406` +3 ещё | ЗАМЕНИТЬ на /areas/downtown-los-angeles/ |  |
| `/east-los-angeles/` | да | 4 | `src/pages/brands/kratos-oven-repair.astro:130`, `src/pages/brands/maytag-commercial-laundry-repair.astro:152`, `src/pages/brands/middleby-marshall-pizza-oven-repair.astro:154` +1 ещё | ЗАМЕНИТЬ на /los-angeles/ | страницы East LA нет ни в корне, ни в /areas/; альтернатива — СОЗДАТЬ /areas/east-los-angeles/ |
| `/hancock-park/` | да | 1 | `src/pages/brands/bakers-pride-pizza-oven-repair.astro:140` | УДАЛИТЬ ссылку | страницы нет; ближайшая по смыслу — /areas/hollywood/ |
| `/outdoor/brands/` | да | 13 | `src/components/Breadcrumbs.astro:133-135` (автогенерация промежуточного сегмента) → 13 страниц `src/pages/outdoor/brands/*.astro` | СОЗДАТЬ страницу /outdoor/brands/ (индекс) | автогенерация крошек; альтернатива — спец-кейс в Breadcrumbs.astro |
| `/price-list/commercial-washer-repair-cost/` | да | 1 | `src/pages/brands/speed-queen-commercial-laundry-repair.astro:191`, `src/pages/brands/speed-queen-commercial-laundry-repair.astro:201` | ЗАМЕНИТЬ на /price-list/commercial-laundry-repair-cost/ |  |
| `/san-pedro/` | да | 1 | `src/pages/brands/adc-commercial-dryer-repair.astro:162` | УДАЛИТЬ ссылку | страницы нет; в той же строке уже есть /long-beach/ |
| `/services/commercial-refrigerator-repair/` | да | 5 | `src/components/cities/v2/ServicesGrid.astro:135-138` + slug `commercial-refrigerator`: `anaheim.astro:114`, `hollywood.astro:98`, `koreatown.astro:88`, `los-angeles.astro:159`, `marina-del-rey.astro:102` | ЗАМЕНИТЬ на /commercial/refrigerator-repair/ | чинится алиасом в ServicesGrid, а не правкой 5 городов |
| `/services/commercial-repair/` | да | 14 | `src/pages/commercial/dishwasher-repair.astro:625`, `src/pages/commercial/dryer-repair.astro:581`, `src/pages/commercial/exhaust-hood-repair.astro:764` +7 ещё | ЗАМЕНИТЬ на /commercial/ |  |
| `/services/dryer-vent-cleaning/` | да | 1 | `src/pages/brands/speed-queen.astro:387` | ЗАМЕНИТЬ на /services/dryer-vent-repair/ |  |
| `/services/ice-machine-repair/` | да | 3 | `src/components/cities/v2/ServicesGrid.astro:135-138` + slug `ice-machine`: `huntington-beach.astro:158`, `laguna-beach.astro:90`, `newport-beach.astro:72` | ЗАМЕНИТЬ на /services/ice-maker-repair/ | чинится алиасом в ServicesGrid |
| `/services/ice-maker-repair-los-angeles/` | да | 1 | `src/pages/price-list/ice-maker-repair-cost.astro:309` | ЗАМЕНИТЬ на /services/ice-maker-repair/ |  |
| `/services/outdoor-appliance-repair/` | да | 3 | `src/components/cities/v2/ServicesGrid.astro:135-138` + slug `outdoor-appliance`: `huntington-beach.astro:153`, `laguna-beach.astro:86`, `newport-beach.astro:68` | ЗАМЕНИТЬ на /outdoor/ | чинится алиасом в ServicesGrid |
| `/services/refrigerator-repair/brands/lg/` | да | 1 | `src/pages/services/refrigerator-repair/not-cooling.astro:374` | ЗАМЕНИТЬ на /brands/lg-refrigerator-repair/ | схемы /services/*/brands/* не существует |
| `/services/refrigerator-repair/door-seal-repair/` | да | 1 | `src/pages/services/refrigerator-repair/not-cooling.astro:374` | УДАЛИТЬ ссылку | аналога нет; альтернатива — СОЗДАТЬ /services/refrigerator-repair/door-seal-issues/ |
| `/services/refrigerator-repair/ice-maker-repair/` | да | 1 | `src/pages/services/refrigerator-repair/not-cooling.astro:374` | ЗАМЕНИТЬ на /services/refrigerator-repair/ice-maker-issues/ |  |
| `/services/stackable-washer-dryer-repair-los-angeles/` | да | 1 | `src/pages/price-list/stackable-washer-dryer-repair-cost.astro:309` | ЗАМЕНИТЬ на /services/stackable-washer-dryer-repair/ |  |
| `/services/wall-heater-repair/` | да | 1 | `src/components/cities/v2/ServicesGrid.astro:135-138` + slug `wall-heater`: `los-angeles.astro:162` | ЗАМЕНИТЬ на /services/wall-heater-repair-los-angeles/ | чинится алиасом в ServicesGrid |
| `/services/wall-oven-repair-los-angeles/` | да | 1 | `src/pages/price-list/wall-oven-repair-cost.astro:310` | ЗАМЕНИТЬ на /services/wall-oven-repair/ |  |
| `/services/washer-repair-los-angeles/` | да | 1 | `src/pages/brands/miele-washer-repair.astro:370` | ЗАМЕНИТЬ на /services/washer-repair/ |  |
| `/services/wine-fridge-repair/` | да | 1 | `src/pages/credentials/epa-certified.astro:503` | ЗАМЕНИТЬ на /services/wine-cooler-repair/ |  |

## Сводка по действиям

| Действие | URL | ссылок |
|---|---|---|
| ЗАМЕНИТЬ на существующий URL | 54 | 122 |
| УДАЛИТЬ ссылку | 45 | 46 |
| СОЗДАТЬ страницу | 3 | 17 |
| **Итого** | **102** | **185** |

СОЗДАТЬ — это `/outdoor/brands/` (13 ссылок, индекс раздела), `/brands/perlick/` (2) и `/brands/fagor/` (2).

---

# Раздел /brands/ и расхождение схем адресов

## Сколько битого в /brands/

**79 из 102 битых URL (77%) и 105 из 185 ссылок (57%) — в разделе `/brands/`.** Разбивка:

| Подгруппа | Битых URL | Ссылок | Что это |
|---|---|---|---|
| Короткая схема `/brands/{brand}/` | 49 | 51 | хаб бренда, которого не существует |
| Длинная схема `/brands/{brand}-{appliance}-repair/` | 23 | 29 | страницы конкретной пары «бренд + техника», которой нет |
| Вложенная схема `/brands/{раздел}/{brand}/` | 7 | 25 | схемы вообще нет в проекте |
| **Итого /brands/** | **79** | **105** | |

Вне `/brands/`: 23 URL / 80 ссылок (города, `/services/`, `/outdoor/`, `/credentials/`, `/price-list/`).

## В чём расходятся схемы

В проекте параллельно живут **три** схемы адресов бренда, и обе основные — легитимные, обе реально существуют в `src/pages/brands/`:

| Схема | Пример живого URL | Сколько таких страниц | Что означает |
|---|---|---|---|
| Короткая (хаб) | `/brands/whirlpool/`, `/brands/hobart/`, `/brands/true/` | **81** | хаб бренда: все виды техники этого бренда одной страницей |
| Длинная (лист) | `/brands/kolpak-walk-in-repair/`, `/brands/ge-cafe-wall-oven-repair/` | **362** | одна пара «бренд + тип техники» |
| Вложенная (реликт) | `/brands/viking/viking-oven-repair/`, `/brands/sub-zero/sub-zero-refrigerator-repair/` | **21** | старая вложенность, оставлена только для 15 крупных брендов |

Всего 465 маршрутов в `/brands/`.

**Расхождение ровно одно: короткий хаб есть только у 81 бренда из 443 маршрутов первого уровня в `/brands/`, а хлебные крошки на длинных страницах ссылаются на него безусловно.**

Живая страница `/brands/kolpak-walk-in-repair/` рендерит крошку
`Home › Brands › Kolpak › Kolpak Walk-In Repair`, где `Kolpak` = `/brands/kolpak/` — а этого хаба нет.
То же самое у 38 других брендов. Это и есть основная масса битого в разделе: **39 из 49** коротких 404 —
чистая крошка-родитель: ссылка ведёт из единственной страницы бренда в несуществующий хаб над ней.
Ещё 8 — ссылки в тексте вида «Bull brand hub», «Big Chill brand hub», «см. DCS page»
(`bull-grill-repair.astro:129`, `big-chill-refrigerator-repair.astro:366,407`, `fisher-paykel-wall-oven-repair.astro:106` и др.).
Последние 2 — `/brands/perlick/` (5 страниц под брендом) и `/brands/fagor/` (2 страницы): здесь хаб стоит завести, а не убирать ссылку.

Важно: **эта крошка захардкожена в каждой странице руками, а не собирается компонентом.**
Общий `src/components/Breadcrumbs.astro` строит трейл из сегментов URL (`Home › Brands › {leaf}`) и промежуточного бренда не выдумывает.
Битую крошку `<a href="/brands/{brand}/">{Brand}</a> <span class="crumbs-sep">›</span>` разработчик (или генератор страниц) вписал в тело
конкретных `.astro` — по одной строке на страницу. Отсюда и разброс номеров строк: 79–204.

### Какая схема в каких шаблонах

| Место | Какую схему использует | Ломается ли |
|---|---|---|
| Ручная крошка в теле страницы бренда (`<span class="crumbs-sep">`), 39 файлов `src/pages/brands/*.astro` | короткая `/brands/{brand}/` | **да**, если хаба нет |
| `src/components/Breadcrumbs.astro:127-142` (сайтовый компонент) | секция + текущий URL, промежуточных брендов не строит | нет (кроме `/outdoor/brands/`, см. выше) |
| Блоки «Related:» / «brand hub» в конце страниц брендов | смесь короткой и длинной | **да** — 9 коротких + 23 длинных |
| `src/components/MegaMenu.astro:277-286` | отдельная схема `/outdoor/brands/{slug}/` для уличных брендов | нет, все 10 живые |
| `src/data/commercial-brand-slugs.ts` | только длинная (`avantco-ice-machine-repair` и т.д.) | нет |
| Коммерческие бренды в `/commercial/{тип}/brands/{brand}/` | своя схема, 6 битых ссылок из `/brands/commercial-refrigeration/*` ведут мимо неё | **да** — писали адрес по памяти |

Вложенная схема `/brands/commercial-refrigeration/{brand}-commercial-repair/` (7 URL, 25 ссылок — самая
«дорогая» подгруппа по числу ссылок) **в проекте не существует вообще**: ни одного файла, ни одного маршрута.
Реальные страницы лежат по `/commercial/refrigeration/brands/{brand}/`. Это чистая выдумка адреса в тексте
25 раз подряд (Beverage-Air 10, Traulsen 6, Perlick 3, Delfield 2, Hoshizaki 2, True 1, Hobart 1).
