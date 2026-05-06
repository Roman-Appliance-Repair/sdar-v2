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
| **BHGS #A49573** | Везде (главная appliance license) | — |
| **EPA 608 Universal #1346255700410** | Везде | — |
| **CSLB C-20 HVAC** | Только HVAC pages (heating/cooling/ventilation) | На appliance-only страницах |
| **CSLB C-38 Refrigeration** | Только walk-in coolers/freezers, ice machines, commercial refrigeration | На gas equipment, cooking, residential |

❌ **Старая лицензия CSLB #1138898** — устарела, нигде не использовать. Если встретишь в старых docs — это от пред-2025 периода.

## 4. Юридическое лицо

- **Юр. название:** HVAC 777 LLC dba Same Day Appliance Repair
- **В schema (`legalName` field):** HVAC 777 LLC — только в JSON-LD
- **В видимом UI:** **никогда** не упоминать «HVAC 777 LLC»
- **Исключения** где можно упомянуть legalName в JSON-LD: book, contact, privacy-policy, terms (4 страницы)

## 5. NAP — physical pin

- **Адрес:** 6230 Wilshire Blvd Ste A PMB 2267, Los Angeles CA 90048
- **Этот адрес** = только в schema **West Hollywood pillar** + 4 legal pages
- **Все остальные страницы** — areaServed без streetAddress
- **Legacy schema** (старый сайт) использовал `streetAddress` везде — это исправлено в Wave 29-31, не возвращать

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

- **Mon-Sat:** 8:00 AM – 8:00 PM
- **Sunday:** Closed
- **Phone:** 24/7 answered (но это про call answering, не про дежурство)
- **Schema OpeningHoursSpecification:** должен отражать Mon-Sat 08:00-20:00 + Sunday closed
- ❌ Старые часы «Mon-Fri 7am-9pm, Sun 9-17» — устарели, не использовать

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

| Branch | Phone | Status |
|---|---|---|
| West Hollywood | (323) 870-4790 | Live |
| Beverly Hills | (323) 870-4790 | Использует West Hollywood phone |
| Los Angeles | (424) 325-0520 | Live |
| Pasadena | (626) 376-4458 | Live |
| Thousand Oaks | (424) 208-0228 | Live |
| Irvine | (213) 401-9019 | Live |
| Rancho Cucamonga | placeholder | Real DID pending |
| Temecula | placeholder | Real DID pending |

**Источник правды:** `src/data/branches.ts` — не дублировать здесь при изменениях.
