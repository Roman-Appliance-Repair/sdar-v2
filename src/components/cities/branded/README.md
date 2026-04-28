# Branded Expertise Components

Per-city branded-expertise blocks that don't fit the shared template.

## Naming convention

`BrandedExpertise{CityNamePascal}.astro`

Examples:
- `BrandedExpertiseWestHollywood.astro`
- `BrandedExpertiseBelAir.astro`
- `BrandedExpertiseSanMarino.astro`
- `BrandedExpertisePacificPalisades.astro`
- `BrandedExpertiseBrentwood.astro` (Cove dishwasher focus)
- `BrandedExpertiseCulverCity.astro` (DCS / F&P focus)
- `BrandedExpertiseShermanOaks.astro` (Jenn-Air / Gaggenau)
- `BrandedExpertiseLosAngeles.astro` (Wine cellar specialty)
- `BrandedExpertiseTemecula.astro` (Wine cellar specialty)

## Rule

Component is imported in the city's `.astro` page ONLY when the corresponding
block exists in the city's content-dump. No conditional logic in template.

If a city has no branded-expertise block, do not import this directory — render
the page from shared components only.

## Props convention

Each branded component is self-contained: it owns its own copy, brand list,
and styling. Variant A design tokens (`var(--va-*)`) MUST be used so the block
visually integrates with the rest of the page.

Recommended structure:
- One `<section>` with `va-section` and `va-section--cream` or `va-section--white`
- A `<SectionHeader>` (numbered) at the top — pass the section number as prop
- Body copy in `va-body` paragraphs
- Brand pills, lists, callouts as needed
