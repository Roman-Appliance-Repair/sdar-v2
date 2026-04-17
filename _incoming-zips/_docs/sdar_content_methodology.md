# SDAR Content Methodology
## samedayappliance.repair — City Page Writing System
### Апрель 2026 | Версия 1.0

---

## 1. ПОЛНЫЙ ЦИКЛ НАПИСАНИЯ ГОРОДСКОЙ СТРАНИЦЫ

Каждая городская страница проходит **5 обязательных шагов**:

### Шаг 1 — GSC Анализ (Windsor.ai)
```
Фильтр: query contains "[city name]"
Поля: query, clicks, impressions, ctr, position
Период: last_3m
```
**Что ищем:**
- Запросы с 100+ показов и позиция > 20 → главные таргеты
- Запросы с позицией 15-25 → близко к топу, можно дожать
- Специфические запросы (brand + city, service + city) → темы для секций
- Коммерческие сигналы (walk-in cooler, commercial) → нужна ли commercial секция

**Примеры аномалий которые мы нашли:**
- Burbank: `appliance repair burbank` — 511 показов, позиция 48.7 → страница не ранжируется
- Pasadena: `appliance repair pasadena` — 525 показов, позиция 48.9
- Glendale: `cooktop repair glendale` — 116 показов, позиция 21 → близко к топу

---

### Шаг 2 — Конкурентный анализ (web_search + web_fetch)

**Запрос для поиска:**
```
appliance repair [City] CA same day -yelp -angi -thumbtack
```

**Читаем минимум 5-6 конкурентов через web_fetch:**
- Главная страница города каждого конкурента
- Фокус: что они пишут про районы, какие бренды упоминают, какие проблемы, что НЕ упоминают

**Что собираем:**
- Районы и улицы которые они называют (часто очень мало)
- Бренды которые упоминают
- Уникальные сервисные блоки (Airbnb, estate management, commercial)
- Pricing данные если есть
- Тональность — насколько они безликие (как правило, очень)

---

### Шаг 3 — Векторный анализ (Python TF-IDF)

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. Собрать тексты конкурентов в список competitor_texts[]
# 2. Сформировать список topic_candidates[] — конкретные термины которые нас интересуют
# 3. TF-IDF векторизация, cosine similarity с ключевым запросом
# 4. Отсортировать по частоте встречаемости × релевантность
# 5. Сравнить с нашей страницей → найти gaps
```

**Категории topic_candidates:**
- Service type (same-day, emergency, first-visit)
- Appliances (refrigerator repair, washer repair, etc.)
- Brands (sub-zero repair, thermador repair, etc.)
- Neighborhoods (конкретные для каждого города)
- Trust signals (licensed insured, oem parts, written estimate)
- Problems (not cooling, not heating, drain pump, thermal fuse)
- Maintenance (coil cleaning, dryer vent, preventive maintenance)
- Local specifics (coastal climate, dust/hills, entertainment industry, etc.)

**Gap analysis:**
```python
for term in terms:
    in_competitors = freq[term] >= 1
    in_ours = bool(re.search(re.escape(term), our_page))
    if in_competitors and not in_ours:
        gaps.append(term)
