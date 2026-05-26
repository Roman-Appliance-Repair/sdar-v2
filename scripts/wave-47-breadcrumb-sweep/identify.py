"""Wave 47 — identify brand combo pages needing breadcrumb injection.

DRY RUN ONLY. Does not modify any source files.

NOTE on isolation: earlier version imported Wave 39 sweep script via
spec.loader.exec_module, which executes the WHOLE module. Wave 39 has no
__main__ guard, so the import accidentally triggered the actual sweep
and modified 5 source files. To prevent recurrence, parse_brand_category
and CATEGORY_DISPLAY are inlined here as standalone copies. Wave 39
remains canonical; this is a frozen snapshot for Wave 47 use only.
"""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(r"C:\Users\Roman\WebstormProjects\sdar-v2")
BRANDS_DIR = ROOT / "src" / "pages" / "brands"
DISPLAY_MAP = ROOT / "audit-output" / "brand-display-map.json"
OUTPUT = ROOT / "audit-output" / "wave-47-candidates.json"

# Snapshot from scripts/wave-39-phase2a-sweep.py (do not modify here — Wave 39 owns it)
CATEGORY_DISPLAY = {
    "refrigerator": "Refrigerator", "freezer": "Freezer",
    "ice-maker": "Ice Maker", "wine-cooler": "Wine Cooler",
    "wine-cellar": "Wine Cellar", "washer": "Washer", "dryer": "Dryer",
    "laundry": "Laundry", "stack-washer-dryer": "Stack Washer & Dryer",
    "washer-dryer": "Washer & Dryer", "oven": "Oven", "wall-oven": "Wall Oven",
    "range": "Range", "range-hood": "Range Hood", "cooktop": "Cooktop",
    "stove": "Stove", "microwave": "Microwave", "dishwasher": "Dishwasher",
    "professional-dishwasher": "Professional Dishwasher",
    "trash-compactor": "Trash Compactor", "garbage-disposal": "Garbage Disposal",
    "coffee": "Coffee Machine", "stand-mixer": "Stand Mixer",
    "vent-hood": "Vent Hood", "hood": "Hood",
    "built-in-refrigerator": "Built-In Refrigerator",
    "outdoor-refrigerator": "Outdoor Refrigerator", "outdoor": "Outdoor",
    "bbq-grill": "BBQ Grill", "grill": "Grill", "pizza-oven": "Pizza Oven",
    "patio-heater": "Patio Heater", "fireplace": "Fireplace",
    "outdoor-kitchen": "Outdoor Kitchen", "ice-machine": "Ice Machine",
    "rotisserie": "Rotisserie", "fryer": "Fryer", "charbroiler": "Charbroiler",
    "steamer": "Steamer", "commercial": "Commercial",
    "commercial-dryer": "Commercial Dryer", "walk-in": "Walk-In",
    "walk-in-cooler": "Walk-In Cooler", "walk-in-freezer": "Walk-In Freezer",
    "condensing-unit": "Condensing Unit", "refrigeration": "Refrigeration",
    "draft-beer-system": "Draft Beer System",
    "beverage-dispenser": "Beverage Dispenser",
    "soft-serve": "Soft Serve Machine", "slushie-machine": "Slushie Machine",
    "convection-oven": "Convection Oven", "salamander": "Salamander Broiler",
    "tankless-water-heater": "Tankless Water Heater",
    "rapid-cook-oven": "Rapid Cook Oven",
    "stackable-washer-dryer": "Stackable Washer/Dryer",
    "commercial-laundry": "Commercial Laundry",
}

with open(DISPLAY_MAP, encoding="utf-8") as f:
    brand_map = json.load(f)

brand_slugs_sorted = sorted(brand_map.keys(), key=len, reverse=True)


