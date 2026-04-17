# SDAR V2 — Контекст для нового чата
## Дата: 17.04.2026

---

## 🎯 ЧТО МЫ ДЕЛАЕМ

Создаём **новый чистый проект** `sdar-v2` для сайта `samedayappliance.repair`.

**Причина:** Старый проект (`Same-day-appliance-repair-11-09-2024-dev`) накопил ~200 старых файлов-мусора (brand матрицы, LA схемы), которые конфликтуют с новыми страницами и ломают билд. Вместо того чтобы чистить старый — строим чистый новый.

**Стратегия:**
```
Старый проект  →  работает на samedayappliance.repair пока строим новый
Новый проект   →  строим на *.pages.dev (Cloudflare staging)
                  когда всё готово → переключаем домен
```

---

## 📋 ТЕХНИЧЕСКИЙ СТЕК

- **Framework:** Astro SSG (Static Site Generation)
- **Хостинг:** Cloudflare Pages
- **Репозиторий:** GitHub → `Roman-Appliance-Repair/sdar-v2` (нужно создать)
- **Дизайн:** Luxury Editorial — чёрный `#0a0a0a` / красный `#C8102E` / белый `#ffffff`
- **Шрифты:** Playfair Display (заголовки) + DM Sans (текст)

---

## 🔑 КЛЮЧЕВЫЕ ДАННЫЕ ПРОЕКТА

```
Бизнес: Same Day Appliance Repair
Домен: samedayappliance.repair
Юрлицо: HVAC 777 LLC
Email: abysov@gmail.com

NAP главный: 6230 Wilshire Blvd Ste A PMB 2267, Los Angeles CA 90048
Телефон главный: (424) 325-0520

Филиалы и телефоны:
- West Hollywood: (323) 870-4790 ← главный для главной страницы
- Los Angeles: (424) 325-0520
- Thousand Oaks: (424) 208-0228
- Pasadena: (626) 376-4458
- Irvine: (213) 401-9019

Диагностика: $89 жилой / $120 коммерческий — waived с repair
Режим работы: Пн–Сб 8:00–20:00, воскресенье ВЫХОДНОЙ, телефон 24/7
BHGS Registration: #A49573
BBB URL: https://www.bbb.org/us/ca/los-angeles/profile/appliance-repair/same-day-appliance-repair-1216-1418869
Schema рейтинг: 4.6 · 37 отзывов

⚠️ НЕ ТРОГАТЬ: /privacy-policy/ и /terms/ — одобрены Twilio для A2P 10DLC
   Телефон в этих документах: (949) 989-4980
```

---

## 🎨 CSS КОНСТАНТЫ

```css
--red: #C8102E;
--black: #0a0a0a;
--white: #ffffff;
--gray: #f5f5f5;
--border: #e2e2e2;
--text: #1a1a1a;
--muted: #6b6b6b;
--font-display: 'Playfair Display', Georgia, serif;
--font-body: 'DM Sans', system-ui, sans-serif;
```

**Чередование секций:** Hero (black) → Trust Bar (red) → Intro (white) → Services (gray) → Context (black) → Neighborhoods (white) → Special Block → Recent Repairs → Why Us → Reviews → Pricing → FAQ → Nearby → Bottom CTA (black)

---

## 📁 ЧТО УЖЕ НАПИСАНО (все файлы в старом проекте)

### Полностью готово к переносу:
- `/services/` — 21 страница ✅
- `/commercial/` — 16 страниц ✅
- `/credentials/` — 8 страниц ✅
- `/for-business/` — 6 страниц ✅
- `/price-list/` — 36 страниц ✅
- Города — 90+ .astro файлов в корне src/pages/ ✅
- County hubs — 5 файлов ✅
- `index.astro` — новая главная написана ✅

### Стандарт написания страниц:
https://www.notion.so/343788eea1d581f9b8f5d4cadd7a54e2

### Трекер проекта:
https://www.notion.so/343788eea1d58113aab9fafd42075964

---

## 🚀 ПЛАН ДЕЙСТВИЙ (2-3 дня)

### ШАГ 1 — Инициализация (делаем прямо сейчас)

