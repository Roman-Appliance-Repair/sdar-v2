# SEO Policies

> NAP/Rating SSOT. JSON-LD rules. Schema types. Indexable URL conventions.

---

## 1. NAP / Rating Policy (SSOT)

**Закон (обновлено Wave 35 NAP sweep, 2026-05-06):**
1. **AggregateRating 4.6/37** → ТОЛЬКО в JSON-LD на WeHo pillar + LA SAB pillar (через `branches.ts.aggregateRating`). НИКОГДА в visible UI.
2. **streetAddress 8746 Rangely Ave, West Hollywood, CA 90048** → ТОЛЬКО в schema на:
   - West Hollywood city pillar (`/west-hollywood/`)
   - Hollywood pillar (`/hollywood/` — мapит на WeHo branch per `cities.ts.primaryBranch`)
   - Homepage primary LocalBusiness schema
   - `/contact/` page
3. **6230 Wilshire / PMB 2267** (старый адрес) — удалён ВЕЗДЕ, не возвращать. Footer + 87 JSON-LD блоков очищены 2026-05-06.
4. **HVAC 777 LLC** → ТОЛЬКО в footer copyright line + `legalName` JSON-LD field на legal pages. НИКОГДА в visible body на content pages.
5. **CSLB C-20** — больше не упоминается нигде (это appliance repair site, не HVAC).
6. **License labeling** — везде «BHGS Registration #A49573» (не «BHGS Licensed», не «CSLB License», не «CA BHGS»).

**Все остальные страницы:**
- В schema используют `areaServed` без `streetAddress`
- Не имеют `aggregateRating`
- Не упоминают legalName в visible body

**Verification:** В каждом релизе делать sample audit на 5-10 случайных страниц:
```bash
grep -ic "aggregateRating\|4\.6.*reviews\|37 reviews" <page>  # = 0
grep -c "HVAC 777" <page>  # = 0 в body content (footer copyright OK)
grep -c "6230 Wilshire\|PMB 2267" <page>  # = 0 site-wide
grep -c "CSLB C-20" <page>  # = 0 site-wide
grep -c "BHGS Licensed\|CA BHGS\|License #A49573" <page>  # = 0 site-wide
```

Текущий статус (2026-05-06): **0 P1 violations** site-wide post-Wave 35 NAP sweep.

---

## 2. JSON-LD types — какие используются

По аудиту в dist/ присутствуют:
- `LocalBusiness` / `HomeAndConstructionBusiness` (subtype LocalBusiness)
- `BreadcrumbList` + `ListItem`
- `FAQPage` + `Question` + `Answer`
- `Service`
- `Offer` + `PriceSpecification`
- `OpeningHoursSpecification`
- `City` + `AdministrativeArea`

**Известная inconsistency** (Wave 30 W3, открыто):
Часть city pillars emit `LocalBusiness`, часть `HomeAndConstructionBusiness`. Оба валидны (HomeAndConstructionBusiness — subtype LocalBusiness), но желательно унифицировать. Расследовать **до next major schema sweep**.

---

## Hours canonical SSOT (Wave 36, 2026-05-06)

**SSOT location:** `src/data/business-hours.ts`

**Visible UI string** (use everywhere via `BUSINESS_HOURS.display`):
```
Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7
```

**Schema JSON-LD** (use everywhere via `OPENING_HOURS_SCHEMA` import — array of two objects):
```json
[
  { "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    "opens": "08:00", "closes": "20:00" },
  { "@type": "OpeningHoursSpecification",
    "dayOfWeek": "Sunday",
    "opens": "00:00", "closes": "00:00" }
]
```

Sunday is encoded as `opens=closes=00:00` per Google's documented "closed day" pattern.

**Verification (post Wave 36):**
- All 1009 dist pages contain canonical visible string ✓
- 0 stale `8am–7pm`, `Sun 9am–5pm` patterns in dist ✓
- 0 stale schema patterns (`opens=07:00`, Sunday `09:00-17:00`, Saturday `08:00-19:00`) ✓
- `/contact/` consumes `OPENING_HOURS_SCHEMA` directly per branch in its location array ✓

**Pages that hand-roll their own openingHoursSpecification literals were swept in Wave 36 (~278 files). Do not roll new ones — import the SSOT.**

---

## 3. LocalBusiness schema — обязательные поля

```json
{
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "Same Day Appliance Repair — [City]",
  "legalName": "HVAC 777 LLC",
  "telephone": "[branch phone, никогда head office]",
  "email": "[branch email]",
  "url": "https://samedayappliance.repair/[city]/",
  "areaServed": [{ "@type": "City", "name": "..." }],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "08:00",
      "closes": "20:00"
    }
  ],
  "priceRange": "$$"
}
```

