# Methodology

> Как пишутся страницы. Применяется к city, brand, service, sub-service.
> Глубокая cluster methodology v1.3.1 живёт в wiki — здесь компактная версия.

---

## 1. Полный цикл написания страницы — 5 шагов

```
GSC анализ → конкурентный анализ → TF-IDF → write → deploy + tracker
```

### Шаг 1 — GSC анализ (Windsor.ai)

**Setup:**
- Connector: `searchconsole`
- Account: `sc-domain:samedayappliance.repair`
- Date range: `last_3m` (для текущих запросов) и `last_12m` (для трендов)
- Fields: `query, clicks, impressions, ctr, position`

**Что искать:**
- Запросы с **100+ показов и позиция > 20** → главные таргеты для improvement
- Запросы с **позицией 15-25** → близко к топу, можно дожать малыми усилиями
- Specific queries (brand + city, service + city, model + problem) → темы для секций
- Commercial signals (walk-in cooler, commercial X) → нужна ли commercial секция

**Двух-слойный JSON unwrap (важно):**
```python
outer = response['content']
inner = json.loads(outer[0]['text'])
data = inner['data']  # actual rows
```

**Брендовые запросы:** post-filter в Python — `["query","contains","washer"]` ловит "dishwasher" тоже, надо исключать вручную.

### Шаг 2 — Конкурентный анализ

**Поиск:**
```
"[brand/service] appliance repair Los Angeles" -yelp -angi -thumbtack -sears
```

**Web_fetch 4-6 реальных конкурентов** (не директорий):
- Главная их страницы услуги/бренда
- Фокус: какие районы они называют, какие бренды упоминают, какие проблемы, что НЕ упоминают, какие model numbers фигурируют

**НИКОГДА не fetch:**
- `samedayappliance.repair` или `sdar-v2.pages.dev` — это наши собственные сайты
- Только внешние LA конкуренты

### Шаг 3 — TF-IDF gap analysis

**Цель:** найти топики, которые есть у конкурентов, но нет у нас.

**Корпус — критично brand-specific:** Не смешивать корпус LG + Samsung + Whirlpool — cosine score будет искусственно низким. Корпус под одну категорию.

**Параметры sklearn:**
```python
vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    max_features=2000,
    stop_words='english'
)
```

**Прединструменты:**
- Стрипать frontmatter (`---` блоки), `<style>`, `<script>`, Astro `{...}` expressions, HTML tags
- Иначе TF-IDF ловит код, не контент

**Целевой cosine score** (нашa страница vs корпус конкурентов):
- City pages: **0.40-0.55**
- Brand pages: **0.45-0.60**
- Ниже 0.30 → страница слишком оторвана от темы
- Выше 0.65 → переоптимизация, сделать менее повторяющимся

### Шаг 4 — Write (см. @docs/voice-and-style.md)

Каждая страница содержит:
1. Hero (H1, eyebrow с ZIP, CTAs)
2. Trust bar
3. Intro (живой текст с местным/брендовым observation)
4. Services / Models grid
5. Local/brand context block
6. Recent repairs (4 кейса)
7. Why us
8. FAQ (FAQPage schema)
9. CTA bottom

**Word count target** — см. @docs/voice-and-style.md §5.

### Шаг 5 — Deploy + tracker

**Workflow:**
```bash
npm run build
# verify 0 errors
git add <explicit paths, NOT git add -A>
git commit -m "<type>: <what>"
git push origin main
git log origin/main -1 --format="%h %s"  # confirm push
```

**После deploy:**
- Cloudflare auto-deploys ~75-90 секунд
- Спот-чек на live URL
- **Update Notion tracker** автоматически (без напоминаний): https://www.notion.so/343788eea1d58113aab9fafd42075964

---

## 2. Cluster work — wiki-first

Глубокая методология **v1.3.1** живёт в `wiki/page-plans/METHODOLOGY.md`.

**Перед любой cluster задачей:**
1. Read `wiki/page-plans/METHODOLOGY.md`
2. Read `wiki/page-plans/cluster-XX-NAME/index.md`
3. Read Notion writing standard
4. Read Notion: соответствующая Brand × Service DB

Никогда не писать `.astro` из непросмотренных cluster plans. Никогда не пропускать Notion writing standard.

---

## 3. Audit-first protocol — критично

**Перед любой задачей, трогающей существующий файл, обязательно:**

```bash
ls -la <path>
wc -w <path>
view first 100 lines
view last 100 lines
```

**Затем:**
- Доложить findings
- **Ждать Roman approval** перед любыми изменениями

**Принципы:**
- Существующий контент имеет ценность
- Preview not indexed ≠ stubs (страница может быть полноценной, просто Google не успел проиндексировать)
- Targeted improvements > full rewrites
- Этот протокол ПЕРЕКРЫВАЕТ любые «rewrite from scratch» инструкции, кроме явных от Roman после audit

---

## 4. Sweep pattern — для compliance batches

Когда нужны изменения 100+ страниц одного типа (например, replace em-dash на en-dash, добавить EPA credential):

**Модель commit `1408acb` — 375+ pages в одном коммите:**

1. **Backup branch first:** `git checkout -b backup/sweep-YYYY-MM-DD; git checkout main`
2. **Python/Node script** с защищёнными блоками: HTML comments, JSON-LD, code-fenced blocks
3. **Build verification** перед commit: `npm run build` — должно остаться 0 ошибок
4. **Net-zero word count change** — character-level only, NOT content rewrites
5. **Explicit git add paths** (НЕ `git add -A`)
6. **Single commit** с message типа: `fix(compliance): replace em-dash → en-dash across 375 brand pages`

**Когда sweep НЕ применим:**
- Если нужны контентные изменения → это не sweep, это writer batch
- Если нужно что-то добавить, чего раньше не было → это новый writer task

---

## 5. Race condition protection

**Multiple Claude Code terminals одновременно:** `git add -A` может захватить untracked файлы из других сессий.

**Правило:** Always use **explicit file paths** in `git add`. Never `git add -A`.

```bash
# ❌ Плохо
git add -A

# ✅ Хорошо
git add src/pages/brands/lg.astro src/pages/brands/samsung.astro
```

---

## 6. Build verification — обязательно

Перед каждым push:
```bash
npm run build
# Look for: "X page(s) built in Ys"
# Verify 0 errors, 0 warnings
```

Target build state (по аудиту 2026-05-06):
- 1009 pages
- ~45s build time
- 0 errors, 0 warnings
- 0 P1 violations (NAP/Rating Policy SSOT)

После push **обязательно** verify:
```bash
git log origin/main -1
```

Не доверять локальному `git log` — push мог не пройти.

---

## 7. Audit output / scripts directory

`audit-output/` directory должен быть в `.gitignore`. Был случайно закоммичен ранее. Если видишь файлы там → не коммить.
