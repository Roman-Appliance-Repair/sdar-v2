# SEO Policies

> NAP/Rating SSOT. JSON-LD rules. Schema types. Indexable URL conventions.

---

## 1. NAP / Rating Policy (SSOT)

**Закон (FINAL, 2026-05-07):**

1. **AggregateRating НЕ используется нигде** — ни в JSON-LD, ни в visible UI. Google берёт rating напрямую из GMB. Schema rating brittle и создаёт mismatch risk. Никаких «★ 4.6», «37 reviews», звёзд, чисел.

2. **streetAddress `8746 Rangely Ave Ste, West Hollywood, CA 90048`** → в schema только на 6 pin pages:
   - `/` (homepage primary LocalBusiness)
   - `/west-hollywood/` (WeHo city pillar)
   - `/contact/` (WeHo entry в location array)
   - `/book/`
   - `/privacy-policy/`
   - `/terms/`

3. **`legalName: "HVAC 777 LLC"`** → во всех LocalBusiness schema на всех 1009 страницах (не только pin pages, не только legal). В visible UI — только в footer copyright line `© 2026 HVAC 777 LLC dba Same Day Appliance Repair`.

4. **`hasCredential` array (4 entries) site-wide** — на каждом LocalBusiness schema:
   - BHGS Registration #A49573
   - EPA 608 Universal #1346255700410
   - CSLB C-20 HVAC
   - BBB Accredited Business (БЕЗ буквы рейтинга — на BBB реально A, не A+)

5. **`location` array (все 8 филиалов)** → на гео-нейтральных страницах: `/`, `/contact/`, `/book/`, и ~700 страниц без city anchor (services hubs, brand pages, commercial, outdoor, sub-services, price list, credentials). Все 8 — `LocalBusiness` entries с branch phone + service_area.

6. **City pages (87) + city × service combos (908)** → single LocalBusiness своего primary branch, БЕЗ location array (не дублируем все 8 веток на каждой city page — geographic specificity побеждает).

7. **`6230 Wilshire / PMB 2267`** — mailing-only PMB юр. лица. Нигде на сайте/в schema не рендерится.

8. **License labeling** — везде «BHGS #A49573» или «BHGS Registration #A49573». Не «BHGS Licensed», не «CSLB License #A49573», не «CA BHGS». CSLB C-20 не подписывать как BHGS — это разные регуляторы (CSLB issues C-20, BHGS issues registration).

9. **«BBB A+»** — никогда. Реальный grade на bbb.org = A. False-advertising risk. Только «BBB Accredited Business» без буквы.

**Verification (post-deploy на любую dist page):**
```bash
grep -c "aggregateRating" <page>          # = 0
grep -c "BBB A+" <page>                   # = 0
grep -c "6230 Wilshire" <page>            # = 0
grep -c "BHGS Licensed\|CA BHGS"  <page>  # = 0
```

**Изменения 2026-05-07** (vs Wave 35 NAP sweep 2026-05-06):
- aggregateRating убран отовсюду (был в JSON-LD на 5 страницах).
- BBB Accredited Business добавлен как 4-й credential (был "BBB A+" в некоторых старых местах — false claim).
- CSLB C-20 возвращён site-wide (был удалён в Wave 35; нужен для NAP/LSA match).
- legalName policy расширен на все 1009 страниц (был на legal pages only).
- location array (все 8 branches) policy сформулирован для гео-нейтральных страниц.
- streetAddress pin pages =  6 (homepage + WeHo + contact + book + privacy + terms; больше не Hollywood pillar).
- streetAddress canonical form: «8746 Rangely Ave Ste, West Hollywood, CA 90048» (был "8746 Rangely Ave"; уточнено "Ste").

Текущий статус (2026-05-07): **policy переписана, code/schema sync — отдельный P0 commit** (см. current-status.md).

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

**Базовый шаблон (все 1009 страниц):**

```json
{
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "[см. таблицу ниже — буквальный name из branches.ts]",
  "legalName": "HVAC 777 LLC",
  "telephone": "[branch phone, никогда head office]",
  "email": "[branch email]",
  "url": "https://samedayappliance.repair/[path]/",
  "areaServed": [{ "@type": "City", "name": "..." }],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "08:00",
      "closes": "20:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Sunday",
      "opens": "00:00",
      "closes": "00:00"
    }
  ],
  "priceRange": "$$",
  "hasCredential": [
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "license",
      "name": "BHGS Registration", "identifier": "A49573" },
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "certification",
      "name": "EPA 608 Universal", "identifier": "1346255700410" },
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "license",
      "name": "CSLB C-20 HVAC" },
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "membership",
      "name": "BBB Accredited Business" }
  ]
}
```

**`legalName: "HVAC 777 LLC"` рендерится во ВСЕХ schema** (не только legal/pin pages). Закон обновлён 2026-05-07.

**`hasCredential` (4 entries) рендерится во ВСЕХ schema** site-wide. BBB — БЕЗ буквы рейтинга (на BBB реально A, не A+).

### Name field — буквально из таблицы (8 строк зафиксированы)

`name` берётся из `branches.ts` per-branch и не модифицируется. WeHo и LA = `Same Day Appliance Repair, CA Location` (без города в имени, потому что они корпоративные хабы); остальные 6 веток = `Same Day Appliance Repair [City], CA Location` с городом.

### Pin pages добавляют `address` (6 страниц):

`/`, `/west-hollywood/`, `/contact/`, `/book/`, `/privacy-policy/`, `/terms/`

