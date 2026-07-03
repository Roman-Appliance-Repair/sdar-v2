# Walk-In cooler & freezer DOOR repair page (2026-07-03)

**Задача:** аудит показал gap — обслуживаем walk-in двери (gaskets/hinges/closers/latches/heater wire),
но выделенной страницы нет; тема жила только секциями в cooler/freezer-пилларах (gasket покрыт, hinge/closer = 0).

**Commit:** `9dcb8bad` на `main` (4 файла: 1 новый + 3 wiring).

## Обоснование (аудит спроса, read-only)
- **На сайте:** дедикейтед-страницы не было; в `walk-in-cooler-repair` door=52/gasket=20/hinge=0/closer=0,
  в `walk-in-freezer-repair` door=50/gasket=18/hinge=0/heater cable=3. Фурнитура (петли/доводчики/замки) — пробел.
- **GSC (3 мес):** спрос крошечный (единичные показы), позиции 16–97 — потому что своей страницы не было
  («commercial freezer door repair» = поз. 97 на index). Chicken-and-egg.
- **Ahrefs (US/мес, KD 0 у всех):** walk in cooler door gasket **200**, walk in door closer **100**,
  walk in freezer door replacement 60, walk in cooler door repair 50, commercial freezer door repair 50,
  walk in cooler door hinge 30. Итого ≈490/мес, KD 0, CPC $0.40–$2.50 (сильный commercial intent).
- **Вердикт:** строить отдельную страницу (широта интента + KD 0 + gasket/closer не покрыты). Расширение секции
  не ловит hardware-хвост и размывает head-термины cooler/freezer.

## Что сделано
`commercial/refrigeration/walk-in-door-repair.astro` (~1900w тела) по скелету walk-in-freezer:
CommercialHero, inline Service+FAQPage(8)+WebPage schema, **$120 commercial diagnostic**, geo-neutral WeHo-провайдер,
4 кредита. Секции: door-system anatomy, common failures, **safety (inside release — отдельным блоком)**,
brands/hardware, 4 recent-repair кейса, pricing, FAQ, related.

## Фактура — сверена вебом (Kason official + trade), 0 выдуманного
- Gaskets + bottom sweep; **cam-rise петли Kason 1245** (износ → door sag → рвёт gasket); доводчики
  **Kason 1094 SureClose (быстро+медленно) / 1095 spring**; **Safeguard latch Kason 0058 + inside release 481-C**
  (анти-защемление, OSHA/health-угол); **perimeter heater wire** самрег 110–120V (frame + hinge-track + threshold,
  фольга ~6") = freezer-specific; threshold plate, strip curtains, vapor-proof light. Door boxes: US Cooler/Nor-Lake/
  Master-Bilt/Kolpak (линк на существующие walk-in бренд-страницы) + Bally/American Panel.

## Перелинковка (де-орфан ≥3)
Ссылка на door-страницу добавлена в: `walk-in-cooler-repair` (nearby), `walk-in-freezer-repair` (nearby),
`commercial/refrigeration/index` (prose). Входящих = 3.

## Комплаенс (dist)
Title 51 ≤60 · forbidden 0 · aggregateRating 0 · кириллица 0 · **$120=15** (commercial корректно), $89=1 (только
global-виджет, как у freezer-эталона) · em-dash 25 (commercial бюджет ≤6 не применяет). Build 1099, 0 ошибок.
Cloudflare live (title подтверждён), IndexNow → 200.

## Откат
`git revert 9dcb8bad` (1 новый файл + по 1 ссылке в 3 хабах). Контент других страниц не тронут.

## Заметка
Ветка во время работы прыгала (`gaggenau` → `fix/book-form`), соседние терминалы активны; правки на `main`,
коммит явными путями (4 файла), чужое не тронуто.
