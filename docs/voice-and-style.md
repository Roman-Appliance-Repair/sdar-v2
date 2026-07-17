# Voice and Style

> Применяется на КАЖДОЙ странице: hero, intro, recent repairs, FAQ, CTAs.
> Это не предложения — это правила. Конкретный текст всегда побеждает абстракцию.

---

## 1. Кто говорит

- **Subject:** Same Day Appliance Repair и её технические специалисты
- **Pronouns:** "our technicians", "we", "our team", "our techs", "our guys"
- **Никогда:** "I", "I've seen", "I recommend" — это компания, не один человек

## 2. Запрещённые фразы (никогда)

> **Этот список — единственный источник истины.** Никакой другой документ не заводит свой
> список запрещённых фраз. `factual-accuracy.md` запрещает **факты** (BBB A+, wood-burning,
> старые форматы часов) — это другое. `humanizer-gate.md` и `CLAUDE.md §5` ссылаются сюда и
> ничего не добавляют. Если фразы нет в этих двенадцати строчках — она **не запрещена**.

```
❌ "we understand the urgency"
❌ "certified technicians"
❌ "our team of experts"
❌ "look no further"
❌ "hassle-free"
❌ "peace of mind"
❌ "second to none"
❌ "top-of-the-line"
❌ "don't hesitate to call"
❌ "your satisfaction is our priority"
❌ "trusted name in the industry"
❌ "passionate about delivering"
```

### 2.1 Как это грепать (иначе получите ложную тревогу)

Аудит 2026-07-17 сначала насчитал **177 нарушений на 114 страницах**. После проверки по
этому списку и по контексту осталось **одно**. Все остальные были артефактами грепа:

- **Список — точный, а не тематический.** `"factory-trained"` в нём **НЕТ** и никогда не
  было; его посчитали запрещённым по памяти. `"certified technicians"` — **множественное
  число**, это штамп-похвальба. `EPA 608 certified technicians`, `gas-certified
  technicians`, `EPA-608 Universal Certified Technicians` — **не нарушения**: это конкретные
  допуски, которых `factual-accuracy.md §3` как раз требует. Все 35 найденных вхождений
  оказались такими, плюс пересказ Clean Air Act §608, который сам требует certified
  technicians. Голого штампа на сайте нет ни одного.
- **Дефис значим.** Запрещён `top-of-the-line` (штамп). `top of the line` про товарную
  линейку («Maytag MVWP sit at the top of the line») — это описание, не нарушение.
- **Цитаты неприкосновенны.** `peace of mind` на `/calabasas/` живёт внутри отзыва клиента
  (`text: '"…"'`). Править отзыв = фабриковать отзыв. Никогда.
- **Правило:** грепать → читать контекст каждого вхождения → только потом править. Число из
  грепа само по себе не значит ничего.

### 2.2 "Factory-trained" — статус

**Не запрещено.** В апреле 2026 writer-strategy кластера 17 (`wiki/page-plans/
METHODOLOGY-GAPS.md:823`, `wiki/handoff/terminal-T1-pause-2026-04-21-evening.md:1146`)
**предписывала** позиционирование «factory-trained appliance-repair authority» — отсюда
122 вхождения на страницах той эпохи.

**Status: pending Roman's factual ruling [дата будет проставлена при решении]** — прошли ли
техники программы обучения производителей, да или нет. До ответа фразу не трогаем.

**Защищено при любом исходе:** честные дисклеймеры вида «Are you Sub-Zero Factory-Certified?
**No, factory-trained but independent**», «We're not factory-certified, and we say so
plainly» (`/brands/sub-zero/`, `/brands/rational/`, `/brands/thermador/`, `/brands/bosch/`,
`/brands/miele/`, `/brands/cove/` и др., ~24 вхождения). Это ровно та честность, которой
требует `factual-accuracy.md`, и она отличает нас от конкурентов. Слепой свип их бы снёс.

## 3. Шесть правил живого голоса

### 3.1 Начинай intro с конкретного наблюдения о городе

```
✅ "West Hollywood is one of our busiest service areas — our guys are out
   here constantly."
✅ "Glendale is one of the more interesting cities we work in."
✅ "Santa Monica's housing stock runs the full range — beachfront condos
   on Ocean Ave, craftsman homes north of Montana, mid-century apartments
   in the Pico neighborhood..."
```

### 3.2 Называй конкретные улицы и районы

```
✅ "the condos in Norma Triangle where the washer-dryer is stacked in a
   closet the size of a phone booth"
✅ "fixing Sub-Zeros off Robertson, Bosch dishwashers in Boystown"
✅ "48-inch Wolf dual-fuel ranges, Thermador steam ovens, Miele dishwashers
   with custom panel fronts"
```

### 3.3 Показывай мышление техника, а не маркетинг

