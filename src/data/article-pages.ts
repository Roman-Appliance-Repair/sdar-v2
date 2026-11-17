// src/data/article-pages.ts
//
// Which pages are ARTICLES (get Article JSON-LD from Layout.astro via
// src/lib/article-schema.ts). Only informational guides: symptom / error-code /
// lifespan diagnostics and the price-list cost guides. Service hubs, city pages,
// city × service combos and brand pillars are NOT articles — they carry
// LocalBusiness / Service schema and must not get Article.
//
// Source of the guide list: Ahrefs Site Audit 2026-11-16, issue "Article page
// missing Article schema" (79 guides + 39 price-list pages), plus the Follett
// guide Ahrefs mis-read as a product page. Blog posts are not listed: BlogLayout
// emits its own BlogPosting.
//
// New guide page → add its path here.

export const ARTICLE_GUIDE_PATHS: ReadonlySet<string> = new Set([
  '/commercial/ice-machines/follett-not-making-ice/',
  '/commercial/ice-machines/hoshizaki-error-codes/',
  '/commercial/ice-machines/hoshizaki-not-making-ice/',
  '/commercial/ice-machines/manitowoc-error-codes/',
  '/commercial/ice-machines/manitowoc-not-making-ice/',
  '/commercial/ice-machines/scotsman-not-making-ice/',
  '/commercial/refrigeration/hoshizaki-refrigerator-not-cooling/',
  '/commercial/refrigeration/walk-in-freezer-troubleshooting/',
  '/outdoor/grill-repair/burner-not-igniting/',
  '/outdoor/grill-repair/not-getting-hot/',
  '/outdoor/grill-repair/weber-igniter-not-working/',
  '/services/cooktop-repair/electric-element-failure/',
  '/services/dishwasher-repair/air-gap/',
  '/services/dishwasher-repair/bosch-e15-error/',
  '/services/dishwasher-repair/bosch-error-codes/',
  '/services/dishwasher-repair/bosch-not-draining/',
  '/services/dishwasher-repair/frigidaire-not-draining/',
  '/services/dishwasher-repair/ge-not-draining/',
  '/services/dishwasher-repair/how-long-do-dishwashers-last/',
  '/services/dishwasher-repair/kenmore-not-draining/',
  '/services/dishwasher-repair/kitchenaid-not-draining/',
  '/services/dishwasher-repair/maytag-not-draining/',
  '/services/dishwasher-repair/not-drying/',
  '/services/dishwasher-repair/samsung-not-draining/',
  '/services/dishwasher-repair/whirlpool-error-codes/',
  '/services/dishwasher-repair/whirlpool-not-cleaning/',
  '/services/dishwasher-repair/whirlpool-not-draining/',
  '/services/dishwasher-repair/whirlpool-not-drying/',
  '/services/dryer-repair/amana-not-heating/',
  '/services/dryer-repair/error-codes/',
  '/services/dryer-repair/ge-not-heating/',
  '/services/dryer-repair/how-long-do-dryers-last/',
  '/services/dryer-repair/kenmore-not-heating/',
  '/services/dryer-repair/lg-d80-error/',
  '/services/dryer-repair/lg-not-heating/',
  '/services/dryer-repair/maytag-not-heating/',
  '/services/dryer-repair/samsung-not-heating/',
  '/services/dryer-repair/speed-queen-not-heating/',
  '/services/dryer-repair/squeaking/',
  '/services/dryer-repair/whirlpool-not-heating/',
  '/services/freezer-repair/frigidaire-not-freezing/',
  '/services/freezer-repair/ice-buildup/',
  '/services/freezer-repair/lg-not-freezing/',
  '/services/freezer-repair/not-freezing/',
  '/services/ice-maker-repair/not-making-ice/',
  '/services/ice-maker-repair/samsung-ice-maker-not-working/',
  '/services/microwave-repair/lg-not-heating/',
  '/services/microwave-repair/samsung-not-heating/',
  '/services/oven-repair/error-codes/',
  '/services/oven-repair/samsung-not-heating/',
  '/services/oven-repair/whirlpool-not-heating/',
  '/services/refrigerator-repair/amana-not-cooling/',
  '/services/refrigerator-repair/fridge-not-cooling-freezer-works/',
  '/services/refrigerator-repair/frigidaire-ice-maker-not-working/',
  '/services/refrigerator-repair/frigidaire-not-cooling/',
  '/services/refrigerator-repair/ge-ice-maker-not-working/',
  '/services/refrigerator-repair/ge-not-cooling/',
  '/services/refrigerator-repair/how-long-do-refrigerators-last/',
  '/services/refrigerator-repair/kenmore-ice-maker-not-working/',
  '/services/refrigerator-repair/kenmore-not-cooling/',
  '/services/refrigerator-repair/kitchenaid-not-cooling/',
  '/services/refrigerator-repair/lg-error-codes/',
  '/services/refrigerator-repair/lg-ice-maker-not-working/',
  '/services/refrigerator-repair/lg-not-cooling/',
  '/services/refrigerator-repair/maytag-not-cooling/',
  '/services/refrigerator-repair/not-cooling/',
  '/services/refrigerator-repair/samsung-error-codes/',
  '/services/refrigerator-repair/samsung-not-cooling/',
  '/services/refrigerator-repair/sub-zero-problems-by-series/',
  '/services/refrigerator-repair/whirlpool-ice-maker-not-working/',
  '/services/refrigerator-repair/whirlpool-not-cooling/',
  '/services/washer-repair/ge-error-codes/',
  '/services/washer-repair/ge-not-spinning/',
  '/services/washer-repair/how-long-do-washers-last/',
  '/services/washer-repair/lg-error-codes/',
  '/services/washer-repair/maytag-not-draining/',
  '/services/washer-repair/samsung-error-codes/',
  '/services/washer-repair/samsung-not-spinning/',
  '/services/washer-repair/whirlpool-error-codes/',
  '/services/washer-repair/whirlpool-not-draining/',
]);

/** /price-list/<x>-cost/ — every cost guide (not the /price-list/ index). */
const PRICE_LIST_GUIDE = /^\/price-list\/[a-z0-9-]+-cost\/$/;

export function isArticlePath(pathname: string): boolean {
  const p = pathname.endsWith('/') ? pathname : pathname + '/';
  return ARTICLE_GUIDE_PATHS.has(p) || PRICE_LIST_GUIDE.test(p);
}
