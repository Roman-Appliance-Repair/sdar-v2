# Выравнивание заголовков built-in кластера (LA → Southern California) — 2026-07-02

**Ветка:** `builtin-titles-2026-07-02` · **Backup:** `backup/builtin-titles-2026-07-02` (= main до правки).
**Коммит:** `8421b596`. Build 1093, 0 ошибок. База: origin/main `7bb3945d`.

## Что поменял (только заголовки, текст не трогал)
Проблема из аудита: рваная гео в title 8 built-in страниц (4 несли «Los Angeles», 3 — «LA»).
Выровнял по паттерну хаба (он же residential-прецедент: title гео-нейтральный, «Southern California» в H1).

**7 бренд-страниц** (sub-zero / thermador / viking / miele / ge-monogram / liebherr / true-residential),
по 2 правки на каждую:
1. **title** (`const title`) → гео-нейтральный `{Brand} Built-In Refrigerator Repair — Same Day`
   (убран «Los Angeles»/«LA»; все ≤56 симв, под лимитом 60). У true-residential заодно нормализован
   «Built In» → «Built-In».
2. **H1** (проп `title={...}` у `ServiceHero`) → `{Brand} Built-In Refrigerator Repair Across Southern California`
   (добавлен «Across Southern California», как в H1 хаба).

**Хаб** `/services/built-in-refrigerator-repair/` — уже был эталонным (title гео-нейтральный,
H1 «…Across Southern California»), **не трогал**.

## Результат
Все 8 страниц кластера консистентны: title без города (гео-нейтральные, ≤60), H1 везде
«…Across Southern California». Локального «Los Angeles/LA» в заголовках больше нет.

## Битых ссылок нет
Менялись только текстовые строки title/H1. URL, ссылки, canonical, редиректы — не трогались.
Страниц не добавлял/не удалял (build 1093 = как было).

## КАК ОТКАТИТЬ
`git revert 8421b596` либо сброс на `backup/builtin-titles-2026-07-02`. Полностью обратимо.
