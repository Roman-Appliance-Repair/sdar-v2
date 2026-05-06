# GMB Strategy

> Где открывать Google Business Profiles и почему.
> Принцип: доход важнее размера, gap-анализ важнее популярности.

---

## 1. Текущий статус GMB profiles

| Локация | Статус | Зона покрытия | Телефон |
|---|---|---|---|
| West Hollywood | ✅ Активен | WeHo, Beverly Hills, Hollywood | (323) 870-4790 |
| Los Angeles | ✅ Активен | Santa Monica, Brentwood, Culver City | (424) 325-0520 |
| Thousand Oaks | ✅ Активен | Ventura County | (424) 208-0228 |
| Pasadena | 🔄 На одобрении | Pasadena + East LA | (626) 376-4458 |
| Irvine | 🔄 На одобрении | Orange County | (213) 401-9019 |

---

## 2. Roadmap — следующие 4 GMB локации

### Приоритет 1 — LA County: Glendale (либо Burbank)

**Обоснование:** Burbank показывает **15,516 показов/мес** при CTR 0.02% и 3 кликах (GSC данные). Это критическая аномалия — органика уже работает, но пользователи не видят компанию в Google Maps. Открытие GMB в Glendale/Burbank напрямую конвертирует существующий трафик в звонки **без дополнительного SEO-контента**.

**Glendale предпочтительнее Burbank:** армянская аудитория + выше средний доход, более премиальный паттерн поиска.

### Приоритет 2 — LA County: Long Beach

Население 500K+, ближайший активный GMB — West Hollywood (35+ км). Google Maps ранжирует по расстоянию от профиля — текущие профайлы физически слишком далеко. Long Beach — крупный незакрытый рынок.

### Приоритет 3 — San Bernardino County: Chino Hills

Не Rancho Cucamonga, несмотря на то что Rancho крупнее.

| Критерий | Chino Hills | Rancho Cucamonga |
|---|---|---|
| Средний доход | $110K+ | $95K+ |
| Целевая аудитория | Премиум (Sub-Zero, Viking) | Массовый рынок |
| Конкуренция в Maps | Минимальная | Умеренная |
| Покрытие соседних городов | Ontario, Upland, Diamond Bar | Fontana, Rialto (ниже доход) |

GMB в самом дорогом городе каунти → выше средний чек на ремонт luxury appliances.

### Приоритет 4 — Riverside County: Temecula

Самый богатый и быстрорастущий город Riverside ($110K+ средний доход). Минимальная конкуренция в Maps среди appliance repair. Покрывает также Murrieta.

---

## 3. Сводная roadmap

| # | Локация | Каунти | Волна | Обоснование |
|---|---|---|---|---|
| 1 | Glendale (или Burbank) | LA | Сейчас | 15K показов без Maps — fast win |
| 2 | Long Beach | LA | Сейчас | 500K+ город без покрытия |
| 3 | Chino Hills | San Bernardino | Wave 3 | Самый дорогой город SB County |
| 4 | Temecula | Riverside | Wave 3 | Самый дорогой город Riverside County |

---

## 4. Принципы выбора GMB локаций

| Принцип | Применение |
|---|---|
| **Доход важнее размера** | Открывать в самом дорогом городе каунти, не в самом крупном |
| **Gap-анализ по картам** | Перед каждым новым profile проверять радиус 20-25 км от существующих |
| **Органика сигнализирует** | Если город показывает 5K+ показов в GSC при CTR < 0.1% → открывать GMB, не только переписывать страницу |
| **Один profile — один каунти-хаб** | Не дублировать GMB внутри одного каунти без явной необходимости. Исключение: LA County (слишком большой) |
| **NAP синхронизация обязательна** | Phone, address, name в GMB должны точно совпадать с сайтом. Расхождение = снижение ранжирования |

---

## 5. Что нужно перед открытием нового GMB

### Pre-requisite checklist
- [ ] City pillar страница опубликована и проиндексирована (минимум 2 недели в индексе)
- [ ] Real DID phone number (не placeholder) — добавлен в `branches.ts`
- [ ] Office address (можно virtual office или PMB) — добавлен
- [ ] Branch entry в `branches.ts` создан
- [ ] City × service combos для топ-5 услуг написаны (refrigerator, washer, dryer, oven, dishwasher)
- [ ] Schema на city pillar содержит правильный `telephone` (новый branch phone)
- [ ] GMB photos готовы (см. @docs/photo-pipeline.md)

### Post-launch checklist
- [ ] GMB verification получено
- [ ] Schema sync — branch phone на сайте = GMB phone
- [ ] Hours sync — Mon-Sat 8-20 в GMB совпадает с сайтом
- [ ] Service categories выбраны корректно (Appliance Repair Service primary)
- [ ] Photos uploaded (minimum 10: storefront + technicians + van + work scenes)
- [ ] First 5 reviews requested (от существующих real клиентов в этой зоне)

---

## 6. NAP rules для GMB consistency

**Главный физический пин (West Hollywood) ≠ остальные branches.**

- **West Hollywood:** physical address 6230 Wilshire Blvd Ste A PMB 2267 (только этот в schema streetAddress)
- **Other branches:** virtual office / PMB / service area only — НЕ показывать streetAddress в site schema (см. @docs/seo-policies.md §1)

GMB profile может иметь свой address (для Google), но visible на сайте = только West Hollywood.

---

## 7. Решения отложенные

- **Открывать GMB в самом дорогом городе каунти**, даже если он не самый крупный — обеспечивает premium positioning для Sub-Zero/Viking/Wolf клиентов
- **Не открывать дубли** в одном каунти кроме LA (LA County > Riverside County по площади)
- **Phone number per branch — обязательно уникальный** (не корпоративный multi-line, а реальный DID per location)
