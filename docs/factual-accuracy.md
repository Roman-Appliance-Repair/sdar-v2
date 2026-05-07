# Factual Accuracy

> Бренды, лицензии, юр. лицо. Эти факты нельзя сочинять — Google проверит.
> При сомнении: лучше не упомянуть, чем выдумать.

---

## 1. Brand ownership — часто путают

| Бренд | Owner | Не путать с |
|---|---|---|
| **True Manufacturing** | Trulaske family (commercial) | True Residential (Middleby) — это другая компания |
| **Perlick** | Wisconsin family company с 1917, **независимая** | Не Ali Group |
| **AHT Cooling Systems** | Daikin (с 2017) | Не Ali Group |
| **Beverage-Air** | Ali Group (с ~2005) | — |
| **GE Appliances** (Monogram, Profile, Café) | Haier (с 2016) | Не General Electric corporation |
| **Sub-Zero / Wolf / Cove** | Sub-Zero Group, Inc. (Madison, WI) | — |
| **Fulgor Milano US** | Fulgor USA LLC + Maple Distributing | Не «Fulgor Americas» |
| **Thermador** | BSH Home Appliances | — |
| **Viking** | Middleby Residential | — |
| **Dacor** | Samsung (с 2016) | — |
| **JennAir / KitchenAid / Maytag** | Whirlpool | — |

## 2. Что бренды НЕ делают (частая ошибка)

| Бренд | Не делает |
|---|---|
| **Wolf** | residential refrigerators, dishwashers (только cooking) |
| **Sub-Zero** | dishwashers (только refrigeration + wine/beverage centers) |
| **KitchenAid** (US) | washers, dryers — не продают в США |
| **JennAir** (US) | washers, dryers — не продают в США |
| **Bosch** | НЕ так — Bosch ДЕЛАЕТ freestanding ranges для US (частая ошибка наоборот) |

## 3. Лицензии — где упоминать

**FINAL policy (2026-05-07):** все 4 credentials рендерятся site-wide — schema (`hasCredential` array) на каждой LocalBusiness + visible footer. Это нужно для NAP/credential match с LSA и для trust restoration.

| Credential | Применение | Никогда |
|---|---|---|
| **BHGS #A49573** | Везде (все 1009 страниц, schema + visible footer) | — |
| **EPA 608 Universal #1346255700410** | Везде | — |
| **CSLB C-20 HVAC** | Везде (зарегистрирована и заявлена в LSA, нужна для NAP match) | Не подписывать как BHGS — это разные регуляторы |
| **BBB Accredited Business** | Везде (БЕЗ буквы рейтинга — на BBB реально A, не A+) | "BBB A+" — false claim, никогда |

**BBB rating note:** на bbb.org реальный grade = **A** (не A+). Писать "A+" в visible UI или schema = false-advertising claim. Только "BBB Accredited Business" без буквы. Сам grade Google и так не подтянет в SERP — accreditation status сам по себе trust signal.

**HVAC 777 LLC имеет 3 BBB профиля** (LA Wilshire / WeHo Rangely / Pasadena Columbia) — это нормально для multi-location LLC и не требует sync с сайтом. На сайте отражаем только GMB-verified WeHo physical pin.

Терминология BHGS: BHGS выдает **registration** (не license). Везде в visible UI — «BHGS #A49573» или «BHGS Registration #A49573». Не «BHGS Licensed», не «CSLB License #A49573», не «CA BHGS #A49573».

**Изменения 2026-05-07** (vs Wave 35 NAP sweep 2026-05-06):
- CSLB C-20 возвращён site-wide (был удалён в Wave 35 как «не нужен HVAC site»). Возвращён, потому что зарегистрирован у CSLB и заявлен в Google LSA — на сайте должен совпадать.
- BBB Accredited Business добавлен как 4-й credential.
- CSLB C-38 окончательно удалён из policy (не используется).

## 4. Юридическое лицо

- **Юр. название:** HVAC 777 LLC dba Same Day Appliance Repair
- **В schema (`legalName` field):** HVAC 777 LLC — в JSON-LD на legal/contact страницах
- **В visible UI:** упоминается ТОЛЬКО в footer copyright line `© 2026 HVAC 777 LLC dba Same Day Appliance Repair`
- **Адрес юр. лица (PMB на Wilshire) больше нигде не рендерится** — только legal entity name остался для copyright

## 5. NAP — physical pin

- **Единственный публичный адрес сайта:** **8746 Rangely Ave Ste, West Hollywood, CA 90048**
- Это `address` поле у WeHo branch в `branches.ts` (type: `physical_pin`)
- **GMB-verified** — этот адрес показывается в Google Maps для WeHo profile.

**Pin pages (6 страниц рендерят streetAddress в schema):**
1. `/` — homepage primary LocalBusiness
2. `/west-hollywood/` — WeHo city pillar
3. `/contact/` — WeHo entry в location array
4. `/book/` — booking schema
5. `/privacy-policy/` — legal page schema
6. `/terms/` — legal page schema

Все остальные ~1003 страницы (city pages, brand pages, services, commercial, outdoor) — без `streetAddress` в schema. Все non-WeHo branches = `service_area` type.

