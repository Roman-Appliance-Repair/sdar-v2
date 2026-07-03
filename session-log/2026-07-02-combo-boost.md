# Combo-boost — усиление 56 combo-страниц «город+услуга» (2026-07-02)

**Задача:** уникализировать 56 combo-страниц из СПИСКА A (живой спрос по Ahrefs, объём ≥50/мес,
конкуренция 0–14) так, чтобы они перестали дублировать друг друга и городской пиллар и вышли в топ.
Данные и обоснование — `wiki/briefings/2026-07-02-residential-cluster-analytics.md` (раздел
«Город+услуга: спрос из Ahrefs»).

**Ветка:** `work/combo-boost-2026-07-02` · **Backup:** `backup/combo-boost-2026-07-02`

## ИНСТРУКЦИЯ ДЛЯ БУДУЩЕГО CLAUDE CODE / ОТКАТ
Это усиление combo-страниц по данным Ahrefs. **Если логика окажется неверной — откат через**
`git revert` коммитов этой ветки, **или** сброс на backup-ветку `backup/combo-boost-2026-07-02`
(её HEAD = состояние до правок). Механика: уникальный текст живёт в `src/data/combo-overrides.ts`
(ключ `city/service`); `src/pages/[city]/[service].astro` при наличии override рендерит его вместо
сгенерированного, иначе — как раньше (полностью обратимо: удаление записи из overrides возвращает
страницу к общему шаблону). Общий каркас (цены, гарантия, FAQ, бренд-пул, районы) не менялся.
Каждая строка ниже = одна страница со статусом и хешем коммита пачки.

## Метод усиления (на каждой странице)
- Переписан **lede + intro + honest-opinion** под связку «конкретная услуга × конкретный город»
  (что именно с этой техникой в этом городе: районы, реальные модели, честно чинить-или-менять),
  голосом из `docs/voice-and-style.md`. Общий каркас не тронут. Title/H1 таргетят «{услуга} {город}»
  (пиллар таргетит «appliance repair {город}» — не дублируются).

## Порядок: пачками по городам, приоритет по спросу
LA → Pasadena → Temecula → Irvine → Burbank → Glendale → остальные.
После каждой пачки: build (0 ошибок, 1094) → explicit git add → коммит → апдейт этого лога → отчёт → ждать «дальше».
Не пушить/мержить до отдельного слова.

## 56 URL (статус)
### Los-Angeles (пачка 1) — ✅ DONE (commit c5bf2163)
- [x] /los-angeles/refrigerator-repair/  (vol 400)  status: done  commit: c5bf2163
- [x] /los-angeles/dryer-repair/  (vol 200)  status: done  commit: c5bf2163
- [x] /los-angeles/oven-repair/  (vol 200)  status: done  commit: c5bf2163
- [x] /los-angeles/dishwasher-repair/  (vol 150)  status: done  commit: c5bf2163
- [x] /los-angeles/washer-repair/  (vol 150)  status: done  commit: c5bf2163
- [x] /los-angeles/freezer-repair/  (vol 100)  status: done  commit: c5bf2163
- [x] /los-angeles/stove-repair/  (vol 100)  status: done  commit: c5bf2163
- [x] /los-angeles/microwave-repair/  (vol 60)  status: done  commit: c5bf2163

### Pasadena (пачка 2) — ✅ DONE (commit ad4ac978)
- [x] /pasadena/washer-repair/  (vol 200)  status: done  commit: ad4ac978
- [x] /pasadena/dishwasher-repair/  (vol 150)  status: done  commit: ad4ac978
- [x] /pasadena/oven-repair/  (vol 150)  status: done  commit: ad4ac978
- [x] /pasadena/stove-repair/  (vol 150)  status: done  commit: ad4ac978
- [x] /pasadena/dryer-repair/  (vol 80)  status: done  commit: ad4ac978
- [x] /pasadena/refrigerator-repair/  (vol 80)  status: done  commit: ad4ac978
- [x] /pasadena/cooktop-repair/  (vol 70)  status: done  commit: ad4ac978

### Temecula (пачка 3) — ✅ DONE (commit 681aff9c)
- [x] /temecula/refrigerator-repair/  (vol 150)  status: done  commit: 681aff9c
- [x] /temecula/dryer-repair/  (vol 100)  status: done  commit: 681aff9c
- [x] /temecula/oven-repair/  (vol 100)  status: done  commit: 681aff9c
- [x] /temecula/washer-repair/  (vol 100)  status: done  commit: 681aff9c
- [x] /temecula/stove-repair/  (vol 90)  status: done  commit: 681aff9c
- [x] /temecula/dishwasher-repair/  (vol 70)  status: done  commit: 681aff9c

