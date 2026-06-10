// Ordered registry of all /blog/ posts. Consumed by BlogLayout for the
// "Related guides" block: each post links the next 3 in this ring (mod N), so
// EVERY post receives exactly 3 sibling inlinks (de-orphan guarantee, 2026-06-09).
// Keep alphabetical-by-slug; when adding a post, append its entry here too.

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
}

export const BLOG_POSTS: BlogPost[] = [
  { slug: 'bosch-dishwasher-worth-repairing', title: "Why Bosch Dishwashers Are Worth Repairing (And When They're Not)", category: 'Brand-Specific' },
  { slug: 'built-in-vs-free-standing-refrigerator-repair-costs', title: "Built-In vs Free-Standing Refrigerator: Repair Cost Reality", category: 'Repair Tips' },
  { slug: 'commercial-ice-machine-sanitization-health-dept', title: "Commercial Ice Machine Sanitization: Health Dept Checklist", category: 'Commercial' },
  { slug: 'commercial-walk-in-cooler-compressor-failure-restaurant-guide', title: "Walk-In Cooler Compressor Failure: Restaurant Guide", category: 'Commercial' },
  { slug: 'dishwasher-wont-drain-quick-fixes', title: "Dishwasher Won't Drain: Quick Fixes Before Calling a Tech", category: 'Diagnosis' },
  { slug: 'garbage-disposal-reset-button-explained', title: "Garbage Disposal Reset Button: Why It Works and When It Won't", category: 'Repair Tips' },
  { slug: 'gas-range-wont-light-pilot-igniter-valve', title: "Gas Range Won't Light: Pilot, Igniter, or Valve Diagnosis", category: 'Diagnosis' },
  { slug: 'la-hard-water-killing-dishwasher', title: "Hard Water in LA Is Killing Your Dishwasher: Here's What to Do", category: 'Maintenance' },
  { slug: 'lg-vs-samsung-washer-which-breaks-down-less', title: "LG vs Samsung Washer: Which Breaks Down Less in LA", category: 'Brand-Specific' },
  { slug: 'premium-vs-mid-tier-refrigerator-15-year-tco', title: "Premium vs Mid-Tier Fridge: 15-Year Cost of Ownership", category: 'Repair Tips' },
  { slug: 'range-hood-vent-obstruction-diy-fix-limits', title: "Range Hood Vent Obstruction: When DIY Cleaning Won't Fix It", category: 'Maintenance' },
  { slug: 'repair-vs-replace-refrigerator-la-guide', title: "Repair vs Replace Your Refrigerator: An Honest LA Guide", category: 'Repair Tips' },
  { slug: 'seasonal-appliance-repair-patterns-la', title: "Best Time for Appliance Repair in LA: Seasonal Guide", category: 'Maintenance' },
  { slug: 'sub-zero-refrigerator-not-cooling-5-checks', title: "Sub-Zero Not Cooling? 5 Checks Before You Call a Tech", category: 'Brand-Specific' },
  { slug: 'sub-zero-replacement-vs-repair-decision', title: "Sub-Zero Built-In Fridge: Why Repair Beats Replacement", category: 'Brand-Specific' },
  { slug: 'top-5-outdoor-grill-brand-failures-la', title: "Top 5 Outdoor Grill Brand Failures We See in LA", category: 'Brand-Specific' },
  { slug: 'why-dryer-takes-2-hours-diagnosis-guide', title: "Why Your Dryer Is Taking 2 Hours: Diagnosis Guide from LA Repair Techs", category: 'Diagnosis' },
  { slug: 'why-refrigerator-is-loud-7-causes', title: "Why Your Refrigerator Is Loud: 7 Causes Ranked by Likelihood", category: 'Diagnosis' },
  { slug: 'wine-cooler-compressor-vs-thermoelectric-economics', title: "Wine Cooler Repair: Compressor vs Thermoelectric", category: 'Brand-Specific' },
  { slug: 'wolf-range-failures-honest-costs', title: "Common Wolf Range Failures and Honest Repair Costs", category: 'Brand-Specific' },
];

/** The 3 posts that follow `slug` in the ring (wrapping). Guarantees every post
 *  is the "related" target of exactly 3 others. Falls back to the first 3 (≠ slug)
 *  if the slug isn't found. */
export function relatedPosts(slug: string, n = 3): BlogPost[] {
  const i = BLOG_POSTS.findIndex((p) => p.slug === slug);
  if (i === -1) return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, n);
  const out: BlogPost[] = [];
  for (let k = 1; k <= n; k++) out.push(BLOG_POSTS[(i + k) % BLOG_POSTS.length]);
  return out;
}
