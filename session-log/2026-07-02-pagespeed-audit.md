# PageSpeed / Core Web Vitals аудит 6 типовых страниц (2026-07-02)

**Задача:** прогнать mobile-PageSpeed по 6 репрезентативным типам страниц (главная, city-pillar, brand-pillar,
service-hub, city×service combo, новая outdoor-brand) и найти причину разового LCP 4.0 s на главной.

**Инструмент:** локальный **Lighthouse** (`npx lighthouse`, headless Chrome, `--form-factor=mobile --screenEmulation.mobile`).
Почему не PSI-API: бесключевой PageSpeed Insights API упёрся в дневную квоту ("Queries per day"), Google API-ключа в проекте нет
(только Bing/Gemini/GSC/GA4). Это **lab-данные** (симуляция throttling), не field/CrUX.

## Результаты (mobile, Lighthouse)
| Страница | Score | LCP | CLS | TBT | Вес |
|---|---|---|---|---|---|
| `/` (главная) | 98–99* | 1.8 s | 0 | 40–110 ms | 220 KiB |
| `/west-hollywood/` | 99 | 1.8 s | 0 | 110 ms | 418 KiB |
| `/brands/lg/` | 99 | 1.8 s | 0 | 110 ms | 249 KiB |
| `/services/refrigerator-repair/` | 99 | 1.8 s | 0 | 100 ms | 237 KiB |
| `/pasadena/refrigerator-repair/` | 99 | 1.8 s | 0 | 80 ms | 225 KiB |
| `/outdoor/brands/bull/` (новая) | 99 | 1.5 s | 0 | 90 ms | 222 KiB |

Значимых тормозов Lighthouse не нашёл ни на одной. **CLS = 0 везде.** Новый outdoor-brand шаблон = 99 (без деградации).

## Разбор аномалии «LCP 4.0 s / 86» на главной
\* Первый одиночный замер дал 86 / LCP 4.0 s. **3 чистых повторных прогона: LCP 1.8/1.8/1.8 s, score 98/99/99.**
Вывод: **4.0 s — разовый шум lab-замера** (холодный кэш / скачок TTFB: в шумном прогоне TTFB прыгал; в чистых 120–210 ms), не дефект.

**LCP-элемент:** Lighthouse не атрибутировал узел (`largest-contentful-paint-element.details = {}` — типично, когда LCP рисуется
сразу с первым рендером). LCP ≈ FCP + 0.5 s, ни один image-LCP аудит (`lcp-lazy-loaded`, `prioritize-lcp-image`) не сработал.
По разметке hero главной:
- H1 «Same Day Appliance Repair» — текст, шрифт Playfair Display 800, **`preload` в `<head>`**.
- hero-изображение `/images/hero/v1/hero.jpg` — **JPG 1920×840, `loading="eager"` + `fetchpriority="high"`** (уже приоритизировано).
Настройка образцовая; узкого места нет.

## Необязательный запас (НЕ проблема, на будущее)
Hero главной — JPG (не WebP/AVIF) и 1920×840 без `srcset` (мобилке отдаётся оверсайз). Lighthouse это не флагует (страница
лёгкая, 99). Если когда-нибудь захочется LCP < 1.5 s: (1) hero → WebP/AVIF, (2) добавить `srcset` (~800px мобилке),
(3) опционально `preload` самого hero-изображения. Отдельная микро-задача, не фикс.

## Вывод
Сайт по скорости в отличной форме (5/6 = 99, CLS 0 везде, страницы лёгкие). Реальной проблемы с LCP главной нет —
«4.0 s» был единичным шумом. Изменений не вносил (диагностика).

## Заметка для следующих замеров
- Для field-данных (CrUX, то по чему Google реально ранжирует) и возврата к PSI-скрипту нужен **Google API-ключ**
  (PageSpeed Insights API, квота 25k/день, бесплатно) — завести в Google Cloud Console, положить рядом с прочими креды.
- Lab-LCP имеет разброс ±: единичный замер не показателен, гнать 3+ и смотреть медиану.
