"""Wave 39 Phase 2A — audit category parsing for brand × category combos.

For every src/pages/brands/*.astro slug, parse into (brand, category) using
brand display map + category dictionary. Report distribution + edge cases.
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent
BRANDS_DIR = ROOT / "src" / "pages" / "brands"

brand_map: dict[str, str] = json.loads(
    (ROOT / "audit-output" / "brand-display-map.json").read_text(encoding="utf-8")
)

# Category slug → display name (curated)
CATEGORY_DISPLAY = {
    "refrigerator": "Refrigerator",
    "freezer": "Freezer",
    "ice-maker": "Ice Maker",
    "wine-cooler": "Wine Cooler",
    "wine-cellar": "Wine Cellar",
    "washer": "Washer",
    "dryer": "Dryer",
    "laundry": "Laundry",
    "stack-washer-dryer": "Stack Washer & Dryer",
    "washer-dryer": "Washer & Dryer",
    "oven": "Oven",
    "wall-oven": "Wall Oven",
    "range": "Range",
    "range-hood": "Range Hood",
    "cooktop": "Cooktop",
    "stove": "Stove",
    "microwave": "Microwave",
    "dishwasher": "Dishwasher",
    "professional-dishwasher": "Professional Dishwasher",
    "trash-compactor": "Trash Compactor",
    "garbage-disposal": "Garbage Disposal",
    "coffee": "Coffee Machine",
    "stand-mixer": "Stand Mixer",
    "vent-hood": "Vent Hood",
    "hood": "Hood",
    "built-in-refrigerator": "Built-In Refrigerator",
    "outdoor-refrigerator": "Outdoor Refrigerator",
    "outdoor": "Outdoor",
    "bbq-grill": "BBQ Grill",
    "grill": "Grill",
    "pizza-oven": "Pizza Oven",
    "patio-heater": "Patio Heater",
    "fireplace": "Fireplace",
    "outdoor-kitchen": "Outdoor Kitchen",
    "ice-machine": "Ice Machine",
    "rotisserie": "Rotisserie",
    "fryer": "Fryer",
    "charbroiler": "Charbroiler",
    "steamer": "Steamer",
    "commercial": "Commercial",
    "commercial-dryer": "Commercial Dryer",
    "walk-in": "Walk-In",
    "walk-in-cooler": "Walk-In Cooler",
    "walk-in-freezer": "Walk-In Freezer",
    "condensing-unit": "Condensing Unit",
    "refrigeration": "Refrigeration",
    "draft-beer-system": "Draft Beer System",
    "beverage-dispenser": "Beverage Dispenser",
    "soft-serve": "Soft Serve Machine",
    "slushie-machine": "Slushie Machine",
    "convection-oven": "Convection Oven",
    "salamander": "Salamander Broiler",
    "tankless-water-heater": "Tankless Water Heater",
    "rapid-cook-oven": "Rapid Cook Oven",
    "stackable-washer-dryer": "Stackable Washer/Dryer",
}


def parse_brand_category_slug(slug: str) -> tuple[str | None, str | None]:
    """Return (brand_display, category_display) or (None, None)."""
    # Pillar match (exact slug in brand_map)
    if slug in brand_map:
        return (brand_map[slug], None)
    if not slug.endswith("-repair"):
        return (None, None)
    body = slug[:-len("-repair")]
    # If body itself is a brand (e.g. body=american-range), it's a pillar with -repair.
    if body in brand_map:
        return (brand_map[body], None)
    # Brand × category: try longest brand prefix match.
    # Sort brands by descending length so 'ge-monogram' wins over 'ge'.
    for brand_slug in sorted(brand_map.keys(), key=lambda x: -len(x)):
        if brand_slug == slug or brand_slug == body:
            continue
        prefix = brand_slug + "-"
        if body.startswith(prefix):
            cat_slug = body[len(prefix):]
            cat_display = CATEGORY_DISPLAY.get(
                cat_slug,
                cat_slug.replace("-", " ").title(),
            )
            return (brand_map[brand_slug], cat_display)
    return (None, None)


results: list[tuple[str, str | None, str | None]] = []
for path in sorted(BRANDS_DIR.glob("*.astro")):
    slug = path.stem
    if slug == "index":
        continue
    brand, category = parse_brand_category_slug(slug)
    results.append((slug, brand, category))

# Stats
total = len(results)
pillars = sum(1 for _, b, c in results if b and c is None)
combos = sum(1 for _, b, c in results if b and c is not None)
unknowns = sum(1 for _, b, c in results if b is None)

print(f"=== Category parse audit ===")
print(f"Total brand .astro files: {total}")
print(f"  Pillars (brand only): {pillars}")
print(f"  Brand × category combos: {combos}")
print(f"  Parser failures: {unknowns}")
print()

if unknowns:
    print(f"=== Parser failures (need attention) ===")
    for s, b, c in results:
        if b is None:
            print(f"  {s}")
    print()

# Category distribution
cat_counter = Counter(c for _, b, c in results if c is not None)
print(f"=== Category distribution (top 30) ===")
for cat, n in cat_counter.most_common(30):
    print(f"  {n:>4}x  {cat}")
print()

# Save full audit
out = ROOT / "audit-output" / "wave-39-phase2a-parse.json"
out.write_text(
    json.dumps(
        [{"slug": s, "brand": b, "category": c} for s, b, c in results],
        indent=2,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)

# Sample what the new title would be
PRIMARY = {
    "pillar": "{brand} Appliance Repair Los Angeles — Same Day",
    "category": "{brand} {category} Repair Los Angeles — Same Day",
}
FALLBACK = {
    "pillar": "{brand} Appliance Repair LA — Same Day",
    "category": "{brand} {category} Repair LA — Same Day",
}

print(f"=== Sample new titles (first 25 — across pillars + combos) ===")
for s, b, c in results[:25]:
    if b is None:
        print(f"  ?? {s}")
        continue
    template_key = "pillar" if c is None else "category"
    primary = PRIMARY[template_key].format(brand=b, category=c)
    final = primary if len(primary) <= 60 else FALLBACK[template_key].format(brand=b, category=c)
    print(f"  [{len(final):>2}] {s:<45}  ->  {final}")

print()
print(f"=== Length distribution after templating (all 367) ===")
buckets: Counter = Counter()
over_60: list[tuple[str, str, int]] = []
for s, b, c in results:
    if b is None:
        buckets["parser_fail"] += 1
        continue
    template_key = "pillar" if c is None else "category"
    primary = PRIMARY[template_key].format(brand=b, category=c)
    final = primary if len(primary) <= 60 else FALLBACK[template_key].format(brand=b, category=c)
    L = len(final)
    if L <= 50: buckets["<=50"] += 1
    elif L <= 60: buckets["51-60"] += 1
    elif L <= 70: buckets["61-70"] += 1
    else: buckets[">70"] += 1
    if L > 60:
        over_60.append((s, final, L))

for k in ("<=50", "51-60", "61-70", ">70", "parser_fail"):
    print(f"  {k}: {buckets[k]}")

if over_60:
    print(f"\n=== Files still >60 after fallback ({len(over_60)}) ===")
    for s, t, L in sorted(over_60, key=lambda x: -x[2])[:30]:
        print(f"  [{L}] {s}  ->  {t}")