def parse_brand_category(slug):
    """Snapshot from Wave 39 phase2a. Returns (brand_display, category_display)
    or (None, None) if unparseable. category_display is None for pillar-form slugs."""
    if slug in brand_map:
        return (brand_map[slug], None)
    if not slug.endswith("-repair"):
        return (None, None)
    body = slug[:-len("-repair")]
    if body in brand_map:
        return (brand_map[body], None)
    for brand_slug in brand_slugs_sorted:
        if brand_slug == slug or brand_slug == body:
            continue
        prefix = brand_slug + "-"
        if body.startswith(prefix):
            cat_slug = body[len(prefix):]
            cat_display = CATEGORY_DISPLAY.get(
                cat_slug, cat_slug.replace("-", " ").title()
            )
            return (brand_map[brand_slug], cat_display)
    return (None, None)


def derive_brand_slug(file_stem):
    """Longest matching brand prefix from brand_map keys, requiring 'slug-' boundary."""
    for bs in brand_slugs_sorted:
        if file_stem.startswith(bs + "-"):
            return bs
    return None


all_files = sorted(BRANDS_DIR.glob("*-repair.astro"))

candidates = []
skip_pillar_repair = []
skip_no_category = []
skip_brand_not_found = []
skip_already_linked = []
parse_fails = []

for f in all_files:
    slug = f.stem

    parts = slug.split("-")
    if len(parts) < 3:
        skip_pillar_repair.append(f.name)
        continue

    brand_slug = derive_brand_slug(slug)
    if brand_slug is None:
        skip_brand_not_found.append(f.name)
        continue

    pillar_href_simple = f'href="/brands/{brand_slug}/"'
    pillar_href_full = f'href="https://samedayappliance.repair/brands/{brand_slug}/"'

    try:
        content = f.read_text(encoding="utf-8")
    except Exception as e:
        parse_fails.append({"file": f.name, "error": str(e)})
        continue

    if pillar_href_simple in content or pillar_href_full in content:
        skip_already_linked.append(f.name)
        continue

    try:
        brand_display, category_display = parse_brand_category(slug)
    except Exception as e:
        parse_fails.append({"file": f.name, "error": str(e)})
        continue

    if not category_display:
        skip_no_category.append(f.name)
        continue

    candidates.append({
        "file": f.name,
        "slug": slug,
        "brand_slug": brand_slug,
        "brand_display": brand_display,
        "category_display": category_display,
    })

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(candidates, f, indent=2, ensure_ascii=False)

print("=" * 60)
print("WAVE 47 DRY RUN — Candidates for breadcrumb injection")
print("=" * 60)
print(f"Total combo files scanned:       {len(all_files)}")
print(f"Skip - pillar-style (<3 parts):  {len(skip_pillar_repair)}")
print(f"Skip - brand not in map:         {len(skip_brand_not_found)}")
print(f"Skip - no category:              {len(skip_no_category)}")
print(f"Skip - already linked:           {len(skip_already_linked)}")
print(f"Parse failures:                  {len(parse_fails)}")
print(f"CANDIDATES for sweep:            {len(candidates)}")
print()
print("First 15 candidates:")
for c in candidates[:15]:
    print(f"  {c['file']:55s} -> /brands/{c['brand_slug']}/  brand='{c['brand_display']}' cat='{c['category_display']}'")

if parse_fails:
    print()
    print(f"!!! PARSE FAILS ({len(parse_fails)}) !!!")
    for pf in parse_fails:
        print(f"  {pf['file']}: {pf['error']}")

if skip_brand_not_found:
    print()
    print(f"!!! UNRECOGNIZED BRAND SLUGS ({len(skip_brand_not_found)}) !!!")
    for n in skip_brand_not_found[:30]:
        print(f"  {n}")
    if len(skip_brand_not_found) > 30:
        print(f"  ... +{len(skip_brand_not_found)-30} more")

if skip_no_category:
    print()
    print(f"No-category skips ({len(skip_no_category)} files — pillar disguised as brand-X-repair):")
    for n in skip_no_category:
        print(f"  {n}")

if skip_already_linked:
    print()
    print(f"Already-linked sample (first 10 of {len(skip_already_linked)} total):")
    for n in skip_already_linked[:10]:
        print(f"  {n}")

print()
print("Candidates by brand_slug:")
by_brand = Counter(c['brand_slug'] for c in candidates)
for brand, count in sorted(by_brand.items(), key=lambda x: (-x[1], x[0])):
    print(f"  {brand:35s} {count}")
