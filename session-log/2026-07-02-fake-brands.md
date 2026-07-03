# Удаление 5 фейковых бренд-страниц (бренд не делает эту технику) — 2026-07-02

**Ветка:** `fake-brands-cleanup-2026-07-02` · **Backup:** `backup/fake-brands-2026-07-02` (= main до правки).
**Коммит:** `4c27a912`. Build 1091 (1096 − 5 удалённых), 0 ошибок.

## Что сделано
Удалены 5 страниц `/brands/{бренд}-{техника}-repair/`, где бренд эту технику не выпускает
(аудит «несуществующие товары» в briefing). У каждой — 301 на профильный сервис-хаб.
Подчищены все 22 входящие ссылки → битых/на-редирект не осталось (dist-контроль 0).

## 5 удалённых (URL → 301) + почему фейк
| Удалено | Redirect 301 | Почему фейк |
|---|---|---|
| /brands/jennair-dryer-repair/ | /services/dryer-repair/ | JennAir (US) не делает сушилки — **factual-accuracy.md §2** |
| /brands/hestan-dishwasher-repair/ | /services/dishwasher-repair/ | Каталог Hestan (ranges/ovens/холод/вентиляция/outdoor) посудомоек не содержит |
| /brands/wolf-pizza-oven-repair/ | /services/pizza-oven-repair/ | Wolf не выпускает отдельную пиццу-печь как продукт |
| /brands/miele-ice-maker-repair/ | /services/ice-maker-repair/ | Miele не делает отдельный льдогенератор (лёд только в фридж-колоннах) |
| /brands/thermador-ice-maker-repair/ | /services/ice-maker-repair/ | Thermador не делает отдельный льдогенератор |

Подтверждение «терять нечего»: Ahrefs = 0 спроса по всем 5 (база пуста), GSC = 0 показов.

## Механика редиректа
- `astro.config.mjs` (`redirects:` блок) — генерит noindex redirect-заглушку (meta-refresh + canonical→хаб).
- `public/_redirects` — edge-301 на Cloudflare (авторитетный 301).

## Подчищенные ссылки (11 файлов, 22 ссылки)
- `brands/jennair.astro` ×3 (проза-разлинковка + cat-card + list-item)
- `brands/hestan-wall-oven-repair.astro` ×2, `brands/miele.astro` ×1,
  `brands/miele-built-in-refrigerator-repair.astro` ×2
- `brands/thermador.astro` ×1, `brands/thermador-built-in-refrigerator-repair.astro` ×4,
  `brands/viking-ice-maker-repair.astro` ×1
- `services/ice-maker-repair.astro` ×2 (бренд-чипы), `services/pizza-oven-repair.astro` ×2,
  `price-list/pizza-oven-repair-cost.astro` ×2

## КАК ОТКАТИТЬ
`git revert 4c27a912` (вернёт файлы) + убрать 5 строк из `astro.config.mjs` и `public/_redirects`.
Либо сброс на `backup/fake-brands-2026-07-02`. Полностью обратимо.

## На заметку (не сделано, требует согласования)
factual-accuracy.md §2 явно покрывает только JennAir-dryer. Остальные 4 (Hestan-dishwasher,
Wolf-pizza-oven, Miele/Thermador ice-maker) держатся на каталогах брендов. Стоит дописать их
в §2, чтобы будущая генерация не пересоздала эти комбинации.
