# Консолидация Viking: пиллар = главная по бренду/near-me + гео-нейтрал титулы — 2026-07-02

**Backup:** `backup/viking-consolidate-2026-07-02` (= main до правки, e0fb915d).
**Коммит:** `8483d716` (лёг прямо на main — HEAD переключился под руки в общем репо; все 5 правок целиком в нём).
Build 1097, 0 ошибок. База: origin/main `e0fb915d`.

## Проблема (из Viking-аудита, briefing built-in)
«viking … repair near me» спрос (~144 показа/2нед, **0 кликов**) ловят чужие город/каунти-страницы
(huntington-beach, san-bernardino-county, ojai) на поз 11–40, а Viking-рефрижераторные бренд-страницы
получают ~0 показов. Пиллар `/brands/viking/` — назначенная главная — имел «Southern California», но
**near-me фразировки не было** → невидим по «viking repair near me».

## Что сделал (тот же приём, что для Sub-Zero)
1. **Near-me блок на пиллар** `/brands/viking/` (живой голос) в секцию «Viking service across Southern
   California» — таргетит «Viking repair near me» / «who fixes Viking refrigerators near me» / «near you».
2. **Гео-нейтрализовал титулы 5 рефрижераторных страниц** (пиллар + refrigerator + outdoor + ice-maker +
   wine-cooler; built-in уже был выровнен): убрал «Los Angeles» → `{…} Repair — Same Day` (все ≤45 симв).
   H1 → «… Across Southern California» (у outdoor H1 уже был SoCal — не трогал).

## Что проверил (не трогал)
- **Узкие Viking appliance-страницы** (range/stove/oven/cooktop/wall-oven/range-hood/bbq-grill/trash-compactor)
  — линкуют вверх на пиллар (up-links ≥1) ✓.
- **Город/каунти-страницы** — уже линкуют на пиллар через render-time линковщик (Viking в brand-pillar-map):
  huntington-beach 6, ojai 6, каунти по 1. **Вес уже течёт на пиллар.**

## Осознанно НЕ трогал
- **8 cooking Viking-страниц** ещё несут «Los Angeles» в title — вне scope этой задачи (фикс про холодильники).
  Кандидаты на будущий гео-свип.
- Город/каунти-контент не резал (как с Sub-Zero: часть держит лучшие near-me позиции; стронг-пиллар
  консолидирует сам). Viking-спрос вообще низкий (~34 показа/2нед на фридж) — потолок маленький.

## КАК ОТКАТИТЬ
`git revert 8483d716` либо сброс на `backup/viking-consolidate-2026-07-02`. Только текст title/H1 + один
абзац на пилларе, URL не трогались. Полностью обратимо.