```json
"address": {
  "@type": "PostalAddress",
  "streetAddress": "8746 Rangely Ave Ste",
  "addressLocality": "West Hollywood",
  "addressRegion": "CA",
  "postalCode": "90048",
  "addressCountry": "US"
}
```

### Гео-нейтральные страницы добавляют `location` (все 8 филиалов)

`/`, `/contact/`, `/book/`, services hubs, brand pages, commercial, outdoor, sub-services, price list, credentials → `location` array со всеми 8 branches как `LocalBusiness` entries (branch phone + service_area + opening hours).

### City pages (87) + city × service combos (908) — single branch

Без `location` array. Single LocalBusiness своего `primaryBranch` (per `cities.ts`). Geographic specificity побеждает on-page (Beverly Hills page = Beverly Hills branch, не все 8).

### `aggregateRating` — НЕ ИСПОЛЬЗУЕТСЯ

Удалён отовсюду 2026-05-07. Никаких `aggregateRating` blocks ни на pin pages, ни на brand pages, ни где-либо ещё. Google читает rating из GMB.

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

### Service + outdoor title templates (Wave 39 Phase 2C, 2026-05-06)

Применяется ко всем `src/pages/services/*.astro` (77) + `src/pages/outdoor/*.astro` (50) = 127 страниц.

| Тип | Path pattern | Template |
|---|---|---|
| **Service hub** | `services/{slug}-repair.astro` | `{Service} Repair Los Angeles — Same Day` |
| **Service sub-service** (failure) | `services/{slug}-repair/{problem}.astro` | `{Service} {Problem} Repair LA — Same Day` |
| **Outdoor hub** | `outdoor/{slug}-repair.astro` (no city suffix) | `{Equipment} Repair Los Angeles — Same Day` |
| **Outdoor city-targeted** | `outdoor/{slug}-repair-{city}.astro` | `{Equipment} Repair {City} — Same Day` |
| **Outdoor brand pillar** | `outdoor/brands/{brand}.astro` | `{Brand} Outdoor Grill Repair Los Angeles — Same Day` |
| **Outdoor brand sub** | `outdoor/{equip}-repair/brands/{brand}.astro` | `{Brand} {Equipment} Repair Los Angeles — Same Day` |
| **Outdoor sub-service** | `outdoor/{equip}-repair/{problem}.astro` | `{Equipment} {Problem} Repair LA — Same Day` |
| **Outdoor maintenance** | `outdoor/{slug}-maintenance.astro` | `{Equipment} Maintenance Los Angeles — Same Day` |

Fallback (>60): drop `Los Angeles` → `LA`; для sub-services также drop `Repair` keyword. Для city-targeted: `LA` НЕ добавляется — city уже даёт гео.

Curated dictionaries: 28 SERVICE_DISPLAY entries (Refrigerator, Wall Oven, Wine Cooler, Dryer Vent, Trash Compactor, etc.), 50 PROBLEM_DISPLAY entries (Not Heating, Burner Not Igniting, Surface Cracked, Wood-to-Gas Conversion, etc.), 12 OUTDOOR_EQUIPMENT entries (Outdoor Grill, BBQ Grill, Outdoor Kitchen, Patio Heater, Smoker, Outdoor Refrigerator, etc.), 24 OUTDOOR_BRAND entries (Lynx, Fire Magic, Twin Eagles, DCS, Kalamazoo, Sunpak, Big Green Egg, Traeger, etc.), 89 CITY_DISPLAY entries (all SoCal cities).

**Phase 2C sweep results:** 118 files swept, 7 preserved as custom (≤60 + ≠ template), 2 skipped (services/index.astro + outdoor/index.astro main hubs). 159/163 (97.5%) services + outdoor pages now ≤60 chars. The 4 above-60 are out-of-scope: 2 main hubs (intentionally skipped) + 2 Astro redirect HTMLs (`Redirecting to:` transit pages with noindex). **0 real content pages above 60.**

### City pillar + parametric template (Wave 39 Phase 2D, 2026-05-06)

Финальная фаза Wave 39:

| Тип | Path | Template |
|---|---|---|
| **City pillar** | `pages/{city}.astro` | `Appliance Repair {City} CA — Same Day Service` |
| **County hub** | `pages/{county}-county.astro` | `Appliance Repair {County} County CA — Same Day` |
| **City × service combo** | `pages/[city]/[service].astro` (parametric, 200+ pages) | `${serviceName} ${cityName} — Same Day` |

`{City}` resolved from `src/data/cities.ts` (89 entries). City × service template is a single-line fix in the parametric source — affects ALL combo pages site-wide, not file-per-file.

Misc per-file rewrites for legal/utility/hub pages (homepage, contact, book, privacy, terms, services-hub, outdoor-hub, brands-hub, exhaust-hood-hub, 6 credentials/, 6 price-list/, 5 for-business/).

**Phase 2D sweep results:** 60 files changed (city pillars + county hubs + misc) + 200+ city × service combos via parametric template fix + 56 preserved custom. **Final whole-dist distribution:** ≤50=708 (69%), 51-60=298 (29%), 61-70=12 (1.2%), >70=8 (0.8%) — out of 1026 non-redirect HTML pages.

**20 still >60:** 16 blog post titles (authored editorial content, length intentional) + 4 HTML-entity-inflation artifacts (`&` → `&amp;` in kolpak-walk-in-repair, hoshizaki, fisher-paykel-refrigerator-repair, exhaust-hood-repair — source ≤60, Google decodes entities). **0 actual problematic content titles.**

**Wave 39 series total:** 667 over-60 → 20 (4 dist-entity + 16 authored blog) = **99.7% closed by length, 100% closed for SEO-actionable content.**

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