**6230 Wilshire / PMB 2267** — mailing address юр. лица (PMB), нигде на сайте не светим. BBB профиль HVAC 777 LLC в LA указывает 6230 Wilshire — это normal для multi-location LLC, на сайте/в schema отражаем только WeHo physical pin (8746 Rangely).

**HVAC 777 LLC имеет 3 BBB профиля** (LA Wilshire / WeHo Rangely / Pasadena Columbia) — multi-location LLC, sync с сайтом не нужен. Сайт показывает только GMB-verified WeHo address.

## 6. Aggregate Rating

**FINAL policy (2026-05-07): AggregateRating НЕ используется НИГДЕ — ни в JSON-LD, ни в visible UI.**

- Google и так берёт rating напрямую из GMB и показывает в SERP / Maps. Дублировать в schema не нужно.
- Schema `aggregateRating` brittle: создаёт mismatch risk (на GMB сейчас 4.7/36, в schema было 4.6/37 — расхождение → потенциальный structured-data warning + trust signal degradation).
- Никаких «★ 4.6», «37 Google reviews», звёзд в hero, чисел в footer.
- Если когда-нибудь захочется review schema, делать только через `Review` schema на отдельных testimonial pages с реальными verifiable отзывами — не через `aggregateRating` поверх GMB.

**Текущий GMB (для информации, нигде не пишем):** 4.7 / 36 reviews на WeHo profile. Site/schema этих чисел не содержат.

**Изменение 2026-05-07** (vs Wave 35): aggregateRating убран отовсюду. До этого был в JSON-LD на 4 legal pages + West Hollywood pillar + LA SAB pillar (через `branches.ts.aggregateRating`). Теперь — нигде.

## 7. Wood-burning fireplaces — исключены

SCAQMD (South Coast Air Quality Management District) restrictions:
- ❌ Wood-burning fireplaces — не упоминать как услугу
- ✅ **Gas fireplaces** — да (это и есть наш fireplace-repair)
- ✅ **Electric fireplaces** — да

## 8. Часы работы

**Canonical visible string (использовать везде на сайте):**
`Mon–Sat 8am–8pm · Sun closed · Phone answered 24/7`

Никаких других вариантов: ни "8am-7pm", ни "Sun 9am-5pm", ни "Hours: 8 AM to 8 PM",
ни таблиц с днями. Один канон. Импортируется из `BUSINESS_HOURS.display`
в `src/data/business-hours.ts`.

**Schema OpeningHoursSpecification (везде):**
- Mon-Sat 08:00-20:00 (single block с массивом dayOfWeek)
- Sunday `00:00-00:00` (Google's "closed" pattern)
- Импортировать из `OPENING_HOURS_SCHEMA` в `src/data/business-hours.ts`

**FAQ answer rules:**
Sunday questions отвечаем «closed for in-person, but phones 24/7». Не утверждать
что мы открыты по воскресеньям.

❌ Старые форматы НЕ использовать:
- Mon-Fri 07:00-21:00 + Sat 08:00-19:00 + Sun 09:00-17:00 (3-block split)
- Mon-Sun 00:00-23:59 (always-open claim)
- "8am-7pm и Sunday 9am-5pm"

Унифицировано в Wave 36 hours sweep (2026-05-06).

## 9. Цены

| Tier | Сумма | Применение |
|---|---|---|
| Residential diagnostic | **$89** | Только residential pages — refrigerator, washer, dryer, oven, etc. |
| Commercial diagnostic | **$120** | Только commercial pages — walk-in cooler, ice machines, commercial refrigeration |
| Both waived с repair | да | Упоминать явно: "fee waived when you approve the repair" |

❌ **Никогда** не показывать оба ценника на одной странице. Mixed-scope pages — выбираем по основному audience.

## 10. Технический персонал — имена

В текстах разрешены 3 имени:
- **Mikhail V.**
- **Artur S.**
- **David K.**

Распределение по филиалам (внутреннее, для текстов / quote attributions):
- Mikhail V. → West Hollywood, Beverly Hills, LA
- Artur S. → Pasadena, Thousand Oaks
- David K. → Irvine, Rancho Cucamonga, Temecula

## 11. Branch phones (8 филиалов)

| Branch | Phone | Email | Status |
|---|---|---|---|
| West Hollywood | (323) 870-4790 | support@samedayappliance.repair | Live (physical_pin, GBP verified) |
| Beverly Hills | (424) 248-1199 | beverlyhills@samedayappliance.repair | Live (service_area, GBP unverified) |
| Los Angeles | (424) 325-0520 | info@samedayappliance.repair | Live (service_area, GBP verified SAB) |
| Pasadena | (626) 376-4458 | pasadena@samedayappliance.repair | Live |
| Thousand Oaks | (424) 208-0228 | thousandoaks@samedayappliance.repair | Live (GBP verified SAB) |
| Irvine | (213) 401-9019 | irvine@samedayappliance.repair | Live |
| Rancho Cucamonga | (909) 457-1030 | ranchocucamonga@samedayappliance.repair | Live (real DID, GBP pending) |
| Temecula | (951) 577-3877 | temecula@samedayappliance.repair | Live (real DID, GBP pending) |

**Источник правды:** `src/data/branches.ts` — не дублировать здесь при изменениях.
