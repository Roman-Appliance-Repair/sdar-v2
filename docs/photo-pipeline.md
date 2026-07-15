# Photo Pipeline

> Стратегия наполнения 1009 страниц фото. AI-genertion (NanaBanana via Artlist) + Google Images через Pipeline server.
> Утверждено: 2026-05-06.

---

## 1. Pipeline infrastructure

- **Server:** port 3333 (NanaBanana workflow), `node server.js`
- **Capability:** Save+Push to `.astro` (auto-versioning)
- **Source 1:** Google Images через SerpAPI (для part photos, brand badges)
- **Source 2:** AI generation via Artlist/NanaBanana (для контекстных, общего плана)
- **Source 3:** Clipboard / Downloads paste

---

## 2. Photo categorization — 3 потока

### Поток A: AI-batch (~1100 фото, 100% AI)

Где AI работает идеально (нет конкретной запчасти, нет конкретного бренда):
- City heroes (техник + van на фоне района)
- Neighborhood shots (улица без людей и машин)
- County hub heroes (общий план региона)
- Service hub heroes (типовая обстановка)
- City × service heroes
- Luxury context blocks (estates, palm streets)
- Recent repairs scenes (общий план, badges не видны)
- Commercial scenes (kitchen, walk-in общим планом)

### Поток B: Google Images через Pipeline (~400 part photos)

Где AI НЕ работает:
- Part photos (компрессоры, ТЭН, control boards) — AI рисует фейковые надписи
- Brand badges / model number plates — юридический риск
- Conkretное OEM маркировки

**Workflow:** Google Images search → 3-5 кандидатов → NanaBanana uniquify pass (small variations) → Save+Push. Uniquify снимает Google Lens reverse match risk.

### Поток C: Реальные (минимум)

- Invoice/receipt template (один обезличенный)
- Diagrams (SVG, не фото)

---

## 3. Five Art-list templates (универсальные с параметрами)

Промпт-генератор: Python скрипт читает `branches.ts` + `cities.ts` + `services.ts`, выплёвывает CSV `city,service,branch,prompt,filename`. Batch через NanaBanana.

### Template 1: `city-hero`
**Use:** 89 city pillars + 908 city × service combos = ~1000 hero фото
```
Photorealistic photo, eye level, DSLR 35mm.
Subject: appliance repair technician in dark navy polo + cap
[CHARACTER_ID для филиала] standing next to white Ford Transit van
with "Same Day Appliance Repair" branding + branch phone [PHONE]
visible on side panel. Background: residential street in [CITY],
[CITY-SPECIFIC ARCHITECTURE DETAIL]. Warm afternoon golden hour light.
Wide establishing shot. No bystanders, no other vehicles in frame.
Aspect: 3:2. Quality: 2K.
```

### Template 2: `neighborhood-shot`
**Use:** 89 city pages + 200 city × service contextual slots = ~300 фото
```
Quiet residential street in [CITY], California.
[ARCHITECTURAL DETAIL: e.g. "Wide palm-lined street with Spanish
Revival estates, manicured hedges" for Beverly Hills].
No people, no cars in foreground.
Warm afternoon golden hour light. Clear California sky.
Photorealistic, DSLR 35mm, eye level.
Wide establishing shot showing street depth.
Aspect: 4:3. Quality: 2K.
```

City-specific architecture details (выборка):
- **Beverly Hills:** wide palm-lined estates, Spanish Revival, manicured hedges
- **Burbank:** post-war bungalows on Magnolia Boulevard, small porches, rose bushes
- **Pasadena:** historic craftsman homes, deep porches, San Gabriel Mountains background
- **Santa Monica:** beachfront condos OR craftsman north of Montana
- **West Hollywood:** vintage 1920s apartments, art deco details, Sunset Strip vibe
- **Glendale:** Mediterranean estates Adams Hill OR mid-century Brand Blvd condos
- **Malibu:** PCH coastal estates, ocean glimpse, eucalyptus trees
- **Manhattan Beach:** beach bungalows, walk streets, ocean breeze
- **Newport Beach:** harbor view, contemporary coastal homes
- **Pacific Palisades:** canyon estates, palisades cliffs

