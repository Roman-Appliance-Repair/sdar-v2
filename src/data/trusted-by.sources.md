# Trusted by — image sources (audit file, not rendered)

Collected 2026-10-10 for `src/data/trusted-by.ts`. Rule (owner, 10.10.2026): logos only from the
business's own website; venue photos only from the business's own website or owner-uploaded Google
Maps photos; otherwise our own job photo. Every processed file lives in `public/images/trusted-by/`.

Processing: logos flattened on white, trimmed, 120 px tall, webp q90. Photos: 800×600 cover crop,
webp q80 (sharp).

## Logos (`public/images/trusted-by/logos/`)

| File | Business | Source (official website) | Notes |
|---|---|---|---|
| `la-bettola-di-terroni.webp` | La Bettola di Terroni (Larchmont Village, LA) | https://cdn.prod.website-files.com/691de6e5cff43450639f2e31/691de6e5cff43450639f2fd7_la-bettola-dark.svg — used on https://www.terronilosangeles.com/locations/la-bettola-di-terroni-la | SVG rasterised |
| `paradise-buffet.webp` | Paradise Buffet | https://paradisebuffetmontebello.com/wp-content/uploads/2025/02/logo.png — site https://paradisebuffetmontebello.com | Logo carries the word "Montebello" (it is the Montebello site's logo) |
| `fiora-pizzeria.webp` | Fiora Pizzeria (Redlands) | https://images.squarespace-cdn.com/content/v1/68772f6034eac27d063b1993/c33ae1be-3e87-4019-a589-49be8acd5a1d/Untitled+design+%2826%29.png — site https://www.fiorapizzeria.com | |
| `trumans-bakery.webp` | Truman's Bakery (Beverly Grove, LA) | https://1608dc82824f7466a241.cdn6.editmysite.com/uploads/b/1608dc82824f7466a241644d2db68aebb19c36e2bf4b057311fc626d9df838cb/Artboard-2-copy-5_1767650413.png — site https://www.trumansbakery.com | |
| `milios-pizza.webp` | Milio's Pizza (Downtown Santa Barbara) | https://www.miliospizzasb.com/__l5e/assets-v1/ccbb31fc-cad9-4f18-acd1-6a82c5bc77c8/logo.png — site https://www.miliospizzasb.com | Original is cream on transparent (made for their green header); recoloured to their green #2f6b3c so it is visible on a white tile. Shape unchanged |
| `made-by-meg-catering.webp` | Made by Meg Catering ("MBM", Torrance) | https://mbmcatering.com/wp-content/uploads/2022/11/mbm_logo.svg — site https://mbmcatering.com | Original is cream (#f6f3eb) for a dark header; fill recoloured to #2b2b2b. Shape unchanged |
| `zendejas-mexican-grill.webp` | Zendejas Mexican Grill (Rancho Cucamonga) | https://zendejasrestaurant.com/wp-content/uploads/2018/10/logo.jpg — site https://zendejasrestaurant.com (alt text: "Zendejas Mexican Grill in Rancho Cucamonga") | Small original (271×86), kept at 86 px |
| — | IHOP — Lake Elsinore | none — FRANCHISE, no IHOP logo or corporate imagery by rule | text tile |

### Wave 2 (owner permission 10.10.2026 — strip tiles only, no cards)

Checked 2026-10-10 by fetching each candidate site and reading its title, logo and location text.