1. Создать репозиторий на GitHub: `Roman-Appliance-Repair/sdar-v2`
2. Инициализировать чистый Astro проект:
```bash
cd C:\Users\Roman\WebstormProjects\
npm create astro@latest sdar-v2 -- --template minimal
cd sdar-v2
git init
git remote add origin https://github.com/Roman-Appliance-Repair/sdar-v2.git
git add .
git commit -m "Initial clean Astro setup"
git push -u origin main
```
3. Подключить к Cloudflare Pages → получим `sdar-v2.pages.dev`

### ШАГ 2 — Layout (первое что пишем)

Нужен новый `src/layouts/Layout.astro` с:
- Навбар: логотип + телефон (красная кнопка) + мега-меню
- Trust bar: бейджи BBB, Licensed, Insured, EPA, OSHA, Background Check
- Футер: NAP, ссылки, копирайт
- Google Fonts импорт: Playfair Display + DM Sans
- Базовые CSS переменные

### ШАГ 3 — Главная страница
Файл `index.astro` уже написан в старом проекте — перенести.

### ШАГ 4 — Перенос всех страниц блоками
Из старого проекта копируем только нужные папки:
```
src/pages/services/      ← 21 файл
src/pages/commercial/    ← 16 файлов
src/pages/credentials/   ← 8 файлов
src/pages/for-business/  ← 6 файлов
src/pages/price-list/    ← 36 файлов
src/pages/brands/        ← бренды
src/pages/[city].astro   ← городские страницы
src/pages/*.astro        ← отдельные городские файлы
public/                  ← изображения, favicon
```

**НЕ переносить из старого проекта:**
- `src/pages/*-repair-los-angeles.astro` (~50 файлов) — старые LA матрицы
- `src/pages/brand-*.astro` (~30 файлов) — старые brand страницы
- `src/pages/*-commercial-*.astro` (~95 файлов) — старые commercial матрицы
- `src/pages/reviews-page-nearbynow.astro`
- `src/pages/directories/` — устаревшая страница

**НЕ трогать (живой трафик, перенести как есть):**
- `mainstreet-equipment-commercial-ovens-repair.astro`
- `lang-commercial-ovens-repair.astro`
- `bki-commercial-ovens-repair.astro`
- `cma-dishmachines-repair.astro`
- `huebsch-commercial-dryer-repair.astro`
- `lincoln-commercial-ovens-repair.astro`
- `marsal-pizza-ovens-repair.astro`
- `turbochef-commercial-ovens-repair.astro`

### ШАГ 5 — Финал
- Тестируем на sdar-v2.pages.dev
- Всё ок → в Cloudflare меняем custom domain с старого проекта на новый
- Старый проект остаётся как архив

---

## ⚠️ ВАЖНЫЕ ПРАВИЛА

### Запрещённые фразы (никогда не использовать):
"we understand the urgency", "certified technicians", "our team of experts",
"look no further", "hassle-free", "peace of mind", "second to none",
"top-of-the-line", "don't hesitate to call", "your satisfaction is our priority",
"it's worth noting", "it's important to", "ensure that"

### Стандарт голоса:
- Открывать с конкретного наблюдения, не с "we"
- Называть конкретные улицы и районы
- Показывать мышление техника
- Кейсы — заголовок как клиент говорит
- Прямо о pricing: "$89 diagnostic — waived with repair"

### Pricing:
| Техника | Стандарт | Luxury |
|---------|----------|--------|
| Refrigerator | $200–$450 | $300–$700+ (Sub-Zero, Wolf) |
| Washer/Dryer | $150–$350 | $200–$450 (Miele, Bosch) |
| Oven/Range | $175–$420 | $250–$500+ (Wolf, Viking, Thermador) |
| Dishwasher | $150–$320 | $200–$450 (Miele) |
| Diagnostic (home) | **$89** waived с repair | |
| Diagnostic (commercial) | **$120** waived с repair | |

---

## 📌 ПЕРВОЕ ДЕЙСТВИЕ В НОВОМ ЧАТЕ

1. Прочитай этот файл
2. Попроси пользователя создать репо `sdar-v2` на GitHub
3. Напиши новый `Layout.astro` с навбаром и футером под Luxury Editorial
4. Начинай переносить страницы блоками

**Notion трекер:** https://www.notion.so/343788eea1d58113aab9fafd42075964
**Стандарт написания:** https://www.notion.so/343788eea1d581f9b8f5d4cadd7a54e2