```

---

### Шаг 4 — Написание страницы

Полная структура + humanization rules (см. раздел 3 и 4).

### Шаг 5 — Деплой через Claude Code

```
Создай файл src/pages/[city].astro
со следующим содержимым из прикреплённого файла [city].astro.
Если файл уже существует — сделай резервную копию
как [city].astro.bak перед заменой.
```

---

## 2. СТРУКТУРА СТРАНИЦЫ (10 блоков)

| # | Блок | Обязателен | Примечания |
|---|------|-----------|------------|
| 1 | **Hero** | ✅ | H1, eyebrow с ZIP, ctas, rating |
| 2 | **Trust Bar** | ✅ | Красный фон, 5 иконок |
| 3 | **Intro** | ✅ | Живой текст от техников + sticky CTA box |
| 4 | **Services Grid** | ✅ | 8 карточек с ссылками на /city/service/ |
| 5 | **Luxury/Context Block** | ✅ | Специфика города — разная для каждого |
| 6 | **Neighborhoods Grid** | ✅ | Районы + ZIP коды — главный SEO блок |
| 7 | **Special Block** | ⚙️ | Зависит от города (см. табл. ниже) |
| 8 | **Recent Local Repairs** | ✅ | 4 реальных кейса с районами и цитатами |
| 9 | **Why Us + Reviews + Pricing** | ✅ | Humanized why-us, 3 отзыва, pricing grid |
| 10 | **FAQ + Nearby + Bottom CTA** | ✅ | FAQPage Schema, nearby links |

### Специальные блоки по городам:

| Город | Спецблок |
|-------|----------|
| West Hollywood | Airbnb/Property Manager — COI, key fob, concierge |
| Pasadena | Commercial — Old Town restaurants, walk-in cooler |
| Santa Monica | Coastal Climate — salt air, coil corrosion, lifespan |
| Beverly Hills | Repair or Replace — luxury appliance lifespan guide |
| Burbank | Entertainment Industry context — нестандартные часы |
| Glendale | Hillside dust + Armenian community mention |

---

## 3. HUMANIZATION RULES — ГОЛОС И ТОНАЛЬНОСТЬ

### Кто говорит
- **Компания Same Day Appliance Repair** и её **технические специалисты**
- Всегда: "our technicians", "we", "our team", "our techs"
- Никогда: "I", "I've seen", "I recommend" — это компания, не один человек

### Запрещённые фразы (никогда не использовать)
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
```

### Правила живого голоса

**1. Начинай intro с конкретного наблюдения о городе:**
```
✅ "West Hollywood is one of our busiest service areas — our guys are 
   out here constantly."
✅ "Glendale is one of the more interesting cities we work in."
✅ "Santa Monica is one of the more interesting cities we work in. 
   The housing stock runs the full range..."
```

**2. Называй конкретные улицы и районы:**
```
✅ "the condos in Norma Triangle where the washer-dryer is stacked 
   in a closet the size of a phone booth"
✅ "fixing Sub-Zeros off Robertson, Bosch dishwashers in Boystown"
✅ "48-inch Wolf dual-fuel ranges, Thermador steam ovens, 
   Miele dishwashers with custom panel fronts"
```

**3. Показывай мышление техника, а не маркетинг:**
```
✅ "A thermal fuse blows for a reason. We don't just replace it 
   and leave — we find what caused it."
✅ "Knowledgeable of the latest appliances — our technicians 
   come prepared for what Glendale actually has."
✅ "This one would've come back within a week if we'd only 
   replaced the fuse."
```

**4. Кейсы в recent repairs пиши как разговор:**
```
✅ Заголовок как клиент говорит: "Freezer is fine but fridge section warm"
✅ Описание с деталями: "Classic evaporator fan failure on a Sub-Zero 650 
   — happens more than people realize in WeHo's dry climate."
✅ Что конкретно сделано: "Replaced the fan motor with an OEM Sub-Zero part, 
   defrosted the coils that had iced over"
✅ Человеческая деталь: "Customer had dinner guests that evening — 
   we were done by 4pm."
```

**5. Vary sentence length — смешивай короткие и длинные:**
```
✅ "We pick up the phone. Not a call center. Not a dispatcher. 
   When you call our Glendale number, someone who actually knows 
   the schedule picks up and tells you honestly when we can be there."
```

**6. Будь прямым о pricing:**
```
✅ "Our diagnostic fee is $89 — and that goes away the moment 
   you say yes to the repair."
✅ "What we quote is what appears on the invoice. No surprises."
```

---

## 4. CITY-SPECIFIC CONTENT RULES

### Что делает каждый город уникальным

**Каждый город должен иметь:**
1. **Местный климатический/географический факт** влияющий на технику
2. **Специфику жилищного фонда** (что за дома, какие там приборы)
3. **Уникальный контекст жителей** (кто живёт, как работают)
4. **Районы которых нет у конкурентов**

### Примеры реализации:

| Город | Климат/Гео | Жилищный фонд | Контекст жителей |
|-------|-----------|---------------|-----------------|
| West Hollywood | Сухой воздух → coil buildup | High-rises, vintage apartments | Airbnb hosts, property managers, LGBT community |
| Santa Monica | Salt air → coil corrosion, gasket wear | Beachfront condos, craftsman north of Montana | Coastal maintenance 4-6 months not 12 |
| Beverly Hills | Нет особого | Estates, built-ins, luxury only | Estate managers, household staff, discretion |
| Burbank | Dry/dusty → coil cleaning | Vintage craftsman + new condos | Entertainment industry shifts |
| Pasadena | Dry heat → coil buildup | Craftsman bungalows, Spanish Colonials | Old Town restaurants (commercial), Caltech |
| Glendale | Hillside dust → coil faster | Mediterranean estates + Brand Blvd condos | Armenian community (mention), diverse housing |