| File | Business (as displayed) | Source (official website) | Notes |
|---|---|---|---|
| `hibachi-papi.webp` | Hibachi Papi (Westwood, Los Angeles) | https://static.spotapps.co/website_images/ab_websites/485468_website_v1/logo_new.png — header logo of https://hibachipapi.com (alt "Hibachi Papi logo") | Name corrected from "The Hibachi Papi" to the site's "Hibachi Papi"; site lists its location in Westwood (90024). Trimmed, 78×120 |
| `pankina-grill.webp` | Pankina Grill (Tarzana, Los Angeles) | https://www.pankinagrill.com/images/logo.png — site https://www.pankinagrill.com | Site gives "Tarzana, CA" (an LA neighborhood), so the area reads "Tarzana, Los Angeles". Trimmed |
| `hollywood-vip-hotel.webp` | Hollywood VIP Hotel (Hollywood) | https://www.hollywoodviphotel.com/wp-content/uploads/2019/07/Logo.png — site https://www.hollywoodviphotel.com | Small original (264×80), kept at 80 px |
| `coast-plaza-hospital.webp` | Coast Plaza Hospital (Norwalk) | https://www.coastplazahospital.com/wp-content/uploads/sites/9/2022/01/coast-plaza.png — site https://www.coastplazahospital.com | The hospital's own site places it in Norwalk, CA, so the area is "Norwalk" (not "Los Angeles") |
| `blind-childrens-center.webp` | Blind Children's Center (Los Angeles) | https://www.blindchildrenscenter.org/wp-content/uploads/2019/04/logo-title_SMV5.png — site https://www.blindchildrenscenter.org | Original sits on a solid teal box with white lettering (only logo on the site). Teal removed to white, lettering recoloured to #2b2b2b, dots kept. Shape unchanged. 275×120 |
| `westwood-presbyterian-church.webp` | Westwood Presbyterian Church (Westwood, Los Angeles) | https://westwoodpres.org/assets/wpc-logos/wpc-logo-final-web-v3.svg — site https://westwoodpres.org | SVG rasterised, 497×120 |
| — | Poki House (Los Angeles) | text tile — no official site found (pokihouse.com is a domain for sale). A "Poké House" franchise opened at Los Feliz in 2025; not confirmed to be this business | Name kept as the owner gave it. If it is the Poké House franchise, it stays text-only by the franchise rule |
| — | Blair's (Silver Lake, Los Angeles) | text tile — official site https://blairsrestaurant.com (confirms Silver Lake / Rowena) has no logo image, only a text title | Display name "Blair's" as the site writes it ("Blair’s Restaurant") |
| — | Yamuna Delights (Rosemead) | text tile — no official website found | |
| — | Boba Boba (Saugus, Santa Clarita) | text tile — no official website found (bobabobacafe.com is an unrelated shop in Clearwater, FL) | |
| — | El Ruiseñor de Mexico (Huntington Park) | text tile — elruisenor.com is a one-line placeholder page; cannot confirm it is theirs | |
| — | Rose Bakery (Los Angeles) | text tile — several unrelated "Rose Bakery" businesses (Paris brand at Dover Street Market LA, a Valley cake shop, an OC café); rosebakery.com is "coming soon". Could not confirm which | |
| — | The Valley Hunt Club (Pasadena) | text tile — official site https://www.valleyhuntclub.com logo (`/image/company_logo?img_id=11820`) is only 86×86, too low-res | Name as the site writes it |
| — | Ramada by Wyndham Culver City | none — FRANCHISE, no Ramada / Wyndham logo or imagery by rule | text tile |
| — | Krispy Krunchy Chicken (Los Angeles) | none — FRANCHISE, no Krispy Krunchy logo or imagery by rule | text tile |
| — | 1st Century Bank (Century City, Los Angeles) | text tile — 1stcenturybank.com / 1cbank.com now redirect to MidFirst Bank (https://www.MidFirst.com/California/), i.e. the bank has merged into MidFirst | No MidFirst logo used. Owner to confirm the name is still wanted |
| — | Boys & Girls Club (Santa Ana) | text tile — could not confirm the exact club name/official site (directories list the Santa Ana site both as "Boys and Girls Club of Santa Ana" and under "Boys & Girls Clubs of Central Orange Coast") | Shown as "Boys & Girls Club" · Santa Ana |

## Venue photos (`public/images/trusted-by/photos/`)

| File | Business | Source | Kind |
|---|---|---|---|
| `la-bettola-di-terroni-window.webp` | La Bettola di Terroni | https://cdn.prod.website-files.com/691de6e5cff43450639f2e35/69ca1675de8e9f41db0f6ee7_Exterior.jpg (gallery on https://www.terronilosangeles.com/locations/la-bettola-di-terroni-la, file named "Exterior") | Official website. Window lettering + empty tables, no people |

Not used, on purpose:
- Paradise Buffet Bell — the Google Maps header/exterior photo is a VISITOR upload ("Eric Milnes"), not the owner's. The "By owner" filter could not be opened reliably through the Maps UI in this session, so no owner photo was taken. Card shows the logo instead.
- Milio's Pizza — official storefront photo (https://www.miliospizzasb.com/__l5e/assets-v1/74b55359-ebb4-4d12-b2eb-28159211b0f5/storefront.png) shows the street number on the door; not used (no street addresses on the site). Our job photos are used instead.
- Fiora Pizzeria — official site has an oven photo (Stefano Ferrara wood oven); not used because the card is about the ice machine and the picture would read as "the equipment we fixed". Our job photo (data plate) is used.
- Truman's Bakery — the official site has no venue photo; no job photo reached us (Fixar files are not downloadable through the read-only tools, Telegram had none). Card shows the logo.

## Our job photos (`public/images/trusted-by/photos/`)

| File | Job | Source |
|---|---|---|
| `milios-pizza-bakers-pride-oven.webp` | Fixar 101392 | Technician's photo, Telegram tech group "Iliy Oxnard" (chat -1004222979788), portal inbox message id 10626, 2026-10-10 |
| `milios-pizza-pilot-after.webp` | Fixar 101392 | Same chat, inbox message id 10628 ("after, oven working"), 2026-10-10 |
| `fiora-pizzeria-mecnosud-ice-machine-plate.webp` | Fixar 101144 | Technician's photo of the Mecnosud IM44AD data plate, Telegram tech group "Dmitry Korsun - Corona", portal inbox message id 2415, 2026-09-17 (identified by the IM44AD plate — same model as the job) |

Rejected while looking: inbox 10624 (Milio's, close-up of the old pilot — usable but less clear than 10626).

## Card facts (from Fixar, read-only)

- 100670 La Bettola: Icetro IM-0550-AC-22, condenser coil cleaning + water level sensor replaced, notes "work done, paid".
  NOTE: 101062 (2026-09-11) is the same machine "not working" again — water valve / hoses quoted, not approved. Owner chose to show 100670 anyway.
- 100989 Paradise Buffet (Bell location): Rational, pump control board replaced, cooling air inlet filter installed; paid in full.
- 101144 Fiora: Mecnosud IM44AD, wire harness repaired, no parts (technician confirmed in chat 21.09).
- 101250 Truman's: Blodgett BDO-100-G-ES, start/gas ignition system repair, part ordered for return visit; invoice paid in full 28.09.
- 101392 Milio's: estimate EST-000289 "Pilot generator assembly" + labor; technician (chat 10.10): replaced the pilot and the thermocouple; after-photo with burners lit; paid same day.
- 101401 IHOP: technician diagnostic "Start device on condenser unit is broken and needs to be replaced"; estimate "Start device assembly"; paid. HELD (`published: false`): next day customer reported the freezer only reached 22°F; follow-up pending.
