# 2026-07-13 — L-3 slug reconciliation (combo heroes + big-chill/monogram redirects)

**Ветка:** `feature/l3-slug-reconcile` (от свежего main `c4c11271`) → merge `e92f9540` на main.
**Триггер:** Roman ходит по `/brands/big-chill-repair/` и `/brands/monogram-repair/` — видит дефолт-hero (3 техника/фургон). Мои прошлые фиксы шли в `big-chill-refrigerator-repair` и `ge-monogram`.

## STEP 1 — Duplicate/slug audit
- **`/brands/big-chill-repair/` и `/brands/monogram-repair/` — НЕ существуют как страницы.** md5 их HTML == homepage (`0a267063…`) = Cloudflare **404→homepage fallback** (HTTP 200, но отдаётся буквально главная → её дефолт-hero `/images/hero/v1/…`). `.astro`-файлов нет. Roman добавляет `-repair` по привычке (прецедент `beverage-air-repair`).
- Реальные страницы бренда — `big-chill-refrigerator-repair` (hero `e6c531f6`, brand-accurate retro) и `ge-monogram` (hero `67b6e87b`, brand-accurate) — **уже v3-OK**, дефолта не показывают.
- **Аудит hero по 18 L-3 брендам:** НИ ОДНА реальная страница не рендерит `/images/hero/`-дефолт. НО **21 combo-страница** несла prior-wave generic-технарь-hero (EXIF/ICC, md5-уникальные но визуально≈дефолт), а `gaggenau-built-in-refrigerator-repair` был MODE-B (без hero вообще).

## STEP 2 — Wire 22 combos to parent brand v3 hero
Скопировал каждому combo родительский brand-accurate v3 hero (6-файловый adaptive set, Python `shutil.copyfile`, 132 файла). Та же картинка на бренд — ок, генерация не нужна (файлы уже есть):
- gaggenau ×7, ge-monogram ×6, bluestar ×4, signature-kitchen-suite ×2, cove-dishwasher, aga-range-hood, la-cornue-range-hood.
- Все 22 combo hero.webp теперь stripped/brand-accurate (0 EXIF-generic).

## STEP 2b — 2 редиректа (public/_redirects)
```
/brands/big-chill-repair/ /brands/big-chill-refrigerator-repair/ 301
/brands/monogram-repair/  /brands/ge-monogram/                   301
```
Чтобы URL-и, которые Roman набирает по привычке, вели на реальные brand-accurate страницы, а не на homepage-fallback.

## STEP 3 — Duplicate flag (pillar vs combo, отчёт, без merge/delete)
Per L-3 бренду 2+ страниц = **pillar (broad, 3.4–6.3K слов) + category-combos** — раздельные SEO-таргеты (seo-policies §6), НЕ дубли. Ближайшие к overlap (для будущего решения Roman): `ge-monogram` pillar ↔ `-refrigerator-repair`; `true-residential-refrigerator-repair` ↔ `-built-in-refrigerator-repair`; `perlick-commercial` ↔ `perlick-refrigerator-repair`. Ничего не сливал/удалял. Полная таблица word-count+title — в отчёте чата.

## STEP 4 — Build / merge / deploy / purge / verify
- Build **1179, 0 ошибок** (один транзиентный esbuild-фейл сразу после копирования 132 файлов — повтор прошёл чисто).
- Commit `bf7f1484` (132 image + `_redirects`, explicit paths) → merge `e92f9540` на main. Raw `ls-remote origin main` = `e92f9540…`.
- Deploy: pages.dev `big-chill-repair` → **301** = деплой живой. `python scripts/cf-purge.py` → **Purge Everything OK**.
- **Prod-верификация БАЙТОВ (custom domain):**
  - Редиректы: `big-chill-repair`→`big-chill-refrigerator-repair` 301 ✓, `monogram-repair`→`ge-monogram` 301 ✓.
  - **22/22 combo hero: md5 prod == local == родитель brand-v3** (0 differ), все image/webp.
  - Назначения редиректов: big-chill-refrigerator-repair `e6c531f6` prod==local ✓, ge-monogram `67b6e87b` prod==local ✓.
  - Homepage-default `52094f72` — ни один brand-hero ему не равен ✓.

## Урок
Cloudflare 404→homepage fallback (HTTP 200 + буквальная главная) выглядит как «страница с дефолт-hero». Проверять существование по md5-HTML==homepage / наличию `.astro`, а не по HTTP-коду. URL с привычным суффиксом (`-repair`) лечится редиректом на реальную страницу, а не генерацией новой.
