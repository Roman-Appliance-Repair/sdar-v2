# Консолидация Sub-Zero: пиллар = главная по near-me/бренду — 2026-07-02

**Ветка:** `subzero-consolidate-2026-07-02` · **Backup:** `backup/subzero-consolidate-2026-07-02` (= main до правки).
**Коммит:** `839b12be`. Build 1093, 0 ошибок. База: origin/main `fe992460`.

## Проблема (из GSC-аудита, briefing built-in)
«sub zero repair near me» + вариации (~217 показов/2нед, **0 кликов**) размазаны по **12 страницам**.
Пиллар `/brands/sub-zero/` — назначенная главная — сидел на **поз 61** (хуже всех): в тексте была
«Southern California», но **near-me/near-you фразировки не было вообще**.

## Что сделал
1. **Пиллар `/brands/sub-zero/`** — добавил абзац near-me/near-you живым голосом в секцию
   «Sub-Zero service across Southern California». Таргетит «Sub-Zero repair near me» / «who services
   Sub-Zero refrigerators near me» / «near you». Это главная правка — даёт пиллару локальный сигнал,
   которого не хватало, чтобы обойти полу-ранжирующиеся город/каунти-страницы.
2. **2 блога Sub-Zero** — добавил контекстную CTA-ссылку на пиллар с анкором **«Sub-Zero repair»**
   (not-cooling-5-checks + replacement-vs-repair). Сгоняет вес и брендовый анкор на пиллар.

## Что проверил (не трогал)
- **Узкие sub-zero appliance-страницы** (refrigerator/built-in/ice-maker/outdoor/wine) — уже линкуют
  вверх на пиллар (up-links ≥1 у каждой) ✓. По инструкции не трогал.
- **Город/каунти-страницы** — уже линкуют на пиллар через render-time линковщик (`linkifyInternal` +
  brand-pillar-map): laguna-niguel 8, brentwood 7, dana-point 7, west-hollywood 7, hollywood 6,
  corona 5, каунти по 1. **Вес уже течёт на пиллар.**

## Почему НЕ вычищал sub-zero-контент из город/каунти (осознанное решение)
Их ссылки на пиллар уже есть (render-time). Часть из них держит ЛУЧШИЕ near-me позиции (brentwood поз 8,
san-bernardino-county поз 8) — лучше самого пиллара (61). Если срезать у них Sub-Zero-контент, рискуем
потерять этот поз-8 сигнал ДО того, как пиллар нагонит. Безопаснее: усилить пиллар + опереться на
существующие ссылки → Google консолидирует на пиллар естественно, лучший ранкёр не рушим.
Явного «sub-zero near me» текста в них и нет (grep пусто) — вычищать нечего, только легитимные упоминания бренда.

## КАК ОТКАТИТЬ
`git revert 839b12be` либо сброс на `backup/subzero-consolidate-2026-07-02`. Правки — только проза+ссылки
на 3 существующих страницах, страниц не добавлял/не удалял. Полностью обратимо.
