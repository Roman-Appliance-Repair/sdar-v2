# Design System

> Финальный design — live `/west-hollywood/` на samedayappliance.repair (post DNS cutover).
> Любая новая страница должна совпадать с этим эталоном.

---

## 1. Brand palette

```css
--red:        #C8102E;   /* Главный акцент */
--black:      #0a0a0a;   /* Hero фон, context секции */
--white:      #ffffff;   /* Light sections */
--gray:       #f5f5f5;   /* Чередующиеся секции */
--border:     #e2e2e2;   /* Все бордеры */
--text:       #1a1a1a;   /* Основной текст на light */
--muted:      #6b6b6b;   /* Secondary text */
```

**Tip blocks (info callouts):**
```css
--tip-maintenance: #fff8e7 bg, #f0d070 border;  /* yellow */
--tip-coastal:     #f0f7ff bg, #b8d4f0 border;  /* blue */
--tip-safety:      #fff5f7 bg, #e8a0a0 border;  /* red */
```

---

## 2. Typography

- **Font family:** system-ui stack (no custom fonts — performance)
- **H1:** 2.5rem desktop / 1.9rem mobile, font-weight 800
- **H2:** 1.8rem / 1.4rem, font-weight 700
- **H3:** 1.3rem / 1.1rem, font-weight 600
- **Body:** 1.05rem, line-height 1.7
- **Small / meta:** 0.9rem

---

## 3. Layout principles

### 3.1 Section alternation (chess pattern)
```
Hero (black)
  → Trust Bar (red)
    → Intro (white)
      → Services (gray)
        → Context (black)
          → Neighborhoods (white)
            → Special block (gray or black)
              → Recent Repairs (white/gray alternating)
                → Why Us (gray/white)
                  → Reviews (white/gray)
                    → Pricing (white)
                      → FAQ (gray)
                        → Nearby (white)
                          → Bottom CTA (black)
```

### 3.2 Container width
- Desktop max-width: 1200px
- Mobile padding: 16px both sides
- Section vertical padding: 64px desktop / 48px mobile

---

## 4. Hero section

### 4.1 Structure
- **Background:** black (`--black`)
- **Layout:** split — text left (60%), photo right (40%)
- **Photo:** техник + van на фоне района (см. @docs/photo-pipeline.md)

### 4.2 Content
- **Eyebrow** (small, red): `[ZIP codes] · [Branch name] Branch`
- **H1:** city + service + CA
- **Subline:** 1 sentence — local observation, не маркетинг
- **CTAs:** 2 buttons — `Call (XXX) XXX-XXXX` (red, primary) + `Book Online` (outline white, secondary)
- **NO** rating/star display (см. @docs/factual-accuracy.md §6)
- **NO** phone в notification bar или main nav (телефон уже здесь)

### 4.3 НЕ делать
- ❌ Rotating phone between branches in nav (выбираем один по странице)
- ❌ Slider/carousel в hero
- ❌ Video background (LCP-killer)
- ❌ Floating elements

---

## 5. Trust Bar

- **Background:** red (`--red`)
- **Position:** immediately after Hero
- **Content:** 5 icon + label items
- **Icons:** Same Day · OEM Parts · 90-Day Warranty · Licensed & Insured · Local Technicians
- **NO** ratings/reviews здесь (Notification bar тоже без них)

---

## 6. Services Grid

- 8 cards (residential) или 6-12 cards (depending on page type)
- Each card: icon + service name + 1-line description + brand list (3-5 brands)
- Card link: `/[city]/[service]/`
- **Brand list** — pulled from `CityDescriptor.brandPool[Tier]` (см. @docs/factual-accuracy.md §1)

---

## 7. Recent Repairs block

4 кейса минимум, каждый:
- **Photo slot** (см. @docs/photo-pipeline.md)
- **Title** = quote клиента ("Freezer is fine but fridge section warm")
- **Description** = живой кейс с model number, year, action, human detail
- **Neighborhood** badge

---

## 8. FAQ section

- 7 вопросов (city pages) / 5+ (brand/service pages)
- Accordion-style (collapsible)
- Schema: FAQPage JSON-LD (см. @docs/seo-policies.md §4)

---

## 9. Bottom CTA

- **Background:** black
- **Content:** big "Same-day service in [city]?" + phone (large) + Book button
- **NO** form here — `/book/` is separate page

---

## 10. Mobile-first behavior

- **Sticky header:** logo left + phone (red) right
- **Hamburger menu** for navigation
- **Phone tap-to-call** на every phone display
- **Card layouts** stack vertically below 768px
- **Hero photo** below text on mobile (text-first)

---

## 11. Components inventory

Текущие компоненты (`src/components/`, 43 total, post-audit 2026-05-06):

**Heavily used:**
- `Hero` (382 imports) — universal hero with city/branch params
- `BrandBranchesGrid` (326) — branch list block
- `ServiceHero` (164) — service-specific hero
- `CommercialHero` (131) — commercial-specific hero
- `FAQ` (89) — FAQ accordion + schema

**Moderately used:**
- `BookingCard`, `Breadcrumbs`, `Footer`, `BrandBadgesRow`, `RecentRepairs`

**Orphans (cleanup candidates, 2026-05-06 audit):**
- `AiDiagnostic`, `Diagnostics`, `Credentials`, `BrandHubPlaceholder`, `BrandDetailPlaceholder`, `HomepageFooter`, `SectionDivider`

**Layouts (4):**
- `Layout.astro` — primary (only one with `<head>`)
- `BaseLayout.astro` — wraps Layout
- `BlogLayout.astro` — wraps Layout for blog
- `CityLayoutV2.astro` — wraps Layout for city pages

---

## 12. What's forbidden in design

- ❌ Generic stock photos (нужна consistent identity — см. @docs/photo-pipeline.md)
- ❌ Shutterstock watermarks
- ❌ Multiple H1 на странице
- ❌ Animated GIFs (LCP)
- ❌ Auto-playing audio/video
- ❌ Pop-ups / interstitial ads
- ❌ Cookie banners blocking content (мы не показываем cookie banner — privacy в footer link)
- ❌ Breadcrumbs выше Hero (после hero — ОК)
- ❌ Ratings/reviews displays в visible UI (см. @docs/factual-accuracy.md §6)