### Template 3: `service-hub-hero`
**Use:** 31 service hubs (15 commercial + 16 residential) = 31 фото
```
Appliance repair technician [CHARACTER_ID] working on [APPLIANCE TYPE]
in typical residential kitchen/laundry room.
Tools visible: torque wrench, multimeter on counter.
[NO visible brand badges, NO model number plates].
Soft natural light. Photorealistic, DSLR 50mm, slightly above shoulder.
Aspect: 16:9. Quality: 2K.
```

### Template 4: `commercial-scene`
**Use:** 157 commercial pages + 50 outdoor = ~50 hero фото (rest reuse)
```
Stainless steel commercial kitchen interior in mid-service.
[Walk-in cooler door open / pizza oven array / ice machine bank — variant].
Natural daylight from skylights. No people in frame OR one technician
in background with toolbag. Photorealistic, DSLR 35mm wide.
Aspect: 16:9. Quality: 2K.
```

### Template 5: `luxury-context`
**Use:** 15 premium cities (Beverly Hills, Bel Air, Malibu, Pacific Palisades, Manhattan Beach, etc.)
```
Luxurious residential estate exterior in [CITY], California.
Manicured landscaping, palm trees, [SPECIFIC ARCHITECTURE].
Late afternoon golden hour. No people, no cars.
Photorealistic, DSLR 35mm, eye level wide.
Aspect: 16:9. Quality: 2K.
```

---

## 4. Character consistency — 3 техника

**Reference faces:**
- **Mikhail V.** — character ID #1 — серьёзный, athletic build, short dark hair
- **Artur S.** — character ID #2 — friendly demeanor, medium build, slight beard
- **David K.** — character ID #3 — taller, glasses, blonde

**Branch assignments** (для consistency: один техник = свои филиалы):
- Mikhail V. → West Hollywood, Beverly Hills, Los Angeles
- Artur S. → Pasadena, Thousand Oaks
- David K. → Irvine, Rancho Cucamonga, Temecula

City hero на странице Beverly Hills → Mikhail в кадре. Pasadena → Artur. Irvine → David.

**Reference photos: РЕШЕНО 2026-07-15** — Roman (owner) is the primary on-photo technician for all people-photos. Real reference photos at `reference-photos/roman/` (local only, not committed — the directory is gitignored; only generated output under `public/images/` ships). Character consistency via Gemini reference-image input: pass the ref crops as `inlineData` parts *before* the text prompt, then instruct the model to match that face (see `scripts/gen-roman-weho-2026-07-15.mjs`). Mikhail V. / Artur S. / David K. names remain available for Recent Repairs **text** content; on-photo person = Roman.

Ref crops in use: `ref-01.jpg` (frontal, sharpest), `ref-02.jpg` (three-quarter), `ref-03.jpg` (frontal, different light) — all cropped face-and-shoulders from Roman's own job photos. **One source photo (`20230815_133847.jpg`) contains a second man (a coworker) — it is NOT a Roman reference and no crop is taken from it.** When adding refs, crop the selfie-taker only and verify no second face enters the crop.

---

## 5. Van branding — критично для multi-location SEO

На каждом AI-сгенерированном van branding соответствует филиалу страницы:
- Beverly Hills hero → "(323) 870-4790" на боку van
- Pasadena hero → "(626) 376-4458"
- Irvine hero → "(213) 401-9019"

Это дополнительный **multi-location authenticity signal** для Google.

---

## 6. Anti-detection rules — НЕ палиться

1. **Никаких видимых брендов** в AI-фото (LG, Samsung, Sub-Zero — Google Lens прочитает badge)
2. **Никаких model numbers** на корпусах в кадре
3. **EXIF метаданные** — после конвертации в WebP через `sharp` чистятся (verify в pipeline)
4. **Variability в фоне** — ни одного одинакового фона между city heroes (89 разных)
5. **NanaBanana uniquify pass** на каждое фото перед `Save+Push` — снимает риск что 2 соседних города получили одинаковое seed-сгенерированное изображение
6. **Reference face = всегда тот же** для одного техника, через character ID

