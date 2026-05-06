# Analytics Stack

> Полная инфраструктура аналитики и мониторинга. Запущена 2026-05-06.
> Источник: SDAR Analytics Setup Playbook (полная версия в Project Knowledge).

---

## 1. Stack overview

| Tool | Purpose | Cost | Status |
|---|---|---|---|
| Google Tag Manager | Tag orchestration with lazy-load | Free | ✅ |
| Google Analytics 4 | Behavior + conversions | Free | ✅ |
| Google Search Console | Search performance | Free | ✅ |
| Bing Webmaster Tools | Bing/DDG/ChatGPT search | Free | ✅ |
| IndexNow | Instant indexing (Bing/Yandex/Naver/Seznam) | Free | ✅ |
| Microsoft Clarity | Heatmaps + session recordings | Free | ✅ |
| Cloudflare Web Analytics | Privacy-friendly + Core Web Vitals | Free | ✅ |

**Total cost:** $0/month.

---

## 2. Critical IDs

> Полные ключи и passwords хранятся в 1Password / Bitwarden, не здесь.

| Key | Value | Where used |
|---|---|---|
| GTM Container | `GTM-M43LT47K` | Layout.astro lazy-load injection |
| GA4 Measurement | `G-PST1TR9G88` | GTM Google Tag config |
| GA4 Property | `498305027` | GA4 URL paths |
| IndexNow API Key | `32c2d9cecb72408cbd6f91136388e33a` | `public/{key}.txt` |
| GSC Property | `sc-domain:samedayappliance.repair` | Domain verification |
| Clarity Project | `wn15edpjlc` | URL path |

---

## 3. GTM lazy-load implementation

**File:** `src/layouts/Layout.astro`

GTM injection использует zero-impact pattern:
- 0ms impact на LCP/FID/INP/CLS
- Загружается **после первой user interaction** (scroll/click/touch/keydown)
- 4-second fallback для non-interactive sessions (bots, stationary users)
- Single injection покрывает все 1009 страниц через Layout.astro

**Verify:**
```bash
curl -s https://samedayappliance.repair/ | grep -c "GTM-M43LT47K"
# Expected: 2 (head script + body noscript)
```

---

## 4. Configured GA4 events

| Event | Trigger | Source | Purpose |
|---|---|---|---|
| `click_phone_number` | Phone click (`tel:`) | GTM Click - Just Links trigger | Phone CTA conversion |
| `book_now` | Booking form submit success | dataLayer.push from `book.astro` | Lead generation |
| `request_callback` | (TBD) | (Future feature) | Pre-created in GA4 |

**Booking form tracking** — implemented in `src/pages/book.astro`:
```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'booking_submitted',
  branch: data.branch || city,
  appliance: appliance
});
```

---

## 5. Key Events (conversions in GA4)

⭐ Marked as Key Events (toggle star icon в Admin → Events):
- ⭐ `click_phone_number` — phone CTAs
- ⭐ `book_now` — form submissions
- ⭐ `request_callback` — future feature

---

## 6. IndexNow setup

**File:** `public/{API_KEY}.txt` — содержит exactly the key (no trailing newline)

**Manual ping test:**
```
https://api.indexnow.org/indexnow?url=https://samedayappliance.repair/&key=32c2d9cecb72408cbd6f91136388e33a
```
Response 200 / 202 = accepted.

**Workflow для batches 10+ pages:**
- После git push + Cloudflare deploy
- Manual ping IndexNow на новые URLs (Cloudflare не делает auto)
- API endpoint: https://api.indexnow.org/indexnow

---

## 7. Microsoft Clarity

- Project ID: `wn15edpjlc`
- Connected via GTM (one-click integration)
- GA4 integration enabled — recordings linked to events
- В GA4 click "View in Clarity" на event → see actual user video

---

## 8. Cloudflare Web Analytics

- Enabled on Pages project `sdar-v2`
- Tracks both `sdar-v2.pages.dev` AND `samedayappliance.repair`
- No JS code needed — works at edge level
- Provides Core Web Vitals (LCP, FID, CLS)

---

## 9. Daily monitoring bookmarks

Browser folder **"SDAR Dashboard"** with:

| Tool | URL |
|---|---|
| GA4 Realtime | analytics.google.com/analytics/web/#/p498305027/reports/realtime |
| GA4 Reports | analytics.google.com/analytics/web/#/p498305027/reports/intelligenthome |
| Search Console | search.google.com/search-console?resource_id=sc-domain%3Asamedayappliance.repair |
| Bing Webmaster | bing.com/webmasters/home |
| Microsoft Clarity | clarity.microsoft.com/projects/ |
| Cloudflare WA | dash.cloudflare.com/?to=/:account/web-analytics |
| GTM | tagmanager.google.com/ |

Right-click folder → "Open all" = morning review в 6 tabs.

---

## 10. Verification после изменений

**После каждого major release:**
```bash
# 1. GTM в HTML
curl -s https://samedayappliance.repair/ | grep -c "GTM-M43LT47K"   # Expected: 2

# 2. IndexNow key accessible
curl -s https://samedayappliance.repair/32c2d9cecb72408cbd6f91136388e33a.txt
# Expected: exact key string

# 3. Sitemap accessible
curl -I https://samedayappliance.repair/sitemap-index.xml
# Expected: 200 OK

# 4. Booking tracking code present
curl -s https://samedayappliance.repair/book/ | grep -c "booking_submitted"
# Expected: 1
```

**Browser tests (Incognito):**
1. Homepage scroll → DevTools Network → `gtm.js` 200 + `g/collect` 204
2. `tel:` click → GA4 Realtime → `click_phone_number` event
3. Submit `/book/` form (test data) → GA4 Realtime → `book_now` event
4. Wait 2 hours → Clarity dashboard → first session recordings

---

## 11. Common issues

**GA4 Realtime shows 0 active users:**
1. Open in Incognito (Ctrl+Shift+N)
2. F12 → Network → filter "google"
3. Scroll → should see `gtm.js`, `gtag/js`, `g/collect`
4. If `gtm.js` missing → Cloudflare cache, purge or wait 5 min
5. If all 200/204 but no Realtime → wait 2 min (delay)

**Sitemap shows X pages, not 1009:**
- GSC processing lag — 3-7 days for "Discovered pages" to climb
- Force re-read: GSC → Sitemaps → click row → re-submit

**phone_click event fires but no Key Event marked:**
- GA4 → Admin → Events → wait 24h after first event
- Find row → toggle star icon ON

---

## 12. What's NOT included (future considerations)

- **CallRail / CallTrackingMetrics** ($45-95/mo) — true call attribution с DNI. Worth at 50+ phone clicks/week.
- **Local Falcon** — geo-grid rank tracking. Worth для multi-location.
- **Looker Studio dashboard** — unified view. 1-2h setup, $0/mo.
- **Server-side GTM** — better data quality + ad-blocker resistance. Worth at significant ad spend.