### Maintenance tips — уникальные для каждого города:

```
WeHo: "condenser coil cleaning in WeHo's dry climate — 
      every 6 months, not 12"
Santa Monica: "within a mile of the ocean — every 4-6 months, 
      salt deposits twice as fast"
Glendale hills: "hillside neighborhoods have the dustiest conditions 
      we work in — coils clog faster here"
Burbank: "Burbank's dry, dusty climate is hard on coils — 
      especially in homes near the hills"
```

---

## 5. SCHEMA MARKUP — ОБЯЗАТЕЛЬНО НА КАЖДОЙ СТРАНИЦЕ

### LocalBusiness Schema
```json
{
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "name": "Same Day Appliance Repair — [City]",
  "telephone": "[phoneRaw]",
  "email": "[email]",
  "address": { // Берём из GMB — строго совпадает
    "@type": "PostalAddress",
    "streetAddress": "...",
    "addressLocality": "...",
    "addressRegion": "CA",
    "postalCode": "...",
    "addressCountry": "US"
  },
  "areaServed": [{ "@type": "City", "name": "..." }],
  "openingHoursSpecification": [...], // Mon-Fri 7-21, Sat 8-19, Sun 9-17
  "priceRange": "$$",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6", // СТРОГО из GMB — не придумывать
    "reviewCount": "37",  // СТРОГО из GMB
    "bestRating": "5"
  }
}
```

### FAQPage Schema
- 7 вопросов на каждой странице
- 1-2 вопроса про same-day availability с упоминанием ZIP
- 1 вопрос про luxury brands если есть
- 1 вопрос про diagnostic fee
- 1 вопрос про warranty
- 1-2 вопроса специфичных для города

---

## 6. ТЕХНИЧЕСКИЕ ДАННЫЕ ФИЛИАЛОВ

| Филиал | Телефон | Email | GMB Адрес | ZIP |
|--------|---------|-------|-----------|-----|
| West Hollywood | (323) 870-4790 | support@samedayappliance.repair | 8746 Rangely Ave, West Hollywood CA 90048 | 90048 |
| Los Angeles | (424) 325-0520 | info@samedayappliance.repair | — | — |
| Pasadena | (626) 376-4458 | pasadena@samedayappliance.repair | 55 S Lake Ave, Pasadena CA 91101 | 91101 |
| Thousand Oaks | (424) 208-0228 | thousandoaks@samedayappliance.repair | — | — |
| Irvine | (213) 401-9019 | irvine@samedayappliance.repair | — | — |

### Какой филиал для какого города:

| Город | Филиал | Телефон |
|-------|--------|---------|
| West Hollywood | West Hollywood | (323) 870-4790 |
| Beverly Hills | West Hollywood | (323) 870-4790 |
| Hollywood | West Hollywood | (323) 870-4790 |
| Glendale | West Hollywood | (323) 870-4790 |
| Burbank | Pasadena | (626) 376-4458 |
| Pasadena | Pasadena | (626) 376-4458 |
| Santa Monica | Los Angeles | (424) 325-0520 |
| Los Angeles | Los Angeles | (424) 325-0520 |
| Culver City | Los Angeles | (424) 325-0520 |
| Santa Monica | Los Angeles | (424) 325-0520 |

---

## 7. PRICING — СТАНДАРТНЫЕ ДИАПАЗОНЫ

| Техника | Стандарт | Luxury brands |
|---------|----------|---------------|
| Refrigerator | $200 – $450 | $300 – $700+ (Sub-Zero, Wolf) |
| Washer | $150 – $350 | $200 – $450 (Miele, Bosch) |
| Dryer | $150 – $320 | $200 – $400 |
| Oven / Range | $175 – $420 | $250 – $500+ (Wolf, Viking, Thermador) |
| Dishwasher | $150 – $320 | $200 – $450 (Miele) |
| Cooktop | $150 – $350 | $200 – $500 |
| Diagnostic fee | **$89** (home) | $89 — всегда waived с repair |
| Commercial diagnostic | **$120** | $120 — waived с repair |