### Irvine (пачка 4) — ✅ DONE (commit 6a8d755f)
- [x] /irvine/dryer-repair/  (vol 150)  status: done  commit: 6a8d755f
- [x] /irvine/refrigerator-repair/  (vol 150)  status: done  commit: 6a8d755f
- [x] /irvine/dishwasher-repair/  (vol 100)  status: done  commit: 6a8d755f
- [x] /irvine/oven-repair/  (vol 90)  status: done  commit: 6a8d755f
- [x] /irvine/washer-repair/  (vol 80)  status: done  commit: 6a8d755f
- [x] /irvine/ice-maker-repair/  (vol 70)  status: done  commit: 6a8d755f

### Burbank (пачка 5) — ✅ DONE (commit 1d78706d)
- [x] /burbank/dryer-repair/  (vol 150)  status: done  commit: 1d78706d
- [x] /burbank/refrigerator-repair/  (vol 150)  status: done  commit: 1d78706d
- [x] /burbank/oven-repair/  (vol 100)  status: done  commit: 1d78706d
- [x] /burbank/dishwasher-repair/  (vol 60)  status: done  commit: 1d78706d
- [x] /burbank/washer-repair/  (vol 60)  status: done  commit: 1d78706d

### Glendale (пачка 6) — ✅ DONE (commit bd085ee6)
- [x] /glendale/dryer-repair/  (vol 150)  status: done  commit: bd085ee6
- [x] /glendale/refrigerator-repair/  (vol 100)  status: done  commit: bd085ee6
- [x] /glendale/dishwasher-repair/  (vol 90)  status: done  commit: bd085ee6
- [x] /glendale/oven-repair/  (vol 80)  status: done  commit: bd085ee6
- [x] /glendale/washer-repair/  (vol 80)  status: done  commit: bd085ee6
- [x] /glendale/stove-repair/  (vol 50)  status: done  commit: bd085ee6

### Rancho-Cucamonga (пачка 7) — ✅ DONE (commit c8002988)
- [x] /rancho-cucamonga/refrigerator-repair/  (vol 150)  status: done  commit: c8002988
- [x] /rancho-cucamonga/dryer-repair/  (vol 100)  status: done  commit: c8002988
- [x] /rancho-cucamonga/oven-repair/  (vol 100)  status: done  commit: c8002988
- [x] /rancho-cucamonga/washer-repair/  (vol 100)  status: done  commit: c8002988
- [x] /rancho-cucamonga/dishwasher-repair/  (vol 70)  status: done  commit: c8002988

### Anaheim (пачка 8) — ✅ DONE (commit bcc30f3e)
- [x] /anaheim/refrigerator-repair/  (vol 150)  status: done  commit: bcc30f3e
- [x] /anaheim/dishwasher-repair/  (vol 80)  status: done  commit: bcc30f3e
- [x] /anaheim/dryer-repair/  (vol 80)  status: done  commit: bcc30f3e
- [x] /anaheim/freezer-repair/  (vol 80)  status: done  commit: bcc30f3e
- [x] /anaheim/oven-repair/  (vol 80)  status: done  commit: bcc30f3e
- [x] /anaheim/washer-repair/  (vol 80)  status: done  commit: bcc30f3e
- [x] /anaheim/stove-repair/  (vol 70)  status: done  commit: bcc30f3e

### Прочие (одиночные из List A) — пачка 9 — ✅ DONE (commit 7eb71537)
- [x] /long-beach/refrigerator-repair/  (vol 100)  status: done  commit: 7eb71537
- [x] /long-beach/dryer-repair/  (vol 50)  status: done  commit: 7eb71537
- [x] /santa-monica/stove-repair/  (vol 90)  status: done  commit: 7eb71537
- [x] /west-hollywood/dryer-repair/  (vol 60)  status: done  commit: 7eb71537
- [x] /hollywood/refrigerator-repair/  (vol 50)  status: done  commit: 7eb71537
- [x] /thousand-oaks/refrigerator-repair/  (vol 50)  status: done  commit: 7eb71537

## ✅ ЗАВЕРШЕНО: 56/56 combo усилены. Ветка `work/combo-boost-2026-07-02`, НЕ запушено — ждём решения по merge/push.

## Журнал коммитов
- **c5bf2163** — LA batch (8/56): refrigerator/dryer/oven/dishwasher/washer/freezer/stove/microwave. + override-механизм (`src/data/combo-overrides.ts` + правка `[city]/[service].astro`) + H1 dedupe (city==branch → «Same-Day Service»). Build 1094, 0 ошибок. Не запушено.
- **ad4ac978** — Pasadena batch (7/56 → 15/56 всего): washer/dishwasher/oven/stove/dryer/refrigerator/cooktop. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **681aff9c** — Temecula batch (6/56 → 21/56 всего): refrigerator/dryer/oven/washer/stove/dishwasher. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **6a8d755f** — Irvine batch (6/56 → 27/56 всего): dryer/refrigerator/dishwasher/oven/washer/ice-maker. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **1d78706d** — Burbank batch (5/56 → 32/56 всего): dryer/refrigerator/oven/dishwasher/washer. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **bd085ee6** — Glendale batch (6/56 → 38/56 всего): dryer/refrigerator/dishwasher/oven/washer/stove. Только `combo-overrides.ts`. Build 0 ошибок (счётчик 1095 = 1094 + untracked `src/pages/outdoor/brands/bull.astro` из отдельной outdoor-работы, не часть этой пачки). Не запушено.
- **c8002988** — Rancho-Cucamonga batch (5/56 → 43/56 всего): refrigerator/dryer/oven/washer/dishwasher. Только `combo-overrides.ts`. Build 0 ошибок (счётчик 1096 = 1094 + untracked outdoor `bull.astro`+`blaze.astro`, отдельный workstream). Не запушено.
- **bcc30f3e** — Anaheim batch (7/56 → 50/56 всего): refrigerator/dishwasher/dryer/freezer/oven/washer/stove. Только `combo-overrides.ts`. Build 0 ошибок (1096 = 1094 + 2 untracked outdoor). Не запушено.
- **7eb71537** — Final singles batch (6/56 → **56/56 ГОТОВО**): long-beach refrigerator+dryer, santa-monica stove, west-hollywood dryer, hollywood refrigerator, thousand-oaks refrigerator. Только `combo-overrides.ts`. Build 0 ошибок. Не запушено.


