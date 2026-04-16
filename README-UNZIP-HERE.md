# SDAR V2 — Base Infrastructure Package

Распакуй этот архив в корень проекта `C:\Users\Roman\WebstormProjects\sdar-v2\`.

## Что внутри

```
astro.config.mjs                     — обновлённый конфиг (site URL, trailing slash)
public/
  _headers                           — security + caching headers для CF Pages
  robots.txt                         — с ссылкой на sitemap
src/
  styles/
    global.css                       — CSS переменные, reset, типографика, кнопки
  layouts/
    Layout.astro                     — главный layout (navbar + trust bar + footer)
  components/
    TrustBar.astro                   — чёрная плашка с credentials
    MegaMenu.astro                   — 4-колоночное мега-меню (Services/Commercial/Brands/Cities)
    Footer.astro                     — футер с NAP, филиалами, ссылками
  pages/
    index.astro                      — ВРЕМЕННЫЙ демо homepage (показывает что layout работает)
```

## Как распаковать

### Вариант 1 — через проводник Windows
1. Кликни правой кнопкой → Extract All → указать `C:\Users\Roman\WebstormProjects\sdar-v2\`
2. Согласись перезаписать `astro.config.mjs` и `src/pages/index.astro`

### Вариант 2 — PowerShell
```powershell
cd C:\Users\Roman\WebstormProjects\sdar-v2
Expand-Archive -Path "$HOME\Downloads\sdar-v2-base.zip" -DestinationPath . -Force
```

## Проверка после распаковки

```powershell
npm run dev
```

Открой http://localhost:4321/ — должно показать:
- Чёрную плашку наверху с credentials (BBB, CSLB C-20, Insured, EPA, Background Checked, BHGS)
- Навбар: логотип слева, мега-меню посередине, красная кнопка телефона справа
- При наведении на пункты меню выпадают колонки
- Чёрный hero блок с заголовком и двумя кнопками
- Большой чёрный футер с филиалами и credentials

## Что делать если выдаёт ошибки

1. Убедись что dev-сервер перезапущен после распаковки (Ctrl+C → `npm run dev` снова)
2. Чисти кеш: `rm -rf node_modules/.astro` (или удали папку `.astro` вручную)
3. Проверь что все файлы на месте: `ls src/components/` должен показать 3 файла

## После успешной проверки

```powershell
git add .
git commit -m "Add Layout, global.css, components, and base infrastructure"
git push
```

## Следующие шаги

1. **Подключить к Cloudflare Pages** — получить `sdar-v2.pages.dev`
2. **Переписать index.astro** под luxury editorial homepage (все секции из контекст-файла)
3. **Начать перенос страниц блоками** из старого проекта:
   - Сначала `src/pages/services/` (21 файл)
   - Потом `src/pages/credentials/` (8 файлов)
   - И так далее по плану

---

**Notion трекер:** https://www.notion.so/343788eea1d58113aab9fafd42075964
**Стандарт написания:** https://www.notion.so/343788eea1d581f9b8f5d4cadd7a54e2
