"""Wave 39 Phase 2D — final title sweep.

Three operations:
  1. City pillar sweep — `Appliance Repair {City} CA — Same Day Service`
  2. County hub sweep — `Appliance Repair {County} County CA — Same Day`
  3. Misc per-file rewrites for credentials/, price-list/, for-business/,
     and special pages (homepage, contact, book, privacy-policy, terms,
     hub indexes for services/outdoor/brands/commercial-exhaust-hood).

Note: parametric `[city]/[service].astro` template was fixed separately
(single-line edit affecting ~200 pages).

Skip rule: existing title <=60 AND != target → preserve.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent

# --- Build CITY_DISPLAY from src/data/cities.ts ---
cities_ts = (ROOT / "src" / "data" / "cities.ts").read_text(encoding="utf-8")
CITY_DISPLAY: dict[str, str] = {}
for m in re.finditer(
    r"slug:\s*['\"]([^'\"]+)['\"][^}]*?name:\s*['\"]([^'\"]+)['\"]",
    cities_ts,
):
    CITY_DISPLAY[m.group(1)] = m.group(2)

(ROOT / "audit-output" / "city-display-map.json").write_text(
    json.dumps(CITY_DISPLAY, indent=2, ensure_ascii=False), encoding="utf-8"
)

# --- County display map ---
COUNTY_DISPLAY = {
    "los-angeles-county": "Los Angeles County",
    "orange-county": "Orange County",
    "ventura-county": "Ventura County",
    "san-bernardino-county": "San Bernardino County",
    "riverside-county": "Riverside County",
}

# --- Misc per-file rewrites (path → new title) ---
MISC_REWRITES = {
    # Top-level special pages
    "src/pages/index.astro": "Same Day Appliance Repair Los Angeles — 8 Branches",
    "src/pages/contact.astro": "Contact Same Day Appliance Repair LA — 8 Branches",
    "src/pages/book.astro": "Book Appliance Repair Online — Same Day Service",
    "src/pages/privacy-policy.astro": "Privacy Policy — Same Day Appliance Repair",
    "src/pages/terms.astro": "Terms of Service — Same Day Appliance Repair",
    # Hub indexes
    "src/pages/services/index.astro": "Appliance Repair Services Los Angeles — Same Day",
    "src/pages/outdoor/index.astro": "Outdoor Appliance Repair Los Angeles — Same Day",
    "src/pages/brands/index.astro": "Appliance Brands We Repair — Los Angeles Same Day",
    "src/pages/commercial/exhaust-hood-repair.astro": "Commercial Exhaust Hood Repair LA — Same Day Service",
    # Credentials
    "src/pages/credentials/licensed.astro": "Licensed Appliance Repair LA — BHGS #A49573",
    "src/pages/credentials/insured.astro": "Insured Appliance Repair LA — Liability + WC",
    "src/pages/credentials/bbb-accredited.astro": "BBB Accredited — Same Day Appliance Repair LA",
    "src/pages/credentials/oem-parts.astro": "OEM Parts Appliance Repair LA — Same Day",
    "src/pages/credentials/background-checked.astro": "Background-Checked Technicians — Same Day LA",
    "src/pages/credentials/osha-certified.astro": "OSHA-Certified Appliance Repair LA — Same Day",
    # Price list
    "src/pages/price-list/index.astro": "Appliance Repair Cost Los Angeles 2026 — Pricing",
    "src/pages/price-list/outdoor-refrigerator-repair-cost.astro": "Outdoor Refrigerator Repair Cost LA — 2026 Pricing",
    "src/pages/price-list/dryer-vent-repair-cost.astro": "Dryer Vent Repair Cost Los Angeles — 2026 Pricing",
    "src/pages/price-list/patio-heater-repair-cost.astro": "Patio Heater Repair Cost LA — 2026 Pricing",
    "src/pages/price-list/stackable-washer-dryer-repair-cost.astro": "Stackable Washer-Dryer Repair Cost LA — 2026",
    "src/pages/price-list/commercial-showcase-refrigerator-repair-cost.astro": "Commercial Display Case Repair Cost LA — 2026",
    # For-business
    "src/pages/for-business/restaurants.astro": "Restaurant Appliance Repair LA — Same Day Service",
    "src/pages/for-business/retail-grocery.astro": "Grocery & Retail Appliance Repair LA — Same Day",
    "src/pages/for-business/hotels.astro": "Hotel Appliance Repair LA — Same Day Hospitality",
    "src/pages/for-business/airbnb-short-term-rentals.astro": "Airbnb Appliance Repair LA — Same Day Service",
    "src/pages/for-business/bars-nightclubs.astro": "Bar & Nightclub Appliance Repair LA — Same Day",
}

TITLE_CONTEXTS = [
    (re.compile(r"(<title>)([^<\n]+)(</title>)"), "html_title"),
    (re.compile(r'(^title:\s*")((?:[^"\\\n]|\\.)+)(")', re.MULTILINE), "frontmatter_dq"),
    (re.compile(r"(^title:\s*')((?:[^'\\\n]|\\.)+)(')", re.MULTILINE), "frontmatter_sq"),
    (re.compile(r'(const\s+title\s*=\s*")((?:[^"\\\n]|\\.)+)(")'), "const_dq"),
    (re.compile(r"(const\s+title\s*=\s*')((?:[^'\\\n]|\\.)+)(')"), "const_sq"),
    (re.compile(r"(const\s+title\s*=\s*`)((?:[^`\\\n]|\\.)+)(`)"), "const_bt"),
]

# Top-level slugs to skip when iterating city pillars
SKIP_TOP_LEVEL = {
    "index", "book", "contact", "privacy-policy", "terms", "about",
    "404", "sitemap", "search", "ai-diagnostic",
}


def apply_title(path: Path, target: str) -> tuple[str, str | None]:
    """Apply title to file, returning (status, current_title or None)."""
    text = path.read_text(encoding="utf-8")
    current_raw = None
    for pat, _ in TITLE_CONTEXTS:
        m = pat.search(text)
        if m:
            current_raw = m.group(2).strip()
            break
    if current_raw is None:
        return ("no_title", None)
    current = re.sub(r"\\(.)", r"\1", current_raw)
    if len(current) <= 60 and current != target:
        return ("preserved", current)
    if current == target:
        return ("noop", current)
    original = text
    for pat, _ in TITLE_CONTEXTS:
        def replace(m, _new=target):
            return m.group(1) + _new + m.group(3)
        text = pat.sub(replace, text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return ("changed", current)
    return ("nothing_matched", current)


changed: list[tuple[str, str, str]] = []
preserved: list[tuple[str, str, str]] = []
no_titles: list[str] = []
not_in_cities: list[str] = []

# 1. City pillars
for path in sorted((ROOT / "src" / "pages").glob("*.astro")):
    slug = path.stem
    if slug in SKIP_TOP_LEVEL:
        continue
    if slug in COUNTY_DISPLAY:
        # Will handle below
        continue
    city_name = CITY_DISPLAY.get(slug)
    if not city_name:
        not_in_cities.append(slug)
        continue
    target = f"Appliance Repair {city_name} CA — Same Day Service"
    if len(target) > 60:
        target = f"Appliance Repair {city_name} CA — Same Day"
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    status, current = apply_title(path, target)
    if status == "changed":
        changed.append((rel, current, target))
    elif status == "preserved":
        preserved.append((rel, current, target))
    elif status == "no_title":
        no_titles.append(rel)

# 2. County hubs
for slug, name in COUNTY_DISPLAY.items():
    path = ROOT / "src" / "pages" / f"{slug}.astro"
    if not path.exists():
        continue
    target = f"Appliance Repair {name} CA — Same Day"
    if len(target) > 60:
        target = f"Appliance Repair {name} — Same Day"
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    status, current = apply_title(path, target)
    if status == "changed":
        changed.append((rel, current, target))
    elif status == "preserved":
        preserved.append((rel, current, target))

# 3. Misc per-file rewrites
for rel, target in MISC_REWRITES.items():
    path = ROOT / rel
    if not path.exists():
        no_titles.append(f"{rel} (file missing)")
        continue
    status, current = apply_title(path, target)
    if status == "changed":
        changed.append((rel, current, target))
    elif status == "preserved":
        preserved.append((rel, current, target))
    elif status == "no_title":
        no_titles.append(rel)

print(f"=== Wave 39 Phase 2D sweep complete ===")
print(f"Files changed: {len(changed)}")
print(f"Files preserved (custom <=60): {len(preserved)}")
print(f"Files with no title: {len(no_titles)}")
print(f"Top-level slugs not matching any category: {len(not_in_cities)}")
print()
if not_in_cities:
    print("=== Top-level slugs not classified ===")
    for s in not_in_cities:
        print(f"  {s}")
print()
print(f"=== Sample changes (first 20) ===")
for rel, old, new in changed[:20]:
    name = Path(rel).name
    print(f"  {name}")
    print(f"    OLD [{len(old):>3}]: {old[:80]}")
    print(f"    NEW [{len(new):>2}]: {new}")
print()
if preserved:
    print(f"=== Preserved custom titles ({len(preserved)}) ===")
    for rel, t, target in preserved:
        print(f"  [{len(t):>2}] {Path(rel).name:<40} {t[:60]}")
