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

| Лицензия | Применение | Никогда |
|---|---|---|
| **BHGS Registration #A49573** | Везде (главная appliance license) | — |
| **EPA 608 Universal #1346255700410** | Везде | — |

❌ **CSLB C-20 HVAC** — НЕ используется на этом сайте (это appliance repair, не HVAC).
❌ **CSLB C-38 Refrigeration** — НЕ используется (BHGS покрывает refrigeration scope).
❌ **Старая лицензия CSLB #1138898** — устарела, нигде не использовать.

Терминология: BHGS выдает **registration** (не license). Везде в visible UI — «BHGS Registration #A49573» или короткая форма «BHGS #A49573». Не «BHGS Licensed», не «CSLB License #A49573», не «CA BHGS #A49573» — все унифицировано в Wave 35 NAP sweep (2026-05-06).

## 4. Юридическое лицо

- **Юр. название:** HVAC 777 LLC dba Same Day Appliance Repair
- **В schema (`legalName` field):** HVAC 777 LLC — в JSON-LD на legal/contact страницах
- **В visible UI:** упоминается ТОЛЬКО в footer copyright line `© 2026 HVAC 777 LLC dba Same Day Appliance Repair`
- **Адрес юр. лица (PMB на Wilshire) больше нигде не рендерится** — только legal entity name остался для copyright

## 5. NAP — physical pin

- **Единственный публичный адрес:** **8746 Rangely Ave, West Hollywood, CA 90048**
- Это `address` поле у WeHo branch в `branches.ts` (type: `physical_pin`)
- Рендерится только в JSON-LD на WeHo pillar (`/west-hollywood/`) + Hollywood pillar (мapит на WeHo branch) + homepage primary LocalBusiness schema + contact page
- **Все остальные branches** = `service_area` type, без public streetAddress
- **6230 Wilshire / PMB 2267** (старый адрес почтового ящика) — удалён из всего sdar-v2 в Wave 35 NAP sweep (2026-05-06). Был в footer + 87 JSON-LD блоков как мусорный legacy. Не возвращать.

## 6. Aggregate Rating

- **4.6 / 37 reviews** — взято из реального GMB West Hollywood profile
- **Только в JSON-LD** на 4 legal pages + West Hollywood pillar
- **Никогда не показывать** в visible UI: ни «★ 4.6», ни «37 Google reviews», ни звёзды в hero
- **Не фабриковать** — не повышать до 4.9, не округлять до 5.0
- **При обновлении:** вручную из GMB, не выдумывать промежуточные значения

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