---

## 8. REPAIR OR REPLACE — СТАНДАРТНЫЕ LIFESPAN

| Техника | Обычные бренды | Luxury brands |
|---------|----------------|---------------|
| Dishwasher | ~10 лет | ~15-20 лет (Miele) |
| Washer | ~11 лет | ~15 лет (Miele, Bosch) |
| Dryer | ~13 лет | ~15 лет |
| Refrigerator | ~14 лет | 20+ лет (Sub-Zero) |
| Gas Range | ~15 лет | 20+ лет (Wolf, Viking) |
| Electric Oven | ~15 лет | 15-20 лет |

**Правило 50%:** Если ремонт стоит меньше 50% нового — чинить.
**Luxury исключение:** Для built-in Sub-Zero, Wolf, Thermador правило 50% почти никогда не применяется — замена встроенного прибора = ремонт кухни.

---

## 9. ВЕКТОРНЫЙ АНАЛИЗ — КОД-ШАБЛОН

```python
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. Собери competitor_texts = [...] из web_fetch
# 2. Определи keyword = "appliance repair [City] CA"
full_text = "\n\n".join(competitor_texts)

# 3. Список кандидатов по категориям
topic_candidates = [
    # Service
    "same-day service", "emergency repair", "first visit repair",
    # Appliances
    "refrigerator repair", "washer repair", "dryer repair",
    "dishwasher repair", "oven repair", "range repair", "cooktop repair",
    "wine cooler repair", "freezer repair", "ice maker repair",
    "range hood repair", "microwave repair",
    # Brands — стандарт
    "samsung repair", "lg repair", "whirlpool repair", "ge repair",
    "kitchenaid repair", "bosch repair", "maytag repair",
    # Brands — luxury
    "sub-zero repair", "thermador repair", "viking repair", "wolf repair",
    "miele repair", "dacor repair",
    # Neighborhoods — заполнить для каждого города!
    "...",
    # Trust
    "licensed insured", "oem parts", "written estimate", "diagnostic fee",
    "warranty repair", "upfront pricing",
    # Problems
    "not cooling", "not heating", "not draining", "not spinning",
    "drain pump", "thermal fuse", "heating element", "fan motor",
    "control board", "igniter issue",
    # Maintenance
    "coil cleaning", "dryer vent", "dryer vent cleaning",
    "preventive maintenance",
]

# 4. Считаем частоту
freq = {}
for term in topic_candidates:
    count = len(re.findall(re.escape(term.lower()), full_text.lower()))
    if count > 0:
        freq[term] = count

# 5. TF-IDF cosine similarity
all_texts = [keyword] + list(freq.keys())
vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(2,5), min_df=1)
tfidf = vectorizer.fit_transform(all_texts)
sims = cosine_similarity(tfidf[0], tfidf[1:])[0]
terms = list(freq.keys())
scored = sorted(
    [(terms[i], sims[i], freq[terms[i]]) for i in range(len(terms))],
    key=lambda x: -x[1]
)

# 6. Gap analysis против нашей страницы
our_page = "... текст нашей страницы ..."
gaps = []
for term, score, f in scored:
    in_ours = bool(re.search(re.escape(term.lower()), our_page.lower()))
    if not in_ours:
        gaps.append((term, f, score))

print("GAPS:")
for t, f, s in sorted(gaps, key=lambda x: -x[1]):
    print(f"  ✗ {t:<40} freq={f}")
```

---

## 10. GAP ANALYSIS — ЧТО ДОБАВЛЯТЬ В ЗАВИСИМОСТИ ОТ GAPS

