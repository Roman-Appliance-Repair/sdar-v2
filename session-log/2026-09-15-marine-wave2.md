# 2026-09-15 — marine wave 2

### 22:50 — Marine wave 2: yacht pillar + ice maker + laundry + 3 гавани, в проде

**Что сделано:**
Шесть страниц в `/marine/`. Пиллар `/marine/yacht-appliance-repair/` (~2 190 слов) —
главный угол: выше ~60 футов камбуз набит обычной премиальной БЫТОВОЙ техникой
(Sub-Zero, Miele, Bosch, Gaggenau, Wolf cooking, винные колонны), морские мастерские
её не обслуживают, бытовые сервисы в марину не едут, мы стоим между ними. Отличия борта
от дома разобраны по четырём осям: питание (береговое 30/50 А, генератор, инвертор,
разделительный трансформатор; диагностика с напряжения под нагрузкой), соль и влажность,
встройка в столярку без сервисного доступа, логистика по понтону + доступ в марину.
Сервисные: `ice-maker-repair` (~1 456) и `washer-dryer-repair` (~1 608). Гео:
`dana-point` (~1 308), `san-diego` (~1 312), `santa-barbara` (~1 318).
Ветка `feat/marine-wave2`, worktree `sdar-v2-wt8`, fast-forward в main, push.

**Commits:**
- `7aa0eed1` (sdar-v2): feat(marine): wave 2 — yacht pillar, ice maker, laundry, 3 harbor geo

**Затронуло:**
- Files changed: `src/pages/marine/*` (6 новых); `src/pages/marine/index.astro` (тело +
  Related 4 → 10 ссылок, секция 07 перечисляет 5 гаваней), `src/components/MegaMenu.astro`
  (+3 пункта в Services), `src/components/Footer.astro` (+Yacht Appliances),
  `scripts/check-quote-sheet.mjs` (1211 → 1217)
- Pages affected: +6 (build 1217/0)

**Проверки:**
- schema: 3 сервисные гео-нейтральные (`BRANCHES.map(buildBranchLocation)` = 10 филиалов,
  locality West Hollywood, streetAddress 0); 3 гео — ОДИН `LocalBusiness` своего филиала
  без `location` (dana-point → Irvine `+12134019019`, san-diego → `+18586677237`,
  santa-barbara → `+18055000855`). FAQPage 7 на yacht, 5 на остальных. aggregateRating 0.
- titles 42–47 (все ≤60, без телефона/brand-tail/&), desc 134–150 (все ≤160), замер на dist
- по всем 11 страницам раздела: aggregateRating 0 · «BBB A+» 0 · «6230 Wilshire» 0 ·
  «BHGS Licensed|CA BHGS» 0 · «Middleby» 0 · 12 запрещённых фраз 0
- ABYC: литерал «ABYC certified|ABYC-certified» = 0; все 16 вхождений прочитаны глазами —
  либо отсылка к чужому стандарту («marine electrician working to ABYC standards»), либо
  честное отрицание («We don't hold ABYC certification»). Дисклеймеры не трогали.
- $120 в контенте И в промо-панели шапки на всех 11 (проверено на dist, не в исходнике)
- гейты: check-quote-sheet 199/199 · check-hero-fold 53/53 · smoke 431/431
- прод: 6/6 URL 200 с верными titles, промо-панель `$120` на всех шести; IndexNow 6 URL → 200

**Решения / discovery:**
- **Города San Diego в `cities.ts` НЕТ намеренно** — в шапке файла «City of San Diego proper
  is Wave 2 — deliberately absent». `getCityBySlug('san-diego')` вернул undefined и уронил
  билд. `/marine/san-diego/` резолвит филиал напрямую из `branches.ts`, а ссылка «ashore»
  ведёт на `/san-diego-county/`: пиллара `/san-diego/` не существует. У `dana-point` и
  `santa-barbara` пиллары есть, их ссылки валидны (проверено, 200).
- **Объёмы с первого захода не попали в вилки:** yacht 2 263 (потолок 2 200), washer-dryer
  1 352 и все три гео 1 068–1 093 (пол 1 400 / 1 200). Дописаны содержательные секции
  (laundry «Living with it»; Dana Point «The rhythm here» — износ от простоя; San Diego
  «Boats that are used every day» — liveaboard/чартер; Santa Barbara «Before the crossing»),
  yacht подрезан. Мерить объём ПОСЛЕ билда по `<main>`, а не на глаз.
- **Прод-`sitemap-0.xml` отдавался из кэша Cloudflare** (`cf-cache-status: HIT`, `Age` 3 900+
  при `max-age=3600`, 1154 URL против 1160 в dist и на pages.dev). Сам не ревалидировался.
  Text-only merge purge по methodology §5.1 не требует, но перезаписанный `sitemap-0.xml` —
  ровно тот же класс: существующий путь, устаревший байт на edge.

**Следующий шаг:**
Hero-фото на 11 страниц раздела (герой пока текстовый, `public/images/marine/` нет).
Recent repairs — только реальные job'ы из HCP.

---
