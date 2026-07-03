# Outdoor brand-страницы Bull + Blaze (2026-07-02)

**Задача:** закрыть подтверждённый GSC-gap кластера outdoor — по запросам `bull outdoor refrigerator repair`
(34 показа / поз. 30, 15–28 июн) и `blaze refrigerator repair` (14 / поз. 43) шли показы **без своей
посадочной**, их ловили чужие URL на 3–4 странице выдачи. Плюс сигнал из аудита: брендовые страницы
twin-eagles (7→111 показов) и kalamazoo (11→45) только что пробились — брендовый слой работает.

**Ветка работы:** файлы созданы на `fix/refrigeration-hub` (коммиты `fe3143aa` страницы + `075cf97c` wiring),
затем **перенесены на `main` файловым `git checkout`** (НЕ merge — ветки разошлись, полный merge задвоил бы
combo-boost). Итоговый коммит на main: **`78b91487`**.

## Что сделано
Две новые брендовые страницы по скелету `twin-eagles.astro` (10 секций, 6 schema-сущностей, тот же `<style>`,
$89 outdoor-диагностика, кредиты через `mergeCredentials`, em-dash в теле = 0):
- `src/pages/outdoor/brands/bull.astro` (~4130 слов)
- `src/pages/outdoor/brands/blaze.astro` (~4045 слов)

Дуальный охват (гриль + outdoor-холодильник), холодильник выдвинут вперёд под GSC-спрос.

## Фактура — выверена по доменам производителей (0 выдуманных SKU)
Прецедент Hestan (14 мая, аудит поймал несуществующие серии) учтён — всё сверено вебом:
- **Bull** (Lodi CA, с 1993; завод в Rialto = San Bernardino County → USP «US parts pipeline»):
  грили Angus/Brahma/Diablo/Steer/Outlaw/Lonestar; клапан+пьезорозжиг в сборе `16525` (Brahma/Angus 2007+),
  12V трансформатор розжига `16534`, ИК-searing burner `20505`; холодильник Series II **`13700`** (4.9 cu ft,
  304 SS), legacy `13001`, mini `1101` — герметичный контур без сервисного порта (честный replace-vs-repair).
- **Blaze**: грили Prelude LBM (`BLZ-3/4LBM`), Premium LTE/LTE+, LTE Pro, Professional LUX, Marine; горелки
  14K BTU, розжиг Push-and-Turn flamethrower + crossover; **пожизненная гарантия** на горелки/решётки/корпус/
  клапаны → многие ремонты = только работа, деталь по гарантии бесплатно (честный USP); холодильники
  `BLZ-SSRF` (`-5.5`, `-126`, `-50DH` = 5.2 cu ft double-drawer, `-40DH`, `-15`).
- Правка после сверки: `BLZ-SSRF-50DH` был ошибочно описан как «50-quart», исправлен на «5.2 cu ft double-drawer».

## Перелинковка (де-орфан ≥3 закрыт — по 3 inlink каждой)
- `/outdoor/grill-repair/` — 2 карточки в грид «Brand Pages»
- `/services/outdoor-refrigerator-repair/` — 2 ссылки в «Outdoor refrigerator brand pages», **якорь = точный
  GSC-запрос** «Bull/Blaze outdoor refrigerator repair» (заодно даёт вес просевшей fridge-странице 14→24)
- `/outdoor/kitchen-repair/` — 2 ссылки в brand-list

## Комплаенс (dist)
Titles 50/51 симв. (≤60) · forbidden-фразы 0 (первый grep дал ложняк на `#1` из `#1346…` cert и `#1a1a1a` hex) ·
`expert` 0 (было «Coastal corrosion expertise» → «Coastal-salt corrosion patterns») · aggregateRating/BBB A+/
6230 Wilshire/«BHGS Licensed» = 0 · кириллица 0 · $89 присутствует, $120 = только global chrome (как у twin-eagles).

## Деплой + индексация
Build 1096 (=1094 + 2), 0 ошибок. Push `origin/main` `78b91487`. Cloudflare собрал (~4–5 мин).
Live по title подтверждён (не homepage-fallback). **IndexNow: оба URL → 200** (ключ `32c2d9…e33a`, key-файл 200).

Prod:
- https://samedayappliance.repair/outdoor/brands/bull/ — live
- https://samedayappliance.repair/outdoor/brands/blaze/ — live

## Откат
Обычные новые страницы + 6 строк ссылок в 3 хабах. Откат: `git revert 78b91487` (или удалить 2 файла +
снять по 2 строки в grill-repair/outdoor-refrigerator-repair/kitchen-repair). Контент других страниц не тронут.

## Следующие шаги (по стратегии кластера)
- Через 1–2 недели свериться по GSC: вошли ли новые URL в индекс, как двинулась `/services/outdoor-refrigerator-repair/`.
- Вторая волна брендов из таргет-листа (без прямого спроса пока): Napoleon, Saber, Summerset, Coyote → затем RCS,
  Delta Heat, American Outdoor, Calcana (patio-heater хаб).