```
✅ "A thermal fuse blows for a reason. We don't just replace it and leave —
   we find what caused it."
✅ "This one would've come back within a week if we'd only replaced the fuse."
✅ "If your Sub-Zero 650 is warming up but the freezer is still cold, that's
   almost always the evaporator fan — happens more than people realize in
   WeHo's dry climate."
```

### 3.4 Recent repairs — пиши как разговор

Заголовок = как клиент сказал по телефону:
```
✅ "Freezer is fine but fridge section warm"
✅ "Washer fills with water but won't spin"
✅ "Oven won't reach temperature — turkey at 5pm"
```

Описание содержит:
- Specific model (Sub-Zero 650, LG WT7300CW, Wolf DF486G)
- Year-pattern observation (если есть)
- Что конкретно сделано
- Time-stamped human detail ("Customer had dinner guests — done by 4pm")

### 3.5 Vary sentence length — смешивай короткие и длинные

```
✅ "We pick up the phone. Not a call center. Not a dispatcher. When you call
   our Glendale number, someone who actually knows the schedule picks up and
   tells you honestly when we can be there."
```

### 3.6 Будь прямым о pricing

```
✅ "Our diagnostic fee is $89 — and that goes away the moment you say yes
   to the repair."
✅ "What we quote is what appears on the invoice. No surprises."
```

---

## 4. Сигналы экспертизы — что добавляет authority

| Что | Пример |
|---|---|
| **Specific model numbers** | "Sub-Zero 650", "LG WT7300CW", "Wolf DF486G", "Thermador PRG486JG" |
| **Year-patterns** | "We see this on 2018-2022 LG front-loaders constantly" |
| **OEM vs aftermarket** | "We use OEM Sub-Zero parts — the aftermarket evaporator fans don't last past a year" |
| **Climate-specific failures** | "WeHo's dry air → evaporator coil ice buildup на Sub-Zero" |
| **Repair-vs-replace honesty** | "If it's a 12-year-old GE Profile, the replacement compressor costs more than a new fridge — we'll tell you" |

---

## 5. Tone matrix по типу страницы

| Тип страницы | Tone | Длина body |
|---|---|---|
| **City pillar** | Локальный, конкретные районы, residents context | 1500-2500 слов |
| **City × service** | Service-focused + city anchor | 800-1500 слов |
| **Brand pillar** (LG, Samsung, Sub-Zero) | Technical depth, year-patterns, model coverage | 2800-3500 слов |
| **Brand sub** (combo pages) | Targeted, geographic-neutral | 1200-1800 слов |
| **Service hub** | What it covers + when to call | 1500-2500 слов |
| **Sub-service** (failure modes) | Diagnostic-focused, problem → fix | 1200-1800 слов |
| **County hub** | Coverage map + city list + general service | 1000-1500 слов |
| **Outdoor / commercial** | Scope-specific, lead-qualifying | 1500-2500 слов |

---

## 6. Bad → Good — три полных примера

### ❌ Плохо: корпоративный язык
```
"We understand the urgency of a broken appliance. Our certified technicians
are dedicated to providing top-of-the-line service. Customer satisfaction
is our top priority. Don't hesitate to call us today!"
```

### ✅ Хорошо: живой голос техника
```
"When our technicians get a call from Magnolia Park at 8am about a fridge
that stopped cooling overnight, we know exactly what that means — someone's
groceries are at risk and they need us there before noon. That's exactly
the kind of call we built Same Day Appliance Repair around."
```

---

### ❌ Плохо: сухой технический кейс
```
Title: "Sub-Zero 650 not cooling"
Desc: "Diagnosed failed evaporator fan motor and iced-over coils. Replaced
fan with OEM part, defrosted and cleaned coils. Unit back to temperature
same day."
```

### ✅ Хорошо: живой кейс с деталями
```
Title: "Freezer is fine but the fridge side won't cool"
Desc: "Classic evaporator fan failure on a Sub-Zero 650 — happens more than
people realize in WeHo's dry climate. Our tech replaced the fan motor with
an OEM Sub-Zero part, defrosted the coils that had iced over, and confirmed
stable temperatures before leaving. Customer had dinner guests that evening
— we were done by 4pm."
```

---

### ❌ Плохо: обобщённый intro
```
"Same Day Appliance Repair has been serving West Hollywood homeowners,
renters, and property managers for years with licensed, insured service
you can count on."
```

### ✅ Хорошо: конкретный intro с местным знанием
```
"West Hollywood is one of our busiest service areas — our guys are out here
constantly. The Sunset Strip high-rises, the vintage apartments off Melrose,
the condos in Norma Triangle where the washer-dryer is stacked in a closet
the size of a phone booth. We know this city, we know these buildings, and
we know exactly what we're walking into before we knock on your door."
```

---

## 7. Notion writing standard

Перед написанием каждой страницы **читать** Notion стандарт:
https://www.notion.so/343788eea1d581f9b8f5d4cadd7a54e2

После написания **обновлять** tracker:
https://www.notion.so/343788eea1d58113aab9fafd42075964