| Gap | Куда добавить |
|-----|---------------|
| `coil cleaning` | В luxury/context блок, в tip блок или в recent repair кейс |
| `dryer vent / dryer vent inspection` | В dryer service карточку (issues строка) + в recent repair кейс |
| `fire hazard` (dryer vent) | В intro tip блок (отдельный tip с 🔥 иконкой) |
| `same day appliance repair [city]` | В intro текст — вписать органично в 1-2 предложение |
| `GE repair` / `KitchenAid repair` | В brands grid с подписью |
| `upfront pricing` | В why-us карточку или в intro |
| `repair cost / pricing` | Новая pricing секция перед FAQ |
| `[specific neighborhood]` | В neighborhoods grid или в текст intro |
| `water quality / climate effects` | В context/intro блок как local insight |
| `COI / certificate of insurance` | В FAQ ответ про Airbnb + в property manager секцию |
| `stackable / ventless` | В washer service карточку (issues строка) |
| `rose bowl / [local landmark]` | В neighborhoods grid |
| `commercial refrigerator` | В commercial секцию если есть |
| `range repair` | Переименовать oven карточку в "Oven, Stove & Range Repair" |

---

## 11. CSS И ДИЗАЙН — КОНСТАНТЫ

```css
/* Цвета — одинаковые для всех страниц */
--red: #C8102E;      /* Основной акцент */
--black: #0a0a0a;    /* Hero фон, context секции */
--gray: #f5f5f5;     /* Секции с чередованием */
--border: #e2e2e2;   /* Все бордеры */
--text: #1a1a1a;     /* Основной текст */
--muted: #6b6b6b;    /* Вторичный текст */

/* Trust bar — всегда красный */
.trust-bar { background: var(--red); }

/* Hero — всегда чёрный */
.hero { background: var(--black); }

/* Tip блоки */
.tip-maintenance { background: #fff8e7; border: 1px solid #f0d070; } /* жёлтый */
.tip-coastal { background: #f0f7ff; border: 1px solid #b8d4f0; }     /* синий */
.tip-safety { background: #fff5f7; border: 1px solid #e8a0a0; }       /* красный */
```

**Чередование секций:**
```
Hero (black) → Trust Bar (red) → Intro (white) → Services (gray) →
Context (black) → Neighborhoods (white) → Special Block (gray/black) →
Recent Repairs (white/gray) → Why Us (gray/white) → Reviews (white/gray) →
Pricing (white) → FAQ (gray) → Nearby (white) → Bottom CTA (black)
```

---

## 12. NEIGHBORHOODS — ДАННЫЕ ПО ГОРОДАМ

### West Hollywood (90046, 90069, 90048)
Featured: Norma Triangle, Sunset Strip, Melrose District
Others: West Hollywood West, Boystown, Kings Road, Design District, Santa Monica Blvd, Fairfax District, West Hollywood Heights
Streets: Santa Monica Blvd, Sunset Blvd, Melrose Ave, La Cienega Blvd, Fountain Ave, Holloway Dr, Robertson Blvd

### Burbank (91501, 91502, 91505, 91506)
Featured: Magnolia Park, Rancho Equestrian District, Toluca Lake
Others: Media District, Downtown Burbank, Burbank Hills, Empire Center, Burbank Town Center, Chandler Park
Streets: Magnolia Blvd, Victory Blvd, Olive Ave, San Fernando Blvd, Glenoaks Blvd

### Pasadena (91101, 91103, 91104, 91105, 91106, 91107)
Featured: Old Town Pasadena, Caltech/South Lake Ave, Historic Highlands
Others: Madison Heights, Bungalow Heaven, Lamanda Park, San Rafael Hills, Linda Vista, Rose Bowl Area, Hastings Ranch
Nearby: South Pasadena, San Marino, Arcadia, La Cañada Flintridge, Monrovia, Alhambra

### Glendale (91201–91208)
Featured: Verdugo Woodlands, Rossmoyne, Adams Hill
Others: Sparr Heights, Chevy Chase Canyon, Glenoaks Canyon, Downtown Glendale, Tropico, Rancho San Rafael
Nearby: Montrose, La Crescenta, Eagle Rock, La Cañada Flintridge, Atwater Village, Glassell Park

### Santa Monica (90401–90405)
Featured: North of Montana, Ocean Park, Pico Neighborhood
Others: Sunset Park, Mid-City, Downtown Santa Monica, Wilshire-Montana, Beachfront/Ocean Ave
Nearby: Venice, Culver City, Brentwood, West LA, Mar Vista, Marina del Rey
ZIPs: 90401 (Downtown), 90402 (North of Montana), 90403 (Mid-City), 90404 (East), 90405 (Ocean Park)