---

## 7. Priority waves

| Wave | Что | Кол-во | Зачем |
|---|---|---|---|
| **W1** | Hero на 5 county hubs + 5 hub-city pillars | 10 | Самый верхний уровень иерархии |
| **W2** | Neighborhood shots на 89 city pillars | 89 | Шаблон есть, переиспользуем |
| **W3** | City heroes (техник + van) на 89 cities | 89 | Закрывает 89 главных гео-страниц |
| **W4** | Service hub heroes (31 страница) | 31 | Закрывает 31 хаб услуг |
| **W5** | City × service heroes (~200 priority combos) | 200 | Самый длинный хвост, batch'ами |
| **W6** | Part photos через Google Pipeline (брендовые) | ~400 | Brand pages — but ranking без них тоже ОК |
| **W7** | Inline scene photos на city pages (5 слотов × 89) | ~445 | Опционально, placeholders сейчас стоят |

**Первые 4 волны = 219 фото** = закрывают весь верх SEO-структуры. 2-3 дня работы при batch 30-40 фото в день.

---

## 8. Технические требования

| Параметр | Target |
|---|---|
| Format | WebP |
| File size | 80-150 KB (после `sharp` compression) |
| Hero dimensions | 1600×900 (16:9) или 1600×1200 (4:3) |
| Inline | 800×600 |
| Alt tag template | `[appliance/scene] repair in [city] CA — [character or context]` |
| Naming | `[city-slug]-[type]-[N].webp`, e.g. `west-hollywood-hero-1.webp` |
| Lazy load | Все, кроме hero (eager на hero для LCP) |

---

## 8.1 Composition rule — hero heroes sit under a LEFT text card (permanent)

**Введено 2026-07-13 (pilot review).** ServiceHero MODE A рендерит full-bleed фон 1920×840 (~21:9) с **frosted-glass текстовой карточкой поверх ЛЕВЫХ ~40% кадра**. Поэтому:

- **Главный субъект — в ПРАВОЙ половине кадра** (идеально — правая треть), полностью в фокусе.
- **Левые ~40% кадра — чистый простой фон:** гладкая стена, пустая столешница, негативное пространство. Ничего важного там быть не должно — карточка это перекроет.
- Нарушение = субъект прячется под карточкой (тёмный «placeholder»-эффект). Проверять КАЖДЫЙ hero на это перед размещением.

**People rule (2026-07-13):** сцены с техником = **РОВНО ОДИН человек**, техник один. Промпт обязан запрещать клиента/второго человека/рукопожатие/любые чужие части тела где угодно (включая края кадра и под-карточную зону слева). **Никаких interaction-поз** (рукопожатий, жестов «кому-то», взгляда в сторону как при разговоре) — сольная рабочая поза, взгляд на прибор/технику. После генерации **сканировать ВЕСЬ кадр, включая левые 40% под карточкой**, на предмет лишних людей/рук — регенерить при находке. (Пилот: микроволновка дважды ловила фантомного «клиента» под карточкой.)

**Путь размещения (info/service heroes):** `public/images/{section}/{slug}/hero.webp` + адаптивы `hero-960.{webp,jpg}` + `hero-640.{webp,jpg}` + `hero.jpg` (6 файлов), 1920 wide, metadata stripped (sharp по умолчанию). ServiceHero MODE A подхватывает авто по `slug`+`section` через `existsSync` при билде — правок страниц не нужно. НЕ `public/images/info/...` и НЕ 16:9.

---

## 9. Forbidden image search topics (Pipeline filters)

- Real celebrities в кадре
- Copyrighted IP (Disney, Marvel, Pixar)
- Sports leagues / movies / TV stills
- Specific named real properties (e.g. "the Getty Villa")
- Anything from `samedayappliance.repair` или `sdar-v2.pages.dev` (наши собственные)
