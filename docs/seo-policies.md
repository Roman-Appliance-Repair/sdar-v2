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

**Известные нарушения** (Wave 36 sweep candidate):
- `san-gabriel.astro` — title 96 chars
- `services/washer-repair.astro` — title 86 chars

**Rule:** Title должен содержать city + CA + ключевой запрос. Description — city + 2-3 района + телефон.

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