**Только West Hollywood pillar добавляет:**
```json
"address": {
  "@type": "PostalAddress",
  "streetAddress": "6230 Wilshire Blvd Ste A PMB 2267",
  "addressLocality": "Los Angeles",
  "addressRegion": "CA",
  "postalCode": "90048",
  "addressCountry": "US"
},
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.6",
  "reviewCount": "37",
  "bestRating": "5"
}
```

**Brand pages (без physical pin):** `aggregateRating` УБРАН (Wave 29 cleanup).

---

## 4. FAQPage schema

7 вопросов на каждой city page. Минимум 5 на brand/service pages.

**Distribution:**
- 1-2 про same-day availability с упоминанием ZIP
- 1 про luxury brands (если есть)
- 1 про diagnostic fee
- 1 про warranty
- 1-2 city/brand specific

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "...",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "..."
      }
    }
  ]
}
```

---

## 5. Title and meta description rules

| Type | Length target | Hard limit |
|---|---|---|
| `<title>` | 50-60 chars | **60 chars** (Google SERP truncation) |
| `<meta description>` | 150-160 chars | **160 chars** |

**Rule:** Title должен содержать city + CA + ключевой запрос. Description — city + 2-3 района + телефон.

### Title — что НЕ кладём (Wave 39 Phase 1, 2026-05-06)

1. **Телефон в `<title>`** — никогда. Ни литералом `(424) 325-0520`, ни через template literal `${branch.phone}` / `${displayPhone}`. Телефон живёт в Hero / TrustBar / NAP — не в SERP-сниппете. Отнимает 14+ символов от полезного контента.
2. **Brand-tail `" | Same Day Appliance Repair"`** в конце title — никогда. Google и так знает имя сайта (отображает домен под snippet). Brand-tail просто съедает 30 символов хвоста title.
3. **Orphan separators** (`|`, `·`, `—`) на конце после strip — обязательно убирать.

**Допустимо:** Brand в начале title, если страница ИМЕННО о бренде или это homepage (например, `Same Day Appliance Repair | Los Angeles & Southern California` — homepage, brand НЕ tail а start). Brand в середине title с geo-qualifier (`Appliance Repair Blog | Same Day Appliance Repair Los Angeles`) — авторская формулировка, кандидат для Phase 2 manual rewrite.

### Brand title templates (Wave 39 Phase 2A, 2026-05-06)

Применяется ко всем `src/pages/brands/*.astro` (416 страниц).

| Тип | Primary template | Fallback (>60 chars) |
|---|---|---|
| **Brand pillar** (`/brands/{slug}/`) | `{Brand} Appliance Repair Los Angeles — Same Day` | `{Brand} Appliance Repair LA — Same Day` |
| **Brand × category** (`/brands/{slug}-{cat}-repair/`) | `{Brand} {Category} Repair Los Angeles — Same Day` | `{Brand} {Category} Repair LA — Same Day` |

`{Brand}` = display name из `audit-output/brand-display-map.json` (167 entries, derived from existing pillar titles + manual overrides for irregular casing — Sub-Zero, JennAir, GE, KitchenAid, BlueStar, ZLINE, Fisher & Paykel, etc.).

`{Category}` = display name из category dictionary в `scripts/wave-39-phase2a-sweep.py` (Refrigerator, Wall Oven, Wine Cooler, BBQ Grill, etc.).

**Skip rule (preserve custom titles):** если existing title `<= 60 chars` И `!= new template title`, sweep пропускает файл. Sweep НЕ ломает hand-written titles, только переписывает overflow + template-matching.

**Phase 2A sweep results:** 344 files swept, 23 preserved as custom. 412/416 (99%) brand pages now ≤60 chars. 4 above-60 are HTML-entity-encoding artifacts (`&` → `&amp;` inflates dist render — Google decodes entities so functionally still ≤60) or out-of-scope (`brands/index.html` hub).

### Commercial title templates (Wave 39 Phase 2B, 2026-05-06)

Применяется ко всем `src/pages/commercial/*.astro` (157 страниц). Page type определяется по структуре пути.

| Тип страницы | Path pattern | Template |
|---|---|---|
| **Service hub** | `commercial/{equipment}-repair.astro` или `commercial/{equipment}/index.astro` | `Commercial {Equipment} Repair Los Angeles — Same Day` |
| **Brand page** | `commercial/{equipment}-repair/brands/{brand}.astro` | `{Brand} {Equipment} Repair Los Angeles — Same Day` |
| **Sub-service variant** (equipment subtype) | `commercial/{equipment}-repair/{variant}-repair.astro` | `Commercial {Variant} Repair Los Angeles — Same Day` |
| **Sub-service failmode** (problem) | `commercial/{equipment}-repair/{problem}.astro` | `Commercial {Equipment} {Problem} LA — Same Day` |
| **Sub-service vertical** (industry wrap) | `commercial/{equipment}-repair/{vertical}-laundry-repair.astro` | `{Vertical} Repair Los Angeles — Same Day` |
| **Refrigeration sub** | `commercial/refrigeration/{equipment}-repair.astro` | `Commercial {Equipment} Repair Los Angeles — Same Day` |

Fallback (>60): replace `Los Angeles` → `LA`. For failmodes ещё доп-fallback: drop `Commercial` prefix → drop equipment if needed.

`{Equipment}` / `{Brand}` / `{Variant}` / `{Problem}` derived from curated dictionaries в `scripts/wave-39-phase2b-audit.py` (50 equipment, 42 brand, 80 sub-service entries).

**Phase 2B sweep results:** 154 files swept, 2 preserved as custom (≤60 + ≠ template), 1 skipped (commercial/index.astro main hub). 156/157 (99.4%) commercial pages now ≤60 chars. The 1 above-60 is `exhaust-hood-repair` — `&` → `&amp;` HTML-entity inflation (source 57 chars, dist 61 with entity).

**Phase 1 sweep results (commit предыдущий):** 151 файл — strip только из `<title>` / `title:` / `const title = ...` контекстов; body / hero / schema / meta description НЕ трогали.

**Phase 2 candidates:** 667 файлов с titles > 60 chars (после template-literal expansion). См. `audit-output/wave-39-phase2-candidates.txt`. Распределение:
- brands/: 338
- commercial/: 154
- services/: 71
- outdoor/: 48
- credentials/, price-list/, for-business/: 17
- city pillars: 39
- blog: 1

Phase 2 — manual rewrite, не sweep. Фокус: brand pages (largest cluster) → commercial → services → outdoor.

---

## 6. URL conventions

**Pillars:**
- `/[city]/` — city pillar
- `/services/[service]/` — service hub
- `/brands/[brand]/` — brand pillar (geo-neutral)
- `/[county]-county/` — county hub
- `/commercial/[type]/` — commercial pillar
- `/outdoor/[type]/` — outdoor living pillar

**Sub-pages:**
- `/[city]/[service]/` — city × service combo (parametric)
- `/services/[service]/[failure-mode]/` — sub-service (failure modes: not-draining, not-heating, error-codes)
- `/brands/[brand]-[category]-repair/` — brand × category (e.g. `lg-washer-repair`)

**Brand pillar vs brand × category — раздельные SEO targets, не редиректы.**
`/brands/{slug}/` = широкий brand pillar (covers full brand surface — all categories, history, models, lineup). `/brands/{slug}-{category}-repair/` = targeted combo (one category, deeper). Cross-link через internal href в обе стороны, **никогда** через 301. Если pillar redirected на одну из своих category-suffixed страниц, broad-brand search intent теряется навсегда (Google не видит pillar в индексе). Wave 40b восстановил 4 неправильно скрытых pillars (sub-zero, thermador, miele, viking) + добавил cross-link block на каждый.

**НЕ создавать:**
- `/services/[category]/brands/[brand]/` — дубликат `/brands/[brand]-[category]-repair/`
- `/areas/[city]/` (deprecated, used to exist on legacy)

**Sub-services под pillar — failure modes, NOT brands:**
```
✅ /services/dishwasher-repair/not-draining/
✅ /services/dryer-repair/not-heating/
✅ /services/oven-repair/error-codes/

❌ /services/dishwasher-repair/lg/  (дубль /brands/lg-dishwasher-repair/)
```

---

## 7. Sitemap

`sitemap-index.xml` генерируется Astro автоматически.
Проверять после каждого major release:
- Submit в GSC: `https://samedayappliance.repair/sitemap-index.xml`
- Verify в Bing Webmaster (auto через GSC sync)

---

## 8. Robots.txt

Должен разрешать всем crawlers, кроме directories/aggregators которые скрапят:
- (текущий список TBD — добавить после next robots.txt audit)

---

## 9. Internal linking rules

- City pillar линкует на 5-10 nearby cities (`nearby` array из cities.ts)
- City × service линкует на: city pillar (parent), service hub (parent), nearby cities × same service (3-5)
- Brand pillar линкует на brand × category subs (LG → LG washer, LG dryer, LG refrigerator)
- County hub линкует на все cities в этом county

**Avoid:**
- Cross-county links без причины (Riverside city → LA city = диссонанс для пользователя)
- Linking на own URL (self-references вне breadcrumbs)
- Linking на 404 / redirected URLs (после Wave 32 redirects)

---

## 10. IndexNow + GSC submission

После значимого batch (10+ pages):
- Auto-ping IndexNow на новые URLs (Cloudflare Pages не делает автоматически — manual ping или API)
- В GSC submit sitemap re-crawl на дочерние URLs если индексация важна

API key IndexNow: `32c2d9cecb72408cbd6f91136388e33a` (хранится в `public/{key}.txt`)
