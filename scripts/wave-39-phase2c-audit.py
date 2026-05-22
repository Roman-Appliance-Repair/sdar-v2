"""Wave 39 Phase 2C — audit + classify services/ + outdoor/ pages.

Page types:
  - main_hub: services/index.astro, outdoor/index.astro (skip)
  - service_hub: services/{slug}-repair.astro
  - service_subservice: services/{slug}-repair/{problem}.astro
  - outdoor_hub: outdoor/{slug}-repair.astro (no city suffix)
  - outdoor_city: outdoor/{slug}-repair-{city}.astro
                  OR outdoor/{equip}-{city}.astro (wine-cellar-repair-X)
  - outdoor_brand: outdoor/brands/{brand}.astro
                   OR outdoor/{equip}-repair/brands/{brand}.astro
  - outdoor_subservice: outdoor/{equip}-repair/{problem}.astro
  - outdoor_misc: outdoor/{slug}-maintenance.astro and similar
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent.parent

SERVICE_DISPLAY = {
    "refrigerator": "Refrigerator",
    "built-in-refrigerator": "Built-In Refrigerator",
    "freezer": "Freezer",
    "washer": "Washer",
    "dryer": "Dryer",
    "stackable-washer-dryer": "Stackable Washer/Dryer",
    "laundry": "Laundry",
    "oven": "Oven",
    "wall-oven": "Wall Oven",
    "range": "Range",
    "stove": "Stove",
    "cooktop": "Cooktop",
    "induction-cooktop": "Induction Cooktop",
    "dishwasher": "Dishwasher",
    "microwave": "Microwave",
    "range-hood": "Range Hood",
    "garbage-disposal": "Garbage Disposal",
    "trash-compactor": "Trash Compactor",
    "wine-cooler": "Wine Cooler",
    "wine-cellar": "Wine Cellar",
    "wine-cellar-cooling": "Wine Cellar Cooling",
    "ice-maker": "Ice Maker",
    "fireplace": "Fireplace",
    "dryer-vent": "Dryer Vent",
    "bbq-grill": "BBQ Grill",
    "outdoor-refrigerator": "Outdoor Refrigerator",
    "pizza-oven": "Pizza Oven",
}

PROBLEM_DISPLAY = {
    "not-draining": "Not Draining",
    "not-heating": "Not Heating",
    "not-cooling": "Not Cooling",
    "not-cleaning": "Not Cleaning",
    "not-spinning": "Not Spinning",
    "not-tumbling": "Not Tumbling",
    "not-starting": "Not Starting",
    "not-working": "Not Working",
    "not-compacting": "Not Compacting",
    "not-venting": "Not Venting",
    "not-igniting": "Not Igniting",
    "no-power": "No Power",
    "wont-start": "Won't Start",
    "wont-spin": "Won't Spin",
    "wont-stay-lit": "Won't Stay Lit",
    "leaking": "Leaking",
    "leaking-water": "Leaking Water",
    "error-codes": "Error Codes",
    "takes-too-long": "Takes Too Long",
    "burner-not-igniting": "Burner Not Igniting",
    "electric-element-failure": "Element Failure",
    "induction-not-working": "Induction Not Working",
    "surface-cracked": "Surface Cracked",
    "self-clean-problems": "Self-Clean Problems",
    "temperature-off": "Temperature Off",
    "temperature-fluctuating": "Temperature Fluctuating",
    "temperature-uneven": "Uneven Temperature",
    "control-board-failure": "Control Board Failure",
    "double-oven-issues": "Double Oven Issues",
    "door-issues": "Door Issues",
    "door-seal-issues": "Door Seal Issues",
    "freezer-side-issues": "Freezer Side Issues",
    "ice-maker-issues": "Ice Maker Issues",
    "water-dispenser-issues": "Water Dispenser Issues",
    "fan-noise": "Fan Noise",
    "filter-issues": "Filter Issues",
    "light-not-working": "Light Not Working",
    "plate-not-rotating": "Plate Not Rotating",
    "sparking-arcing": "Sparking / Arcing",
    "jammed": "Jammed",
    "cleaning-needed": "Cleaning",
    "code-compliance": "Code Compliance",
    "fire-safety": "Fire Safety",
    "remote-control": "Remote Control",
    "wood-to-gas-conversion": "Wood-to-Gas Conversion",
    "regulator-issues": "Regulator Issues",
    "electrical-issues": "Electrical Issues",
    "flame-out": "Flame Out",
    "restaurant-patio": "Restaurant Patio",
    "wall-mounted": "Wall-Mounted",
}

OUTDOOR_EQUIPMENT = {
    "grill": "Outdoor Grill",
    "bbq-grill": "BBQ Grill",
    "kitchen": "Outdoor Kitchen",
    "patio-heater": "Patio Heater",
    "fireplace": "Outdoor Fireplace",
    "fire-pit": "Fire Pit",
    "pizza-oven": "Pizza Oven",
    "wine-cellar": "Wine Cellar",
    "outdoor-refrigerator": "Outdoor Refrigerator",
    "smoker": "Smoker",
    "kegerator": "Kegerator",
    "ice-maker": "Outdoor Ice Maker",
}

OUTDOOR_BRAND = {
    # Standalone brand pillars (outdoor/brands/X.astro)
    "lynx": "Lynx",
    "fire-magic": "Fire Magic",
    "twin-eagles": "Twin Eagles",
    "dcs": "DCS",
    "kalamazoo": "Kalamazoo",
    "alfresco": "Alfresco",
    "wolf": "Wolf",
    "wolf-outdoor": "Wolf Outdoor",
    "hestan": "Hestan",
    "blaze": "Blaze",
    "bull": "Bull",
    "capital": "Capital",
    "memphis": "Memphis",
    # Patio-heater brands
    "aei": "AEI",
    "sunpak": "Sunpak",
    "infratech": "Infratech",
    "bromic": "Bromic",
    "schwank": "Schwank",
    "solaira": "Solaira",
    # Pizza oven
    "ooni": "Ooni",
    # Smoker
    "big-green-egg": "Big Green Egg",
    "kamado-joe": "Kamado Joe",
    "primo": "Primo",
    "traeger": "Traeger",
}

# 89 cities — load from cities.ts directly
CITY_DISPLAY = {
    "agoura-hills": "Agoura Hills", "alhambra": "Alhambra", "anaheim": "Anaheim",
    "arcadia": "Arcadia", "atwater-village": "Atwater Village",
    "bel-air": "Bel Air", "beverly-hills": "Beverly Hills",
    "brentwood": "Brentwood", "burbank": "Burbank",
    "calabasas": "Calabasas", "camarillo": "Camarillo",
    "chino-hills": "Chino Hills", "corona": "Corona",
    "costa-mesa": "Costa Mesa", "culver-city": "Culver City",
    "dana-point": "Dana Point", "eagle-rock": "Eagle Rock",
    "el-segundo": "El Segundo", "encino": "Encino",
    "fontana": "Fontana", "fullerton": "Fullerton",
    "glassell-park": "Glassell Park", "glendale": "Glendale",
    "hancock-park": "Hancock Park", "hermosa-beach": "Hermosa Beach",
    "highland-park": "Highland Park", "hollywood": "Hollywood",
    "huntington-beach": "Huntington Beach",
    "irvine": "Irvine", "koreatown": "Koreatown",
    "la-canada-flintridge": "La Cañada Flintridge",
    "laguna-beach": "Laguna Beach", "lake-elsinore": "Lake Elsinore",
    "loma-linda": "Loma Linda", "long-beach": "Long Beach",
    "los-angeles": "Los Angeles",
    "malibu": "Malibu", "manhattan-beach": "Manhattan Beach",
    "marina-del-rey": "Marina del Rey", "mid-wilshire": "Mid-Wilshire",
    "monrovia": "Monrovia", "monterey-park": "Monterey Park",
    "moorpark": "Moorpark", "moreno-valley": "Moreno Valley",
    "murrieta": "Murrieta", "newbury-park": "Newbury Park",
    "newport-beach": "Newport Beach", "north-hollywood": "North Hollywood",
    "northridge": "Northridge", "oak-park": "Oak Park",
    "ontario": "Ontario", "orange": "Orange",
    "oxnard": "Oxnard", "pacific-palisades": "Pacific Palisades",
    "pasadena": "Pasadena", "playa-vista": "Playa Vista",
    "rancho-cucamonga": "Rancho Cucamonga", "rancho-mirage": "Rancho Mirage",
    "redondo-beach": "Redondo Beach", "rialto": "Rialto",
    "riverside": "Riverside", "san-clemente": "San Clemente",
    "san-gabriel": "San Gabriel", "san-marino": "San Marino",
    "santa-ana": "Santa Ana", "santa-monica": "Santa Monica",
    "seal-beach": "Seal Beach", "sherman-oaks": "Sherman Oaks",
    "silver-lake": "Silver Lake", "simi-valley": "Simi Valley",
    "south-pasadena": "South Pasadena", "studio-city": "Studio City",
    "tarzana": "Tarzana", "temecula": "Temecula",
    "temple-city": "Temple City", "thousand-oaks": "Thousand Oaks",
    "torrance": "Torrance", "tustin": "Tustin",
    "upland": "Upland", "ventura": "Ventura",
    "walnut": "Walnut", "west-hollywood": "West Hollywood",
    "westlake-village": "Westlake Village",
    "westwood": "Westwood", "whittier": "Whittier",
    "woodland-hills": "Woodland Hills", "yorba-linda": "Yorba Linda",
}

TITLE_PATTERNS = [
    re.compile(r"<title>([^<]+)</title>"),
    re.compile(r"^title:\s*[\"']([^\"'\n]+)[\"']", re.MULTILINE),
    re.compile(r'const\s+title\s*=\s*"((?:[^"\\\n]|\\.)+)"'),
    re.compile(r"const\s+title\s*=\s*'((?:[^'\\\n]|\\.)+)'"),
    re.compile(r"const\s+title\s*=\s*`((?:[^`\\\n]|\\.)+)`"),
]


def fit(t: str, fallbacks: list) -> str:
    if len(t) <= 60:
        return t
    for f in fallbacks:
        if len(f) <= 60:
            return f
    return fallbacks[-1] if fallbacks else t


def classify_service(rel_parts: list[str]) -> tuple[str, str | None]:
    """rel_parts is everything under src/pages/services/, e.g. ['refrigerator-repair', 'leaking.astro']"""
    if rel_parts == ["index.astro"]:
        return ("main_hub", None)

    # Service hub: X-repair.astro
    if len(rel_parts) == 1 and rel_parts[0].endswith("-repair.astro"):
        slug = rel_parts[0].replace("-repair.astro", "")
        svc = SERVICE_DISPLAY.get(slug)
        if not svc:
            return ("service_hub_unknown", None)
        primary = f"{svc} Repair Los Angeles — Same Day"
        fallback = f"{svc} Repair LA — Same Day"
        return ("service_hub", fit(primary, [fallback]))

    # Service sub-service: X-repair/Y.astro
    if len(rel_parts) == 2 and rel_parts[0].endswith("-repair"):
        svc_slug = rel_parts[0].replace("-repair", "")
        prob_slug = rel_parts[1].replace(".astro", "")
        svc = SERVICE_DISPLAY.get(svc_slug)
        prob = PROBLEM_DISPLAY.get(prob_slug)
        if not svc or not prob:
            return ("service_subservice_unknown", None)
        # Template per spec: "{Service} {Problem} Repair LA — Same Day"
        primary = f"{svc} {prob} Repair LA — Same Day"
        # Fallback: drop "Repair" word if too long
        fallback1 = f"{svc} {prob} LA — Same Day"
        return ("service_subservice", fit(primary, [fallback1]))

    return ("service_unclassified", None)


def classify_outdoor(rel_parts: list[str]) -> tuple[str, str | None]:
    if rel_parts == ["index.astro"]:
        return ("main_hub", None)

    # outdoor/brands/X.astro
    if len(rel_parts) == 2 and rel_parts[0] == "brands":
        brand_slug = rel_parts[1].replace(".astro", "")
        brand = OUTDOOR_BRAND.get(brand_slug)
        if not brand:
            return ("outdoor_brand_unknown", None)
        primary = f"{brand} Outdoor Grill Repair Los Angeles — Same Day"
        fallback = f"{brand} Outdoor Grill Repair LA — Same Day"
        return ("outdoor_brand_pillar", fit(primary, [fallback]))

    # outdoor/X-repair/brands/Y.astro
    if len(rel_parts) == 3 and rel_parts[1] == "brands":
        equip_slug = rel_parts[0].replace("-repair", "")
        brand_slug = rel_parts[2].replace(".astro", "")
        equip = OUTDOOR_EQUIPMENT.get(equip_slug)
        brand = OUTDOOR_BRAND.get(brand_slug)
        if not equip or not brand:
            return ("outdoor_brand_subunknown", None)
        primary = f"{brand} {equip} Repair Los Angeles — Same Day"
        fallback = f"{brand} {equip} Repair LA — Same Day"
        return ("outdoor_brand_sub", fit(primary, [fallback]))

    # outdoor/X-repair/Y.astro (failure mode under outdoor equipment)
    if len(rel_parts) == 2 and rel_parts[0].endswith("-repair") and rel_parts[1] != "brands":
        equip_slug = rel_parts[0].replace("-repair", "")
        prob_slug = rel_parts[1].replace(".astro", "")
        equip = OUTDOOR_EQUIPMENT.get(equip_slug)
        prob = PROBLEM_DISPLAY.get(prob_slug)
        if not equip or not prob:
            return ("outdoor_subservice_unknown", None)
        primary = f"{equip} {prob} Repair LA — Same Day"
        fallback1 = f"{equip} {prob} LA — Same Day"
        return ("outdoor_subservice", fit(primary, [fallback1]))

    # Top-level outdoor pages
    if len(rel_parts) == 1:
        slug = rel_parts[0].replace(".astro", "")
        # Maintenance pages
        if slug.endswith("-maintenance"):
            equip_slug = slug.replace("-maintenance", "")
            equip = OUTDOOR_EQUIPMENT.get(equip_slug)
            if not equip:
                return ("outdoor_misc_unknown", None)
            primary = f"{equip} Maintenance Los Angeles — Same Day"
            fallback = f"{equip} Maintenance LA — Same Day"
            return ("outdoor_misc", fit(primary, [fallback]))

        # Outdoor city-targeted: X-repair-{city} OR {equip}-repair-{city}
        # Try matching city suffix
        for city_slug, city_display in CITY_DISPLAY.items():
            suffix = "-" + city_slug
            if slug.endswith(suffix):
                base = slug[:-len(suffix)]
                # base is e.g. "grill-repair", "kitchen-repair", "wine-cellar-repair"
                if base.endswith("-repair"):
                    equip_slug = base[:-len("-repair")]
                else:
                    equip_slug = base
                equip = OUTDOOR_EQUIPMENT.get(equip_slug)
                if not equip:
                    return ("outdoor_city_unknown", None)
                # Template per spec: "{Equipment} Repair {City} — Same Day"
                primary = f"{equip} Repair {city_display} — Same Day"
                # No fallback "LA" since city already provides geo
                fallback = f"{equip} Repair {city_display}"
                return ("outdoor_city", fit(primary, [fallback]))

        # Outdoor hub: X-repair.astro (no city suffix)
        if slug.endswith("-repair"):
            equip_slug = slug[:-len("-repair")]
            equip = OUTDOOR_EQUIPMENT.get(equip_slug)
            if not equip:
                return ("outdoor_hub_unknown", None)
            primary = f"{equip} Repair Los Angeles — Same Day"
            fallback = f"{equip} Repair LA — Same Day"
            return ("outdoor_hub", fit(primary, [fallback]))

    return ("outdoor_unclassified", None)


# Run audit
type_counter: Counter = Counter()
results: list[dict] = []

for area, dir_name in [("services", "services"), ("outdoor", "outdoor")]:
    src_dir = ROOT / "src" / "pages" / dir_name
    for path in sorted(src_dir.rglob("*.astro")):
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        # rel_parts under src/pages/{area}/
        parts = rel.split("/")[3:]  # everything under area
        text = path.read_text(encoding="utf-8")

        current_title = None
        for pat in TITLE_PATTERNS:
            m = pat.search(text)
            if m:
                current_title = m.group(1).strip()
                break

        if area == "services":
            ptype, target = classify_service(parts)
        else:
            ptype, target = classify_outdoor(parts)

        type_counter[ptype] += 1
        results.append({
            "file": rel,
            "area": area,
            "current": current_title or "",
            "type": ptype,
            "target": target,
        })

print(f"=== Wave 39 Phase 2C audit ===")
print(f"Total .astro files: {len(results)}")
print()
print("=== Page type distribution ===")
for t, n in type_counter.most_common():
    print(f"  {t}: {n}")
print()

# Length stats
buckets: Counter = Counter()
over_60 = []
for r in results:
    if r["target"] is None:
        buckets["no_target"] += 1
        continue
    L = len(r["target"])
    if L <= 50: buckets["<=50"] += 1
    elif L <= 60: buckets["51-60"] += 1
    elif L <= 70: buckets["61-70"] += 1
    else: buckets[">70"] += 1
    if L > 60:
        over_60.append(r)

print("=== Target length distribution ===")
for k in ("<=50", "51-60", "61-70", ">70", "no_target"):
    print(f"  {k}: {buckets[k]}")
if over_60:
    print(f"\n=== Targets still >60 ({len(over_60)}) ===")
    for r in sorted(over_60, key=lambda x: -len(x["target"]))[:20]:
        print(f"  [{len(r['target'])}] {r['file']}")
        print(f"        {r['target']}")

# Unknowns
unknowns = [r for r in results if r["target"] is None and r["type"] != "main_hub"]
if unknowns:
    print(f"\n=== Unknowns / no-target ({len(unknowns)}) ===")
    for r in unknowns:
        print(f"  [{r['type']}] {r['file']}")
        print(f"        cur: {r['current'][:80]}")

# Sample
print(f"\n=== Sample target titles (first 25) ===")
for r in results[:25]:
    if r["target"] is None:
        print(f"  ?? [{r['type']}] {r['file']}")
        continue
    print(f"  [{len(r['target']):>2}] {r['type']:<22} {Path(r['file']).name[:35]:<37}")
    print(f"        {r['target']}")

# Save
out = ROOT / "audit-output" / "wave-39-phase2c-classify.json"
out.write_text(
    json.dumps(results, indent=2, ensure_ascii=False),
    encoding="utf-8",
)
