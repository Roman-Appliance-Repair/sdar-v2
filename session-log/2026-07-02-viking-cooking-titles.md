# Viking cooking-страницы: гео-нейтрал title + Southern California H1 — 2026-07-02

**Ветка:** `viking-cooking-titles-2026-07-02` · **Backup:** `backup/viking-cooking-titles-2026-07-02` (= main до правки, c31235f7).
**Коммит:** `94a6ff9a`. Build 1097, 0 ошибок. База: origin/main `c31235f7`.

## Что поменял (только заголовки, текст не трогал)
Догеонейтралил 8 cooking Viking-страниц (оставались с «Los Angeles» после refrigeration-прохода):
bbq-grill, cooktop, oven, range-hood, range, stove, trash-compactor, wall-oven.

По каждой 2 правки:
1. **title** (`const title`) → убран «Los Angeles» → `Viking {Техника} Repair — Same Day` (все ≤42 симв, под лимитом 60).
2. **H1** → добавлен «Across Southern California» (механизм разный: у 4 литеральный `<h1>`, у 4 проп
   `title={...}` у ServiceHero).

Заметка: у `viking-oven-repair` H1 остался «Viking Wall Oven Repair» (было так до правки — приложил только
«Southern California», слово техники не трогал per «текст не трогай»).

## Результат
Теперь ВСЕ 14 Viking-страниц гео-нейтральны в title и несут «Southern California» в H1
(6 рефрижераторных + built-in + 8 cooking = 15 файлов, но built-in считался в built-in кластере).
Локального «Los Angeles/LA» в Viking-заголовках больше нет.

## Битых ссылок нет
Менялись только строки title/H1. URL/ссылки/canonical/редиректы не трогались. Страниц столько же (1097).

## КАК ОТКАТИТЬ
`git revert 94a6ff9a` либо сброс на `backup/viking-cooking-titles-2026-07-02`. Полностью обратимо.