### Beverly Hills (90210, 90211, 90212)
Featured: The Flats, The Hills, Trousdale Estates
Others: Benedict Canyon, Coldwater Canyon, Wilshire Corridor, South Beverly Hills, Beverly Grove
Adjacent: Bel Air (90077), Holmby Hills, Century City (90067), Westwood (90024)

---

## 13. ПРИМЕРЫ ХОРОШИХ И ПЛОХИХ ТЕКСТОВ

### ❌ ПЛОХО — корпоративный язык
```
"We understand the urgency of a broken appliance. Our certified technicians 
are dedicated to providing top-of-the-line service. Customer satisfaction 
is our top priority. Don't hesitate to call us today!"
```

### ✅ ХОРОШО — живой голос техника
```
"When our technicians get a call from Magnolia Park at 8am about a fridge 
that stopped cooling overnight, we know exactly what that means — someone's 
groceries are at risk and they need us there before noon. That's exactly 
the kind of call we built Same Day Appliance Repair around."
```

---

### ❌ ПЛОХО — сухой технический кейс
```
Title: "Sub-Zero 650 not cooling"
Desc: "Diagnosed failed evaporator fan motor and iced-over coils. 
Replaced fan with OEM part, defrosted and cleaned coils. Unit back 
to temperature same day."
```

### ✅ ХОРОШО — живой кейс с деталями
```
Title: "Freezer is fine but the fridge side won't cool"
Desc: "Classic evaporator fan failure on a Sub-Zero 650 — happens more 
than people realize in WeHo's dry climate. Our tech replaced the fan motor 
with an OEM Sub-Zero part, defrosted the coils that had iced over, and 
confirmed stable temperatures before leaving. Customer had dinner guests 
that evening — we were done by 4pm."
```

---

### ❌ ПЛОХО — обобщённый intro
```
"Same Day Appliance Repair has been serving West Hollywood homeowners, 
renters, and property managers for years with licensed, insured service 
you can count on."
```

### ✅ ХОРОШО — конкретный intro с местным знанием
```
"West Hollywood is one of our busiest service areas — our guys are out 
here constantly. The Sunset Strip high-rises, the vintage apartments off 
Melrose, the condos in Norma Triangle where the washer-dryer is stacked 
in a closet the size of a phone booth. We know this city, we know these 
buildings, and we know exactly what we're walking into before we knock 
on your door."
```

---

## 14. НАПИСАННЫЕ СТРАНИЦЫ (статус)

| Файл | Статус | Особенности |
|------|--------|-------------|
| west-hollywood.astro | ✅ Задеплоен + вектор правки | Airbnb/COI блок, pricing, Kings Road |
| burbank.astro | ✅ Задеплоен + вектор правки | Entertainment industry, dryer vent fire hazard |
| pasadena.astro | ✅ Задеплоен + вектор правки | Commercial Old Town, 2 tip блока, pricing |
| glendale.astro | ✅ Написан | Armenian community, hillside dust |
| santa-monica.astro | ✅ Написан | Coastal climate, salt air, repair-or-replace |
| beverly-hills.astro | ✅ Написан | Estate service, luxury lifespan guide |

### Следующие по GSC приоритету:
1. Hollywood
2. Los Angeles (главный хаб)
3. Culver City
4. Silver Lake
5. Los Feliz
6. Marina del Rey

---

## 15. CHECKLIST ПЕРЕД ПУБЛИКАЦИЕЙ

- [ ] Title: содержит город + CA + ключевой запрос, до 60 символов
- [ ] Description: содержит город, 2-3 района, телефон, до 155 символов
- [ ] H1: отличается от title, содержит город
- [ ] LocalBusiness Schema: адрес СТРОГО совпадает с GMB
- [ ] Рейтинг: 4.6 · 37 отзывов — строго из GMB (West Hollywood branch)
- [ ] Телефон: правильный для данного города/филиала
- [ ] Все районы для данного города упомянуты
- [ ] ZIP коды в тексте (минимум в eyebrow + FAQ)
- [ ] Кейсы: реальные районы города
- [ ] Exact phrase "same day appliance repair [city]" в body text
- [ ] Pricing секция присутствует
- [ ] FAQPage Schema: 7 вопросов
- [ ] Nearby links: ссылки на реальные существующие страницы
- [ ] No forbidden phrases (see section 3)
