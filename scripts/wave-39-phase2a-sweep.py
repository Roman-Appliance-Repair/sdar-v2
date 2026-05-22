"""Wave 39 Phase 2A — title rewrite sweep for src/pages/brands/.

Templates:
  - Pillar:  "{Brand} Appliance Repair Los Angeles — Same Day"
  - Combo:   "{Brand} {Category} Repair Los Angeles — Same Day"
  - Fallback (when primary > 60): replace "Los Angeles" -> "LA"

Skip rule: existing title <= 60 AND ≠ new_title → preserve (custom).
Only edits title contexts (<title>, frontmatter title:, const title=).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
BRANDS_DIR = ROOT / "src" / "pages" / "brands"

brand_map: dict[str, str] = json.loads(
    (ROOT / "audit-output" / "brand-display-map.json").read_text(encoding="utf-8")
)

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

PRIMARY_PILLAR = "{brand} Appliance Repair Los Angeles — Same Day"
PRIMARY_COMBO = "{brand} {category} Repair Los Angeles — Same Day"
FALLBACK_PILLAR = "{brand} Appliance Repair LA — Same Day"
FALLBACK_COMBO = "{brand} {category} Repair LA — Same Day"

# Patterns that handle escaped quotes (e.g. `Sofia, Accento 24\""` in title strings).
# (?:[^"\\\n]|\\.)+ matches: any non-quote/non-backslash/non-newline OR backslash-anychar.
TITLE_CONTEXTS = [
    (re.compile(r"(<title>)([^<\n]+)(</title>)"), "html_title"),
    (re.compile(r'(^title:\s*")((?:[^"\\\n]|\\.)+)(")', re.MULTILINE), "frontmatter_dq"),
    (re.compile(r"(^title:\s*')((?:[^'\\\n]|\\.)+)(')", re.MULTILINE), "frontmatter_sq"),
    (re.compile(r'(const\s+title\s*=\s*")((?:[^"\\\n]|\\.)+)(")'), "const_dq"),
    (re.compile(r"(const\s+title\s*=\s*')((?:[^'\\\n]|\\.)+)(')"), "const_sq"),
    (re.compile(r"(const\s+title\s*=\s*`)((?:[^`\\\n]|\\.)+)(`)"), "const_bt"),
]


def parse_brand_category(slug: str) -> tuple[str | None, str | None]:
    if slug in brand_map:
        return (brand_map[slug], None)
    if not slug.endswith("-repair"):
        return (None, None)
    body = slug[:-len("-repair")]
    if body in brand_map:
        return (brand_map[body], None)
    for brand_slug in sorted(brand_map.keys(), key=lambda x: -len(x)):
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


def build_new_title(brand: str, category: str | None) -> str:
    if category is None:
        primary = PRIMARY_PILLAR.format(brand=brand)
        if len(primary) <= 60:
            return primary
        return FALLBACK_PILLAR.format(brand=brand)
    primary = PRIMARY_COMBO.format(brand=brand, category=category)
    if len(primary) <= 60:
        return primary
    return FALLBACK_COMBO.format(brand=brand, category=category)


changed: list[tuple[str, str, str]] = []  # (path, old, new)
preserved: list[tuple[str, str]] = []  # (path, current_title)
parser_fail: list[str] = []
no_title: list[str] = []

for path in sorted(BRANDS_DIR.glob("*.astro")):
    slug = path.stem
    if slug == "index":
        continue
    brand, category = parse_brand_category(slug)
    if brand is None:
        parser_fail.append(slug)
        continue
    new_title = build_new_title(brand, category)

    text = path.read_text(encoding="utf-8")
    original = text

    # Find current title (first context match)
    current_title_raw = None
    for pat, _ in TITLE_CONTEXTS:
        m = pat.search(text)
        if m:
            current_title_raw = m.group(2).strip()
            break
    if current_title_raw is None:
        no_title.append(slug)
        continue

    # Decode escape sequences for accurate length measurement
    # (e.g. `\"` source = 1 rendered char)
    current_title = re.sub(r"\\(.)", r"\1", current_title_raw)

    # Skip rule: preserve custom title (already <=60 AND != new_title)
    if len(current_title) <= 60 and current_title != new_title:
        preserved.append((str(path.relative_to(ROOT)), current_title))
        continue

    # Apply replacement across all contexts
    for pat, _ in TITLE_CONTEXTS:
        def replace(m, _new=new_title):
            return m.group(1) + _new + m.group(3)
        text = pat.sub(replace, text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append((str(path.relative_to(ROOT)), current_title, new_title))

print(f"=== Wave 39 Phase 2A sweep complete ===")
print(f"Files changed: {len(changed)}")
print(f"Files preserved (custom title <=60): {len(preserved)}")
print(f"Files with no extractable title: {len(no_title)}")
print(f"Parser failures: {len(parser_fail)}")
print()
print(f"=== Sample changes (first 30) ===")
for p, old, new in changed[:30]:
    print(f"  {Path(p).name}")
    print(f"    OLD [{len(old)}]: {old[:80]}")
    print(f"    NEW [{len(new)}]: {new}")

if preserved:
    print(f"\n=== Preserved custom titles (first 20 of {len(preserved)}) ===")
    for p, t in preserved[:20]:
        print(f"  [{len(t):>2}] {Path(p).name:<45} {t[:60]}")

if parser_fail:
    print(f"\n=== Parser failures (skipped) ===")
    for s in parser_fail:
        print(f"  {s}")
