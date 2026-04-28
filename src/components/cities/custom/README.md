# Custom Narrative Components

Heavyweight per-city narrative blocks with structure beyond what the shared
`<CustomNarrative>` component handles (e.g. multi-zone splits with photos,
custom callouts, stat scoreboards).

## Naming convention

`CustomNarrative{CityNamePascal}.astro`

Examples (only build when needed):
- `CustomNarrativeWestHollywood.astro` — Airbnb / Property Manager block + luxury-stats scoreboard
- `CustomNarrativeSantaMonica.astro` — `.sm-coastal` 4-stat sidebar + `.sm-ror` Repair-or-Replace lifespan grid
- `CustomNarrativeShermanOaks.astro` — 6-card brand detail grid + two-zone hillside/valley split
- `CustomNarrativeManhattanBeach.astro` — Three Sections (Sand / Tree / Hill)
- `CustomNarrativeRedondoBeach.astro` — Two Beaches + salt-air gradient `.zone-tip`
- `CustomNarrativeKoreatown.astro` — Two Contexts (Residential / Commercial)
- `CustomNarrativeHuntingtonBeach.astro` — Three Tiers (Waterfront / Bluff / Inland)
- `CustomNarrativeLongBeach.astro` — Three Tiers (Canal / Beach / Inland)
- `CustomNarrativeWestwood.astro` — Campus vs Estates two-worlds
- `CustomNarrativeEncino.astro` — Two Encinos zone split (FIX TYPO from "Encinodes")

For simple long-form narrative without sub-zones (e.g. anaheim's Anaheim Hills
vs Platinum Triangle vs Resort, or san-clemente's Coastal vs Inland), use the
shared `<CustomNarrative>` component with `paragraphs` and `subSections` props
— no per-city component needed.

## Rule

Same as branded/: component is imported ONLY when the city has a custom
narrative block in its content-dump. No conditional rendering — if not imported,
render from shared components only.

## Design integration

All custom narrative components MUST use Variant A design tokens
(`var(--va-gold)`, `var(--va-cream)`, etc.) so they integrate with the rest of
the page. Custom callout boxes, two-zone splits, and stat scoreboards should
follow the visual language established by the shared library.