---

## Склейка 56 мёртвых combo (canonical → пиллар) — 2026-07-02

**Ветка:** `combo-collapse-2026-07-02` · **Backup:** `backup/combo-collapse-2026-07-02` (= main до правки).

**Что сделано:** 56 combo с нулевым спросом (Ahrefs 0/мес, GSC-показы ≈0 — список A из раздела «Аудит мёртвого хвоста») склеены на городской пиллар. У каждой такой страницы `<link rel=canonical>` и og:url теперь указывают на `/[city]/`, а не на саму себя. Страницы физически остаются (Maps/прямые заходы), но Google перестаёт ранжировать их как отдельные дубли. Остальные 105 combo не тронуты (self-canonical). JSON-LD `@id`/`url` у склеенных остались self (менялся только canonical-тег).

**Механика:** новый `src/data/combo-collapse.ts` (Set из 56 ключей `city/service` + `isCollapsedCombo()`); в `src/pages/[city]/[service].astro` добавлена `pageCanonical` (пиллар для склеенных, self для остальных) → уходит в Layout. Коммит **8de31128**. Build 1096 (=1094 + Bull/Blaze на main), 0 ошибок. Dist-контроль: ровно 56 canonical→пиллар, 105 self.

**КАК ОТКАТИТЬ:** удалить нужные ключи из `COLLAPSED_COMBOS` в `src/data/combo-collapse.ts` (или очистить Set целиком) → страница вернётся к self-canonical. Либо `git revert 8de31128`, либо сброс на `backup/combo-collapse-2026-07-02`. Полностью обратимо, контент страниц не менялся.

**56 склеенных (canonical → /[city]/):**
- **/anaheim/** ← anaheim/ice-maker-repair, anaheim/microwave-repair, anaheim/wall-oven-repair
- **/beverly-hills/** ← beverly-hills/freezer-repair, beverly-hills/ice-maker-repair, beverly-hills/range-repair, beverly-hills/stove-repair, beverly-hills/wall-oven-repair
- **/burbank/** ← burbank/freezer-repair, burbank/ice-maker-repair, burbank/microwave-repair, burbank/range-repair, burbank/wall-oven-repair
- **/glendale/** ← glendale/freezer-repair, glendale/ice-maker-repair, glendale/microwave-repair, glendale/range-repair, glendale/wall-oven-repair
- **/hollywood/** ← hollywood/oven-repair
- **/irvine/** ← irvine/microwave-repair, irvine/wall-oven-repair
- **/long-beach/** ← long-beach/cooktop-repair, long-beach/freezer-repair, long-beach/ice-maker-repair, long-beach/microwave-repair, long-beach/oven-repair, long-beach/range-repair, long-beach/stove-repair, long-beach/wall-oven-repair
- **/los-angeles/** ← los-angeles/cooktop-repair, los-angeles/wall-oven-repair
- **/pasadena/** ← pasadena/microwave-repair, pasadena/wall-oven-repair
- **/rancho-cucamonga/** ← rancho-cucamonga/microwave-repair, rancho-cucamonga/wall-oven-repair
- **/santa-monica/** ← santa-monica/cooktop-repair, santa-monica/dryer-repair, santa-monica/freezer-repair, santa-monica/ice-maker-repair, santa-monica/microwave-repair, santa-monica/oven-repair, santa-monica/range-repair, santa-monica/wall-oven-repair, santa-monica/washer-repair
- **/temecula/** ← temecula/microwave-repair, temecula/wall-oven-repair
- **/thousand-oaks/** ← thousand-oaks/cooktop-repair, thousand-oaks/freezer-repair, thousand-oaks/ice-maker-repair, thousand-oaks/microwave-repair, thousand-oaks/range-repair, thousand-oaks/stove-repair, thousand-oaks/wall-oven-repair
- **/west-hollywood/** ← west-hollywood/ice-maker-repair, west-hollywood/stove-repair, west-hollywood/wall-oven-repair
