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

### Anaheim
- [ ] /anaheim/refrigerator-repair/  (vol 150)  status: pending  commit: —
- [ ] /anaheim/dishwasher-repair/  (vol 80)  status: pending  commit: —
- [ ] /anaheim/dryer-repair/  (vol 80)  status: pending  commit: —
- [ ] /anaheim/freezer-repair/  (vol 80)  status: pending  commit: —
- [ ] /anaheim/oven-repair/  (vol 80)  status: pending  commit: —
- [ ] /anaheim/washer-repair/  (vol 80)  status: pending  commit: —
- [ ] /anaheim/stove-repair/  (vol 70)  status: pending  commit: —

### Прочие (одиночные из List A)
- [ ] /long-beach/refrigerator-repair/  (vol 100)  status: pending  commit: —
- [ ] /long-beach/dryer-repair/  (vol 50)  status: pending  commit: —
- [ ] /santa-monica/stove-repair/  (vol 90)  status: pending  commit: —
- [ ] /west-hollywood/dryer-repair/  (vol 60)  status: pending  commit: —
- [ ] /hollywood/refrigerator-repair/  (vol 50)  status: pending  commit: —
- [ ] /thousand-oaks/refrigerator-repair/  (vol 50)  status: pending  commit: —

## Журнал коммитов
- **c5bf2163** — LA batch (8/56): refrigerator/dryer/oven/dishwasher/washer/freezer/stove/microwave. + override-механизм (`src/data/combo-overrides.ts` + правка `[city]/[service].astro`) + H1 dedupe (city==branch → «Same-Day Service»). Build 1094, 0 ошибок. Не запушено.
- **ad4ac978** — Pasadena batch (7/56 → 15/56 всего): washer/dishwasher/oven/stove/dryer/refrigerator/cooktop. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **681aff9c** — Temecula batch (6/56 → 21/56 всего): refrigerator/dryer/oven/washer/stove/dishwasher. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **6a8d755f** — Irvine batch (6/56 → 27/56 всего): dryer/refrigerator/dishwasher/oven/washer/ice-maker. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **1d78706d** — Burbank batch (5/56 → 32/56 всего): dryer/refrigerator/oven/dishwasher/washer. Только `combo-overrides.ts`. Build 1094, 0 ошибок. Не запушено.
- **bd085ee6** — Glendale batch (6/56 → 38/56 всего): dryer/refrigerator/dishwasher/oven/washer/stove. Только `combo-overrides.ts`. Build 0 ошибок (счётчик 1095 = 1094 + untracked `src/pages/outdoor/brands/bull.astro` из отдельной outdoor-работы, не часть этой пачки). Не запушено.
- **c8002988** — Rancho-Cucamonga batch (5/56 → 43/56 всего): refrigerator/dryer/oven/washer/dishwasher. Только `combo-overrides.ts`. Build 0 ошибок (счётчик 1096 = 1094 + untracked outdoor `bull.astro`+`blaze.astro`, отдельный workstream). Не запушено.
