# Residential brand-пиллары ZLINE + Thor Kitchen (2026-07-02)

**Задача:** закрыть два самых крупных по спросу отсутствующих residential-бренда из аудита покрытия
(`/brands/` раздел): ZLINE и Thor Kitchen — массовые value pro-style бренды (плиты, у ZLINE ещё вытяжки),
владельцы активно ищут ремонт, конкуренция в repair-нише ниже, чем у люкса.

**Commit:** `7bb3945d` на `main` (изначально план был `fix/refrigeration-hub`, но ветки нестабильны →
по решению Романа коммит в `main`, 5 файлов явными путями).

## Что сделано
Структура клонирована с residential-пиллара `brands/bluestar.astro` (9–11 секций, ServiceHero, стили),
schema — как Bull/Blaze (`mergeCredentials` + `BRANCH_LOCATIONS_GEO_NEUTRAL`, geo-neutral, location array 8 филиалов,
без streetAddress/aggregateRating).

- `brands/zline.astro` (~4500w `wc`, тело ~3100) — полная. Отдельная **сильная секция range hoods** (флагманский продукт
  ZLINE): KB convertible, KECOM-30/36/42/48 (400/700 CFM), 587/597, 8654, island/under-cabinet. Ranges: Professional
  RA30/36/48 (dual-fuel), SGR (gas), Autograph RAZ-30/36/48 (+ -G/-CB/RAZ-WM), Paramount SGRZ-36. USP: дешёвые OEM-детали
  через `zlineparts.com` (без gating) → ремонт выгоднее замены.
- `brands/thor.astro` (~3360w `wc`, тело ~1900) — легче. HRG gas (HRG3080U/3618U/4808U(ULP)) + HRD dual-fuel
  (HRD3088U(ULP)); blue porcelain oven; тот же value-USP.

**Фактура — только сверенная вебом**, 0 выдуманных SKU. Правка: `BLZ-SSRF-50DH` (в паре с этим — на blaze) не тут;
для ZLINE hood-модели и range-модели подтверждены поиском/curl.

## Перелинковка (де-орфан ≥3)
`/brands/` индекс пиллары НЕ авто-линкует (там нет и bluestar/bertazzoni) → реализовано через бренд-гриды сервис-хабов:
- `services/range-repair.astro` — новый «Value pro-style tier» с ZLINE + Thor.
- `services/range-hood-repair.astro` — ZLINE в consumer-грид вытяжек.
- `services/oven-repair.astro` — ZLINE + Thor в value-грид.
Входящих: ZLINE 4 (range-repair + range-hood + oven-repair + thor-sibling), Thor 3 (range-repair + oven-repair + zline-sibling).

## Комплаенс (dist)
Titles 52/50 ≤60 · forbidden 0 (2× `best` в zline переформулированы) · em-dash в теле 0/0 · aggregateRating 0 ·
кириллица 0 · $89 присутствует, $120 = global chrome. Build 1093 (база ветки отличалась из-за чужих коммитов), 0 ошибок.
Cloudflare live, оба URL по title подтверждены, IndexNow 2 → 200.

## Позиционирование
ZLINE/Thor — value-tier, а сайт спозиционирован на luxury (Sub-Zero/Wolf/Thermador). Решение осознанное: спрос реальный,
конкуренция ниже; но это единственные value-бренды в наборе. Дальнейшее расширение вниз по рынку — по данным спроса.

## Откат
`git revert 7bb3945d` (2 новых пиллара + правки 3 сервис-хабов). Контент других страниц не тронут.

## Турбулентность (важно для следующих сессий)
Во время работы соседние терминалы многократно переключали git-ветку (`fix/refrigeration-hub`, `combo-collapse`,
`combo-boost`, `fix/slushie-page`) и держали `index.lock`. Дважды пришлось останавливаться и ждать чистого состояния.
Вывод: при параллельных терминалах коммитить только явными путями и проверять `git branch --show-current` + lock перед каждым `git add`.
